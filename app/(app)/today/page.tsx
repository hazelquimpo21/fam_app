'use client';

/**
 * ============================================================================
 * ☀️ Today Page
 * ============================================================================
 *
 * A focused view of today's work, including:
 * - Today's meals
 * - Habits to complete
 * - Overdue tasks
 * - Tasks due today
 *
 * Route: /today
 *
 * This page helps users focus on what needs to be done today without
 * the distraction of future tasks or completed items.
 *
 * ============================================================================
 */

import { useEffect } from 'react';
import {
  Sun,
  Clock,
  AlertCircle,
  Utensils,
  Repeat,
  CheckSquare,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge, StreakBadge } from '@/components/shared/badge';
import { Avatar } from '@/components/shared/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';

/**
 * Mock data for demonstration
 * In production, these would come from database queries
 */
const mockMeals = [
  { type: 'Breakfast', name: 'Oatmeal with berries', cook: null },
  { type: 'Lunch', name: 'Leftover soup', cook: null },
  { type: 'Dinner', name: 'Tacos 🌮', cook: { name: 'Mike', color: '#10B981' } },
];

const mockHabits = [
  { id: '1', title: 'Read 20 min', completed: true, streak: 12, owner: { name: 'Hazel', color: '#6366F1' } },
  { id: '2', title: 'Exercise', completed: false, streak: 3, owner: { name: 'Hazel', color: '#6366F1' } },
  { id: '3', title: 'Journal', completed: true, streak: 45, owner: { name: 'Hazel', color: '#6366F1' } },
  { id: '4', title: 'Vitamins', completed: false, streak: 0, owner: { name: 'Miles', color: '#F59E0B' } },
];

const mockOverdueTasks = [
  { id: '1', title: 'Pay water bill', dueDate: 'Dec 21', assignee: { name: 'Hazel', color: '#6366F1' } },
  { id: '2', title: 'Schedule dentist', dueDate: 'Dec 20', assignee: { name: 'Hazel', color: '#6366F1' } },
];

const mockTodayTasks = [
  { id: '3', title: 'Review camp options', dueTime: null, assignee: { name: 'Hazel', color: '#6366F1' }, project: 'Summer Camps' },
  { id: '4', title: 'Soccer practice pickup', dueTime: '3:30 PM', assignee: { name: 'Mike', color: '#10B981' }, project: null },
  { id: '5', title: 'Grocery run', dueTime: null, assignee: { name: 'Hazel', color: '#6366F1' }, project: null },
  { id: '6', title: 'Miles homework help', dueTime: null, assignee: { name: 'Mike', color: '#10B981' }, project: null },
  { id: '7', title: 'Family movie night prep', dueTime: null, assignee: { name: 'Zelda', color: '#F59E0B' }, project: null },
];

/**
 * Today Page Component
 */
export default function TodayPage() {
  // Get current day for display
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Log page load for debugging
  useEffect(() => {
    logger.info('Today page loaded', {
      date: today.toISOString().split('T')[0],
      overdue: mockOverdueTasks.length,
      todayTasks: mockTodayTasks.length,
    });
    logger.divider("Today's Focus");
  }, []);

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

      {/* Meals section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Utensils className="h-5 w-5 text-orange-500" />
            Meals
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-2 sm:grid-cols-3">
            {mockMeals.map((meal) => (
              <div
                key={meal.type}
                className="flex items-center justify-between rounded-lg bg-neutral-50 p-3"
              >
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase">
                    {meal.type}
                  </p>
                  <p className="font-medium text-neutral-900">{meal.name}</p>
                </div>
                {meal.cook && (
                  <Avatar name={meal.cook.name} color={meal.cook.color} size="sm" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Habits section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Repeat className="h-5 w-5 text-green-500" />
              Habits
            </CardTitle>
            <Badge variant="success">
              {mockHabits.filter((h) => h.completed).length}/{mockHabits.length} done
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {mockHabits.map((habit) => (
              <div
                key={habit.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3',
                  habit.completed
                    ? 'border-green-200 bg-green-50'
                    : 'border-neutral-200 bg-white'
                )}
              >
                <div
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center',
                    habit.completed
                      ? 'bg-green-500 text-white'
                      : 'bg-neutral-100 text-neutral-400'
                  )}
                >
                  {habit.completed ? (
                    <Check className="h-4 w-4" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    habit.completed ? 'text-green-700' : 'text-neutral-900'
                  )}>
                    {habit.title}
                  </p>
                </div>
                {habit.streak > 0 && (
                  <StreakBadge count={habit.streak} size="sm" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overdue section */}
      {mockOverdueTasks.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-red-700">
              <AlertCircle className="h-5 w-5" />
              Overdue ({mockOverdueTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {mockOverdueTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg border border-red-200 bg-white p-3"
                >
                  <Checkbox checked={false} onChange={() => {}} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900">{task.title}</p>
                    <p className="text-xs text-red-600">{task.dueDate}</p>
                  </div>
                  <Avatar
                    name={task.assignee.name}
                    color={task.assignee.color}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's tasks section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckSquare className="h-5 w-5 text-indigo-500" />
            Today ({mockTodayTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {mockTodayTasks.length === 0 ? (
            <EmptyState
              icon={<Sun className="h-12 w-12" />}
              title="Nothing scheduled for today"
              description="Enjoy the free time or add something new!"
            />
          ) : (
            <div className="space-y-2">
              {mockTodayTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 hover:border-neutral-300 transition-colors"
                >
                  <Checkbox checked={false} onChange={() => {}} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900">{task.title}</p>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      {task.dueTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.dueTime}
                        </span>
                      )}
                      {task.project && (
                        <Badge size="sm" variant="outline">
                          {task.project}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Avatar
                    name={task.assignee.name}
                    color={task.assignee.color}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
