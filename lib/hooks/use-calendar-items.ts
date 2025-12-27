'use client';

/**
 * ============================================================================
 * 📅 Unified Calendar Items Hook
 * ============================================================================
 *
 * This hook combines multiple data sources into a single, sorted timeline:
 * - Family Events (Fam-native appointments, meetings, activities)
 * - External Events (imported from Google Calendar)
 * - Birthdays (from family members and contacts)
 *
 * WHY THIS EXISTS:
 * The Today page and Calendar view need to show ALL events together in
 * chronological order. Without this hook, we'd need to fetch and merge
 * data in each component, leading to duplicate code and inconsistent UX.
 *
 * HOW IT WORKS:
 * 1. Fetches data from three sources in parallel (using React Query)
 * 2. Transforms each source into the unified CalendarItem format
 * 3. Sorts by start time (all-day events first, then by time)
 * 4. Returns a single array ready for display
 *
 * USAGE:
 * ```tsx
 * // On Today page
 * const { data: items } = useTodayCalendarItems();
 *
 * // For a date range (Calendar view)
 * const { data: items } = useCalendarItems('2024-12-01', '2024-12-31');
 * ```
 *
 * DATA FLOW:
 * family_events table ──┐
 * external_events table ├── useCalendarItems hook ── CalendarItem[] ── UI
 * get_birthdays_in_range ┘
 *
 * See types/calendar.ts for CalendarItem type definition.
 * See AI_Dev_Docs/17-family-events.md for full documentation.
 *
 * ============================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query-keys';
import { logger } from '@/lib/utils/logger';
import type {
  CalendarItem,
  CalendarItemType,
  FamilyEventWithAssignee,
  ExternalEvent,
  Birthday,
} from '@/types/calendar';


// ============================================================================
// 🔧 TRANSFORMER FUNCTIONS
// ============================================================================

/**
 * Transform a FamilyEvent into a CalendarItem.
 *
 * Family events are Fam-native and can be edited.
 * Color comes from the event itself or the assignee's color.
 *
 * @param event - The family event from database
 * @returns CalendarItem for unified display
 */
function transformFamilyEvent(event: FamilyEventWithAssignee): CalendarItem {
  return {
    id: `event-${event.id}`,
    title: event.title,
    start: new Date(event.start_time),
    end: event.end_time ? new Date(event.end_time) : undefined,
    isAllDay: event.is_all_day,
    color: event.color || event.assignee?.color || '#6366F1', // Indigo default
    type: 'event',
    sourceId: event.id,
    icon: event.icon || undefined,
    location: event.location || undefined,
    description: event.description || undefined,
    assignee: event.assignee ? {
      id: event.assignee.id,
      name: event.assignee.name,
      color: event.assignee.color,
    } : undefined,
  };
}

/**
 * Transform an ExternalEvent (Google Calendar) into a CalendarItem.
 *
 * External events are read-only imports from Google Calendar.
 * They show the calendar name to distinguish from Fam events.
 *
 * @param event - The external event from database
 * @param calendarName - Name of the source calendar (optional)
 * @returns CalendarItem for unified display
 */
function transformExternalEvent(
  event: ExternalEvent,
  calendarName?: string
): CalendarItem {
  return {
    id: `external-${event.id}`,
    title: event.title,
    start: new Date(event.start_time),
    end: event.end_time ? new Date(event.end_time) : undefined,
    isAllDay: event.is_all_day,
    color: event.color || '#DB4437', // Google red default
    type: 'external',
    sourceId: event.id,
    location: event.location || undefined,
    description: event.description || undefined,
    calendarName: calendarName || 'Google Calendar',
  };
}

/**
 * Transform a Birthday into a CalendarItem.
 *
 * Birthdays are always all-day events with a cake icon.
 * The title includes the person's name and age.
 *
 * @param birthday - The birthday from get_birthdays_in_range
 * @returns CalendarItem for unified display
 */
function transformBirthday(birthday: Birthday): CalendarItem {
  return {
    id: `birthday-${birthday.source_id}-${birthday.display_date}`,
    title: `${birthday.name}'s Birthday`,
    start: new Date(birthday.display_date),
    isAllDay: true,
    color: '#EC4899', // Pink for birthdays
    type: 'birthday',
    sourceId: birthday.source_id,
    icon: '🎂',
    meta: {
      ageTurning: birthday.age_turning,
    },
  };
}


// ============================================================================
// 📊 SORTING & FILTERING
// ============================================================================

/**
 * Sort calendar items by start time.
 *
 * Sorting rules:
 * 1. All-day events appear before timed events on the same day
 * 2. Timed events are sorted by start time (earliest first)
 * 3. Events at the same time are sorted by type (birthday, event, external)
 *
 * @param items - Array of calendar items to sort
 * @returns Sorted array (original array is not modified)
 */
function sortCalendarItems(items: CalendarItem[]): CalendarItem[] {
  return [...items].sort((a, b) => {
    // Compare by date first (ignoring time for all-day comparison)
    const aDate = a.start.toDateString();
    const bDate = b.start.toDateString();

    if (aDate !== bDate) {
      return a.start.getTime() - b.start.getTime();
    }

    // Same day: all-day events come first
    if (a.isAllDay && !b.isAllDay) return -1;
    if (!a.isAllDay && b.isAllDay) return 1;

    // Both all-day or both timed: sort by time
    if (a.start.getTime() !== b.start.getTime()) {
      return a.start.getTime() - b.start.getTime();
    }

    // Same time: sort by type priority (birthday > event > external)
    const typePriority: Record<CalendarItemType, number> = {
      birthday: 0,
      event: 1,
      external: 2,
      task: 3,
      meal: 4,
    };
    return typePriority[a.type] - typePriority[b.type];
  });
}


// ============================================================================
// 📅 MAIN HOOKS
// ============================================================================

/**
 * Fetch all calendar items for today.
 *
 * This is the primary hook for the Today page. It fetches:
 * - Today's family events (from family_events table)
 * - Today's external events (from external_events table)
 * - Today's birthdays (from get_birthdays_in_range function)
 *
 * All items are merged and sorted by time for a unified timeline.
 *
 * @example
 * ```tsx
 * function TodaySchedule() {
 *   const { data: items, isLoading } = useTodayCalendarItems();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (!items?.length) return <EmptyState />;
 *
 *   return (
 *     <div>
 *       {items.map(item => (
 *         <ScheduleCard key={item.id} item={item} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns Query result with sorted array of CalendarItems
 */
export function useTodayCalendarItems() {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.calendarItems.today(),
    queryFn: async (): Promise<CalendarItem[]> => {
      logger.info('📅 Fetching today\'s calendar items...');

      // Calculate today's date range in local timezone
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const startISO = startOfDay.toISOString();
      const endISO = endOfDay.toISOString();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

      logger.debug('Date range:', { startISO, endISO, todayStr });

      // Get current user's family ID (needed for birthdays)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.warn('No authenticated user - returning empty calendar');
        return [];
      }

      const { data: member } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!member) {
        logger.warn('No family member record - returning empty calendar');
        return [];
      }

      // Fetch all data sources in parallel for performance
      // This is a key optimization - we don't wait for each query sequentially
      const [familyEventsResult, externalEventsResult, birthdaysResult] = await Promise.all([
        // 1. Family events (Fam-native)
        supabase
          .from('family_events')
          .select(`
            *,
            assignee:assigned_to(id, name, color)
          `)
          .gte('start_time', startISO)
          .lte('start_time', endISO)
          .order('start_time'),

        // 2. External events (Google Calendar imports)
        supabase
          .from('external_events')
          .select('*')
          .gte('start_time', startISO)
          .lte('start_time', endISO)
          .order('start_time'),

        // 3. Birthdays (from family members and contacts)
        supabase
          .rpc('get_birthdays_in_range', {
            p_family_id: member.family_id,
            p_start_date: todayStr,
            p_end_date: todayStr,
          }),
      ]);

      // Log results for debugging
      logger.debug('Data fetched:', {
        familyEvents: familyEventsResult.data?.length ?? 0,
        externalEvents: externalEventsResult.data?.length ?? 0,
        birthdays: birthdaysResult.data?.length ?? 0,
        errors: {
          familyEvents: familyEventsResult.error?.message,
          externalEvents: externalEventsResult.error?.message,
          birthdays: birthdaysResult.error?.message,
        },
      });

      // Transform each source into CalendarItems
      const items: CalendarItem[] = [];

      // Add family events
      if (familyEventsResult.data) {
        for (const event of familyEventsResult.data) {
          const transformed = transformFamilyEvent({
            ...event,
            assignee: event.assignee ? {
              id: event.assignee.id,
              name: event.assignee.name,
              color: event.assignee.color,
            } : undefined,
          } as FamilyEventWithAssignee);
          items.push(transformed);
        }
      }

      // Add external events (Google Calendar)
      if (externalEventsResult.data) {
        for (const event of externalEventsResult.data) {
          items.push(transformExternalEvent(event as ExternalEvent));
        }
      }

      // Add birthdays
      if (birthdaysResult.data) {
        for (const birthday of birthdaysResult.data) {
          items.push(transformBirthday(birthday as Birthday));
        }
      }

      // Sort all items by time
      const sorted = sortCalendarItems(items);

      logger.success(`📅 Loaded ${sorted.length} calendar items for today`, {
        familyEvents: familyEventsResult.data?.length ?? 0,
        externalEvents: externalEventsResult.data?.length ?? 0,
        birthdays: birthdaysResult.data?.length ?? 0,
      });

      return sorted;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - reasonable for events
  });
}


/**
 * Fetch calendar items for a date range.
 *
 * Used by the Calendar view to show a week or month of events.
 * Same data sources as useTodayCalendarItems but for a range.
 *
 * @param startDate - Start of range (YYYY-MM-DD)
 * @param endDate - End of range (YYYY-MM-DD)
 *
 * @example
 * ```tsx
 * function CalendarView({ month }: { month: Date }) {
 *   const startDate = startOfMonth(month).toISOString().split('T')[0];
 *   const endDate = endOfMonth(month).toISOString().split('T')[0];
 *
 *   const { data: items } = useCalendarItems(startDate, endDate);
 *   // Render calendar grid with items...
 * }
 * ```
 *
 * @returns Query result with sorted array of CalendarItems
 */
export function useCalendarItems(startDate: string, endDate: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.calendarItems.range(startDate, endDate),
    queryFn: async (): Promise<CalendarItem[]> => {
      logger.info('📅 Fetching calendar items...', { startDate, endDate });

      // Convert date strings to ISO timestamps for queries
      const startISO = `${startDate}T00:00:00Z`;
      const endISO = `${endDate}T23:59:59Z`;

      // Get current user's family ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.warn('No authenticated user');
        return [];
      }

      const { data: member } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!member) {
        logger.warn('No family member record');
        return [];
      }

      // Fetch all sources in parallel
      const [familyEventsResult, externalEventsResult, birthdaysResult] = await Promise.all([
        supabase
          .from('family_events')
          .select(`
            *,
            assignee:assigned_to(id, name, color)
          `)
          .gte('start_time', startISO)
          .lte('start_time', endISO)
          .order('start_time'),

        supabase
          .from('external_events')
          .select('*')
          .gte('start_time', startISO)
          .lte('start_time', endISO)
          .order('start_time'),

        supabase
          .rpc('get_birthdays_in_range', {
            p_family_id: member.family_id,
            p_start_date: startDate,
            p_end_date: endDate,
          }),
      ]);

      // Transform and merge
      const items: CalendarItem[] = [];

      if (familyEventsResult.data) {
        for (const event of familyEventsResult.data) {
          items.push(transformFamilyEvent({
            ...event,
            assignee: event.assignee ? {
              id: event.assignee.id,
              name: event.assignee.name,
              color: event.assignee.color,
            } : undefined,
          } as FamilyEventWithAssignee));
        }
      }

      if (externalEventsResult.data) {
        for (const event of externalEventsResult.data) {
          items.push(transformExternalEvent(event as ExternalEvent));
        }
      }

      if (birthdaysResult.data) {
        for (const birthday of birthdaysResult.data) {
          items.push(transformBirthday(birthday as Birthday));
        }
      }

      const sorted = sortCalendarItems(items);

      logger.success(`📅 Loaded ${sorted.length} calendar items`, {
        range: `${startDate} to ${endDate}`,
        familyEvents: familyEventsResult.data?.length ?? 0,
        externalEvents: externalEventsResult.data?.length ?? 0,
        birthdays: birthdaysResult.data?.length ?? 0,
      });

      return sorted;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!startDate && !!endDate,
  });
}


// ============================================================================
// 🛠️ UTILITY EXPORTS
// ============================================================================

/**
 * Check if a calendar item is editable (Fam-native).
 *
 * External events from Google Calendar are read-only.
 * Family events and birthdays can be edited (birthdays via member profile).
 *
 * @param item - The calendar item to check
 * @returns true if the item can be edited in Fam
 */
export function isEditableItem(item: CalendarItem): boolean {
  return item.type === 'event';
}

/**
 * Get a human-readable source label for a calendar item.
 *
 * Used in UI to show where the event came from.
 *
 * @param item - The calendar item
 * @returns Display label like "Fam" or "Google Calendar"
 */
export function getItemSourceLabel(item: CalendarItem): string {
  switch (item.type) {
    case 'event':
      return 'Fam';
    case 'external':
      return item.calendarName || 'Google Calendar';
    case 'birthday':
      return 'Birthday';
    case 'task':
      return 'Task';
    case 'meal':
      return 'Meal';
    default:
      return 'Event';
  }
}

/**
 * Format time range for display.
 *
 * Handles all-day events, single times, and time ranges.
 *
 * @param item - The calendar item
 * @returns Formatted string like "All day", "2:00 PM", or "2:00 PM - 3:00 PM"
 */
export function formatItemTime(item: CalendarItem): string {
  if (item.isAllDay) {
    return 'All day';
  }

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
  };

  const startStr = item.start.toLocaleTimeString('en-US', timeOptions);

  if (!item.end) {
    return startStr;
  }

  const endStr = item.end.toLocaleTimeString('en-US', timeOptions);
  return `${startStr} - ${endStr}`;
}
