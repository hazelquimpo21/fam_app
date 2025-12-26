'use client';

/**
 * ============================================================================
 * 🏷️ MultiSelectChips Component
 * ============================================================================
 *
 * A reusable chip-based multi-select input. Users can select multiple items
 * from predefined options and/or add custom items.
 *
 * Used for: values, strengths, interests, dietary restrictions, etc.
 *
 * Features:
 * - Predefined options with toggle selection
 * - Custom item input with "Add" button
 * - Removable selected items
 * - Accessible keyboard navigation
 *
 * @example
 * <MultiSelectChips
 *   value={['hiking', 'cooking']}
 *   onChange={(values) => console.log(values)}
 *   options={['hiking', 'cooking', 'reading', 'gaming']}
 *   placeholder="Add custom interest..."
 *   maxItems={10}
 * />
 *
 * ============================================================================
 */

import * as React from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// Types
// ============================================================================

interface MultiSelectChipsProps {
  /** Currently selected values */
  value: string[];
  /** Callback when selection changes */
  onChange: (value: string[]) => void;
  /** Predefined options to show as chips */
  options?: string[];
  /** Placeholder for custom input */
  placeholder?: string;
  /** Whether to allow custom items */
  allowCustom?: boolean;
  /** Maximum number of items allowed */
  maxItems?: number;
  /** Color variant for selected chips */
  colorVariant?: 'indigo' | 'green' | 'blue' | 'orange' | 'purple';
  /** Display labels for options (if different from values) */
  labels?: Record<string, string>;
  /** Additional className for container */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format a value for display (convert snake_case to Title Case)
 */
function formatLabel(value: string, labels?: Record<string, string>): string {
  if (labels?.[value]) return labels[value];
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================================================
// Color Variants
// ============================================================================

const colorVariants = {
  indigo: {
    selected: 'bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-200',
    unselected: 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300',
  },
  green: {
    selected: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
    unselected: 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300',
  },
  blue: {
    selected: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
    unselected: 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300',
  },
  orange: {
    selected: 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200',
    unselected: 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300',
  },
  purple: {
    selected: 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200',
    unselected: 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300',
  },
};

// ============================================================================
// Component
// ============================================================================

export function MultiSelectChips({
  value,
  onChange,
  options = [],
  placeholder = 'Add custom...',
  allowCustom = true,
  maxItems = 20,
  colorVariant = 'indigo',
  labels,
  className,
  disabled = false,
}: MultiSelectChipsProps) {
  const [customInput, setCustomInput] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const colors = colorVariants[colorVariant];

  /**
   * Toggle selection of an option
   */
  const toggleOption = (option: string) => {
    if (disabled) return;

    if (value.includes(option)) {
      // Remove if already selected
      onChange(value.filter((v) => v !== option));
    } else if (value.length < maxItems) {
      // Add if not at max
      onChange([...value, option]);
    }
  };

  /**
   * Add a custom item
   */
  const addCustomItem = () => {
    const trimmed = customInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (!trimmed) return;
    if (value.includes(trimmed)) return; // Already selected
    if (value.length >= maxItems) return; // At max

    onChange([...value, trimmed]);
    setCustomInput('');
    inputRef.current?.focus();
  };

  /**
   * Handle keyboard in custom input
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomItem();
    }
  };

  /**
   * Remove a selected item
   */
  const removeItem = (item: string) => {
    if (disabled) return;
    onChange(value.filter((v) => v !== item));
  };

  // Separate selected from available options
  const selectedFromOptions = options.filter((opt) => value.includes(opt));
  const customSelected = value.filter((v) => !options.includes(v));
  const unselectedOptions = options.filter((opt) => !value.includes(opt));

  const isAtMax = value.length >= maxItems;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Selected items (shown as removable chips) */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <span
              key={item}
              className={cn(
                'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
                'border transition-colors',
                colors.selected,
                disabled && 'opacity-50'
              )}
            >
              {formatLabel(item, labels)}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeItem(item)}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                  aria-label={`Remove ${formatLabel(item, labels)}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Available options (shown as selectable chips) */}
      {unselectedOptions.length > 0 && !isAtMax && (
        <div className="flex flex-wrap gap-2">
          {unselectedOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggleOption(option)}
              disabled={disabled}
              className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                'border transition-colors',
                colors.unselected,
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {formatLabel(option, labels)}
            </button>
          ))}
        </div>
      )}

      {/* Custom input */}
      {allowCustom && !isAtMax && (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'flex-1 px-3 py-1.5 rounded-lg border border-neutral-300 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
          <button
            type="button"
            onClick={addCustomItem}
            disabled={disabled || !customInput.trim()}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium',
              'bg-indigo-600 text-white',
              'hover:bg-indigo-700 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center gap-1'
            )}
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      )}

      {/* Max items message */}
      {isAtMax && (
        <p className="text-xs text-neutral-500">
          Maximum of {maxItems} items reached. Remove some to add more.
        </p>
      )}
    </div>
  );
}
