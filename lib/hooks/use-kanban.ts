'use client';

/**
 * ============================================================================
 * 📋 useKanban Hook
 * ============================================================================
 *
 * React Query hook for fetching and organizing Kanban board data.
 *
 * This hook:
 * 1. Fetches tasks, events, and birthdays based on the time scope
 * 2. Transforms them into unified KanbanItem format
 * 3. Groups items into columns based on the groupBy mode
 * 4. Provides mutations for updating items (drag-drop, complete, etc.)
 *
 * ARCHITECTURE:
 * ```
 * useKanban(config)
 *   → Fetch: useTasks, useFamilyEvents, useExternalEvents, useBirthdays
 *   → Transform: task → KanbanItem, event → KanbanItem, etc.
 *   → Group: items → columns based on groupBy mode
 *   → Return: { columns, isLoading, mutations }
 * ```
 *
 * FUTURE AI DEVELOPERS:
 * - To add new item types, add a transformer function and include in itemsQuery
 * - Column definitions are in /types/kanban.ts
 * - Drag-drop mutations should update the appropriate field based on groupBy mode
 *
 * ============================================================================
 */

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query-keys';
import { logger } from '@/lib/utils/logger';
import { useAuth } from '@/lib/hooks/use-auth';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  addDays,
  isAfter,
  isBefore,
  isSameDay,
  isWithinInterval,
} from 'date-fns';

import type { Task, TaskStatus } from '@/types/database';
import type { FamilyEvent, ExternalEvent, Birthday, CalendarItem } from '@/types/calendar';
import type {
  KanbanConfig,
  KanbanItem,
  KanbanItemType,
  KanbanColumn,
  KanbanGroupBy,
  KanbanTimeScope,
  KanbanPriority,
  KanbanDropResult,
} from '@/types/kanban';

// Import column definitions (values, not types)
import {
  TIME_COLUMNS,
  STATUS_COLUMNS,
  PRIORITY_COLUMNS,
  UNTAGGED_COLUMN,
  createTagColumn,
} from '@/types/kanban';

// Re-export column definitions for use in components
export {
  TIME_COLUMNS,
  STATUS_COLUMNS,
  PRIORITY_COLUMNS,
  UNTAGGED_COLUMN,
  TAG_COLUMN_COLORS,
  createTagColumn,
} from '@/types/kanban';

// ============================================================================
// 📊 DATE UTILITIES
// ============================================================================

/**
 * Get the date range for a given time scope.
 * Used to determine what data to fetch.
 *
 * @param scope - The time scope ('week', 'month', 'quarter', 'year')
 * @returns Start and end dates for the scope
 */
export function getTimeScopeRange(scope: KanbanTimeScope): { start: Date; end: Date } {
  const now = new Date();

  switch (scope) {
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn: 0 }), // Sunday
        end: endOfWeek(now, { weekStartsOn: 0 }),
      };
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    case 'quarter':
      return {
        start: startOfQuarter(now),
        end: endOfQuarter(now),
      };
    case 'year':
      return {
        start: startOfYear(now),
        end: endOfYear(now),
      };
    default:
      return {
        start: startOfWeek(now, { weekStartsOn: 0 }),
        end: endOfWeek(now, { weekStartsOn: 0 }),
      };
  }
}

/**
 * Get the time column ID for a given date and item type.
 * Used for grouping items into time-based columns.
 *
 * IMPORTANT SEMANTIC DISTINCTION (for future AI developers):
 * This function implements different logic for tasks vs events:
 *
 * - TASKS (isTask=true): Past incomplete tasks → 'overdue' (red, urgent)
 *   These are things you were supposed to DO but didn't. They need action.
 *
 * - EVENTS/BIRTHDAYS (isTask=false): Past items → 'past' (neutral, informational)
 *   These are things that already HAPPENED. They're just history, not failures.
 *
 * Example:
 *   - "Call dentist" task from yesterday → OVERDUE (you need to do it!)
 *   - "Dentist appointment" event from yesterday → PAST (you attended it)
 *
 * @param date - The item's date
 * @param isCompleted - Whether the item is completed (tasks only)
 * @param isTask - Whether this is a task (vs event/birthday). Default true for backwards compat.
 * @returns Column ID ('past', 'overdue', 'today', 'tomorrow', 'this-week', 'later', 'done')
 */
export function getTimeColumnId(
  date: Date | null,
  isCompleted: boolean,
  isTask: boolean = true
): string {
  // Completed tasks go to 'done' regardless of date
  if (isCompleted) return 'done';

  // No date = Later (for tasks without due dates)
  if (!date) return 'later';

  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const dayAfterTomorrow = addDays(today, 2);
  const endOfThisWeek = endOfWeek(now, { weekStartsOn: 0 });
  const itemDate = startOfDay(date);

  // Past date handling - different logic for tasks vs events
  if (isBefore(itemDate, today)) {
    // Tasks in the past are OVERDUE (you need to complete them)
    // Events/birthdays in the past are just PAST (they already happened)
    return isTask ? 'overdue' : 'past';
  }

  // Future date handling - same for all item types
  if (isSameDay(itemDate, today)) return 'today';
  if (isSameDay(itemDate, tomorrow)) return 'tomorrow';
  if (isWithinInterval(itemDate, { start: dayAfterTomorrow, end: endOfThisWeek })) return 'this-week';
  return 'later';
}

/**
 * Get the date for a time column.
 * Used when dropping items into a column to set their new date.
 *
 * NOTE: The 'past' column returns null because you cannot schedule items in the past.
 * Items can only end up in 'past' if they're events that already happened.
 *
 * @param columnId - The column ID
 * @returns The date to set for items dropped in this column, or null if not droppable
 */
export function getDateForTimeColumn(columnId: string): Date | null {
  const now = new Date();
  const today = startOfDay(now);

  switch (columnId) {
    case 'past':
      return null; // Cannot schedule items in the past - 'past' column is view-only
    case 'overdue':
      return addDays(today, -1); // Yesterday (will appear overdue)
    case 'today':
      return today;
    case 'tomorrow':
      return addDays(today, 1);
    case 'this-week':
      return addDays(today, 3); // Middle of week
    case 'later':
      return addDays(today, 14); // 2 weeks from now
    case 'done':
      return null; // Don't change date for completed items
    default:
      return null;
  }
}

// ============================================================================
// 🔄 TRANSFORMERS
// ============================================================================

/**
 * Transform a Task into a KanbanItem.
 *
 * SEMANTIC NOTE (for future AI developers):
 * Tasks use `isOverdue` (not `isPast`) because tasks are actionable.
 * A task with a past due date that isn't completed is OVERDUE (needs action).
 * isPast is always false for tasks - they go to "Overdue" column, not "Past".
 *
 * @param task - The task to transform
 * @returns KanbanItem representation of the task
 */
export function transformTask(task: Task): KanbanItem {
  const now = new Date();
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const isCompleted = task.status === 'done';
  const isOverdue = dueDate && !isCompleted && isBefore(startOfDay(dueDate), startOfDay(now));

  // Map task priority (number) to KanbanPriority
  const priorityMap: Record<number, KanbanPriority> = {
    1: 'low',
    2: 'medium',
    3: 'high',
  };

  return {
    id: `task-${task.id}`,
    type: 'task',
    sourceId: task.id,
    title: task.title,
    description: task.description || undefined,
    date: dueDate,
    isAllDay: true, // Tasks are always all-day for now
    status: task.status,
    priority: priorityMap[task.priority ?? 0] || 'none',
    isCompleted,
    isOverdue: isOverdue || false,
    isPast: false, // Tasks are never "past" - they're either done or overdue
    isEditable: true,
    isCompletable: true,
    color: (task as any).project?.color || undefined,
    assignee: (task as any).assigned_to
      ? {
          id: (task as any).assigned_to.id,
          name: (task as any).assigned_to.name,
          color: (task as any).assigned_to.color,
        }
      : undefined,
    project: (task as any).project
      ? {
          id: (task as any).project.id,
          title: (task as any).project.title,
          color: (task as any).project.color,
        }
      : undefined,
    // Include tags for tag-based grouping
    tags: task.tags || undefined,
    meta: {
      goalId: task.goal_id || undefined,
    },
    _source: task,
  };
}

/**
 * Transform a FamilyEvent into a KanbanItem.
 *
 * SEMANTIC NOTE (for future AI developers):
 * Events use `isPast` (not `isOverdue`) because events are temporal, not actionable.
 * A past event isn't "overdue" - it already happened. You attended it (hopefully).
 * Events go to the neutral "Past" column, not the alarming "Overdue" column.
 *
 * @param event - The family event to transform
 * @param assignee - Optional assignee info (from joined query)
 * @returns KanbanItem representation of the event
 */
export function transformFamilyEvent(
  event: FamilyEvent,
  assignee?: { id: string; name: string; color: string | null }
): KanbanItem {
  const startDate = new Date(event.start_time);
  const now = new Date();
  const isPast = isBefore(startOfDay(startDate), startOfDay(now));

  return {
    id: `event-${event.id}`,
    type: 'event',
    sourceId: event.id,
    title: event.title,
    description: event.description || undefined,
    date: startOfDay(startDate),
    startTime: event.is_all_day ? undefined : startDate,
    endTime: event.end_time && !event.is_all_day ? new Date(event.end_time) : undefined,
    isAllDay: event.is_all_day,
    priority: 'none', // Events don't have priority
    isCompleted: false, // Events can't be completed
    isOverdue: false, // Events are never overdue - they just happen
    isPast, // Events in the past go to "Past" column
    isEditable: true,
    isCompletable: false,
    color: event.color || assignee?.color || undefined,
    icon: event.icon || undefined,
    location: event.location || undefined,
    assignee,
    _source: event,
  };
}

/**
 * Transform an ExternalEvent (Google Calendar) into a KanbanItem.
 *
 * SEMANTIC NOTE (for future AI developers):
 * External events (Google Calendar) use `isPast` just like family events.
 * They're temporal occurrences, not actionable items.
 * Past Google Calendar events go to "Past" column, not "Overdue".
 *
 * @param event - The external event to transform
 * @param calendarName - Name of the source calendar
 * @returns KanbanItem representation of the external event
 */
export function transformExternalEvent(
  event: ExternalEvent,
  calendarName?: string
): KanbanItem {
  const startDate = new Date(event.start_time);
  const now = new Date();
  const isPast = isBefore(startOfDay(startDate), startOfDay(now));

  return {
    id: `external-${event.id}`,
    type: 'external',
    sourceId: event.id,
    title: event.title,
    description: event.description || undefined,
    date: startOfDay(startDate),
    startTime: event.is_all_day ? undefined : startDate,
    endTime: event.end_time && !event.is_all_day ? new Date(event.end_time) : undefined,
    isAllDay: event.is_all_day,
    priority: 'none',
    isCompleted: false,
    isOverdue: false, // External events are never overdue - they just happen
    isPast, // External events in the past go to "Past" column
    isEditable: false, // External events are read-only
    isCompletable: false,
    color: event.color || undefined,
    location: event.location || undefined,
    meta: {
      calendarName,
    },
    _source: event,
  };
}

/**
 * Transform a Birthday into a KanbanItem.
 *
 * SEMANTIC NOTE (for future AI developers):
 * Birthdays use `isPast` because they're temporal occurrences.
 * A birthday that already happened isn't "overdue" - it was (hopefully) celebrated.
 * Past birthdays go to "Past" column, not "Overdue".
 *
 * @param birthday - The birthday to transform
 * @returns KanbanItem representation of the birthday
 */
export function transformBirthday(birthday: Birthday): KanbanItem {
  const displayDate = new Date(birthday.display_date);
  const now = new Date();
  const isPast = isBefore(startOfDay(displayDate), startOfDay(now));

  return {
    id: `birthday-${birthday.source_type}-${birthday.source_id}`,
    type: 'birthday',
    sourceId: birthday.source_id,
    title: `🎂 ${birthday.name}'s Birthday`,
    date: startOfDay(displayDate),
    isAllDay: true,
    priority: 'none',
    isCompleted: false,
    isOverdue: false, // Birthdays are never overdue - they just happen
    isPast, // Birthdays in the past go to "Past" column
    isEditable: false, // Birthdays are read-only
    isCompletable: false,
    icon: '🎂',
    meta: {
      ageTurning: birthday.age_turning,
    },
    _source: birthday,
  };
}

// ============================================================================
// 📊 GROUPING LOGIC
// ============================================================================

/**
 * Get the column ID for an item based on the groupBy mode.
 *
 * IMPORTANT (for future AI developers):
 * For time-based grouping, we pass `isTask` to getTimeColumnId() so that:
 * - Tasks go to 'overdue' column if past (they need action)
 * - Events/birthdays go to 'past' column if past (they already happened)
 *
 * @param item - The kanban item
 * @param groupBy - How columns are organized
 * @returns The column ID this item belongs to (or array of IDs for tag mode)
 */
export function getColumnIdForItem(item: KanbanItem, groupBy: KanbanGroupBy): string {
  switch (groupBy) {
    case 'time':
      // Pass isTask=true only for tasks, false for events/birthdays
      // This ensures events go to 'past' column, tasks go to 'overdue' column
      const isTask = item.type === 'task';
      return getTimeColumnId(item.date, item.isCompleted, isTask);

    case 'status':
      // Events and birthdays go in 'active' for status view
      if (item.type !== 'task') return 'active';
      return item.status || 'inbox';

    case 'priority':
      return item.priority;

    case 'tag':
      // For tag mode, return first tag or 'untagged'
      // Items with multiple tags will be handled specially in groupItemsIntoColumns
      if (item.tags && item.tags.length > 0) {
        return `tag-${item.tags[0]}`;
      }
      return 'untagged';

    default:
      return 'later';
  }
}

/**
 * Get all unique tags from a list of items.
 * Used to create dynamic columns for tag-based grouping.
 *
 * @param items - All kanban items
 * @returns Array of unique tag names, sorted alphabetically
 */
export function getUniqueTags(items: KanbanItem[]): string[] {
  const tagSet = new Set<string>();

  for (const item of items) {
    if (item.tags && item.tags.length > 0) {
      for (const tag of item.tags) {
        tagSet.add(tag);
      }
    }
  }

  return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
}

/**
 * Sort items within a column.
 * Priority: overdue first, then by date, then by priority level.
 */
export function sortKanbanItems(items: KanbanItem[]): KanbanItem[] {
  return [...items].sort((a, b) => {
    // Overdue items first
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;

    // Then by date
    if (a.date && b.date) {
      const dateCompare = a.date.getTime() - b.date.getTime();
      if (dateCompare !== 0) return dateCompare;
    }
    if (a.date && !b.date) return -1;
    if (!a.date && b.date) return 1;

    // Then by priority (high first)
    const priorityOrder: Record<KanbanPriority, number> = {
      high: 0,
      medium: 1,
      low: 2,
      none: 3,
    };
    const priorityCompare = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityCompare !== 0) return priorityCompare;

    // Finally by title
    return a.title.localeCompare(b.title);
  });
}

/**
 * Group items into columns based on the groupBy mode.
 *
 * @param items - All kanban items
 * @param groupBy - How to group items
 * @returns Array of columns with their items
 */
export function groupItemsIntoColumns(
  items: KanbanItem[],
  groupBy: KanbanGroupBy
): KanbanColumn[] {
  // Handle tag-based grouping specially (dynamic columns)
  if (groupBy === 'tag') {
    return groupItemsByTag(items);
  }

  // Get column definitions based on groupBy mode
  const columnDefs = groupBy === 'time'
    ? TIME_COLUMNS
    : groupBy === 'status'
    ? STATUS_COLUMNS
    : PRIORITY_COLUMNS;

  // Create columns with empty item arrays
  const columns: KanbanColumn[] = columnDefs.map((def) => ({
    ...def,
    items: [],
  }));

  // Place each item in its column
  for (const item of items) {
    const columnId = getColumnIdForItem(item, groupBy);
    const column = columns.find((c) => c.id === columnId);

    if (column) {
      column.items.push(item);
    } else {
      // Fallback: put in last column
      logger.warn('⚠️ Item has no matching column', { itemId: item.id, columnId });
      columns[columns.length - 1].items.push(item);
    }
  }

  // Sort items within each column
  for (const column of columns) {
    column.items = sortKanbanItems(column.items);
  }

  return columns;
}

/**
 * Group items into columns by tag.
 * Creates dynamic columns based on unique tags in the items.
 * Items with multiple tags appear in ALL matching columns.
 *
 * @param items - All kanban items
 * @returns Array of tag-based columns with their items
 */
export function groupItemsByTag(items: KanbanItem[]): KanbanColumn[] {
  logger.debug('🏷️ Grouping items by tag', { itemCount: items.length });

  // Get all unique tags
  const uniqueTags = getUniqueTags(items);

  // Create columns for each tag
  const columns: KanbanColumn[] = uniqueTags.map((tag, index) => ({
    ...createTagColumn(tag, index),
    items: [],
  }));

  // Add "Untagged" column at the end
  const untaggedColumn: KanbanColumn = {
    ...UNTAGGED_COLUMN,
    items: [],
  };
  columns.push(untaggedColumn);

  // Place items in columns
  // NOTE: Items with multiple tags appear in ALL matching tag columns
  for (const item of items) {
    if (!item.tags || item.tags.length === 0) {
      // No tags → goes to Untagged column
      untaggedColumn.items.push(item);
    } else {
      // Has tags → add to each matching tag column
      for (const tag of item.tags) {
        const column = columns.find((c) => c.id === `tag-${tag}`);
        if (column) {
          column.items.push(item);
        }
      }
    }
  }

  // Sort items within each column
  for (const column of columns) {
    column.items = sortKanbanItems(column.items);
  }

  // Filter out empty tag columns (but keep Untagged even if empty)
  const nonEmptyColumns = columns.filter(
    (column) => column.items.length > 0 || column.id === 'untagged'
  );

  logger.debug('🏷️ Tag grouping complete', {
    tagColumns: nonEmptyColumns.length - 1,
    untaggedItems: untaggedColumn.items.length,
  });

  return nonEmptyColumns;
}

// ============================================================================
// 🪝 MAIN HOOK
// ============================================================================

/**
 * Main hook for Kanban board data and operations.
 *
 * @param config - Board configuration (groupBy, timeScope, filters)
 * @returns Columns, loading state, and mutation functions
 *
 * @example
 * ```tsx
 * const { columns, isLoading, moveItem, completeTask } = useKanban({
 *   groupBy: 'time',
 *   timeScope: 'week',
 *   filters: { showCompleted: false },
 * });
 * ```
 */
export function useKanban(config: KanbanConfig) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Get family context from centralized AuthProvider
  // This eliminates the redundant family_members lookup that was causing issues
  const { familyId, authState } = useAuth();

  const { groupBy, timeScope, filters = {} } = config;

  // Get date range for fetching
  const { start: rangeStart, end: rangeEnd } = getTimeScopeRange(timeScope);

  // Also fetch overdue items (before range start) - but limit to recent past
  const overdueStart = addDays(rangeStart, -30); // Look back 30 days for overdue tasks

  // For events (not tasks), we only need yesterday for "Past" column
  // Past events beyond yesterday are not useful - they already happened
  const eventPastStart = addDays(new Date(), -1); // Yesterday

  // ============================================================================
  // QUERIES
  // ============================================================================

  /**
   * Fetch tasks within the time scope.
   * Includes overdue tasks and optionally completed tasks.
   */
  const tasksQuery = useQuery({
    queryKey: ['kanban', 'tasks', timeScope, filters],
    queryFn: async (): Promise<Task[]> => {
      logger.info('📋 Kanban: Fetching tasks...', { timeScope, filters });

      let query = supabase
        .from('tasks')
        .select(`
          *,
          assigned_to:family_members!assigned_to_id(id, name, color),
          project:projects(id, title, color)
        `)
        .is('deleted_at', null);

      // Date range filter
      query = query.or(
        `due_date.gte.${overdueStart.toISOString()},due_date.is.null`
      );

      // Status filter
      if (!filters.showCompleted) {
        query = query.neq('status', 'done');
      }

      // Assignee filter
      if (filters.assignedTo) {
        query = query.eq('assigned_to_id', filters.assignedTo);
      }

      // Project filter
      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }

      const { data, error } = await query.order('due_date', { ascending: true });

      if (error) {
        logger.error('❌ Kanban: Failed to fetch tasks', { error: error.message });
        throw error;
      }

      logger.success(`✅ Kanban: Fetched ${data?.length || 0} tasks`);
      return data as Task[];
    },
    staleTime: 1000 * 60, // 1 minute
  });

  /**
   * Fetch family events within the time scope.
   * OPTIMIZATION: Only fetches from yesterday onwards (not full range start)
   * because past events beyond yesterday aren't actionable.
   */
  const eventsQuery = useQuery({
    queryKey: ['kanban', 'events', timeScope],
    queryFn: async () => {
      logger.info('📅 Kanban: Fetching family events...', { timeScope });

      // Use eventPastStart (yesterday) instead of rangeStart for past events
      // This prevents loading old past events that aren't useful
      const effectiveStart = eventPastStart > rangeStart ? rangeStart : eventPastStart;

      const { data, error } = await supabase
        .from('family_events')
        .select(`
          *,
          assignee:family_members!assigned_to(id, name, color)
        `)
        .gte('start_time', effectiveStart.toISOString())
        .lte('start_time', rangeEnd.toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        logger.error('❌ Kanban: Failed to fetch events', { error: error.message });
        throw error;
      }

      logger.success(`✅ Kanban: Fetched ${data?.length || 0} events`);
      return data as (FamilyEvent & { assignee?: { id: string; name: string; color: string | null } })[];
    },
    staleTime: 1000 * 60,
  });

  /**
   * Fetch external events (Google Calendar) within the time scope.
   * OPTIMIZATION: Only fetches from yesterday onwards.
   * External events are read-only, so past ones beyond yesterday are just noise.
   */
  const externalEventsQuery = useQuery({
    queryKey: ['kanban', 'external-events', timeScope],
    queryFn: async () => {
      logger.info('🔗 Kanban: Fetching external events...', { timeScope });

      // Only load external events from yesterday onwards
      // Past external events are not actionable - they already happened
      const effectiveStart = eventPastStart > rangeStart ? rangeStart : eventPastStart;

      const { data, error } = await supabase
        .from('external_events')
        .select(`
          *,
          subscription:google_calendar_subscriptions(calendar_name, calendar_color)
        `)
        .gte('start_time', effectiveStart.toISOString())
        .lte('start_time', rangeEnd.toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        logger.error('❌ Kanban: Failed to fetch external events', { error: error.message });
        throw error;
      }

      logger.success(`✅ Kanban: Fetched ${data?.length || 0} external events`);
      return data as (ExternalEvent & { subscription?: { calendar_name: string; calendar_color: string | null } })[];
    },
    staleTime: 1000 * 60,
  });

  /**
   * Fetch birthdays within the time scope.
   * NOTE: Requires the get_birthdays_in_range function to be deployed in Supabase.
   * If the function doesn't exist, this gracefully returns empty array.
   * Uses familyId from centralized AuthProvider (no redundant lookups needed).
   */
  const birthdaysQuery = useQuery({
    queryKey: ['kanban', 'birthdays', timeScope, familyId],
    queryFn: async (): Promise<Birthday[]> => {
      // Use familyId from AuthProvider (already available, no extra query needed)
      if (!familyId) {
        logger.debug('🎂 Kanban: No family context available, skipping birthdays');
        return [];
      }

      logger.info('🎂 Kanban: Fetching birthdays...', { timeScope, familyId });

      // Call the birthday RPC with correct parameter names
      const { data, error } = await supabase.rpc('get_birthdays_in_range', {
        p_family_id: familyId,
        p_start_date: rangeStart.toISOString().split('T')[0],
        p_end_date: rangeEnd.toISOString().split('T')[0],
      });

      if (error) {
        // If the function doesn't exist (migration not applied), gracefully skip
        if (error.message.includes('Could not find the function')) {
          logger.debug('🎂 Kanban: Birthday function not deployed, skipping');
          return [];
        }
        logger.error('❌ Kanban: Failed to fetch birthdays', { error: error.message });
        throw error;
      }

      logger.success(`✅ Kanban: Fetched ${data?.length || 0} birthdays`);
      return data as Birthday[];
    },
    // Only run when we have a familyId from AuthProvider
    enabled: !!familyId && authState === 'authenticated',
    staleTime: 1000 * 60 * 30, // 30 minutes - birthdays change infrequently
    // Don't retry if function doesn't exist - it won't suddenly appear
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('Could not find the function')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // ============================================================================
  // TRANSFORM & GROUP
  // ============================================================================

  /**
   * Transform all fetched data into KanbanItems and group into columns.
   */
  const columns = useMemo((): KanbanColumn[] => {
    const items: KanbanItem[] = [];

    // Transform tasks
    if (tasksQuery.data) {
      for (const task of tasksQuery.data) {
        // Check if should include based on filters
        const includeTypes = filters.includeTypes || ['task', 'event', 'external', 'birthday'];
        if (!includeTypes.includes('task')) continue;

        items.push(transformTask(task));
      }
    }

    // Transform family events
    if (eventsQuery.data) {
      const includeTypes = filters.includeTypes || ['task', 'event', 'external', 'birthday'];
      if (includeTypes.includes('event')) {
        for (const event of eventsQuery.data) {
          items.push(transformFamilyEvent(event, event.assignee));
        }
      }
    }

    // Transform external events
    if (externalEventsQuery.data) {
      const includeTypes = filters.includeTypes || ['task', 'event', 'external', 'birthday'];
      if (includeTypes.includes('external')) {
        for (const event of externalEventsQuery.data) {
          items.push(transformExternalEvent(event, event.subscription?.calendar_name));
        }
      }
    }

    // Transform birthdays
    if (birthdaysQuery.data) {
      const includeTypes = filters.includeTypes || ['task', 'event', 'external', 'birthday'];
      if (includeTypes.includes('birthday')) {
        for (const birthday of birthdaysQuery.data) {
          items.push(transformBirthday(birthday));
        }
      }
    }

    logger.debug('📊 Kanban: Grouping items into columns', {
      totalItems: items.length,
      groupBy,
    });

    return groupItemsIntoColumns(items, groupBy);
  }, [
    tasksQuery.data,
    eventsQuery.data,
    externalEventsQuery.data,
    birthdaysQuery.data,
    groupBy,
    filters.includeTypes,
  ]);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  /**
   * Move an item to a different column.
   * Updates the appropriate field based on groupBy mode.
   */
  const moveItemMutation = useMutation({
    mutationFn: async (result: KanbanDropResult) => {
      const { item, toColumnId } = result;

      logger.info('🔀 Kanban: Moving item...', {
        itemId: item.id,
        itemType: item.type,
        toColumn: toColumnId,
        groupBy,
      });

      // Only tasks and family events can be moved
      if (!item.isEditable) {
        throw new Error('This item cannot be moved');
      }

      if (item.type === 'task') {
        // Update task based on groupBy mode
        if (groupBy === 'time') {
          // Moving to time column = update due_date
          const newDate = getDateForTimeColumn(toColumnId);

          // If moving to 'done', also complete the task
          if (toColumnId === 'done') {
            const { error } = await supabase
              .from('tasks')
              .update({
                status: 'done',
                completed_at: new Date().toISOString(),
              })
              .eq('id', item.sourceId);

            if (error) throw error;
          } else if (newDate) {
            const { error } = await supabase
              .from('tasks')
              .update({
                due_date: newDate.toISOString().split('T')[0],
                status: item.status === 'done' ? 'active' : item.status, // Uncomplete if needed
                completed_at: null,
              })
              .eq('id', item.sourceId);

            if (error) throw error;
          }
        } else if (groupBy === 'status') {
          // Moving to status column = update status
          const { error } = await supabase
            .from('tasks')
            .update({
              status: toColumnId as TaskStatus,
              completed_at: toColumnId === 'done' ? new Date().toISOString() : null,
            })
            .eq('id', item.sourceId);

          if (error) throw error;
        } else if (groupBy === 'priority') {
          // Moving to priority column = update priority
          const priorityMap: Record<string, number> = {
            high: 3,
            medium: 2,
            low: 1,
            none: 0,
          };
          const { error } = await supabase
            .from('tasks')
            .update({ priority: priorityMap[toColumnId] ?? 0 })
            .eq('id', item.sourceId);

          if (error) throw error;
        }
      } else if (item.type === 'event') {
        // For events, only time-based moves make sense (reschedule)
        if (groupBy === 'time' && toColumnId !== 'done') {
          const newDate = getDateForTimeColumn(toColumnId);
          if (newDate) {
            // Preserve the time, just change the date
            const originalStart = new Date((item._source as FamilyEvent).start_time);
            const newStart = new Date(newDate);
            newStart.setHours(originalStart.getHours());
            newStart.setMinutes(originalStart.getMinutes());

            const { error } = await supabase
              .from('family_events')
              .update({ start_time: newStart.toISOString() })
              .eq('id', item.sourceId);

            if (error) throw error;
          }
        }
      }

      logger.success('✅ Kanban: Item moved');
      return result;
    },

    onSuccess: () => {
      // Invalidate all kanban queries to refetch
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Item moved');
    },

    onError: (error) => {
      logger.error('❌ Kanban: Failed to move item', { error });
      toast.error('Failed to move item');
    },
  });

  /**
   * Complete a task (mark as done).
   */
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      logger.info('✅ Kanban: Completing task...', { taskId });

      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'done',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;

      logger.success('🎉 Kanban: Task completed');
      return taskId;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast.success('Task completed!');
    },

    onError: () => {
      toast.error('Failed to complete task');
    },
  });

  /**
   * Uncomplete a task (mark as active).
   */
  const uncompleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      logger.info('↩️ Kanban: Uncompleting task...', { taskId });

      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'active',
          completed_at: null,
        })
        .eq('id', taskId);

      if (error) throw error;

      logger.success('✅ Kanban: Task uncompleted');
      return taskId;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast.success('Task restored');
    },

    onError: () => {
      toast.error('Failed to restore task');
    },
  });

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    /** Organized columns with items */
    columns,

    /** Loading state for any query */
    isLoading:
      authState === 'loading' ||
      tasksQuery.isLoading ||
      eventsQuery.isLoading ||
      externalEventsQuery.isLoading ||
      birthdaysQuery.isLoading,

    /** Error from any query */
    error:
      tasksQuery.error ||
      eventsQuery.error ||
      externalEventsQuery.error ||
      birthdaysQuery.error,

    /** Refetch all data */
    refetch: () => {
      tasksQuery.refetch();
      eventsQuery.refetch();
      externalEventsQuery.refetch();
      birthdaysQuery.refetch();
    },

    /** Move an item to a different column */
    moveItem: moveItemMutation.mutate,
    isMoving: moveItemMutation.isPending,

    /** Complete a task */
    completeTask: completeTaskMutation.mutate,
    isCompleting: completeTaskMutation.isPending,

    /** Uncomplete a task */
    uncompleteTask: uncompleteTaskMutation.mutate,
    isUncompleting: uncompleteTaskMutation.isPending,

    /** Configuration for reference */
    config,

    /** Date range being displayed */
    dateRange: { start: rangeStart, end: rangeEnd },
  };
}

// ============================================================================
// 📤 EXPORTS
// ============================================================================

export type { KanbanConfig, KanbanItem, KanbanColumn, KanbanDropResult };
