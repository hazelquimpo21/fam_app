'use client';

/**
 * ============================================================================
 * 📅 ScheduleCard Component
 * ============================================================================
 *
 * A unified card component for displaying calendar items from any source:
 * - Family Events (Fam-native, editable)
 * - External Events (Google Calendar, read-only)
 * - Birthdays (special celebration styling)
 *
 * WHY THIS EXISTS:
 * The Today page and Calendar views need to display events from multiple
 * sources with consistent styling but clear visual distinction. This
 * component handles all the rendering logic in one place.
 *
 * VISUAL DESIGN:
 * - Fam events: Indigo accent, editable indicator
 * - Google Calendar: Red accent, "Google" badge, read-only
 * - Birthdays: Pink gradient, cake emoji, age display
 *
 * USAGE:
 * ```tsx
 * import { ScheduleCard } from '@/components/shared/schedule-card';
 *
 * // In a list
 * {items.map(item => (
 *   <ScheduleCard
 *     key={item.id}
 *     item={item}
 *     onClick={item.type === 'event' ? handleEditEvent : undefined}
 *   />
 * ))}
 * ```
 *
 * PROPS:
 * - item: CalendarItem - The item to display
 * - onClick: () => void - Optional click handler (for editable items)
 * - showDate: boolean - Whether to show date (for non-Today views)
 * - compact: boolean - Use compact layout (for calendar grid)
 *
 * ============================================================================
 */

import * as React from 'react';
import { Calendar, Clock, MapPin, ExternalLink } from 'lucide-react';
import { Avatar } from '@/components/shared/avatar';
import { Badge } from '@/components/shared/badge';
import { cn } from '@/lib/utils/cn';
import {
  isEditableItem,
  getItemSourceLabel,
  formatItemTime,
} from '@/lib/hooks/use-calendar-items';
import type { CalendarItem } from '@/types/calendar';


// ============================================================================
// Types
// ============================================================================

interface ScheduleCardProps {
  /** The calendar item to display */
  item: CalendarItem;

  /** Click handler (typically for opening edit modal) */
  onClick?: (item: CalendarItem) => void;

  /** Show the date (for calendar views spanning multiple days) */
  showDate?: boolean;

  /** Use compact layout (for calendar grid cells) */
  compact?: boolean;
}


// ============================================================================
// Constants
// ============================================================================

/**
 * Visual styling per item type.
 * Each type has distinct colors to help users quickly identify the source.
 */
const TYPE_STYLES: Record<CalendarItem['type'], {
  border: string;
  bg: string;
  hoverBg: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
}> = {
  event: {
    border: 'border-indigo-200',
    bg: 'bg-white',
    hoverBg: 'hover:bg-indigo-50',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-700',
  },
  external: {
    border: 'border-neutral-200',
    bg: 'bg-white',
    hoverBg: 'hover:bg-neutral-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
  },
  birthday: {
    border: 'border-pink-200',
    bg: 'bg-gradient-to-r from-pink-50 to-purple-50',
    hoverBg: 'hover:from-pink-100 hover:to-purple-100',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-700',
  },
  task: {
    border: 'border-blue-200',
    bg: 'bg-white',
    hoverBg: 'hover:bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
  },
  meal: {
    border: 'border-green-200',
    bg: 'bg-white',
    hoverBg: 'hover:bg-green-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-700',
  },
};


// ============================================================================
// Sub-components
// ============================================================================

/**
 * Icon display with optional emoji or default calendar icon.
 */
function ItemIcon({
  item,
  styles,
  compact,
}: {
  item: CalendarItem;
  styles: typeof TYPE_STYLES['event'];
  compact?: boolean;
}) {
  const sizeClass = compact ? 'h-6 w-6' : 'h-8 w-8';
  const iconSize = compact ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center shrink-0',
        sizeClass,
        styles.iconBg
      )}
    >
      {item.icon ? (
        <span className={compact ? 'text-xs' : 'text-sm'}>{item.icon}</span>
      ) : (
        <Calendar className={cn(iconSize, styles.iconColor)} />
      )}
    </div>
  );
}

/**
 * Source badge showing where the event came from.
 */
function SourceBadge({
  item,
  styles,
}: {
  item: CalendarItem;
  styles: typeof TYPE_STYLES['event'];
}) {
  // Don't show badge for Fam events (they're the default)
  if (item.type === 'event') return null;

  const label = getItemSourceLabel(item);

  return (
    <span
      className={cn(
        'text-xs px-1.5 py-0.5 rounded-full font-medium',
        styles.badgeBg,
        styles.badgeText
      )}
    >
      {item.type === 'external' && (
        <span className="inline-flex items-center gap-0.5">
          <svg className="h-2.5 w-2.5" viewBox="0 0 24 24">
            <path
              fill="#DB4437"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#4285F4"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
          </svg>
          {label}
        </span>
      )}
      {item.type === 'birthday' && (
        <span>
          Turning {item.meta?.ageTurning}
        </span>
      )}
    </span>
  );
}


// ============================================================================
// Main Component
// ============================================================================

/**
 * ScheduleCard - Unified calendar item display
 *
 * Renders events, external events, and birthdays with consistent styling
 * but clear visual distinction between sources.
 */
export function ScheduleCard({
  item,
  onClick,
  showDate = false,
  compact = false,
}: ScheduleCardProps) {
  const styles = TYPE_STYLES[item.type];
  const isEditable = isEditableItem(item);
  const timeDisplay = formatItemTime(item);

  /**
   * Handle click - only trigger if there's a handler
   */
  const handleClick = () => {
    if (onClick) {
      onClick(item);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Compact layout for calendar grid cells
  if (compact) {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'flex items-center gap-1.5 rounded-md border p-1.5 transition-colors',
          styles.border,
          styles.bg,
          onClick && 'cursor-pointer',
          onClick && styles.hoverBg
        )}
      >
        <ItemIcon item={item} styles={styles} compact />
        <span className="text-xs font-medium truncate flex-1">{item.title}</span>
        {!item.isAllDay && (
          <span className="text-xs text-neutral-500">{timeDisplay}</span>
        )}
      </div>
    );
  }

  // Full layout for Today page and list views
  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 transition-all',
        styles.border,
        styles.bg,
        onClick && 'cursor-pointer',
        onClick && styles.hoverBg
      )}
    >
      {/* Icon */}
      <ItemIcon item={item} styles={styles} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title row with source badge */}
        <div className="flex items-center gap-2">
          <p className="font-medium text-neutral-900 truncate">{item.title}</p>
          <SourceBadge item={item} styles={styles} />
        </div>

        {/* Details row */}
        <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
          {/* Date (if showing) */}
          {showDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(item.start)}
            </span>
          )}

          {/* Time */}
          <span className={cn(
            'flex items-center gap-1 font-medium',
            item.type === 'event' ? 'text-indigo-600' :
            item.type === 'external' ? 'text-red-600' :
            item.type === 'birthday' ? 'text-pink-600' :
            'text-neutral-600'
          )}>
            <Clock className="h-3 w-3" />
            {timeDisplay}
          </span>

          {/* Location */}
          {item.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3" />
              {item.location}
            </span>
          )}

          {/* External link indicator for Google Calendar events */}
          {item.type === 'external' && (
            <span className="flex items-center gap-1 text-neutral-400">
              <ExternalLink className="h-3 w-3" />
              Read-only
            </span>
          )}
        </div>
      </div>

      {/* Assignee avatar (for Fam events) */}
      {item.assignee && (
        <Avatar
          name={item.assignee.name}
          color={item.assignee.color}
          size="sm"
        />
      )}

      {/* Edit indicator for Fam events */}
      {isEditable && onClick && (
        <div className="text-neutral-400 text-xs">
          Click to edit
        </div>
      )}
    </div>
  );
}


// ============================================================================
// Empty State
// ============================================================================

/**
 * Empty state for when there are no scheduled items.
 */
export function ScheduleEmptyState({
  onAddEvent,
}: {
  onAddEvent?: () => void;
}) {
  return (
    <div className="text-center py-6 px-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 mb-3">
        <Calendar className="h-6 w-6 text-indigo-600" />
      </div>
      <h3 className="text-sm font-medium text-neutral-900 mb-1">
        Nothing scheduled
      </h3>
      <p className="text-sm text-neutral-500 mb-4">
        Your day is clear! Add an event or connect Google Calendar.
      </p>
      {onAddEvent && (
        <button
          onClick={onAddEvent}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          + Add Event
        </button>
      )}
    </div>
  );
}


// ============================================================================
// Exports
// ============================================================================

export type { ScheduleCardProps };
