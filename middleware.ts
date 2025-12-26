/**
 * ============================================================================
 * Next.js Middleware - Route Protection & Onboarding
 * ============================================================================
 *
 * This middleware runs on every request to protected routes.
 *
 * Responsibilities:
 * - Session refresh (keeps users logged in via cookie management)
 * - Protected route redirects (unauthenticated -> login)
 * - Public route handling (login, signup, check-email, auth callback)
 * - Onboarding flow (authenticated users without family -> onboarding)
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

  // Update Supabase Session
  // Refreshes the session, handles cookies, and checks family membership
  const { supabaseResponse, user, hasFamilyMember } = await updateSession(request);

  // --- Public Routes ---
  // Allow access without authentication
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    // If already logged in, redirect based on family membership
    if (user) {
      if (hasFamilyMember) {
        // User has a family, go to dashboard
        return NextResponse.redirect(new URL('/', request.url));
      } else {
        // User needs to complete onboarding
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
    }
    // Continue to public route (not logged in)
    return supabaseResponse;
  }

  // --- Protected Routes ---
  // No user session = redirect to login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // --- Check Family Membership (Onboarding Flow) ---
  // If user is authenticated but has no family member record, redirect to onboarding
  const isOnOnboarding = ONBOARDING_ROUTES.some((route) => pathname.startsWith(route));

  if (!hasFamilyMember && !isOnOnboarding) {
    // User needs to create/join a family first
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // If user already has a family but tries to access onboarding, redirect to dashboard
  if (hasFamilyMember && isOnOnboarding) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // All good - user is authenticated and has appropriate access
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
