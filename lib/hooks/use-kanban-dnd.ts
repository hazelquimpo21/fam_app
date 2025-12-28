'use client';

/**
 * ============================================================================
 * 🎯 useKanbanDnd Hook
 * ============================================================================
 *
 * Custom hook for managing drag-and-drop state in the Kanban board.
 * Integrates with @dnd-kit for modern, touch-friendly drag-drop.
 *
 * FEATURES:
 * - Multi-sensor support (mouse, touch, keyboard)
 * - Collision detection for accurate drop targets
 * - Active item tracking for visual feedback
 * - Position calculation for insertion indices
 *
 * USAGE:
 * ```tsx
 * const { sensors, activeItem, handleDragStart, handleDragEnd } = useKanbanDnd({
 *   columns,
 *   onMoveItem: moveItem,
 * });
 * ```
 *
 * FUTURE AI DEVELOPERS:
 * - To customize drag activation, modify the sensor configurations
 * - To change collision detection, adjust closestCenter/closestCorners
 * - Active item state is used by DragOverlay for visual feedback
 *
 * ============================================================================
 */

import { useState, useCallback, useMemo } from 'react';
import {
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import { logger } from '@/lib/utils/logger';
import type { KanbanItem, KanbanColumn, KanbanDropResult } from '@/types/kanban';

// ============================================================================
// TYPES
// ============================================================================

interface UseKanbanDndOptions {
  /** Current columns with items */
  columns: KanbanColumn[];

  /** Callback when an item is moved */
  onMoveItem: (result: KanbanDropResult) => void;
}

interface UseKanbanDndReturn {
  /** Configured sensors for @dnd-kit DndContext */
  sensors: ReturnType<typeof useSensors>;

  /** Currently dragged item (null if not dragging) */
  activeItem: KanbanItem | null;

  /** ID of the column being dragged over */
  overColumnId: string | null;

  /** Position within column where drop will occur */
  overIndex: number | null;

  /** Handler for drag start */
  handleDragStart: (event: DragStartEvent) => void;

  /** Handler for drag over */
  handleDragOver: (event: DragOverEvent) => void;

  /** Handler for drag end */
  handleDragEnd: (event: DragEndEvent) => void;

  /** Handler for drag cancel */
  handleDragCancel: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Delay before drag activates on touch (prevents scroll interference).
 * 250ms is a good balance between responsiveness and avoiding accidental drags.
 */
const TOUCH_ACTIVATION_DELAY = 250;

/**
 * Minimum distance (pixels) before drag activates.
 * Prevents micro-movements from triggering drag.
 */
const ACTIVATION_DISTANCE = 8;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Find a KanbanItem by its ID across all columns.
 *
 * @param columns - All columns
 * @param id - Item ID to find
 * @returns The item if found, null otherwise
 */
function findItemById(columns: KanbanColumn[], id: UniqueIdentifier): KanbanItem | null {
  for (const column of columns) {
    const item = column.items.find((item) => item.id === id);
    if (item) return item;
  }
  return null;
}

/**
 * Find which column contains an item.
 *
 * @param columns - All columns
 * @param itemId - Item ID to find
 * @returns Column ID if found, null otherwise
 */
function findColumnByItemId(columns: KanbanColumn[], itemId: UniqueIdentifier): string | null {
  for (const column of columns) {
    if (column.items.some((item) => item.id === itemId)) {
      return column.id;
    }
  }
  return null;
}

/**
 * Check if an ID is a column ID (not an item ID).
 *
 * @param columns - All columns
 * @param id - ID to check
 * @returns True if this is a column ID
 */
function isColumnId(columns: KanbanColumn[], id: UniqueIdentifier): boolean {
  return columns.some((column) => column.id === id);
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * useKanbanDnd - Custom hook for Kanban drag-drop functionality.
 *
 * Sets up sensors, tracks active drag state, and handles drop logic.
 *
 * @param options - Configuration options
 * @returns Sensors and handlers for DndContext
 */
export function useKanbanDnd(options: UseKanbanDndOptions): UseKanbanDndReturn {
  const { columns, onMoveItem } = options;

  // ============================================================================
  // STATE
  // ============================================================================

  // Track the currently dragged item
  const [activeItem, setActiveItem] = useState<KanbanItem | null>(null);

  // Track which column we're dragging over
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  // Track position within the column
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // ============================================================================
  // SENSORS
  // ============================================================================

  /**
   * Configure sensors for different input methods.
   *
   * PointerSensor: Mouse and trackpad input
   * TouchSensor: Touch screen input (with delay to prevent scroll issues)
   * KeyboardSensor: Keyboard navigation for accessibility
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: ACTIVATION_DISTANCE,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: TOUCH_ACTIVATION_DELAY,
        tolerance: 5, // Allow slight movement during delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Handle drag start event.
   * Sets the active item for DragOverlay rendering.
   */
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;

      const item = findItemById(columns, active.id);

      if (item) {
        logger.info('🎯 DnD: Drag started', {
          itemId: item.id,
          itemType: item.type,
          title: item.title,
        });
        setActiveItem(item);
      } else {
        logger.warn('⚠️ DnD: Could not find dragged item', { activeId: active.id });
      }
    },
    [columns]
  );

  /**
   * Handle drag over event.
   * Tracks which column and position we're hovering over.
   */
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over, active } = event;

      if (!over) {
        setOverColumnId(null);
        setOverIndex(null);
        return;
      }

      // Determine if we're over a column or an item
      let targetColumnId: string | null = null;
      let targetIndex: number | null = null;

      if (isColumnId(columns, over.id)) {
        // Dragging directly over a column (empty area or bottom)
        targetColumnId = over.id as string;
        const column = columns.find((c) => c.id === targetColumnId);
        targetIndex = column ? column.items.length : 0;
      } else {
        // Dragging over another item
        targetColumnId = findColumnByItemId(columns, over.id);
        if (targetColumnId) {
          const column = columns.find((c) => c.id === targetColumnId);
          if (column) {
            targetIndex = column.items.findIndex((item) => item.id === over.id);
          }
        }
      }

      setOverColumnId(targetColumnId);
      setOverIndex(targetIndex);
    },
    [columns]
  );

  /**
   * Handle drag end event.
   * Calculates final position and triggers the move callback.
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      // Clear state
      setActiveItem(null);
      setOverColumnId(null);
      setOverIndex(null);

      // No drop target
      if (!over) {
        logger.info('🎯 DnD: Drag cancelled (no target)');
        return;
      }

      // Get the dragged item
      const draggedItem = findItemById(columns, active.id);
      if (!draggedItem) {
        logger.error('❌ DnD: Could not find dragged item', { activeId: active.id });
        return;
      }

      // Check if item can be moved (editable)
      if (!draggedItem.isEditable) {
        logger.warn('⚠️ DnD: Item is not editable, cannot move', { itemId: draggedItem.id });
        return;
      }

      // Determine target column and index
      let targetColumnId: string;
      let targetIndex: number;

      if (isColumnId(columns, over.id)) {
        // Dropped on column (empty area) - add to end
        targetColumnId = over.id as string;
        const column = columns.find((c) => c.id === targetColumnId);
        targetIndex = column ? column.items.length : 0;
      } else {
        // Dropped on item - insert at that position
        const foundColumnId = findColumnByItemId(columns, over.id);
        if (!foundColumnId) {
          logger.error('❌ DnD: Could not find target column', { overId: over.id });
          return;
        }
        targetColumnId = foundColumnId;
        const column = columns.find((c) => c.id === targetColumnId);
        if (!column) {
          logger.error('❌ DnD: Column not found', { columnId: targetColumnId });
          return;
        }
        targetIndex = column.items.findIndex((item) => item.id === over.id);

        // If dropped below the target item, increment index
        // (This is handled by @dnd-kit's sortable context in the actual implementation)
      }

      // Check if column accepts drops
      const targetColumn = columns.find((c) => c.id === targetColumnId);
      if (!targetColumn?.acceptsDrop) {
        logger.warn('⚠️ DnD: Column does not accept drops', { columnId: targetColumnId });
        return;
      }

      // Find source column
      const sourceColumnId = findColumnByItemId(columns, active.id);

      // Don't trigger if dropped in same position
      if (sourceColumnId === targetColumnId) {
        const column = columns.find((c) => c.id === sourceColumnId);
        if (column) {
          const currentIndex = column.items.findIndex((item) => item.id === active.id);
          if (currentIndex === targetIndex || currentIndex === targetIndex - 1) {
            logger.info('🎯 DnD: Dropped in same position, no change');
            return;
          }
        }
      }

      logger.success('✅ DnD: Drag completed', {
        itemId: draggedItem.id,
        from: sourceColumnId,
        to: targetColumnId,
        index: targetIndex,
      });

      // Trigger move
      const result: KanbanDropResult = {
        item: draggedItem,
        toColumnId: targetColumnId,
        toIndex: targetIndex,
      };

      onMoveItem(result);
    },
    [columns, onMoveItem]
  );

  /**
   * Handle drag cancel (escape key, etc).
   */
  const handleDragCancel = useCallback(() => {
    logger.info('🎯 DnD: Drag cancelled');
    setActiveItem(null);
    setOverColumnId(null);
    setOverIndex(null);
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    sensors,
    activeItem,
    overColumnId,
    overIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { UseKanbanDndOptions, UseKanbanDndReturn };
