'use client';

/**
 * ============================================================================
 * 🔄 HabitModal Component
 * ============================================================================
 *
 * A comprehensive modal for creating and editing habits.
 * Habits are recurring practices that users want to build and track.
 *
 * Features:
 * - Create new habits with frequency settings
 * - Edit existing habits
 * - Link habits to goals (supports goal achievement)
 * - Set frequency: daily, weekly, or custom days
 * - Assign owner
 * - Keyboard shortcuts (Cmd+Enter to save)
 *
 * Usage:
 * ```tsx
 * // Create mode
 * <HabitModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   initialTitle="Habit from inbox"
 * />
 *
 * // Edit mode
 * <HabitModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   habit={existingHabit}
 * />
 * ```
 *
 * User Stories Addressed:
 * - US-4.1: Create Habit with frequency
 * - US-2.3: Triage inbox item to habit
 * - US-5.1: Link habit to goal
 *
 * ============================================================================
 */

import * as React from 'react';
import { RefreshCw, Calendar, User, Target, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FamilyMemberPicker } from '@/components/shared/family-member-picker';
import { GoalPicker } from '@/components/shared/goal-picker';
import {
  useCreateHabit,
  useUpdateHabit,
  type CreateHabitInput,
  type UpdateHabitInput,
} from '@/lib/hooks/use-habits';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils/cn';
import type { Habit, HabitFrequency } from '@/types/database';

// ============================================================================
// Types
// ============================================================================

interface HabitModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Existing habit to edit (if provided, modal is in edit mode) */
  habit?: Habit | null;
  /** Initial title (for quick create from inbox) */
  initialTitle?: string;
  /** Callback when habit is saved successfully */
  onSuccess?: (habit: Habit) => void;
}

interface HabitFormData {
  title: string;
  description: string;
  frequency: HabitFrequency;
  target_days_per_week: number;
  days_of_week: number[]; // 0 = Sunday, 1 = Monday, etc.
  owner_id: string | null;
  goal_id: string | null;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Day names for the week picker
 */
const DAYS_OF_WEEK = [
  { value: 0, label: 'Su', fullLabel: 'Sunday' },
  { value: 1, label: 'Mo', fullLabel: 'Monday' },
  { value: 2, label: 'Tu', fullLabel: 'Tuesday' },
  { value: 3, label: 'We', fullLabel: 'Wednesday' },
  { value: 4, label: 'Th', fullLabel: 'Thursday' },
  { value: 5, label: 'Fr', fullLabel: 'Friday' },
  { value: 6, label: 'Sa', fullLabel: 'Saturday' },
];

/**
 * Frequency options with descriptions
 */
const FREQUENCY_OPTIONS = [
  { value: 'daily' as HabitFrequency, label: 'Daily', description: 'Every day' },
  { value: 'weekly' as HabitFrequency, label: 'Weekly', description: 'X times per week' },
  { value: 'custom' as HabitFrequency, label: 'Custom', description: 'Specific days' },
];

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get initial form data from habit or defaults
 */
function getInitialFormData(
  habit?: Habit | null,
  initialTitle?: string
): HabitFormData {
  if (habit) {
    return {
      title: habit.title,
      description: habit.description || '',
      frequency: habit.frequency || 'daily',
      target_days_per_week: habit.target_days_per_week || 3,
      days_of_week: habit.days_of_week || [],
      owner_id: habit.owner_id,
      goal_id: habit.goal_id,
    };
  }

  return {
    title: initialTitle || '',
    description: '',
    frequency: 'daily',
    target_days_per_week: 3,
    days_of_week: [1, 3, 5], // Mon, Wed, Fri default
    owner_id: null,
    goal_id: null,
  };
}

// ============================================================================
// Component
// ============================================================================

/**
 * HabitModal - Create or edit a habit
 */
export function HabitModal({
  open,
  onOpenChange,
  habit,
  initialTitle,
  onSuccess,
}: HabitModalProps) {
  const isEditMode = !!habit;

  // Form state
  const [formData, setFormData] = React.useState<HabitFormData>(() =>
    getInitialFormData(habit, initialTitle)
  );
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  // Mutations - use create for new habits, update for existing
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();

  const isPending = createHabit.isPending || updateHabit.isPending;

  // Reset form when habit changes or modal opens
  React.useEffect(() => {
    if (open) {
      setFormData(getInitialFormData(habit, initialTitle));
      // Show advanced if editing and has advanced fields set
      if (habit) {
        setShowAdvanced(!!habit.description || !!habit.goal_id);
      } else {
        setShowAdvanced(false);
      }
    }
  }, [open, habit, initialTitle]);

  /**
   * Update a single form field
   */
  const updateField = <K extends keyof HabitFormData>(
    field: K,
    value: HabitFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Toggle a day in the days_of_week array
   */
  const toggleDay = (day: number) => {
    setFormData((prev) => {
      const days = prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day].sort();
      return { ...prev, days_of_week: days };
    });
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      logger.warn('Habit title is required');
      return;
    }

    // Validate custom frequency has days selected
    if (formData.frequency === 'custom' && formData.days_of_week.length === 0) {
      logger.warn('Custom frequency requires at least one day selected');
      return;
    }

    logger.info('Saving habit...', { isEditMode, title: formData.title });

    try {
      let result: Habit;

      if (isEditMode && habit) {
        // Update existing habit
        const updateInput: UpdateHabitInput = {
          id: habit.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          frequency: formData.frequency,
          target_days_per_week: formData.frequency === 'weekly'
            ? formData.target_days_per_week
            : null,
          days_of_week: formData.frequency === 'custom'
            ? formData.days_of_week
            : null,
          owner_id: formData.owner_id,
          goal_id: formData.goal_id,
        };

        result = await updateHabit.mutateAsync(updateInput);
      } else {
        // Create new habit
        const createInput: CreateHabitInput = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          frequency: formData.frequency,
          target_days_per_week: formData.frequency === 'weekly'
            ? formData.target_days_per_week
            : undefined,
          days_of_week: formData.frequency === 'custom'
            ? formData.days_of_week
            : undefined,
          owner_id: formData.owner_id || undefined,
          goal_id: formData.goal_id || undefined,
        };

        result = await createHabit.mutateAsync(createInput);
      }

      onSuccess?.(result);

      // Close modal on success
      onOpenChange(false);
    } catch (error) {
      logger.error('Failed to save habit', { error });
      // Error is handled by the mutation hook (toast shown)
    }
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to save
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-green-500" />
            {isEditMode ? 'Edit Habit' : 'Create Habit'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col flex-1 overflow-hidden">
          <DialogBody className="space-y-4 overflow-y-auto flex-1">
            {/* Title input */}
            <div>
              <label htmlFor="habit-title" className="sr-only">
                Habit title
              </label>
              <Input
                id="habit-title"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="What habit do you want to build?"
                autoFocus
                className="text-lg font-medium"
              />
            </div>

            {/* Frequency selection */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-2">
                <Calendar className="h-4 w-4" />
                Frequency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {FREQUENCY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField('frequency', option.value)}
                    className={cn(
                      'flex flex-col items-center p-3 rounded-lg border text-sm transition-colors',
                      formData.frequency === option.value
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                    )}
                  >
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-neutral-500 mt-0.5">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly frequency: target days per week */}
            {formData.frequency === 'weekly' && (
              <div>
                <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                  Times per week
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => updateField('target_days_per_week', num)}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                        'border',
                        formData.target_days_per_week === num
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom frequency: day picker */}
            {formData.frequency === 'custom' && (
              <div>
                <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                  Which days?
                </label>
                <div className="flex gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      title={day.fullLabel}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                        'border',
                        formData.days_of_week.includes(day.value)
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                {formData.days_of_week.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    Select at least one day
                  </p>
                )}
              </div>
            )}

            {/* Owner */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                <User className="h-4 w-4" />
                Owner
              </label>
              <FamilyMemberPicker
                value={formData.owner_id}
                onChange={(id) => updateField('owner_id', id)}
                placeholder="Who is building this habit?"
              />
            </div>

            {/* Toggle advanced fields */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {showAdvanced ? 'Hide' : 'Show'} more options
            </button>

            {/* Advanced fields */}
            {showAdvanced && (
              <div className="space-y-4 pt-2 border-t border-neutral-200">
                {/* Description */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                    <FileText className="h-4 w-4" />
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Why is this habit important?"
                    rows={2}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border border-neutral-300',
                      'text-sm resize-none',
                      'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                    )}
                  />
                </div>

                {/* Goal link */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                    <Target className="h-4 w-4" />
                    Supports goal
                  </label>
                  <GoalPicker
                    value={formData.goal_id}
                    onChange={(id) => updateField('goal_id', id)}
                    placeholder="Link to a goal..."
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Connect this habit to a goal to track how your daily practices support your outcomes.
                  </p>
                </div>
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isPending}
              disabled={
                !formData.title.trim() ||
                (formData.frequency === 'custom' && formData.days_of_week.length === 0)
              }
            >
              {isEditMode ? 'Save Changes' : 'Create Habit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Exports
// ============================================================================

export type { HabitModalProps };
