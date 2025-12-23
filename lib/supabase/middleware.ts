/**
 * ============================================================================
 * 🛡️ Supabase Middleware Client
 * ============================================================================
 *
 * This creates a Supabase client specifically for Next.js middleware.
 * It handles cookie refresh and session management at the edge.
 *
 * ============================================================================
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Update the Supabase session in middleware
 * This should be called in middleware.ts to refresh the session
 *
 * @param request - The incoming Next.js request
 * @returns Response with updated cookies
 */
export async function updateSession(request: NextRequest) {
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

  return { supabaseResponse, user };
}
