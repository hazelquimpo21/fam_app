'use client';

/**
 * ============================================================================
 * 🔐 Authentication Hook
 * ============================================================================
 *
 * Central hook for all authentication operations.
 * Handles sign in, sign up, sign out, and session management.
 *
 * Usage:
 *   const { user, signIn, signOut, loading } = useAuth()
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
 * Authentication state
 */
type AuthState = 'loading' | 'unauthenticated' | 'authenticated' | 'needs_family';

/**
 * Auth context value
 */
export interface AuthContextValue {
  /** Current auth state */
  authState: AuthState;
  /** Supabase auth user */
  user: User | null;
  /** Current session */
  session: Session | null;
  /** App-level user with family info */
  familyMember: FamilyMember | null;
  /** Current family */
  family: Family | null;
  /** Sign in with email/password */
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  /** Sign up with email/password */
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  /** Send magic link for passwordless auth (signup or login) */
  sendMagicLink: (email: string, name?: string) => Promise<{ error?: string }>;
  /** Sign out */
  signOut: () => Promise<void>;
  /** Request password reset */
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

/**
 * useAuth Hook
 *
 * Provides authentication state and methods for the entire app.
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

  // State
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [familyMember, setFamilyMember] = useState<FamilyMember | null>(null);
  const [family, setFamily] = useState<Family | null>(null);

  /**
   * Fetch family member data for the current user
   */
  const fetchFamilyMember = useCallback(async (userId: string) => {
    logger.debug('Fetching family member data', { userId });

    const { data, error } = await supabase
      .from('family_members')
      .select(`
        *,
        family:families(*)
      `)
      .eq('auth_user_id', userId)
      .single();

    if (error) {
      logger.warn('No family member found', { userId });
      return { member: null, family: null };
    }

    logger.success('Family member loaded', { name: data.name });
    return {
      member: data as FamilyMember,
      family: data.family as Family,
    };
  }, [supabase]);

  /**
   * Initialize auth state and listen for changes
   */
  useEffect(() => {
    logger.info('Initializing auth...');

    // Get initial session
    const initAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);

        // Fetch family member
        const { member, family: fam } = await fetchFamilyMember(currentSession.user.id);
        setFamilyMember(member);
        setFamily(fam);

        setAuthState(member ? 'authenticated' : 'needs_family');
        logger.success('Auth initialized', { state: member ? 'authenticated' : 'needs_family' });
      } else {
        setAuthState('unauthenticated');
        logger.info('No session found');
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        logger.info('Auth state changed', { event });

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setFamilyMember(null);
          setFamily(null);
          setAuthState('unauthenticated');
        } else if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);

          const { member, family: fam } = await fetchFamilyMember(newSession.user.id);
          setFamilyMember(member);
          setFamily(fam);
          setAuthState(member ? 'authenticated' : 'needs_family');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchFamilyMember]);

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string) => {
    logger.info('Signing in...', { email });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error('Sign in failed', { error: error.message });
      return { error: error.message };
    }

    logger.success('Sign in successful');
    router.push('/');
    return {};
  }, [supabase, router]);

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(async (email: string, password: string, name: string) => {
    logger.info('Signing up...', { email, name });

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      logger.error('Sign up failed', { error: error.message });
      return { error: error.message };
    }

    logger.success('Sign up successful - check email for verification');
    return {};
  }, [supabase]);

  /**
   * Send magic link for passwordless authentication
   * Works for both signup (new users) and login (existing users)
   */
  const sendMagicLink = useCallback(async (email: string, name?: string) => {
    logger.info('Sending magic link...', { email });

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: name ? { name } : undefined,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      logger.error('Magic link failed', { error: error.message });
      return { error: error.message };
    }

    logger.success('Magic link sent');
    return {};
  }, [supabase]);

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    logger.info('Signing out...');
    await supabase.auth.signOut();
    router.push('/login');
    logger.success('Signed out');
  }, [supabase, router]);

  /**
   * Request password reset email
   */
  const resetPassword = useCallback(async (email: string) => {
    logger.info('Requesting password reset...', { email });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      logger.error('Password reset failed', { error: error.message });
      return { error: error.message };
    }

    logger.success('Password reset email sent');
    return {};
  }, [supabase]);

  return {
    authState,
    user,
    session,
    familyMember,
    family,
    signIn,
    signUp,
    sendMagicLink,
    signOut,
    resetPassword,
  };
}
