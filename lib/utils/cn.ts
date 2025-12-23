/**
 * ============================================================================
 * 🎨 Class Name Utility (cn)
 * ============================================================================
 *
 * This utility combines clsx and tailwind-merge to handle conditional
 * class names while avoiding Tailwind class conflicts.
 *
 * Usage:
 *   cn("p-4", isActive && "bg-blue-500", className)
 *
 * Why we need this:
 * - clsx: Conditionally joins classNames (like: isActive && "bg-blue")
 * - tailwind-merge: Resolves conflicts (like: "p-4 p-2" → "p-2")
 *
 * ============================================================================
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with Tailwind conflict resolution
 *
 * @example
 * // Basic usage
 * cn("p-4", "text-lg")
 * // → "p-4 text-lg"
 *
 * @example
 * // With conditionals
 * cn("btn", isActive && "btn-active", className)
 * // → "btn btn-active ..." (if isActive is true)
 *
 * @example
 * // Resolves Tailwind conflicts
 * cn("p-4", "p-2")
 * // → "p-2" (later value wins)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
