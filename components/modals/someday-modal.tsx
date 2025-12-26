'use client';

/**
 * ============================================================================
 * ✨ SomedayModal Component
 * ============================================================================
 *
 * A comprehensive modal for creating and editing someday items.
 * Someday items are dreams, wishes, and future possibilities - things to
 * consider "someday" but not committed to yet.
 *
 * Features:
 * - Create new someday items with full details
 * - Edit existing someday items
 * - Choose category (trip, purchase, experience, house, other)
 * - Set estimated cost
 * - Add description
 * - Keyboard shortcuts (Cmd+Enter to save)
 *
 * Usage:
 * ```tsx
 * // Create mode
 * <SomedayModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   initialTitle="Dream from inbox"
 * />
 *
 * // Edit mode
 * <SomedayModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   item={existingSomedayItem}
 * />
 * ```
 *
 * User Stories Addressed:
 * - US-7.1: Create Someday Item with details
 * - US-7.2: View and edit someday items
 * - US-2.3: Triage inbox item to someday (via inbox page)
 *
 * Data Flow:
 * 1. Modal opens with optional item data or initialTitle
 * 2. User selects category and fills form
 * 3. On save: creates/updates via hooks
 * 4. onSuccess callback fires (optional)
 * 5. Modal closes
 *
 * ============================================================================
 */

import * as React from 'react';
import { Sparkles, Plane, ShoppingBag, Lightbulb, Home, FileText, DollarSign } from 'lucide-react';
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
import {
  useCreateSomedayItem,
  useUpdateSomedayItem,
  type CreateSomedayInput,
} from '@/lib/hooks/use-someday';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils/cn';
import type { SomedayItem, SomedayCategory } from '@/types/database';

// ============================================================================
// Types
// ============================================================================

interface SomedayModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Existing item to edit (if provided, modal is in edit mode) */
  item?: SomedayItem | null;
  /** Initial title (for quick create) */
  initialTitle?: string;
  /** Initial category (defaults to 'other') */
  initialCategory?: SomedayCategory;
  /** Callback when item is saved successfully */
  onSuccess?: (item: SomedayItem) => void;
}

interface SomedayFormData {
  title: string;
  description: string;
  category: SomedayCategory;
  estimated_cost: string; // String for input handling, parsed to number
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Category configuration with icons and colors
 *
 * Categories help organize someday items:
 * - trip: Travel destinations and vacations
 * - purchase: Things to buy (big or small)
 * - experience: Events, activities, things to try
 * - house: Home improvements and projects
 * - other: Everything else
 */
const CATEGORY_CONFIG: Record<SomedayCategory, {
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}> = {
  trip: {
    label: 'Trip',
    icon: Plane,
    color: 'text-blue-600 border-blue-200 bg-blue-50',
    description: 'Travel & vacations',
  },
  purchase: {
    label: 'Purchase',
    icon: ShoppingBag,
    color: 'text-green-600 border-green-200 bg-green-50',
    description: 'Things to buy',
  },
  experience: {
    label: 'Experience',
    icon: Lightbulb,
    color: 'text-orange-600 border-orange-200 bg-orange-50',
    description: 'Activities to try',
  },
  house: {
    label: 'House',
    icon: Home,
    color: 'text-purple-600 border-purple-200 bg-purple-50',
    description: 'Home projects',
  },
  other: {
    label: 'Other',
    icon: Sparkles,
    color: 'text-amber-600 border-amber-200 bg-amber-50',
    description: 'Everything else',
  },
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get initial form data from item or defaults
 */
function getInitialFormData(
  item?: SomedayItem | null,
  initialTitle?: string,
  initialCategory?: SomedayCategory
): SomedayFormData {
  if (item) {
    return {
      title: item.title,
      description: item.description || '',
      category: item.category || 'other',
      estimated_cost: item.estimated_cost?.toString() || '',
    };
  }

  return {
    title: initialTitle || '',
    description: '',
    category: initialCategory || 'other',
    estimated_cost: '',
  };
}

// ============================================================================
// Component
// ============================================================================

/**
 * SomedayModal - Create or edit a someday item
 *
 * Someday items capture dreams and wishes without commitment.
 * They can later be promoted to projects when ready to execute.
 */
export function SomedayModal({
  open,
  onOpenChange,
  item,
  initialTitle,
  initialCategory,
  onSuccess,
}: SomedayModalProps) {
  const isEditMode = !!item;

  // Form state
  const [formData, setFormData] = React.useState<SomedayFormData>(() =>
    getInitialFormData(item, initialTitle, initialCategory)
  );

  // Mutations
  const createItem = useCreateSomedayItem();
  const updateItem = useUpdateSomedayItem();

  const isPending = createItem.isPending || updateItem.isPending;

  // Reset form when item changes or modal opens
  React.useEffect(() => {
    if (open) {
      logger.info('✨ SomedayModal opened', { isEditMode, itemId: item?.id });
      setFormData(getInitialFormData(item, initialTitle, initialCategory));
    }
  }, [open, item, initialTitle, initialCategory, isEditMode]);

  /**
   * Update a single form field
   */
  const updateField = <K extends keyof SomedayFormData>(
    field: K,
    value: SomedayFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      logger.warn('⚠️ Someday item title is required');
      return;
    }

    logger.info('💾 Saving someday item...', { isEditMode, title: formData.title });

    // Parse estimated cost (if provided)
    const estimatedCost = formData.estimated_cost
      ? parseFloat(formData.estimated_cost)
      : undefined;

    try {
      if (isEditMode && item) {
        // Update existing item
        const result = await updateItem.mutateAsync({
          id: item.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          category: formData.category,
          estimated_cost: estimatedCost ?? null,
        });
        logger.success('✅ Someday item updated!', { id: result.id });
        onSuccess?.(result);
      } else {
        // Create new item
        const input: CreateSomedayInput = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          category: formData.category,
          estimated_cost: estimatedCost,
        };
        const result = await createItem.mutateAsync(input);
        logger.success('✅ Someday item created!', { id: result.id });
        onSuccess?.(result);
      }

      // Close modal on success
      onOpenChange(false);
    } catch (error) {
      logger.error('❌ Failed to save someday item', { error });
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

  const CategoryIcon = CATEGORY_CONFIG[formData.category].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            {isEditMode ? 'Edit Dream' : 'Add Dream'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col flex-1 overflow-hidden">
          <DialogBody className="space-y-4 overflow-y-auto flex-1">
            {/* Title input */}
            <div>
              <label htmlFor="someday-title" className="sr-only">
                Dream title
              </label>
              <Input
                id="someday-title"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="What's your dream?"
                autoFocus
                className="text-lg font-medium"
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-2">
                <CategoryIcon className="h-4 w-4" />
                Category
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(CATEGORY_CONFIG) as SomedayCategory[]).map((cat) => {
                  const config = CATEGORY_CONFIG[cat];
                  const Icon = config.icon;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => updateField('category', cat)}
                      className={cn(
                        'flex flex-col items-center py-2.5 px-2 rounded-lg text-xs font-medium transition-colors',
                        'border',
                        formData.category === cat
                          ? config.color
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                      )}
                    >
                      <Icon className="h-5 w-5 mb-1" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                <FileText className="h-4 w-4" />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="What makes this dream special? Add links, notes, or details..."
                rows={3}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border border-neutral-300',
                  'text-sm resize-none',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                )}
              />
            </div>

            {/* Estimated cost */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                <DollarSign className="h-4 w-4" />
                Estimated cost (optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">$</span>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.estimated_cost}
                  onChange={(e) => updateField('estimated_cost', e.target.value)}
                  placeholder="0"
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Helps track the financial side of your dreams
              </p>
            </div>
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
              disabled={!formData.title.trim()}
            >
              {isEditMode ? 'Save Changes' : 'Add Dream'}
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

export type { SomedayModalProps };
