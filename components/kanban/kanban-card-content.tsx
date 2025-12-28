'use client';

/**
 * ============================================================================
 * KANBAN CARD CONTENT - Shared Rendering Component
 * ============================================================================
 *
 * WHAT THIS FILE DOES:
 * This component renders the VISUAL CONTENT of kanban cards. It's used by:
 * - KanbanCard: Static display (no drag)
 * - KanbanSortableCard: Draggable cards with @dnd-kit
 * - KanbanDragOverlay: Ghost card during drag
 *
 * WHY IT EXISTS:
 * Previously, the same JSX was duplicated across 3 files (~200 lines each).
 * This caused maintenance issues - changes had to be made in 3 places.
 * Now there's ONE source of truth for card rendering.
 *
 * ARCHITECTURE:
 * ```
 * KanbanSortableCard (drag mechanics)
 *   └── KanbanCardContent (this file - rendering)
 *
 * KanbanDragOverlay (overlay container)
 *   └── KanbanCardContent (this file - rendering)
 *
 * KanbanCard (static display)
 *   └── KanbanCardContent (this file - rendering)
 * ```
 *
 * FUTURE AI DEVELOPERS:
 * - To change card appearance, modify ONLY this file
 * - TYPE_STYLES and PRIORITY_COLORS come from lib/constants/kanban-styles.ts
 * - The parent components handle drag state and pass it via props
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
import { TYPE_STYLES, PRIORITY_COLORS } from '@/lib/constants/kanban-styles';
import type { KanbanItem } from '@/types/kanban';

// ============================================================================
// TYPES
// ============================================================================

export interface KanbanCardContentProps {
  /** The kanban item to display */
  item: KanbanItem;

  /** Click handler (opens edit modal) */
  onClick?: () => void;

  /** Complete/uncomplete handler (for tasks) */
  onComplete?: () => void;

  /** Whether this card is being dragged (reduces opacity) */
  isDragging?: boolean;

  /** Whether this is the drag overlay (apply special styling) */
  isOverlay?: boolean;

  /** Whether card is being hovered during drag-over */
  isOver?: boolean;

  /** Whether dragging is enabled - shows drag handle */
  draggable?: boolean;

  /** Compact mode for dense layouts */
  compact?: boolean;

  /** Additional class names */
  className?: string;

  /** Drag handle props from @dnd-kit (optional) */
  dragHandleProps?: {
    listeners?: Record<string, unknown>;
    attributes?: Record<string, unknown>;
  };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Checkbox for completing tasks.
 * Includes click handler that stops propagation to avoid triggering card click.
 */
function TaskCheckbox({
  isCompleted,
  onComplete,
  checkboxBorder,
  checkboxChecked,
}: {
  isCompleted: boolean;
  onComplete?: () => void;
  checkboxBorder: string;
  checkboxChecked: string;
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
        isCompleted ? checkboxChecked : checkboxBorder,
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
 * Can receive @dnd-kit listeners for sortable functionality.
 */
function DragHandle({
  iconColor,
  listeners,
  attributes,
  isButton = false,
}: {
  iconColor: string;
  listeners?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
  isButton?: boolean;
}) {
  // If we have listeners, render as interactive button
  if (isButton && listeners && attributes) {
    return (
      <button
        className={cn(
          'p-0.5 rounded cursor-grab active:cursor-grabbing transition-colors',
          'hover:bg-neutral-200/50 touch-none',
          iconColor
        )}
        {...(listeners as React.HTMLAttributes<HTMLButtonElement>)}
        {...(attributes as React.HTMLAttributes<HTMLButtonElement>)}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
    );
  }

  // Static display (for non-sortable cards and overlays)
  return (
    <div
      className={cn(
        'opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing',
        iconColor
      )}
    >
      <GripVertical className="w-4 h-4" />
    </div>
  );
}

/**
 * Type badge showing item source.
 * Helps users identify where the item came from.
 */
function TypeBadge({
  item,
  badgeBg,
  badgeText,
}: {
  item: KanbanItem;
  badgeBg: string;
  badgeText: string;
}) {
  // Tasks don't show a badge (they're the default type)
  if (item.type === 'task') return null;

  return (
    <span
      className={cn(
        'text-xs px-1.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1',
        badgeBg,
        badgeText
      )}
    >
      {item.type === 'external' && (
        <>
          {/* Google Calendar icon */}
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
function TimeDisplay({ item, iconColor }: { item: KanbanItem; iconColor: string }) {
  if (item.isAllDay) {
    return <span className="text-xs text-neutral-500">All day</span>;
  }

  if (item.startTime) {
    const timeStr = format(item.startTime, 'h:mm a');
    return (
      <span className={cn('text-xs flex items-center gap-1', iconColor)}>
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
 * KanbanCardContent - Shared rendering for all kanban card variants.
 *
 * This component handles the visual rendering of kanban cards.
 * Parent components handle:
 * - Drag/drop mechanics (KanbanSortableCard)
 * - Overlay positioning (KanbanDragOverlay)
 * - Static display (KanbanCard)
 */
export function KanbanCardContent({
  item,
  onClick,
  onComplete,
  isDragging = false,
  isOverlay = false,
  isOver = false,
  draggable = false,
  compact = false,
  className,
  dragHandleProps,
}: KanbanCardContentProps) {
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
          isDragging && 'opacity-50 shadow-lg ring-2 ring-blue-400 z-50',
          isOver && 'ring-2 ring-blue-300',
          isOverlay && 'shadow-lg rotate-[2deg] scale-105 opacity-95 cursor-grabbing border-2',
          item.isOverdue && 'border-red-300 bg-red-50',
          className
        )}
        style={isOverlay ? { width: 280 } : undefined}
      >
        {/* Drag handle (editable items only) */}
        {item.isEditable && (draggable || isOverlay) && (
          <DragHandle
            iconColor={styles.iconColor}
            listeners={dragHandleProps?.listeners}
            attributes={dragHandleProps?.attributes}
            isButton={!!dragHandleProps?.listeners}
          />
        )}

        {/* Checkbox (tasks only) */}
        {item.isCompletable && (
          <TaskCheckbox
            isCompleted={item.isCompleted}
            onComplete={onComplete}
            checkboxBorder={styles.checkboxBorder}
            checkboxChecked={styles.checkboxChecked}
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
        <TimeDisplay item={item} iconColor={styles.iconColor} />
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
        isDragging && 'opacity-50 shadow-lg ring-2 ring-blue-400 z-50',
        isOver && 'ring-2 ring-blue-300',
        isOverlay && 'shadow-2xl rotate-[3deg] scale-105 opacity-95 cursor-grabbing border-2',
        item.isOverdue && 'border-red-300 bg-red-50',
        className
      )}
      style={isOverlay ? { width: 300 } : undefined}
    >
      {/* Priority indicator stripe */}
      {item.priority !== 'none' && (
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 rounded-l-lg',
            isOverlay ? 'w-1.5' : 'w-1',
            PRIORITY_COLORS[item.priority]
          )}
        />
      )}

      {/* Top row: Drag handle + Checkbox/Icon + Title + Badge */}
      <div className="flex items-start gap-2">
        {/* Drag handle (editable items only) */}
        {item.isEditable && (draggable || isOverlay) && (
          <DragHandle
            iconColor={styles.iconColor}
            listeners={dragHandleProps?.listeners}
            attributes={dragHandleProps?.attributes}
            isButton={!!dragHandleProps?.listeners}
          />
        )}

        {/* Checkbox (tasks only) */}
        {item.isCompletable && (
          <TaskCheckbox
            isCompleted={item.isCompleted}
            onComplete={onComplete}
            checkboxBorder={styles.checkboxBorder}
            checkboxChecked={styles.checkboxChecked}
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
            <TypeBadge
              item={item}
              badgeBg={styles.badgeBg}
              badgeText={styles.badgeText}
            />
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
      <div className={cn(
        'flex items-center gap-3 text-xs text-neutral-500',
        isOverlay ? 'pl-5' : 'pl-6'
      )}>
        {/* Time */}
        <TimeDisplay item={item} iconColor={styles.iconColor} />

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
        {item.type === 'external' && !isOverlay && (
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

      {/* "Moving" indicator (overlay only) */}
      {isOverlay && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-md">
          Moving
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

/**
 * Loading skeleton for KanbanCardContent.
 * Matches the visual structure of the actual card.
 */
export function KanbanCardContentSkeleton({ compact = false }: { compact?: boolean }) {
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
