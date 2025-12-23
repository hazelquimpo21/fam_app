/**
 * ============================================================================
 * 🏷️ Badge Component
 * ============================================================================
 *
 * Small labels for status, categories, and tags.
 *
 * Usage:
 *   <Badge>Active</Badge>
 *   <Badge variant="success">Completed</Badge>
 *   <Badge variant="warning" dot>In Progress</Badge>
 *
 * ============================================================================
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-medium',
  {
    variants: {
      variant: {
        default: 'bg-neutral-100 text-neutral-700',
        primary: 'bg-indigo-100 text-indigo-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-amber-100 text-amber-700',
        error: 'bg-red-100 text-red-700',
        outline: 'border border-neutral-300 text-neutral-700',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        default: 'px-2.5 py-0.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Show a colored dot instead of full background */
  dot?: boolean;
}

/**
 * Badge Component
 *
 * @example
 * // Status badges
 * <Badge variant="success">Completed</Badge>
 * <Badge variant="warning">In Progress</Badge>
 * <Badge variant="error">Overdue</Badge>
 *
 * @example
 * // With dot indicator
 * <Badge dot variant="success">Active</Badge>
 */
export function Badge({
  className,
  variant,
  size,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  // Dot colors matching variants
  const dotColors = {
    default: 'bg-neutral-500',
    primary: 'bg-indigo-500',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    outline: 'bg-neutral-500',
  };

  return (
    <span
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'mr-1.5 h-1.5 w-1.5 rounded-full',
            dotColors[variant || 'default']
          )}
        />
      )}
      {children}
    </span>
  );
}

/**
 * Streak Badge - For habit streaks 🔥
 */
export interface StreakBadgeProps {
  /** Number of consecutive days */
  count: number;
  /** Size of the badge */
  size?: 'sm' | 'default';
  /** Show animation (for milestone achievements) */
  animate?: boolean;
}

export function StreakBadge({
  count,
  size = 'default',
  animate = false,
}: StreakBadgeProps) {
  // Milestone numbers get special treatment
  const isMilestone = [7, 14, 30, 60, 100, 365].includes(count);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-sm',
        isMilestone
          ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white'
          : 'bg-orange-100 text-orange-700',
        animate && 'animate-pulse'
      )}
    >
      🔥 {count} {count === 1 ? 'day' : 'days'}
    </span>
  );
}
