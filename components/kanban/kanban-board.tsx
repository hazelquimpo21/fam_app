'use client';

/**
 * ============================================================================
 * 📋 KanbanBoard Component
 * ============================================================================
 *
 * The main Kanban board component that orchestrates columns, cards, and
 * drag-drop interactions. This is the primary entry point for the Kanban UI.
 *
 * FEATURES:
 * - Multiple groupBy modes (time, status, priority, tag)
 * - Multiple timeScope options (week, month, quarter, year)
 * - Touch-friendly drag and drop with @dnd-kit
 * - Visual feedback with drag overlay and position indicators
 * - Filter controls
 * - Responsive horizontal scroll
 *
 * ARCHITECTURE:
 * ```
 * KanbanBoard
 *   └── DndContext (drag-drop provider)
 *       ├── KanbanControls (groupBy, timeScope, filters)
 *       ├── Columns container (horizontal scroll)
 *       │   ├── KanbanColumn (with SortableContext)
 *       │   │   └── KanbanSortableCard[]
 *       │   └── ... more columns
 *       └── DragOverlay (visual feedback during drag)
 * ```
 *
 * USAGE:
 * ```tsx
 * <KanbanBoard
 *   defaultGroupBy="time"
 *   defaultTimeScope="week"
 *   onCardClick={(item) => openEditModal(item)}
 * />
 * ```
 *
 * FUTURE AI DEVELOPERS:
 * - DndContext wraps everything and provides drag-drop state
 * - useKanbanDnd hook configures sensors and handles events
 * - DragOverlay renders the visual "ghost" during drag
 * - To add new groupBy modes, update types/kanban.ts and use-kanban.ts
 *
 * ============================================================================
 */

import * as React from 'react';
import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  closestCorners,
  pointerWithin,
  rectIntersection,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  CalendarDays,
  ListTodo,
  Flag,
  Tag,
  ChevronDown,
  RefreshCw,
  Filter,
  Eye,
  EyeOff,
  Smartphone,
} from 'lucide-react';

import { KanbanColumn } from './kanban-column';
import { KanbanDragOverlay } from './kanban-drag-overlay';
import { useKanban } from '@/lib/hooks/use-kanban';
import { useKanbanDnd } from '@/lib/hooks/use-kanban-dnd';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';
import { format } from 'date-fns';
import type {
  KanbanConfig,
  KanbanGroupBy,
  KanbanTimeScope,
  KanbanItem,
  KanbanFilters,
  KanbanItemType,
} from '@/types/kanban';

// ============================================================================
// TYPES
// ============================================================================

interface KanbanBoardProps {
  /** Default groupBy mode */
  defaultGroupBy?: KanbanGroupBy;

  /** Default time scope */
  defaultTimeScope?: KanbanTimeScope;

  /** Default filters */
  defaultFilters?: KanbanFilters;

  /** Handler when a card is clicked (opens edit modal) */
  onCardClick?: (item: KanbanItem) => void;

  /** Handler when add button is clicked in a column */
  onAddClick?: (columnId: string) => void;

  /** Compact card mode */
  compact?: boolean;

  /** Custom class name */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * GroupBy mode options with icons and labels.
 * Each mode creates different column groupings.
 *
 * NOTE (for future AI developers):
 * Time-based grouping has TWO past columns:
 * - "Past" = Events/birthdays that already happened (neutral)
 * - "Overdue" = Tasks with past due dates (urgent)
 * This distinction matters for UX - past events aren't failures.
 */
const GROUP_BY_OPTIONS: {
  value: KanbanGroupBy;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: 'time',
    label: 'By Time',
    icon: <CalendarDays className="w-4 h-4" />,
    description: 'Past, Overdue, Today, This Week, Later',
  },
  {
    value: 'status',
    label: 'By Status',
    icon: <ListTodo className="w-4 h-4" />,
    description: 'Inbox, Active, Waiting, Done',
  },
  {
    value: 'priority',
    label: 'By Priority',
    icon: <Flag className="w-4 h-4" />,
    description: 'High, Medium, Low, None',
  },
  {
    value: 'tag',
    label: 'By Tag',
    icon: <Tag className="w-4 h-4" />,
    description: 'Group by custom tags',
  },
];

/**
 * Time scope options with labels.
 */
const TIME_SCOPE_OPTIONS: {
  value: KanbanTimeScope;
  label: string;
  shortLabel: string;
}[] = [
  { value: 'week', label: 'This Week', shortLabel: 'Week' },
  { value: 'month', label: 'This Month', shortLabel: 'Month' },
  { value: 'quarter', label: 'This Quarter', shortLabel: 'Quarter' },
  { value: 'year', label: 'This Year', shortLabel: 'Year' },
];

/**
 * Item type filter options.
 */
const ITEM_TYPE_OPTIONS: {
  value: KanbanItemType;
  label: string;
  emoji: string;
}[] = [
  { value: 'task', label: 'Tasks', emoji: '✅' },
  { value: 'event', label: 'Events', emoji: '📅' },
  { value: 'external', label: 'Google Calendar', emoji: '🔗' },
  { value: 'birthday', label: 'Birthdays', emoji: '🎂' },
];

/**
 * Collision detection strategy for @dnd-kit.
 * Uses a combination of pointer within and closest corners
 * for accurate drop detection.
 */
const collisionDetectionStrategy = closestCorners;

/**
 * Measuring configuration for accurate drop zone detection.
 */
const measuringConfig = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * GroupBy selector dropdown.
 */
function GroupBySelector({
  value,
  onChange,
}: {
  value: KanbanGroupBy;
  onChange: (value: KanbanGroupBy) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const current = GROUP_BY_OPTIONS.find((o) => o.value === value)!;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors',
          'hover:bg-neutral-50 bg-white',
          isOpen && 'ring-2 ring-blue-400'
        )}
      >
        {current.icon}
        <span className="font-medium text-sm">{current.label}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-neutral-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-lg shadow-lg border p-1 min-w-[200px]">
            {GROUP_BY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-start gap-3 px-3 py-2 rounded-md text-left transition-colors',
                  option.value === value
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-neutral-50'
                )}
              >
                <div className="shrink-0 mt-0.5">{option.icon}</div>
                <div>
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-neutral-500">
                    {option.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Time scope selector tabs.
 */
function TimeScopeSelector({
  value,
  onChange,
}: {
  value: KanbanTimeScope;
  onChange: (value: KanbanTimeScope) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
      {TIME_SCOPE_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            option.value === value
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          )}
        >
          {option.shortLabel}
        </button>
      ))}
    </div>
  );
}

/**
 * Item type filter toggles.
 */
function ItemTypeFilters({
  value,
  onChange,
}: {
  value: KanbanItemType[];
  onChange: (value: KanbanItemType[]) => void;
}) {
  const toggle = (type: KanbanItemType) => {
    if (value.includes(type)) {
      // Don't allow removing all types
      if (value.length === 1) return;
      onChange(value.filter((t) => t !== type));
    } else {
      onChange([...value, type]);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-neutral-400" />
      <div className="flex items-center gap-1">
        {ITEM_TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => toggle(option.value)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors',
              value.includes(option.value)
                ? 'bg-blue-100 text-blue-700'
                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
            )}
            title={option.label}
          >
            <span>{option.emoji}</span>
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Show/hide completed toggle.
 */
function CompletedToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
        value
          ? 'bg-green-100 text-green-700'
          : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
      )}
    >
      {value ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      <span className="hidden sm:inline">
        {value ? 'Showing Done' : 'Hiding Done'}
      </span>
    </button>
  );
}

/**
 * Touch mode indicator.
 * Shows when touch/mobile support is active.
 */
function TouchModeIndicator({ isDragging }: { isDragging: boolean }) {
  if (!isDragging) return null;

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
      <Smartphone className="w-3 h-3" />
      <span>Touch mode</span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * KanbanBoard - Main Kanban board component.
 *
 * Orchestrates the board layout, controls, and data fetching.
 * Uses the useKanban hook for data and useKanbanDnd for drag-drop.
 */
export function KanbanBoard({
  defaultGroupBy = 'time',
  defaultTimeScope = 'week',
  defaultFilters = {},
  onCardClick,
  onAddClick,
  compact = false,
  className,
}: KanbanBoardProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [groupBy, setGroupBy] = useState<KanbanGroupBy>(defaultGroupBy);
  const [timeScope, setTimeScope] = useState<KanbanTimeScope>(defaultTimeScope);
  const [includeTypes, setIncludeTypes] = useState<KanbanItemType[]>(
    defaultFilters.includeTypes || ['task', 'event', 'external', 'birthday']
  );
  const [showCompleted, setShowCompleted] = useState(
    defaultFilters.showCompleted ?? false
  );

  // Build config for the hook
  const config: KanbanConfig = {
    groupBy,
    timeScope,
    filters: {
      ...defaultFilters,
      includeTypes,
      showCompleted,
    },
  };

  // ============================================================================
  // DATA
  // ============================================================================

  const {
    columns,
    isLoading,
    error,
    refetch,
    moveItem,
    isMoving,
    completeTask,
    dateRange,
  } = useKanban(config);

  // ============================================================================
  // DRAG AND DROP
  // ============================================================================

  /**
   * useKanbanDnd hook provides:
   * - sensors: Multi-input sensors (mouse, touch, keyboard)
   * - activeItem: Currently dragged item for DragOverlay
   * - handlers: DragStart, DragOver, DragEnd, DragCancel
   */
  const {
    sensors,
    activeItem,
    overColumnId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useKanbanDnd({
    columns,
    onMoveItem: moveItem,
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleTaskComplete = useCallback(
    (taskId: string) => {
      logger.info('✅ Board: Completing task', { taskId });
      completeTask(taskId);
    },
    [completeTask]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      measuring={measuringConfig}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={cn('flex flex-col h-full', className)}>
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-white border-b">
          {/* Left: GroupBy and TimeScope */}
          <div className="flex items-center gap-3">
            <GroupBySelector value={groupBy} onChange={setGroupBy} />
            <TimeScopeSelector value={timeScope} onChange={setTimeScope} />
            <TouchModeIndicator isDragging={!!activeItem} />
          </div>

          {/* Right: Filters and Actions */}
          <div className="flex items-center gap-3">
            <ItemTypeFilters value={includeTypes} onChange={setIncludeTypes} />
            <CompletedToggle value={showCompleted} onChange={setShowCompleted} />

            {/* Refresh button */}
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className={cn(
                'p-2 rounded-md text-neutral-500 hover:bg-neutral-100 transition-colors',
                isLoading && 'animate-spin'
              )}
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date range indicator */}
        <div className="px-4 py-2 bg-neutral-50 border-b text-sm text-neutral-500">
          Showing:{' '}
          <span className="font-medium text-neutral-700">
            {format(dateRange.start, 'MMM d')} – {format(dateRange.end, 'MMM d, yyyy')}
          </span>
          {isLoading && (
            <span className="ml-2 text-blue-500">Loading...</span>
          )}
          {isMoving && (
            <span className="ml-2 text-amber-500">Moving...</span>
          )}
          {activeItem && (
            <span className="ml-2 text-blue-500">
              Dragging: {activeItem.title.slice(0, 20)}...
            </span>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm">
            Failed to load board data. Please try refreshing.
          </div>
        )}

        {/* Columns container */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 p-4 h-full min-w-max">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onCardClick={onCardClick}
                onTaskComplete={handleTaskComplete}
                onAddClick={
                  onAddClick ? () => onAddClick(column.id) : undefined
                }
                isOver={overColumnId === column.id}
                isLoading={isLoading}
                compact={compact}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Drag Overlay - Visual feedback during drag */}
      <DragOverlay dropAnimation={{
        duration: 200,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeItem && (
          <KanbanDragOverlay item={activeItem} compact={compact} />
        )}
      </DragOverlay>
    </DndContext>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { KanbanBoardProps };
