'use client';

/**
 * ============================================================================
 * 🎯 GoalModal Component
 * ============================================================================
 *
 * A comprehensive modal for creating and editing goals.
 * Goals represent outcomes to work toward - either qualitative (done/not done)
 * or quantitative (measurable with target values).
 *
 * Features:
 * - Create new goals with full details
 * - Edit existing goals
 * - Choose between qualitative and quantitative goals
 * - Set target values and units for quantitative goals
 * - Assign owner or mark as family goal
 * - Set target date
 * - Keyboard shortcuts (Cmd+Enter to save)
 *
 * Usage:
 * ```tsx
 * // Create mode
 * <GoalModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   initialTitle="Goal from inbox"
 * />
 *
 * // Edit mode
 * <GoalModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   goal={existingGoal}
 * />
 * ```
 *
 * User Stories Addressed:
 * - US-5.1: Create Goal with details
 * - US-2.3: Triage inbox item to goal
 *
 * ============================================================================
 */

import * as React from 'react';
import { Target, Calendar, User, Users, Hash, FileText, Flag } from 'lucide-react';
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
import { useCreateGoal, useUpdateGoal, type CreateGoalInput } from '@/lib/hooks/use-goals';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils/cn';
import type { Goal, GoalType } from '@/types/database';

// ============================================================================
// Types
// ============================================================================

interface GoalModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Existing goal to edit (if provided, modal is in edit mode) */
  goal?: Goal | null;
  /** Initial title (for quick create from inbox) */
  initialTitle?: string;
  /** Callback when goal is saved successfully */
  onSuccess?: (goal: Goal) => void;
}

interface GoalFormData {
  title: string;
  description: string;
  definition_of_done: string;
  owner_id: string | null;
  is_family_goal: boolean;
  goal_type: GoalType;
  target_value: string; // String for input handling
  unit: string;
  target_date: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format date for input (YYYY-MM-DD)
 */
function formatDateForInput(dateStr: string | null): string {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
}

/**
 * Get initial form data from goal or defaults
 */
function getInitialFormData(
  goal?: Goal | null,
  initialTitle?: string
): GoalFormData {
  if (goal) {
    return {
      title: goal.title,
      description: goal.description || '',
      definition_of_done: goal.definition_of_done || '',
      owner_id: goal.owner_id,
      is_family_goal: goal.is_family_goal || false,
      goal_type: goal.goal_type || 'qualitative',
      target_value: goal.target_value?.toString() || '',
      unit: goal.unit || '',
      target_date: formatDateForInput(goal.target_date),
    };
  }

  return {
    title: initialTitle || '',
    description: '',
    definition_of_done: '',
    owner_id: null,
    is_family_goal: false,
    goal_type: 'qualitative',
    target_value: '',
    unit: '',
    target_date: '',
  };
}

// ============================================================================
// Component
// ============================================================================

/**
 * GoalModal - Create or edit a goal
 */
export function GoalModal({
  open,
  onOpenChange,
  goal,
  initialTitle,
  onSuccess,
}: GoalModalProps) {
  const isEditMode = !!goal;

  // Form state
  const [formData, setFormData] = React.useState<GoalFormData>(() =>
    getInitialFormData(goal, initialTitle)
  );
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  // Mutations
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();

  const isPending = createGoal.isPending || updateGoal.isPending;

  // Reset form when goal changes or modal opens
  React.useEffect(() => {
    if (open) {
      setFormData(getInitialFormData(goal, initialTitle));
      // Show advanced if editing and has advanced fields set
      if (goal) {
        setShowAdvanced(
          !!goal.definition_of_done ||
          !!goal.description
        );
      } else {
        setShowAdvanced(false);
      }
    }
  }, [open, goal, initialTitle]);

  /**
   * Update a single form field
   */
  const updateField = <K extends keyof GoalFormData>(
    field: K,
    value: GoalFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Handle family goal toggle - clear owner when setting as family goal
   */
  const handleFamilyGoalToggle = (isFamilyGoal: boolean) => {
    setFormData((prev) => ({
      ...prev,
      is_family_goal: isFamilyGoal,
      // Clear owner_id when it's a family goal
      owner_id: isFamilyGoal ? null : prev.owner_id,
    }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      logger.warn('Goal title is required');
      return;
    }

    // Validate quantitative goal has target
    if (formData.goal_type === 'quantitative') {
      if (!formData.target_value || parseFloat(formData.target_value) <= 0) {
        logger.warn('Quantitative goal requires a target value');
        return;
      }
    }

    logger.info('Saving goal...', { isEditMode, title: formData.title });

    try {
      if (isEditMode && goal) {
        // Update existing goal
        const result = await updateGoal.mutateAsync({
          id: goal.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          definition_of_done: formData.definition_of_done.trim() || null,
          owner_id: formData.is_family_goal ? null : formData.owner_id,
          is_family_goal: formData.is_family_goal,
          goal_type: formData.goal_type,
          target_value: formData.goal_type === 'quantitative'
            ? parseFloat(formData.target_value)
            : null,
          unit: formData.goal_type === 'quantitative'
            ? formData.unit.trim() || null
            : null,
          target_date: formData.target_date || null,
        });
        onSuccess?.(result);
      } else {
        // Create new goal
        const goalInput: CreateGoalInput = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          definition_of_done: formData.definition_of_done.trim() || undefined,
          owner_id: formData.is_family_goal ? undefined : formData.owner_id || undefined,
          is_family_goal: formData.is_family_goal,
          goal_type: formData.goal_type,
          target_value: formData.goal_type === 'quantitative'
            ? parseFloat(formData.target_value)
            : undefined,
          unit: formData.goal_type === 'quantitative'
            ? formData.unit.trim() || undefined
            : undefined,
          target_date: formData.target_date || undefined,
        };
        const result = await createGoal.mutateAsync(goalInput);
        onSuccess?.(result);
      }

      // Close modal on success
      onOpenChange(false);
    } catch (error) {
      logger.error('Failed to save goal', { error });
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
            <Target className="h-5 w-5 text-amber-500" />
            {isEditMode ? 'Edit Goal' : 'Create Goal'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col flex-1 overflow-hidden">
          <DialogBody className="space-y-4 overflow-y-auto flex-1">
            {/* Title input */}
            <div>
              <label htmlFor="goal-title" className="sr-only">
                Goal title
              </label>
              <Input
                id="goal-title"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="What do you want to achieve?"
                autoFocus
                className="text-lg font-medium"
              />
            </div>

            {/* Goal type selection */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-2">
                <Flag className="h-4 w-4" />
                Goal type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateField('goal_type', 'qualitative')}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-lg border text-sm transition-colors',
                    formData.goal_type === 'qualitative'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                  )}
                >
                  <span className="font-medium">Qualitative</span>
                  <span className="text-xs text-neutral-500 mt-0.5">Done or not done</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateField('goal_type', 'quantitative')}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-lg border text-sm transition-colors',
                    formData.goal_type === 'quantitative'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                  )}
                >
                  <span className="font-medium">Quantitative</span>
                  <span className="text-xs text-neutral-500 mt-0.5">Measurable target</span>
                </button>
              </div>
            </div>

            {/* Quantitative goal fields */}
            {formData.goal_type === 'quantitative' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                    <Hash className="h-4 w-4" />
                    Target
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.target_value}
                    onChange={(e) => updateField('target_value', e.target.value)}
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                    <FileText className="h-4 w-4" />
                    Unit
                  </label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => updateField('unit', e.target.value)}
                    placeholder="books, miles, dollars..."
                  />
                </div>
              </div>
            )}

            {/* Target date */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                <Calendar className="h-4 w-4" />
                Target date
              </label>
              <Input
                type="date"
                value={formData.target_date}
                onChange={(e) => updateField('target_date', e.target.value)}
              />
            </div>

            {/* Ownership toggle */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-2">
                <Users className="h-4 w-4" />
                Ownership
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleFamilyGoalToggle(false)}
                  className={cn(
                    'flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm transition-colors',
                    !formData.is_family_goal
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                  )}
                >
                  <User className="h-4 w-4" />
                  Personal
                </button>
                <button
                  type="button"
                  onClick={() => handleFamilyGoalToggle(true)}
                  className={cn(
                    'flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm transition-colors',
                    formData.is_family_goal
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                  )}
                >
                  <Users className="h-4 w-4" />
                  Family
                </button>
              </div>
            </div>

            {/* Owner picker (only for personal goals) */}
            {!formData.is_family_goal && (
              <div>
                <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                  <User className="h-4 w-4" />
                  Owner
                </label>
                <FamilyMemberPicker
                  value={formData.owner_id}
                  onChange={(id) => updateField('owner_id', id)}
                  placeholder="Who owns this goal?"
                />
              </div>
            )}

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
                    placeholder="Why is this goal important?"
                    rows={2}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border border-neutral-300',
                      'text-sm resize-none',
                      'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                    )}
                  />
                </div>

                {/* Definition of done */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                    <Target className="h-4 w-4" />
                    Definition of done
                  </label>
                  <textarea
                    value={formData.definition_of_done}
                    onChange={(e) => updateField('definition_of_done', e.target.value)}
                    placeholder="How will you know when this goal is complete?"
                    rows={2}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border border-neutral-300',
                      'text-sm resize-none',
                      'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                    )}
                  />
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
              disabled={!formData.title.trim() ||
                (formData.goal_type === 'quantitative' && !formData.target_value)}
            >
              {isEditMode ? 'Save Changes' : 'Create Goal'}
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

export type { GoalModalProps };
