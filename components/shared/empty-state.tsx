/**
 * ============================================================================
 * 📭 Empty State Component
 * ============================================================================
 *
 * Shown when a list has no items. Provides helpful context and actions.
 *
 * Usage:
 *   <EmptyState
 *     icon={<CheckSquare />}
 *     title="No tasks yet"
 *     description="Add your first task to get organized."
 *     action={{ label: "Add Task", onClick: openForm }}
 *   />
 *
 * ============================================================================
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

export interface EmptyStateProps {
  /** Icon to display (typically from lucide-react) */
  icon?: React.ReactNode;
  /** Main title */
  title: string;
  /** Optional description text */
  description?: string;
  /** Optional call-to-action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Additional CSS classes */
  className?: string;
}

/**
 * Empty State Component
 *
 * @example
 * // Tasks empty state
 * <EmptyState
 *   icon={<CheckSquare className="h-12 w-12" />}
 *   title="No tasks yet"
 *   description="Add your first task to get organized."
 *   action={{
 *     label: "Add Task",
 *     onClick: () => setShowForm(true)
 *   }}
 * />
 *
 * @example
 * // Simple empty state
 * <EmptyState
 *   title="Inbox Zero! 🎉"
 *   description="You've processed all your items."
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <div className="mb-4 text-neutral-300">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-medium text-neutral-900">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mt-2 max-w-sm text-neutral-500">
          {description}
        </p>
      )}

      {/* Action button */}
      {action && (
        <Button
          onClick={action.onClick}
          className="mt-6"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
