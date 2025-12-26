'use client';

/**
 * ============================================================================
 * 🎛️ RadioCardGroup Component
 * ============================================================================
 *
 * A visually rich radio group using card-style buttons.
 * Users select exactly one option from the group.
 *
 * Used for: personality type, energy type, chronotype, etc.
 *
 * Features:
 * - Visual card-based selection
 * - Optional icons/emojis
 * - Optional descriptions
 * - Keyboard accessible
 *
 * @example
 * <RadioCardGroup
 *   value="morning"
 *   onChange={(value) => console.log(value)}
 *   options={[
 *     { value: 'morning', label: 'Morning Person', icon: '🌅', description: 'Best focus before noon' },
 *     { value: 'night', label: 'Night Owl', icon: '🦉', description: 'Comes alive after dark' },
 *   ]}
 * />
 *
 * ============================================================================
 */

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// Types
// ============================================================================

interface RadioOption {
  /** Unique value for this option */
  value: string;
  /** Display label */
  label: string;
  /** Optional icon (emoji or React node) */
  icon?: React.ReactNode;
  /** Optional description text */
  description?: string;
}

interface RadioCardGroupProps {
  /** Currently selected value */
  value: string | undefined;
  /** Callback when selection changes */
  onChange: (value: string) => void;
  /** Available options */
  options: RadioOption[];
  /** Layout direction */
  direction?: 'horizontal' | 'vertical' | 'grid';
  /** Number of columns for grid layout */
  columns?: 2 | 3 | 4;
  /** Color variant for selected state */
  colorVariant?: 'indigo' | 'green' | 'blue' | 'orange' | 'purple';
  /** Additional className for container */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Show checkmark on selected option */
  showCheck?: boolean;
}

// ============================================================================
// Color Variants
// ============================================================================

const colorVariants = {
  indigo: 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-indigo-500',
  green: 'border-green-500 bg-green-50 text-green-700 ring-green-500',
  blue: 'border-blue-500 bg-blue-50 text-blue-700 ring-blue-500',
  orange: 'border-orange-500 bg-orange-50 text-orange-700 ring-orange-500',
  purple: 'border-purple-500 bg-purple-50 text-purple-700 ring-purple-500',
};

// ============================================================================
// Component
// ============================================================================

export function RadioCardGroup({
  value,
  onChange,
  options,
  direction = 'horizontal',
  columns = 3,
  colorVariant = 'indigo',
  className,
  disabled = false,
  showCheck = true,
}: RadioCardGroupProps) {
  const selectedColor = colorVariants[colorVariant];

  // Layout classes based on direction
  const layoutClasses = {
    horizontal: 'flex flex-wrap gap-2',
    vertical: 'flex flex-col gap-2',
    grid: cn('grid gap-2', {
      'grid-cols-2': columns === 2,
      'grid-cols-3': columns === 3,
      'grid-cols-4': columns === 4,
    }),
  };

  return (
    <div
      role="radiogroup"
      className={cn(layoutClasses[direction], className)}
    >
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative flex flex-col items-center justify-center',
              'p-4 rounded-xl border-2 transition-all',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              isSelected
                ? selectedColor
                : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300',
              disabled && 'opacity-50 cursor-not-allowed',
              !disabled && 'cursor-pointer'
            )}
          >
            {/* Checkmark indicator */}
            {showCheck && isSelected && (
              <span className="absolute top-2 right-2">
                <Check className="h-4 w-4" />
              </span>
            )}

            {/* Icon */}
            {option.icon && (
              <span className="text-2xl mb-2">
                {option.icon}
              </span>
            )}

            {/* Label */}
            <span className="font-medium text-sm">{option.label}</span>

            {/* Description */}
            {option.description && (
              <span className="text-xs text-neutral-500 mt-1 text-center">
                {option.description}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Preset Option Sets
// ============================================================================

/**
 * Personality type options
 */
export const PERSONALITY_OPTIONS: RadioOption[] = [
  {
    value: 'The Organizer',
    label: 'The Organizer',
    icon: '📋',
    description: 'Detail-oriented, loves planning',
  },
  {
    value: 'The Creative',
    label: 'The Creative',
    icon: '🎨',
    description: 'Artistic, innovative thinker',
  },
  {
    value: 'The Connector',
    label: 'The Connector',
    icon: '🤝',
    description: 'Social, relationship-focused',
  },
  {
    value: 'The Thinker',
    label: 'The Thinker',
    icon: '📚',
    description: 'Analytical, thoughtful',
  },
  {
    value: 'The Adventurer',
    label: 'The Adventurer',
    icon: '🧗',
    description: 'Spontaneous, loves experiences',
  },
  {
    value: 'The Supporter',
    label: 'The Supporter',
    icon: '💝',
    description: 'Nurturing, puts others first',
  },
];

/**
 * Energy type options (introvert/extrovert)
 */
export const ENERGY_TYPE_OPTIONS: RadioOption[] = [
  {
    value: 'introvert',
    label: 'Introvert',
    icon: '🧘',
    description: 'Recharges with alone time',
  },
  {
    value: 'ambivert',
    label: 'Ambivert',
    icon: '⚖️',
    description: 'Mix of both',
  },
  {
    value: 'extrovert',
    label: 'Extrovert',
    icon: '🎉',
    description: 'Energized by others',
  },
];

/**
 * Chronotype options (morning/night person)
 */
export const CHRONOTYPE_OPTIONS: RadioOption[] = [
  {
    value: 'morning',
    label: 'Morning Person',
    icon: '🌅',
    description: 'Best before noon',
  },
  {
    value: 'night',
    label: 'Night Owl',
    icon: '🦉',
    description: 'Comes alive after dark',
  },
  {
    value: 'flexible',
    label: 'Flexible',
    icon: '🌤️',
    description: 'Adapts to any schedule',
  },
];

/**
 * Planning style options
 */
export const PLANNING_STYLE_OPTIONS: RadioOption[] = [
  {
    value: 'planner',
    label: 'Planner',
    icon: '📅',
    description: 'Likes structure & schedules',
  },
  {
    value: 'spontaneous',
    label: 'Spontaneous',
    icon: '✨',
    description: 'Goes with the flow',
  },
  {
    value: 'mixed',
    label: 'Mixed',
    icon: '🔄',
    description: 'Depends on the day',
  },
];

/**
 * Love language options
 */
export const LOVE_LANGUAGE_OPTIONS: RadioOption[] = [
  {
    value: 'words',
    label: 'Words of Affirmation',
    icon: '💬',
    description: 'Verbal appreciation',
  },
  {
    value: 'acts',
    label: 'Acts of Service',
    icon: '🤲',
    description: 'Helpful actions',
  },
  {
    value: 'gifts',
    label: 'Receiving Gifts',
    icon: '🎁',
    description: 'Thoughtful presents',
  },
  {
    value: 'time',
    label: 'Quality Time',
    icon: '⏰',
    description: 'Undivided attention',
  },
  {
    value: 'touch',
    label: 'Physical Touch',
    icon: '🤗',
    description: 'Physical affection',
  },
];

/**
 * AI tone options
 */
export const AI_TONE_OPTIONS: RadioOption[] = [
  {
    value: 'encouraging',
    label: 'Encouraging',
    icon: '💪',
    description: 'Warm and supportive',
  },
  {
    value: 'direct',
    label: 'Direct',
    icon: '🎯',
    description: 'Straight to the point',
  },
  {
    value: 'playful',
    label: 'Playful',
    icon: '😄',
    description: 'Fun and lighthearted',
  },
  {
    value: 'minimal',
    label: 'Minimal',
    icon: '🤫',
    description: 'Just the facts',
  },
];

/**
 * Life stage options
 */
export const LIFE_STAGE_OPTIONS: RadioOption[] = [
  {
    value: 'young_kids',
    label: 'Young Kids',
    icon: '👶',
    description: '0-5 years',
  },
  {
    value: 'elementary',
    label: 'Elementary',
    icon: '🎒',
    description: '6-10 years',
  },
  {
    value: 'tweens',
    label: 'Tweens',
    icon: '🎮',
    description: '11-13 years',
  },
  {
    value: 'teens',
    label: 'Teens',
    icon: '🎧',
    description: '14-17 years',
  },
  {
    value: 'mixed',
    label: 'Mixed Ages',
    icon: '👨‍👩‍👧‍👦',
    description: 'Multiple age groups',
  },
  {
    value: 'empty_nest',
    label: 'Empty Nest',
    icon: '🏡',
    description: 'Adult children',
  },
];
