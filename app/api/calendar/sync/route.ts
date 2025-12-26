/**
 * ============================================================================
 * 🔄 Google Calendar Sync API
 * ============================================================================
 *
 * POST /api/calendar/sync
 *
 * Syncs events from Google Calendar to the local external_events table.
 * This is called:
 * - Manually when user clicks "Sync Now"
 * - Periodically via a cron job (Supabase Edge Function)
 *
 * The sync process:
 * 1. Gets the user's Google Calendar connection
 * 2. Refreshes the access token if expired
 * 3. Fetches events from each active subscription
 * 4. Upserts events to the external_events table
 * 5. Cleans up old events
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
  eventsUrl: 'https://www.googleapis.com/calendar/v3/calendars',
};

/**
 * Sync window configuration
 */
const SYNC_CONFIG = {
  daysBack: 7,      // Sync events from 7 days ago
  daysAhead: 60,    // Sync events up to 60 days in the future
  maxResults: 250,  // Max events per calendar per sync
};


// ============================================================================
// 🔧 GOOGLE API HELPERS
// ============================================================================

/**
 * Refresh an expired access token using the refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const response = await fetch(GOOGLE_CONFIG.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error('Failed to refresh access token', { error });
    throw new Error('Failed to refresh access token');
  }

  return response.json();
}

/**
 * Fetch events from a Google Calendar
 */
async function fetchCalendarEvents(
  accessToken: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date
): Promise<Array<{
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  updated?: string;
  colorId?: string;
}>> {
  const url = new URL(`${GOOGLE_CONFIG.eventsUrl}/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.set('timeMin', timeMin.toISOString());
  url.searchParams.set('timeMax', timeMax.toISOString());
  url.searchParams.set('singleEvents', 'true');  // Expand recurring events
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', SYNC_CONFIG.maxResults.toString());

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error('Failed to fetch calendar events', { calendarId, error });
    throw new Error(`Failed to fetch events from calendar: ${calendarId}`);
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Parse Google Calendar event time
 * Returns ISO timestamp and whether it's an all-day event
 */
function parseEventTime(eventTime: { dateTime?: string; date?: string; timeZone?: string }): {
  timestamp: string;
  isAllDay: boolean;
  timezone: string | null;
} {
  if (eventTime.dateTime) {
    return {
      timestamp: eventTime.dateTime,
      isAllDay: false,
      timezone: eventTime.timeZone || null,
    };
  } else if (eventTime.date) {
    // All-day events use date only (YYYY-MM-DD)
    // Convert to start of day in UTC
    return {
      timestamp: new Date(eventTime.date).toISOString(),
      isAllDay: true,
      timezone: null,
    };
  }

  throw new Error('Event has no valid time');
}


// ============================================================================
// 📤 POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  logger.info('🔄 Calendar sync started');

  try {
    // ========================================================================
    // 1. VERIFY USER IS AUTHENTICATED
    // ========================================================================

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('User not authenticated for sync');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user's family member record
    const { data: member } = await supabase
      .from('family_members')
      .select('id, family_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: 'No family member record found' },
        { status: 400 }
      );
    }

    // ========================================================================
    // 2. GET GOOGLE CALENDAR CONNECTION
    // ========================================================================

    const adminSupabase = createAdminClient();

    const { data: connection, error: connError } = await adminSupabase
      .from('google_calendar_connections')
      .select('*')
      .eq('member_id', member.id)
      .single();

    if (connError || !connection) {
      logger.info('No Google Calendar connection found');
      return NextResponse.json(
        { error: 'No Google Calendar connected', synced: 0 },
        { status: 400 }
      );
    }

    // ========================================================================
    // 3. REFRESH ACCESS TOKEN IF NEEDED
    // ========================================================================

    let accessToken = connection.access_token;
    const tokenExpiry = connection.token_expires_at
      ? new Date(connection.token_expires_at)
      : new Date(0);

    // Refresh if token expires in less than 5 minutes
    if (tokenExpiry.getTime() - Date.now() < 5 * 60 * 1000) {
      if (!connection.refresh_token) {
        logger.error('Token expired and no refresh token available');
        await adminSupabase
          .from('google_calendar_connections')
          .update({
            sync_error: 'Token expired. Please reconnect Google Calendar.',
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id);

        return NextResponse.json(
          { error: 'Token expired. Please reconnect Google Calendar.' },
          { status: 401 }
        );
      }

      logger.info('Refreshing access token');
      try {
        const newTokens = await refreshAccessToken(connection.refresh_token);
        accessToken = newTokens.access_token;

        const newExpiry = new Date();
        newExpiry.setSeconds(newExpiry.getSeconds() + newTokens.expires_in);

        await adminSupabase
          .from('google_calendar_connections')
          .update({
            access_token: newTokens.access_token,
            token_expires_at: newExpiry.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id);

        logger.success('Access token refreshed');
      } catch (error) {
        logger.error('Failed to refresh token', {
          error: error instanceof Error ? error.message : 'Unknown',
        });
        await adminSupabase
          .from('google_calendar_connections')
          .update({
            sync_error: 'Failed to refresh token. Please reconnect Google Calendar.',
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id);

        return NextResponse.json(
          { error: 'Failed to refresh token' },
          { status: 401 }
        );
      }
    }

    // ========================================================================
    // 4. GET ACTIVE SUBSCRIPTIONS
    // ========================================================================

    const { data: subscriptions } = await adminSupabase
      .from('google_calendar_subscriptions')
      .select('*')
      .eq('connection_id', connection.id)
      .eq('is_active', true);

    if (!subscriptions || subscriptions.length === 0) {
      logger.info('No active calendar subscriptions');
      return NextResponse.json({ synced: 0 });
    }

    // ========================================================================
    // 5. SYNC EVENTS FROM EACH CALENDAR
    // ========================================================================

    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - SYNC_CONFIG.daysBack);

    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + SYNC_CONFIG.daysAhead);

    let totalSynced = 0;

    for (const subscription of subscriptions) {
      try {
        logger.info('Syncing calendar', { name: subscription.calendar_name });

        const events = await fetchCalendarEvents(
          accessToken,
          subscription.google_calendar_id,
          timeMin,
          timeMax
        );

        // Transform events for database
        const dbEvents = events
          .filter(event => event.start && event.summary) // Must have start time and title
          .map(event => {
            const startInfo = parseEventTime(event.start);
            const endInfo = event.end ? parseEventTime(event.end) : null;

            return {
              family_id: member.family_id,
              subscription_id: subscription.id,
              google_event_id: event.id,
              title: event.summary || 'Untitled Event',
              description: event.description || null,
              location: event.location || null,
              start_time: startInfo.timestamp,
              end_time: endInfo?.timestamp || null,
              is_all_day: startInfo.isAllDay,
              original_timezone: startInfo.timezone,
              color: subscription.calendar_color,
              google_updated_at: event.updated || null,
              fetched_at: new Date().toISOString(),
            };
          });

        if (dbEvents.length > 0) {
          // Delete existing events for this subscription in the time window
          await adminSupabase
            .from('external_events')
            .delete()
            .eq('subscription_id', subscription.id)
            .gte('start_time', timeMin.toISOString())
            .lte('start_time', timeMax.toISOString());

          // Insert new events
          const { error: insertError } = await adminSupabase
            .from('external_events')
            .insert(dbEvents);

          if (insertError) {
            logger.error('Failed to insert events', {
              calendar: subscription.calendar_name,
              error: insertError.message,
            });
          } else {
            totalSynced += dbEvents.length;
            logger.success(`Synced ${dbEvents.length} events from ${subscription.calendar_name}`);
          }
        }
      } catch (error) {
        logger.error('Failed to sync calendar', {
          calendar: subscription.calendar_name,
          error: error instanceof Error ? error.message : 'Unknown',
        });
        // Continue with other calendars
      }
    }

    // ========================================================================
    // 6. UPDATE CONNECTION STATUS
    // ========================================================================

    await adminSupabase
      .from('google_calendar_connections')
      .update({
        last_synced_at: new Date().toISOString(),
        sync_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id);

    const duration = Date.now() - startTime;
    logger.success('Calendar sync completed', {
      synced: totalSynced,
      durationMs: duration,
    });

    return NextResponse.json({
      synced: totalSynced,
      subscriptions: subscriptions.length,
      durationMs: duration,
    });

  } catch (error) {
    logger.error('Calendar sync error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    );
  }
}
