'use client';

/**
 * ============================================================================
 * 🎯 Goals Hooks
 * ============================================================================
 *
 * React Query hooks for goal operations:
 * - Fetching goals (with filters)
 * - Creating goals
 * - Updating goals
 * - Updating goal progress
 * - Completing/abandoning goals
 *
 * Goals represent outcomes to work toward - either qualitative (done/not done)
 * or quantitative (measurable with target values).
 *
 * ============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { queryKeys, type GoalFilters } from '@/lib/query-keys';
import { logger } from '@/lib/utils/logger';
import type { Goal, GoalStatus, GoalType } from '@/types/database';

// ============================================================================
// 📖 QUERY HOOKS (Read operations)
// ============================================================================

/**
 * Fetch all goals with optional filters
 *
 * @param filters - Optional filters for status, owner, or family goals
 * @returns Query result with goals array
 *
 * @example
 * const { data: goals, isLoading } = useGoals({ status: 'active' })
 * const { data: familyGoals } = useGoals({ isFamilyGoal: true })
 */
export function useGoals(filters: GoalFilters = {}) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.goals.list(filters),
    queryFn: async (): Promise<Goal[]> => {
      logger.info('🎯 Fetching goals...', { filters });

      let query = supabase
        .from('goals')
        .select(`
          *,
          owner:family_members!owner_id(id, name, color, avatar_url)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.ownerId) {
        query = query.eq('owner_id', filters.ownerId);
      }
      if (filters.isFamilyGoal !== undefined) {
        query = query.eq('is_family_goal', filters.isFamilyGoal);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('❌ Failed to fetch goals', { error: error.message });
        throw error;
      }

      logger.success(`✅ Fetched ${data?.length || 0} goals`);
      return data as Goal[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch active goals only
 * Convenience hook for commonly needed active goals
 */
export function useActiveGoals() {
  return useGoals({ status: 'active' });
}

/**
 * Fetch a single goal by ID
 *
 * @param id - Goal UUID
 * @returns Query result with goal object
 */
export function useGoal(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.goals.detail(id),
    queryFn: async (): Promise<Goal> => {
      logger.info('🎯 Fetching goal...', { id });

      const { data, error } = await supabase
        .from('goals')
        .select(`
          *,
          owner:family_members!owner_id(id, name, color, avatar_url)
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        logger.error('❌ Failed to fetch goal', { error: error.message });
        throw error;
      }

      logger.success('✅ Goal loaded', { title: data?.title });
      return data as Goal;
    },
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minute
  });
}

// ============================================================================
// ✏️ MUTATION HOOKS (Write operations)
// ============================================================================

/**
 * Input type for creating a goal
 */
export interface CreateGoalInput {
  title: string;
  description?: string;
  definition_of_done?: string;
  owner_id?: string;
  is_family_goal?: boolean;
  goal_type?: GoalType;
  target_value?: number;
  unit?: string;
  target_date?: string;
  tags?: string[];
}

/**
 * Create a new goal
 *
 * @example
 * const createGoal = useCreateGoal()
 * createGoal.mutate({
 *   title: 'Read 50 books',
 *   goal_type: 'quantitative',
 *   target_value: 50,
 *   unit: 'books'
 * })
 */
export function useCreateGoal() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      logger.info('➕ Creating goal...', { title: input.title });

      const { data, error } = await supabase
        .from('goals')
        .insert({
          ...input,
          status: 'active',
          current_value: 0,
        })
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to create goal', { error: error.message });
        throw error;
      }

      logger.success('✅ Goal created!', { title: data?.title });
      return data as Goal;
    },

    onSuccess: () => {
      // Invalidate goal queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      toast.success('🎯 Goal created!');
    },

    onError: (error) => {
      toast.error('Failed to create goal. Please try again.');
      logger.error('Create goal error', { error });
    },
  });
}

/**
 * Update an existing goal
 */
export function useUpdateGoal() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      logger.info('📝 Updating goal...', { id });

      const { data, error } = await supabase
        .from('goals')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to update goal', { error: error.message });
        throw error;
      }

      logger.success('✅ Goal updated!');
      return data as Goal;
    },

    onSuccess: (data) => {
      // Update the cache with new data
      queryClient.setQueryData(queryKeys.goals.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    },

    onError: () => {
      toast.error('Failed to update goal');
    },
  });
}

/**
 * Update goal progress (for quantitative goals)
 *
 * @example
 * const updateProgress = useUpdateGoalProgress()
 * updateProgress.mutate({ id: goalId, currentValue: 25 })
 */
export function useUpdateGoalProgress() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, currentValue }: { id: string; currentValue: number }) => {
      logger.info('📈 Updating goal progress...', { id, currentValue });

      const { data, error } = await supabase
        .from('goals')
        .update({
          current_value: currentValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to update goal progress', { error: error.message });
        throw error;
      }

      logger.success('✅ Progress updated!');
      return data as Goal;
    },

    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.goals.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      toast.success('📈 Progress updated!');
    },

    onError: () => {
      toast.error('Failed to update progress');
    },
  });
}

/**
 * Mark a goal as achieved
 */
export function useAchieveGoal() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      logger.info('🏆 Achieving goal...', { goalId });

      const { data, error } = await supabase
        .from('goals')
        .update({
          status: 'achieved' as GoalStatus,
          achieved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', goalId)
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to achieve goal', { error: error.message });
        throw error;
      }

      logger.success('🎉 Goal achieved!');
      return data as Goal;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      toast.success('🎉 Goal achieved! Great work!');
    },

    onError: () => {
      toast.error('Failed to mark goal as achieved');
    },
  });
}

/**
 * Abandon a goal
 */
export function useAbandonGoal() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      logger.info('🚫 Abandoning goal...', { goalId });

      const { data, error } = await supabase
        .from('goals')
        .update({
          status: 'abandoned' as GoalStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goalId)
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to abandon goal', { error: error.message });
        throw error;
      }

      logger.success('✅ Goal abandoned');
      return data as Goal;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      toast('Goal abandoned', {
        description: 'It\'s okay to change direction sometimes.',
      });
    },

    onError: () => {
      toast.error('Failed to abandon goal');
    },
  });
}

/**
 * Delete a goal (soft delete)
 */
export function useDeleteGoal() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      logger.info('🗑️ Deleting goal...', { goalId });

      const { error } = await supabase
        .from('goals')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', goalId);

      if (error) {
        logger.error('❌ Failed to delete goal', { error: error.message });
        throw error;
      }

      logger.success('✅ Goal deleted');
      return goalId;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      toast('Goal deleted');
    },

    onError: () => {
      toast.error('Failed to delete goal');
    },
  });
}
