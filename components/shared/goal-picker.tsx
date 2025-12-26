'use client';

/**
 * ============================================================================
 * 🎯 GoalPicker Component
 * ============================================================================
 *
 * A dropdown component for selecting a goal.
 * Used throughout the app for:
 * - Linking tasks to goals
 * - Linking habits to goals
 * - Filtering by goal
 *
 * Features:
 * - Shows goal title and progress (for quantitative goals)
 * - Family vs individual goal indication
 * - "No goal" option when allowed
 * - Optional owner avatar
 *
 * Usage:
 * ```tsx
 * <GoalPicker
 *   value={goalId}
 *   onChange={setGoalId}
 *   placeholder="Link to goal..."
 * />
 * ```
 *
 * ============================================================================
 */

import * as React from 'react';
import { ChevronDown, Check, X, Target, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { ProgressBar } from '@/components/shared/progress-bar';
import { useActiveGoals } from '@/lib/hooks/use-goals';
import { Spinner } from '@/components/ui/spinner';
import type { Goal } from '@/types/database';

// ============================================================================
// Types
// ============================================================================

interface GoalPickerProps {
  /** Currently selected goal ID (null = no goal) */
  value: string | null;
  /** Callback when selection changes */
  onChange: (goalId: string | null) => void;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Allow selecting "No goal" */
  allowNone?: boolean;
  /** Only show family goals */
  familyGoalsOnly?: boolean;
  /** Only show personal goals (not family goals) */
  personalGoalsOnly?: boolean;
  /** Filter by owner ID */
  ownerId?: string;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Calculate goal progress percentage
 */
function getGoalProgress(goal: Goal): number | null {
  if (goal.goal_type !== 'quantitative' || !goal.target_value) {
    return null;
  }
  return Math.min(100, (goal.current_value / goal.target_value) * 100);
}

// ============================================================================
// Component
// ============================================================================

/**
 * GoalPicker - Select a goal from a dropdown
 */
export function GoalPicker({
  value,
  onChange,
  placeholder = 'Link to goal...',
  disabled = false,
  allowNone = true,
  familyGoalsOnly = false,
  personalGoalsOnly = false,
  ownerId,
  className,
}: GoalPickerProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Fetch active goals
  const { data: allGoals = [], isLoading } = useActiveGoals();

  // Filter goals based on props
  const goals = React.useMemo(() => {
    let filtered = allGoals;

    if (familyGoalsOnly) {
      filtered = filtered.filter((g) => g.is_family_goal);
    }
    if (personalGoalsOnly) {
      filtered = filtered.filter((g) => !g.is_family_goal);
    }
    if (ownerId) {
      filtered = filtered.filter((g) => g.owner_id === ownerId);
    }

    return filtered;
  }, [allGoals, familyGoalsOnly, personalGoalsOnly, ownerId]);

  // Find selected goal
  const selectedGoal = React.useMemo(() => {
    if (!value) return null;
    return allGoals.find((g) => g.id === value) || null;
  }, [allGoals, value]);

  // Close on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleSelect = (goalId: string | null) => {
    onChange(goalId);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          'flex items-center justify-between w-full',
          'h-10 px-3 rounded-lg border border-neutral-300',
          'bg-white text-sm text-left',
          'transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
          disabled && 'opacity-50 cursor-not-allowed bg-neutral-100',
          !disabled && 'hover:border-neutral-400 cursor-pointer',
          open && 'border-indigo-500 ring-2 ring-indigo-500'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-neutral-400">
            <Spinner size="sm" />
            <span>Loading...</span>
          </div>
        ) : selectedGoal ? (
          <div className="flex items-center gap-2 min-w-0">
            <Target className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-neutral-900 truncate">{selectedGoal.title}</span>
            {selectedGoal.is_family_goal && (
              <Users className="h-3 w-3 text-neutral-400 shrink-0" />
            )}
          </div>
        ) : (
          <span className="text-neutral-400">{placeholder}</span>
        )}

        <div className="flex items-center gap-1 shrink-0">
          {selectedGoal && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 hover:bg-neutral-100 rounded transition-colors"
            >
              <X className="h-3 w-3 text-neutral-400" />
            </span>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-neutral-400 transition-transform',
              open && 'transform rotate-180'
            )}
          />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            'absolute z-50 w-full mt-1',
            'bg-white border border-neutral-200 rounded-lg shadow-lg',
            'max-h-72 overflow-auto',
            'animate-in fade-in-0 zoom-in-95 duration-100'
          )}
          role="listbox"
        >
          {/* No goal option */}
          {allowNone && (
            <>
              <div
                role="option"
                aria-selected={value === null}
                onClick={() => handleSelect(null)}
                className={cn(
                  'flex items-center justify-between px-3 py-2 text-sm',
                  'cursor-pointer transition-colors',
                  value === null && 'bg-indigo-50 text-indigo-700',
                  value !== null && 'hover:bg-neutral-50'
                )}
              >
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-neutral-300" />
                  <span>No goal</span>
                </div>
                {value === null && <Check className="h-4 w-4 text-indigo-600" />}
              </div>
              <div className="h-px bg-neutral-200 my-1" />
            </>
          )}

          {/* Goals list */}
          {goals.map((goal) => (
            <GoalOption
              key={goal.id}
              goal={goal}
              isSelected={goal.id === value}
              onSelect={() => handleSelect(goal.id)}
            />
          ))}

          {/* Empty state */}
          {goals.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-neutral-500">
              <Target className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
              No goals available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// GoalOption Sub-component
// ============================================================================

interface GoalOptionProps {
  goal: Goal;
  isSelected: boolean;
  onSelect: () => void;
}

function GoalOption({ goal, isSelected, onSelect }: GoalOptionProps) {
  const progress = getGoalProgress(goal);

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={onSelect}
      className={cn(
        'px-3 py-2 text-sm',
        'cursor-pointer transition-colors',
        isSelected && 'bg-indigo-50',
        !isSelected && 'hover:bg-neutral-50'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Target className={cn(
            'h-4 w-4 shrink-0',
            isSelected ? 'text-indigo-600' : 'text-amber-500'
          )} />
          <span className={cn(
            'truncate',
            isSelected && 'text-indigo-700'
          )}>
            {goal.title}
          </span>
          <span title={goal.is_family_goal ? 'Family goal' : 'Personal goal'}>
            {goal.is_family_goal ? (
              <Users className="h-3 w-3 text-neutral-400 shrink-0" />
            ) : (
              <User className="h-3 w-3 text-neutral-400 shrink-0" />
            )}
          </span>
        </div>
        {isSelected && <Check className="h-4 w-4 text-indigo-600 shrink-0" />}
      </div>

      {/* Progress bar for quantitative goals */}
      {progress !== null && (
        <div className="mt-2 flex items-center gap-2">
          <ProgressBar value={progress} size="sm" className="flex-1" />
          <span className="text-xs text-neutral-500 shrink-0">
            {goal.current_value}/{goal.target_value} {goal.unit}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export type { GoalPickerProps };
