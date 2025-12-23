/**
 * ============================================================================
 * ⏳ Spinner Component
 * ============================================================================
 *
 * A loading spinner for indicating async operations.
 *
 * Usage:
 *   <Spinner />
 *   <Spinner size="lg" />
 *
 * ============================================================================
 */

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface SpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'default' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  default: 'h-6 w-6',
  lg: 'h-8 w-8',
};

/**
 * Spinner Component
 *
 * @example
 * // In a button
 * <Button disabled><Spinner size="sm" /> Loading...</Button>
 *
 * @example
 * // Full page
 * <div className="flex justify-center p-8">
 *   <Spinner size="lg" />
 * </div>
 */
export function Spinner({ size = 'default', className }: SpinnerProps) {
  return (
    <Loader2
      className={cn(
        'animate-spin text-indigo-600',
        sizeClasses[size],
        className
      )}
    />
  );
}

/**
 * Full-page loading state
 */
export function PageSpinner() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
