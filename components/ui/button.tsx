/**
 * ============================================================================
 * 🔘 Button Component
 * ============================================================================
 *
 * A versatile button component with multiple variants and sizes.
 * Built with class-variance-authority for type-safe variants.
 *
 * Usage:
 *   <Button>Click me</Button>
 *   <Button variant="secondary" size="sm">Small</Button>
 *   <Button variant="destructive" loading>Deleting...</Button>
 *
 * ============================================================================
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Button style variants using class-variance-authority
 *
 * This creates a type-safe way to handle different button styles.
 * Each variant maps to specific Tailwind classes.
 */
const buttonVariants = cva(
  // Base styles (applied to ALL buttons)
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-lg font-medium',
    'transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      // Visual style variants
      variant: {
        /** Primary action - the main call to action */
        default: [
          'bg-indigo-600 text-white',
          'hover:bg-indigo-700',
          'focus-visible:ring-indigo-500',
        ],

        /** Secondary action - less emphasis */
        secondary: [
          'bg-neutral-100 text-neutral-900',
          'hover:bg-neutral-200',
          'focus-visible:ring-neutral-400',
        ],

        /** Outline style - for tertiary actions */
        outline: [
          'border border-neutral-300 bg-white text-neutral-700',
          'hover:bg-neutral-50 hover:border-neutral-400',
          'focus-visible:ring-neutral-400',
        ],

        /** Ghost - subtle, icon buttons */
        ghost: [
          'text-neutral-600',
          'hover:bg-neutral-100 hover:text-neutral-900',
          'focus-visible:ring-neutral-400',
        ],

        /** Destructive - delete, remove actions */
        destructive: [
          'bg-red-600 text-white',
          'hover:bg-red-700',
          'focus-visible:ring-red-500',
        ],

        /** Link style - looks like a link */
        link: [
          'text-indigo-600 underline-offset-4',
          'hover:underline',
          'focus-visible:ring-indigo-500',
        ],
      },

      // Size variants
      size: {
        sm: 'h-8 px-3 text-sm',
        default: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },

    // Default values if not specified
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

/**
 * Button component props
 *
 * Extends native button props with our custom variants.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Show a loading spinner and disable the button */
  loading?: boolean;
  /** Icon to show on the left side */
  leftIcon?: React.ReactNode;
  /** Icon to show on the right side */
  rightIcon?: React.ReactNode;
}

/**
 * Button Component
 *
 * @example
 * // Primary button
 * <Button onClick={handleSave}>Save</Button>
 *
 * @example
 * // Secondary with icon
 * <Button variant="secondary" leftIcon={<Plus />}>Add Task</Button>
 *
 * @example
 * // Loading state
 * <Button loading>Saving...</Button>
 *
 * @example
 * // Destructive action
 * <Button variant="destructive">Delete</Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {/* Loading spinner replaces left icon when loading */}
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}

        {/* Button text/content */}
        {children}

        {/* Right icon (hidden when loading) */}
        {rightIcon && !loading && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
