/**
 * ============================================================================
 * 🔗 Google OAuth Routes
 * ============================================================================
 *
 * Handles Google OAuth flow for Calendar integration:
 *
 * GET /api/auth/google
 *   - Initiates OAuth flow, redirects to Google
 *
 * GET /api/auth/google?code=...
 *   - Handles OAuth callback, exchanges code for tokens
 *
 * Required environment variables:
 *   - GOOGLE_CLIENT_ID: OAuth client ID from Google Cloud Console
 *   - GOOGLE_CLIENT_SECRET: OAuth client secret
 *   - NEXT_PUBLIC_APP_URL: Base URL for redirects (e.g., http://localhost:3000)
 *
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// 📝 CONFIGURATION
// ============================================================================

/**
 * Google OAuth configuration
 */
const GOOGLE_CONFIG = {
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  calendarListUrl: 'https://www.googleapis.com/calendar/v3/users/me/calendarList',

  // Scopes required for calendar read access
  scopes: [
    'openid',
    'email',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events.readonly',
  ],
};

/**
 * Get the callback URL for OAuth
 */
function getCallbackUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/google/callback`;
}

/**
 * Check if Google OAuth is configured
 */
function isGoogleConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
  );
}


// ============================================================================
// 📤 GET HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Check if Google OAuth is configured
  if (!isGoogleConfigured()) {
    logger.error('Google OAuth not configured');
    return NextResponse.json(
      {
        error: 'Google Calendar integration is not configured',
        message: 'Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables',
      },
      { status: 503 }
    );
  }

  // Handle OAuth error from Google
  if (error) {
    logger.error('Google OAuth error', { error });
    const redirectUrl = new URL('/settings/calendar', request.url);
    redirectUrl.searchParams.set('error', error);
    return NextResponse.redirect(redirectUrl);
  }

  // If no code, initiate OAuth flow
  if (!code) {
    return initiateOAuth(request);
  }

  // If we have a code, this shouldn't happen (callback is separate route)
  // But handle it gracefully
  logger.warn('Received code on main route, should use /callback');
  return NextResponse.redirect(new URL('/settings/calendar', request.url));
}

/**
 * Initiate the OAuth flow by redirecting to Google
 */
async function initiateOAuth(request: NextRequest) {
  logger.info('Initiating Google OAuth flow');

  // Verify user is authenticated
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.error('User not authenticated for OAuth');
    return NextResponse.redirect(new URL('/login?redirect=/settings/calendar', request.url));
  }

  // Generate state parameter for CSRF protection
  // In production, store this in a secure cookie or session
  const state = Buffer.from(JSON.stringify({
    userId: user.id,
    timestamp: Date.now(),
    random: Math.random().toString(36).substring(7),
  })).toString('base64url');

  // Build Google OAuth URL
  const authUrl = new URL(GOOGLE_CONFIG.authUrl);
  authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
  authUrl.searchParams.set('redirect_uri', getCallbackUrl());
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', GOOGLE_CONFIG.scopes.join(' '));
  authUrl.searchParams.set('access_type', 'offline'); // Get refresh token
  authUrl.searchParams.set('prompt', 'consent'); // Always show consent to get refresh token
  authUrl.searchParams.set('state', state);

  logger.info('Redirecting to Google OAuth', { authUrl: authUrl.toString() });

  // Set state in a cookie for verification on callback
  const response = NextResponse.redirect(authUrl);
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}
