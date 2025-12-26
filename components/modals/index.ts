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
 *
 * Usage:
 * ```tsx
 * import { TaskModal, GoalModal, HabitModal } from '@/components/modals';
 * ```
 *
 * ============================================================================
 */

export { TaskModal, type TaskModalProps } from './task-modal';
export { GoalModal, type GoalModalProps } from './goal-modal';
export { HabitModal, type HabitModalProps } from './habit-modal';
