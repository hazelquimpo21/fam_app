'use client';

/**
 * ============================================================================
 * 🔄 Habits Page
 * ============================================================================
 *
 * Track daily habits with streaks and progress visualization.
 *
 * Route: /habits
 *
 * Features:
 * - View all active habits with week progress
 * - Click habit to edit in HabitModal
 * - Quick-add habit via input OR full create via HabitModal
 * - Toggle habit completion (done/skipped)
 * - Streak tracking and celebration
 *
 * User Stories Addressed:
 * - US-4.1: Create Habit with frequency
 * - US-4.2: Check Off Habit
 * - US-4.4: View All Habits / Click to edit
 *
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import {
  Plus,
  Flame,
  Check,
  SkipForward,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StreakBadge } from '@/components/shared/badge';
import { Avatar } from '@/components/shared/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { HabitModal } from '@/components/modals/habit-modal';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';
import {
  useHabits,
  useLogHabit,
  useCreateHabit,
  useWeeklyHabitLogs,
  type HabitWithTodayStatus,
  type WeeklyHabitLogsMap,
} from '@/lib/hooks/use-habits';
import type { Habit } from '@/types/database';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the days of the current week (Sunday-Saturday)
 * Used for the week progress visualization
 */
function getCurrentWeekDays(): { date: Date; dayName: string; isToday: boolean }[] {
  const today = new Date();
  const currentDay = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDay);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return {
      date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday: date.toDateString() === today.toDateString(),
    };
  });
}

// ============================================================================
// WeekProgress Component
// ============================================================================

interface WeekProgressProps {
  /** Set of YYYY-MM-DD strings for completed days */
  completedDays: Set<string>;
}

/**
 * WeekProgress - Shows habit completion for each day of the current week
 * Visual representation of streaks and consistency
 */
function WeekProgress({ completedDays }: WeekProgressProps) {
  const weekDays = getCurrentWeekDays();

  return (
    <div className="flex gap-1">
      {weekDays.map(({ date, dayName, isToday }) => {
        const dateStr = date.toISOString().split('T')[0];
        const isCompleted = completedDays.has(dateStr);
        const isPast = date < new Date() && !isToday;

        return (
          <div
            key={dateStr}
            className={cn(
              'flex flex-col items-center gap-1',
              isToday && 'font-medium'
            )}
          >
            <span className="text-xs text-neutral-500">{dayName}</span>
            <div
              className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center text-xs',
                isCompleted && 'bg-green-500 text-white',
                !isCompleted && isPast && 'bg-neutral-200 text-neutral-400',
                !isCompleted && !isPast && 'bg-neutral-100 text-neutral-400',
                isToday && !isCompleted && 'ring-2 ring-indigo-500 ring-offset-2'
              )}
            >
              {isCompleted ? <Check className="h-3 w-3" /> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// HabitCard Component
// ============================================================================

interface HabitCardProps {
  habit: HabitWithTodayStatus;
  /** Set of YYYY-MM-DD strings for days completed this week */
  completedDays: Set<string>;
  onComplete: () => void;
  onSkip: () => void;
  onClick: () => void;
}

/**
 * HabitCard - Displays a single habit with completion controls
 *
 * Click the card (except buttons) to edit the habit in the modal.
 * Click the check button to mark as done.
 * Click the skip button to skip for today.
 */
function HabitCard({ habit, completedDays, onComplete, onSkip, onClick }: HabitCardProps) {
  const isCompletedToday = habit.todayStatus === 'done';
  const isSkippedToday = habit.todayStatus === 'skipped';

  return (
    <Card
      className={cn(
        'transition-all duration-200 cursor-pointer hover:shadow-md',
        isCompletedToday && 'border-green-200 bg-green-50/50'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Completion buttons - stop propagation to prevent opening modal */}
          <div
            className="flex flex-col gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onComplete}
              disabled={isCompletedToday}
              className={cn(
                'h-10 w-10 rounded-full flex items-center justify-center transition-all',
                isCompletedToday
                  ? 'bg-green-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-green-100 hover:text-green-600'
              )}
              title={isCompletedToday ? 'Completed!' : 'Mark as done'}
            >
              <Check className="h-5 w-5" />
            </button>
            {!isCompletedToday && !isSkippedToday && (
              <button
                onClick={onSkip}
                className="h-6 w-6 rounded-full flex items-center justify-center bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 mx-auto"
                title="Skip today"
              >
                <SkipForward className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3
                  className={cn(
                    'font-medium',
                    isCompletedToday ? 'text-green-700' : 'text-neutral-900'
                  )}
                >
                  {habit.title}
                </h3>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {habit.frequency === 'daily' && 'Every day'}
                  {habit.frequency === 'weekly' &&
                    `${habit.target_days_per_week}x per week`}
                  {habit.frequency === 'custom' && 'Custom schedule'}
                  {habit.owner && ` · ${habit.owner.name}`}
                </p>
              </div>
              <StreakBadge
                count={habit.current_streak}
                size="sm"
                animate={
                  habit.current_streak > 0 &&
                  [7, 14, 30, 60, 100].includes(habit.current_streak)
                }
              />
            </div>

            {/* Week progress - now using real data from habit_logs */}
            <div className="mt-3">
              <WeekProgress completedDays={completedDays} />
            </div>
          </div>

          {/* Owner avatar */}
          {habit.owner && (
            <Avatar
              name={habit.owner.name}
              color={habit.owner.color}
              src={habit.owner.avatar_url}
              size="sm"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// QuickAddHabitForm Component
// ============================================================================

interface QuickAddHabitFormProps {
  onSubmit: (title: string) => void;
  onOpenModal: () => void;
  isLoading: boolean;
}

/**
 * QuickAddHabitForm - Fast habit capture with optional modal for full creation
 *
 * Type and press Enter for quick daily habit.
 * Click the "+" button with empty input to open full HabitModal.
 */
function QuickAddHabitForm({ onSubmit, onOpenModal, isLoading }: QuickAddHabitFormProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit(title.trim());
      setTitle('');
    } else {
      // Empty input + button click = open modal for full creation
      onOpenModal();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Quick add habit... (or click + for full options)"
        className="flex-1"
      />
      <Button
        type="submit"
        loading={isLoading}
        title={title.trim() ? 'Add habit' : 'Open habit creator'}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}

// ============================================================================
// StatsSummary Component
// ============================================================================

interface StatsSummaryProps {
  habits: HabitWithTodayStatus[];
}

/**
 * StatsSummary - Displays habit statistics at a glance
 */
function StatsSummary({ habits }: StatsSummaryProps) {
  const completedToday = habits.filter((h) => h.todayStatus === 'done').length;
  const totalActiveStreak = habits.reduce((sum, h) => sum + h.current_streak, 0);
  const longestStreak = Math.max(...habits.map((h) => h.current_streak), 0);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">
              {completedToday}/{habits.length}
            </p>
            <p className="text-sm text-neutral-500">Done today</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">
              {totalActiveStreak}
            </p>
            <p className="text-sm text-neutral-500">Total streak days</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">
              {longestStreak}
            </p>
            <p className="text-sm text-neutral-500">Best streak</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// HabitsPage Component (Main Export)
// ============================================================================

/**
 * Habits Page - Main view for habit tracking
 *
 * Features:
 * - Quick add form for fast capture
 * - Click "+ Habit" for full creation modal
 * - Click any habit card to edit in modal
 * - Check/skip buttons for daily tracking
 */
export default function HabitsPage() {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  // Data fetching - habits and their weekly logs
  const { data: habits, isLoading, error } = useHabits();

  // Fetch weekly logs for all habits (for WeekProgress display)
  // This is more efficient than fetching logs per-habit
  const habitIds = habits?.map((h) => h.id) ?? [];
  const { data: weeklyLogs } = useWeeklyHabitLogs(habitIds);

  // Mutations
  const logHabit = useLogHabit();
  const createHabit = useCreateHabit();

  // Log page load for debugging
  useEffect(() => {
    logger.info('🔄 Habits page loaded', {
      habitCount: habits?.length ?? 0,
      isLoading,
      hasWeeklyLogs: !!weeklyLogs,
    });
    logger.divider('Habits');
  }, [habits?.length, isLoading, weeklyLogs]);

  // ========================================================================
  // Handlers
  // ========================================================================

  /**
   * Handle habit completion (mark as done)
   */
  const handleComplete = (habitId: string) => {
    logger.info('Completing habit', { habitId });
    logHabit.mutate({ habitId, status: 'done' });
  };

  /**
   * Handle habit skip
   */
  const handleSkip = (habitId: string) => {
    logger.info('Skipping habit', { habitId });
    logHabit.mutate({ habitId, status: 'skipped' });
  };

  /**
   * Handle quick-add habit (creates daily habit)
   */
  const handleQuickCreate = (title: string) => {
    logger.info('Quick creating habit', { title });
    createHabit.mutate({ title, frequency: 'daily' });
  };

  /**
   * Handle clicking on a habit card - open in edit mode
   */
  const handleHabitClick = (habit: Habit) => {
    logger.info('Opening habit for edit', { habitId: habit.id, title: habit.title });
    setSelectedHabit(habit);
    setIsModalOpen(true);
  };

  /**
   * Handle opening modal for create (no habit selected)
   */
  const handleOpenCreateModal = () => {
    logger.info('Opening habit modal for create');
    setSelectedHabit(null);
    setIsModalOpen(true);
  };

  /**
   * Handle modal close
   */
  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setSelectedHabit(null);
    }
  };

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className="space-y-6">
      {/* Page header with create button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-6 w-6 text-green-500" />
          <h1 className="text-2xl font-bold text-neutral-900">Habits</h1>
        </div>
        <Button
          onClick={handleOpenCreateModal}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          New Habit
        </Button>
      </div>

      {/* Quick add form */}
      <Card>
        <CardContent className="p-4">
          <QuickAddHabitForm
            onSubmit={handleQuickCreate}
            onOpenModal={handleOpenCreateModal}
            isLoading={createHabit.isPending}
          />
        </CardContent>
      </Card>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              title="Failed to load habits"
              description="Something went wrong. Please try again."
              action={{ label: 'Retry', onClick: () => window.location.reload() }}
            />
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && !error && habits?.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={<Flame className="h-12 w-12" />}
              title="No habits yet"
              description="Start building good habits! Use the quick add above or click 'New Habit' for full options."
              action={{
                label: 'Create Your First Habit',
                onClick: handleOpenCreateModal,
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Content - Stats and habit list */}
      {!isLoading && !error && habits && habits.length > 0 && (
        <>
          {/* Stats summary */}
          <StatsSummary habits={habits} />

          {/* Habits list */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
              Your Habits
            </h2>
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                completedDays={weeklyLogs?.get(habit.id) ?? new Set()}
                onComplete={() => handleComplete(habit.id)}
                onSkip={() => handleSkip(habit.id)}
                onClick={() => handleHabitClick(habit)}
              />
            ))}
          </div>
        </>
      )}

      {/* HabitModal for create/edit */}
      <HabitModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        habit={selectedHabit}
      />
    </div>
  );
}
