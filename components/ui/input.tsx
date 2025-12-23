/**
 * ============================================================================
 * 📝 Input Component
 * ============================================================================
 *
 * A styled text input with optional icons and error states.
 *
 * Usage:
 *   <Input placeholder="Enter your email" />
 *   <Input type="password" error="Password is required" />
 *
 * ============================================================================
 */

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Input component props
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Error message to display (also applies error styling) */
  error?: string;
  /** Icon to show on the left side */
  leftIcon?: React.ReactNode;
  /** Icon to show on the right side */
  rightIcon?: React.ReactNode;
}

/**
 * Input Component
 *
 * @example
 * // Basic input
 * <Input placeholder="Enter task title" />
 *
 * @example
 * // With error
 * <Input value={email} error={errors.email} />
 *
 * @example
 * // With icon
 * <Input leftIcon={<Search />} placeholder="Search..." />
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, leftIcon, rightIcon, ...props }, ref) => {
    // Determine if we should show error styling
    const hasError = Boolean(error);

    return (
      <div className="relative">
        {/* Left icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {leftIcon}
          </div>
        )}

        {/* The actual input */}
        <input
          type={type}
          className={cn(
            // Base styles
            'flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm',
            'placeholder:text-neutral-400',
            'transition-colors duration-200',

            // Focus styles
            'focus:outline-none focus:ring-2 focus:ring-offset-1',

            // Normal state
            !hasError && [
              'border-neutral-300',
              'focus:border-indigo-500 focus:ring-indigo-500/20',
            ],

            // Error state
            hasError && [
              'border-red-500',
              'focus:border-red-500 focus:ring-red-500/20',
            ],

            // Disabled state
            'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-50',

            // Padding adjustments for icons
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',

            className
          )}
          ref={ref}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${props.id}-error` : undefined}
          {...props}
        />

        {/* Right icon */}
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {rightIcon}
          </div>
        )}

        {/* Error message */}
        {error && (
          <p
            id={`${props.id}-error`}
            className="mt-1 text-sm text-red-500"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
