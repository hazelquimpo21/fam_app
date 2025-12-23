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
 * ============================================================================
 */

import { useState } from 'react';
import {
  Plus,
  Flame,
  Check,
  X,
  SkipForward,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge, StreakBadge } from '@/components/shared/badge';
import { Avatar } from '@/components/shared/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils/cn';
import { useHabits, useLogHabit, useCreateHabit, type HabitWithTodayStatus } from '@/lib/hooks/use-habits';

/**
 * Get the days of the current week
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

/**
 * Week Progress Component
 * Shows the habit completion for each day of the current week
 */
interface WeekProgressProps {
  completedDays: Set<string>; // Set of YYYY-MM-DD strings
}

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

/**
 * Habit Card Component
 */
interface HabitCardProps {
  habit: HabitWithTodayStatus;
  onComplete: () => void;
  onSkip: () => void;
}

function HabitCard({ habit, onComplete, onSkip }: HabitCardProps) {
  const isCompletedToday = habit.todayStatus === 'done';
  const isSkippedToday = habit.todayStatus === 'skipped';

  // Mock week data - in production this would come from habit_logs
  const mockCompletedDays = new Set<string>();
  const today = new Date();
  for (let i = 0; i < habit.current_streak && i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    if (i > 0 || isCompletedToday) {
      mockCompletedDays.add(date.toISOString().split('T')[0]);
    }
  }

  return (
    <Card className={cn(
      'transition-all duration-200',
      isCompletedToday && 'border-green-200 bg-green-50/50'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Completion buttons */}
          <div className="flex flex-col gap-1">
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
                <h3 className={cn(
                  'font-medium',
                  isCompletedToday ? 'text-green-700' : 'text-neutral-900'
                )}>
                  {habit.title}
                </h3>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {habit.frequency === 'daily' && 'Every day'}
                  {habit.frequency === 'weekly' && `${habit.target_days_per_week}x per week`}
                  {habit.owner && ` · ${habit.owner.name}`}
                </p>
              </div>
              <StreakBadge
                count={habit.current_streak}
                size="sm"
                animate={habit.current_streak > 0 && [7, 14, 30, 60, 100].includes(habit.current_streak)}
              />
            </div>

            {/* Week progress */}
            <div className="mt-3">
              <WeekProgress completedDays={mockCompletedDays} />
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

/**
 * Quick Add Habit Form
 */
interface QuickAddHabitFormProps {
  onSubmit: (title: string) => void;
  isLoading: boolean;
}

function QuickAddHabitForm({ onSubmit, isLoading }: QuickAddHabitFormProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit(title.trim());
      setTitle('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a new habit... (e.g., Exercise 30 min)"
        className="flex-1"
      />
      <Button type="submit" loading={isLoading} disabled={!title.trim()}>
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}

/**
 * Stats Summary Component
 */
interface StatsSummaryProps {
  habits: HabitWithTodayStatus[];
}

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

/**
 * Habits Page Component
 */
export default function HabitsPage() {
  const { data: habits, isLoading, error } = useHabits();
  const logHabit = useLogHabit();
  const createHabit = useCreateHabit();

  /**
   * Handle habit completion
   */
  const handleComplete = (habitId: string) => {
    logHabit.mutate({ habitId, status: 'done' });
  };

  /**
   * Handle habit skip
   */
  const handleSkip = (habitId: string) => {
    logHabit.mutate({ habitId, status: 'skipped' });
  };

  /**
   * Handle create habit
   */
  const handleCreateHabit = (title: string) => {
    createHabit.mutate({ title, frequency: 'daily' });
  };

  return (
    <div className="space-y-6">
      {/* Quick add */}
      <Card>
        <CardContent className="p-4">
          <QuickAddHabitForm
            onSubmit={handleCreateHabit}
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
              description="Start building good habits! Add your first one above."
            />
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {!isLoading && !error && habits && habits.length > 0 && (
        <>
          {/* Stats */}
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
                onComplete={() => handleComplete(habit.id)}
                onSkip={() => handleSkip(habit.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
