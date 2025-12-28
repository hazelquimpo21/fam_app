'use client';

/**
 * ============================================================================
 * 👻 KanbanDragOverlay Component
 * ============================================================================
 *
 * Visual overlay shown during drag operations. This "ghost" follows the cursor
 * and provides visual feedback about what's being dragged.
 *
 * DESIGN:
 * - Renders a styled clone of the dragged card
 * - Rotated slightly to indicate "picked up" state
 * - Has shadow and scale effects for depth
 * - Matches the original card styling but with drag state
 *
 * USAGE:
 * ```tsx
 * <DndContext>
 *   <KanbanBoard />
 *   <DragOverlay>
 *     {activeItem && <KanbanDragOverlay item={activeItem} />}
 *   </DragOverlay>
 * </DndContext>
 * ```
 *
 * FUTURE AI DEVELOPERS:
 * - To customize the drag appearance, modify the styling in this component
 * - The item prop contains all data needed to render the preview
 * - Keep this component lightweight for smooth drag performance
 *
 * ============================================================================
 */

import * as React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Folder,
  Check,
  GripVertical,
} from 'lucide-react';
import { Avatar } from '@/components/shared/avatar';
import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';
import type { KanbanItem, KanbanItemType } from '@/types/kanban';

// ============================================================================
// TYPES
// ============================================================================

interface KanbanDragOverlayProps {
  /** The item being dragged */
  item: KanbanItem;

  /** Compact mode for dense layouts */
  compact?: boolean;
}

// ============================================================================
// STYLING
// ============================================================================

/**
 * Visual styling per item type (same as KanbanCard).
 */
const TYPE_STYLES: Record<
  KanbanItemType,
  {
    border: string;
    bg: string;
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  task: {
    border: 'border-blue-300',
    bg: 'bg-white',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
  },
  event: {
    border: 'border-indigo-300',
    bg: 'bg-white',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-700',
  },
  external: {
    border: 'border-neutral-300',
    bg: 'bg-neutral-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
  },
  birthday: {
    border: 'border-pink-300',
    bg: 'bg-gradient-to-r from-pink-50 to-purple-50',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-700',
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
 * Type badge showing item source.
 */
function TypeBadge({ item, styles }: { item: KanbanItem; styles: typeof TYPE_STYLES['task'] }) {
  if (item.type === 'task') return null;

  return (
    <span
      className={cn(
        'text-xs px-1.5 py-0.5 rounded-full font-medium',
        styles.badgeBg,
        styles.badgeText
      )}
    >
      {item.type === 'external' && 'Google'}
      {item.type === 'event' && 'Event'}
      {item.type === 'birthday' && '🎂'}
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * KanbanDragOverlay - Visual feedback during drag operations.
 *
 * Renders a styled clone of the dragged item that follows the cursor.
 * Styled to look "picked up" with rotation and shadow.
 */
export function KanbanDragOverlay({ item, compact = false }: KanbanDragOverlayProps) {
  const styles = TYPE_STYLES[item.type];

  // ============================================================================
  // RENDER - Compact Mode
  // ============================================================================

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-md border-2 p-2 transition-all',
          'shadow-lg rotate-[2deg] scale-105 opacity-95',
          'cursor-grabbing',
          styles.border,
          styles.bg
        )}
        style={{ width: 280 }}
      >
        {/* Drag handle indicator */}
        <GripVertical className={cn('w-4 h-4', styles.iconColor)} />

        {/* Checkbox placeholder (for tasks) */}
        {item.isCompletable && (
          <div className="w-5 h-5 rounded border-2 border-blue-300 flex items-center justify-center shrink-0">
            {item.isCompleted && <Check className="w-3 h-3 text-blue-500" />}
          </div>
        )}

        {/* Icon (for non-tasks) */}
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
      </div>
    );
  }

  // ============================================================================
  // RENDER - Full Mode
  // ============================================================================

  return (
    <div
      className={cn(
        'relative flex flex-col gap-2 rounded-lg border-2 p-3 transition-all',
        'shadow-2xl rotate-[3deg] scale-105 opacity-95',
        'cursor-grabbing',
        styles.border,
        styles.bg
      )}
      style={{ width: 300 }}
    >
      {/* Priority indicator stripe */}
      {item.priority !== 'none' && (
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg',
            PRIORITY_COLORS[item.priority]
          )}
        />
      )}

      {/* Top row: Drag handle + Title + Badge */}
      <div className="flex items-start gap-2">
        {/* Drag handle indicator */}
        <GripVertical className={cn('w-4 h-4 mt-0.5', styles.iconColor)} />

        {/* Checkbox (tasks only) */}
        {item.isCompletable && (
          <div className="w-5 h-5 rounded border-2 border-blue-300 flex items-center justify-center shrink-0">
            {item.isCompleted && <Check className="w-3 h-3 text-blue-500" />}
          </div>
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

          {/* Description */}
          {item.description && (
            <p className="text-xs text-neutral-500 truncate mt-0.5">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Bottom row: Meta info */}
      <div className="flex items-center gap-3 text-xs text-neutral-500 pl-5">
        {/* Time */}
        {item.startTime && (
          <span className={cn('flex items-center gap-1', styles.iconColor)}>
            <Clock className="w-3 h-3" />
            {format(item.startTime, 'h:mm a')}
          </span>
        )}

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

        {/* Project */}
        {item.project && (
          <span
            className="flex items-center gap-1 truncate"
            style={{ color: item.project.color || undefined }}
          >
            <Folder className="w-3 h-3" />
            {item.project.title}
          </span>
        )}
      </div>

      {/* Assignee avatar */}
      {item.assignee && (
        <div className="absolute bottom-2 right-2">
          <Avatar
            name={item.assignee.name}
            color={item.assignee.color || '#6B7280'}
            size="sm"
          />
        </div>
      )}

      {/* "Moving" indicator */}
      <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-md">
        Moving
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { KanbanDragOverlayProps };
