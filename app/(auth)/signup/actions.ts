/**
 * ============================================================================
 * 🔐 Signup Server Actions (Magic Link)
 * ============================================================================
 * 
 * Server-side actions for magic link authentication.
 * 
 * Note: With magic link auth, most signup logic happens client-side
 * via Supabase's signInWithOtp(). This file is kept for potential
 * server-side operations like:
 * - Admin user creation
 * - Invite-based signup
 * - Analytics tracking
 * 
 * For standard magic link signup, see the signup page component.
 * 
 * ============================================================================
 */

'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * Result type for signup operations
 */
interface SignupResult {
  success: boolean;
  error?: string;
  userId?: string;
}

/**
 * Create a new user via admin API
 * 
 * This bypasses the normal signup flow and is useful for:
 * - Creating users during testing
 * - Admin-initiated user creation
 * - Invite-based signups where we want immediate activation
 * 
 * Note: For standard signups, users should use magic links.
 * 
 * @param email - User's email address
 * @param name - User's display name
 * @returns SignupResult with success status and optional error
 */
export async function createUserViaAdmin(
  email: string,
  name: string
): Promise<SignupResult> {
  try {
    const adminClient = createAdminClient();

    // Create user with admin privileges
    // This auto-confirms the email, allowing immediate access
    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true, // Auto-confirm email
      user_metadata: { name },
    });

    if (createError) {
      console.error('[Admin Signup] Create user failed:', createError.message);

      // Handle specific error cases
      if (createError.message.includes('already registered')) {
        return { success: false, error: 'An account with this email already exists' };
      }

      return { success: false, error: createError.message };
    }

    if (!userData.user) {
      return { success: false, error: 'Failed to create user' };
    }

    console.log('[Admin Signup] User created successfully:', userData.user.id);
    return { success: true, userId: userData.user.id };

  } catch (error) {
    console.error('[Admin Signup] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Send magic link to an existing user
 * Server-side variant for cases where we need server control
 * 
 * @param email - Email address to send magic link to
 * @returns SignupResult with success status
 */
export async function sendMagicLinkServer(email: string): Promise<SignupResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Server-side doesn't have window.location, so use env var
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/callback`,
      },
    });

    if (error) {
      console.error('[Magic Link] Failed to send:', error.message);
      return { success: false, error: error.message };
    }

    console.log('[Magic Link] Sent successfully to:', email);
    return { success: true };

  } catch (error) {
    console.error('[Magic Link] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
