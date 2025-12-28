/**
 * ============================================================================
 * KANBAN STYLE CONSTANTS
 * ============================================================================
 *
 * Centralized styling definitions for Kanban board components.
 * Extracted to eliminate duplication across:
 * - kanban-card.tsx
 * - kanban-sortable-card.tsx
 * - kanban-drag-overlay.tsx
 *
 * FUTURE AI DEVELOPERS:
 * - To add a new item type, add an entry to TYPE_STYLES
 * - Colors use Tailwind classes for consistency
 * - Each item type has a distinct color palette for quick visual identification
 *
 * ============================================================================
 */

import type { KanbanItemType } from '@/types/kanban';

// ============================================================================
// ITEM TYPE STYLES
// ============================================================================

/**
 * Visual styling per item type.
 * Each type has distinct colors for quick identification:
 * - Tasks: Blue (default, completable items)
 * - Events: Indigo (Fam-native calendar events)
 * - External: Neutral with red accent (Google Calendar, read-only)
 * - Birthday: Pink gradient (celebratory, read-only)
 */
export interface ItemTypeStyle {
  /** Border color class */
  border: string;
  /** Background color class */
  bg: string;
  /** Hover background color class */
  hoverBg: string;
  /** Icon background color class */
  iconBg: string;
  /** Icon text color class */
  iconColor: string;
  /** Badge background color class */
  badgeBg: string;
  /** Badge text color class */
  badgeText: string;
  /** Checkbox border color class */
  checkboxBorder: string;
  /** Checkbox checked state color class */
  checkboxChecked: string;
}

export const TYPE_STYLES: Record<KanbanItemType, ItemTypeStyle> = {
  task: {
    border: 'border-blue-200',
    bg: 'bg-white',
    hoverBg: 'hover:bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    checkboxBorder: 'border-blue-300',
    checkboxChecked: 'bg-blue-500 border-blue-500',
  },
  event: {
    border: 'border-indigo-200',
    bg: 'bg-white',
    hoverBg: 'hover:bg-indigo-50',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-700',
    checkboxBorder: 'border-indigo-300',
    checkboxChecked: 'bg-indigo-500 border-indigo-500',
  },
  external: {
    border: 'border-neutral-200',
    bg: 'bg-neutral-50',
    hoverBg: 'hover:bg-neutral-100',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
    checkboxBorder: 'border-neutral-300',
    checkboxChecked: 'bg-neutral-500 border-neutral-500',
  },
  birthday: {
    border: 'border-pink-200',
    bg: 'bg-gradient-to-r from-pink-50 to-purple-50',
    hoverBg: 'hover:from-pink-100 hover:to-purple-100',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-700',
    checkboxBorder: 'border-pink-300',
    checkboxChecked: 'bg-pink-500 border-pink-500',
  },
};

// ============================================================================
// PRIORITY COLORS
// ============================================================================

/**
 * Priority level indicator colors.
 * Used for the left stripe on cards.
 */
export const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-blue-500',
  none: 'bg-transparent',
};

// ============================================================================
// COLUMN COLORS
// ============================================================================

/**
 * Color scheme for column headers.
 * Maps color name to Tailwind classes.
 */
export interface ColumnColorScheme {
  /** Background color class */
  bg: string;
  /** Text color class */
  text: string;
  /** Border color class */
  border: string;
  /** Ring/focus color class */
  ring: string;
}

export const COLUMN_COLORS: Record<string, ColumnColorScheme> = {
  red: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    ring: 'ring-red-400',
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    ring: 'ring-blue-400',
  },
  indigo: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    ring: 'ring-indigo-400',
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200',
    ring: 'ring-purple-400',
  },
  amber: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    ring: 'ring-amber-400',
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    ring: 'ring-green-400',
  },
  neutral: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-700',
    border: 'border-neutral-200',
    ring: 'ring-neutral-400',
  },
};

// ============================================================================
// EMPTY STATE MESSAGES
// ============================================================================

/**
 * User-friendly empty state messages per column type.
 * Includes action hints to guide users on what to do.
 *
 * SEMANTIC NOTE (for future AI developers):
 * - "past" = Events/birthdays that already happened (neutral, informational)
 * - "overdue" = Tasks with past due dates that aren't completed (urgent, needs action)
 *
 * These are separate concepts with distinct UX implications.
 */
export const EMPTY_STATE_MESSAGES: Record<string, { message: string; hint: string }> = {
  past: {
    message: 'No past events this week',
    hint: 'Events that already happened appear here',
  },
  overdue: {
    message: 'No overdue tasks!',
    hint: 'Great job staying on top of things',
  },
  today: {
    message: 'Nothing scheduled today',
    hint: 'Drag items here or click + to add',
  },
  tomorrow: {
    message: 'Nothing for tomorrow yet',
    hint: 'Plan ahead by dragging tasks here',
  },
  'this-week': {
    message: 'Week is looking clear',
    hint: 'Add tasks for later this week',
  },
  later: {
    message: 'Nothing planned for later',
    hint: 'Schedule future tasks here',
  },
  done: {
    message: 'No completed items',
    hint: 'Check off tasks to see them here',
  },
  inbox: {
    message: 'Inbox is empty',
    hint: 'Quick-add new items with Cmd+K',
  },
  active: {
    message: 'No active items',
    hint: 'Process inbox items to activate them',
  },
  waiting_for: {
    message: 'Not waiting on anything',
    hint: 'Mark blocked tasks as waiting',
  },
  someday: {
    message: 'No someday items',
    hint: 'Add ideas for future consideration',
  },
  high: {
    message: 'No high priority items',
    hint: 'Set priority on important tasks',
  },
  medium: {
    message: 'No medium priority items',
    hint: 'Assign priority levels to organize',
  },
  low: {
    message: 'No low priority items',
    hint: 'Low priority items appear here',
  },
  none: {
    message: 'All items have priorities',
    hint: 'Unprioritized items appear here',
  },
  untagged: {
    message: 'No untagged items',
    hint: 'Items without tags appear here',
  },
};

/**
 * Get empty state content for a column.
 * Falls back to generic message if column ID not found.
 */
export function getEmptyStateContent(columnId: string): { message: string; hint: string } {
  return EMPTY_STATE_MESSAGES[columnId] || {
    message: 'No items',
    hint: 'Drag items here to add them',
  };
}
