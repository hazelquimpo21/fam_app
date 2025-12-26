'use client';

/**
 * ============================================================================
 * 👥 FamilyMemberPicker Component
 * ============================================================================
 *
 * A dropdown component for selecting a family member.
 * Used throughout the app for:
 * - Task assignment
 * - Goal ownership
 * - Habit ownership
 * - Filtering by person
 *
 * Features:
 * - Shows avatar and name for each member
 * - "Unassigned" option when allowed
 * - Current user indicated with "(you)"
 * - Excludes specified member IDs
 *
 * Usage:
 * ```tsx
 * <FamilyMemberPicker
 *   value={assignedToId}
 *   onChange={setAssignedToId}
 *   placeholder="Assign to..."
 *   allowUnassigned
 * />
 * ```
 *
 * ============================================================================
 */

import * as React from 'react';
import { ChevronDown, Check, X, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Avatar } from '@/components/shared/avatar';
import { useFamilyMembers, useCurrentFamilyMember } from '@/lib/hooks/use-family';
import { Spinner } from '@/components/ui/spinner';
import type { FamilyMember } from '@/types/database';

// ============================================================================
// Types
// ============================================================================

interface FamilyMemberPickerProps {
  /** Currently selected member ID (null = unassigned) */
  value: string | null;
  /** Callback when selection changes */
  onChange: (memberId: string | null) => void;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Allow selecting "Unassigned" */
  allowUnassigned?: boolean;
  /** Member IDs to exclude from the list */
  excludeIds?: string[];
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * FamilyMemberPicker - Select a family member from a dropdown
 */
export function FamilyMemberPicker({
  value,
  onChange,
  placeholder = 'Select person...',
  disabled = false,
  allowUnassigned = true,
  excludeIds = [],
  className,
}: FamilyMemberPickerProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Fetch family members
  const { data: members = [], isLoading } = useFamilyMembers();
  const { data: currentMember } = useCurrentFamilyMember();

  // Filter out excluded members
  const availableMembers = React.useMemo(() => {
    return members.filter((member) => !excludeIds.includes(member.id));
  }, [members, excludeIds]);

  // Find selected member
  const selectedMember = React.useMemo(() => {
    if (!value) return null;
    return members.find((m) => m.id === value) || null;
  }, [members, value]);

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

  const handleSelect = (memberId: string | null) => {
    onChange(memberId);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
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
          open && 'border-indigo-500 ring-2 ring-indigo-500'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-neutral-400">
            <Spinner size="sm" />
            <span>Loading...</span>
          </div>
        ) : selectedMember ? (
          <div className="flex items-center gap-2">
            <Avatar
              name={selectedMember.name}
              color={selectedMember.color}
              src={selectedMember.avatar_url}
              size="xs"
            />
            <span className="text-neutral-900">
              {selectedMember.name}
              {currentMember?.id === selectedMember.id && (
                <span className="text-neutral-400 ml-1">(you)</span>
              )}
            </span>
          </div>
        ) : (
          <span className="text-neutral-400">{placeholder}</span>
        )}

        <div className="flex items-center gap-1">
          {selectedMember && !disabled && (
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
          {/* Unassigned option */}
          {allowUnassigned && (
            <>
              <div
                role="option"
                aria-selected={value === null}
                onClick={() => handleSelect(null)}
                className={cn(
                  'flex items-center justify-between px-3 py-2 text-sm',
                  'cursor-pointer transition-colors',
                  value === null && 'bg-indigo-50 text-indigo-700',
                  value !== null && 'hover:bg-neutral-50'
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-neutral-200 flex items-center justify-center">
                    <User className="h-3 w-3 text-neutral-400" />
                  </div>
                  <span>Unassigned</span>
                </div>
                {value === null && <Check className="h-4 w-4 text-indigo-600" />}
              </div>
              <div className="h-px bg-neutral-200 my-1" />
            </>
          )}

          {/* Family members */}
          {availableMembers.map((member) => (
            <MemberOption
              key={member.id}
              member={member}
              isSelected={member.id === value}
              isCurrentUser={member.id === currentMember?.id}
              onSelect={() => handleSelect(member.id)}
            />
          ))}

          {/* Empty state */}
          {availableMembers.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-neutral-500">
              No family members available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MemberOption Sub-component
// ============================================================================

interface MemberOptionProps {
  member: FamilyMember;
  isSelected: boolean;
  isCurrentUser: boolean;
  onSelect: () => void;
}

function MemberOption({ member, isSelected, isCurrentUser, onSelect }: MemberOptionProps) {
  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={onSelect}
      className={cn(
        'flex items-center justify-between px-3 py-2 text-sm',
        'cursor-pointer transition-colors',
        isSelected && 'bg-indigo-50 text-indigo-700',
        !isSelected && 'hover:bg-neutral-50'
      )}
    >
      <div className="flex items-center gap-2">
        <Avatar
          name={member.name}
          color={member.color}
          src={member.avatar_url}
          size="xs"
        />
        <span>
          {member.name}
          {isCurrentUser && (
            <span className="text-neutral-400 ml-1">(you)</span>
          )}
        </span>
      </div>
      {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export type { FamilyMemberPickerProps };
