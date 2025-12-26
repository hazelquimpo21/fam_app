'use client';

/**
 * ============================================================================
 * 📁 ProjectPicker Component
 * ============================================================================
 *
 * A dropdown component for selecting a project.
 * Used throughout the app for:
 * - Adding tasks to projects
 * - Filtering by project
 * - Linking items to projects
 *
 * Features:
 * - Shows project title and status
 * - Optional "Create new project" action
 * - Color indicators for projects
 * - "No project" option when allowed
 *
 * Usage:
 * ```tsx
 * <ProjectPicker
 *   value={projectId}
 *   onChange={setProjectId}
 *   placeholder="Add to project..."
 * />
 * ```
 *
 * ============================================================================
 */

import * as React from 'react';
import { ChevronDown, Check, X, Folder, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/shared/badge';
import { useProjects } from '@/lib/hooks/use-projects';
import { Spinner } from '@/components/ui/spinner';
import type { Project, ProjectStatus } from '@/types/database';

// ============================================================================
// Types
// ============================================================================

interface ProjectPickerProps {
  /** Currently selected project ID (null = no project) */
  value: string | null;
  /** Callback when selection changes */
  onChange: (projectId: string | null) => void;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Allow selecting "No project" */
  allowNone?: boolean;
  /** Whether to show "Create new project" option */
  allowCreate?: boolean;
  /** Callback when "Create new project" is clicked */
  onCreateNew?: () => void;
  /** Filter to only show certain statuses */
  statusFilter?: ProjectStatus[];
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get status badge variant for visual indication
 */
function getStatusVariant(status: ProjectStatus): 'default' | 'primary' | 'success' | 'warning' {
  switch (status) {
    case 'active':
      return 'primary';
    case 'completed':
      return 'success';
    case 'on_hold':
      return 'warning';
    default:
      return 'default';
  }
}

/**
 * Format status for display
 */
function formatStatus(status: ProjectStatus): string {
  return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================================================
// Component
// ============================================================================

/**
 * ProjectPicker - Select a project from a dropdown
 */
export function ProjectPicker({
  value,
  onChange,
  placeholder = 'Select project...',
  disabled = false,
  allowNone = true,
  allowCreate = false,
  onCreateNew,
  statusFilter,
  className,
}: ProjectPickerProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Fetch projects - filter to active/planning by default if no filter specified
  const { data: allProjects = [], isLoading } = useProjects();

  // Filter projects by status
  const projects = React.useMemo(() => {
    if (!statusFilter) {
      // Default: show non-archived, non-completed projects
      return allProjects.filter((p) =>
        ['planning', 'active', 'on_hold'].includes(p.status)
      );
    }
    return allProjects.filter((p) => statusFilter.includes(p.status));
  }, [allProjects, statusFilter]);

  // Find selected project
  const selectedProject = React.useMemo(() => {
    if (!value) return null;
    return allProjects.find((p) => p.id === value) || null;
  }, [allProjects, value]);

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

  const handleSelect = (projectId: string | null) => {
    onChange(projectId);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleCreateNew = () => {
    setOpen(false);
    onCreateNew?.();
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
        ) : selectedProject ? (
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: selectedProject.color || '#6366F1' }}
            />
            <span className="text-neutral-900 truncate">{selectedProject.title}</span>
          </div>
        ) : (
          <span className="text-neutral-400">{placeholder}</span>
        )}

        <div className="flex items-center gap-1 shrink-0">
          {selectedProject && !disabled && (
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
          {/* No project option */}
          {allowNone && (
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
                  <div className="h-3 w-3 rounded-full bg-neutral-300" />
                  <span>No project</span>
                </div>
                {value === null && <Check className="h-4 w-4 text-indigo-600" />}
              </div>
              <div className="h-px bg-neutral-200 my-1" />
            </>
          )}

          {/* Create new project option */}
          {allowCreate && onCreateNew && (
            <>
              <div
                role="button"
                onClick={handleCreateNew}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm',
                  'cursor-pointer transition-colors hover:bg-neutral-50',
                  'text-indigo-600 font-medium'
                )}
              >
                <Plus className="h-4 w-4" />
                <span>Create new project</span>
              </div>
              <div className="h-px bg-neutral-200 my-1" />
            </>
          )}

          {/* Projects list */}
          {projects.map((project) => (
            <ProjectOption
              key={project.id}
              project={project}
              isSelected={project.id === value}
              onSelect={() => handleSelect(project.id)}
            />
          ))}

          {/* Empty state */}
          {projects.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-neutral-500">
              <Folder className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
              No projects available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ProjectOption Sub-component
// ============================================================================

interface ProjectOptionProps {
  project: Project;
  isSelected: boolean;
  onSelect: () => void;
}

function ProjectOption({ project, isSelected, onSelect }: ProjectOptionProps) {
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
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="h-3 w-3 rounded-full shrink-0"
          style={{ backgroundColor: project.color || '#6366F1' }}
        />
        <span className="truncate">{project.title}</span>
        <Badge size="sm" variant={getStatusVariant(project.status)}>
          {formatStatus(project.status)}
        </Badge>
      </div>
      {isSelected && <Check className="h-4 w-4 text-indigo-600 shrink-0" />}
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export type { ProjectPickerProps };
