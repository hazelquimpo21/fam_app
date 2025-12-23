/**
 * ============================================================================
 * 🛡️ Next.js Middleware - Route Protection
 * ============================================================================
 * 
 * This middleware runs on every request to protected routes.
 * 
 * Responsibilities:
 * - Session refresh (keeps users logged in via cookie management)
 * - Protected route redirects (unauthenticated → login)
 * - Public route handling (login, signup, check-email, auth callback)
 * - Onboarding flow (authenticated users without family → onboarding)
 * 
 * Works with Supabase Magic Link authentication.
 * 
 * ============================================================================
 */

import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Routes that don't require authentication
 * Users can access these without being logged in
 */
const PUBLIC_ROUTES = [
  '/login',       // Magic link login page
  '/signup',      // Magic link signup page
  '/check-email', // Confirmation after sending magic link
  '/auth/callback', // Supabase auth callback for magic links
];

/**
 * Routes for family setup (after login, before dashboard)
 * User is authenticated but hasn't created/joined a family yet
 */
const ONBOARDING_ROUTES = ['/onboarding'];

/**
 * Middleware function
 * Runs on every matching request before it reaches the page
 * 
 * @param request - The incoming Next.js request
 * @returns Response (redirect or continue)
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ━━━━━ Update Supabase Session ━━━━━
  // Refreshes the session and handles cookie management
  // This keeps users logged in across page navigations
  const { supabaseResponse, user } = await updateSession(request);

  // ━━━━━ Public Routes ━━━━━
  // Allow access without authentication
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    // If already logged in, redirect to dashboard
    // (Prevents authenticated users from seeing login page)
    if (user) {
      console.log('🔀 Authenticated user on public route, redirecting to /');
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Continue to public route
    return supabaseResponse;
  }

  // ━━━━━ Protected Routes ━━━━━
  // No user session = redirect to login
  if (!user) {
    console.log('🔒 No session, redirecting to /login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ━━━━━ Check Family Membership ━━━━━
  // For MVP, we skip this check and handle it client-side
  // In production, you'd verify the user has a family_member record
  // and redirect to /onboarding if not
  //
  // TODO: Implement server-side family check for onboarding redirect
  // const hasFamilyMember = await checkFamilyMembership(user.id);
  // if (!hasFamilyMember && !ONBOARDING_ROUTES.some(r => pathname.startsWith(r))) {
  //   return NextResponse.redirect(new URL('/onboarding', request.url));
  // }

  // ━━━━━ All Good! ━━━━━
  // User is authenticated and can access the route
  return supabaseResponse;
}

/**
 * Configure which routes the middleware runs on
 * 
 * Excludes:
 * - _next/static (static files)
 * - _next/image (image optimization)
 * - favicon.ico and other static assets
 * - Common image formats
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Common image formats
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
