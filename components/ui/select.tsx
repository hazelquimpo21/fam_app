'use client';

/**
 * ============================================================================
 * 📋 Select Component
 * ============================================================================
 *
 * A custom select/dropdown component with:
 * - Keyboard navigation
 * - Search/filter capability (optional)
 * - Custom render for options
 * - Accessible with screen readers
 *
 * This is a foundational component used by entity pickers like:
 * - FamilyMemberPicker
 * - ProjectPicker
 * - GoalPicker
 *
 * Usage:
 * ```tsx
 * <Select
 *   value={selectedId}
 *   onChange={setSelectedId}
 *   placeholder="Select an option..."
 * >
 *   <SelectOption value="1">Option 1</SelectOption>
 *   <SelectOption value="2">Option 2</SelectOption>
 * </Select>
 * ```
 *
 * ============================================================================
 */

import * as React from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// Types
// ============================================================================

interface SelectContextValue {
  value: string | null;
  onChange: (value: string | null) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

// ============================================================================
// Context
// ============================================================================

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select provider');
  }
  return context;
}

// ============================================================================
// Select Root
// ============================================================================

interface SelectProps {
  /** Currently selected value */
  value: string | null;
  /** Callback when value changes */
  onChange: (value: string | null) => void;
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Allow clearing the selection */
  allowClear?: boolean;
  /** Additional CSS classes for the trigger */
  className?: string;
  /** Children (SelectOption components) */
  children: React.ReactNode;
}

/**
 * Select root component
 */
export function Select({
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  allowClear = false,
  className,
  children,
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Find the selected option's display text
  const selectedOption = React.useMemo(() => {
    let found: React.ReactNode = null;
    React.Children.forEach(children, (child) => {
      if (React.isValidElement<SelectOptionProps>(child) && child.props.value === value) {
        found = child.props.children;
      }
    });
    return found;
  }, [children, value]);

  // Close on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <SelectContext.Provider value={{ value, onChange, open, setOpen }}>
      <div ref={containerRef} className="relative">
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          className={cn(
            'flex items-center justify-between w-full',
            'h-10 px-3 rounded-lg border border-neutral-300',
            'bg-white text-sm text-left',
            'transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
            disabled && 'opacity-50 cursor-not-allowed bg-neutral-100',
            !disabled && 'hover:border-neutral-400 cursor-pointer',
            open && 'border-indigo-500 ring-2 ring-indigo-500',
            className
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={cn(!selectedOption && 'text-neutral-400')}>
            {selectedOption || placeholder}
          </span>
          <div className="flex items-center gap-1">
            {allowClear && value && !disabled && (
              <span
                onClick={handleClear}
                className="p-1 hover:bg-neutral-100 rounded transition-colors"
              >
                <X className="h-3 w-3 text-neutral-400" />
              </span>
            )}
            <ChevronDown
              className={cn(
                'h-4 w-4 text-neutral-400 transition-transform',
                open && 'transform rotate-180'
              )}
            />
          </div>
        </button>

        {/* Dropdown */}
        {open && (
          <div
            className={cn(
              'absolute z-50 w-full mt-1',
              'bg-white border border-neutral-200 rounded-lg shadow-lg',
              'max-h-60 overflow-auto',
              'animate-in fade-in-0 zoom-in-95 duration-100'
            )}
            role="listbox"
          >
            {children}
          </div>
        )}
      </div>
    </SelectContext.Provider>
  );
}

// ============================================================================
// Select Option
// ============================================================================

interface SelectOptionProps {
  /** The option value */
  value: string;
  /** Whether the option is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Option content */
  children: React.ReactNode;
}

/**
 * Individual option in a Select dropdown
 */
export function SelectOption({
  value,
  disabled = false,
  className,
  children,
}: SelectOptionProps) {
  const { value: selectedValue, onChange, setOpen } = useSelectContext();
  const isSelected = value === selectedValue;

  const handleSelect = () => {
    if (!disabled) {
      onChange(value);
      setOpen(false);
    }
  };

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={handleSelect}
      className={cn(
        'flex items-center justify-between px-3 py-2 text-sm',
        'cursor-pointer transition-colors',
        isSelected && 'bg-indigo-50 text-indigo-700',
        !isSelected && !disabled && 'hover:bg-neutral-50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
      {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
    </div>
  );
}

// ============================================================================
// Select Divider
// ============================================================================

/**
 * Visual divider between option groups
 */
export function SelectDivider() {
  return <div className="h-px bg-neutral-200 my-1" />;
}

// ============================================================================
// Exports
// ============================================================================

export type { SelectProps, SelectOptionProps };
