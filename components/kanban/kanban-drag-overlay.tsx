'use client';

/**
 * ============================================================================
 * KANBAN DRAG OVERLAY - Ghost Card During Drag
 * ============================================================================
 *
 * WHAT THIS FILE DOES:
 * Renders a "ghost" card that follows the cursor during drag operations.
 * This provides visual feedback about what's being moved.
 *
 * HOW IT WORKS:
 * 1. @dnd-kit's DragOverlay component renders children at cursor position
 * 2. We render KanbanCardContent with isOverlay=true for special styling
 * 3. The overlay has rotation, shadow, and scale for "picked up" effect
 *
 * ARCHITECTURE:
 * ```
 * DndContext
 *   ├── KanbanBoard (columns and cards)
 *   └── DragOverlay
 *         └── KanbanDragOverlay (this file)
 *               └── KanbanCardContent (shared rendering, isOverlay=true)
 * ```
 *
 * RELATED FILES:
 * - kanban-card-content.tsx: Shared rendering (isOverlay prop triggers special styles)
 * - kanban-board.tsx: Parent that provides DragOverlay wrapper
 * - kanban-sortable-card.tsx: The original draggable cards
 * - lib/constants/kanban-styles.ts: Shared style constants
 *
 * FUTURE AI DEVELOPERS:
 * - To change overlay appearance, check isOverlay handling in kanban-card-content.tsx
 * - The "Moving" badge is rendered by KanbanCardContent when isOverlay=true
 * - Keep this component lightweight for smooth drag performance
 *
 * ============================================================================
 */

import * as React from 'react';
import { KanbanCardContent } from './kanban-card-content';
import type { KanbanItem } from '@/types/kanban';

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
// MAIN COMPONENT
// ============================================================================

/**
 * KanbanDragOverlay - Visual feedback during drag operations.
 *
 * Renders a styled clone of the dragged item that follows the cursor.
 * Uses KanbanCardContent with isOverlay=true for special "picked up" styling.
 *
 * @example
 * // In KanbanBoard, inside DndContext
 * <DragOverlay>
 *   {activeItem && <KanbanDragOverlay item={activeItem} />}
 * </DragOverlay>
 */
export function KanbanDragOverlay({ item, compact = false }: KanbanDragOverlayProps) {
  return (
    <KanbanCardContent
      item={item}
      isOverlay={true}
      draggable={true}
      compact={compact}
    />
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { KanbanDragOverlayProps };
