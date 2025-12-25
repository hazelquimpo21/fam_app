'use client';

/**
 * ============================================================================
 * 👨‍👩‍👧‍👦 Family Hooks
 * ============================================================================
 *
 * React Query hooks for family operations:
 * - Fetching family members
 * - Managing family invites
 * - Updating member profiles
 * - Role management
 *
 * ============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query-keys';
import { logger } from '@/lib/utils/logger';
import type { FamilyMember, FamilyMemberRole, FamilyInvite } from '@/types/database';

// ============================================================================
// 📖 QUERY HOOKS (Read operations)
// ============================================================================

/**
 * Extended family member with computed properties
 */
export interface FamilyMemberWithStats extends FamilyMember {
  tasksCount?: number;
  habitsCount?: number;
}

/**
 * Fetch all family members
 *
 * @returns Query result with family members array
 *
 * @example
 * const { data: members, isLoading } = useFamilyMembers()
 */
export function useFamilyMembers() {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.family.members(),
    queryFn: async (): Promise<FamilyMember[]> => {
      logger.info('👥 Fetching family members...');

      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('❌ Failed to fetch family members', { error: error.message });
        throw error;
      }

      logger.success(`✅ Fetched ${data?.length || 0} family members`);
      return data as FamilyMember[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch a single family member by ID
 *
 * @param id - Family member UUID
 * @returns Query result with family member object
 */
export function useFamilyMember(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.family.member(id),
    queryFn: async (): Promise<FamilyMember> => {
      logger.info('👤 Fetching family member...', { id });

      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.error('❌ Failed to fetch family member', { error: error.message });
        throw error;
      }

      logger.success('✅ Family member loaded', { name: data?.name });
      return data as FamilyMember;
    },
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Fetch the current user's family member record
 *
 * @returns Query result with current user's family member object
 */
export function useCurrentFamilyMember() {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.family.current(),
    queryFn: async (): Promise<FamilyMember | null> => {
      logger.info('👤 Fetching current family member...');

      // Get the current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        logger.warn('⚠️ No authenticated user');
        return null;
      }

      // Find the family member linked to this auth user
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        // No family member record yet is not an error
        if (error.code === 'PGRST116') {
          logger.info('📭 No family member record for current user');
          return null;
        }
        logger.error('❌ Failed to fetch current family member', { error: error.message });
        throw error;
      }

      logger.success('✅ Current family member loaded', { name: data?.name });
      return data as FamilyMember;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch pending family invites
 *
 * @returns Query result with pending invites array
 */
export function useFamilyInvites() {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.family.invites(),
    queryFn: async (): Promise<FamilyInvite[]> => {
      logger.info('📧 Fetching family invites...');

      const { data, error } = await supabase
        .from('family_invites')
        .select('*')
        .is('used_at', null)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('❌ Failed to fetch family invites', { error: error.message });
        throw error;
      }

      logger.success(`✅ Fetched ${data?.length || 0} pending invites`);
      return data as FamilyInvite[];
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

// ============================================================================
// ✏️ MUTATION HOOKS (Write operations)
// ============================================================================

/**
 * Input type for creating a family member (for kids who don't have email)
 */
export interface CreateFamilyMemberInput {
  name: string;
  role: FamilyMemberRole;
  color?: string;
  birthday?: string;
}

/**
 * Create a new family member (typically for kids)
 *
 * @example
 * const createMember = useCreateFamilyMember()
 * createMember.mutate({
 *   name: 'Miles',
 *   role: 'kid',
 *   color: '#F59E0B'
 * })
 */
export function useCreateFamilyMember() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: CreateFamilyMemberInput) => {
      logger.info('➕ Creating family member...', { name: input.name });

      // Generate a random color if not provided
      const colors = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const { data, error } = await supabase
        .from('family_members')
        .insert({
          ...input,
          color: input.color || randomColor,
        })
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to create family member', { error: error.message });
        throw error;
      }

      logger.success('✅ Family member created!', { name: data?.name });
      return data as FamilyMember;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.family.all });
      toast.success('👨‍👩‍👧‍👦 Family member added!');
    },

    onError: (error) => {
      toast.error('Failed to add family member. Please try again.');
      logger.error('Create family member error', { error });
    },
  });
}

/**
 * Update a family member's profile
 */
export function useUpdateFamilyMember() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FamilyMember> & { id: string }) => {
      logger.info('📝 Updating family member...', { id });

      const { data, error } = await supabase
        .from('family_members')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to update family member', { error: error.message });
        throw error;
      }

      logger.success('✅ Family member updated!');
      return data as FamilyMember;
    },

    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.family.member(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.family.all });
      toast.success('Profile updated!');
    },

    onError: () => {
      toast.error('Failed to update profile');
    },
  });
}

/**
 * Input type for creating a family invite
 */
export interface CreateInviteInput {
  email: string;
  role: FamilyMemberRole;
}

/**
 * Create a family invite
 *
 * @example
 * const createInvite = useCreateFamilyInvite()
 * createInvite.mutate({ email: 'grandma@example.com', role: 'adult' })
 */
export function useCreateFamilyInvite() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: CreateInviteInput) => {
      logger.info('📧 Creating family invite...', { email: input.email });

      // Generate a random token
      const token = crypto.randomUUID();

      // Set expiry to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await supabase
        .from('family_invites')
        .insert({
          email: input.email,
          role: input.role,
          token,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to create invite', { error: error.message });
        throw error;
      }

      logger.success('✅ Invite created!', { email: input.email });
      return data as FamilyInvite;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.family.invites() });
      toast.success('📧 Invite sent!');
    },

    onError: (error) => {
      toast.error('Failed to send invite. Please try again.');
      logger.error('Create invite error', { error });
    },
  });
}

/**
 * Resend a family invite
 */
export function useResendInvite() {
  const supabase = createClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      logger.info('📧 Resending invite...', { inviteId });

      // In production, this would trigger an email send
      // For now, we just update the created_at to show it was "resent"
      const { data, error } = await supabase
        .from('family_invites')
        .update({
          created_at: new Date().toISOString(),
        })
        .eq('id', inviteId)
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to resend invite', { error: error.message });
        throw error;
      }

      logger.success('✅ Invite resent!');
      return data as FamilyInvite;
    },

    onSuccess: () => {
      toast.success('📧 Invite resent!');
    },

    onError: () => {
      toast.error('Failed to resend invite');
    },
  });
}

/**
 * Cancel a family invite
 */
export function useCancelInvite() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      logger.info('❌ Canceling invite...', { inviteId });

      const { error } = await supabase
        .from('family_invites')
        .delete()
        .eq('id', inviteId);

      if (error) {
        logger.error('❌ Failed to cancel invite', { error: error.message });
        throw error;
      }

      logger.success('✅ Invite canceled');
      return inviteId;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.family.invites() });
      toast('Invite canceled');
    },

    onError: () => {
      toast.error('Failed to cancel invite');
    },
  });
}
