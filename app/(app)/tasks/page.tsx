'use client';

/**
 * ============================================================================
 * ✅ Tasks Page
 * ============================================================================
 *
 * Main tasks list with filtering and task management.
 *
 * Route: /tasks
 *
 * ============================================================================
 */

import { useState } from 'react';
import {
  Plus,
  Filter,
  CheckSquare,
  Clock,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/shared/badge';
import { Avatar } from '@/components/shared/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils/cn';
import { useTasks, useCompleteTask, useCreateTask } from '@/lib/hooks/use-tasks';
import type { Task, TaskStatus } from '@/types/database';

/**
 * Status filter options
 */
const statusFilters: { value: TaskStatus | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <CheckSquare className="h-4 w-4" /> },
  { value: 'inbox', label: 'Inbox', icon: <Inbox className="h-4 w-4" /> },
  { value: 'active', label: 'Active', icon: <Clock className="h-4 w-4" /> },
  { value: 'done', label: 'Done', icon: <CheckSquare className="h-4 w-4" /> },
];

/**
 * Format due date for display
 */
function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check if overdue
  if (date < today && date.toDateString() !== today.toDateString()) {
    const daysAgo = Math.ceil((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return `${daysAgo}d overdue`;
  }

  // Today
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  // Tomorrow
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }

  // Within 7 days - show day name
  const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  // Otherwise show date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Check if a date is overdue
 */
function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Task Item Component
 */
interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
  onClick: (id: string) => void;
}

function TaskItem({ task, onComplete, onClick }: TaskItemProps) {
  const overdue = isOverdue(task.due_date) && task.status !== 'done';

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 transition-colors cursor-pointer',
        task.status === 'done'
          ? 'border-neutral-100 bg-neutral-50'
          : 'border-neutral-200 bg-white hover:border-neutral-300'
      )}
      onClick={() => onClick(task.id)}
    >
      {/* Checkbox */}
      <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={task.status === 'done'}
          onChange={() => onComplete(task.id)}
          aria-label={`Complete ${task.title}`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium',
            task.status === 'done'
              ? 'text-neutral-400 line-through'
              : 'text-neutral-900'
          )}
        >
          {task.title}
        </p>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {/* Due date */}
          {task.due_date && (
            <span
              className={cn(
                'flex items-center gap-1 text-xs',
                overdue ? 'text-red-600' : 'text-neutral-500'
              )}
            >
              {overdue && <AlertCircle className="h-3 w-3" />}
              {formatDueDate(task.due_date)}
            </span>
          )}

          {/* Project badge */}
          {task.project && (
            <Badge size="sm" variant="outline">
              {task.project.title}
            </Badge>
          )}
        </div>
      </div>

      {/* Assignee */}
      {task.assigned_to && (
        <Avatar
          name={task.assigned_to.name}
          color={task.assigned_to.color}
          src={task.assigned_to.avatar_url}
          size="sm"
        />
      )}
    </div>
  );
}

/**
 * Quick Add Form Component
 */
interface QuickAddFormProps {
  onSubmit: (title: string) => void;
  isLoading: boolean;
}

function QuickAddForm({ onSubmit, isLoading }: QuickAddFormProps) {
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
        placeholder="Add a task... (press Enter)"
        className="flex-1"
      />
      <Button type="submit" loading={isLoading} disabled={!title.trim()}>
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}

/**
 * Tasks Page Component
 */
export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');

  // Fetch tasks with filter
  const filters = statusFilter === 'all' ? {} : { status: statusFilter };
  const { data: tasks, isLoading, error } = useTasks(filters);

  // Mutations
  const completeTask = useCompleteTask();
  const createTask = useCreateTask();

  /**
   * Handle task completion
   */
  const handleComplete = (taskId: string) => {
    completeTask.mutate(taskId);
  };

  /**
   * Handle task click (open detail view)
   */
  const handleTaskClick = (taskId: string) => {
    // In a real app, this would open a detail panel or navigate to detail page
    console.log('Open task:', taskId);
  };

  /**
   * Handle quick add
   */
  const handleQuickAdd = (title: string) => {
    createTask.mutate({
      title,
      status: 'inbox',
    });
  };

  // Group tasks by status for better organization
  const activeTasks = tasks?.filter((t) => t.status !== 'done') || [];
  const completedTasks = tasks?.filter((t) => t.status === 'done') || [];

  return (
    <div className="space-y-6">
      {/* Header with quick add */}
      <Card>
        <CardContent className="p-4">
          <QuickAddForm
            onSubmit={handleQuickAdd}
            isLoading={createTask.isPending}
          />
        </CardContent>
      </Card>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              statusFilter === filter.value
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            {filter.icon}
            {filter.label}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={<AlertCircle className="h-12 w-12" />}
              title="Failed to load tasks"
              description="Something went wrong. Please try again."
              action={{ label: 'Retry', onClick: () => window.location.reload() }}
            />
          </CardContent>
        </Card>
      ) : tasks?.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={<CheckSquare className="h-12 w-12" />}
              title="No tasks yet"
              description="Add your first task above to get started!"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Active tasks */}
          {activeTasks.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
                Active ({activeTasks.length})
              </h2>
              <div className="space-y-2">
                {activeTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={handleComplete}
                    onClick={handleTaskClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed tasks */}
          {statusFilter !== 'active' && completedTasks.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
                Completed ({completedTasks.length})
              </h2>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={handleComplete}
                    onClick={handleTaskClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
