'use client';

/**
 * ============================================================================
 * KANBAN CARD - Static Display Component
 * ============================================================================
 *
 * WHAT THIS FILE DOES:
 * Renders a non-draggable kanban card. Used for:
 * - Read-only items (Google Calendar events, birthdays)
 * - Preview contexts where drag is disabled
 *
 * ARCHITECTURE:
 * ```
 * KanbanCard (this file - static wrapper)
 *   └── KanbanCardContent (shared rendering)
 * ```
 *
 * RELATED FILES:
 * - kanban-card-content.tsx: Shared rendering logic (EDIT THERE for visual changes)
 * - kanban-sortable-card.tsx: Draggable version with @dnd-kit
 * - kanban-drag-overlay.tsx: Ghost card during drag operations
 * - lib/constants/kanban-styles.ts: Shared style constants
 *
 * WHEN TO USE THIS VS SORTABLE:
 * - Use KanbanCard for static/read-only items
 * - Use KanbanSortableCard for draggable items within SortableContext
 *
 * ============================================================================
 */

import * as React from 'react';
import { KanbanCardContent, KanbanCardContentSkeleton } from './kanban-card-content';
import type { KanbanItem } from '@/types/kanban';

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
// MAIN COMPONENT
// ============================================================================

/**
 * KanbanCard - Static display card for the Kanban board.
 *
 * This is a thin wrapper around KanbanCardContent for static display.
 * For draggable cards, use KanbanSortableCard instead.
 *
 * @example
 * // Static read-only card
 * <KanbanCard
 *   item={birthdayItem}
 *   onClick={() => openDetail(item)}
 * />
 *
 * @example
 * // Task card with completion
 * <KanbanCard
 *   item={taskItem}
 *   onClick={() => openEditModal(item)}
 *   onComplete={() => completeTask(item.sourceId)}
 *   draggable={true}
 * />
 */
export function KanbanCard({
  item,
  onClick,
  onComplete,
  isDragging = false,
  draggable = false,
  compact = false,
}: KanbanCardProps) {
  return (
    <KanbanCardContent
      item={item}
      onClick={onClick}
      onComplete={onComplete}
      isDragging={isDragging}
      draggable={draggable}
      compact={compact}
    />
  );
}

// ============================================================================
// SKELETON
// ============================================================================

/**
 * Loading skeleton for KanbanCard.
 * Re-exports the shared skeleton component.
 */
export function KanbanCardSkeleton({ compact = false }: { compact?: boolean }) {
  return <KanbanCardContentSkeleton compact={compact} />;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { KanbanCardProps };
