/**
 * ============================================================================
 * 📋 Kanban Components - Public Exports
 * ============================================================================
 *
 * This file exports all Kanban-related components for use throughout the app.
 *
 * COMPONENTS:
 * - KanbanBoard: Main board component with controls and columns
 * - KanbanColumn: Individual column with header and cards
 * - KanbanCard: Individual card for tasks, events, etc.
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
 * ============================================================================
 */

// Main board component
export { KanbanBoard } from './kanban-board';
export type { KanbanBoardProps } from './kanban-board';

// Column component
export { KanbanColumn } from './kanban-column';
export type { KanbanColumnProps } from './kanban-column';

// Card component
export { KanbanCard, KanbanCardSkeleton } from './kanban-card';
export type { KanbanCardProps } from './kanban-card';
