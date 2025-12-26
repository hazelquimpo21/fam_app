'use client';

/**
 * ============================================================================
 * 🎯 Goals Page
 * ============================================================================
 *
 * Track personal and family goals with progress visualization.
 * Goals can be linked to habits and tasks for automatic progress tracking.
 *
 * Route: /goals
 *
 * Features:
 * - Goal progress bars (quantitative goals)
 * - Linked tasks and habits count (supporting entities)
 * - Grouping by family member
 * - Goal status visualization (on_track, at_risk, behind)
 * - Target dates
 * - Create new goals via GoalModal
 *
 * User Stories Addressed:
 * - US-5.1: Create Goal with details
 * - US-5.2: View Goal Progress
 * - US-5.4: View All Goals
 *
 * Data Flow:
 * 1. Fetch all active goals from database
 * 2. Fetch linked tasks/habits for each goal (or use aggregate counts)
 * 3. Group by family goals vs personal (by owner)
 * 4. Display with progress bars and status indicators
 *
 * ============================================================================
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Target,
  Plus,
  TrendingUp,
  AlertTriangle,
  Check,
  Calendar,
  RefreshCw,
  CheckSquare,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/shared/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { GoalModal } from '@/components/modals/goal-modal';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';
import { useGoals } from '@/lib/hooks/use-goals';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useHabits } from '@/lib/hooks/use-habits';
import type { Goal, GoalStatus, Task, Habit } from '@/types/database';

/**
 * Calculate goal status based on progress and target date
 * Returns 'on_track', 'at_risk', or 'behind'
 */
function calculateGoalStatus(goal: Goal): 'on_track' | 'at_risk' | 'behind' {
  // For qualitative goals without target values, default to on_track if active
  if (goal.goal_type === 'qualitative' || !goal.target_value) {
    return goal.status === 'achieved' ? 'on_track' : 'on_track';
  }

  const progress = (goal.current_value / goal.target_value) * 100;

  // If no target date, just use progress
  if (!goal.target_date) {
    if (progress >= 70) return 'on_track';
    if (progress >= 40) return 'at_risk';
    return 'behind';
  }

  // Calculate expected progress based on time elapsed
  const now = new Date();
  const created = new Date(goal.created_at);
  const target = new Date(goal.target_date);
  const totalDays = (target.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  const elapsedDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  const expectedProgress = (elapsedDays / totalDays) * 100;

  // Compare actual vs expected progress
  if (progress >= expectedProgress * 0.9) return 'on_track';
  if (progress >= expectedProgress * 0.6) return 'at_risk';
  return 'behind';
}

/**
 * Get status configuration for display
 */
function getStatusConfig(status: 'on_track' | 'at_risk' | 'behind') {
  const configs = {
    on_track: {
      label: 'On track',
      icon: Check,
      className: 'bg-green-100 text-green-700',
    },
    at_risk: {
      label: 'At risk',
      icon: AlertTriangle,
      className: 'bg-yellow-100 text-yellow-700',
    },
    behind: {
      label: 'Behind',
      icon: AlertTriangle,
      className: 'bg-red-100 text-red-700',
    },
  };
  return configs[status];
}

/**
 * GoalCard Component
 * Displays a single goal with progress bar and linked entity counts
 */
interface GoalCardProps {
  goal: Goal;
  linkedTasksCount: number;
  linkedHabitsCount: number;
  completedTasksCount: number;
  onClick?: () => void;
}

function GoalCard({
  goal,
  linkedTasksCount,
  linkedHabitsCount,
  completedTasksCount,
  onClick,
}: GoalCardProps) {
  const owner = goal.owner as { name: string; color: string } | null;
  const status = calculateGoalStatus(goal);
  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  // Calculate progress percentage
  const progress = goal.target_value && goal.target_value > 0
    ? Math.round((goal.current_value / goal.target_value) * 100)
    : 0;

  // Format target date
  const formatTargetDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  // Format value display
  const formatValue = (value: number, unit: string | null) => {
    if (unit === '$') return `$${value.toLocaleString()}`;
    return value.toString();
  };

  // Check if there are linked entities
  const hasLinkedEntities = linkedTasksCount > 0 || linkedHabitsCount > 0;

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with title and owner */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-neutral-900">{goal.title}</h3>
              {goal.goal_type === 'quantitative' && goal.target_value && (
                <p className="text-sm text-neutral-500">
                  {formatValue(goal.current_value, goal.unit)} / {formatValue(goal.target_value, goal.unit)} {goal.unit && goal.unit !== '$' && goal.unit}
                </p>
              )}
              {goal.description && (
                <p className="text-sm text-neutral-500 line-clamp-1">{goal.description}</p>
              )}
            </div>
            {owner && (
              <Avatar name={owner.name} color={owner.color} size="sm" />
            )}
          </div>

          {/* Progress bar (for quantitative goals) */}
          {goal.goal_type === 'quantitative' && goal.target_value && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Progress</span>
                <span className="font-medium text-neutral-900">{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    status === 'on_track' && 'bg-gradient-to-r from-green-400 to-green-500',
                    status === 'at_risk' && 'bg-gradient-to-r from-yellow-400 to-yellow-500',
                    status === 'behind' && 'bg-gradient-to-r from-red-400 to-red-500'
                  )}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Linked entities (tasks and habits supporting this goal) */}
          {hasLinkedEntities && (
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              {linkedTasksCount > 0 && (
                <span className="flex items-center gap-1" title="Linked tasks">
                  <CheckSquare className="h-3.5 w-3.5" />
                  {completedTasksCount}/{linkedTasksCount} tasks
                </span>
              )}
              {linkedHabitsCount > 0 && (
                <span className="flex items-center gap-1" title="Linked habits">
                  <RefreshCw className="h-3.5 w-3.5" />
                  {linkedHabitsCount} {linkedHabitsCount === 1 ? 'habit' : 'habits'}
                </span>
              )}
            </div>
          )}

          {/* Footer with status and target date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', statusConfig.className)}>
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </div>
            </div>
            {goal.target_date && (
              <span className="flex items-center gap-1 text-xs text-neutral-500">
                <Calendar className="h-3 w-3" />
                Target: {formatTargetDate(goal.target_date)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for goals
 */
function GoalsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 bg-neutral-200 rounded w-32 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-5 bg-neutral-200 rounded w-3/4" />
                  <div className="h-4 bg-neutral-100 rounded w-1/2" />
                  <div className="h-2 bg-neutral-100 rounded-full" />
                  <div className="flex justify-between">
                    <div className="h-5 bg-neutral-100 rounded w-16" />
                    <div className="h-4 bg-neutral-100 rounded w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Goals Page Component
 */
export default function GoalsPage() {
  // Modal state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Fetch goals from database
  const { data: goals = [], isLoading, error } = useGoals({ status: 'active' });

  // Fetch all tasks and habits to calculate linked counts
  // Note: We fetch all and filter locally to avoid N+1 queries
  const { data: allTasks = [] } = useTasks({});
  const { data: allHabits = [] } = useHabits();

  // Calculate linked entity counts for each goal
  const linkedEntityCounts = useMemo(() => {
    const counts = new Map<string, {
      tasksCount: number;
      completedTasksCount: number;
      habitsCount: number;
    }>();

    // Count tasks per goal
    allTasks.forEach((task) => {
      if (task.goal_id) {
        if (!counts.has(task.goal_id)) {
          counts.set(task.goal_id, { tasksCount: 0, completedTasksCount: 0, habitsCount: 0 });
        }
        const entry = counts.get(task.goal_id)!;
        entry.tasksCount++;
        if (task.status === 'done') {
          entry.completedTasksCount++;
        }
      }
    });

    // Count habits per goal
    allHabits.forEach((habit) => {
      if (habit.goal_id) {
        if (!counts.has(habit.goal_id)) {
          counts.set(habit.goal_id, { tasksCount: 0, completedTasksCount: 0, habitsCount: 0 });
        }
        counts.get(habit.goal_id)!.habitsCount++;
      }
    });

    return counts;
  }, [allTasks, allHabits]);

  // Group goals by family vs personal
  const { familyGoals, memberGoals } = useMemo(() => {
    const family = goals.filter((g) => g.is_family_goal);
    const personal = goals.filter((g) => !g.is_family_goal);

    // Group personal goals by owner
    const byOwner = new Map<string, { owner: { name: string; color: string }; goals: Goal[] }>();

    personal.forEach((goal) => {
      const owner = goal.owner as { id: string; name: string; color: string } | null;
      if (!owner) return;

      if (!byOwner.has(owner.id)) {
        byOwner.set(owner.id, {
          owner: { name: owner.name, color: owner.color },
          goals: [],
        });
      }
      byOwner.get(owner.id)!.goals.push(goal);
    });

    return {
      familyGoals: family,
      memberGoals: Array.from(byOwner.values()),
    };
  }, [goals]);

  /**
   * Handle clicking a goal card - opens the edit modal
   */
  const handleGoalClick = (goal: Goal) => {
    logger.info('Goal clicked', { id: goal.id, title: goal.title });
    setSelectedGoal(goal);
    setIsGoalModalOpen(true);
  };

  /**
   * Handle opening create modal
   */
  const handleAddGoal = () => {
    logger.info('Add Goal button clicked');
    setSelectedGoal(null);
    setIsGoalModalOpen(true);
  };

  /**
   * Handle modal close
   */
  const handleModalClose = (open: boolean) => {
    setIsGoalModalOpen(open);
    if (!open) {
      setSelectedGoal(null);
    }
  };

  // Log page load for debugging
  useEffect(() => {
    logger.info('🎯 Goals page loaded', {
      totalGoals: goals.length,
      familyGoals: familyGoals.length,
      memberGroups: memberGoals.length,
      linkedTasks: allTasks.filter(t => t.goal_id).length,
      linkedHabits: allHabits.filter(h => h.goal_id).length,
    });
    logger.divider('Goals');
  }, [goals.length, familyGoals.length, memberGoals.length, allTasks, allHabits]);

  const hasGoals = goals.length > 0;

  // Error state
  if (error) {
    logger.error('Failed to load goals', { error });
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Target className="h-16 w-16 text-red-500" />}
              title="Failed to load goals"
              description="There was an error loading your goals. Please try again."
              action={{
                label: 'Retry',
                onClick: () => window.location.reload(),
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6 text-amber-500" />
          <h1 className="text-xl font-semibold text-neutral-900">Goals</h1>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleAddGoal}>
          Add Goal
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && <GoalsSkeleton />}

      {/* Empty state */}
      {!isLoading && !hasGoals && (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Target className="h-16 w-16 text-amber-500" />}
              title="No goals yet"
              description="Set your first goal and start tracking your progress!"
              action={{
                label: 'Add Goal',
                onClick: handleAddGoal,
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Family Goals */}
      {!isLoading && familyGoals.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-medium text-neutral-500 uppercase tracking-wider">
            <TrendingUp className="h-4 w-4" />
            Family Goals
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {familyGoals.map((goal) => {
              const counts = linkedEntityCounts.get(goal.id) || {
                tasksCount: 0,
                completedTasksCount: 0,
                habitsCount: 0,
              };
              return (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  linkedTasksCount={counts.tasksCount}
                  completedTasksCount={counts.completedTasksCount}
                  linkedHabitsCount={counts.habitsCount}
                  onClick={() => handleGoalClick(goal)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Member Goals */}
      {!isLoading && memberGoals.map(({ owner, goals: memberGoalsList }) => (
        memberGoalsList.length > 0 && (
          <div key={owner.name} className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-neutral-500 uppercase tracking-wider">
              <Avatar name={owner.name} color={owner.color} size="sm" />
              {owner.name}'s Goals
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {memberGoalsList.map((goal) => {
                const counts = linkedEntityCounts.get(goal.id) || {
                  tasksCount: 0,
                  completedTasksCount: 0,
                  habitsCount: 0,
                };
                return (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    linkedTasksCount={counts.tasksCount}
                    completedTasksCount={counts.completedTasksCount}
                    linkedHabitsCount={counts.habitsCount}
                    onClick={() => handleGoalClick(goal)}
                  />
                );
              })}
            </div>
          </div>
        )
      ))}

      {/* GoalModal for creating/editing goals */}
      <GoalModal
        open={isGoalModalOpen}
        onOpenChange={handleModalClose}
        goal={selectedGoal}
      />
    </div>
  );
}
