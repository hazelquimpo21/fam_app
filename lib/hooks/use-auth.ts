'use client';

/**
 * ============================================================================
 * 🔐 Authentication Hook (Magic Link)
 * ============================================================================
 * 
 * Central hook for all authentication operations using Supabase Magic Links.
 * Provides passwordless authentication for a smoother user experience.
 * 
 * Usage:
 *   const { user, sendMagicLink, signOut, loading } = useAuth()
 * 
 * Flow:
 * 1. User enters email on login/signup page
 * 2. sendMagicLink() sends email with secure link
 * 3. User clicks link → redirected to /auth/callback
 * 4. Callback exchanges code for session
 * 5. onAuthStateChange updates user state
 * 
 * ============================================================================
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import type { FamilyMember, Family } from '@/types/database';

/**
 * Authentication state enum
 * Represents the current state of the user's authentication
 */
type AuthState = 
  | 'loading'           // Checking session on mount
  | 'unauthenticated'   // No session, show login
  | 'authenticated'     // Has session and family membership
  | 'needs_family';     // Has session but needs to create/join family

/**
 * Auth context value interface
 * All values and methods provided by the useAuth hook
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
  /** Send a magic link to the provided email */
  sendMagicLink: (email: string, options?: { name?: string }) => Promise<{ error?: string }>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Request password reset (fallback, if needed) */
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

/**
 * useAuth Hook
 * 
 * Main authentication hook for the Fam app.
 * Handles magic link auth, session management, and family membership.
 * 
 * @returns {AuthContextValue} Authentication state and methods
 * 
 * @example
 * function ProfilePage() {
 *   const { user, familyMember, signOut, authState } = useAuth()
 * 
 *   if (authState === 'loading') return <Spinner />
 *   if (!user) return <Redirect to="/login" />
 * 
 *   return (
 *     <div>
 *       <h1>Welcome, {familyMember?.name}</h1>
 *       <Button onClick={signOut}>Sign Out</Button>
 *     </div>
 *   )
 * }
 */
export function useAuth(): AuthContextValue {
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
   * @param userId - Supabase auth user ID
   * @returns Family member and family objects, or null if not found
   */
  const fetchFamilyMember = useCallback(async (userId: string) => {
    logger.debug('📋 Fetching family member data', { userId });

    const { data, error } = await supabase
      .from('family_members')
      .select(`
        *,
        family:families(*)
      `)
      .eq('auth_user_id', userId)
      .single();

    if (error) {
      // User exists in auth but hasn't joined/created a family yet
      logger.warn('👤 No family member found (may need onboarding)', { userId });
      return { member: null, family: null };
    }

    logger.success('✅ Family member loaded', { name: data.name });
    return {
      member: data as FamilyMember,
      family: data.family as Family,
    };
  }, [supabase]);

  /**
   * Initialize auth state on mount and listen for changes
   * Sets up real-time listener for auth state changes (login, logout, etc.)
   */
  useEffect(() => {
    logger.info('🔐 Initializing auth...');

    // Get initial session state
    const initAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);

        // Fetch family member data
        const { member, family: fam } = await fetchFamilyMember(currentSession.user.id);
        setFamilyMember(member);
        setFamily(fam);

        // Set appropriate auth state based on family membership
        setAuthState(member ? 'authenticated' : 'needs_family');
        logger.success('🔓 Auth initialized', { 
          state: member ? 'authenticated' : 'needs_family',
          userId: currentSession.user.id 
        });
      } else {
        setAuthState('unauthenticated');
        logger.info('🔒 No session found - user not authenticated');
      }
    };

    initAuth();

    // Listen for auth state changes (magic link click, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        logger.info('🔄 Auth state changed', { event });

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
      }
    );

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
  const sendMagicLink = useCallback(async (
    email: string, 
    options?: { name?: string }
  ) => {
    logger.info('📧 Sending magic link...', { email });

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
      logger.error('❌ Magic link failed', { error: error.message });
      return { error: error.message };
    }

    logger.success('✅ Magic link sent!');
    return {};
  }, [supabase]);

  /**
   * Sign out the current user
   * Clears session and redirects to login page
   */
  const signOut = useCallback(async () => {
    logger.info('🚪 Signing out...');
    await supabase.auth.signOut();
    router.push('/login');
    logger.success('👋 Signed out successfully');
  }, [supabase, router]);

  /**
   * Request password reset email
   * Fallback method if password auth is ever needed
   * 
   * @param email - Email address for password reset
   * @returns Object with optional error message
   */
  const resetPassword = useCallback(async (email: string) => {
    logger.info('🔑 Requesting password reset...', { email });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      logger.error('❌ Password reset failed', { error: error.message });
      return { error: error.message };
    }

    logger.success('📧 Password reset email sent');
    return {};
  }, [supabase]);

  // Return all auth state and methods
  return {
    authState,
    user,
    session,
    familyMember,
    family,
    sendMagicLink,
    signOut,
    resetPassword,
  };
}
