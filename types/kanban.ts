/**
 * ============================================================================
 * 📋 Kanban Types
 * ============================================================================
 *
 * TypeScript types for the unified Kanban board system.
 *
 * The Kanban board can display:
 * - Tasks (draggable, editable)
 * - Family Events (draggable, editable)
 * - External Events (read-only, from Google Calendar)
 * - Birthdays (read-only, special styling)
 *
 * KEY CONCEPTS:
 * 1. GroupBy Mode - How columns are organized:
 *    - 'time': Columns by date (Overdue, Today, Tomorrow, This Week, etc.)
 *    - 'status': Columns by task status (Inbox, Active, Waiting, Done)
 *    - 'priority': Columns by priority level (High, Medium, Low, None)
 *
 * 2. Time Scope - How far into the future to show:
 *    - 'week': Show items for current week
 *    - 'month': Show items for current month
 *    - 'quarter': Show items for current quarter
 *    - 'year': Show items for current year
 *
 * 3. KanbanItem - Unified item type that wraps tasks, events, etc.
 *    All items are converted to this format for consistent handling.
 *
 * FUTURE AI DEVELOPERS:
 * When adding new item types (e.g., meals, goals), create a transformer
 * function that converts them to KanbanItem format.
 *
 * See: /lib/hooks/use-kanban.ts for data fetching and transformation logic.
 *
 * ============================================================================
 */

import type { Task, TaskStatus } from './database';
import type { CalendarItem, FamilyEvent, ExternalEvent, Birthday } from './calendar';

// ============================================================================
// 📊 BOARD CONFIGURATION
// ============================================================================

/**
 * How to group items into columns.
 * Each mode creates different column sets.
 *
 * - 'time': Columns by date (Overdue, Today, Tomorrow, This Week, etc.)
 * - 'status': Columns by task status (Inbox, Active, Waiting, Done)
 * - 'priority': Columns by priority level (High, Medium, Low, None)
 * - 'tag': Dynamic columns based on task tags (@home, @work, etc.)
 */
export type KanbanGroupBy = 'time' | 'status' | 'priority' | 'tag';

/**
 * Time range filter for which items to display.
 * Controls the outer boundary of what's shown on the board.
 */
export type KanbanTimeScope = 'week' | 'month' | 'quarter' | 'year';

/**
 * Filter configuration for the Kanban board.
 * Used to narrow down which items are displayed.
 */
export interface KanbanFilters {
  /** Filter by assigned family member */
  assignedTo?: string | null;

  /** Filter by project */
  projectId?: string | null;

  /** Show/hide completed items */
  showCompleted?: boolean;

  /** Item types to include */
  includeTypes?: KanbanItemType[];
}

/**
 * Full configuration for the Kanban board.
 * Passed to useKanban hook to control data fetching and display.
 */
export interface KanbanConfig {
  /** How to organize columns */
  groupBy: KanbanGroupBy;

  /** Time range to display */
  timeScope: KanbanTimeScope;

  /** Additional filters */
  filters?: KanbanFilters;
}

// ============================================================================
// 📋 KANBAN ITEMS
// ============================================================================

/**
 * Item type discriminator.
 * Used for rendering and determining editability.
 *
 * - 'task': Fam task (draggable, editable)
 * - 'event': Fam event (draggable, editable)
 * - 'external': Google Calendar event (read-only)
 * - 'birthday': Birthday from family/contacts (read-only)
 */
export type KanbanItemType = 'task' | 'event' | 'external' | 'birthday';

/**
 * Priority levels for visual styling.
 */
export type KanbanPriority = 'high' | 'medium' | 'low' | 'none';

/**
 * Unified item format for the Kanban board.
 * All source types (tasks, events, etc.) are converted to this format.
 *
 * This abstraction allows the board to handle any item type consistently
 * while preserving the original data for mutations.
 */
export interface KanbanItem {
  /**
   * Unique identifier for the item.
   * Format: "{type}-{sourceId}" (e.g., "task-abc123", "event-xyz789")
   * This ensures uniqueness across different item types.
   */
  id: string;

  /**
   * The original source type.
   * Used for determining edit behavior and visual styling.
   */
  type: KanbanItemType;

  /**
   * Original source ID (without type prefix).
   * Used for mutations (update, delete, etc.).
   */
  sourceId: string;

  /**
   * Display title.
   */
  title: string;

  /**
   * Optional description for hover/detail views.
   */
  description?: string;

  /**
   * The date this item belongs to.
   * For tasks: due_date or scheduled_date
   * For events: start_time date portion
   * For birthdays: display_date
   */
  date: Date | null;

  /**
   * Start time (for timed items).
   * Null for all-day events and tasks without times.
   */
  startTime?: Date;

  /**
   * End time (for events with duration).
   */
  endTime?: Date;

  /**
   * Whether this is an all-day item.
   */
  isAllDay: boolean;

  /**
   * Task status (only for tasks).
   * Used for status-based column grouping.
   */
  status?: TaskStatus;

  /**
   * Priority level (mainly for tasks).
   * Used for priority-based column grouping and styling.
   */
  priority: KanbanPriority;

  /**
   * Whether the item is completed.
   * True for tasks with status='done'.
   */
  isCompleted: boolean;

  /**
   * Whether this item is overdue (TASKS ONLY).
   * True for incomplete tasks with past due dates.
   *
   * SEMANTIC DISTINCTION (for future AI developers):
   * - isOverdue = Task you were supposed to DO that you didn't (needs action, urgent)
   * - isPast = Event that already OCCURRED (informational, not urgent)
   *
   * Tasks can be overdue. Events cannot be overdue - they just happened.
   */
  isOverdue: boolean;

  /**
   * Whether this item is in the past (EVENTS/BIRTHDAYS).
   * True for events and birthdays whose date has passed.
   *
   * Past events are shown in a neutral "Past" column, not the alarming "Overdue" column.
   * This provides a better UX - past events aren't failures, they're history.
   */
  isPast: boolean;

  /**
   * Whether this item can be edited/dragged.
   * False for external events and birthdays.
   */
  isEditable: boolean;

  /**
   * Whether this item can be completed (checkbox).
   * Only true for tasks.
   */
  isCompletable: boolean;

  /**
   * Display color (from item, project, or assignee).
   */
  color?: string;

  /**
   * Display icon/emoji.
   */
  icon?: string;

  /**
   * Location (for events).
   */
  location?: string;

  /**
   * Assigned family member info.
   */
  assignee?: {
    id: string;
    name: string;
    color: string | null;
  };

  /**
   * Project info (for tasks).
   */
  project?: {
    id: string;
    title: string;
    color?: string;
  };

  /**
   * Tags for the item (mainly for tasks).
   * Used for tag-based column grouping.
   * Example: ['@home', '@work', 'urgent']
   */
  tags?: string[];

  /**
   * Source-specific metadata.
   */
  meta?: {
    /** For birthdays: age turning */
    ageTurning?: number;
    /** For tasks: goal association */
    goalId?: string;
    /** For external: calendar name */
    calendarName?: string;
  };

  /**
   * Reference to original source object.
   * Used for editing operations.
   */
  _source: Task | FamilyEvent | ExternalEvent | Birthday | CalendarItem;
}

// ============================================================================
// 📊 COLUMNS
// ============================================================================

/**
 * A column in the Kanban board.
 * Contains items that match the column's criteria.
 */
export interface KanbanColumn {
  /**
   * Unique identifier for the column.
   * Format depends on groupBy mode:
   * - time: 'overdue', 'today', 'tomorrow', 'this-week', 'later', 'done'
   * - status: 'inbox', 'active', 'waiting_for', 'someday', 'done'
   * - priority: 'high', 'medium', 'low', 'none'
   */
  id: string;

  /**
   * Display title for column header.
   */
  title: string;

  /**
   * Color accent for the column header.
   */
  color?: string;

  /**
   * Icon to display in header.
   */
  icon?: string;

  /**
   * Items in this column.
   * Sorted by date, then by priority.
   */
  items: KanbanItem[];

  /**
   * Whether items can be dropped into this column.
   * False for the 'done' column when dragging events.
   */
  acceptsDrop: boolean;

  /**
   * For time columns: date range this column represents.
   * Used for determining where dropped items should go.
   */
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// ============================================================================
// 📊 COLUMN DEFINITIONS
// ============================================================================

/**
 * Column definitions for time-based grouping.
 * Used when groupBy='time'.
 *
 * IMPORTANT SEMANTIC DISTINCTION (for future AI developers):
 * - "Past" column: Events/birthdays that already HAPPENED (neutral, informational)
 * - "Overdue" column: Tasks you were supposed to DO but didn't (red, urgent)
 *
 * This distinction exists because:
 * - Tasks are actionable → can be overdue (you failed to complete them)
 * - Events are temporal → cannot be overdue (they just occurred)
 *
 * A doctor's appointment from yesterday isn't "overdue" - you attended it.
 * A task from yesterday that's incomplete IS overdue - you need to do it.
 */
export const TIME_COLUMNS: Omit<KanbanColumn, 'items'>[] = [
  {
    id: 'past',
    title: 'Past',
    color: 'neutral',
    icon: '📜',
    acceptsDrop: false, // Can't schedule things in the past
  },
  {
    id: 'overdue',
    title: 'Overdue',
    color: 'red',
    icon: '⚠️',
    acceptsDrop: true,
  },
  {
    id: 'today',
    title: 'Today',
    color: 'blue',
    icon: '☀️',
    acceptsDrop: true,
  },
  {
    id: 'tomorrow',
    title: 'Tomorrow',
    color: 'indigo',
    icon: '📅',
    acceptsDrop: true,
  },
  {
    id: 'this-week',
    title: 'This Week',
    color: 'purple',
    icon: '📆',
    acceptsDrop: true,
  },
  {
    id: 'later',
    title: 'Later',
    color: 'neutral',
    icon: '🔮',
    acceptsDrop: true,
  },
  {
    id: 'done',
    title: 'Done',
    color: 'green',
    icon: '✅',
    acceptsDrop: true,
  },
];

/**
 * Column definitions for status-based grouping.
 * Used when groupBy='status'.
 */
export const STATUS_COLUMNS: Omit<KanbanColumn, 'items'>[] = [
  {
    id: 'inbox',
    title: 'Inbox',
    color: 'neutral',
    icon: '📥',
    acceptsDrop: true,
  },
  {
    id: 'active',
    title: 'Active',
    color: 'blue',
    icon: '🎯',
    acceptsDrop: true,
  },
  {
    id: 'waiting_for',
    title: 'Waiting For',
    color: 'amber',
    icon: '⏳',
    acceptsDrop: true,
  },
  {
    id: 'someday',
    title: 'Someday',
    color: 'purple',
    icon: '✨',
    acceptsDrop: true,
  },
  {
    id: 'done',
    title: 'Done',
    color: 'green',
    icon: '✅',
    acceptsDrop: true,
  },
];

/**
 * Column definitions for priority-based grouping.
 * Used when groupBy='priority'.
 */
export const PRIORITY_COLUMNS: Omit<KanbanColumn, 'items'>[] = [
  {
    id: 'high',
    title: 'High Priority',
    color: 'red',
    icon: '🔴',
    acceptsDrop: true,
  },
  {
    id: 'medium',
    title: 'Medium Priority',
    color: 'amber',
    icon: '🟡',
    acceptsDrop: true,
  },
  {
    id: 'low',
    title: 'Low Priority',
    color: 'blue',
    icon: '🔵',
    acceptsDrop: true,
  },
  {
    id: 'none',
    title: 'No Priority',
    color: 'neutral',
    icon: '⚪',
    acceptsDrop: true,
  },
];

/**
 * Column definition for untagged items.
 * Used in tag-based grouping for items without tags.
 */
export const UNTAGGED_COLUMN: Omit<KanbanColumn, 'items'> = {
  id: 'untagged',
  title: 'Untagged',
  color: 'neutral',
  icon: '📋',
  acceptsDrop: true,
};

/**
 * Predefined tag colors for dynamic tag columns.
 * Colors cycle through this array based on tag index.
 */
export const TAG_COLUMN_COLORS = [
  'blue',
  'green',
  'purple',
  'amber',
  'red',
  'indigo',
  'neutral',
] as const;

/**
 * Create a column definition for a specific tag.
 * Used to generate dynamic columns in tag-based grouping.
 *
 * @param tag - The tag name
 * @param colorIndex - Index into TAG_COLUMN_COLORS
 * @returns Column definition for this tag
 */
export function createTagColumn(tag: string, colorIndex: number): Omit<KanbanColumn, 'items'> {
  const color = TAG_COLUMN_COLORS[colorIndex % TAG_COLUMN_COLORS.length];

  return {
    id: `tag-${tag}`,
    title: tag,
    color,
    icon: '🏷️',
    acceptsDrop: true,
  };
}

// ============================================================================
// 🎯 DRAG AND DROP
// ============================================================================

/**
 * Data attached to dragged items.
 * Used to identify what was dragged and where it can go.
 */
export interface KanbanDragItem {
  /** The item being dragged */
  item: KanbanItem;

  /** Source column ID */
  fromColumnId: string;
}

/**
 * Result of a drop operation.
 * Used to trigger the appropriate mutation.
 */
export interface KanbanDropResult {
  /** The item that was dropped */
  item: KanbanItem;

  /** Column it was dropped into */
  toColumnId: string;

  /** Position within the column (for reordering) */
  toIndex: number;
}

// ============================================================================
// 📤 EXPORTS
// ============================================================================

export type {
  Task,
  FamilyEvent,
  ExternalEvent,
  Birthday,
  CalendarItem,
};
