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
 * Features (planned):
 * - Goal progress bars
 * - Grouping by family member
 * - Goal status (on track, at risk, behind)
 * - Linked habits/tasks
 * - Target dates
 *
 * ============================================================================
 */

import { useEffect } from 'react';
import { Target, Plus, TrendingUp, AlertTriangle, Check, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/shared/badge';
import { Avatar } from '@/components/shared/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';

/**
 * Goal status type
 */
type GoalStatus = 'on_track' | 'at_risk' | 'behind';

/**
 * Mock goals data
 * In production, this would come from useGoals() hook
 */
const mockGoals = {
  family: [
    {
      id: '1',
      title: 'Pay off car',
      current: 2400,
      target: 8000,
      unit: '$',
      targetDate: 'Dec 2025',
      status: 'on_track' as GoalStatus,
      owner: { name: 'Family', color: '#8B5CF6' },
    },
  ],
  members: [
    {
      memberName: 'Hazel',
      color: '#6366F1',
      goals: [
        {
          id: '2',
          title: 'Read 50 books',
          current: 42,
          target: 50,
          unit: 'books',
          targetDate: 'Dec 31',
          status: 'on_track' as GoalStatus,
          linkedHabit: 'Read 20 min daily',
        },
        {
          id: '3',
          title: 'Save $5K for Japan',
          current: 3200,
          target: 5000,
          unit: '$',
          targetDate: 'Jun 2025',
          status: 'on_track' as GoalStatus,
          linkedHabit: 'Save $50/week',
        },
      ],
    },
    {
      memberName: 'Mike',
      color: '#10B981',
      goals: [
        {
          id: '4',
          title: 'Run a half marathon',
          current: 8,
          target: 21,
          unit: 'km',
          targetDate: 'Mar 2025',
          status: 'at_risk' as GoalStatus,
          linkedHabit: 'Run 3x/week',
        },
      ],
    },
    {
      memberName: 'Miles',
      color: '#F59E0B',
      goals: [
        {
          id: '5',
          title: 'Learn 50 piano songs',
          current: 12,
          target: 50,
          unit: 'songs',
          targetDate: 'Dec 2025',
          status: 'behind' as GoalStatus,
          linkedHabit: 'Practice piano 30 min',
        },
      ],
    },
  ],
};

/**
 * Get status configuration for display
 */
function getStatusConfig(status: GoalStatus) {
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
 * Displays a single goal with progress bar
 */
interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  targetDate: string;
  status: GoalStatus;
  linkedHabit?: string;
}

interface GoalCardProps {
  goal: Goal;
  owner?: { name: string; color: string };
}

function GoalCard({ goal, owner }: GoalCardProps) {
  const progress = Math.round((goal.current / goal.target) * 100);
  const statusConfig = getStatusConfig(goal.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with title and owner */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-neutral-900">{goal.title}</h3>
              <p className="text-sm text-neutral-500">
                {goal.unit === '$' ? `$${goal.current.toLocaleString()}` : goal.current} / {goal.unit === '$' ? `$${goal.target.toLocaleString()}` : goal.target} {goal.unit !== '$' && goal.unit}
              </p>
            </div>
            {owner && (
              <Avatar name={owner.name} color={owner.color} size="sm" />
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Progress</span>
              <span className="font-medium text-neutral-900">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  goal.status === 'on_track' && 'bg-gradient-to-r from-green-400 to-green-500',
                  goal.status === 'at_risk' && 'bg-gradient-to-r from-yellow-400 to-yellow-500',
                  goal.status === 'behind' && 'bg-gradient-to-r from-red-400 to-red-500'
                )}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Footer with status and target date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', statusConfig.className)}>
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs text-neutral-500">
              <Calendar className="h-3 w-3" />
              Target: {goal.targetDate}
            </span>
          </div>

          {/* Linked habit (if any) */}
          {goal.linkedHabit && (
            <p className="text-xs text-neutral-500">
              Supported by: "{goal.linkedHabit}" habit
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Goals Page Component
 */
export default function GoalsPage() {
  // Log page load for debugging
  useEffect(() => {
    const totalGoals = mockGoals.family.length +
      mockGoals.members.reduce((sum, m) => sum + m.goals.length, 0);
    logger.info('Goals page loaded', { totalGoals });
    logger.divider('Goals');
  }, []);

  const hasGoals = mockGoals.family.length > 0 ||
    mockGoals.members.some((m) => m.goals.length > 0);

  return (
    <div className="space-y-6">
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6 text-purple-600" />
          <h1 className="text-xl font-semibold text-neutral-900">Goals</h1>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>
          Add Goal
        </Button>
      </div>

      {/* Empty state */}
      {!hasGoals && (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Target className="h-16 w-16 text-purple-500" />}
              title="No goals yet"
              description="Set your first goal and start tracking your progress!"
              action={{
                label: 'Add Goal',
                onClick: () => logger.info('Add goal clicked'),
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Family Goals */}
      {mockGoals.family.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-medium text-neutral-500 uppercase tracking-wider">
            <TrendingUp className="h-4 w-4" />
            Family Goals
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {mockGoals.family.map((goal) => (
              <GoalCard key={goal.id} goal={goal} owner={goal.owner} />
            ))}
          </div>
        </div>
      )}

      {/* Member Goals */}
      {mockGoals.members.map((member) => (
        member.goals.length > 0 && (
          <div key={member.memberName} className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-neutral-500 uppercase tracking-wider">
              <Avatar name={member.memberName} color={member.color} size="sm" />
              {member.memberName}'s Goals
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {member.goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  owner={{ name: member.memberName, color: member.color }}
                />
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}
