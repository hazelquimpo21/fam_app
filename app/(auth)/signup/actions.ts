'use server';

/**
 * ============================================================================
 * 🔐 Signup Server Actions
 * ============================================================================
 *
 * Server-side signup action that creates users with auto-confirmation.
 * This bypasses the need for email confirmation during development.
 *
 * ============================================================================
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

interface SignupResult {
  success: boolean;
  error?: string;
  userId?: string;
}

/**
 * Sign up a new user with auto-confirmation
 *
 * Uses the admin client to create the user, which:
 * 1. Bypasses email confirmation requirement
 * 2. Immediately activates the account
 * 3. Allows the user to sign in right away
 */
export async function signupUser(
  email: string,
  password: string,
  name: string
): Promise<SignupResult> {
  try {
    const adminClient = createAdminClient();

    // Create user with admin privileges (auto-confirms email)
    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { name },
    });

    if (createError) {
      console.error('[Signup] Admin create user failed:', createError.message);

      // Handle specific errors
      if (createError.message.includes('already registered')) {
        return { success: false, error: 'An account with this email already exists' };
      }

      return { success: false, error: createError.message };
    }

    if (!userData.user) {
      return { success: false, error: 'Failed to create user' };
    }

    console.log('[Signup] User created successfully:', userData.user.id);

    // Sign in the user immediately after creation
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('[Signup] Auto sign-in failed:', signInError.message);
      // User was created, just couldn't auto-sign in - not critical
      return {
        success: true,
        userId: userData.user.id,
        error: 'Account created! Please sign in manually.'
      };
    }

    console.log('[Signup] User signed in successfully');
    return { success: true, userId: userData.user.id };

  } catch (error) {
    console.error('[Signup] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}
