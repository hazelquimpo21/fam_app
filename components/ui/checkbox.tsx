/**
 * ============================================================================
 * ☑️ Checkbox Component
 * ============================================================================
 *
 * A styled checkbox with animation.
 * Used for tasks, subtasks, and habit tracking.
 *
 * Usage:
 *   <Checkbox checked={isComplete} onChange={setIsComplete} />
 *
 * ============================================================================
 */

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface CheckboxProps {
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Callback when the checkbox state changes */
  onChange: (checked: boolean) => void;
  /** Disable the checkbox */
  disabled?: boolean;
  /** Size of the checkbox */
  size?: 'sm' | 'default' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Accessible label */
  'aria-label'?: string;
}

/**
 * Size configurations
 */
const sizeConfig = {
  sm: {
    box: 'h-4 w-4',
    icon: 'h-3 w-3',
  },
  default: {
    box: 'h-5 w-5',
    icon: 'h-3.5 w-3.5',
  },
  lg: {
    box: 'h-6 w-6',
    icon: 'h-4 w-4',
  },
};

/**
 * Checkbox Component
 *
 * @example
 * // Basic usage
 * <Checkbox checked={task.completed} onChange={toggleTask} />
 *
 * @example
 * // Disabled
 * <Checkbox checked={true} onChange={() => {}} disabled />
 */
const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  (
    {
      checked,
      onChange,
      disabled = false,
      size = 'default',
      className,
      'aria-label': ariaLabel,
    },
    ref
  ) => {
    const config = sizeConfig[size];

    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          // Base styles
          'inline-flex shrink-0 items-center justify-center rounded-md border-2',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',

          // Unchecked state
          !checked && [
            'border-neutral-300 bg-white',
            'hover:border-neutral-400',
          ],

          // Checked state
          checked && [
            'border-indigo-600 bg-indigo-600',
            'hover:border-indigo-700 hover:bg-indigo-700',
          ],

          // Disabled state
          disabled && 'cursor-not-allowed opacity-50',

          // Size
          config.box,

          className
        )}
      >
        {/* Check icon with animation */}
        <Check
          className={cn(
            config.icon,
            'text-white',
            'transition-all duration-200',
            // Animate in when checked
            checked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          )}
          strokeWidth={3}
        />
      </button>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
