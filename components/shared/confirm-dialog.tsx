'use client';

/**
 * ============================================================================
 * ⚠️ ConfirmDialog Component
 * ============================================================================
 *
 * A reusable confirmation dialog for destructive or important actions.
 * Use this whenever you need the user to confirm before proceeding.
 *
 * COMMON USE CASES:
 * - Delete confirmation (contacts, tasks, projects, etc.)
 * - Destructive actions (leave family, remove member)
 * - Important state changes (archive, complete, abandon goal)
 *
 * DESIGN PRINCIPLES:
 * - Clear, honest language about what will happen
 * - Visual distinction for destructive actions (red styling)
 * - Easy to cancel (prominent cancel button, backdrop click, ESC key)
 * - Loading state for async confirmations
 *
 * USER STORIES ADDRESSED:
 * - "As a user, I want to confirm before deleting so I don't lose data"
 * - "As a user, I want clear feedback about what action I'm confirming"
 *
 * RELATED FILES:
 * - components/ui/dialog.tsx - Base dialog component
 * - components/ui/button.tsx - Button component
 *
 * @example
 * // Basic delete confirmation
 * <ConfirmDialog
 *   open={showConfirm}
 *   onOpenChange={setShowConfirm}
 *   onConfirm={handleDelete}
 *   title="Delete contact?"
 *   description="This will remove the contact permanently."
 *   variant="destructive"
 * />
 *
 * @example
 * // With async confirmation
 * <ConfirmDialog
 *   open={showConfirm}
 *   onOpenChange={setShowConfirm}
 *   onConfirm={async () => {
 *     await deleteItem();
 *     setShowConfirm(false);
 *   }}
 *   title="Remove item?"
 *   confirmLabel="Remove"
 *   loading={isDeleting}
 * />
 *
 * ============================================================================
 */

import * as React from 'react';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// 📦 TYPES
// ============================================================================

/**
 * Props for the ConfirmDialog component.
 *
 * IMPORTANT FOR AI DEVS:
 * - `variant` controls the visual style and icon
 * - `onConfirm` can be sync or async - the dialog handles loading state
 * - Always provide clear `title` and `description` for user understanding
 */
interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes (e.g., user closes dialog) */
  onOpenChange: (open: boolean) => void;
  /** Callback when user confirms the action */
  onConfirm: () => void | Promise<void>;
  /** Dialog title - be clear about what action is being confirmed */
  title: string;
  /** Optional description - provide additional context about the consequences */
  description?: string;
  /** Label for the confirm button (default: "Confirm") */
  confirmLabel?: string;
  /** Label for the cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Visual variant - use "destructive" for delete actions */
  variant?: 'default' | 'destructive';
  /** Whether the confirmation is in progress (shows loading state) */
  loading?: boolean;
  /** Custom icon to display (defaults based on variant) */
  icon?: React.ReactNode;
}

// ============================================================================
// 🎨 VARIANT CONFIGURATION
// ============================================================================

/**
 * Styling configuration for each variant.
 *
 * WHY TWO VARIANTS:
 * - default: For neutral confirmations (archive, complete, etc.)
 * - destructive: For actions that delete or remove data (red styling)
 */
const VARIANT_CONFIG = {
  default: {
    icon: Info,
    iconClassName: 'text-indigo-500 bg-indigo-100',
    buttonVariant: 'default' as const,
  },
  destructive: {
    icon: Trash2,
    iconClassName: 'text-red-500 bg-red-100',
    buttonVariant: 'destructive' as const,
  },
};

// ============================================================================
// 📄 MAIN COMPONENT
// ============================================================================

/**
 * ConfirmDialog
 *
 * A specialized dialog for confirming user actions before proceeding.
 * Provides consistent UX for all confirmation flows across the app.
 *
 * BEHAVIOR:
 * - Opens centered on screen with backdrop
 * - Cancel is always available (ESC, backdrop click, Cancel button)
 * - Confirm button shows loading state during async operations
 * - Destructive variant uses red styling to indicate danger
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  icon,
}: ConfirmDialogProps) {
  // Track internal loading state for async onConfirm
  const [isConfirming, setIsConfirming] = React.useState(false);

  // Get variant-specific styling
  const config = VARIANT_CONFIG[variant];
  const IconComponent = config.icon;

  // Combined loading state (external + internal)
  const showLoading = loading || isConfirming;

  /**
   * Handle confirm button click.
   * Wraps onConfirm to handle async operations with loading state.
   */
  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  /**
   * Handle cancel - just close the dialog.
   * Disabled during loading to prevent closing mid-operation.
   */
  const handleCancel = () => {
    if (!showLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={showLoading ? () => {} : onOpenChange}>
      <DialogContent size="sm" showClose={false}>
        <DialogBody className="pt-6 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div
              className={cn(
                'h-12 w-12 rounded-full flex items-center justify-center',
                config.iconClassName
              )}
            >
              {icon || <IconComponent className="h-6 w-6" />}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-sm text-neutral-600 mb-4">{description}</p>
          )}
        </DialogBody>

        {/* Actions */}
        <DialogFooter className="bg-white rounded-b-2xl justify-center gap-3 py-5">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={showLoading}
            className="min-w-[100px]"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={config.buttonVariant}
            onClick={handleConfirm}
            loading={showLoading}
            disabled={showLoading}
            className="min-w-[100px]"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// 📤 EXPORTS
// ============================================================================

export type { ConfirmDialogProps };
