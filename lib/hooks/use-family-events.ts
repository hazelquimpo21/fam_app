'use client';

/**
 * ============================================================================
 * 📅 Family Events Hooks
 * ============================================================================
 *
 * React Query hooks for family events (appointments, meetings, activities).
 * These are Fam-native time-specific events that are separate from tasks.
 *
 * Unlike tasks (which are completable), events are temporal:
 * - They have specific start/end times
 * - They don't have a "done" status
 * - They represent things you attend, not things you complete
 *
 * See AI_Dev_Docs/17-family-events.md for full documentation.
 *
 * ============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query-keys';
import { logger } from '@/lib/utils/logger';
import type {
  FamilyEvent,
  FamilyEventWithAssignee,
  CreateFamilyEventInput,
  UpdateFamilyEventInput,
  Birthday,
} from '@/types/calendar';


// ============================================================================
// 📅 FAMILY EVENTS CRUD
// ============================================================================

/**
 * Fetch family events for a date range.
 *
 * @param startDate - Start of range (ISO date string, e.g., "2024-12-01")
 * @param endDate - End of range (ISO date string, e.g., "2024-12-31")
 *
 * @example
 * const { data: events } = useFamilyEvents('2024-12-01', '2024-12-31')
 */
export function useFamilyEvents(startDate: string, endDate: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.events.list(startDate, endDate),
    queryFn: async (): Promise<FamilyEventWithAssignee[]> => {
      logger.info('Fetching family events...', { startDate, endDate });

      // Query events with joined assignee info
      const { data, error } = await supabase
        .from('family_events')
        .select(`
          *,
          assignee:assigned_to(id, name, color)
        `)
        .gte('start_time', startDate)
        .lte('start_time', endDate + 'T23:59:59Z')
        .order('start_time');

      if (error) {
        logger.error('Failed to fetch family events', { error: error.message });
        throw error;
      }

      logger.success(`Loaded ${data?.length || 0} family events`);

      // Transform the data to match our type
      return (data || []).map(event => ({
        ...event,
        assignee: event.assignee ? {
          id: event.assignee.id,
          name: event.assignee.name,
          color: event.assignee.color,
        } : undefined,
      })) as FamilyEventWithAssignee[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!startDate && !!endDate,
  });
}

/**
 * Fetch today's family events.
 *
 * @example
 * const { data: todayEvents } = useTodayFamilyEvents()
 */
export function useTodayFamilyEvents() {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.events.today(),
    queryFn: async (): Promise<FamilyEventWithAssignee[]> => {
      logger.info("Fetching today's family events...");

      // Calculate today's date range in local timezone
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const { data, error } = await supabase
        .from('family_events')
        .select(`
          *,
          assignee:assigned_to(id, name, color)
        `)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .order('start_time');

      if (error) {
        logger.error("Failed to fetch today's events", { error: error.message });
        throw error;
      }

      logger.success(`Loaded ${data?.length || 0} events for today`);

      return (data || []).map(event => ({
        ...event,
        assignee: event.assignee ? {
          id: event.assignee.id,
          name: event.assignee.name,
          color: event.assignee.color,
        } : undefined,
      })) as FamilyEventWithAssignee[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch a single family event by ID.
 *
 * @param eventId - The event ID to fetch
 *
 * @example
 * const { data: event } = useFamilyEvent('event-123')
 */
export function useFamilyEvent(eventId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: async (): Promise<FamilyEventWithAssignee | null> => {
      logger.info('Fetching family event...', { eventId });

      const { data, error } = await supabase
        .from('family_events')
        .select(`
          *,
          assignee:assigned_to(id, name, color)
        `)
        .eq('id', eventId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          logger.info('Event not found');
          return null;
        }
        logger.error('Failed to fetch event', { error: error.message });
        throw error;
      }

      return {
        ...data,
        assignee: data.assignee ? {
          id: data.assignee.id,
          name: data.assignee.name,
          color: data.assignee.color,
        } : undefined,
      } as FamilyEventWithAssignee;
    },
    enabled: !!eventId,
  });
}

/**
 * Create a new family event.
 *
 * @example
 * const createEvent = useCreateFamilyEvent()
 * createEvent.mutate({
 *   title: 'Dentist appointment',
 *   start_time: '2024-12-30T14:00:00Z',
 *   end_time: '2024-12-30T15:00:00Z',
 *   assigned_to: 'member-id',
 *   location: 'Shorewood Family Dental',
 * })
 */
export function useCreateFamilyEvent() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: CreateFamilyEventInput): Promise<FamilyEvent> => {
      logger.info('Creating family event...', { title: input.title });

      // Get the current user's member ID for created_by
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: member } = await supabase
        .from('family_members')
        .select('id, family_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!member) throw new Error('No family member record');

      // Insert the event
      const { data, error } = await supabase
        .from('family_events')
        .insert({
          family_id: member.family_id,
          title: input.title,
          description: input.description ?? null,
          location: input.location ?? null,
          start_time: input.start_time,
          end_time: input.end_time ?? null,
          is_all_day: input.is_all_day ?? false,
          timezone: input.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
          assigned_to: input.assigned_to ?? null,
          color: input.color ?? null,
          icon: input.icon ?? null,
          created_by: member.id,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create event', { error: error.message });
        throw error;
      }

      logger.success('Family event created!', { id: data.id });
      return data as FamilyEvent;
    },

    onSuccess: () => {
      // Invalidate event queries to refresh
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendarItems.all });
      toast.success('Event created!');
    },

    onError: (error) => {
      logger.error('Create event error', { error });
      toast.error('Failed to create event');
    },
  });
}

/**
 * Update an existing family event.
 *
 * @example
 * const updateEvent = useUpdateFamilyEvent()
 * updateEvent.mutate({
 *   id: 'event-123',
 *   title: 'Updated title',
 *   start_time: '2024-12-30T15:00:00Z',
 * })
 */
export function useUpdateFamilyEvent() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: UpdateFamilyEventInput): Promise<FamilyEvent> => {
      const { id, ...updates } = input;
      logger.info('Updating family event...', { id });

      const { data, error } = await supabase
        .from('family_events')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update event', { error: error.message });
        throw error;
      }

      logger.success('Family event updated!');
      return data as FamilyEvent;
    },

    onSuccess: (data) => {
      // Update cache and invalidate list queries
      queryClient.setQueryData(queryKeys.events.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendarItems.all });
      toast.success('Event updated!');
    },

    onError: (error) => {
      logger.error('Update event error', { error });
      toast.error('Failed to update event');
    },
  });
}

/**
 * Delete a family event.
 *
 * @example
 * const deleteEvent = useDeleteFamilyEvent()
 * deleteEvent.mutate('event-123')
 */
export function useDeleteFamilyEvent() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (eventId: string): Promise<string> => {
      logger.info('Deleting family event...', { eventId });

      const { error } = await supabase
        .from('family_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        logger.error('Failed to delete event', { error: error.message });
        throw error;
      }

      logger.success('Family event deleted');
      return eventId;
    },

    onSuccess: (eventId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.events.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendarItems.all });
      toast('Event deleted');
    },

    onError: (error) => {
      logger.error('Delete event error', { error });
      toast.error('Failed to delete event');
    },
  });
}


// ============================================================================
// 🎂 BIRTHDAY QUERIES
// ============================================================================

/**
 * Fetch birthdays for a date range.
 * Includes both family members and contacts.
 *
 * @param startDate - Start of range (YYYY-MM-DD)
 * @param endDate - End of range (YYYY-MM-DD)
 *
 * @example
 * const { data: birthdays } = useBirthdays('2024-12-01', '2024-12-31')
 */
export function useBirthdays(startDate: string, endDate: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.birthdays.range(startDate, endDate),
    queryFn: async (): Promise<Birthday[]> => {
      logger.info('Fetching birthdays...', { startDate, endDate });

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
        logger.info('No family member record');
        return [];
      }

      // Call the birthday function
      const { data, error } = await supabase
        .rpc('get_birthdays_in_range', {
          p_family_id: member.family_id,
          p_start_date: startDate,
          p_end_date: endDate,
        });

      if (error) {
        logger.error('Failed to fetch birthdays', { error: error.message });
        throw error;
      }

      logger.success(`Loaded ${data?.length || 0} birthdays`);
      return data as Birthday[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour (birthdays don't change often)
    enabled: !!startDate && !!endDate,
  });
}

/**
 * Fetch today's birthdays.
 *
 * @example
 * const { data: birthdays } = useTodayBirthdays()
 * if (birthdays?.length) {
 *   console.log('Happy birthday to:', birthdays.map(b => b.name))
 * }
 */
export function useTodayBirthdays() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return useBirthdays(today, today);
}

/**
 * Fetch upcoming birthdays.
 *
 * @param days - Number of days to look ahead (default: 14)
 *
 * @example
 * const { data: upcoming } = useUpcomingBirthdays(30)
 */
export function useUpcomingBirthdays(days: number = 14) {
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);
  const endDateStr = endDate.toISOString().split('T')[0];

  return useBirthdays(startDate, endDateStr);
}


// ============================================================================
// 🛠️ UTILITY FUNCTIONS
// ============================================================================

/**
 * Format a date/time for display.
 * Handles both all-day events and timed events.
 *
 * @param startTime - ISO timestamp
 * @param endTime - ISO timestamp (optional)
 * @param isAllDay - Whether this is an all-day event
 * @param timezone - Timezone for display
 *
 * @example
 * formatEventTime('2024-12-30T14:00:00Z', '2024-12-30T15:00:00Z', false)
 * // Returns: "2:00 PM - 3:00 PM"
 */
export function formatEventTime(
  startTime: string,
  endTime: string | null,
  isAllDay: boolean,
  timezone?: string
): string {
  if (isAllDay) {
    return 'All day';
  }

  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  const start = new Date(startTime);
  const startStr = start.toLocaleTimeString('en-US', options);

  if (!endTime) {
    return startStr;
  }

  const end = new Date(endTime);
  const endStr = end.toLocaleTimeString('en-US', options);

  return `${startStr} - ${endStr}`;
}

/**
 * Check if an event spans multiple days.
 *
 * @param startTime - ISO timestamp
 * @param endTime - ISO timestamp
 */
export function isMultiDayEvent(startTime: string, endTime: string | null): boolean {
  if (!endTime) return false;

  const start = new Date(startTime);
  const end = new Date(endTime);

  return start.toDateString() !== end.toDateString();
}

/**
 * Get a friendly description of event duration.
 *
 * @param startTime - ISO timestamp
 * @param endTime - ISO timestamp
 *
 * @example
 * getEventDuration('2024-12-30T14:00:00Z', '2024-12-30T15:00:00Z')
 * // Returns: "1 hour"
 */
export function getEventDuration(startTime: string, endTime: string | null): string | null {
  if (!endTime) return null;

  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
  }

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (mins === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  return `${hours}h ${mins}m`;
}
