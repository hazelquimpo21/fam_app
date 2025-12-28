/**
 * ============================================================================
 * 📋 Kanban Components - Public Exports
 * ============================================================================
 *
 * This file exports all Kanban-related components for use throughout the app.
 *
 * COMPONENTS:
 * - KanbanBoard: Main board component with controls, columns, and drag-drop
 * - KanbanColumn: Individual column with header and sortable cards
 * - KanbanSortableCard: Draggable card for tasks, events, etc.
 * - KanbanDragOverlay: Visual feedback during drag operations
 * - KanbanDropIndicator: Position indicator for drop targets
 *
 * USAGE:
 * ```tsx
 * import { KanbanBoard } from '@/components/kanban';
 *
 * // In a page component:
 * <KanbanBoard
 *   defaultGroupBy="time"
 *   defaultTimeScope="week"
 *   onCardClick={(item) => openModal(item)}
 * />
 * ```
 *
 * ARCHITECTURE:
 * The KanbanBoard uses @dnd-kit for modern, touch-friendly drag-and-drop.
 * - DndContext wraps the board and provides drag state
 * - Each KanbanColumn is a droppable zone with SortableContext
 * - Each KanbanSortableCard is a sortable/draggable item
 * - DragOverlay renders the visual ghost during drag
 *
 * FUTURE AI DEVELOPERS:
 * - Drag-drop hooks are in /lib/hooks/use-kanban-dnd.ts
 * - Data and mutations are in /lib/hooks/use-kanban.ts
 * - Types and column definitions are in /types/kanban.ts
 *
 * ============================================================================
 */

// Main board component with integrated drag-drop
export { KanbanBoard } from './kanban-board';
export type { KanbanBoardProps } from './kanban-board';

// Column component with droppable zone
export { KanbanColumn } from './kanban-column';
export type { KanbanColumnProps } from './kanban-column';

// Sortable card component (replaces KanbanCard for drag-drop)
export { KanbanSortableCard } from './kanban-sortable-card';
export type { KanbanSortableCardProps } from './kanban-sortable-card';

// Drag overlay for visual feedback during drag
export { KanbanDragOverlay } from './kanban-drag-overlay';
export type { KanbanDragOverlayProps } from './kanban-drag-overlay';

// Drop indicators
export { KanbanDropIndicator, KanbanDropZone } from './kanban-drop-indicator';
export type { KanbanDropIndicatorProps } from './kanban-drop-indicator';

// Legacy card component (deprecated, use KanbanSortableCard)
export { KanbanCard, KanbanCardSkeleton } from './kanban-card';
export type { KanbanCardProps } from './kanban-card';
