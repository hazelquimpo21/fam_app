'use client';

/**
 * ============================================================================
 * 📊 KanbanColumn Component
 * ============================================================================
 *
 * A column in the Kanban board that displays a group of items.
 * Integrates with @dnd-kit for sortable drag-and-drop support.
 *
 * VISUAL DESIGN:
 * - Header with icon, title, and item count
 * - Scrollable list of sortable KanbanCards
 * - Drop indicator when dragging over
 * - Color accent matching column type
 *
 * INTERACTIONS:
 * - Accepts dropped items (if column.acceptsDrop is true)
 * - Shows visual feedback during drag-over
 * - Supports item reordering within column
 * - Touch-friendly with long-press drag activation
 *
 * ARCHITECTURE:
 * ```
 * KanbanColumn
 *   └── useDroppable (column drop target)
 *       └── SortableContext (item ordering)
 *           └── KanbanSortableCard[] (draggable items)
 * ```
 *
 * FUTURE AI DEVELOPERS:
 * - To add custom column types, update COLUMN_COLORS and types/kanban.ts
 * - useDroppable makes the column a drop target
 * - SortableContext enables reordering within the column
 *
 * ============================================================================
 */

import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MoreHorizontal } from 'lucide-react';

import { KanbanSortableCard } from './kanban-sortable-card';
import { KanbanDropZone } from './kanban-drop-indicator';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';
import type { KanbanColumn as KanbanColumnType, KanbanItem } from '@/types/kanban';

// ============================================================================
// TYPES
// ============================================================================

interface KanbanColumnProps {
  /** Column data including items */
  column: KanbanColumnType;

  /** Handler when a card is clicked */
  onCardClick?: (item: KanbanItem) => void;

  /** Handler when a task is completed */
  onTaskComplete?: (taskId: string) => void;

  /** Handler when "Add" button is clicked */
  onAddClick?: () => void;

  /** Whether this column is being dragged over (external override) */
  isOver?: boolean;

  /** Loading state */
  isLoading?: boolean;

  /** Compact mode for dense layouts */
  compact?: boolean;
}

// ============================================================================
// STYLING
// ============================================================================

/**
 * Color classes for column headers.
 * Maps color name to Tailwind classes.
 */
const COLUMN_COLORS: Record<string, { bg: string; text: string; border: string; ring: string }> = {
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
// SUB-COMPONENTS
// ============================================================================

/**
 * Column header with icon, title, count, and actions.
 */
function ColumnHeader({
  column,
  onAddClick,
}: {
  column: KanbanColumnType;
  onAddClick?: () => void;
}) {
  const colors = COLUMN_COLORS[column.color || 'neutral'];

  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-2 rounded-t-lg border-b',
        colors.bg,
        colors.border
      )}
    >
      {/* Left: Icon + Title + Count */}
      <div className="flex items-center gap-2">
        {column.icon && <span className="text-sm">{column.icon}</span>}
        <h3 className={cn('font-semibold text-sm', colors.text)}>{column.title}</h3>
        <span
          className={cn(
            'text-xs px-1.5 py-0.5 rounded-full font-medium',
            colors.bg,
            colors.text
          )}
        >
          {column.items.length}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {onAddClick && (
          <button
            onClick={onAddClick}
            className={cn(
              'p-1 rounded hover:bg-white/50 transition-colors',
              colors.text
            )}
            aria-label="Add item to column"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
        <button
          className={cn(
            'p-1 rounded hover:bg-white/50 transition-colors opacity-0 group-hover:opacity-100',
            colors.text
          )}
          aria-label="Column options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Empty state for columns with no items.
 * Shows drop zone when being dragged over.
 */
function ColumnEmptyState({
  column,
  isOver,
}: {
  column: KanbanColumnType;
  isOver: boolean;
}) {
  const colors = COLUMN_COLORS[column.color || 'neutral'];

  // Custom messages per column type
  const messages: Record<string, string> = {
    overdue: 'No overdue items!',
    today: 'Nothing scheduled today',
    tomorrow: 'Nothing for tomorrow yet',
    'this-week': 'Week is looking clear',
    later: 'Nothing planned for later',
    done: 'No completed items',
    inbox: 'Inbox is empty',
    active: 'No active items',
    waiting_for: 'Not waiting on anything',
    someday: 'No someday items',
    high: 'No high priority items',
    medium: 'No medium priority items',
    low: 'No low priority items',
    none: 'All items have priorities',
    untagged: 'No untagged items',
  };

  // If being dragged over, show drop zone
  if (isOver) {
    return (
      <KanbanDropZone isActive={true}>
        <span className="text-blue-600 font-medium">Drop here</span>
      </KanbanDropZone>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center mb-2',
          colors.bg
        )}
      >
        <span className="text-lg">{column.icon || '📋'}</span>
      </div>
      <p className="text-sm text-neutral-500">
        {messages[column.id] || 'No items'}
      </p>
    </div>
  );
}

/**
 * Loading skeleton for cards.
 */
function CardSkeleton({ compact = false }: { compact?: boolean }) {
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
// MAIN COMPONENT
// ============================================================================

/**
 * KanbanColumn - A column in the Kanban board.
 *
 * Displays a header with title and count, followed by a scrollable
 * list of sortable KanbanCards. Uses @dnd-kit for drag-drop.
 */
export function KanbanColumn({
  column,
  onCardClick,
  onTaskComplete,
  onAddClick,
  isOver: externalIsOver,
  isLoading = false,
  compact = false,
}: KanbanColumnProps) {
  // ============================================================================
  // DROPPABLE HOOK
  // ============================================================================

  /**
   * useDroppable makes this column a valid drop target.
   * When items are dragged over, isOver becomes true.
   */
  const {
    setNodeRef,
    isOver: droppableIsOver,
  } = useDroppable({
    id: column.id,
    disabled: !column.acceptsDrop,
    data: {
      type: 'column',
      column,
    },
  });

  // Use external or droppable isOver state
  const isOver = externalIsOver ?? droppableIsOver;

  // ============================================================================
  // SORTABLE ITEMS
  // ============================================================================

  /**
   * Get list of item IDs for SortableContext.
   * This enables reordering within the column.
   */
  const itemIds = React.useMemo(
    () => column.items.map((item) => item.id),
    [column.items]
  );

  // Debug logging for drag state changes
  React.useEffect(() => {
    if (isOver) {
      logger.debug('🎯 Column: Drag over', {
        columnId: column.id,
        itemCount: column.items.length,
      });
    }
  }, [isOver, column.id, column.items.length]);

  // ============================================================================
  // RENDER
  // ============================================================================

  const colors = COLUMN_COLORS[column.color || 'neutral'];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'group flex flex-col bg-neutral-50 rounded-lg border min-w-[280px] max-w-[320px] shrink-0',
        'transition-all duration-200',
        colors.border,
        isOver && 'ring-2 bg-blue-50/50 ring-blue-400'
      )}
    >
      {/* Header */}
      <ColumnHeader column={column} onAddClick={onAddClick} />

      {/* Cards container with SortableContext */}
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div
          className={cn(
            'flex-1 overflow-y-auto px-2 py-2 space-y-2',
            'max-h-[calc(100vh-220px)]' // Leave room for header and controls
          )}
        >
          {/* Loading state */}
          {isLoading && (
            <>
              <CardSkeleton compact={compact} />
              <CardSkeleton compact={compact} />
              <CardSkeleton compact={compact} />
            </>
          )}

          {/* Empty state */}
          {!isLoading && column.items.length === 0 && (
            <ColumnEmptyState column={column} isOver={isOver} />
          )}

          {/* Cards */}
          {!isLoading &&
            column.items.map((item) => (
              <KanbanSortableCard
                key={item.id}
                item={item}
                onClick={
                  item.isEditable && onCardClick
                    ? () => onCardClick(item)
                    : undefined
                }
                onComplete={
                  item.isCompletable && onTaskComplete
                    ? () => onTaskComplete(item.sourceId)
                    : undefined
                }
                disabled={!item.isEditable}
                compact={compact}
              />
            ))}

          {/* Drop zone at bottom when dragging over non-empty column */}
          {isOver && column.items.length > 0 && (
            <div className="h-12 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50/50 flex items-center justify-center mt-2">
              <span className="text-xs text-blue-500 font-medium">
                Drop here
              </span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { KanbanColumnProps };
