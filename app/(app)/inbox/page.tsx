'use client';

/**
 * ============================================================================
 * 📥 Inbox Page
 * ============================================================================
 *
 * The inbox is a quick capture location for ideas, tasks, and thoughts that
 * need to be processed later. Users can capture anything here and then triage
 * it into tasks, projects, or someday items.
 *
 * Route: /inbox
 *
 * Features:
 * - Quick capture input
 * - List of unprocessed items from database
 * - Processing actions (→ Task, → Project, → Someday, Delete)
 *
 * ============================================================================
 */

import { useEffect, useRef } from 'react';
import { Inbox, Plus, ArrowRight, Trash2, FolderOpen, Sparkles, CheckSquare, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import { useInboxTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/lib/hooks/use-tasks';
import { useCreateSomedayItem } from '@/lib/hooks/use-someday';
import { useCreateProject } from '@/lib/hooks/use-projects';
import { logger } from '@/lib/utils/logger';
import type { Task } from '@/types/database';

/**
 * InboxItem Component
 * Displays a single inbox item with processing actions
 */
interface InboxItemProps {
  item: Task;
  onProcess: (id: string, action: 'task' | 'project' | 'someday' | 'delete') => void;
  isProcessing: boolean;
}

function InboxItem({ item, onProcess, isProcessing }: InboxItemProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Item title and date */}
          <div>
            <p className="font-medium text-neutral-900">{item.title}</p>
            <p className="text-sm text-neutral-500">
              Added {new Date(item.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Processing actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<CheckSquare className="h-4 w-4" />}
              onClick={() => onProcess(item.id, 'task')}
              disabled={isProcessing}
            >
              Task
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<FolderOpen className="h-4 w-4" />}
              onClick={() => onProcess(item.id, 'project')}
              disabled={isProcessing}
            >
              Project
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Sparkles className="h-4 w-4" />}
              onClick={() => onProcess(item.id, 'someday')}
              disabled={isProcessing}
            >
              Someday
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => onProcess(item.id, 'delete')}
              disabled={isProcessing}
            >
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for inbox items
 */
function InboxSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <div className="h-5 bg-neutral-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-neutral-100 rounded w-1/4" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 bg-neutral-100 rounded w-16" />
                <div className="h-8 bg-neutral-100 rounded w-16" />
                <div className="h-8 bg-neutral-100 rounded w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Inbox Page Component
 */
export default function InboxPage() {
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch inbox items from database
  const { data: inboxItems = [], isLoading, error } = useInboxTasks();

  // Mutations for processing items
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createSomeday = useCreateSomedayItem();
  const createProject = useCreateProject();

  // Track if any mutation is in progress
  const isProcessing = createTask.isPending || updateTask.isPending ||
    deleteTask.isPending || createSomeday.isPending || createProject.isPending;

  // Log page load for debugging
  useEffect(() => {
    logger.info('Inbox page loaded', { itemCount: inboxItems.length, isLoading });
    logger.divider('Inbox');
  }, [inboxItems.length, isLoading]);

  /**
   * Handle processing an inbox item
   * Converts the item to a task, project, someday item, or deletes it
   */
  const handleProcess = async (id: string, action: 'task' | 'project' | 'someday' | 'delete') => {
    const item = inboxItems.find((i) => i.id === id);
    if (!item) {
      logger.error('Item not found for processing', { id });
      return;
    }

    logger.info('Processing inbox item', { id, action, title: item.title });

    switch (action) {
      case 'task':
        // Update the task status from 'inbox' to 'active'
        await updateTask.mutateAsync({
          id,
          status: 'active',
        });
        break;

      case 'project':
        // Create a new project from this item, then delete the inbox item
        await createProject.mutateAsync({
          title: item.title,
          description: item.description || undefined,
          status: 'planning',
        });
        await deleteTask.mutateAsync(id);
        break;

      case 'someday':
        // Create a someday item from this, then delete the inbox item
        await createSomeday.mutateAsync({
          title: item.title,
          description: item.description || undefined,
          category: 'other',
        });
        await deleteTask.mutateAsync(id);
        break;

      case 'delete':
        // Soft delete the task
        await deleteTask.mutateAsync(id);
        break;
    }
  };

  /**
   * Handle quick capture - creates a new inbox item
   */
  const handleQuickCapture = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;

    if (!title.trim()) {
      logger.warn('Quick capture: empty title');
      return;
    }

    logger.info('Quick capture', { title });

    await createTask.mutateAsync({
      title: title.trim(),
      status: 'inbox',
    });

    // Clear the input after successful capture
    e.currentTarget.reset();
    inputRef.current?.focus();
  };

  // Error state
  if (error) {
    logger.error('Failed to load inbox', { error });
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Inbox className="h-16 w-16 text-red-500" />}
              title="Failed to load inbox"
              description="There was an error loading your inbox items. Please try again."
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
      {/* Quick capture form */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleQuickCapture} className="flex gap-2">
            <Input
              ref={inputRef}
              name="title"
              placeholder="Capture something... (press Enter)"
              className="flex-1"
              disabled={createTask.isPending}
            />
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Header with count and process all button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="h-5 w-5 text-indigo-600" />
          <span className="text-sm text-neutral-600">
            {isLoading ? 'Loading...' : `${inboxItems.length} items to process`}
          </span>
        </div>
        {inboxItems.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            rightIcon={<ArrowRight className="h-4 w-4" />}
            onClick={() => logger.info('Process All clicked - feature coming soon')}
          >
            Process All
          </Button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && <InboxSkeleton />}

      {/* Inbox items or empty state */}
      {!isLoading && inboxItems.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Inbox className="h-16 w-16 text-green-500" />}
              title="Inbox Zero!"
              description="Everything's been processed. Nice work!"
              action={{
                label: 'Capture something',
                onClick: () => inputRef.current?.focus(),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        !isLoading && (
          <div className="space-y-3">
            {inboxItems.map((item) => (
              <InboxItem
                key={item.id}
                item={item}
                onProcess={handleProcess}
                isProcessing={isProcessing}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
