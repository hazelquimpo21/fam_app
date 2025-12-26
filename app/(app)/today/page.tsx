'use client';

/**
 * ============================================================================
 * ☀️ Today Page
 * ============================================================================
 *
 * A focused view of today's work, including:
 * - Habits to complete
 * - Overdue tasks
 * - Tasks due today
 *
 * Route: /today
 *
 * This page helps users focus on what needs to be done today without
 * the distraction of future tasks or completed items.
 *
 * Features:
 * - Habits grid with toggle
 * - Overdue tasks section
 * - Today's tasks section
 * - Click task to edit in TaskModal
 *
 * User Stories Addressed:
 * - US-1.2: See daily focus view
 * - US-3.2: Click task to open detail panel
 * - US-4.2: Toggle habits
 *
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import {
  Sun,
  Clock,
  AlertCircle,
  Repeat,
  CheckSquare,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge, StreakBadge } from '@/components/shared/badge';
import { Avatar } from '@/components/shared/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { TaskModal } from '@/components/modals/task-modal';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';
import { useTodayTasks, useOverdueTasks, useCompleteTask } from '@/lib/hooks/use-tasks';
import { useHabits, useLogHabit, type HabitWithTodayStatus } from '@/lib/hooks/use-habits';
import type { Task } from '@/types/database';

// ============================================================================
// SectionSkeleton Component
// ============================================================================

/**
 * Loading skeleton for task sections
 */
function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3">
          <div className="h-5 w-5 bg-neutral-200 rounded" />
          <div className="flex-1">
            <div className="h-4 bg-neutral-200 rounded w-3/4 mb-1" />
            <div className="h-3 bg-neutral-100 rounded w-1/4" />
          </div>
          <div className="h-8 w-8 bg-neutral-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// HabitCard Component
// ============================================================================

interface HabitCardProps {
  habit: HabitWithTodayStatus;
  onToggle: (habitId: string, completed: boolean) => void;
  isUpdating: boolean;
}

/**
 * HabitCard - Displays a single habit with toggle functionality
 */
function HabitCard({ habit, onToggle, isUpdating }: HabitCardProps) {
  const isCompleted = habit.todayStatus === 'done';
  const owner = habit.owner as { name: string; color: string } | null;

  return (
    <button
      onClick={() => onToggle(habit.id, !isCompleted)}
      disabled={isUpdating}
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 w-full text-left transition-all',
        isCompleted
          ? 'border-green-200 bg-green-50 hover:bg-green-100'
          : 'border-neutral-200 bg-white hover:bg-neutral-50'
      )}
    >
      <div
        className={cn(
          'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
          isCompleted
            ? 'bg-green-500 text-white'
            : 'bg-neutral-100 text-neutral-400'
        )}
      >
        {isCompleted ? <Check className="h-4 w-4" /> : null}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate',
          isCompleted ? 'text-green-700' : 'text-neutral-900'
        )}>
          {habit.title}
        </p>
        {owner && (
          <p className="text-xs text-neutral-500">{owner.name}</p>
        )}
      </div>
      {habit.current_streak > 0 && (
        <StreakBadge count={habit.current_streak} size="sm" />
      )}
    </button>
  );
}

// ============================================================================
// TaskRow Component
// ============================================================================

interface TaskRowProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onClick: (task: Task) => void;
  isOverdue?: boolean;
  isCompleting: boolean;
}

/**
 * TaskRow - Displays a single task with checkbox and click-to-edit
 */
function TaskRow({ task, onComplete, onClick, isOverdue, isCompleting }: TaskRowProps) {
  const assignee = task.assigned_to as { name: string; color: string } | null;
  const project = task.project as { title: string } | null;

  // Format due date for display
  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      onClick={() => onClick(task)}
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 transition-colors cursor-pointer',
        isOverdue
          ? 'border-red-200 bg-white hover:bg-red-50'
          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
      )}
    >
      {/* Checkbox - stop propagation to prevent opening modal */}
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={false}
          onChange={() => onComplete(task.id)}
          disabled={isCompleting}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900">{task.title}</p>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          {task.due_date && (
            <span className={cn(
              'flex items-center gap-1',
              isOverdue && 'text-red-600'
            )}>
              <Clock className="h-3 w-3" />
              {formatDueDate(task.due_date)}
            </span>
          )}
          {project && (
            <Badge size="sm" variant="outline">
              {project.title}
            </Badge>
          )}
        </div>
      </div>
      {assignee && (
        <Avatar
          name={assignee.name}
          color={assignee.color}
          size="sm"
        />
      )}
    </div>
  );
}

// ============================================================================
// TodayPage Component (Main Export)
// ============================================================================

/**
 * Today page - focused daily view
 */
export default function TodayPage() {
  // Get current day for display
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Fetch data from database
  const { data: todayTasks = [], isLoading: loadingToday } = useTodayTasks();
  const { data: overdueTasks = [], isLoading: loadingOverdue } = useOverdueTasks();
  const { data: habits = [], isLoading: loadingHabits } = useHabits();

  // Mutations
  const completeTask = useCompleteTask();
  const logHabit = useLogHabit();

  // Calculate habit stats
  const completedHabits = habits.filter((h) => h.todayStatus === 'done').length;

  // Log page load for debugging
  useEffect(() => {
    logger.info('Today page loaded', {
      date: today.toISOString().split('T')[0],
      overdue: overdueTasks.length,
      todayTasks: todayTasks.length,
      habits: habits.length,
    });
    logger.divider("Today's Focus");
  }, [overdueTasks.length, todayTasks.length, habits.length]);

  /**
   * Handle completing a task
   */
  const handleCompleteTask = (taskId: string) => {
    logger.info('Completing task', { taskId });
    completeTask.mutate(taskId);
  };

  /**
   * Handle clicking on a task - open in modal
   */
  const handleTaskClick = (task: Task) => {
    logger.info('Opening task for edit', { taskId: task.id, title: task.title });
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  /**
   * Handle modal close
   */
  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setSelectedTask(null);
    }
  };

  /**
   * Handle toggling a habit
   */
  const handleToggleHabit = (habitId: string, completed: boolean) => {
    logger.info('Toggling habit', { habitId, completed });
    logHabit.mutate({
      habitId,
      status: completed ? 'done' : 'skipped',
    });
  };

  const isLoading = loadingToday || loadingOverdue || loadingHabits;

  return (
    <div className="space-y-6">
      {/* Header with date */}
      <div className="flex items-center gap-3">
        <Sun className="h-8 w-8 text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Today</h1>
          <p className="text-neutral-500">{dateStr}</p>
        </div>
      </div>

      {/* Habits section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Repeat className="h-5 w-5 text-green-500" />
              Habits
            </CardTitle>
            {!loadingHabits && habits.length > 0 && (
              <Badge variant="success">
                {completedHabits}/{habits.length} done
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loadingHabits ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-neutral-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : habits.length === 0 ? (
            <p className="text-neutral-500 text-sm py-4 text-center">
              No habits yet. Create one to start building consistency!
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onToggle={handleToggleHabit}
                  isUpdating={logHabit.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue section */}
      {(loadingOverdue || overdueTasks.length > 0) && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-red-700">
              <AlertCircle className="h-5 w-5" />
              Overdue {!loadingOverdue && `(${overdueTasks.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingOverdue ? (
              <SectionSkeleton rows={2} />
            ) : (
              <div className="space-y-2">
                {overdueTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onComplete={handleCompleteTask}
                    onClick={handleTaskClick}
                    isOverdue
                    isCompleting={completeTask.isPending}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Today's tasks section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckSquare className="h-5 w-5 text-indigo-500" />
            Today {!loadingToday && `(${todayTasks.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loadingToday ? (
            <SectionSkeleton rows={3} />
          ) : todayTasks.length === 0 ? (
            <EmptyState
              icon={<Sun className="h-12 w-12 text-amber-400" />}
              title="Nothing scheduled for today"
              description="Enjoy the free time or add something new!"
            />
          ) : (
            <div className="space-y-2">
              {todayTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onComplete={handleCompleteTask}
                  onClick={handleTaskClick}
                  isCompleting={completeTask.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Modal for editing */}
      <TaskModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        task={selectedTask}
      />
    </div>
  );
}
