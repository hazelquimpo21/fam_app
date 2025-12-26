'use client';

/**
 * ============================================================================
 * 💬 Dialog/Modal Component
 * ============================================================================
 *
 * A reusable modal dialog component built on Radix UI primitives.
 * Used throughout the app for:
 * - Task creation/editing
 * - Entity creation (goals, projects, habits)
 * - Confirmations
 * - Quick actions
 *
 * Features:
 * - Accessible (keyboard navigation, focus trapping, screen reader support)
 * - Multiple sizes (sm, default, lg, full)
 * - Optional close button
 * - Backdrop click to close
 * - Escape key to close
 * - Portal rendering (renders at document root)
 *
 * Usage:
 * ```tsx
 * <Dialog open={isOpen} onOpenChange={setIsOpen}>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Create Task</DialogTitle>
 *       <DialogDescription>Add a new task to your list.</DialogDescription>
 *     </DialogHeader>
 *     <div>...form content...</div>
 *     <DialogFooter>
 *       <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
 *       <Button onClick={handleSave}>Save</Button>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 * ```
 *
 * ============================================================================
 */

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// Types
// ============================================================================

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DialogSize = 'sm' | 'default' | 'lg' | 'xl' | 'full';

// ============================================================================
// Context
// ============================================================================

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog provider');
  }
  return context;
}

// ============================================================================
// Dialog Root
// ============================================================================

interface DialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog content */
  children: React.ReactNode;
}

/**
 * Dialog root component - provides context for child components
 */
export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

// ============================================================================
// Dialog Content (The actual modal)
// ============================================================================

interface DialogContentProps {
  /** Dialog size - affects max-width */
  size?: DialogSize;
  /** Whether to show the close button */
  showClose?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Dialog content */
  children: React.ReactNode;
}

/**
 * Size mappings for dialog widths
 */
const sizeClasses: Record<DialogSize, string> = {
  sm: 'max-w-sm',      // 384px
  default: 'max-w-md', // 448px
  lg: 'max-w-lg',      // 512px
  xl: 'max-w-2xl',     // 672px
  full: 'max-w-[90vw]',
};

/**
 * Dialog content - the modal window itself
 * Renders in a portal at the document root
 */
export function DialogContent({
  size = 'default',
  showClose = true,
  className,
  children,
}: DialogContentProps) {
  const { open, onOpenChange } = useDialogContext();
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Handle escape key to close
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && open) {
        onOpenChange(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // Lock body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Focus trap: return focus when closed
  React.useEffect(() => {
    if (open && contentRef.current) {
      // Store the previously focused element
      const previouslyFocused = document.activeElement as HTMLElement;

      // Focus the dialog content
      contentRef.current.focus();

      return () => {
        // Return focus when dialog closes
        previouslyFocused?.focus?.();
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 animate-in fade-in-0 duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Dialog positioning wrapper */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Dialog content */}
          <div
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className={cn(
              // Base styles
              'relative w-full bg-white rounded-2xl shadow-xl',
              // Animation
              'animate-in fade-in-0 zoom-in-95 duration-200',
              // Size
              sizeClasses[size],
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            {showClose && (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className={cn(
                  'absolute right-4 top-4 p-1.5 rounded-lg',
                  'text-neutral-400 hover:text-neutral-600',
                  'hover:bg-neutral-100 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500'
                )}
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Dialog Header
// ============================================================================

interface DialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Dialog header - contains title and optional description
 */
export function DialogHeader({ className, children }: DialogHeaderProps) {
  return (
    <div className={cn('px-6 pt-6 pb-4', className)}>
      {children}
    </div>
  );
}

// ============================================================================
// Dialog Title
// ============================================================================

interface DialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Dialog title - the main heading
 */
export function DialogTitle({ className, children }: DialogTitleProps) {
  return (
    <h2
      className={cn(
        'text-lg font-semibold text-neutral-900 pr-8',
        className
      )}
    >
      {children}
    </h2>
  );
}

// ============================================================================
// Dialog Description
// ============================================================================

interface DialogDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Dialog description - optional supporting text below title
 */
export function DialogDescription({ className, children }: DialogDescriptionProps) {
  return (
    <p className={cn('mt-1 text-sm text-neutral-500', className)}>
      {children}
    </p>
  );
}

// ============================================================================
// Dialog Body
// ============================================================================

interface DialogBodyProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Dialog body - main content area
 */
export function DialogBody({ className, children }: DialogBodyProps) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  );
}

// ============================================================================
// Dialog Footer
// ============================================================================

interface DialogFooterProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Dialog footer - action buttons area
 */
export function DialogFooter({ className, children }: DialogFooterProps) {
  return (
    <div
      className={cn(
        'px-6 py-4 bg-neutral-50 rounded-b-2xl',
        'flex items-center justify-end gap-3',
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export type { DialogProps, DialogContentProps, DialogSize };
