'use client';

/**
 * ============================================================================
 * 📊 Dashboard Page
 * ============================================================================
 *
 * The main dashboard showing a quick overview of:
 * - Today's tasks (with overdue count)
 * - Habit progress
 * - Active goals
 * - Quick actions
 *
 * Route: /
 *
 * This page connects to the Supabase database via React Query hooks
 * to display real family data. All data is scoped to the current user's
 * family via Row Level Security (RLS).
 *
 * ============================================================================
 */

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckSquare,
  Repeat,
  Target,
  Clock,
  Plus,
  ArrowRight,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge, StreakBadge } from '@/components/shared/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar } from '@/components/shared/avatar';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';

// Import hooks for real data
import { useTodayTasks, useOverdueTasks, useCompleteTask } from '@/lib/hooks/use-tasks';
import { useHabits, useLogHabit, type HabitWithTodayStatus } from '@/lib/hooks/use-habits';
import { useActiveGoals } from '@/lib/hooks/use-goals';
import type { Task, Goal } from '@/types/database';

// ============================================================================
// 📦 SUB-COMPONENTS
// ============================================================================

/**
 * Stats Card Component
 * Displays a metric with icon, value, and optional subtitle
 */
interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  isLoading?: boolean;
  highlight?: 'success' | 'warning' | 'error';
  onClick?: () => void;
}

function StatsCard({ title, value, subtitle, icon, isLoading, highlight, onClick }: StatsCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        onClick && 'hover:border-indigo-200'
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-neutral-200 rounded w-20" />
                <div className="h-8 bg-neutral-200 rounded w-12" />
                <div className="h-3 bg-neutral-100 rounded w-24" />
              </div>
              <div className="h-11 w-11 bg-neutral-100 rounded-lg" />
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-500">{title}</p>
              <p
                className={cn(
                  'text-3xl font-bold',
                  highlight === 'error' ? 'text-red-600' : 'text-neutral-900'
                )}
              >
                {value}
              </p>
              {subtitle && (
                <p
                  className={cn(
                    'text-sm',
                    highlight === 'error' ? 'text-red-500' : 'text-neutral-500'
                  )}
                >
                  {subtitle}
                </p>
              )}
            </div>
            <div
              className={cn(
                'rounded-lg p-3',
                highlight === 'error'
                  ? 'bg-red-50 text-red-600'
                  : highlight === 'success'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-indigo-50 text-indigo-600'
              )}
            >
              {icon}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Task Row Component
 * Displays a single task with checkbox and assignee
 */
interface TaskRowProps {
  task: Task;
  onComplete: (taskId: string) => void;
  isCompleting: boolean;
  isOverdue?: boolean;
}

function TaskRow({ task, onComplete, isCompleting, isOverdue }: TaskRowProps) {
  // Safely access joined data
  const assignee = task.assigned_to as { name: string; color: string } | null;

  // Format time if due_date looks like it includes time
  const dueTime = task.scheduled_date
    ? new Date(task.scheduled_date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 transition-colors',
        isOverdue
          ? 'border-red-200 bg-red-50/50 hover:bg-red-50'
          : 'border-neutral-200 bg-white hover:bg-neutral-50'
      )}
    >
      <Checkbox
        checked={task.status === 'done'}
        onChange={() => onComplete(task.id)}
        disabled={isCompleting}
        aria-label={`Complete ${task.title}`}
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium',
            task.status === 'done' ? 'text-neutral-400 line-through' : 'text-neutral-900'
          )}
        >
          {task.title}
        </p>
        {(dueTime || isOverdue) && (
          <p
            className={cn(
              'text-xs flex items-center gap-1',
              isOverdue ? 'text-red-600' : 'text-neutral-500'
            )}
          >
            <Clock className="h-3 w-3" />
            {isOverdue ? 'Overdue' : dueTime}
          </p>
        )}
      </div>
      {assignee && (
        <Avatar name={assignee.name} color={assignee.color} size="sm" />
      )}
    </div>
  );
}

/**
 * Habit Toggle Button
 * Quick toggle for habits in the dashboard
 */
interface HabitToggleProps {
  habit: HabitWithTodayStatus;
  onToggle: (habitId: string, completed: boolean) => void;
  isUpdating: boolean;
}

function HabitToggle({ habit, onToggle, isUpdating }: HabitToggleProps) {
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
          'h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-colors',
          isCompleted ? 'bg-green-500 text-white' : 'bg-neutral-200'
        )}
      >
        {isCompleted && <Check className="h-3 w-3" />}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium truncate',
            isCompleted ? 'text-green-700' : 'text-neutral-900'
          )}
        >
          {habit.title}
        </p>
      </div>
      {habit.current_streak > 0 && <StreakBadge count={habit.current_streak} size="sm" />}
      {owner && <Avatar name={owner.name} color={owner.color} size="sm" />}
    </button>
  );
}

/**
 * Goal Progress Card
 * Displays goal with progress bar
 */
interface GoalCardProps {
  goal: Goal;
}

function GoalCard({ goal }: GoalCardProps) {
  const owner = goal.owner as { name: string; color: string } | null;

  // Calculate progress percentage
  const progress =
    goal.goal_type === 'quantitative' && goal.target_value
      ? Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100)
      : 0;

  // Format current/target values
  const progressText =
    goal.goal_type === 'quantitative' && goal.target_value
      ? `${goal.current_value.toLocaleString()} / ${goal.target_value.toLocaleString()}${
          goal.unit ? ` ${goal.unit}` : ''
        }`
      : goal.definition_of_done || 'No target set';

  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-neutral-900 truncate">{goal.title}</p>
          <p className="text-sm text-neutral-500">{progressText}</p>
        </div>
        {owner && <Avatar name={owner.name} color={owner.color} size="sm" />}
      </div>
      {goal.goal_type === 'quantitative' && goal.target_value && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Progress</span>
            <span className="font-medium text-neutral-900">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                progress >= 100
                  ? 'bg-green-500'
                  : progress >= 75
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                  : progress >= 50
                  ? 'bg-indigo-500'
                  : 'bg-indigo-400'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Loading skeleton for task list
 */
function TaskListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3"
        >
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
// 🏠 MAIN COMPONENT
// ============================================================================

/**
 * Dashboard Page Component
 *
 * Main entry point for authenticated users.
 * Displays real-time data from Supabase via React Query hooks.
 */
export default function DashboardPage() {
  const router = useRouter();

  // ━━━━━ DATA FETCHING ━━━━━
  // All hooks use RLS to scope data to the current user's family
  const {
    data: todayTasks = [],
    isLoading: loadingTodayTasks,
    error: todayTasksError,
  } = useTodayTasks();
  const {
    data: overdueTasks = [],
    isLoading: loadingOverdueTasks,
    error: overdueTasksError,
  } = useOverdueTasks();
  const {
    data: habits = [],
    isLoading: loadingHabits,
    error: habitsError,
  } = useHabits();
  const {
    data: goals = [],
    isLoading: loadingGoals,
    error: goalsError,
  } = useActiveGoals();

  // ━━━━━ MUTATIONS ━━━━━
  const completeTask = useCompleteTask();
  const logHabit = useLogHabit();

  // ━━━━━ COMPUTED VALUES ━━━━━
  const completedTodayCount = todayTasks.filter((t) => t.status === 'done').length;
  const habitsCompletedCount = habits.filter((h) => h.todayStatus === 'done').length;
  const totalTasksCount = todayTasks.length + overdueTasks.length;
  const isLoading = loadingTodayTasks || loadingOverdueTasks || loadingHabits || loadingGoals;

  // ━━━━━ LOGGING ━━━━━
  useEffect(() => {
    logger.info('📊 Dashboard loaded');
    logger.divider("Today's Overview");

    // Log data summary once loaded
    if (!isLoading) {
      logger.info('📈 Dashboard data loaded', {
        todayTasks: todayTasks.length,
        overdueTasks: overdueTasks.length,
        habits: habits.length,
        habitsDone: habitsCompletedCount,
        activeGoals: goals.length,
      });
    }

    // Log any errors
    if (todayTasksError) logger.error('❌ Failed to load today tasks', { error: todayTasksError });
    if (overdueTasksError)
      logger.error('❌ Failed to load overdue tasks', { error: overdueTasksError });
    if (habitsError) logger.error('❌ Failed to load habits', { error: habitsError });
    if (goalsError) logger.error('❌ Failed to load goals', { error: goalsError });
  }, [
    isLoading,
    todayTasks.length,
    overdueTasks.length,
    habits.length,
    habitsCompletedCount,
    goals.length,
    todayTasksError,
    overdueTasksError,
    habitsError,
    goalsError,
  ]);

  // ━━━━━ NAVIGATION HANDLERS ━━━━━
  const handleNavigateToTasks = useCallback(() => {
    logger.info('🔗 Navigating to tasks page');
    router.push('/tasks');
  }, [router]);

  const handleNavigateToGoals = useCallback(() => {
    logger.info('🔗 Navigating to goals page');
    router.push('/goals');
  }, [router]);

  const handleNavigateToHabits = useCallback(() => {
    logger.info('🔗 Navigating to habits page');
    router.push('/habits');
  }, [router]);

  const handleNavigateToToday = useCallback(() => {
    logger.info('🔗 Navigating to today page');
    router.push('/today');
  }, [router]);

  const handleAddTask = useCallback(() => {
    logger.info('➕ Add task clicked - navigating to tasks');
    router.push('/tasks');
  }, [router]);

  // ━━━━━ ACTION HANDLERS ━━━━━
  const handleCompleteTask = useCallback(
    (taskId: string) => {
      logger.info('✅ Completing task from dashboard', { taskId });
      completeTask.mutate(taskId);
    },
    [completeTask]
  );

  const handleToggleHabit = useCallback(
    (habitId: string, completed: boolean) => {
      logger.info('🔄 Toggling habit from dashboard', { habitId, completed });
      logHabit.mutate({
        habitId,
        status: completed ? 'done' : 'skipped',
      });
    },
    [logHabit]
  );

  // ━━━━━ RENDER ━━━━━
  return (
    <div className="space-y-6">
      {/* ━━━━━ Stats Overview ━━━━━ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tasks Today"
          value={loadingTodayTasks ? '-' : totalTasksCount}
          subtitle={
            loadingTodayTasks
              ? 'Loading...'
              : overdueTasks.length > 0
              ? `${overdueTasks.length} overdue`
              : `${completedTodayCount} completed`
          }
          icon={<CheckSquare className="h-5 w-5" />}
          isLoading={loadingTodayTasks && loadingOverdueTasks}
          highlight={overdueTasks.length > 0 ? 'error' : undefined}
          onClick={handleNavigateToToday}
        />
        <StatsCard
          title="Habits Done"
          value={loadingHabits ? '-' : `${habitsCompletedCount}/${habits.length}`}
          subtitle={loadingHabits ? 'Loading...' : 'Keep the streaks going!'}
          icon={<Repeat className="h-5 w-5" />}
          isLoading={loadingHabits}
          highlight={
            habits.length > 0 && habitsCompletedCount === habits.length ? 'success' : undefined
          }
          onClick={handleNavigateToHabits}
        />
        <StatsCard
          title="Active Goals"
          value={loadingGoals ? '-' : goals.length}
          subtitle={loadingGoals ? 'Loading...' : 'Working toward your targets'}
          icon={<Target className="h-5 w-5" />}
          isLoading={loadingGoals}
          onClick={handleNavigateToGoals}
        />
        <StatsCard
          title="Overdue"
          value={loadingOverdueTasks ? '-' : overdueTasks.length}
          subtitle={
            loadingOverdueTasks
              ? 'Loading...'
              : overdueTasks.length === 0
              ? 'All caught up!'
              : 'Needs attention'
          }
          icon={<AlertCircle className="h-5 w-5" />}
          isLoading={loadingOverdueTasks}
          highlight={overdueTasks.length > 0 ? 'error' : 'success'}
          onClick={handleNavigateToTasks}
        />
      </div>

      {/* ━━━━━ Main Content Grid ━━━━━ */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-indigo-600" />
              Today's Tasks
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleAddTask}
            >
              Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingTodayTasks ? (
              <TaskListSkeleton rows={4} />
            ) : todayTasks.length === 0 && overdueTasks.length === 0 ? (
              <EmptyState
                title="Nothing scheduled for today"
                description="Enjoy the free time or add something new!"
                action={{ label: 'Add Task', onClick: handleAddTask }}
              />
            ) : (
              <>
                {/* Show overdue tasks first with warning styling */}
                {overdueTasks.slice(0, 2).map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onComplete={handleCompleteTask}
                    isCompleting={completeTask.isPending}
                    isOverdue
                  />
                ))}
                {overdueTasks.length > 2 && (
                  <p className="text-sm text-red-600 text-center py-1">
                    +{overdueTasks.length - 2} more overdue
                  </p>
                )}

                {/* Today's tasks */}
                {todayTasks.slice(0, 4).map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onComplete={handleCompleteTask}
                    isCompleting={completeTask.isPending}
                  />
                ))}

                {(todayTasks.length > 4 || overdueTasks.length > 0) && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                    onClick={handleNavigateToToday}
                  >
                    View all tasks
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Today's Habits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5 text-green-600" />
              Habits
            </CardTitle>
            {!loadingHabits && habits.length > 0 && (
              <Badge
                variant={habitsCompletedCount === habits.length ? 'success' : 'default'}
              >
                {habitsCompletedCount}/{habits.length} done
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingHabits ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-neutral-100 rounded-lg"
                  />
                ))}
              </div>
            ) : habits.length === 0 ? (
              <EmptyState
                title="No habits yet"
                description="Create habits to build consistency!"
                action={{
                  label: 'Add Habit',
                  onClick: handleNavigateToHabits,
                }}
              />
            ) : (
              <>
                {habits.map((habit) => (
                  <HabitToggle
                    key={habit.id}
                    habit={habit}
                    onToggle={handleToggleHabit}
                    isUpdating={logHabit.isPending}
                  />
                ))}
                <Button
                  variant="ghost"
                  className="w-full"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  onClick={handleNavigateToHabits}
                >
                  Manage habits
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Goals Progress - Full Width */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Goals Progress
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              rightIcon={<ArrowRight className="h-4 w-4" />}
              onClick={handleNavigateToGoals}
            >
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {loadingGoals ? (
              <div className="grid gap-4 sm:grid-cols-2 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="h-28 bg-neutral-100 rounded-lg" />
                ))}
              </div>
            ) : goals.length === 0 ? (
              <EmptyState
                title="No active goals"
                description="Set goals to track what matters most!"
                action={{
                  label: 'Add Goal',
                  onClick: handleNavigateToGoals,
                }}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {goals.slice(0, 4).map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
