'use client';

/**
 * ============================================================================
 * KANBAN SORTABLE CARD - Draggable Card Component
 * ============================================================================
 *
 * WHAT THIS FILE DOES:
 * Wraps KanbanCardContent with @dnd-kit sortable functionality.
 * Handles drag-and-drop mechanics while delegating rendering to the shared component.
 *
 * ARCHITECTURE:
 * ```
 * KanbanSortableCard (this file - drag mechanics)
 *   └── KanbanCardContent (shared rendering)
 * ```
 *
 * HOW @DND-KIT WORKS:
 * 1. useSortable() provides drag state and handlers
 * 2. setNodeRef attaches the DOM element for tracking
 * 3. transform/transition move the element during drag
 * 4. listeners/attributes handle drag initiation (mouse/touch/keyboard)
 *
 * RELATED FILES:
 * - kanban-card-content.tsx: Shared rendering logic (EDIT THERE for visual changes)
 * - kanban-card.tsx: Static version without drag
 * - kanban-drag-overlay.tsx: Ghost card during drag operations
 * - kanban-column.tsx: Parent that provides SortableContext
 * - lib/constants/kanban-styles.ts: Shared style constants
 *
 * FUTURE AI DEVELOPERS:
 * - To change drag behavior, modify this file
 * - To change visual appearance, modify kanban-card-content.tsx
 * - CSS.Transform.toString() converts dnd-kit transform to CSS
 *
 * ============================================================================
 */

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { KanbanCardContent } from './kanban-card-content';
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
// MAIN COMPONENT
// ============================================================================

/**
 * KanbanSortableCard - Draggable wrapper for Kanban cards.
 *
 * Uses @dnd-kit's useSortable hook for drag-and-drop functionality.
 * Must be used within a SortableContext (provided by KanbanColumn).
 *
 * @example
 * <SortableContext items={itemIds}>
 *   {items.map(item => (
 *     <KanbanSortableCard
 *       key={item.id}
 *       item={item}
 *       onClick={() => openEditModal(item)}
 *       onComplete={() => completeTask(item.sourceId)}
 *     />
 *   ))}
 * </SortableContext>
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

  /**
   * useSortable provides everything needed for drag-and-drop:
   * - setNodeRef: Attach to the draggable element
   * - attributes: ARIA attributes for accessibility
   * - listeners: Event handlers for drag initiation
   * - transform: Current position offset during drag
   * - transition: CSS transition for smooth animations
   * - isDragging: Whether this item is currently being dragged
   * - isOver: Whether another item is being dragged over this one
   */
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

  // Convert dnd-kit transform to CSS transform string
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div ref={setNodeRef} style={style}>
      <KanbanCardContent
        item={item}
        onClick={onClick}
        onComplete={onComplete}
        isDragging={isDragging}
        isOver={isOver}
        draggable={item.isEditable && !disabled}
        compact={compact}
        className={className}
        dragHandleProps={{
          listeners,
          attributes,
        }}
      />
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { KanbanSortableCardProps };
