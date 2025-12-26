/**
 * ============================================================================
 * 🔗 Google OAuth Callback Handler
 * ============================================================================
 *
 * GET /api/auth/google/callback
 *
 * Handles the OAuth callback from Google:
 * 1. Verifies state parameter (CSRF protection)
 * 2. Exchanges authorization code for tokens
 * 3. Fetches user info and calendar list
 * 4. Stores connection in database
 * 5. Creates default calendar subscriptions
 * 6. Redirects back to settings
 *
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// 📝 CONFIGURATION
// ============================================================================

const GOOGLE_CONFIG = {
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  calendarListUrl: 'https://www.googleapis.com/calendar/v3/users/me/calendarList',
};

function getCallbackUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/google/callback`;
}


// ============================================================================
// 🔧 GOOGLE API HELPERS
// ============================================================================

/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}> {
  const response = await fetch(GOOGLE_CONFIG.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: getCallbackUrl(),
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error('Failed to exchange code for tokens', { error });
    throw new Error('Failed to exchange authorization code');
  }

  return response.json();
}

/**
 * Fetch Google user info
 */
async function fetchUserInfo(accessToken: string): Promise<{
  id: string;
  email: string;
}> {
  const response = await fetch(GOOGLE_CONFIG.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  return response.json();
}

/**
 * Fetch list of calendars from Google Calendar API
 */
async function fetchCalendarList(accessToken: string): Promise<Array<{
  id: string;
  summary: string;
  backgroundColor?: string;
  primary?: boolean;
  accessRole: string;
}>> {
  const response = await fetch(GOOGLE_CONFIG.calendarListUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch calendar list');
  }

  const data = await response.json();
  return data.items || [];
}


// ============================================================================
// 📤 GET HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  logger.info('Google OAuth callback received');

  // Handle OAuth error
  if (error) {
    logger.error('Google OAuth error', { error });
    return redirectToSettings(request, { error });
  }

  // Verify we have a code
  if (!code) {
    logger.error('No authorization code received');
    return redirectToSettings(request, { error: 'no_code' });
  }

  // Verify state parameter (CSRF protection)
  const storedState = request.cookies.get('google_oauth_state')?.value;
  if (!state || state !== storedState) {
    logger.error('State mismatch - possible CSRF attack', {
      received: state?.substring(0, 20),
      stored: storedState?.substring(0, 20)
    });
    return redirectToSettings(request, { error: 'invalid_state' });
  }

  try {
    // ========================================================================
    // 1. VERIFY USER IS AUTHENTICATED
    // ========================================================================

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('User not authenticated during callback');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Get the user's family member record
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select('id, family_id')
      .eq('auth_user_id', user.id)
      .single();

    if (memberError || !member) {
      logger.error('No family member record found', { userId: user.id });
      return redirectToSettings(request, { error: 'no_member' });
    }

    // ========================================================================
    // 2. EXCHANGE CODE FOR TOKENS
    // ========================================================================

    logger.info('Exchanging authorization code for tokens');
    const tokens = await exchangeCodeForTokens(code);

    // Calculate token expiry time
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + tokens.expires_in);

    // ========================================================================
    // 3. FETCH GOOGLE USER INFO
    // ========================================================================

    logger.info('Fetching Google user info');
    const googleUser = await fetchUserInfo(tokens.access_token);

    // ========================================================================
    // 4. STORE CONNECTION IN DATABASE
    // ========================================================================

    // Use admin client to bypass RLS for this operation
    const adminSupabase = createAdminClient();

    // Check if connection already exists
    const { data: existingConnection } = await adminSupabase
      .from('google_calendar_connections')
      .select('id')
      .eq('member_id', member.id)
      .single();

    let connectionId: string;

    if (existingConnection) {
      // Update existing connection
      logger.info('Updating existing Google Calendar connection');
      const { data: updated, error: updateError } = await adminSupabase
        .from('google_calendar_connections')
        .update({
          google_email: googleUser.email,
          google_user_id: googleUser.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: tokenExpiresAt.toISOString(),
          granted_scopes: tokens.scope.split(' '),
          sync_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id)
        .select('id')
        .single();

      if (updateError) {
        logger.error('Failed to update connection', { error: updateError.message });
        throw updateError;
      }
      connectionId = updated!.id;
    } else {
      // Create new connection
      logger.info('Creating new Google Calendar connection');
      const { data: created, error: createError } = await adminSupabase
        .from('google_calendar_connections')
        .insert({
          family_id: member.family_id,
          member_id: member.id,
          google_email: googleUser.email,
          google_user_id: googleUser.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: tokenExpiresAt.toISOString(),
          granted_scopes: tokens.scope.split(' '),
        })
        .select('id')
        .single();

      if (createError) {
        logger.error('Failed to create connection', { error: createError.message });
        throw createError;
      }
      connectionId = created!.id;
    }

    // ========================================================================
    // 5. FETCH AND STORE CALENDAR LIST
    // ========================================================================

    logger.info('Fetching calendar list from Google');
    const calendars = await fetchCalendarList(tokens.access_token);

    // Delete existing subscriptions for this connection
    await adminSupabase
      .from('google_calendar_subscriptions')
      .delete()
      .eq('connection_id', connectionId);

    // Create subscriptions for each calendar
    // By default, only enable the primary calendar
    const subscriptions = calendars.map((cal) => ({
      connection_id: connectionId,
      google_calendar_id: cal.id,
      calendar_name: cal.summary,
      calendar_color: cal.backgroundColor || null,
      is_active: cal.primary === true, // Only enable primary by default
      visibility: 'owner' as const, // Default to private
    }));

    if (subscriptions.length > 0) {
      const { error: subError } = await adminSupabase
        .from('google_calendar_subscriptions')
        .insert(subscriptions);

      if (subError) {
        logger.error('Failed to create subscriptions', { error: subError.message });
        // Non-fatal - continue anyway
      } else {
        logger.success(`Created ${subscriptions.length} calendar subscriptions`);
      }
    }

    // ========================================================================
    // 6. REDIRECT BACK TO SETTINGS
    // ========================================================================

    logger.success('Google Calendar connected successfully', {
      email: googleUser.email,
      calendars: calendars.length,
    });

    // Clear the state cookie
    const response = redirectToSettings(request, { success: 'true' });
    response.cookies.delete('google_oauth_state');

    return response;

  } catch (error) {
    logger.error('Google OAuth callback error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return redirectToSettings(request, { error: 'connection_failed' });
  }
}

/**
 * Helper to redirect to settings page with query params
 */
function redirectToSettings(
  request: NextRequest,
  params: Record<string, string>
): NextResponse {
  const url = new URL('/settings/calendar', request.url);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return NextResponse.redirect(url);
}
