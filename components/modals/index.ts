/**
 * ============================================================================
 * 📦 Modals Index
 * ============================================================================
 *
 * Central export point for all modal components.
 * Modals are used throughout the app for entity creation/editing.
 *
 * Available Modals:
 * - TaskModal: Create/edit tasks with full details
 * - GoalModal: Create/edit goals (qualitative/quantitative)
 * - HabitModal: Create habits with frequency and goal linking
 * - ProjectModal: Create/edit projects with status and owner
 * - SomedayModal: Create/edit someday dreams with category and cost
 * - EventModal: Create/edit family events (appointments, meetings, activities)
 *
 * Usage:
 * ```tsx
 * import { TaskModal, GoalModal, EventModal } from '@/components/modals';
 * ```
 *
 * ============================================================================
 */

export { TaskModal, type TaskModalProps } from './task-modal';
export { GoalModal, type GoalModalProps } from './goal-modal';
export { HabitModal, type HabitModalProps } from './habit-modal';
export { ProjectModal, type ProjectModalProps } from './project-modal';
export { SomedayModal, type SomedayModalProps } from './someday-modal';
export { EventModal, type EventModalProps } from './event-modal';
