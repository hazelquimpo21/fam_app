'use client';

/**
 * ============================================================================
 * 📁 ProjectModal Component
 * ============================================================================
 *
 * A comprehensive modal for creating and editing projects.
 * Projects are containers for related tasks that work toward a common outcome.
 *
 * Features:
 * - Create new projects with full details
 * - Edit existing projects
 * - Set project status (planning, active, on_hold, completed)
 * - Assign owner
 * - Set target date
 * - Choose icon/emoji
 * - Keyboard shortcuts (Cmd+Enter to save)
 *
 * Usage:
 * ```tsx
 * // Create mode
 * <ProjectModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   initialTitle="Project from inbox"
 * />
 *
 * // Edit mode
 * <ProjectModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   project={existingProject}
 * />
 * ```
 *
 * User Stories Addressed:
 * - US-6.1: Create Project with details
 * - US-6.4: View and edit project
 * - US-2.3: Triage inbox item to project (via inbox page)
 *
 * Data Flow:
 * 1. Modal opens with optional project data or initialTitle
 * 2. User fills form fields
 * 3. On save: creates/updates project via hooks
 * 4. onSuccess callback fires (optional)
 * 5. Modal closes
 *
 * ============================================================================
 */

import * as React from 'react';
import { FolderOpen, Calendar, User, FileText, Flag, Smile } from 'lucide-react';
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
import { useCreateProject, useUpdateProject, type CreateProjectInput } from '@/lib/hooks/use-projects';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils/cn';
import type { Project, ProjectStatus } from '@/types/database';

// ============================================================================
// Types
// ============================================================================

interface ProjectModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Existing project to edit (if provided, modal is in edit mode) */
  project?: Project | null;
  /** Initial title (for quick create from inbox) */
  initialTitle?: string;
  /** Callback when project is saved successfully */
  onSuccess?: (project: Project) => void;
}

interface ProjectFormData {
  title: string;
  description: string;
  notes: string;
  owner_id: string | null;
  status: ProjectStatus;
  target_date: string;
  icon: string;
  color: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Available project status options with labels and colors
 */
const STATUS_OPTIONS: { value: ProjectStatus; label: string; color: string }[] = [
  { value: 'planning', label: 'Planning', color: 'text-blue-600 border-blue-200 bg-blue-50' },
  { value: 'active', label: 'Active', color: 'text-green-600 border-green-200 bg-green-50' },
  { value: 'on_hold', label: 'On Hold', color: 'text-yellow-600 border-yellow-200 bg-yellow-50' },
  { value: 'completed', label: 'Completed', color: 'text-neutral-600 border-neutral-200 bg-neutral-50' },
];

/**
 * Common project icons (emojis) for quick selection
 */
const ICON_OPTIONS = ['📁', '🚀', '🏠', '✈️', '🎯', '🎉', '💼', '📚', '🛠️', '🎨', '💪', '🌱'];

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format date for input (YYYY-MM-DD)
 */
function formatDateForInput(dateStr: string | null): string {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
}

/**
 * Get initial form data from project or defaults
 */
function getInitialFormData(
  project?: Project | null,
  initialTitle?: string
): ProjectFormData {
  if (project) {
    return {
      title: project.title,
      description: project.description || '',
      notes: project.notes || '',
      owner_id: project.owner_id,
      status: project.status,
      target_date: formatDateForInput(project.target_date),
      icon: project.icon || '📁',
      color: project.color || '#8B5CF6', // Default purple
    };
  }

  return {
    title: initialTitle || '',
    description: '',
    notes: '',
    owner_id: null,
    status: 'planning',
    target_date: '',
    icon: '📁',
    color: '#8B5CF6',
  };
}

// ============================================================================
// Component
// ============================================================================

/**
 * ProjectModal - Create or edit a project
 *
 * Projects are containers for related tasks. They have:
 * - Title and description
 * - Status (planning → active → completed)
 * - Owner (family member)
 * - Target date
 * - Icon/emoji for visual identification
 */
export function ProjectModal({
  open,
  onOpenChange,
  project,
  initialTitle,
  onSuccess,
}: ProjectModalProps) {
  const isEditMode = !!project;

  // Form state
  const [formData, setFormData] = React.useState<ProjectFormData>(() =>
    getInitialFormData(project, initialTitle)
  );
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  // Mutations
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const isPending = createProject.isPending || updateProject.isPending;

  // Reset form when project changes or modal opens
  React.useEffect(() => {
    if (open) {
      logger.info('📁 ProjectModal opened', { isEditMode, projectId: project?.id });
      setFormData(getInitialFormData(project, initialTitle));
      // Show advanced if editing and has advanced fields set
      if (project) {
        setShowAdvanced(!!project.notes || !!project.description);
      } else {
        setShowAdvanced(false);
      }
    }
  }, [open, project, initialTitle, isEditMode]);

  /**
   * Update a single form field
   */
  const updateField = <K extends keyof ProjectFormData>(
    field: K,
    value: ProjectFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      logger.warn('⚠️ Project title is required');
      return;
    }

    logger.info('💾 Saving project...', { isEditMode, title: formData.title });

    try {
      if (isEditMode && project) {
        // Update existing project
        const result = await updateProject.mutateAsync({
          id: project.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          notes: formData.notes.trim() || null,
          owner_id: formData.owner_id,
          status: formData.status,
          target_date: formData.target_date || null,
          icon: formData.icon,
          color: formData.color,
        });
        logger.success('✅ Project updated!', { id: result.id });
        onSuccess?.(result);
      } else {
        // Create new project
        const projectInput: CreateProjectInput = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          owner_id: formData.owner_id || undefined,
          status: formData.status,
          target_date: formData.target_date || undefined,
          icon: formData.icon,
          color: formData.color,
        };
        const result = await createProject.mutateAsync(projectInput);
        logger.success('✅ Project created!', { id: result.id });
        onSuccess?.(result);
      }

      // Close modal on success
      onOpenChange(false);
    } catch (error) {
      logger.error('❌ Failed to save project', { error });
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
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-purple-500" />
            {isEditMode ? 'Edit Project' : 'Create Project'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col flex-1 overflow-hidden">
          <DialogBody className="space-y-4 overflow-y-auto flex-1">
            {/* Icon and Title row */}
            <div className="flex gap-3 items-start">
              {/* Icon selector */}
              <div className="relative">
                <button
                  type="button"
                  className="h-12 w-12 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-2xl transition-colors"
                  onClick={() => {
                    // Cycle through icons
                    const currentIndex = ICON_OPTIONS.indexOf(formData.icon);
                    const nextIndex = (currentIndex + 1) % ICON_OPTIONS.length;
                    updateField('icon', ICON_OPTIONS[nextIndex]);
                  }}
                  title="Click to change icon"
                >
                  {formData.icon}
                </button>
              </div>

              {/* Title input */}
              <div className="flex-1">
                <label htmlFor="project-title" className="sr-only">
                  Project title
                </label>
                <Input
                  id="project-title"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="What's the project?"
                  autoFocus
                  className="text-lg font-medium"
                />
              </div>
            </div>

            {/* Status selection */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-2">
                <Flag className="h-4 w-4" />
                Status
              </label>
              <div className="grid grid-cols-4 gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField('status', option.value)}
                    className={cn(
                      'py-2 px-3 rounded-lg text-xs font-medium transition-colors',
                      'border',
                      formData.status === option.value
                        ? option.color
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Owner */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                <User className="h-4 w-4" />
                Owner
              </label>
              <FamilyMemberPicker
                value={formData.owner_id}
                onChange={(id) => updateField('owner_id', id)}
                placeholder="Who owns this project?"
              />
            </div>

            {/* Target date */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                <Calendar className="h-4 w-4" />
                Target date
              </label>
              <Input
                type="date"
                value={formData.target_date}
                onChange={(e) => updateField('target_date', e.target.value)}
              />
            </div>

            {/* Toggle advanced fields */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {showAdvanced ? 'Hide' : 'Show'} more options
            </button>

            {/* Advanced fields */}
            {showAdvanced && (
              <div className="space-y-4 pt-2 border-t border-neutral-200">
                {/* Description */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                    <FileText className="h-4 w-4" />
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="What's this project about?"
                    rows={2}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border border-neutral-300',
                      'text-sm resize-none',
                      'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                    )}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                    <FileText className="h-4 w-4" />
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Additional notes, links, or references..."
                    rows={3}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border border-neutral-300',
                      'text-sm resize-none',
                      'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                    )}
                  />
                </div>

                {/* Icon picker (expanded) */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5">
                    <Smile className="h-4 w-4" />
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ICON_OPTIONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => updateField('icon', icon)}
                        className={cn(
                          'h-10 w-10 rounded-lg flex items-center justify-center text-xl transition-colors',
                          formData.icon === icon
                            ? 'bg-indigo-100 ring-2 ring-indigo-500'
                            : 'bg-neutral-100 hover:bg-neutral-200'
                        )}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
              disabled={!formData.title.trim()}
            >
              {isEditMode ? 'Save Changes' : 'Create Project'}
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

export type { ProjectModalProps };
