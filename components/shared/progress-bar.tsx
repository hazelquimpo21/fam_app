'use client';

/**
 * ============================================================================
 * 📊 ProgressBar Component
 * ============================================================================
 *
 * A visual progress indicator used for:
 * - Goal progress (quantitative goals)
 * - Task completion percentage
 * - Habit streaks
 * - Loading states
 *
 * Features:
 * - Multiple sizes (sm, md, lg)
 * - Color variants based on progress
 * - Optional percentage label
 * - Animated transitions
 *
 * Usage:
 * ```tsx
 * <ProgressBar value={75} />
 * <ProgressBar value={25} size="lg" showLabel />
 * ```
 *
 * ============================================================================
 */

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// Types
// ============================================================================

type ProgressSize = 'sm' | 'md' | 'lg';
type ProgressVariant = 'default' | 'success' | 'warning' | 'error' | 'auto';

interface ProgressBarProps {
  /** Progress value (0-100) */
  value: number;
  /** Size of the progress bar */
  size?: ProgressSize;
  /** Color variant - 'auto' changes based on value */
  variant?: ProgressVariant;
  /** Show percentage label */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

const sizeClasses: Record<ProgressSize, string> = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

const labelSizeClasses: Record<ProgressSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

/**
 * Get the color classes based on variant and value
 */
function getBarColor(variant: ProgressVariant, value: number): string {
  if (variant === 'auto') {
    if (value >= 80) return 'bg-green-500';
    if (value >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  }

  switch (variant) {
    case 'success':
      return 'bg-green-500';
    case 'warning':
      return 'bg-amber-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-indigo-500';
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * ProgressBar - Visual progress indicator
 */
export function ProgressBar({
  value,
  size = 'md',
  variant = 'default',
  showLabel = false,
  className,
}: ProgressBarProps) {
  // Clamp value between 0 and 100
  const normalizedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('w-full', className)}>
      {/* Label */}
      {showLabel && (
        <div className={cn(
          'flex justify-between items-center mb-1',
          labelSizeClasses[size]
        )}>
          <span className="text-neutral-600">Progress</span>
          <span className="text-neutral-900 font-medium">
            {Math.round(normalizedValue)}%
          </span>
        </div>
      )}

      {/* Track */}
      <div
        className={cn(
          'w-full bg-neutral-200 rounded-full overflow-hidden',
          sizeClasses[size]
        )}
        role="progressbar"
        aria-valuenow={normalizedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Fill */}
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            getBarColor(variant, normalizedValue)
          )}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export type { ProgressBarProps, ProgressSize, ProgressVariant };
