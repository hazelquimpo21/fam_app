'use client';

/**
 * ============================================================================
 * 📋 KanbanCard Component
 * ============================================================================
 *
 * A unified card component for displaying items on the Kanban board.
 * Renders tasks, events, external events, and birthdays with consistent
 * styling but clear visual distinction.
 *
 * VISUAL DESIGN:
 * - Tasks: Blue accent, checkbox, drag handle
 * - Fam Events: Indigo accent, calendar icon, drag handle
 * - Google Events: Red accent, Google badge, no drag (read-only)
 * - Birthdays: Pink gradient, cake emoji, no drag (read-only)
 *
 * INTERACTIONS:
 * - Click: Opens edit modal (for editable items)
 * - Checkbox: Completes task (for tasks only)
 * - Drag: Moves to different column (for editable items)
 *
 * USAGE:
 * ```tsx
 * <KanbanCard
 *   item={kanbanItem}
 *   onClick={() => openEditModal(item)}
 *   onComplete={() => completeTask(item.sourceId)}
 *   isDragging={isDragging}
 * />
 * ```
 *
 * ============================================================================
 */

import * as React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  GripVertical,
  Check,
  ExternalLink,
  Folder,
} from 'lucide-react';
import { Avatar } from '@/components/shared/avatar';
import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';
import type { KanbanItem, KanbanItemType } from '@/types/kanban';

// ============================================================================
// TYPES
// ============================================================================

interface KanbanCardProps {
  /** The kanban item to display */
  item: KanbanItem;

  /** Click handler (opens edit modal) */
  onClick?: () => void;

  /** Complete/uncomplete handler (for tasks) */
  onComplete?: () => void;

  /** Whether this card is being dragged */
  isDragging?: boolean;

  /** Whether dragging is enabled */
  draggable?: boolean;

  /** Compact mode for dense layouts */
  compact?: boolean;
}

// ============================================================================
// STYLING
// ============================================================================

/**
 * Visual styling per item type.
 * Each type has distinct colors for quick identification.
 */
const TYPE_STYLES: Record<
  KanbanItemType,
  {
    border: string;
    bg: string;
    hoverBg: string;
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
    checkboxBorder: string;
    checkboxChecked: string;
  }
> = {
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

/**
 * Priority indicator colors.
 */
const PRIORITY_COLORS = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-blue-500',
  none: 'bg-transparent',
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Checkbox for completing tasks.
 * Includes click handler that stops propagation.
 */
function TaskCheckbox({
  isCompleted,
  onComplete,
  styles,
}: {
  isCompleted: boolean;
  onComplete?: () => void;
  styles: typeof TYPE_STYLES['task'];
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger card click
    onComplete?.();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
        isCompleted ? styles.checkboxChecked : styles.checkboxBorder,
        !isCompleted && 'hover:bg-blue-50'
      )}
      aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
    >
      {isCompleted && <Check className="w-3 h-3 text-white" />}
    </button>
  );
}

/**
 * Drag handle indicator.
 * Only shown for draggable items.
 */
function DragHandle({ styles }: { styles: typeof TYPE_STYLES['task'] }) {
  return (
    <div
      className={cn(
        'opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing',
        styles.iconColor
      )}
    >
      <GripVertical className="w-4 h-4" />
    </div>
  );
}

/**
 * Type badge showing item source.
 */
function TypeBadge({ item, styles }: { item: KanbanItem; styles: typeof TYPE_STYLES['task'] }) {
  // Don't show badge for tasks (they're the default)
  if (item.type === 'task') return null;

  return (
    <span
      className={cn(
        'text-xs px-1.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1',
        styles.badgeBg,
        styles.badgeText
      )}
    >
      {item.type === 'external' && (
        <>
          <svg className="h-2.5 w-2.5" viewBox="0 0 24 24">
            <path
              fill="#DB4437"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#4285F4"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
          </svg>
          {item.meta?.calendarName || 'Google'}
        </>
      )}
      {item.type === 'event' && 'Event'}
      {item.type === 'birthday' && `Turning ${item.meta?.ageTurning}`}
    </span>
  );
}

/**
 * Time display for timed events.
 */
function TimeDisplay({ item, styles }: { item: KanbanItem; styles: typeof TYPE_STYLES['task'] }) {
  if (item.isAllDay) {
    return <span className="text-xs text-neutral-500">All day</span>;
  }

  if (item.startTime) {
    const timeStr = format(item.startTime, 'h:mm a');
    return (
      <span className={cn('text-xs flex items-center gap-1', styles.iconColor)}>
        <Clock className="w-3 h-3" />
        {timeStr}
      </span>
    );
  }

  return null;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * KanbanCard - Unified card for Kanban board items.
 *
 * Renders tasks, events, external events, and birthdays with
 * appropriate styling and interactions.
 */
export function KanbanCard({
  item,
  onClick,
  onComplete,
  isDragging = false,
  draggable = false,
  compact = false,
}: KanbanCardProps) {
  const styles = TYPE_STYLES[item.type];

  // ============================================================================
  // RENDER - Compact Mode
  // ============================================================================

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'group flex items-center gap-2 rounded-md border p-2 transition-all',
          styles.border,
          styles.bg,
          onClick && 'cursor-pointer',
          onClick && styles.hoverBg,
          isDragging && 'opacity-50 shadow-lg ring-2 ring-blue-400',
          item.isOverdue && 'border-red-300 bg-red-50'
        )}
      >
        {/* Checkbox (tasks only) */}
        {item.isCompletable && (
          <TaskCheckbox
            isCompleted={item.isCompleted}
            onComplete={onComplete}
            styles={styles}
          />
        )}

        {/* Icon */}
        {item.icon && <span className="text-sm">{item.icon}</span>}

        {/* Title */}
        <span
          className={cn(
            'text-sm font-medium truncate flex-1',
            item.isCompleted && 'line-through text-neutral-400'
          )}
        >
          {item.title}
        </span>

        {/* Time */}
        <TimeDisplay item={item} styles={styles} />
      </div>
    );
  }

  // ============================================================================
  // RENDER - Full Mode
  // ============================================================================

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex flex-col gap-2 rounded-lg border p-3 transition-all',
        styles.border,
        styles.bg,
        onClick && 'cursor-pointer',
        onClick && styles.hoverBg,
        isDragging && 'opacity-50 shadow-lg ring-2 ring-blue-400 rotate-2',
        item.isOverdue && 'border-red-300 bg-red-50'
      )}
    >
      {/* Priority indicator stripe */}
      {item.priority !== 'none' && (
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-1 rounded-l-lg',
            PRIORITY_COLORS[item.priority]
          )}
        />
      )}

      {/* Top row: Drag handle + Checkbox + Title + Badge */}
      <div className="flex items-start gap-2">
        {/* Drag handle (editable items only) */}
        {item.isEditable && draggable && <DragHandle styles={styles} />}

        {/* Checkbox (tasks only) */}
        {item.isCompletable && (
          <TaskCheckbox
            isCompleted={item.isCompleted}
            onComplete={onComplete}
            styles={styles}
          />
        )}

        {/* Icon (for non-tasks) */}
        {!item.isCompletable && item.icon && (
          <div
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
              styles.iconBg
            )}
          >
            <span className="text-xs">{item.icon}</span>
          </div>
        )}

        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'font-medium text-neutral-900 truncate',
                item.isCompleted && 'line-through text-neutral-400'
              )}
            >
              {item.title}
            </span>
            <TypeBadge item={item} styles={styles} />
          </div>

          {/* Description (if present and not compact) */}
          {item.description && (
            <p className="text-xs text-neutral-500 truncate mt-0.5">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Bottom row: Meta info */}
      <div className="flex items-center gap-3 text-xs text-neutral-500 pl-7">
        {/* Time */}
        <TimeDisplay item={item} styles={styles} />

        {/* Date (if showing across days) */}
        {item.date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(item.date, 'MMM d')}
          </span>
        )}

        {/* Location */}
        {item.location && (
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3" />
            {item.location}
          </span>
        )}

        {/* Project (for tasks) */}
        {item.project && (
          <span
            className="flex items-center gap-1 truncate"
            style={{ color: item.project.color || undefined }}
          >
            <Folder className="w-3 h-3" />
            {item.project.title}
          </span>
        )}

        {/* Read-only indicator (external events) */}
        {item.type === 'external' && (
          <span className="flex items-center gap-1 text-neutral-400 ml-auto">
            <ExternalLink className="w-3 h-3" />
            Read-only
          </span>
        )}
      </div>

      {/* Assignee avatar (bottom right) */}
      {item.assignee && (
        <div className="absolute bottom-2 right-2">
          <Avatar
            name={item.assignee.name}
            color={item.assignee.color || undefined}
            size="sm"
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

/**
 * Loading skeleton for KanbanCard.
 */
export function KanbanCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-neutral-200 p-2 animate-pulse">
        <div className="w-5 h-5 rounded bg-neutral-200" />
        <div className="flex-1 h-4 rounded bg-neutral-200" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 p-3 animate-pulse">
      <div className="flex items-start gap-2">
        <div className="w-5 h-5 rounded bg-neutral-200" />
        <div className="flex-1">
          <div className="h-4 w-3/4 rounded bg-neutral-200" />
          <div className="h-3 w-1/2 rounded bg-neutral-200 mt-2" />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2 pl-7">
        <div className="h-3 w-16 rounded bg-neutral-200" />
        <div className="h-3 w-12 rounded bg-neutral-200" />
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { KanbanCardProps };
