/**
 * ============================================================================
 * Supabase Middleware Client
 * ============================================================================
 *
 * This creates a Supabase client specifically for Next.js middleware.
 * It handles cookie refresh, session management, and family membership
 * verification at the edge.
 *
 * Key responsibilities:
 * - Refresh auth session cookies
 * - Validate user authentication
 * - Check family membership for onboarding flow
 *
 * ============================================================================
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Result of session update including family membership status
 */
export interface SessionResult {
  supabaseResponse: NextResponse;
  user: Awaited<ReturnType<ReturnType<typeof createServerClient>['auth']['getUser']>>['data']['user'];
  hasFamilyMember: boolean;
}

/**
 * Update the Supabase session in middleware
 * This should be called in middleware.ts to refresh the session
 * and check family membership status.
 *
 * @param request - The incoming Next.js request
 * @returns Response with updated cookies, user, and family membership status
 */
export async function updateSession(request: NextRequest): Promise<SessionResult> {
  // Create a response that we can modify
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Create the Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies on the request (for downstream middleware/route handlers)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          // Create a new response with updated cookies
          supabaseResponse = NextResponse.next({
            request,
          });

          // Set cookies on the response (for the browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Don't use getSession() here - it doesn't refresh the session.
  // Use getUser() which validates the session with the Supabase Auth server.
  // This ensures the session is fresh and cookies are updated.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user has a family member record (for onboarding flow)
  let hasFamilyMember = false;
  if (user) {
    const { data: member } = await supabase
      .from('family_members')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    hasFamilyMember = !!member;
  }

  return { supabaseResponse, user, hasFamilyMember };
}
