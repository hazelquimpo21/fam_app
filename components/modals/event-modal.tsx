'use client';

/**
 * ============================================================================
 * 📅 EventModal Component
 * ============================================================================
 *
 * A comprehensive modal for creating and editing family events.
 * Unlike tasks (which are completable), events are time-specific occurrences
 * like appointments, meetings, and activities.
 *
 * Features:
 * - Date and time pickers for start/end
 * - All-day event toggle
 * - Location field
 * - Family member assignment (who's attending)
 * - Icon/emoji picker (optional)
 * - Keyboard shortcuts (Cmd+Enter to save)
 *
 * Usage:
 * ```tsx
 * // Create mode
 * <EventModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * />
 *
 * // Edit mode
 * <EventModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   event={existingEvent}
 * />
 * ```
 *
 * See AI_Dev_Docs/17-family-events.md for documentation.
 *
 * ============================================================================
 */

import * as React from 'react';
import { Calendar, Clock, MapPin, User, AlignLeft, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FamilyMemberPicker } from '@/components/shared/family-member-picker';
import {
  useCreateFamilyEvent,
  useUpdateFamilyEvent,
} from '@/lib/hooks/use-family-events';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils/cn';
import type { FamilyEvent } from '@/types/calendar';


// ============================================================================
// Types
// ============================================================================

interface EventModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Existing event to edit (if provided, modal is in edit mode) */
  event?: FamilyEvent | null;
  /** Initial date for new events (defaults to today) */
  initialDate?: Date;
  /** Callback when event is saved successfully */
  onSuccess?: (event: FamilyEvent) => void;
}

interface EventFormData {
  title: string;
  description: string;
  location: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  is_all_day: boolean;
  assigned_to: string | null;
  icon: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Common event icons for quick selection
 */
const EVENT_ICONS = [
  { emoji: '', label: 'None' },
  { emoji: '🏥', label: 'Medical' },
  { emoji: '⚽', label: 'Sports' },
  { emoji: '🎓', label: 'School' },
  { emoji: '👥', label: 'Meeting' },
  { emoji: '🎉', label: 'Party' },
  { emoji: '🍽️', label: 'Dining' },
  { emoji: '✈️', label: 'Travel' },
  { emoji: '🎵', label: 'Music' },
  { emoji: '🎨', label: 'Art' },
];

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format date for input (YYYY-MM-DD)
 */
function formatDateForInput(dateStr: string | Date | null): string {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toISOString().split('T')[0];
}

/**
 * Format time for input (HH:MM)
 */
function formatTimeForInput(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toTimeString().slice(0, 5); // HH:MM
}

/**
 * Combine date and time strings into an ISO timestamp
 */
function combineDateTime(dateStr: string, timeStr: string, isAllDay: boolean): string {
  if (isAllDay) {
    // For all-day events, use midnight UTC
    return `${dateStr}T00:00:00Z`;
  }
  // For timed events, create a proper ISO timestamp
  // The time is in local timezone, so we let the browser handle it
  const combined = new Date(`${dateStr}T${timeStr}`);
  return combined.toISOString();
}

/**
 * Get today's date formatted for input
 */
function getTodayForInput(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current time rounded to next 30 minutes
 */
function getNextHalfHour(): string {
  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = minutes < 30 ? 30 : 0;
  const hour = minutes < 30 ? now.getHours() : now.getHours() + 1;
  return `${hour.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
}

/**
 * Get end time (1 hour after start)
 */
function getDefaultEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHour = hours + 1;
  return `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Get initial form data from event or defaults
 */
function getInitialFormData(
  event?: FamilyEvent | null,
  initialDate?: Date
): EventFormData {
  if (event) {
    return {
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      start_date: formatDateForInput(event.start_time),
      start_time: event.is_all_day ? '' : formatTimeForInput(event.start_time),
      end_date: event.end_time ? formatDateForInput(event.end_time) : formatDateForInput(event.start_time),
      end_time: event.end_time && !event.is_all_day ? formatTimeForInput(event.end_time) : '',
      is_all_day: event.is_all_day,
      assigned_to: event.assigned_to,
      icon: event.icon || '',
    };
  }

  const startDate = initialDate ? formatDateForInput(initialDate) : getTodayForInput();
  const startTime = getNextHalfHour();

  return {
    title: '',
    description: '',
    location: '',
    start_date: startDate,
    start_time: startTime,
    end_date: startDate,
    end_time: getDefaultEndTime(startTime),
    is_all_day: false,
    assigned_to: null,
    icon: '',
  };
}

// ============================================================================
// Component
// ============================================================================

/**
 * EventModal - Create or edit a family event
 */
export function EventModal({
  open,
  onOpenChange,
  event,
  initialDate,
  onSuccess,
}: EventModalProps) {
  const isEditMode = !!event;

  // Form state
  const [formData, setFormData] = React.useState<EventFormData>(() =>
    getInitialFormData(event, initialDate)
  );

  // Mutations
  const createEvent = useCreateFamilyEvent();
  const updateEvent = useUpdateFamilyEvent();

  const isPending = createEvent.isPending || updateEvent.isPending;

  // Reset form when event changes or modal opens
  React.useEffect(() => {
    if (open) {
      setFormData(getInitialFormData(event, initialDate));
    }
  }, [open, event, initialDate]);

  /**
   * Update a single form field
   */
  const updateField = <K extends keyof EventFormData>(
    field: K,
    value: EventFormData[K]
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-adjust end date/time when start changes
      if (field === 'start_date' && prev.end_date < value) {
        updated.end_date = value as string;
      }
      if (field === 'start_time' && prev.end_time && prev.start_date === prev.end_date) {
        // If end time is before start time on the same day, adjust it
        if ((value as string) > prev.end_time) {
          updated.end_time = getDefaultEndTime(value as string);
        }
      }

      // Clear times when switching to all-day
      if (field === 'is_all_day' && value === true) {
        updated.start_time = '';
        updated.end_time = '';
      }
      // Set default times when switching from all-day
      if (field === 'is_all_day' && value === false) {
        const startTime = getNextHalfHour();
        updated.start_time = startTime;
        updated.end_time = getDefaultEndTime(startTime);
      }

      return updated;
    });
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      logger.warn('Event title is required');
      return;
    }

    if (!formData.start_date) {
      logger.warn('Event date is required');
      return;
    }

    if (!formData.is_all_day && !formData.start_time) {
      logger.warn('Event time is required for non-all-day events');
      return;
    }

    logger.info('Saving event...', { isEditMode, title: formData.title });

    try {
      // Build the event data
      const startTime = combineDateTime(
        formData.start_date,
        formData.start_time || '00:00',
        formData.is_all_day
      );

      let endTime: string | null = null;
      if (formData.end_date && (formData.is_all_day || formData.end_time)) {
        endTime = combineDateTime(
          formData.end_date,
          formData.end_time || '23:59',
          formData.is_all_day
        );
      }

      if (isEditMode && event) {
        // Update existing event
        const result = await updateEvent.mutateAsync({
          id: event.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          location: formData.location.trim() || null,
          start_time: startTime,
          end_time: endTime,
          is_all_day: formData.is_all_day,
          assigned_to: formData.assigned_to,
          icon: formData.icon || null,
        });
        onSuccess?.(result);
      } else {
        // Create new event
        const result = await createEvent.mutateAsync({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          location: formData.location.trim() || null,
          start_time: startTime,
          end_time: endTime,
          is_all_day: formData.is_all_day,
          assigned_to: formData.assigned_to,
          icon: formData.icon || null,
        });
        onSuccess?.(result);
      }

      // Close modal on success
      onOpenChange(false);
    } catch (error) {
      logger.error('Failed to save event', { error });
      // Error is handled by the mutation hook (toast shown)
    }
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to save
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Event' : 'New Event'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col flex-1 overflow-hidden">
          <DialogBody className="space-y-4 overflow-y-auto flex-1">
            {/* Title with icon */}
            <div className="flex gap-2">
              {/* Icon picker */}
              <div className="shrink-0">
                <label className="sr-only">Event icon</label>
                <select
                  value={formData.icon}
                  onChange={(e) => updateField('icon', e.target.value)}
                  className={cn(
                    'h-11 w-14 text-xl text-center rounded-lg border border-neutral-300',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                    'bg-white cursor-pointer'
                  )}
                >
                  {EVENT_ICONS.map((icon) => (
                    <option key={icon.label} value={icon.emoji}>
                      {icon.emoji || '📅'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title input */}
              <div className="flex-1">
                <label htmlFor="event-title" className="sr-only">
                  Event title
                </label>
                <Input
                  id="event-title"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Event title"
                  autoFocus
                  className="text-lg font-medium"
                />
              </div>
            </div>

            {/* All-day toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-all-day"
                checked={formData.is_all_day}
                onChange={(e) => updateField('is_all_day', e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="is-all-day" className="text-sm text-neutral-700">
                All-day event
              </label>
            </div>

            {/* Date and time fields */}
            <div className="grid grid-cols-2 gap-3">
              {/* Start date */}
              <div>
                <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                  <Calendar className="h-4 w-4" />
                  Start
                </label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => updateField('start_date', e.target.value)}
                    className="flex-1"
                  />
                  {!formData.is_all_day && (
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => updateField('start_time', e.target.value)}
                      className="w-28"
                    />
                  )}
                </div>
              </div>

              {/* End date */}
              <div>
                <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                  <Clock className="h-4 w-4" />
                  End
                </label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => updateField('end_date', e.target.value)}
                    min={formData.start_date}
                    className="flex-1"
                  />
                  {!formData.is_all_day && (
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => updateField('end_time', e.target.value)}
                      className="w-28"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                <MapPin className="h-4 w-4" />
                Location
              </label>
              <Input
                value={formData.location}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="Add location"
              />
            </div>

            {/* Assignee */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                <User className="h-4 w-4" />
                Who&apos;s going
              </label>
              <FamilyMemberPicker
                value={formData.assigned_to}
                onChange={(id) => updateField('assigned_to', id)}
                placeholder="Select family member..."
                allowClear
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                <AlignLeft className="h-4 w-4" />
                Notes
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Add notes or details..."
                rows={3}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border border-neutral-300',
                  'text-sm resize-none',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                )}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isPending}
              disabled={!formData.title.trim() || !formData.start_date}
            >
              {isEditMode ? 'Save Event' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Exports
// ============================================================================

export type { EventModalProps };
