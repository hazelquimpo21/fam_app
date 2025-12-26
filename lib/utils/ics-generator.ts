/**
 * ============================================================================
 * 📅 ICS Calendar Feed Generator
 * ============================================================================
 *
 * Generates iCalendar (.ics) content from Fam data.
 * This allows users to subscribe to their Fam tasks and meals in any
 * calendar app (Google Calendar, Apple Calendar, Outlook, etc.).
 *
 * ICS Format Reference:
 * - RFC 5545: https://tools.ietf.org/html/rfc5545
 * - We keep it simple: VCALENDAR with VEVENT components
 * - No RRULE (recurrence rules) - we generate individual instances instead
 *
 * Design Decisions:
 * - Generate recurring task instances explicitly (no RRULE complexity)
 * - Use UTC for all timestamps (consistent across timezones)
 * - Keep descriptions brief (calendar apps truncate long text)
 * - Include category tags for filtering in calendar apps
 *
 * ============================================================================
 */

import type { Task, Meal, Goal, FamilyMember } from '@/types/database';
import type { ICSEvent, ICSGenerationOptions } from '@/types/calendar';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// 📝 ICS FORMAT CONSTANTS
// ============================================================================

/**
 * Line ending for ICS files (CRLF per RFC 5545)
 */
const CRLF = '\r\n';

/**
 * Maximum line length in ICS files (75 chars per RFC 5545)
 * We'll fold longer lines with a space continuation
 */
const MAX_LINE_LENGTH = 75;

/**
 * Default number of days ahead to include in the feed
 */
const DEFAULT_DAYS_AHEAD = 60;

/**
 * Number of recurring task instances to generate
 * (instead of using RRULE, we generate concrete instances)
 */
const DEFAULT_RECURRING_INSTANCES = 4;


// ============================================================================
// 🛠️ STRING UTILITIES
// ============================================================================

/**
 * Escape special characters in ICS text fields.
 * Per RFC 5545, we need to escape: backslash, semicolon, comma, newlines
 *
 * @param text - Raw text to escape
 * @returns Escaped text safe for ICS
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')      // Backslash (must be first)
    .replace(/;/g, '\\;')        // Semicolon
    .replace(/,/g, '\\,')        // Comma
    .replace(/\n/g, '\\n')       // Newline
    .replace(/\r/g, '');         // Remove carriage returns
}

/**
 * Fold long lines per RFC 5545.
 * Lines over 75 characters must be folded with CRLF + space.
 *
 * @param line - The line to fold
 * @returns Folded line(s)
 */
function foldLine(line: string): string {
  if (line.length <= MAX_LINE_LENGTH) {
    return line;
  }

  const result: string[] = [];
  let remaining = line;

  // First line can be full length
  result.push(remaining.substring(0, MAX_LINE_LENGTH));
  remaining = remaining.substring(MAX_LINE_LENGTH);

  // Continuation lines start with a space, so have 1 less usable char
  while (remaining.length > 0) {
    result.push(' ' + remaining.substring(0, MAX_LINE_LENGTH - 1));
    remaining = remaining.substring(MAX_LINE_LENGTH - 1);
  }

  return result.join(CRLF);
}

/**
 * Format a date as ICS DATE (all-day event).
 * Format: YYYYMMDD
 *
 * @param date - Date string (YYYY-MM-DD) or Date object
 * @returns ICS-formatted date
 */
function formatICSDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Format a datetime as ICS DATETIME in UTC.
 * Format: YYYYMMDDTHHMMSSZ
 *
 * @param date - Date string (ISO) or Date object
 * @returns ICS-formatted datetime in UTC
 */
function formatICSDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate a timestamp for DTSTAMP (when the event was created in the feed).
 * This is required by RFC 5545 and should be the current time.
 */
function generateDTStamp(): string {
  return formatICSDateTime(new Date());
}


// ============================================================================
// 📅 EVENT GENERATION
// ============================================================================

/**
 * Generate an ICS VEVENT from our generic ICSEvent type.
 *
 * @param event - The event to convert
 * @returns ICS VEVENT string
 */
function generateVEvent(event: ICSEvent): string {
  const lines: string[] = [];

  lines.push('BEGIN:VEVENT');
  lines.push(`UID:${event.uid}`);
  lines.push(`DTSTAMP:${generateDTStamp()}`);

  // Date/time handling
  if (event.isAllDay) {
    // All-day events use DATE, not DATETIME
    lines.push(`DTSTART;VALUE=DATE:${formatICSDate(event.start)}`);
    if (event.end) {
      // For all-day events, end is exclusive (the day after)
      lines.push(`DTEND;VALUE=DATE:${formatICSDate(event.end)}`);
    }
  } else {
    // Timed events use DATETIME in UTC
    lines.push(`DTSTART:${formatICSDateTime(event.start)}`);
    if (event.end) {
      lines.push(`DTEND:${formatICSDateTime(event.end)}`);
    }
  }

  // Summary (title) - required
  lines.push(`SUMMARY:${escapeICSText(event.title)}`);

  // Description - optional
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
  }

  // Location - optional
  if (event.location) {
    lines.push(`LOCATION:${escapeICSText(event.location)}`);
  }

  // Categories - optional but helpful for filtering
  if (event.categories && event.categories.length > 0) {
    lines.push(`CATEGORIES:${event.categories.join(',')}`);
  }

  lines.push('END:VEVENT');

  // Fold each line and join
  return lines.map(foldLine).join(CRLF);
}


// ============================================================================
// 🔄 TASK CONVERSION
// ============================================================================

/**
 * Calculate the next occurrence date for a recurring task.
 *
 * @param currentDate - The current due date
 * @param frequency - Recurrence frequency
 * @param interval - How many of the frequency (e.g., every 2 weeks)
 * @returns Next occurrence date
 */
function calculateNextRecurrence(
  currentDate: Date,
  frequency: string,
  interval: number = 1
): Date {
  const next = new Date(currentDate);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + interval);
      break;
    case 'weekly':
      next.setDate(next.getDate() + (7 * interval));
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + interval);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + interval);
      break;
    default:
      // Custom or unknown - default to weekly
      next.setDate(next.getDate() + 7);
  }

  return next;
}

/**
 * Convert a task to ICS events.
 * Recurring tasks generate multiple instances (no RRULE).
 *
 * @param task - The Fam task
 * @param members - Family members (for assignee name)
 * @param instanceCount - How many recurring instances to generate
 * @returns Array of ICS events
 */
function taskToICSEvents(
  task: Task,
  members: FamilyMember[],
  instanceCount: number = DEFAULT_RECURRING_INSTANCES
): ICSEvent[] {
  const events: ICSEvent[] = [];

  // Skip completed tasks
  if (task.status === 'done' || task.completed_at) {
    return events;
  }

  // Use due_date preferentially, fall back to scheduled_date
  const baseDate = task.due_date || task.scheduled_date;
  if (!baseDate) {
    return events; // No date = no calendar event
  }

  // Build description with metadata
  const descriptionParts: string[] = [];
  if (task.description) {
    descriptionParts.push(task.description);
  }
  if (task.assigned_to_id) {
    const assignee = members.find(m => m.id === task.assigned_to_id);
    if (assignee) {
      descriptionParts.push(`Assigned to: ${assignee.name}`);
    }
  }
  if (task.priority && task.priority > 0) {
    const priorityLabels = ['', 'Low', 'Medium', 'High'];
    descriptionParts.push(`Priority: ${priorityLabels[task.priority] || task.priority}`);
  }

  // Build categories
  const categories: string[] = ['Task'];
  if (task.project_id) {
    categories.push('Project');
  }

  // Generate event(s)
  if (task.is_recurring && task.recurrence_frequency) {
    // For recurring tasks, generate multiple instances
    let currentDate = new Date(baseDate);
    const endDate = task.recurrence_end_date
      ? new Date(task.recurrence_end_date)
      : null;

    for (let i = 0; i < instanceCount; i++) {
      // Stop if we've passed the end date
      if (endDate && currentDate > endDate) {
        break;
      }

      events.push({
        uid: `fam-task-${task.id}-${i}@fam.app`,
        title: task.title,
        description: descriptionParts.join('\\n'),
        start: currentDate.toISOString().split('T')[0],
        isAllDay: true, // Tasks are all-day events
        categories,
      });

      // Calculate next occurrence
      currentDate = calculateNextRecurrence(
        currentDate,
        task.recurrence_frequency,
        task.recurrence_interval || 1
      );
    }
  } else {
    // Non-recurring task - single event
    events.push({
      uid: `fam-task-${task.id}@fam.app`,
      title: task.title,
      description: descriptionParts.join('\\n'),
      start: baseDate,
      isAllDay: true,
      categories,
    });
  }

  return events;
}


// ============================================================================
// 🍽️ MEAL CONVERSION
// ============================================================================

/**
 * Get the typical time for a meal type.
 * Used to create timed events instead of all-day events for meals.
 *
 * @param mealType - The type of meal
 * @returns Object with hour and minute
 */
function getMealTime(mealType: string): { hour: number; minute: number } {
  switch (mealType) {
    case 'breakfast':
      return { hour: 8, minute: 0 };
    case 'lunch':
      return { hour: 12, minute: 0 };
    case 'dinner':
      return { hour: 18, minute: 0 };
    case 'snack':
      return { hour: 15, minute: 0 };
    default:
      return { hour: 12, minute: 0 };
  }
}

/**
 * Convert a meal to an ICS event.
 *
 * @param meal - The Fam meal
 * @param members - Family members (for cook name)
 * @returns ICS event
 */
function mealToICSEvent(meal: Meal, members: FamilyMember[]): ICSEvent {
  // Build title with meal type and dish
  const mealTypeLabel = meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1);
  const dishName = meal.title || meal.recipe?.title || 'Meal';
  const title = `${mealTypeLabel}: ${dishName}`;

  // Build description
  const descriptionParts: string[] = [];
  if (meal.notes) {
    descriptionParts.push(meal.notes);
  }
  if (meal.assigned_to_id) {
    const cook = members.find(m => m.id === meal.assigned_to_id);
    if (cook) {
      descriptionParts.push(`Prepared by: ${cook.name}`);
    }
  }

  // Calculate meal time
  const time = getMealTime(meal.meal_type);
  const startDate = new Date(meal.meal_date);
  startDate.setHours(time.hour, time.minute, 0, 0);

  // End time is 1 hour later
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 1);

  return {
    uid: `fam-meal-${meal.id}@fam.app`,
    title,
    description: descriptionParts.join('\\n'),
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    isAllDay: false,
    categories: ['Meal', mealTypeLabel],
  };
}


// ============================================================================
// 🎯 GOAL CONVERSION
// ============================================================================

/**
 * Convert a goal with a target date to an ICS event.
 * These appear as all-day reminder events.
 *
 * @param goal - The Fam goal
 * @param members - Family members (for owner name)
 * @returns ICS event or null if no target date
 */
function goalToICSEvent(goal: Goal, members: FamilyMember[]): ICSEvent | null {
  // Skip if no target date or already achieved
  if (!goal.target_date || goal.status === 'achieved' || goal.status === 'abandoned') {
    return null;
  }

  // Build description
  const descriptionParts: string[] = [];
  if (goal.description) {
    descriptionParts.push(goal.description);
  }
  if (goal.definition_of_done) {
    descriptionParts.push(`Definition of done: ${goal.definition_of_done}`);
  }
  if (goal.owner_id) {
    const owner = members.find(m => m.id === goal.owner_id);
    if (owner) {
      descriptionParts.push(`Owner: ${owner.name}`);
    }
  }
  if (goal.goal_type === 'quantitative' && goal.target_value) {
    descriptionParts.push(`Progress: ${goal.current_value}/${goal.target_value} ${goal.unit || ''}`);
  }

  return {
    uid: `fam-goal-${goal.id}@fam.app`,
    title: `🎯 Goal: ${goal.title}`,
    description: descriptionParts.join('\\n'),
    start: goal.target_date,
    isAllDay: true,
    categories: ['Goal', goal.is_family_goal ? 'Family' : 'Personal'],
  };
}


// ============================================================================
// 📦 MAIN GENERATOR FUNCTION
// ============================================================================

/**
 * Input data for ICS generation.
 * Fetched from the database before calling generateICS.
 */
export interface ICSGenerationData {
  familyName: string;
  tasks: Task[];
  meals: Meal[];
  goals: Goal[];
  members: FamilyMember[];
}

/**
 * Generate a complete ICS calendar file from Fam data.
 *
 * This is the main export - call this from the API route to generate
 * the feed content.
 *
 * @param data - The Fam data to include in the feed
 * @param options - Generation options (what to include, how many instances)
 * @returns Complete ICS file content as a string
 *
 * @example
 * const icsContent = generateICS(data, {
 *   familyId: 'abc-123',
 *   includeTasks: true,
 *   includeMeals: true,
 *   includeGoals: false,
 * });
 */
export function generateICS(
  data: ICSGenerationData,
  options: ICSGenerationOptions
): string {
  const startTime = Date.now();
  logger.info('Generating ICS feed...', {
    tasks: data.tasks.length,
    meals: data.meals.length,
    goals: data.goals.length,
    options,
  });

  const events: ICSEvent[] = [];

  // Convert tasks to events
  if (options.includeTasks) {
    for (const task of data.tasks) {
      const taskEvents = taskToICSEvents(
        task,
        data.members,
        options.recurringInstances ?? DEFAULT_RECURRING_INSTANCES
      );
      events.push(...taskEvents);
    }
  }

  // Convert meals to events
  if (options.includeMeals) {
    for (const meal of data.meals) {
      events.push(mealToICSEvent(meal, data.members));
    }
  }

  // Convert goals to events
  if (options.includeGoals) {
    for (const goal of data.goals) {
      const goalEvent = goalToICSEvent(goal, data.members);
      if (goalEvent) {
        events.push(goalEvent);
      }
    }
  }

  // Build the ICS file
  const lines: string[] = [];

  // Calendar header
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//Fam App//Fam Calendar//EN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push(`X-WR-CALNAME:${escapeICSText(data.familyName)}`);
  lines.push('X-WR-TIMEZONE:UTC');

  // Add all events
  for (const event of events) {
    lines.push(generateVEvent(event));
  }

  // Calendar footer
  lines.push('END:VCALENDAR');

  const content = lines.join(CRLF) + CRLF;

  const duration = Date.now() - startTime;
  logger.success(`ICS feed generated`, {
    events: events.length,
    bytes: content.length,
    durationMs: duration,
  });

  return content;
}


// ============================================================================
// 🔧 HELPER EXPORTS
// ============================================================================

export {
  escapeICSText,
  formatICSDate,
  formatICSDateTime,
  calculateNextRecurrence,
  DEFAULT_DAYS_AHEAD,
  DEFAULT_RECURRING_INSTANCES,
};
