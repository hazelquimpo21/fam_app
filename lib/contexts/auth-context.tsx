'use client';

/**
 * ============================================================================
 * 🔐 Auth Context & Provider
 * ============================================================================
 *
 * Central authentication context for the Fam app.
 * Provides a single source of truth for auth state across all components.
 *
 * WHY THIS PATTERN:
 * Previously, useAuth was a standalone hook that created independent state
 * in each component that used it. This caused:
 * 1. Multiple redundant fetches for family member data
 * 2. Auth state not being shared across the component tree
 * 3. Race conditions when auth state changed
 *
 * With AuthProvider:
 * - One AuthProvider wraps the app at the root
 * - Auth state is managed in one place
 * - All components share the same state via context
 * - No redundant database queries
 *
 * USAGE:
 *   // In providers.tsx
 *   <AuthProvider>
 *     {children}
 *   </AuthProvider>
 *
 *   // In components
 *   const { user, familyMember, family } = useAuth()
 *
 * ============================================================================
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useRouter } from 'next/navigation';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import type { FamilyMember, Family } from '@/types/database';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Authentication state enum
 * Represents the current state of the user's authentication
 */
export type AuthState =
  | 'loading' // Checking session on mount
  | 'unauthenticated' // No session, show login
  | 'authenticated' // Has session and family membership
  | 'needs_family'; // Has session but needs to create/join family

/**
 * Auth context value interface
 * All values and methods provided by the AuthProvider
 */
export interface AuthContextValue {
  /** Current auth state */
  authState: AuthState;
  /** Supabase auth user object */
  user: User | null;
  /** Current session */
  session: Session | null;
  /** App-level family member with profile data */
  familyMember: FamilyMember | null;
  /** Current family the user belongs to */
  family: Family | null;
  /** The family_id for quick access (frequently needed) */
  familyId: string | null;
  /** Send a magic link to the provided email */
  sendMagicLink: (email: string, options?: { name?: string }) => Promise<{ error?: string }>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Request password reset (fallback, if needed) */
  resetPassword: (email: string) => Promise<{ error?: string }>;
  /** Manually refetch family member data (e.g., after profile update) */
  refetchFamilyMember: () => Promise<void>;
}

// ============================================================================
// CONTEXT
// ============================================================================

/**
 * The Auth Context
 * Contains all auth state and methods
 */
const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider Component
 *
 * Wraps the app and provides centralized auth state management.
 * Should be placed at the root level, inside QueryClientProvider.
 *
 * @example
 * <QueryClientProvider client={queryClient}>
 *   <AuthProvider>
 *     {children}
 *   </AuthProvider>
 * </QueryClientProvider>
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const supabase = createClient();

  // ━━━━━ State ━━━━━
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [familyMember, setFamilyMember] = useState<FamilyMember | null>(null);
  const [family, setFamily] = useState<Family | null>(null);

  /**
   * Fetch family member data for the current authenticated user
   * Includes the associated family data via join
   *
   * Uses maybeSingle() to avoid 406 errors when no record exists.
   * This is expected during onboarding when user hasn't created a family yet.
   *
   * @param userId - Supabase auth user ID
   * @returns Family member and family objects, or null if not found
   */
  const fetchFamilyMember = useCallback(
    async (userId: string) => {
      logger.debug('📋 AuthProvider: Fetching family member data', { userId });

      // Use maybeSingle() instead of single() to handle case when no record exists
      // This prevents 406 "Not Acceptable" errors for new users without a family
      const { data, error } = await supabase
        .from('family_members')
        .select(`
        *,
        family:families(*)
      `)
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (error) {
        // Actual database error (not just "no rows found")
        logger.error('❌ AuthProvider: Failed to fetch family member', { error: error.message });
        return { member: null, family: null };
      }

      if (!data) {
        // User exists in auth but hasn't joined/created a family yet
        // This is expected - they need to go through onboarding
        logger.info('👤 AuthProvider: No family member found (needs onboarding)', { userId });
        return { member: null, family: null };
      }

      logger.success('✅ AuthProvider: Family member loaded', { name: data.name });
      return {
        member: data as FamilyMember,
        family: data.family as Family,
      };
    },
    [supabase]
  );

  /**
   * Public method to refetch family member data
   * Useful after profile updates or family changes
   */
  const refetchFamilyMember = useCallback(async () => {
    if (!user) return;

    const { member, family: fam } = await fetchFamilyMember(user.id);
    setFamilyMember(member);
    setFamily(fam);
    setAuthState(member ? 'authenticated' : 'needs_family');
  }, [user, fetchFamilyMember]);

  /**
   * Initialize auth state on mount and listen for changes
   * Sets up real-time listener for auth state changes (login, logout, etc.)
   */
  useEffect(() => {
    logger.info('🔐 AuthProvider: Initializing auth...');

    // Get initial session state
    const initAuth = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);

        // Fetch family member data
        const { member, family: fam } = await fetchFamilyMember(currentSession.user.id);
        setFamilyMember(member);
        setFamily(fam);

        // Set appropriate auth state based on family membership
        setAuthState(member ? 'authenticated' : 'needs_family');
        logger.success('🔓 AuthProvider: Auth initialized', {
          state: member ? 'authenticated' : 'needs_family',
          userId: currentSession.user.id,
        });
      } else {
        setAuthState('unauthenticated');
        logger.info('🔒 AuthProvider: No session found - user not authenticated');
      }
    };

    initAuth();

    // Listen for auth state changes (magic link click, sign out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      logger.info('🔄 AuthProvider: Auth state changed', { event });

      if (event === 'SIGNED_OUT') {
        // Clear all auth state
        setUser(null);
        setSession(null);
        setFamilyMember(null);
        setFamily(null);
        setAuthState('unauthenticated');
      } else if (newSession?.user) {
        // User signed in (via magic link or session refresh)
        setSession(newSession);
        setUser(newSession.user);

        // Fetch family membership
        const { member, family: fam } = await fetchFamilyMember(newSession.user.id);
        setFamilyMember(member);
        setFamily(fam);
        setAuthState(member ? 'authenticated' : 'needs_family');
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchFamilyMember]);

  /**
   * Send a magic link to the provided email address
   * Works for both signup (new users) and login (existing users)
   *
   * @param email - Email address to send magic link to
   * @param options - Optional settings like user's name for signup
   * @returns Object with optional error message
   */
  const sendMagicLink = useCallback(
    async (email: string, options?: { name?: string }) => {
      logger.info('📧 AuthProvider: Sending magic link...', { email });

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Include name in metadata for new user signups
          data: options?.name ? { name: options.name } : undefined,
          // Redirect after clicking the magic link
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });

      if (error) {
        logger.error('❌ AuthProvider: Magic link failed', { error: error.message });
        return { error: error.message };
      }

      logger.success('✅ AuthProvider: Magic link sent!');
      return {};
    },
    [supabase]
  );

  /**
   * Sign out the current user
   * Clears session and redirects to login page
   */
  const signOut = useCallback(async () => {
    logger.info('🚪 AuthProvider: Signing out...');
    await supabase.auth.signOut();
    router.push('/login');
    logger.success('👋 AuthProvider: Signed out successfully');
  }, [supabase, router]);

  /**
   * Request password reset email
   * Fallback method if password auth is ever needed
   *
   * @param email - Email address for password reset
   * @returns Object with optional error message
   */
  const resetPassword = useCallback(
    async (email: string) => {
      logger.info('🔑 AuthProvider: Requesting password reset...', { email });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (error) {
        logger.error('❌ AuthProvider: Password reset failed', { error: error.message });
        return { error: error.message };
      }

      logger.success('📧 AuthProvider: Password reset email sent');
      return {};
    },
    [supabase]
  );

  // ━━━━━ Memoized Context Value ━━━━━
  const value = useMemo<AuthContextValue>(
    () => ({
      authState,
      user,
      session,
      familyMember,
      family,
      familyId: familyMember?.family_id || null,
      sendMagicLink,
      signOut,
      resetPassword,
      refetchFamilyMember,
    }),
    [
      authState,
      user,
      session,
      familyMember,
      family,
      sendMagicLink,
      signOut,
      resetPassword,
      refetchFamilyMember,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * useAuth Hook
 *
 * Access the auth context from any component.
 * Must be used within an AuthProvider.
 *
 * @returns {AuthContextValue} Authentication state and methods
 * @throws Error if used outside of AuthProvider
 *
 * @example
 * function ProfilePage() {
 *   const { user, familyMember, familyId, signOut, authState } = useAuth()
 *
 *   if (authState === 'loading') return <Spinner />
 *   if (!user) return <Redirect to="/login" />
 *
 *   return (
 *     <div>
 *       <h1>Welcome, {familyMember?.name}</h1>
 *       <p>Family ID: {familyId}</p>
 *       <Button onClick={signOut}>Sign Out</Button>
 *     </div>
 *   )
 * }
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
        'Wrap your app with <AuthProvider> in providers.tsx.'
    );
  }

  return context;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { AuthContext };
