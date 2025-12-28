'use client';

/**
 * ============================================================================
 * ⬇️ KanbanDropIndicator Component
 * ============================================================================
 *
 * Visual indicator showing where a dragged item will be dropped.
 * Appears as a horizontal line with animated pulse between cards.
 *
 * DESIGN:
 * - Thin blue line with dots on ends
 * - Pulse animation to draw attention
 * - Appears above/below cards based on drop position
 * - Minimal height to not disrupt layout
 *
 * USAGE:
 * ```tsx
 * <KanbanDropIndicator isActive={isOver} />
 * ```
 *
 * FUTURE AI DEVELOPERS:
 * - Customize colors by changing the className values
 * - Adjust animation by modifying the animate-pulse class
 * - Height affects spacing - keep it small (h-1 to h-2)
 *
 * ============================================================================
 */

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// TYPES
// ============================================================================

interface KanbanDropIndicatorProps {
  /** Whether the drop indicator is active (showing) */
  isActive?: boolean;

  /** Additional class names */
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * KanbanDropIndicator - Visual line showing drop position.
 *
 * Renders a horizontal line with animated dots to indicate
 * where a dragged item will be inserted.
 */
export function KanbanDropIndicator({
  isActive = true,
  className,
}: KanbanDropIndicatorProps) {
  if (!isActive) return null;

  return (
    <div
      className={cn(
        'relative flex items-center gap-1 py-1',
        className
      )}
      aria-hidden="true"
    >
      {/* Left dot */}
      <div
        className={cn(
          'w-2 h-2 rounded-full bg-blue-500',
          'animate-pulse'
        )}
      />

      {/* Line */}
      <div
        className={cn(
          'flex-1 h-0.5 bg-blue-500 rounded-full',
          'animate-pulse'
        )}
      />

      {/* Right dot */}
      <div
        className={cn(
          'w-2 h-2 rounded-full bg-blue-500',
          'animate-pulse'
        )}
      />
    </div>
  );
}

// ============================================================================
// ALTERNATE STYLES
// ============================================================================

/**
 * KanbanDropZone - Larger drop zone indicator for empty columns.
 *
 * Shows a dashed border area where items can be dropped.
 */
export function KanbanDropZone({
  isActive = false,
  children,
  className,
}: {
  isActive?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'min-h-[80px] border-2 border-dashed rounded-lg transition-all duration-200',
        'flex items-center justify-center',
        isActive
          ? 'border-blue-400 bg-blue-50/50 text-blue-600'
          : 'border-neutral-300 bg-neutral-50/30 text-neutral-400',
        className
      )}
    >
      {children || (
        <span className="text-sm font-medium">
          {isActive ? 'Drop here' : 'Empty'}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { KanbanDropIndicatorProps };
