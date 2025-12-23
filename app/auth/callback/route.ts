/**
 * ============================================================================
 * 🔄 Auth Callback Route
 * ============================================================================
 *
 * Handles auth callbacks from Supabase:
 * - Email verification
 * - Password reset
 * - OAuth providers (future)
 *
 * Route: /auth/callback
 *
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  // Get the auth code from the URL
  const code = searchParams.get('code');

  // Where to redirect after authentication
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Success! Redirect to the next page
      console.log('✅ Auth callback successful, redirecting to:', next);
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Log the error for debugging
    console.error('❌ Auth callback error:', error.message);
  }

  // Redirect to error page or login on failure
  console.log('⚠️ Auth callback failed, redirecting to login');
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
