/**
 * ============================================================================
 * 🔄 Auth Callback Route Handler
 * ============================================================================
 * 
 * Handles authentication callbacks from Supabase, including:
 * - Magic link authentication (OTP)
 * - Email verification
 * - Password reset (if implemented in future)
 * - OAuth providers (future)
 * 
 * Flow:
 * 1. User clicks magic link in email
 * 2. Link contains auth code/token as query param
 * 3. This route exchanges the code for a session
 * 4. User is redirected to the app (authenticated)
 * 
 * Route: /auth/callback
 * 
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET handler for auth callback
 * 
 * Supabase sends users here after clicking magic links.
 * We exchange the code for a session and redirect.
 * 
 * @param request - The incoming request with auth code
 * @returns Redirect response to app or error page
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  // ━━━━━ Extract Auth Parameters ━━━━━
  // Supabase magic links include a 'code' parameter
  const code = searchParams.get('code');
  
  // Where to redirect after successful authentication
  // Defaults to home if not specified
  const next = searchParams.get('next') ?? '/';
  
  // Error handling - check for Supabase error params
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // ━━━━━ Handle Errors from Supabase ━━━━━
  if (errorParam) {
    console.error('❌ Auth callback received error:', errorParam, errorDescription);
    // Redirect to login with error message
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || errorParam)}`
    );
  }

  // ━━━━━ Exchange Code for Session ━━━━━
  if (code) {
    const supabase = await createClient();

    // Exchange the one-time code for a session
    // This validates the magic link and creates an authenticated session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      // ✅ Success! User is now authenticated
      console.log('✅ Auth callback successful, redirecting to:', next);
      
      // Redirect to the intended destination
      // Using 302 redirect to allow browser to update cookies
      return NextResponse.redirect(`${origin}${next}`);
    }

    // ❌ Code exchange failed
    console.error('❌ Auth callback - code exchange failed:', exchangeError.message);
    
    // Redirect to login with helpful error message
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('The magic link has expired or is invalid. Please request a new one.')}`
    );
  }

  // ━━━━━ No Code Provided ━━━━━
  // This shouldn't happen with valid magic links
  console.warn('⚠️ Auth callback called without code parameter');
  
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('Invalid authentication link. Please try signing in again.')}`
  );
}
