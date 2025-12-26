'use client';

/**
 * ============================================================================
 * ✅ TaskModal Component
 * ============================================================================
 *
 * A comprehensive modal for creating and editing tasks.
 * This is one of the most used modals in the app, allowing users to:
 * - Create new tasks with full details
 * - Edit existing tasks
 * - Set due dates and scheduled dates
 * - Assign to family members
 * - Link to projects and goals
 *
 * Features:
 * - Pre-populated fields when editing
 * - Quick create mode (just title)
 * - Full create mode (all fields)
 * - Keyboard shortcuts (Cmd+Enter to save)
 * - Validation feedback
 *
 * Usage:
 * ```tsx
 * // Create mode
 * <TaskModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   initialTitle="Task from inbox"
 * />
 *
 * // Edit mode
 * <TaskModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   task={existingTask}
 * />
 * ```
 *
 * User Stories Addressed:
 * - US-3.1: Create Task with details
 * - US-3.2: Click task to edit
 * - US-5.1: Link tasks to goals
 * - US-6.3: Add task to project
 *
 * ============================================================================
 */

import * as React from 'react';
import { Calendar, Target, Folder, User, Flag, Clock, AlignLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FamilyMemberPicker } from '@/components/shared/family-member-picker';
import { ProjectPicker } from '@/components/shared/project-picker';
import { GoalPicker } from '@/components/shared/goal-picker';
import { useCreateTask, useUpdateTask, type CreateTaskInput } from '@/lib/hooks/use-tasks';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils/cn';
import type { Task, TaskStatus } from '@/types/database';

// ============================================================================
// Types
// ============================================================================

interface TaskModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Existing task to edit (if provided, modal is in edit mode) */
  task?: Task | null;
  /** Initial title (for quick create from inbox) */
  initialTitle?: string;
  /** Initial status (defaults to 'active' for new tasks) */
  initialStatus?: TaskStatus;
  /** Callback when task is saved successfully */
  onSuccess?: (task: Task) => void;
}

interface TaskFormData {
  title: string;
  description: string;
  due_date: string;
  scheduled_date: string;
  assigned_to_id: string | null;
  project_id: string | null;
  goal_id: string | null;
  priority: number;
  status: TaskStatus;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Priority labels and colors
 */
const PRIORITIES = [
  { value: 0, label: 'No priority', color: 'text-neutral-400' },
  { value: 1, label: 'Low', color: 'text-blue-500' },
  { value: 2, label: 'Medium', color: 'text-amber-500' },
  { value: 3, label: 'High', color: 'text-red-500' },
];

/**
 * Format date for input (YYYY-MM-DD)
 */
function formatDateForInput(dateStr: string | null): string {
  if (!dateStr) return '';
  // Handle both ISO timestamps and date strings
  return dateStr.split('T')[0];
}

/**
 * Get initial form data from task or defaults
 */
function getInitialFormData(
  task?: Task | null,
  initialTitle?: string,
  initialStatus?: TaskStatus
): TaskFormData {
  if (task) {
    return {
      title: task.title,
      description: task.description || '',
      due_date: formatDateForInput(task.due_date),
      scheduled_date: formatDateForInput(task.scheduled_date),
      assigned_to_id: task.assigned_to_id,
      project_id: task.project_id,
      goal_id: task.goal_id,
      priority: task.priority || 0,
      status: task.status,
    };
  }

  return {
    title: initialTitle || '',
    description: '',
    due_date: '',
    scheduled_date: '',
    assigned_to_id: null,
    project_id: null,
    goal_id: null,
    priority: 0,
    status: initialStatus || 'active',
  };
}

// ============================================================================
// Component
// ============================================================================

/**
 * TaskModal - Create or edit a task
 */
export function TaskModal({
  open,
  onOpenChange,
  task,
  initialTitle,
  initialStatus = 'active',
  onSuccess,
}: TaskModalProps) {
  const isEditMode = !!task;

  // Form state
  const [formData, setFormData] = React.useState<TaskFormData>(() =>
    getInitialFormData(task, initialTitle, initialStatus)
  );
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  // Mutations
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const isPending = createTask.isPending || updateTask.isPending;

  // Reset form when task changes or modal opens
  React.useEffect(() => {
    if (open) {
      setFormData(getInitialFormData(task, initialTitle, initialStatus));
      // Show advanced if editing and has advanced fields set
      if (task) {
        setShowAdvanced(
          !!task.description ||
          !!task.goal_id ||
          !!task.priority
        );
      } else {
        setShowAdvanced(false);
      }
    }
  }, [open, task, initialTitle, initialStatus]);

  /**
   * Update a single form field
   */
  const updateField = <K extends keyof TaskFormData>(
    field: K,
    value: TaskFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      logger.warn('Task title is required');
      return;
    }

    logger.info('Saving task...', { isEditMode, title: formData.title });

    try {
      if (isEditMode && task) {
        // Update existing task
        const result = await updateTask.mutateAsync({
          id: task.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          due_date: formData.due_date || null,
          scheduled_date: formData.scheduled_date || null,
          assigned_to_id: formData.assigned_to_id,
          project_id: formData.project_id,
          goal_id: formData.goal_id,
          priority: formData.priority,
        });
        onSuccess?.(result);
      } else {
        // Create new task
        const taskInput: CreateTaskInput = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          due_date: formData.due_date || undefined,
          scheduled_date: formData.scheduled_date || undefined,
          assigned_to_id: formData.assigned_to_id || undefined,
          project_id: formData.project_id || undefined,
          goal_id: formData.goal_id || undefined,
          priority: formData.priority || undefined,
          status: formData.status,
        };
        const result = await createTask.mutateAsync(taskInput);
        onSuccess?.(result);
      }

      // Close modal on success
      onOpenChange(false);
    } catch (error) {
      logger.error('Failed to save task', { error });
      // Error is handled by the mutation hook (toast shown)
    }
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to save
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Task' : 'Create Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col flex-1 overflow-hidden">
          <DialogBody className="space-y-4 overflow-y-auto flex-1">
            {/* Title input */}
            <div>
              <label htmlFor="task-title" className="sr-only">
                Task title
              </label>
              <Input
                id="task-title"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="What needs to be done?"
                autoFocus
                className="text-lg font-medium"
              />
            </div>

            {/* Primary fields row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Due date */}
              <div>
                <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                  <Calendar className="h-4 w-4" />
                  Due date
                </label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => updateField('due_date', e.target.value)}
                />
              </div>

              {/* Scheduled date */}
              <div>
                <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                  <Clock className="h-4 w-4" />
                  Do on
                </label>
                <Input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => updateField('scheduled_date', e.target.value)}
                />
              </div>
            </div>

            {/* Assignee */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                <User className="h-4 w-4" />
                Assign to
              </label>
              <FamilyMemberPicker
                value={formData.assigned_to_id}
                onChange={(id) => updateField('assigned_to_id', id)}
                placeholder="Assign to someone..."
              />
            </div>

            {/* Project */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                <Folder className="h-4 w-4" />
                Project
              </label>
              <ProjectPicker
                value={formData.project_id}
                onChange={(id) => updateField('project_id', id)}
                placeholder="Add to a project..."
              />
            </div>

            {/* Toggle advanced fields */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {showAdvanced ? 'Hide' : 'Show'} more options
            </button>

            {/* Advanced fields */}
            {showAdvanced && (
              <div className="space-y-4 pt-2 border-t border-neutral-200">
                {/* Description */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                    <AlignLeft className="h-4 w-4" />
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Add more details..."
                    rows={3}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border border-neutral-300',
                      'text-sm resize-none',
                      'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                    )}
                  />
                </div>

                {/* Goal */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                    <Target className="h-4 w-4" />
                    Supports goal
                  </label>
                  <GoalPicker
                    value={formData.goal_id}
                    onChange={(id) => updateField('goal_id', id)}
                    placeholder="Link to a goal..."
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                    <Flag className="h-4 w-4" />
                    Priority
                  </label>
                  <div className="flex gap-2">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => updateField('priority', p.value)}
                        className={cn(
                          'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                          'border',
                          formData.priority === p.value
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                        )}
                      >
                        <Flag className={cn('h-4 w-4 mx-auto mb-0.5', p.color)} />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isPending}
              disabled={!formData.title.trim()}
            >
              {isEditMode ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Exports
// ============================================================================

export type { TaskModalProps };
