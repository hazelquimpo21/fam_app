'use client';

/**
 * ============================================================================
 * ✨ Someday Items Hooks
 * ============================================================================
 *
 * React Query hooks for someday item operations:
 * - Fetching someday items (with filters)
 * - Creating someday items
 * - Updating someday items
 * - Promoting to projects
 * - Archiving/deleting items
 *
 * Someday items are dreams and wishes for the future - things to consider
 * "someday" but not committed to yet.
 *
 * ============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { queryKeys, type SomedayFilters } from '@/lib/query-keys';
import { logger } from '@/lib/utils/logger';
import type { SomedayItem, SomedayCategory } from '@/types/database';

// ============================================================================
// 📖 QUERY HOOKS (Read operations)
// ============================================================================

/**
 * Fetch all someday items with optional filters
 *
 * @param filters - Optional filters for category, archived status, or added by
 * @returns Query result with someday items array
 *
 * @example
 * const { data: items, isLoading } = useSomedayItems({ category: 'trip' })
 */
export function useSomedayItems(filters: SomedayFilters = {}) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.someday.list(filters),
    queryFn: async (): Promise<SomedayItem[]> => {
      logger.info('✨ Fetching someday items...', { filters });

      let query = supabase
        .from('someday_items')
        .select(`
          *,
          added_by:family_members!added_by_id(id, name, color, avatar_url),
          promoted_to_project:projects!promoted_to_project_id(id, title)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.isArchived !== undefined) {
        query = query.eq('is_archived', filters.isArchived);
      }
      if (filters.addedById) {
        query = query.eq('added_by_id', filters.addedById);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('❌ Failed to fetch someday items', { error: error.message });
        throw error;
      }

      logger.success(`✅ Fetched ${data?.length || 0} someday items`);
      return data as SomedayItem[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch active (non-archived) someday items
 * Convenience hook for commonly needed active items
 */
export function useActiveSomedayItems() {
  return useSomedayItems({ isArchived: false });
}

/**
 * Fetch a single someday item by ID
 *
 * @param id - Someday item UUID
 * @returns Query result with someday item object
 */
export function useSomedayItem(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.someday.detail(id),
    queryFn: async (): Promise<SomedayItem> => {
      logger.info('✨ Fetching someday item...', { id });

      const { data, error } = await supabase
        .from('someday_items')
        .select(`
          *,
          added_by:family_members!added_by_id(id, name, color, avatar_url)
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        logger.error('❌ Failed to fetch someday item', { error: error.message });
        throw error;
      }

      logger.success('✅ Someday item loaded', { title: data?.title });
      return data as SomedayItem;
    },
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minute
  });
}

// ============================================================================
// ✏️ MUTATION HOOKS (Write operations)
// ============================================================================

/**
 * Input type for creating a someday item
 */
export interface CreateSomedayInput {
  title: string;
  description?: string;
  category?: SomedayCategory;
  estimated_cost?: number;
  place_id?: string;
  added_by_id?: string;
}

/**
 * Create a new someday item
 *
 * @example
 * const createItem = useCreateSomedayItem()
 * createItem.mutate({
 *   title: 'Japan trip',
 *   category: 'trip',
 *   description: 'Cherry blossom season in April'
 * })
 */
export function useCreateSomedayItem() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: CreateSomedayInput) => {
      logger.info('➕ Creating someday item...', { title: input.title });

      const { data, error } = await supabase
        .from('someday_items')
        .insert({
          ...input,
          category: input.category || 'other',
          is_archived: false,
        })
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to create someday item', { error: error.message });
        throw error;
      }

      logger.success('✅ Someday item created!', { title: data?.title });
      return data as SomedayItem;
    },

    onSuccess: () => {
      // Invalidate someday queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.someday.all });
      toast.success('✨ Dream added!');
    },

    onError: (error) => {
      toast.error('Failed to add dream. Please try again.');
      logger.error('Create someday item error', { error });
    },
  });
}

/**
 * Update an existing someday item
 */
export function useUpdateSomedayItem() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SomedayItem> & { id: string }) => {
      logger.info('📝 Updating someday item...', { id });

      const { data, error } = await supabase
        .from('someday_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to update someday item', { error: error.message });
        throw error;
      }

      logger.success('✅ Someday item updated!');
      return data as SomedayItem;
    },

    onSuccess: (data) => {
      // Update the cache with new data
      queryClient.setQueryData(queryKeys.someday.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.someday.all });
    },

    onError: () => {
      toast.error('Failed to update dream');
    },
  });
}

/**
 * Archive a someday item
 */
export function useArchiveSomedayItem() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      logger.info('📦 Archiving someday item...', { itemId });

      const { data, error } = await supabase
        .from('someday_items')
        .update({
          is_archived: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to archive someday item', { error: error.message });
        throw error;
      }

      logger.success('✅ Someday item archived');
      return data as SomedayItem;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.someday.all });
      toast('Dream archived');
    },

    onError: () => {
      toast.error('Failed to archive dream');
    },
  });
}

/**
 * Delete a someday item (soft delete)
 */
export function useDeleteSomedayItem() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      logger.info('🗑️ Deleting someday item...', { itemId });

      const { error } = await supabase
        .from('someday_items')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', itemId);

      if (error) {
        logger.error('❌ Failed to delete someday item', { error: error.message });
        throw error;
      }

      logger.success('✅ Someday item deleted');
      return itemId;
    },

    // Optimistic update
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.someday.all });

      const previousData = queryClient.getQueryData(queryKeys.someday.list({}));

      queryClient.setQueriesData(
        { queryKey: queryKeys.someday.all },
        (old: SomedayItem[] | undefined) => old?.filter((item) => item.id !== itemId)
      );

      return { previousData };
    },

    onError: (_err, _itemId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.someday.list({}), context.previousData);
      }
      toast.error('Failed to delete dream');
    },

    onSuccess: () => {
      toast('Dream deleted');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.someday.all });
    },
  });
}
