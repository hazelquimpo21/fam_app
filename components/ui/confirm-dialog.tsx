/**
 * ============================================================================
 * ⚠️ ConfirmDialog Component
 * ============================================================================
 *
 * A reusable confirmation dialog for destructive or important actions.
 * Provides clear messaging and requires explicit user confirmation.
 *
 * USE CASES:
 * - Delete confirmation (contacts, tasks, projects, etc.)
 * - Discard unsaved changes
 * - Irreversible actions
 *
 * DESIGN PRINCIPLES:
 * - Clear, descriptive title and message
 * - Destructive actions use red styling
 * - Cancel is always available and easy to hit
 * - Supports keyboard navigation (ESC to cancel)
 *
 * USAGE:
 * ```tsx
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete Contact"
 *   description="Are you sure you want to delete John Smith? This cannot be undone."
 *   confirmLabel="Delete"
 *   variant="destructive"
 *   onConfirm={() => deleteContact(id)}
 * />
 * ```
 *
 * ACCESSIBILITY:
 * - Uses Dialog component with proper ARIA roles
 * - Focus trapped within dialog
 * - ESC key closes dialog
 * - Confirm button is not auto-focused (prevents accidental confirm)
 *
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { AlertTriangle, Trash2, AlertCircle, HelpCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// 📦 TYPES
// ============================================================================

/**
 * Visual variant for the dialog.
 * Affects icon color and confirm button styling.
 */
export type ConfirmDialogVariant = 'default' | 'destructive' | 'warning' | 'info';

/**
 * Props for the ConfirmDialog component.
 */
export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title (required for clarity) */
  title: string;
  /** Detailed description of what will happen */
  description: string;
  /** Label for the confirm button (default: "Confirm") */
  confirmLabel?: string;
  /** Label for the cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Visual variant (affects colors) */
  variant?: ConfirmDialogVariant;
  /** Callback when user confirms */
  onConfirm: () => void | Promise<void>;
  /** Whether the confirm action is in progress (shows loading state) */
  isLoading?: boolean;
  /** Custom icon to display (optional, default based on variant) */
  icon?: React.ReactNode;
}

// ============================================================================
// 🎨 VARIANT CONFIGURATION
// ============================================================================

/**
 * Configuration for each dialog variant.
 * Defines icon, colors, and button styling.
 */
const VARIANT_CONFIG: Record<
  ConfirmDialogVariant,
  {
    icon: typeof AlertTriangle;
    iconClassName: string;
    bgClassName: string;
    confirmButtonVariant: 'default' | 'destructive' | 'secondary';
  }
> = {
  default: {
    icon: HelpCircle,
    iconClassName: 'text-indigo-500',
    bgClassName: 'bg-indigo-50',
    confirmButtonVariant: 'default',
  },
  destructive: {
    icon: Trash2,
    iconClassName: 'text-red-500',
    bgClassName: 'bg-red-50',
    confirmButtonVariant: 'destructive',
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: 'text-amber-500',
    bgClassName: 'bg-amber-50',
    confirmButtonVariant: 'default',
  },
  info: {
    icon: AlertCircle,
    iconClassName: 'text-blue-500',
    bgClassName: 'bg-blue-50',
    confirmButtonVariant: 'default',
  },
};

// ============================================================================
// 📄 COMPONENT
// ============================================================================

/**
 * ConfirmDialog
 *
 * A modal dialog that requires user confirmation before proceeding.
 * Commonly used for delete operations and other destructive actions.
 *
 * @example
 * // Delete confirmation
 * <ConfirmDialog
 *   open={showDeleteConfirm}
 *   onOpenChange={setShowDeleteConfirm}
 *   title="Delete Contact"
 *   description={`Are you sure you want to delete ${contact.name}?`}
 *   confirmLabel="Delete"
 *   variant="destructive"
 *   onConfirm={handleDelete}
 *   isLoading={isDeleting}
 * />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  isLoading = false,
  icon,
}: ConfirmDialogProps) {
  // Get variant configuration
  const config = VARIANT_CONFIG[variant];
  const IconComponent = config.icon;

  /**
   * Handle confirm button click.
   * Supports async onConfirm handlers.
   */
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Error handling is done by the caller
      // Keep dialog open on error
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {/* Icon with background circle */}
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                config.bgClassName
              )}
            >
              {icon || <IconComponent className={cn('h-5 w-5', config.iconClassName)} />}
            </div>
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>

        <DialogBody>
          <p className="text-sm text-neutral-600 leading-relaxed pl-[52px]">
            {description}
          </p>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={config.confirmButtonVariant}
            onClick={handleConfirm}
            loading={isLoading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// 🪝 HOOK FOR EASIER USAGE
// ============================================================================

/**
 * State for managing a confirm dialog.
 */
export interface UseConfirmDialogState<T = void> {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Data associated with the current confirmation (e.g., item to delete) */
  data: T | null;
  /** Open the dialog with optional data */
  open: (data?: T) => void;
  /** Close the dialog */
  close: () => void;
  /** Set open state directly */
  setOpen: (open: boolean) => void;
}

/**
 * Hook for managing confirm dialog state.
 *
 * Makes it easy to track what item is being confirmed for deletion, etc.
 *
 * @example
 * const deleteConfirm = useConfirmDialog<Contact>();
 *
 * // When user clicks delete
 * deleteConfirm.open(contact);
 *
 * // In the dialog
 * <ConfirmDialog
 *   open={deleteConfirm.isOpen}
 *   onOpenChange={deleteConfirm.setOpen}
 *   title={`Delete ${deleteConfirm.data?.name}?`}
 *   onConfirm={() => deleteContact(deleteConfirm.data!.id)}
 * />
 */
export function useConfirmDialog<T = void>(): UseConfirmDialogState<T> {
  const [isOpen, setIsOpen] = React.useState(false);
  const [data, setData] = React.useState<T | null>(null);

  const open = React.useCallback((newData?: T) => {
    setData(newData ?? null);
    setIsOpen(true);
  }, []);

  const close = React.useCallback(() => {
    setIsOpen(false);
    // Clear data after a short delay (allows exit animation)
    setTimeout(() => setData(null), 200);
  }, []);

  const setOpen = React.useCallback((open: boolean) => {
    if (!open) {
      close();
    } else {
      setIsOpen(true);
    }
  }, [close]);

  return { isOpen, data, open, close, setOpen };
}

// ============================================================================
// 📤 EXPORTS
// ============================================================================

export type { ConfirmDialogVariant, ConfirmDialogProps };
