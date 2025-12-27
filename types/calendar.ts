/**
 * ============================================================================
 * 📅 Calendar Integration Types
 * ============================================================================
 *
 * TypeScript types for the calendar integration features:
 * - Family events (Fam-native appointments, meetings, activities)
 * - ICS calendar feeds (export Fam events to external calendars)
 * - Google Calendar connections and imports
 * - Unified calendar display (combining all event sources)
 * - Birthday support
 *
 * These types mirror the database schema in:
 * - supabase/migrations/003_calendar_integration.sql
 * - supabase/migrations/004_family_events.sql
 *
 * See AI_Dev_Docs/17-family-events.md for full documentation.
 *
 * ============================================================================
 */

// ============================================================================
// 📅 FAMILY EVENTS (Fam-Native)
// ============================================================================

/**
 * A Fam-native event (appointment, meeting, activity).
 * Unlike tasks, events have specific times and are not completable.
 *
 * @example
 * // Dentist appointment
 * {
 *   title: "Dentist - Miles",
 *   start_time: "2024-12-30T14:00:00Z",
 *   end_time: "2024-12-30T15:00:00Z",
 *   location: "Shorewood Family Dental",
 *   assigned_to: "miles-member-id",
 * }
 *
 * @example
 * // All-day event
 * {
 *   title: "School Holiday",
 *   start_time: "2024-12-23T00:00:00Z",
 *   is_all_day: true,
 * }
 */
export interface FamilyEvent {
  id: string;
  family_id: string;

  /** Event title (e.g., "Dentist appointment", "Soccer practice") */
  title: string;

  /** Optional description or notes */
  description: string | null;

  /** Optional location (address or place name) */
  location: string | null;

  /** Event start time (ISO timestamp in UTC) */
  start_time: string;

  /** Event end time (ISO timestamp in UTC). Null if duration is unknown. */
  end_time: string | null;

  /** Whether this is an all-day event (no specific time) */
  is_all_day: boolean;

  /** Timezone for display purposes (e.g., "America/Chicago") */
  timezone: string;

  /** Family member who attends/is responsible. Null = family-wide event. */
  assigned_to: string | null;

  /** Display color override. If null, uses assigned member's color. */
  color: string | null;

  /** Optional emoji/icon (e.g., "🏥", "⚽", "🎉") */
  icon: string | null;

  /** Whether this is a recurring event */
  is_recurring: boolean;

  /** iCal RRULE format (e.g., "FREQ=WEEKLY;BYDAY=TU,TH") */
  recurrence_rule: string | null;

  /** When the recurrence ends */
  recurrence_end_date: string | null;

  /** For recurring instances, the parent event ID */
  parent_event_id: string | null;

  /** Who created this event */
  created_by: string | null;

  created_at: string;
  updated_at: string;
}

/**
 * Family event with joined assignee info for display.
 */
export interface FamilyEventWithAssignee extends FamilyEvent {
  assignee?: {
    id: string;
    name: string;
    color: string | null;
  };
}

/**
 * Input for creating a new family event.
 */
export interface CreateFamilyEventInput {
  title: string;
  description?: string | null;
  location?: string | null;
  start_time: string;
  end_time?: string | null;
  is_all_day?: boolean;
  timezone?: string;
  assigned_to?: string | null;
  color?: string | null;
  icon?: string | null;
}

/**
 * Input for updating an existing family event.
 */
export interface UpdateFamilyEventInput {
  id: string;
  title?: string;
  description?: string | null;
  location?: string | null;
  start_time?: string;
  end_time?: string | null;
  is_all_day?: boolean;
  timezone?: string;
  assigned_to?: string | null;
  color?: string | null;
  icon?: string | null;
}


// ============================================================================
// 🎂 BIRTHDAYS
// ============================================================================

/**
 * Birthday info returned from the get_birthdays_in_range function.
 */
export interface Birthday {
  /** Source type: 'family_member' or 'contact' */
  source_type: 'family_member' | 'contact';

  /** ID of the family member or contact */
  source_id: string;

  /** Person's name */
  name: string;

  /** Original birthday date (YYYY-MM-DD) */
  birthday_date: string;

  /** The actual date this birthday occurs in the queried range */
  display_date: string;

  /** Age they're turning on this birthday */
  age_turning: number;
}


// ============================================================================
// 🗓️ UNIFIED CALENDAR ITEM
// ============================================================================

/**
 * Calendar item type discriminator.
 * Used to determine how to render and handle clicks.
 */
export type CalendarItemType = 'task' | 'meal' | 'event' | 'birthday' | 'external';

/**
 * Unified calendar item for display.
 * This is the common format used by the Calendar and Today views.
 *
 * Created by merging:
 * - Tasks with due_date or scheduled_date
 * - Meals with date
 * - Family events
 * - Birthdays (from family members and contacts)
 * - External events (from Google Calendar)
 */
export interface CalendarItem {
  /** Unique identifier (prefixed by type, e.g., "task-123", "event-456") */
  id: string;

  /** Display title */
  title: string;

  /** Start time (for timed items) or date (for all-day items) */
  start: Date;

  /** End time (optional, for timed items) */
  end?: Date;

  /** Whether this spans the full day */
  isAllDay: boolean;

  /** Display color (from source or assignee) */
  color?: string;

  /** Item type for rendering and click handling */
  type: CalendarItemType;

  /** Original source ID (for navigation to source) */
  sourceId: string;

  /** Display hints */
  icon?: string;
  location?: string;
  description?: string;

  /** Assignee info (if applicable) */
  assignee?: {
    id: string;
    name: string;
    color: string | null;
  };

  /** For external events: calendar name */
  calendarName?: string;

  /** Additional metadata based on type */
  meta?: {
    /** For birthdays: age they're turning */
    ageTurning?: number;
    /** For tasks: status */
    taskStatus?: string;
    /** For meals: meal type */
    mealType?: string;
  };
}

/**
 * Options for fetching unified calendar items.
 */
export interface CalendarItemsOptions {
  /** Family ID */
  familyId: string;

  /** Start date of range */
  startDate: Date;

  /** End date of range */
  endDate: Date;

  /** Filter by specific member (null = all members) */
  memberId?: string | null;

  /** Include tasks */
  includeTasks?: boolean;

  /** Include meals */
  includeMeals?: boolean;

  /** Include family events */
  includeEvents?: boolean;

  /** Include birthdays */
  includeBirthdays?: boolean;

  /** Include external (Google Calendar) events */
  includeExternal?: boolean;
}


// ============================================================================
// 📤 ICS CALENDAR FEEDS
// ============================================================================

/**
 * A calendar feed configuration that generates an ICS URL.
 * Users can subscribe to this URL in any calendar app (Google, Apple, Outlook).
 *
 * @example
 * // Personal feed for a specific member
 * { member_id: "abc-123", include_tasks: true, include_meals: true }
 *
 * // Family-wide feed (member_id is null)
 * { member_id: null, include_tasks: true, include_meals: true }
 */
export interface CalendarFeed {
  id: string;
  family_id: string;

  /**
   * If set, this feed only includes items for this specific member.
   * If null, this is a family-wide feed that includes all members' items.
   */
  member_id: string | null;

  /**
   * Secure token used in the feed URL.
   * Example: https://fam.app/api/calendar/feed/abc123def456.ics
   *
   * To revoke access, delete the feed (which generates a new token on recreate).
   */
  token: string;

  /** Human-readable name shown in settings (e.g., "My Tasks", "Family Calendar") */
  name: string;

  /** Include tasks with due_date or scheduled_date in the feed */
  include_tasks: boolean;

  /** Include planned meals in the feed */
  include_meals: boolean;

  /** Include goal target dates as all-day reminders */
  include_goals: boolean;

  /** Include birthdays (from family members and contacts) */
  include_birthdays: boolean;

  /** Include family events (appointments, meetings, activities) */
  include_events: boolean;

  /** When the feed was last fetched by a calendar app */
  last_accessed_at: string | null;

  /** How many times the feed has been accessed */
  access_count: number;

  created_at: string;
  updated_at: string;
}

/**
 * Input for creating a new calendar feed.
 * Token is auto-generated by the database.
 */
export interface CreateCalendarFeedInput {
  name: string;
  member_id?: string | null;
  include_tasks?: boolean;
  include_meals?: boolean;
  include_goals?: boolean;
  include_birthdays?: boolean;
  include_events?: boolean;
}

/**
 * Input for updating an existing calendar feed.
 */
export interface UpdateCalendarFeedInput {
  id: string;
  name?: string;
  include_tasks?: boolean;
  include_meals?: boolean;
  include_goals?: boolean;
  include_birthdays?: boolean;
  include_events?: boolean;
}


// ============================================================================
// 🔗 GOOGLE CALENDAR CONNECTIONS
// ============================================================================

/**
 * A family member's connection to their Google Calendar.
 * Stores OAuth tokens for API access.
 *
 * Each member can have at most one Google Calendar connection.
 */
export interface GoogleCalendarConnection {
  id: string;
  family_id: string;
  member_id: string;

  /** The Google account email (for display in UI) */
  google_email: string;

  /** Google's unique user ID */
  google_user_id: string;

  /**
   * OAuth access token for Google Calendar API.
   * Short-lived (typically 1 hour).
   */
  access_token: string;

  /**
   * OAuth refresh token for obtaining new access tokens.
   * Long-lived but can be revoked by user in Google settings.
   */
  refresh_token: string | null;

  /** When the current access token expires */
  token_expires_at: string | null;

  /** The OAuth scopes that were granted */
  granted_scopes: string[] | null;

  /** When the calendars were last synced from Google */
  last_synced_at: string | null;

  /** Error message from the last failed sync attempt */
  sync_error: string | null;

  created_at: string;
  updated_at: string;
}

/**
 * Minimal connection info for UI display (without sensitive tokens).
 */
export interface GoogleCalendarConnectionInfo {
  id: string;
  google_email: string;
  last_synced_at: string | null;
  sync_error: string | null;
  created_at: string;
}


// ============================================================================
// 📋 GOOGLE CALENDAR SUBSCRIPTIONS
// ============================================================================

/**
 * Who in the family can see events from an imported calendar.
 * This allows privacy controls (e.g., work calendar visible only to self).
 */
export type CalendarVisibility = 'owner' | 'adults' | 'family';

/**
 * A subscription to a specific Google Calendar.
 * Controls whether and how events from this calendar appear in Fam.
 */
export interface GoogleCalendarSubscription {
  id: string;
  connection_id: string;

  /** Google's calendar ID (e.g., "primary" or "abc@group.calendar.google.com") */
  google_calendar_id: string;

  /** Display name from Google (e.g., "Work", "Personal", "Holidays") */
  calendar_name: string;

  /** Hex color from Google (e.g., "#4285f4") */
  calendar_color: string | null;

  /**
   * Who can see events from this calendar.
   * - 'owner': Only the person who connected
   * - 'adults': All adults in the family
   * - 'family': Everyone in the family
   */
  visibility: CalendarVisibility;

  /** Whether to actively sync this calendar */
  is_active: boolean;

  created_at: string;
  updated_at: string;
}

/**
 * Calendar info returned from Google's calendar list API.
 * Used during the calendar selection step after OAuth.
 */
export interface GoogleCalendarInfo {
  id: string;
  summary: string;  // Calendar name
  description?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole: 'owner' | 'writer' | 'reader' | 'freeBusyReader';
  primary?: boolean;  // True for the user's primary calendar
}

/**
 * Input for creating/updating a calendar subscription.
 */
export interface UpdateCalendarSubscriptionInput {
  id: string;
  is_active?: boolean;
  visibility?: CalendarVisibility;
}


// ============================================================================
// 📆 EXTERNAL EVENTS
// ============================================================================

/**
 * An event imported from Google Calendar.
 * Cached locally for display in Fam's calendar and Today views.
 */
export interface ExternalEvent {
  id: string;
  family_id: string;
  subscription_id: string;

  /** Google's event ID (for sync purposes) */
  google_event_id: string;

  /** Event title */
  title: string;

  /** Event description/notes */
  description: string | null;

  /** Event location */
  location: string | null;

  /** Event start time (ISO timestamp) */
  start_time: string;

  /** Event end time (ISO timestamp) */
  end_time: string | null;

  /** Whether this is an all-day event */
  is_all_day: boolean;

  /** Original timezone from Google */
  original_timezone: string | null;

  /** Display color (from calendar or event) */
  color: string | null;

  /** When Google last updated this event */
  google_updated_at: string | null;

  /** When we last fetched this event */
  fetched_at: string;
}

/**
 * External event with joined subscription info for display.
 */
export interface ExternalEventWithCalendar extends ExternalEvent {
  calendar_name: string;
  calendar_color: string | null;
}


// ============================================================================
// 📊 ICS GENERATION TYPES
// ============================================================================

/**
 * A generic calendar event for ICS generation.
 * This abstracts over tasks, meals, and goals.
 */
export interface ICSEvent {
  /**
   * Unique identifier for this event.
   * For recurring tasks, include instance suffix (e.g., "task-123-2")
   */
  uid: string;

  /** Event title/summary */
  title: string;

  /** Event description (optional) */
  description?: string;

  /**
   * Event start time/date.
   * For all-day events, use YYYY-MM-DD format.
   * For timed events, use ISO timestamp.
   */
  start: string;

  /**
   * Event end time/date (optional).
   * For all-day events, this is exclusive (the day after).
   */
  end?: string;

  /** Whether this is an all-day event */
  isAllDay: boolean;

  /** Location (optional) */
  location?: string;

  /** Categories for the event (e.g., ['task'], ['meal', 'dinner']) */
  categories?: string[];
}

/**
 * Options for ICS feed generation.
 */
export interface ICSGenerationOptions {
  /** Family ID to generate feed for */
  familyId: string;

  /** Specific member ID, or null for family-wide */
  memberId?: string | null;

  /** Include tasks in the feed */
  includeTasks: boolean;

  /** Include meals in the feed */
  includeMeals: boolean;

  /** Include goal target dates in the feed */
  includeGoals: boolean;

  /** Include birthdays (from family members and contacts) */
  includeBirthdays: boolean;

  /** Include family events (appointments, meetings, activities) */
  includeEvents: boolean;

  /** Number of days in the future to include (default: 60) */
  daysAhead?: number;

  /** Number of recurring task instances to generate (default: 4) */
  recurringInstances?: number;
}


// ============================================================================
// 🔄 SYNC TYPES
// ============================================================================

/**
 * Result of a calendar sync operation.
 */
export interface CalendarSyncResult {
  /** Whether the sync was successful */
  success: boolean;

  /** Number of events added */
  added: number;

  /** Number of events updated */
  updated: number;

  /** Number of events deleted */
  deleted: number;

  /** Error message if sync failed */
  error?: string;

  /** When the sync completed */
  syncedAt: string;
}

/**
 * Options for syncing calendars.
 */
export interface CalendarSyncOptions {
  /** Connection ID to sync */
  connectionId: string;

  /** Specific subscription ID, or sync all active subscriptions */
  subscriptionId?: string;

  /** Days in the past to sync (default: 7) */
  daysBack?: number;

  /** Days in the future to sync (default: 60) */
  daysAhead?: number;
}
