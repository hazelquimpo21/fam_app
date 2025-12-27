/**
 * ============================================================================
 * 📅 ICS Calendar Feed Endpoint
 * ============================================================================
 *
 * GET /api/calendar/feed/[token].ics
 *
 * Serves an ICS calendar feed that can be subscribed to by any calendar app
 * (Google Calendar, Apple Calendar, Outlook, etc.).
 *
 * Authentication:
 * - No user auth required (the token IS the auth)
 * - Token is a 48-char hex string, unguessable
 * - Token lookup uses admin client (bypasses RLS)
 *
 * Caching:
 * - Response is cacheable for 5 minutes (calendar apps refresh periodically)
 * - ETag based on content hash for conditional requests
 *
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateICS, DEFAULT_DAYS_AHEAD } from '@/lib/utils/ics-generator';
import { logger } from '@/lib/utils/logger';
import type { Task, Meal, Goal, FamilyMember, Family } from '@/types/database';
import type { CalendarFeed, FamilyEvent, Birthday } from '@/types/calendar';

// ============================================================================
// 🛠️ HELPERS
// ============================================================================

/**
 * Generate a simple hash for ETag purposes.
 * Not cryptographically secure, just for cache validation.
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Clean the token from the URL (remove .ics extension if present).
 */
function cleanToken(token: string): string {
  // Handle both /feed/abc123 and /feed/abc123.ics
  return token.replace(/\.ics$/i, '');
}


// ============================================================================
// 📤 GET HANDLER
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const startTime = Date.now();
  const { token: rawToken } = await params;
  const token = cleanToken(rawToken);

  logger.info('📅 ICS feed request received', { tokenPrefix: token.substring(0, 8) + '...' });

  try {
    // ========================================================================
    // 1. VALIDATE TOKEN AND GET FEED CONFIG
    // ========================================================================

    const supabase = createAdminClient();

    // Look up the feed by token (admin client bypasses RLS)
    const { data: feed, error: feedError } = await supabase
      .from('calendar_feeds')
      .select('*')
      .eq('token', token)
      .single();

    if (feedError || !feed) {
      logger.warn('Invalid calendar feed token', { tokenPrefix: token.substring(0, 8) + '...' });
      return new NextResponse('Calendar feed not found', { status: 404 });
    }

    const feedData = feed as CalendarFeed;
    logger.info('Feed found', {
      feedId: feedData.id,
      familyId: feedData.family_id,
      includeTasks: feedData.include_tasks,
      includeMeals: feedData.include_meals,
      includeGoals: feedData.include_goals,
      includeEvents: feedData.include_events,
      includeBirthdays: feedData.include_birthdays,
    });

    // ========================================================================
    // 2. UPDATE ACCESS TRACKING (fire and forget)
    // ========================================================================

    // Don't await - we don't want to slow down the response
    supabase.rpc('update_calendar_feed_access', { feed_token: token }).catch((err) => {
      logger.warn('Failed to update feed access tracking', { error: err.message });
    });

    // ========================================================================
    // 3. FETCH FAMILY DATA
    // ========================================================================

    // Get family info
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('id, name')
      .eq('id', feedData.family_id)
      .single();

    if (familyError || !family) {
      logger.error('Family not found for feed', { familyId: feedData.family_id });
      return new NextResponse('Family not found', { status: 404 });
    }

    // Get family members (for assignee names in events)
    const { data: members } = await supabase
      .from('family_members')
      .select('id, name, color')
      .eq('family_id', feedData.family_id);

    // ========================================================================
    // 4. FETCH TASKS (if included)
    // ========================================================================

    let tasks: Task[] = [];
    if (feedData.include_tasks) {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + DEFAULT_DAYS_AHEAD);

      let taskQuery = supabase
        .from('tasks')
        .select('*')
        .eq('family_id', feedData.family_id)
        .is('deleted_at', null)
        .neq('status', 'done')
        .or(`due_date.lte.${futureDate.toISOString().split('T')[0]},scheduled_date.lte.${futureDate.toISOString().split('T')[0]}`);

      // If this is a personal feed, filter by member
      if (feedData.member_id) {
        taskQuery = taskQuery.eq('assigned_to_id', feedData.member_id);
      }

      const { data: taskData, error: taskError } = await taskQuery;

      if (taskError) {
        logger.error('Failed to fetch tasks', { error: taskError.message });
      } else {
        tasks = (taskData || []) as Task[];
      }
    }

    // ========================================================================
    // 5. FETCH MEALS (if included)
    // ========================================================================

    let meals: Meal[] = [];
    if (feedData.include_meals) {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + DEFAULT_DAYS_AHEAD);

      const { data: mealData, error: mealError } = await supabase
        .from('meals')
        .select('*, recipe:recipes(id, title)')
        .eq('family_id', feedData.family_id)
        .gte('meal_date', today)
        .lte('meal_date', futureDate.toISOString().split('T')[0])
        .order('meal_date');

      if (mealError) {
        logger.error('Failed to fetch meals', { error: mealError.message });
      } else {
        meals = (mealData || []) as Meal[];
      }
    }

    // ========================================================================
    // 6. FETCH GOALS (if included)
    // ========================================================================

    let goals: Goal[] = [];
    if (feedData.include_goals) {
      let goalQuery = supabase
        .from('goals')
        .select('*')
        .eq('family_id', feedData.family_id)
        .is('deleted_at', null)
        .eq('status', 'active')
        .not('target_date', 'is', null);

      // If personal feed, filter by owner or family goals
      if (feedData.member_id) {
        goalQuery = goalQuery.or(`owner_id.eq.${feedData.member_id},is_family_goal.eq.true`);
      }

      const { data: goalData, error: goalError } = await goalQuery;

      if (goalError) {
        logger.error('Failed to fetch goals', { error: goalError.message });
      } else {
        goals = (goalData || []) as Goal[];
      }
    }

    // ========================================================================
    // 7. FETCH FAMILY EVENTS (if included)
    // ========================================================================

    let events: FamilyEvent[] = [];
    if (feedData.include_events) {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + DEFAULT_DAYS_AHEAD);

      let eventQuery = supabase
        .from('family_events')
        .select('*')
        .eq('family_id', feedData.family_id)
        .gte('start_time', today)
        .lte('start_time', futureDate.toISOString())
        .order('start_time');

      // If personal feed, filter by assigned_to
      if (feedData.member_id) {
        eventQuery = eventQuery.or(`assigned_to.eq.${feedData.member_id},assigned_to.is.null`);
      }

      const { data: eventData, error: eventError } = await eventQuery;

      if (eventError) {
        logger.error('Failed to fetch events', { error: eventError.message });
      } else {
        events = (eventData || []) as FamilyEvent[];
      }
    }

    // ========================================================================
    // 8. FETCH BIRTHDAYS (if included)
    // ========================================================================

    let birthdays: Birthday[] = [];
    if (feedData.include_birthdays) {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + DEFAULT_DAYS_AHEAD);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      // Use the get_birthdays_in_range function
      const { data: birthdayData, error: birthdayError } = await supabase
        .rpc('get_birthdays_in_range', {
          p_family_id: feedData.family_id,
          p_start_date: today,
          p_end_date: futureDateStr,
        });

      if (birthdayError) {
        logger.error('Failed to fetch birthdays', { error: birthdayError.message });
      } else {
        birthdays = (birthdayData || []) as Birthday[];
      }
    }

    // ========================================================================
    // 9. GENERATE ICS CONTENT
    // ========================================================================

    const icsContent = generateICS(
      {
        familyName: `${(family as Family).name} (Fam)`,
        tasks,
        meals,
        goals,
        events,
        birthdays,
        members: (members || []) as FamilyMember[],
      },
      {
        familyId: feedData.family_id,
        memberId: feedData.member_id,
        includeTasks: feedData.include_tasks,
        includeMeals: feedData.include_meals,
        includeGoals: feedData.include_goals,
        includeEvents: feedData.include_events ?? true,
        includeBirthdays: feedData.include_birthdays ?? false,
      }
    );

    // ========================================================================
    // 10. BUILD RESPONSE WITH PROPER HEADERS
    // ========================================================================

    // Generate ETag for caching
    const etag = `"${simpleHash(icsContent)}"`;

    // Check for conditional request (If-None-Match)
    const ifNoneMatch = request.headers.get('If-None-Match');
    if (ifNoneMatch === etag) {
      logger.info('Returning 304 Not Modified');
      return new NextResponse(null, { status: 304 });
    }

    const duration = Date.now() - startTime;
    logger.success('ICS feed served', {
      feedId: feedData.id,
      tasks: tasks.length,
      meals: meals.length,
      goals: goals.length,
      events: events.length,
      birthdays: birthdays.length,
      bytes: icsContent.length,
      durationMs: duration,
    });

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        // ICS content type
        'Content-Type': 'text/calendar; charset=utf-8',

        // Suggest filename for downloads
        'Content-Disposition': `inline; filename="${feedData.name.replace(/[^a-zA-Z0-9]/g, '_')}.ics"`,

        // Caching: allow caching for 5 minutes
        // Calendar apps typically refresh every 15-30 minutes anyway
        'Cache-Control': 'public, max-age=300, s-maxage=300',

        // ETag for conditional requests
        'ETag': etag,

        // CORS: allow any origin (feeds are public by design)
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    logger.error('ICS feed error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return new NextResponse('Internal server error', { status: 500 });
  }
}


// ============================================================================
// 🔧 OPTIONS HANDLER (CORS preflight)
// ============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, If-None-Match',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}
