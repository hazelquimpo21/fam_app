'use client';

/**
 * ============================================================================
 * 📊 KanbanColumn Component
 * ============================================================================
 *
 * A column in the Kanban board that displays a group of items.
 * Supports drag-and-drop for reordering and moving items between columns.
 *
 * VISUAL DESIGN:
 * - Header with icon, title, and item count
 * - Scrollable list of KanbanCards
 * - Drop indicator when dragging over
 * - Color accent matching column type
 *
 * INTERACTIONS:
 * - Accepts dropped items (if column.acceptsDrop is true)
 * - Shows visual feedback during drag-over
 * - Scrolls to reveal more items
 *
 * FUTURE AI DEVELOPERS:
 * To add custom column types, add the definition in /types/kanban.ts
 * and handle the drop logic in useKanban.moveItemMutation.
 *
 * ============================================================================
 */

import * as React from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { KanbanCard, KanbanCardSkeleton } from './kanban-card';
import { cn } from '@/lib/utils/cn';
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

  /** Whether cards are draggable */
  draggable?: boolean;

  /** Handler when an item is dropped */
  onDrop?: (item: KanbanItem, toColumnId: string, toIndex: number) => void;

  /** Whether this column is a drop target */
  isDropTarget?: boolean;

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
 */
const COLUMN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  red: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  indigo: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  amber: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  neutral: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-700',
    border: 'border-neutral-200',
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
 */
function ColumnEmptyState({ column }: { column: KanbanColumnType }) {
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
  };

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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * KanbanColumn - A column in the Kanban board.
 *
 * Displays a header with title and count, followed by a scrollable
 * list of KanbanCards. Supports drag-and-drop.
 */
export function KanbanColumn({
  column,
  onCardClick,
  onTaskComplete,
  onAddClick,
  draggable = false,
  onDrop,
  isDropTarget = false,
  isLoading = false,
  compact = false,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  // ============================================================================
  // DRAG AND DROP HANDLERS
  // ============================================================================

  const handleDragOver = (e: React.DragEvent) => {
    if (!column.acceptsDrop) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set to false if we're leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (!column.acceptsDrop || !onDrop) return;

    try {
      const data = e.dataTransfer.getData('application/json');
      const item = JSON.parse(data) as KanbanItem;

      // Calculate drop index based on mouse position
      // For now, just add to end
      const toIndex = column.items.length;

      onDrop(item, column.id, toIndex);
    } catch (err) {
      console.error('Failed to handle drop:', err);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const colors = COLUMN_COLORS[column.color || 'neutral'];

  return (
    <div
      className={cn(
        'group flex flex-col bg-neutral-50 rounded-lg border min-w-[280px] max-w-[320px] shrink-0',
        'transition-all duration-200',
        colors.border,
        isDragOver && 'ring-2 ring-blue-400 bg-blue-50/50',
        isDropTarget && !isDragOver && 'ring-1 ring-dashed ring-neutral-300'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <ColumnHeader column={column} onAddClick={onAddClick} />

      {/* Cards container */}
      <div
        className={cn(
          'flex-1 overflow-y-auto px-2 py-2 space-y-2',
          'max-h-[calc(100vh-220px)]' // Leave room for header and controls
        )}
      >
        {/* Loading state */}
        {isLoading && (
          <>
            <KanbanCardSkeleton compact={compact} />
            <KanbanCardSkeleton compact={compact} />
            <KanbanCardSkeleton compact={compact} />
          </>
        )}

        {/* Empty state */}
        {!isLoading && column.items.length === 0 && (
          <ColumnEmptyState column={column} />
        )}

        {/* Cards */}
        {!isLoading &&
          column.items.map((item) => (
            <KanbanCard
              key={item.id}
              item={item}
              onClick={
                item.isEditable && onCardClick
                  ? () => onCardClick(item)
                  : undefined
              }
              onComplete={
                item.isCompletable && onTaskComplete
                  ? () => {
                      // Toggle completion
                      if (item.isCompleted) {
                        // Would call uncomplete here, but for now just complete
                      }
                      onTaskComplete(item.sourceId);
                    }
                  : undefined
              }
              draggable={draggable && item.isEditable}
              compact={compact}
            />
          ))}

        {/* Drop zone indicator */}
        {isDragOver && column.items.length > 0 && (
          <div className="h-12 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50/50 flex items-center justify-center">
            <span className="text-xs text-blue-500 font-medium">
              Drop here
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { KanbanColumnProps };
