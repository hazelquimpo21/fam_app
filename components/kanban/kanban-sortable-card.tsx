'use client';

/**
 * ============================================================================
 * 🔀 KanbanSortableCard Component
 * ============================================================================
 *
 * Wrapper component that makes KanbanCard sortable using @dnd-kit.
 * Handles the drag-and-drop mechanics while delegating rendering to KanbanCard.
 *
 * ARCHITECTURE:
 * ```
 * KanbanSortableCard (drag mechanics)
 *   └── KanbanCard (visual rendering)
 * ```
 *
 * FEATURES:
 * - Sortable within columns (reordering)
 * - Draggable between columns (moving)
 * - Touch-friendly with long-press activation
 * - Keyboard accessible (Tab + Space/Enter)
 * - Visual state feedback (opacity, scale)
 *
 * USAGE:
 * ```tsx
 * <SortableContext items={items.map(i => i.id)}>
 *   {items.map(item => (
 *     <KanbanSortableCard
 *       key={item.id}
 *       item={item}
 *       onClick={handleClick}
 *     />
 *   ))}
 * </SortableContext>
 * ```
 *
 * FUTURE AI DEVELOPERS:
 * - useSortable provides: attributes, listeners, setNodeRef, transform, transition
 * - Transform is applied via style to move the element
 * - isDragging flag is used to reduce opacity of the original
 *
 * ============================================================================
 */

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { cn } from '@/lib/utils/cn';
import type { KanbanItem } from '@/types/kanban';

// ============================================================================
// TYPES
// ============================================================================

interface KanbanSortableCardProps {
  /** The kanban item to render */
  item: KanbanItem;

  /** Click handler (opens edit modal) */
  onClick?: () => void;

  /** Complete/uncomplete handler (for tasks) */
  onComplete?: () => void;

  /** Whether dragging is disabled */
  disabled?: boolean;

  /** Compact mode for dense layouts */
  compact?: boolean;

  /** Custom class name */
  className?: string;
}

// ============================================================================
// STYLING
// ============================================================================

/**
 * Visual styling per item type.
 */
const TYPE_STYLES: Record<
  string,
  {
    border: string;
    bg: string;
    hoverBg: string;
    iconBg: string;
    iconColor: string;
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
    checkboxBorder: 'border-blue-300',
    checkboxChecked: 'bg-blue-500 border-blue-500',
  },
  event: {
    border: 'border-indigo-200',
    bg: 'bg-white',
    hoverBg: 'hover:bg-indigo-50',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    checkboxBorder: 'border-indigo-300',
    checkboxChecked: 'bg-indigo-500 border-indigo-500',
  },
  external: {
    border: 'border-neutral-200',
    bg: 'bg-neutral-50',
    hoverBg: 'hover:bg-neutral-100',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    checkboxBorder: 'border-neutral-300',
    checkboxChecked: 'bg-neutral-500 border-neutral-500',
  },
  birthday: {
    border: 'border-pink-200',
    bg: 'bg-gradient-to-r from-pink-50 to-purple-50',
    hoverBg: 'hover:from-pink-100 hover:to-purple-100',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    checkboxBorder: 'border-pink-300',
    checkboxChecked: 'bg-pink-500 border-pink-500',
  },
};

/**
 * Priority indicator colors.
 */
const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-blue-500',
  none: 'bg-transparent',
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

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
import { format } from 'date-fns';

/**
 * Task checkbox with click handling.
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
    e.stopPropagation();
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
 */
function DragHandle({
  styles,
  listeners,
  attributes,
}: {
  styles: typeof TYPE_STYLES['task'];
  listeners: any;
  attributes: any;
}) {
  return (
    <button
      className={cn(
        'p-0.5 rounded cursor-grab active:cursor-grabbing transition-colors',
        'hover:bg-neutral-200/50 touch-none',
        styles.iconColor
      )}
      {...listeners}
      {...attributes}
      aria-label="Drag to reorder"
    >
      <GripVertical className="w-4 h-4" />
    </button>
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

/**
 * Type badge for non-task items.
 */
function TypeBadge({ item }: { item: KanbanItem }) {
  if (item.type === 'task') return null;

  const badgeStyles: Record<string, string> = {
    event: 'bg-indigo-100 text-indigo-700',
    external: 'bg-red-100 text-red-700',
    birthday: 'bg-pink-100 text-pink-700',
  };

  return (
    <span
      className={cn(
        'text-xs px-1.5 py-0.5 rounded-full font-medium',
        badgeStyles[item.type]
      )}
    >
      {item.type === 'external' && 'Google'}
      {item.type === 'event' && 'Event'}
      {item.type === 'birthday' && `🎂 ${item.meta?.ageTurning}`}
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * KanbanSortableCard - Sortable wrapper for Kanban cards.
 *
 * Uses @dnd-kit's useSortable hook for drag-and-drop functionality.
 * Renders the complete card content inline for better performance.
 */
export function KanbanSortableCard({
  item,
  onClick,
  onComplete,
  disabled = false,
  compact = false,
  className,
}: KanbanSortableCardProps) {
  // ============================================================================
  // SORTABLE HOOK
  // ============================================================================

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: item.id,
    disabled: disabled || !item.isEditable,
    data: {
      type: 'card',
      item,
    },
  });

  // Compute transform style
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Get styles for this item type
  const styles = TYPE_STYLES[item.type] || TYPE_STYLES.task;

  // ============================================================================
  // RENDER - Compact Mode
  // ============================================================================

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        onClick={onClick}
        className={cn(
          'group flex items-center gap-2 rounded-md border p-2 transition-all',
          styles.border,
          styles.bg,
          onClick && 'cursor-pointer',
          onClick && styles.hoverBg,
          isDragging && 'opacity-50 shadow-lg ring-2 ring-blue-400 z-50',
          isOver && 'ring-2 ring-blue-300',
          item.isOverdue && 'border-red-300 bg-red-50',
          className
        )}
      >
        {/* Drag handle (editable items only) */}
        {item.isEditable && (
          <DragHandle styles={styles} listeners={listeners} attributes={attributes} />
        )}

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
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        'group relative flex flex-col gap-2 rounded-lg border p-3 transition-all',
        styles.border,
        styles.bg,
        onClick && 'cursor-pointer',
        onClick && styles.hoverBg,
        isDragging && 'opacity-50 shadow-lg ring-2 ring-blue-400 z-50',
        isOver && 'ring-2 ring-blue-300',
        item.isOverdue && 'border-red-300 bg-red-50',
        className
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

      {/* Top row: Drag handle + Checkbox/Icon + Title + Badge */}
      <div className="flex items-start gap-2">
        {/* Drag handle (editable items only) */}
        {item.isEditable && (
          <DragHandle styles={styles} listeners={listeners} attributes={attributes} />
        )}

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
            <TypeBadge item={item} />
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-xs text-neutral-500 truncate mt-0.5">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Bottom row: Meta info */}
      <div className="flex items-center gap-3 text-xs text-neutral-500 pl-6">
        {/* Time */}
        <TimeDisplay item={item} styles={styles} />

        {/* Date */}
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
            color={item.assignee.color || '#6B7280'}
            size="sm"
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { KanbanSortableCardProps };
