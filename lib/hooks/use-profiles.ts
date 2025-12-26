'use client';

/**
 * ============================================================================
 * 🎭 Profile Hooks
 * ============================================================================
 *
 * React Query hooks for managing family and member profiles.
 * Profiles enable rich personalization and AI context building.
 *
 * Key Features:
 * - Read family/member profiles
 * - Update profiles with merge semantics (partial updates work)
 * - Track profile completion for gamification
 * - Optimistic updates for responsive UI
 *
 * Design Philosophy:
 * - Progressive disclosure: profiles are optional and incremental
 * - Merge updates: new data merges with existing, never overwrites
 * - Cache friendly: updates immediately reflect in UI
 *
 * Reference: AI_Dev_Docs/15-profile-architecture.md
 *
 * ============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query-keys';
import { logger } from '@/lib/utils/logger';
import type { Family, FamilyMember } from '@/types/database';
import type {
  FamilyProfile,
  MemberProfile,
  FamilyProfileUpdate,
  MemberProfileUpdate,
  ProfileCompletion,
  Tradition,
  Pet,
} from '@/types/profiles';

// ============================================================================
// 📖 FAMILY PROFILE HOOKS (Read operations)
// ============================================================================

/**
 * Fetch the current family's profile
 *
 * @returns Query result with family profile object
 *
 * @example
 * const { data: profile, isLoading } = useFamilyProfile()
 * console.log(profile?.nickname) // "Team J"
 */
export function useFamilyProfile() {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.profiles.family(),
    queryFn: async (): Promise<FamilyProfile> => {
      logger.info('🏠 Fetching family profile...');

      // First get the current user's family
      const { data: member, error: memberError } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (memberError || !member) {
        logger.warn('⚠️ Could not find family for current user');
        return {};
      }

      // Then get the family profile
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('profile')
        .eq('id', member.family_id)
        .single();

      if (familyError) {
        logger.error('❌ Failed to fetch family profile', { error: familyError.message });
        throw familyError;
      }

      const profile = (family?.profile || {}) as FamilyProfile;
      logger.success('✅ Family profile loaded', { hasNickname: !!profile.nickname });
      return profile;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - profiles don't change often
  });
}

/**
 * Fetch the family object with profile included
 *
 * @returns Query result with full family object including profile
 */
export function useFamilyWithProfile() {
  const supabase = createClient();

  return useQuery({
    queryKey: [...queryKeys.profiles.family(), 'full'],
    queryFn: async (): Promise<Family | null> => {
      logger.info('🏠 Fetching family with profile...');

      // Get current user's family_id
      const { data: member, error: memberError } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (memberError || !member) {
        logger.warn('⚠️ Could not find family for current user');
        return null;
      }

      // Get the full family record
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', member.family_id)
        .single();

      if (familyError) {
        logger.error('❌ Failed to fetch family', { error: familyError.message });
        throw familyError;
      }

      logger.success('✅ Family loaded with profile');
      return family as Family;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ============================================================================
// 📖 MEMBER PROFILE HOOKS (Read operations)
// ============================================================================

/**
 * Fetch the current user's member profile
 *
 * @returns Query result with member profile object
 *
 * @example
 * const { data: profile } = useCurrentMemberProfile()
 * console.log(profile?.personality_type) // "The Organizer"
 */
export function useCurrentMemberProfile() {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.profiles.current(),
    queryFn: async (): Promise<MemberProfile> => {
      logger.info('👤 Fetching current member profile...');

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        logger.warn('⚠️ No authenticated user');
        return {};
      }

      const { data: member, error } = await supabase
        .from('family_members')
        .select('profile')
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          logger.info('📭 No member record for current user');
          return {};
        }
        logger.error('❌ Failed to fetch member profile', { error: error.message });
        throw error;
      }

      const profile = (member?.profile || {}) as MemberProfile;
      logger.success('✅ Member profile loaded', { hasPersonality: !!profile.personality_type });
      return profile;
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch a specific member's profile by their ID
 *
 * @param memberId - The family member's UUID
 * @returns Query result with member profile object
 */
export function useMemberProfile(memberId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.profiles.member(memberId || ''),
    queryFn: async (): Promise<MemberProfile> => {
      if (!memberId) return {};

      logger.info('👤 Fetching member profile...', { memberId });

      const { data: member, error } = await supabase
        .from('family_members')
        .select('profile')
        .eq('id', memberId)
        .single();

      if (error) {
        logger.error('❌ Failed to fetch member profile', { error: error.message });
        throw error;
      }

      const profile = (member?.profile || {}) as MemberProfile;
      logger.success('✅ Member profile loaded');
      return profile;
    },
    enabled: !!memberId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch a family member with their full profile
 *
 * @param memberId - The family member's UUID
 * @returns Query result with full member object including profile
 */
export function useFamilyMemberWithProfile(memberId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: [...queryKeys.profiles.member(memberId || ''), 'full'],
    queryFn: async (): Promise<FamilyMember | null> => {
      if (!memberId) return null;

      logger.info('👤 Fetching member with profile...', { memberId });

      const { data: member, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (error) {
        logger.error('❌ Failed to fetch member', { error: error.message });
        throw error;
      }

      logger.success('✅ Member loaded with profile');
      return member as FamilyMember;
    },
    enabled: !!memberId,
    staleTime: 1000 * 60 * 5,
  });
}

// ============================================================================
// ✏️ FAMILY PROFILE MUTATIONS (Write operations)
// ============================================================================

/**
 * Update the family profile
 * Uses merge semantics - only provided fields are updated
 *
 * @example
 * const updateProfile = useUpdateFamilyProfile()
 *
 * // Add a nickname
 * updateProfile.mutate({ nickname: 'Team J' })
 *
 * // Add traditions
 * updateProfile.mutate({
 *   traditions: [{ id: '1', name: 'Movie Night', frequency: 'weekly' }]
 * })
 */
export function useUpdateFamilyProfile() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (updates: FamilyProfileUpdate): Promise<FamilyProfile> => {
      logger.info('📝 Updating family profile...', { fields: Object.keys(updates) });

      // Get current user's family_id
      const { data: member, error: memberError } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (memberError || !member) {
        throw new Error('Could not find your family');
      }

      // Get current profile to merge with
      const { data: family, error: fetchError } = await supabase
        .from('families')
        .select('profile')
        .eq('id', member.family_id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Merge updates with existing profile
      const currentProfile = (family?.profile || {}) as FamilyProfile;
      const newProfile: FamilyProfile = { ...currentProfile, ...updates };

      // Handle array fields - they should be replaced, not merged
      if (updates.core_values !== undefined) newProfile.core_values = updates.core_values;
      if (updates.traditions !== undefined) newProfile.traditions = updates.traditions;
      if (updates.pets !== undefined) newProfile.pets = updates.pets;
      if (updates.shared_interests !== undefined) newProfile.shared_interests = updates.shared_interests;
      if (updates.cuisine_preferences !== undefined) newProfile.cuisine_preferences = updates.cuisine_preferences;
      if (updates.dietary_restrictions !== undefined) newProfile.dietary_restrictions = updates.dietary_restrictions;
      if (updates.languages !== undefined) newProfile.languages = updates.languages;

      // Update the family profile
      const { data, error } = await supabase
        .from('families')
        .update({
          profile: newProfile,
          updated_at: new Date().toISOString(),
        })
        .eq('id', member.family_id)
        .select('profile')
        .single();

      if (error) {
        logger.error('❌ Failed to update family profile', { error: error.message });
        throw error;
      }

      logger.success('✅ Family profile updated!');
      return data.profile as FamilyProfile;
    },

    // Optimistic update for instant UI feedback
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.profiles.family() });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<FamilyProfile>(
        queryKeys.profiles.family()
      );

      // Optimistically update
      if (previousProfile) {
        queryClient.setQueryData<FamilyProfile>(
          queryKeys.profiles.family(),
          { ...previousProfile, ...updates }
        );
      }

      return { previousProfile };
    },

    onError: (error, _updates, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(queryKeys.profiles.family(), context.previousProfile);
      }
      toast.error('Failed to update family profile');
      logger.error('Family profile update error', { error });
    },

    onSuccess: (newProfile) => {
      // Update cache with server response
      queryClient.setQueryData(queryKeys.profiles.family(), newProfile);
      toast.success('Family profile saved!');
    },
  });
}

// ============================================================================
// ✏️ MEMBER PROFILE MUTATIONS (Write operations)
// ============================================================================

/**
 * Update the current user's member profile
 * Uses merge semantics - only provided fields are updated
 *
 * @example
 * const updateProfile = useUpdateCurrentMemberProfile()
 *
 * // Set personality type
 * updateProfile.mutate({ personality_type: 'The Organizer' })
 *
 * // Add dietary restrictions
 * updateProfile.mutate({
 *   dietary_restrictions: ['vegetarian'],
 *   allergies: ['peanuts']
 * })
 */
export function useUpdateCurrentMemberProfile() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (updates: MemberProfileUpdate): Promise<MemberProfile> => {
      logger.info('📝 Updating current member profile...', { fields: Object.keys(updates) });

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Get current member record with profile
      const { data: member, error: fetchError } = await supabase
        .from('family_members')
        .select('id, profile')
        .eq('auth_user_id', user.id)
        .single();

      if (fetchError || !member) {
        throw new Error('Could not find your member record');
      }

      // Merge updates with existing profile
      const currentProfile = (member.profile || {}) as MemberProfile;
      const newProfile: MemberProfile = { ...currentProfile, ...updates };

      // Handle array fields - they should be replaced, not merged
      if (updates.strengths !== undefined) newProfile.strengths = updates.strengths;
      if (updates.growth_areas !== undefined) newProfile.growth_areas = updates.growth_areas;
      if (updates.motivated_by !== undefined) newProfile.motivated_by = updates.motivated_by;
      if (updates.recharged_by !== undefined) newProfile.recharged_by = updates.recharged_by;
      if (updates.hobbies !== undefined) newProfile.hobbies = updates.hobbies;
      if (updates.current_interests !== undefined) newProfile.current_interests = updates.current_interests;
      if (updates.favorite_cuisines !== undefined) newProfile.favorite_cuisines = updates.favorite_cuisines;
      if (updates.comfort_foods !== undefined) newProfile.comfort_foods = updates.comfort_foods;
      if (updates.dietary_restrictions !== undefined) newProfile.dietary_restrictions = updates.dietary_restrictions;
      if (updates.allergies !== undefined) newProfile.allergies = updates.allergies;
      if (updates.exercise_preferences !== undefined) newProfile.exercise_preferences = updates.exercise_preferences;
      if (updates.busy_seasons !== undefined) newProfile.busy_seasons = updates.busy_seasons;
      if (updates.favorite_subjects !== undefined) newProfile.favorite_subjects = updates.favorite_subjects;
      if (updates.activities !== undefined) newProfile.activities = updates.activities;
      if (updates.dislikes !== undefined) newProfile.dislikes = updates.dislikes;
      if (updates.needs_help_with !== undefined) newProfile.needs_help_with = updates.needs_help_with;

      // Update the member profile
      const { data, error } = await supabase
        .from('family_members')
        .update({
          profile: newProfile,
          updated_at: new Date().toISOString(),
        })
        .eq('id', member.id)
        .select('profile')
        .single();

      if (error) {
        logger.error('❌ Failed to update member profile', { error: error.message });
        throw error;
      }

      logger.success('✅ Member profile updated!');
      return data.profile as MemberProfile;
    },

    // Optimistic update
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.profiles.current() });

      const previousProfile = queryClient.getQueryData<MemberProfile>(
        queryKeys.profiles.current()
      );

      if (previousProfile) {
        queryClient.setQueryData<MemberProfile>(
          queryKeys.profiles.current(),
          { ...previousProfile, ...updates }
        );
      }

      return { previousProfile };
    },

    onError: (error, _updates, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(queryKeys.profiles.current(), context.previousProfile);
      }
      toast.error('Failed to update profile');
      logger.error('Member profile update error', { error });
    },

    onSuccess: (newProfile) => {
      queryClient.setQueryData(queryKeys.profiles.current(), newProfile);
      // Also invalidate family members list since profile changed
      queryClient.invalidateQueries({ queryKey: queryKeys.family.members() });
      toast.success('Profile saved!');
    },
  });
}

/**
 * Update a specific member's profile (for parents editing kids' profiles)
 *
 * @example
 * const updateProfile = useUpdateMemberProfile()
 * updateProfile.mutate({
 *   memberId: 'child-uuid',
 *   updates: { school_name: 'Lincoln Elementary', grade: '5th' }
 * })
 */
export function useUpdateMemberProfile() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      updates,
    }: {
      memberId: string;
      updates: MemberProfileUpdate;
    }): Promise<MemberProfile> => {
      logger.info('📝 Updating member profile...', { memberId, fields: Object.keys(updates) });

      // Get current member profile
      const { data: member, error: fetchError } = await supabase
        .from('family_members')
        .select('profile')
        .eq('id', memberId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Merge updates
      const currentProfile = (member?.profile || {}) as MemberProfile;
      const newProfile: MemberProfile = { ...currentProfile, ...updates };

      // Handle arrays (same as above)
      if (updates.strengths !== undefined) newProfile.strengths = updates.strengths;
      if (updates.growth_areas !== undefined) newProfile.growth_areas = updates.growth_areas;
      if (updates.hobbies !== undefined) newProfile.hobbies = updates.hobbies;
      if (updates.dietary_restrictions !== undefined) newProfile.dietary_restrictions = updates.dietary_restrictions;
      if (updates.allergies !== undefined) newProfile.allergies = updates.allergies;
      if (updates.favorite_subjects !== undefined) newProfile.favorite_subjects = updates.favorite_subjects;
      if (updates.activities !== undefined) newProfile.activities = updates.activities;
      if (updates.dislikes !== undefined) newProfile.dislikes = updates.dislikes;
      if (updates.needs_help_with !== undefined) newProfile.needs_help_with = updates.needs_help_with;

      // Update
      const { data, error } = await supabase
        .from('family_members')
        .update({
          profile: newProfile,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .select('profile')
        .single();

      if (error) {
        logger.error('❌ Failed to update member profile', { error: error.message });
        throw error;
      }

      logger.success('✅ Member profile updated!');
      return data.profile as MemberProfile;
    },

    onSuccess: (newProfile, { memberId }) => {
      queryClient.setQueryData(queryKeys.profiles.member(memberId), newProfile);
      queryClient.invalidateQueries({ queryKey: queryKeys.family.members() });
      toast.success('Profile saved!');
    },

    onError: () => {
      toast.error('Failed to update profile');
    },
  });
}

// ============================================================================
// 📊 PROFILE COMPLETION HOOKS
// ============================================================================

/**
 * Calculate family profile completion percentage
 * Useful for showing progress indicators and encouraging profile completion
 *
 * @returns Query result with completion percentage and section info
 */
export function useFamilyProfileCompletion() {
  const { data: profile } = useFamilyProfile();

  // Calculate completion client-side for now
  // Could be moved to a DB function for consistency
  const completion: ProfileCompletion = {
    percentage: 0,
    completeSections: [],
    incompleteSections: [],
    nextSuggestion: undefined,
  };

  if (!profile) {
    return { data: completion, isLoading: false };
  }

  // Check each section
  const sections = {
    identity: !!(profile.nickname || profile.motto || profile.emoji),
    values: !!(profile.core_values && profile.core_values.length > 0),
    traditions: !!(profile.traditions && profile.traditions.length > 0),
    household: !!(profile.life_stage || profile.home_type),
    interests: !!(profile.shared_interests && profile.shared_interests.length > 0),
    ai: !!(profile.ai_tone || profile.suggestion_frequency),
  };

  const totalSections = Object.keys(sections).length;
  const completeSections = Object.entries(sections)
    .filter(([, complete]) => complete)
    .map(([name]) => name);
  const incompleteSections = Object.entries(sections)
    .filter(([, complete]) => !complete)
    .map(([name]) => name);

  completion.percentage = Math.round((completeSections.length / totalSections) * 100);
  completion.completeSections = completeSections;
  completion.incompleteSections = incompleteSections;
  completion.nextSuggestion = incompleteSections[0];

  return { data: completion, isLoading: false };
}

/**
 * Calculate member profile completion percentage
 *
 * @returns Query result with completion percentage and section info
 */
export function useCurrentMemberProfileCompletion() {
  const { data: profile } = useCurrentMemberProfile();

  const completion: ProfileCompletion = {
    percentage: 0,
    completeSections: [],
    incompleteSections: [],
    nextSuggestion: undefined,
  };

  if (!profile) {
    return { data: completion, isLoading: false };
  }

  // Check each section
  const sections = {
    personality: !!(profile.personality_type || profile.energy_type || profile.chronotype),
    strengths: !!(profile.strengths && profile.strengths.length > 0),
    motivation: !!(profile.love_language || (profile.motivated_by && profile.motivated_by.length > 0)),
    interests: !!(profile.hobbies && profile.hobbies.length > 0),
    health: !!(
      (profile.dietary_restrictions && profile.dietary_restrictions.length > 0) ||
      (profile.allergies && profile.allergies.length > 0)
    ),
    communication: !!(profile.reminder_style || profile.best_focus_time),
    life_context: !!(profile.occupation || profile.school_name),
  };

  const totalSections = Object.keys(sections).length;
  const completeSections = Object.entries(sections)
    .filter(([, complete]) => complete)
    .map(([name]) => name);
  const incompleteSections = Object.entries(sections)
    .filter(([, complete]) => !complete)
    .map(([name]) => name);

  completion.percentage = Math.round((completeSections.length / totalSections) * 100);
  completion.completeSections = completeSections;
  completion.incompleteSections = incompleteSections;
  completion.nextSuggestion = incompleteSections[0];

  return { data: completion, isLoading: false };
}

// ============================================================================
// 🎨 TRADITION & PET HELPERS
// ============================================================================

/**
 * Add a tradition to the family profile
 */
export function useAddTradition() {
  const { data: profile } = useFamilyProfile();
  const updateProfile = useUpdateFamilyProfile();

  return useMutation({
    mutationFn: async (tradition: Omit<Tradition, 'id'>): Promise<Tradition> => {
      const newTradition: Tradition = {
        ...tradition,
        id: crypto.randomUUID(),
      };

      const currentTraditions = profile?.traditions || [];
      await updateProfile.mutateAsync({
        traditions: [...currentTraditions, newTradition],
      });

      return newTradition;
    },
  });
}

/**
 * Remove a tradition from the family profile
 */
export function useRemoveTradition() {
  const { data: profile } = useFamilyProfile();
  const updateProfile = useUpdateFamilyProfile();

  return useMutation({
    mutationFn: async (traditionId: string): Promise<void> => {
      const currentTraditions = profile?.traditions || [];
      await updateProfile.mutateAsync({
        traditions: currentTraditions.filter((t) => t.id !== traditionId),
      });
    },
  });
}

/**
 * Add a pet to the family profile
 */
export function useAddPet() {
  const { data: profile } = useFamilyProfile();
  const updateProfile = useUpdateFamilyProfile();

  return useMutation({
    mutationFn: async (pet: Pet): Promise<Pet> => {
      const currentPets = profile?.pets || [];
      await updateProfile.mutateAsync({
        pets: [...currentPets, pet],
      });
      return pet;
    },
  });
}

/**
 * Remove a pet from the family profile
 */
export function useRemovePet() {
  const { data: profile } = useFamilyProfile();
  const updateProfile = useUpdateFamilyProfile();

  return useMutation({
    mutationFn: async (petName: string): Promise<void> => {
      const currentPets = profile?.pets || [];
      await updateProfile.mutateAsync({
        pets: currentPets.filter((p) => p.name !== petName),
      });
    },
  });
}

// ============================================================================
// 🔮 AI CONTEXT BUILDER
// ============================================================================

/**
 * Build AI context from profiles for use in AI-powered features
 * This combines family and member profiles into a format suitable for AI prompts
 *
 * @example
 * const { data: context } = useAIProfileContext()
 * // Pass context to AI generation functions
 */
export function useAIProfileContext() {
  const { data: familyProfile } = useFamilyProfile();
  const { data: memberProfile } = useCurrentMemberProfile();
  const { data: familyData } = useFamilyWithProfile();

  return useQuery({
    queryKey: [...queryKeys.profiles.all, 'ai-context'],
    queryFn: async () => {
      // Get current member data for the name
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      let memberData: FamilyMember | null = null;
      if (user) {
        const { data } = await supabase
          .from('family_members')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();
        memberData = data as FamilyMember;
      }

      return {
        family: {
          name: familyData?.name || 'Your Family',
          nickname: familyProfile?.nickname,
          communication_style: familyProfile?.communication_style,
          ai_tone: familyProfile?.ai_tone,
          values: familyProfile?.core_values,
          life_stage: familyProfile?.life_stage,
          shared_interests: familyProfile?.shared_interests,
        },
        member: {
          name: memberData?.name || 'You',
          is_kid: memberData?.role === 'kid',
          personality_type: memberProfile?.personality_type,
          love_language: memberProfile?.love_language,
          preferred_tone: memberProfile?.preferred_ai_tone,
          chronotype: memberProfile?.chronotype,
          strengths: memberProfile?.strengths,
          dietary_restrictions: memberProfile?.dietary_restrictions,
          allergies: memberProfile?.allergies,
        },
      };
    },
    enabled: !!familyProfile || !!memberProfile,
    staleTime: 1000 * 60 * 5,
  });
}
