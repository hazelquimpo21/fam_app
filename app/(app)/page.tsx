'use client';

/**
 * ============================================================================
 * 📊 Dashboard Page
 * ============================================================================
 *
 * The main dashboard showing a quick overview of:
 * - Today's tasks
 * - Habit progress
 * - Active goals
 * - Recent milestones
 *
 * Route: /
 *
 * ============================================================================
 */

import { useEffect } from 'react';
import {
  CheckSquare,
  Repeat,
  Target,
  Sparkles,
  Clock,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge, StreakBadge } from '@/components/shared/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar } from '@/components/shared/avatar';
import { logger } from '@/lib/utils/logger';

/**
 * Mock data for demo purposes
 * In production, this would come from the database via React Query
 */
const mockTodayTasks = [
  { id: '1', title: 'Review quarterly reports', completed: false, dueTime: '10:00 AM', assignee: { name: 'Hazel', color: '#6366F1' } },
  { id: '2', title: 'Call pediatrician about checkup', completed: true, assignee: { name: 'Mike', color: '#10B981' } },
  { id: '3', title: 'Pick up groceries', completed: false, dueTime: '5:00 PM', assignee: { name: 'Hazel', color: '#6366F1' } },
  { id: '4', title: 'Help Zelda with homework', completed: false, dueTime: '4:00 PM', assignee: { name: 'Mike', color: '#10B981' } },
];

const mockHabits = [
  { id: '1', title: 'Exercise', streak: 12, completedToday: true, owner: { name: 'Hazel', color: '#6366F1' } },
  { id: '2', title: 'Read 20 min', streak: 7, completedToday: false, owner: { name: 'Zelda', color: '#F59E0B' } },
  { id: '3', title: 'Take vitamins', streak: 30, completedToday: true, owner: { name: 'Mike', color: '#10B981' } },
];

const mockGoals = [
  { id: '1', title: 'Read 50 books', progress: 84, current: 42, target: 50, unit: 'books', owner: { name: 'Hazel', color: '#6366F1' } },
  { id: '2', title: 'Save $10,000', progress: 65, current: 6500, target: 10000, unit: 'dollars', owner: { name: 'Family', color: '#8B5CF6' } },
];

/**
 * Stats Card Component
 */
interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; direction: 'up' | 'down' };
}

function StatsCard({ title, value, subtitle, icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-500">{title}</p>
            <p className="text-3xl font-bold text-neutral-900">{value}</p>
            {subtitle && (
              <p className="text-sm text-neutral-500">{subtitle}</p>
            )}
          </div>
          <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1">
            <span className={trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
            </span>
            <span className="text-sm text-neutral-500">vs last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Dashboard Page Component
 */
export default function DashboardPage() {
  // Log page load
  useEffect(() => {
    logger.info('Dashboard loaded');
    logger.divider('Today\'s Overview');
  }, []);

  const completedCount = mockTodayTasks.filter(t => t.completed).length;
  const habitsCompletedCount = mockHabits.filter(h => h.completedToday).length;

  return (
    <div className="space-y-6">
      {/* ━━━━━ Stats Overview ━━━━━ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tasks Today"
          value={mockTodayTasks.length}
          subtitle={`${completedCount} completed`}
          icon={<CheckSquare className="h-5 w-5" />}
          trend={{ value: 12, direction: 'up' }}
        />
        <StatsCard
          title="Habits Done"
          value={`${habitsCompletedCount}/${mockHabits.length}`}
          subtitle="Keep the streaks going!"
          icon={<Repeat className="h-5 w-5" />}
        />
        <StatsCard
          title="Active Goals"
          value={mockGoals.length}
          subtitle="On track to meet targets"
          icon={<Target className="h-5 w-5" />}
        />
        <StatsCard
          title="This Week's Wins"
          value={5}
          subtitle="Celebrate the victories!"
          icon={<Sparkles className="h-5 w-5" />}
          trend={{ value: 25, direction: 'up' }}
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
            <Button size="sm" variant="ghost" leftIcon={<Plus className="h-4 w-4" />}>
              Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockTodayTasks.length === 0 ? (
              <EmptyState
                title="Nothing scheduled for today"
                description="Enjoy the free time or add something new!"
                action={{ label: 'Add Task', onClick: () => {} }}
              />
            ) : (
              <>
                {mockTodayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 hover:bg-neutral-50"
                  >
                    <Checkbox
                      checked={task.completed}
                      onChange={() => {}}
                      aria-label={`Complete ${task.title}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.completed ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>
                        {task.title}
                      </p>
                      {task.dueTime && (
                        <p className="text-xs text-neutral-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.dueTime}
                        </p>
                      )}
                    </div>
                    <Avatar
                      name={task.assignee.name}
                      color={task.assignee.color}
                      size="sm"
                    />
                  </div>
                ))}
                <Button
                  variant="ghost"
                  className="w-full"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  View all tasks
                </Button>
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
            <Badge variant="success">{habitsCompletedCount}/{mockHabits.length} done</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockHabits.map((habit) => (
              <div
                key={habit.id}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 hover:bg-neutral-50"
              >
                <Checkbox
                  checked={habit.completedToday}
                  onChange={() => {}}
                  aria-label={`Complete ${habit.title}`}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${habit.completedToday ? 'text-neutral-400' : 'text-neutral-900'}`}>
                    {habit.title}
                  </p>
                </div>
                <StreakBadge count={habit.streak} size="sm" />
                <Avatar
                  name={habit.owner.name}
                  color={habit.owner.color}
                  size="sm"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Goals Progress */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Goals Progress
            </CardTitle>
            <Button size="sm" variant="ghost" rightIcon={<ArrowRight className="h-4 w-4" />}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {mockGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-lg border border-neutral-200 p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-neutral-900">{goal.title}</p>
                      <p className="text-sm text-neutral-500">
                        {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
                      </p>
                    </div>
                    <Avatar
                      name={goal.owner.name}
                      color={goal.owner.color}
                      size="sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Progress</span>
                      <span className="font-medium text-neutral-900">{goal.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-100">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
