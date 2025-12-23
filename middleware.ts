/**
 * ============================================================================
 * 🛡️ Next.js Middleware
 * ============================================================================
 *
 * This middleware runs on every request to protected routes.
 * It handles:
 * - Session refresh (keeps users logged in)
 * - Protected route redirects
 * - Onboarding flow (new users need to create/join a family)
 *
 * ============================================================================
 */

import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/auth/callback'];

// Routes for family setup (after login, before dashboard)
const ONBOARDING_ROUTES = ['/onboarding'];

/**
 * Middleware function - runs on every matching request
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ━━━━━ Update Supabase Session ━━━━━
  // This refreshes the session and handles cookie management
  const { supabaseResponse, user } = await updateSession(request);

  // ━━━━━ Public Routes ━━━━━
  // Allow access without authentication
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    // If already logged in, redirect to dashboard
    if (user) {
      console.log('🔀 Redirecting authenticated user from public route to /');
      return NextResponse.redirect(new URL('/', request.url));
    }
    return supabaseResponse;
  }

  // ━━━━━ Protected Routes ━━━━━
  // No user = redirect to login
  if (!user) {
    console.log('🔒 No session, redirecting to /login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ━━━━━ Check Family Membership ━━━━━
  // For MVP, we'll skip this check and handle it client-side
  // In production, you'd check if the user has a family_member record

  // ━━━━━ All Good! ━━━━━
  return supabaseResponse;
}

/**
 * Configure which routes the middleware runs on
 *
 * We exclude:
 * - Static files (_next/static)
 * - Image optimization files (_next/image)
 * - Favicon and other static assets
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
