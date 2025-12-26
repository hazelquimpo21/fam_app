'use client';

/**
 * ============================================================================
 * 📥 Inbox Page
 * ============================================================================
 *
 * The inbox is a quick capture location for ideas, tasks, and thoughts that
 * need to be processed later. Users can capture anything here and then triage
 * it into the appropriate bucket.
 *
 * Route: /inbox
 *
 * Features:
 * - Quick capture input for brain dumps
 * - List of unprocessed items from database
 * - Full triage actions: Task, Goal, Habit, Project, Someday, Delete
 * - Modal integration for full entity details when triaging
 *
 * User Stories Addressed:
 * - US-2.1: Quick capture to inbox
 * - US-2.2: Triage inbox items to appropriate buckets
 * - US-3.1: Create task with full details (via TaskModal)
 * - US-4.1: Create habit from inbox (via HabitModal)
 * - US-5.1: Create goal from inbox (via GoalModal)
 *
 * Data Flow:
 * 1. User captures thought → Creates task with status='inbox'
 * 2. User clicks triage action → Opens appropriate modal
 * 3. Modal saves entity → onSuccess callback deletes original inbox item
 * 4. Query invalidation → UI updates automatically
 *
 * ============================================================================
 */

import { useState, useEffect, useRef } from 'react';
import {
  Inbox,
  Plus,
  ArrowRight,
  Trash2,
  FolderOpen,
  Sparkles,
  CheckSquare,
  Target,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import { TaskModal } from '@/components/modals/task-modal';
import { GoalModal } from '@/components/modals/goal-modal';
import { HabitModal } from '@/components/modals/habit-modal';
import { useInboxTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/lib/hooks/use-tasks';
import { useCreateSomedayItem } from '@/lib/hooks/use-someday';
import { useCreateProject } from '@/lib/hooks/use-projects';
import { logger } from '@/lib/utils/logger';
import type { Task } from '@/types/database';

// ============================================================================
// Types
// ============================================================================

/**
 * Available triage actions for inbox items
 * - task: Opens TaskModal for full task creation
 * - goal: Opens GoalModal for goal creation
 * - habit: Opens HabitModal for habit creation
 * - project: Quick convert to project
 * - someday: Quick convert to someday item
 * - delete: Soft delete the item
 */
type TriageAction = 'task' | 'goal' | 'habit' | 'project' | 'someday' | 'delete';

// ============================================================================
// InboxItem Component
// ============================================================================

interface InboxItemProps {
  item: Task;
  onTriageClick: (item: Task, action: TriageAction) => void;
  isProcessing: boolean;
}

/**
 * InboxItem - Displays a single inbox item with full triage actions
 *
 * Actions are organized by entity type:
 * - Primary actions (modal-based): Task, Goal, Habit
 * - Secondary actions (quick convert): Project, Someday
 * - Destructive action: Delete
 */
function InboxItem({ item, onTriageClick, isProcessing }: InboxItemProps) {
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

          {/* Processing actions - organized by entity type */}
          <div className="flex flex-wrap gap-2">
            {/* Task button - opens TaskModal */}
            <Button
              size="sm"
              variant="outline"
              leftIcon={<CheckSquare className="h-4 w-4" />}
              onClick={() => onTriageClick(item, 'task')}
              disabled={isProcessing}
            >
              Task
            </Button>
            {/* Goal button - opens GoalModal */}
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Target className="h-4 w-4 text-amber-500" />}
              onClick={() => onTriageClick(item, 'goal')}
              disabled={isProcessing}
            >
              Goal
            </Button>
            {/* Habit button - opens HabitModal */}
            <Button
              size="sm"
              variant="outline"
              leftIcon={<RefreshCw className="h-4 w-4 text-green-500" />}
              onClick={() => onTriageClick(item, 'habit')}
              disabled={isProcessing}
            >
              Habit
            </Button>
            {/* Project button - quick convert */}
            <Button
              size="sm"
              variant="outline"
              leftIcon={<FolderOpen className="h-4 w-4 text-blue-500" />}
              onClick={() => onTriageClick(item, 'project')}
              disabled={isProcessing}
            >
              Project
            </Button>
            {/* Someday button - quick convert */}
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Sparkles className="h-4 w-4 text-purple-500" />}
              onClick={() => onTriageClick(item, 'someday')}
              disabled={isProcessing}
            >
              Someday
            </Button>
            {/* Delete button */}
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => onTriageClick(item, 'delete')}
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

// ============================================================================
// InboxSkeleton Component
// ============================================================================

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

// ============================================================================
// InboxPage Component (Main Export)
// ============================================================================

/**
 * Inbox page with quick capture and full triage actions
 *
 * Supports triaging to: Task, Goal, Habit, Project, Someday, or Delete
 */
export default function InboxPage() {
  const inputRef = useRef<HTMLInputElement>(null);

  // Modal states - track which modal is open and which inbox item is being processed
  const [activeModal, setActiveModal] = useState<TriageAction | null>(null);
  const [selectedInboxItem, setSelectedInboxItem] = useState<Task | null>(null);

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
    logger.info('📥 Inbox page loaded', { itemCount: inboxItems.length, isLoading });
    logger.divider('Inbox');
  }, [inboxItems.length, isLoading]);

  /**
   * Handle clicking a triage action
   * For modal-based actions (task, goal, habit), opens the appropriate modal
   * For quick actions (project, someday, delete), processes immediately
   */
  const handleTriageClick = async (item: Task, action: TriageAction) => {
    logger.info('Triage action clicked', { id: item.id, action, title: item.title });

    // Modal-based actions: store item and open modal
    if (action === 'task' || action === 'goal' || action === 'habit') {
      setSelectedInboxItem(item);
      setActiveModal(action);
      return;
    }

    // Quick actions: process immediately
    switch (action) {
      case 'project':
        // Create a new project from this item, then delete the inbox item
        await createProject.mutateAsync({
          title: item.title,
          description: item.description || undefined,
          status: 'planning',
        });
        await deleteTask.mutateAsync(item.id);
        break;

      case 'someday':
        // Create a someday item from this, then delete the inbox item
        await createSomeday.mutateAsync({
          title: item.title,
          description: item.description || undefined,
          category: 'other',
        });
        await deleteTask.mutateAsync(item.id);
        break;

      case 'delete':
        // Soft delete the task
        await deleteTask.mutateAsync(item.id);
        break;
    }
  };

  /**
   * Handle modal close - reset state
   */
  const handleModalClose = (open: boolean) => {
    if (!open) {
      setActiveModal(null);
      setSelectedInboxItem(null);
    }
  };

  /**
   * Handle modal success - delete the original inbox item
   * This is called when a task/goal/habit is successfully created from the modal
   */
  const handleModalSuccess = async () => {
    if (selectedInboxItem) {
      logger.info('Entity created from inbox, deleting original', {
        id: selectedInboxItem.id,
        action: activeModal,
      });
      await deleteTask.mutateAsync(selectedInboxItem.id);
      setSelectedInboxItem(null);
      setActiveModal(null);
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
                onTriageClick={handleTriageClick}
                isProcessing={isProcessing}
              />
            ))}
          </div>
        )
      )}

      {/* ================================================================
          Modals for triage actions
          Each modal pre-fills the title from the inbox item and
          calls handleModalSuccess on completion to delete the original
          ================================================================ */}

      {/* TaskModal - for converting inbox item to task */}
      <TaskModal
        open={activeModal === 'task'}
        onOpenChange={handleModalClose}
        initialTitle={selectedInboxItem?.title}
        initialStatus="active"
        onSuccess={handleModalSuccess}
      />

      {/* GoalModal - for converting inbox item to goal */}
      <GoalModal
        open={activeModal === 'goal'}
        onOpenChange={handleModalClose}
        initialTitle={selectedInboxItem?.title}
        onSuccess={handleModalSuccess}
      />

      {/* HabitModal - for converting inbox item to habit */}
      <HabitModal
        open={activeModal === 'habit'}
        onOpenChange={handleModalClose}
        initialTitle={selectedInboxItem?.title}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
