'use client';

/**
 * ============================================================================
 * ☀️ Today Page
 * ============================================================================
 *
 * A focused view of today's work, including:
 * - Birthdays (celebration banner for today's birthdays)
 * - Today's schedule (events with times)
 * - Habits to complete (with toggle and edit)
 * - Overdue tasks (with urgency styling)
 * - Tasks due today (with quick add and edit)
 *
 * Route: /today
 *
 * This page helps users focus on what needs to be done today without
 * the distraction of future tasks or completed items.
 *
 * Features:
 * - Birthday celebration banner
 * - Today's events with times and locations
 * - Habits grid with toggle (click check to complete)
 * - Click habit card to edit in HabitModal
 * - Add Habit button for quick creation
 * - Overdue tasks section with urgency styling
 * - Today's tasks section with Add button
 * - Click task to edit in TaskModal
 *
 * User Stories Addressed:
 * - US-1.2: See daily focus view
 * - US-3.1: Quick add task from Today page
 * - US-3.2: Click task to open detail panel
 * - US-4.1: Quick add habit from Today page
 * - US-4.2: Toggle habits
 * - US-4.4: Click habit to edit
 *
 * Data Flow:
 * 1. Page loads → Fetches today's tasks, overdue tasks, habits, events, birthdays
 * 2. User clicks Add → Modal opens in create mode
 * 3. User clicks entity → Modal opens in edit mode
 * 4. User toggles habit → Logs completion/skip status
 * 5. User completes task → Task marked as done, removed from view
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
  Plus,
  Calendar,
  MapPin,
  Cake,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge, StreakBadge } from '@/components/shared/badge';
import { Avatar } from '@/components/shared/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { TaskModal } from '@/components/modals/task-modal';
import { HabitModal } from '@/components/modals/habit-modal';
import { EventModal } from '@/components/modals/event-modal';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';
import { useTodayTasks, useOverdueTasks, useCompleteTask } from '@/lib/hooks/use-tasks';
import { useHabits, useLogHabit, type HabitWithTodayStatus } from '@/lib/hooks/use-habits';
import {
  useTodayFamilyEvents,
  useTodayBirthdays,
  formatEventTime,
} from '@/lib/hooks/use-family-events';
import type { Task, Habit } from '@/types/database';
import type { FamilyEvent, Birthday } from '@/types/calendar';

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
  onClick: () => void;
  isUpdating: boolean;
}

/**
 * HabitCard - Displays a single habit with toggle functionality
 *
 * Click the check button to toggle completion status.
 * Click anywhere else on the card to open HabitModal for editing.
 */
function HabitCard({ habit, onToggle, onClick, isUpdating }: HabitCardProps) {
  const isCompleted = habit.todayStatus === 'done';
  const owner = habit.owner as { name: string; color: string } | null;

  /**
   * Handle card click - open in modal if not clicking the toggle button
   */
  const handleCardClick = () => {
    onClick();
  };

  /**
   * Handle toggle click - prevent propagation and toggle status
   */
  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isUpdating) {
      onToggle(habit.id, !isCompleted);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 w-full text-left transition-all cursor-pointer',
        isCompleted
          ? 'border-green-200 bg-green-50 hover:bg-green-100'
          : 'border-neutral-200 bg-white hover:bg-neutral-50'
      )}
    >
      {/* Toggle button - clicking this toggles habit status */}
      <button
        onClick={handleToggleClick}
        disabled={isUpdating}
        className={cn(
          'h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors',
          isCompleted
            ? 'bg-green-500 text-white'
            : 'bg-neutral-100 text-neutral-400 hover:bg-green-100 hover:text-green-600'
        )}
        title={isCompleted ? 'Completed!' : 'Mark as done'}
      >
        {isCompleted ? <Check className="h-4 w-4" /> : null}
      </button>
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
    </div>
  );
}

// ============================================================================
// BirthdayBanner Component
// ============================================================================

interface BirthdayBannerProps {
  birthdays: Birthday[];
}

/**
 * BirthdayBanner - Celebratory banner for today's birthdays
 */
function BirthdayBanner({ birthdays }: BirthdayBannerProps) {
  if (birthdays.length === 0) return null;

  return (
    <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50">
      <CardContent className="py-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🎂</div>
          <div>
            <h3 className="font-semibold text-pink-700">
              {birthdays.length === 1
                ? `Happy Birthday, ${birthdays[0].name}!`
                : `Happy Birthday to ${birthdays.map((b) => b.name).join(' & ')}!`}
            </h3>
            <p className="text-sm text-pink-600">
              {birthdays.length === 1
                ? `Turning ${birthdays[0].age_turning} today`
                : birthdays.map((b) => `${b.name} turns ${b.age_turning}`).join(', ')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EventRow Component
// ============================================================================

interface EventRowProps {
  event: FamilyEvent & { assignee?: { id: string; name: string; color: string | null } };
  onClick: (event: FamilyEvent) => void;
}

/**
 * EventRow - Displays a single event with time and location
 */
function EventRow({ event, onClick }: EventRowProps) {
  const timeDisplay = formatEventTime(
    event.start_time,
    event.end_time,
    event.is_all_day,
    event.timezone
  );

  return (
    <div
      onClick={() => onClick(event)}
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 transition-colors cursor-pointer',
        'border-indigo-200 bg-white hover:bg-indigo-50'
      )}
    >
      {/* Icon */}
      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
        {event.icon ? (
          <span className="text-sm">{event.icon}</span>
        ) : (
          <Calendar className="h-4 w-4 text-indigo-600" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900">{event.title}</p>
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1 text-indigo-600 font-medium">
            <Clock className="h-3 w-3" />
            {timeDisplay}
          </span>
          {event.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3" />
              {event.location}
            </span>
          )}
        </div>
      </div>

      {/* Assignee */}
      {event.assignee && (
        <Avatar
          name={event.assignee.name}
          color={event.assignee.color}
          size="sm"
        />
      )}
    </div>
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
 *
 * Click the checkbox to complete the task.
 * Click anywhere else to open TaskModal for editing.
 */
function TaskRow({ task, onComplete, onClick, isOverdue, isCompleting }: TaskRowProps) {
  const assignee = task.assigned_to as { name: string; color: string } | null;
  const project = task.project as { title: string } | null;

  /**
   * Format due date for display
   */
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
 *
 * Features:
 * - Habits section with toggle and click-to-edit
 * - Overdue tasks highlighted in red
 * - Today's scheduled tasks
 * - Modals for editing tasks and habits
 */
export default function TodayPage() {
  // Get current day for display
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Task modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Habit modal state
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  // Event modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FamilyEvent | null>(null);

  // Fetch data from database
  const { data: todayTasks = [], isLoading: loadingToday } = useTodayTasks();
  const { data: overdueTasks = [], isLoading: loadingOverdue } = useOverdueTasks();
  const { data: habits = [], isLoading: loadingHabits } = useHabits();
  const { data: events = [], isLoading: loadingEvents } = useTodayFamilyEvents();
  const { data: birthdays = [], isLoading: loadingBirthdays } = useTodayBirthdays();

  // Mutations
  const completeTask = useCompleteTask();
  const logHabit = useLogHabit();

  // Calculate habit stats
  const completedHabits = habits.filter((h) => h.todayStatus === 'done').length;

  // Log page load for debugging
  useEffect(() => {
    logger.info('☀️ Today page loaded', {
      date: today.toISOString().split('T')[0],
      overdue: overdueTasks.length,
      todayTasks: todayTasks.length,
      habits: habits.length,
      events: events.length,
      birthdays: birthdays.length,
    });
    logger.divider("Today's Focus");
  }, [overdueTasks.length, todayTasks.length, habits.length, events.length, birthdays.length]);

  // ========================================================================
  // Task Handlers
  // ========================================================================

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
    setIsTaskModalOpen(true);
  };

  /**
   * Handle task modal close
   */
  const handleTaskModalClose = (open: boolean) => {
    setIsTaskModalOpen(open);
    if (!open) {
      setSelectedTask(null);
    }
  };

  /**
   * Handle opening task modal for create (no task selected)
   * Pre-fills today's date so the task appears in Today view
   */
  const handleOpenCreateTaskModal = () => {
    logger.info('➕ Opening task modal for create from Today page');
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  // ========================================================================
  // Habit Handlers
  // ========================================================================

  /**
   * Handle toggling a habit (done/skipped)
   */
  const handleToggleHabit = (habitId: string, completed: boolean) => {
    logger.info('Toggling habit', { habitId, completed });
    logHabit.mutate({
      habitId,
      status: completed ? 'done' : 'skipped',
    });
  };

  /**
   * Handle clicking on a habit - open in modal for editing
   */
  const handleHabitClick = (habit: Habit) => {
    logger.info('Opening habit for edit', { habitId: habit.id, title: habit.title });
    setSelectedHabit(habit);
    setIsHabitModalOpen(true);
  };

  /**
   * Handle opening habit modal for create (no habit selected)
   */
  const handleOpenCreateHabitModal = () => {
    logger.info('Opening habit modal for create from Today page');
    setSelectedHabit(null);
    setIsHabitModalOpen(true);
  };

  /**
   * Handle habit modal close
   */
  const handleHabitModalClose = (open: boolean) => {
    setIsHabitModalOpen(open);
    if (!open) {
      setSelectedHabit(null);
    }
  };

  // ========================================================================
  // Event Handlers
  // ========================================================================

  /**
   * Handle clicking on an event - open in modal for editing
   */
  const handleEventClick = (event: FamilyEvent) => {
    logger.info('Opening event for edit', { eventId: event.id, title: event.title });
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  /**
   * Handle opening event modal for create
   */
  const handleOpenCreateEventModal = () => {
    logger.info('Opening event modal for create from Today page');
    setSelectedEvent(null);
    setIsEventModalOpen(true);
  };

  /**
   * Handle event modal close
   */
  const handleEventModalClose = (open: boolean) => {
    setIsEventModalOpen(open);
    if (!open) {
      setSelectedEvent(null);
    }
  };

  const isLoading = loadingToday || loadingOverdue || loadingHabits || loadingEvents || loadingBirthdays;

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

      {/* Birthday banner - show only if there are birthdays */}
      {!loadingBirthdays && birthdays.length > 0 && (
        <BirthdayBanner birthdays={birthdays} />
      )}

      {/* Today's Events section - only show if there are events or loading */}
      {(loadingEvents || events.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-indigo-500" />
                Schedule {!loadingEvents && events.length > 0 && `(${events.length})`}
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenCreateEventModal}
                leftIcon={<Plus className="h-3 w-3" />}
              >
                Add Event
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingEvents ? (
              <SectionSkeleton rows={2} />
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    onClick={handleEventClick}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Habits section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Repeat className="h-5 w-5 text-green-500" />
              Habits
            </CardTitle>
            <div className="flex items-center gap-2">
              {!loadingHabits && habits.length > 0 && (
                <Badge variant="success">
                  {completedHabits}/{habits.length} done
                </Badge>
              )}
              {/* Add habit button - always visible in header */}
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenCreateHabitModal}
                leftIcon={<Plus className="h-3 w-3" />}
              >
                Add
              </Button>
            </div>
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
            <EmptyState
              icon={<Repeat className="h-10 w-10 text-green-400" />}
              title="No habits yet"
              description="Build consistency by tracking daily habits."
              action={{
                label: 'Create Your First Habit',
                onClick: handleOpenCreateHabitModal,
              }}
            />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onToggle={handleToggleHabit}
                  onClick={() => handleHabitClick(habit)}
                  isUpdating={logHabit.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue section - only show if there are overdue tasks or loading */}
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

      {/* Today's tasks section - click task to edit, Add button for quick create */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckSquare className="h-5 w-5 text-indigo-500" />
              Today {!loadingToday && `(${todayTasks.length})`}
            </CardTitle>
            {/* Add Task button - always visible */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenCreateTaskModal}
              leftIcon={<Plus className="h-3 w-3" />}
            >
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loadingToday ? (
            <SectionSkeleton rows={3} />
          ) : todayTasks.length === 0 ? (
            <EmptyState
              icon={<Sun className="h-12 w-12 text-amber-400" />}
              title="Nothing scheduled for today"
              description="Enjoy the free time or add something new!"
              action={{
                label: 'Add Task',
                onClick: handleOpenCreateTaskModal,
              }}
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
        open={isTaskModalOpen}
        onOpenChange={handleTaskModalClose}
        task={selectedTask}
      />

      {/* Habit Modal for editing/creating */}
      <HabitModal
        open={isHabitModalOpen}
        onOpenChange={handleHabitModalClose}
        habit={selectedHabit}
      />

      {/* Event Modal for editing/creating */}
      <EventModal
        open={isEventModalOpen}
        onOpenChange={handleEventModalClose}
        event={selectedEvent}
        initialDate={today}
      />
    </div>
  );
}
