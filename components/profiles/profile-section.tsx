'use client';

/**
 * ============================================================================
 * 📦 ProfileSection Component
 * ============================================================================
 *
 * A styled container for profile form sections.
 * Provides consistent layout, icons, and completion indicators.
 *
 * Features:
 * - Section title with icon
 * - Optional completion percentage
 * - Collapsible (for long forms)
 * - Consistent styling
 *
 * @example
 * <ProfileSection
 *   title="Personality"
 *   icon={<User className="h-5 w-5" />}
 *   completion={60}
 * >
 *   <PersonalitySelector ... />
 * </ProfileSection>
 *
 * ============================================================================
 */

import * as React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { ProgressBar } from '@/components/shared/progress-bar';

// ============================================================================
// Types
// ============================================================================

interface ProfileSectionProps {
  /** Section title */
  title: string;
  /** Icon to display next to title */
  icon?: React.ReactNode;
  /** Optional completion percentage (0-100) */
  completion?: number;
  /** Whether section is collapsible */
  collapsible?: boolean;
  /** Initial collapsed state (only if collapsible) */
  defaultCollapsed?: boolean;
  /** Optional description text */
  description?: string;
  /** Section content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function ProfileSection({
  title,
  icon,
  completion,
  collapsible = false,
  defaultCollapsed = false,
  description,
  children,
  className,
}: ProfileSectionProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <section
      className={cn(
        'bg-white rounded-xl border border-neutral-200 overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between px-5 py-4',
          'border-b border-neutral-100',
          collapsible && 'cursor-pointer hover:bg-neutral-50 transition-colors'
        )}
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
        role={collapsible ? 'button' : undefined}
        aria-expanded={collapsible ? !isCollapsed : undefined}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          {icon && (
            <span className="text-indigo-600">
              {icon}
            </span>
          )}

          {/* Title and description */}
          <div>
            <h3 className="font-semibold text-neutral-900">{title}</h3>
            {description && (
              <p className="text-sm text-neutral-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Completion indicator */}
          {completion !== undefined && (
            <div className="flex items-center gap-2">
              <ProgressBar
                value={completion}
                size="sm"
                className="w-16"
              />
              <span className="text-xs font-medium text-neutral-500 w-8">
                {completion}%
              </span>
            </div>
          )}

          {/* Collapse toggle */}
          {collapsible && (
            <span className="text-neutral-400">
              {isCollapsed ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {(!collapsible || !isCollapsed) && (
        <div className="px-5 py-5">
          {children}
        </div>
      )}
    </section>
  );
}

// ============================================================================
// Profile Completion Card
// ============================================================================

interface ProfileCompletionCardProps {
  /** Overall completion percentage */
  percentage: number;
  /** Completed sections */
  completeSections: string[];
  /** Incomplete sections */
  incompleteSections: string[];
  /** Suggestion for next section */
  nextSuggestion?: string;
  /** Section labels */
  sectionLabels?: Record<string, string>;
  /** Additional className */
  className?: string;
}

/**
 * A card showing overall profile completion progress
 */
export function ProfileCompletionCard({
  percentage,
  completeSections,
  incompleteSections,
  nextSuggestion,
  sectionLabels,
  className,
}: ProfileCompletionCardProps) {
  const getLabel = (section: string) => {
    if (sectionLabels?.[section]) return sectionLabels[section];
    return section.charAt(0).toUpperCase() + section.slice(1).replace(/_/g, ' ');
  };

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-5 text-white',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Profile Completion</h3>
        <span className="text-2xl font-bold">{percentage}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/20 rounded-full h-2 mb-4">
        <div
          className="bg-white rounded-full h-2 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Sections breakdown */}
      <div className="flex flex-wrap gap-2 text-sm">
        {completeSections.map((section) => (
          <span
            key={section}
            className="inline-flex items-center px-2 py-0.5 rounded bg-white/20"
          >
            ✓ {getLabel(section)}
          </span>
        ))}
        {incompleteSections.slice(0, 3).map((section) => (
          <span
            key={section}
            className="inline-flex items-center px-2 py-0.5 rounded bg-white/10 opacity-75"
          >
            {getLabel(section)}
          </span>
        ))}
      </div>

      {/* Next suggestion */}
      {nextSuggestion && percentage < 100 && (
        <p className="text-sm mt-3 opacity-90">
          💡 Next: Complete your {getLabel(nextSuggestion).toLowerCase()} section
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Profile Field
// ============================================================================

interface ProfileFieldProps {
  /** Field label */
  label: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Optional help text */
  helpText?: string;
  /** Whether field is required */
  required?: boolean;
  /** Field content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * A styled field wrapper for profile form elements
 */
export function ProfileField({
  label,
  icon,
  helpText,
  required,
  children,
  className,
}: ProfileFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
        {icon && <span className="text-neutral-400">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {helpText && (
        <p className="text-xs text-neutral-500">{helpText}</p>
      )}
    </div>
  );
}
