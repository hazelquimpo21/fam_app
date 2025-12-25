'use client';

/**
 * ============================================================================
 * 👨‍👩‍👧‍👦 Family Context Hook
 * ============================================================================
 *
 * Provides the current user's family context (family_id, member_id) for use
 * in mutations. This hook should be used by other hooks that need to insert
 * data with family_id.
 *
 * ============================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query-keys';
import { logger } from '@/lib/utils/logger';

/**
 * Family context data returned by the hook
 */
export interface FamilyContext {
  /** The current user's family ID */
  familyId: string | null;
  /** The current user's family member ID */
  memberId: string | null;
  /** Whether the data is still loading */
  isLoading: boolean;
  /** Whether the user needs to complete onboarding */
  needsOnboarding: boolean;
}

/**
 * Hook to get the current user's family context
 *
 * This is used internally by mutation hooks to automatically
 * include family_id in inserts.
 *
 * @returns Family context with IDs and loading state
 *
 * @example
 * const { familyId, memberId, isLoading } = useFamilyContext()
 */
export function useFamilyContext(): FamilyContext {
  const supabase = createClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.family.current(),
    queryFn: async () => {
      logger.debug('📋 Fetching family context...');

      // Get the current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        logger.debug('No authenticated user for family context');
        return { familyId: null, memberId: null };
      }

      // Find the family member linked to this auth user
      const { data: member, error } = await supabase
        .from('family_members')
        .select('id, family_id')
        .eq('auth_user_id', user.id)
        .single();

      if (error || !member) {
        logger.debug('No family member found for user', { userId: user.id });
        return { familyId: null, memberId: null };
      }

      logger.debug('Family context loaded', {
        familyId: member.family_id,
        memberId: member.id,
      });

      return {
        familyId: member.family_id,
        memberId: member.id,
      };
    },
    staleTime: 1000 * 60 * 10, // 10 minutes - this rarely changes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });

  return {
    familyId: data?.familyId ?? null,
    memberId: data?.memberId ?? null,
    isLoading,
    needsOnboarding: !isLoading && !data?.familyId,
  };
}
