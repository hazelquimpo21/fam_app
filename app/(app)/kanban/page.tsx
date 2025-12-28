'use client';

/**
 * ============================================================================
 * 📋 Kanban Page
 * ============================================================================
 *
 * A unified Kanban board view showing tasks and events organized into columns.
 * Users can:
 * - View by time (Overdue, Today, Tomorrow, This Week, Later)
 * - View by status (Inbox, Active, Waiting, Someday, Done)
 * - View by priority (High, Medium, Low, None)
 * - Filter by time scope (Week, Month, Quarter, Year)
 * - Toggle item types (Tasks, Events, Google Calendar, Birthdays)
 * - Drag items between columns to reschedule or change status
 * - Click items to edit in modals
 *
 * USER STORIES ADDRESSED:
 * - US-3.3: View tasks on a kanban board
 * - US-7.1: See unified view of tasks and events
 * - US-7.2: Drag to reschedule items
 *
 * ARCHITECTURE:
 * This page is primarily a thin wrapper around the KanbanBoard component.
 * All data fetching and state management is handled by the useKanban hook.
 * Editing is handled by TaskModal and EventModal.
 *
 * ============================================================================
 */

import * as React from 'react';
import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { KanbanBoard } from '@/components/kanban';
import { TaskModal } from '@/components/modals/task-modal';
import { EventModal } from '@/components/modals/event-modal';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/utils/logger';
import type { KanbanItem } from '@/types/kanban';
import type { Task } from '@/types/database';
import type { FamilyEvent } from '@/types/calendar';

// ============================================================================
// TYPES
// ============================================================================

type EditingItem =
  | { type: 'task'; task: Task }
  | { type: 'event'; event: FamilyEvent }
  | null;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * KanbanPage - Unified Kanban board for tasks and events.
 *
 * Provides a visual board interface for managing tasks and viewing events.
 * Integrates with existing modals for editing.
 */
export default function KanbanPage() {
  // ============================================================================
  // STATE
  // ============================================================================

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EditingItem>(null);

  // For new items, track which column they're being added to
  const [newItemColumnId, setNewItemColumnId] = useState<string | null>(null);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Handle card click - opens appropriate edit modal.
   */
  const handleCardClick = useCallback((item: KanbanItem) => {
    logger.info('📋 Kanban: Card clicked', { itemId: item.id, type: item.type });

    if (item.type === 'task') {
      setEditingItem({ type: 'task', task: item._source as Task });
      setIsTaskModalOpen(true);
    } else if (item.type === 'event') {
      setEditingItem({ type: 'event', event: item._source as FamilyEvent });
      setIsEventModalOpen(true);
    }
    // External events and birthdays are read-only, no click action
  }, []);

  /**
   * Handle add button click in a column.
   * Opens task modal with appropriate defaults based on column.
   */
  const handleAddClick = useCallback((columnId: string) => {
    logger.info('📋 Kanban: Add clicked', { columnId });
    setNewItemColumnId(columnId);
    setEditingItem(null); // Create mode
    setIsTaskModalOpen(true);
  }, []);

  /**
   * Get initial status for new task based on column.
   */
  const getInitialStatus = useCallback(() => {
    if (!newItemColumnId) return 'active';

    // Map column IDs to task statuses
    const statusMap: Record<string, 'inbox' | 'active' | 'waiting_for' | 'someday' | 'done'> = {
      inbox: 'inbox',
      active: 'active',
      waiting_for: 'waiting_for',
      someday: 'someday',
      done: 'done',
      // Time columns default to active
      overdue: 'active',
      today: 'active',
      tomorrow: 'active',
      'this-week': 'active',
      later: 'active',
      // Priority columns default to active
      high: 'active',
      medium: 'active',
      low: 'active',
      none: 'active',
    };

    return statusMap[newItemColumnId] || 'active';
  }, [newItemColumnId]);

  /**
   * Close task modal and reset state.
   */
  const handleTaskModalClose = useCallback((open: boolean) => {
    setIsTaskModalOpen(open);
    if (!open) {
      setEditingItem(null);
      setNewItemColumnId(null);
    }
  }, []);

  /**
   * Close event modal and reset state.
   */
  const handleEventModalClose = useCallback((open: boolean) => {
    setIsEventModalOpen(open);
    if (!open) {
      setEditingItem(null);
    }
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Kanban Board</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Drag tasks to reorganize. Click to edit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick add task button */}
          <Button
            onClick={() => {
              setEditingItem(null);
              setNewItemColumnId(null);
              setIsTaskModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </Button>

          {/* Quick add event button */}
          <Button
            variant="outline"
            onClick={() => {
              setEditingItem(null);
              setIsEventModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden bg-neutral-100">
        <KanbanBoard
          defaultGroupBy="time"
          defaultTimeScope="week"
          onCardClick={handleCardClick}
          onAddClick={handleAddClick}
        />
      </div>

      {/* Task Modal */}
      <TaskModal
        open={isTaskModalOpen}
        onOpenChange={handleTaskModalClose}
        task={editingItem?.type === 'task' ? editingItem.task : null}
        initialStatus={getInitialStatus()}
      />

      {/* Event Modal */}
      <EventModal
        open={isEventModalOpen}
        onOpenChange={handleEventModalClose}
        event={editingItem?.type === 'event' ? editingItem.event : null}
      />
    </div>
  );
}
