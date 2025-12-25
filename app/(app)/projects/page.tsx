'use client';

/**
 * ============================================================================
 * 📁 Projects Page
 * ============================================================================
 *
 * Projects are containers for related tasks, notes, and progress tracking.
 * Each project has an owner, status, and can be linked to goals.
 *
 * Route: /projects
 *
 * Features:
 * - Project cards with progress bars
 * - Status filtering (planning, active, completed)
 * - Owner display
 * - Project detail navigation
 *
 * ============================================================================
 */

import { useEffect, useState, useMemo } from 'react';
import { FolderOpen, Plus, Clock, CheckCircle, Circle, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/shared/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';
import { useProjects } from '@/lib/hooks/use-projects';
import type { Project, ProjectStatus } from '@/types/database';

/**
 * Get status badge configuration
 */
function getStatusConfig(status: ProjectStatus) {
  const configs = {
    planning: { label: 'Planning', className: 'text-blue-600 border-blue-200 bg-blue-50' },
    active: { label: 'Active', className: 'bg-green-100 text-green-700' },
    completed: { label: 'Completed', className: 'bg-neutral-100 text-neutral-600' },
    on_hold: { label: 'On Hold', className: 'text-yellow-600 border-yellow-200 bg-yellow-50' },
    archived: { label: 'Archived', className: 'bg-neutral-100 text-neutral-400' },
  };
  return configs[status] || configs.planning;
}

/**
 * Format relative time
 */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * ProjectCard Component
 * Displays a single project with progress
 */
interface ProjectCardProps {
  project: Project;
}

function ProjectCard({ project }: ProjectCardProps) {
  const owner = project.owner as { name: string; color: string } | null;
  const statusConfig = getStatusConfig(project.status);

  // Use icon as emoji fallback
  const emoji = project.icon || '📁';

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="transition-all hover:shadow-md hover:border-neutral-300 h-full">
        <CardContent className="p-4">
          <div className="flex flex-col h-full space-y-3">
            {/* Header with emoji and title */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{emoji}</span>
                <div>
                  <h3 className="font-medium text-neutral-900">{project.title}</h3>
                  <div className={cn('inline-flex px-2 py-0.5 rounded text-xs font-medium mt-1', statusConfig.className)}>
                    {statusConfig.label}
                  </div>
                </div>
              </div>
              <button
                className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600"
                onClick={(e) => {
                  e.preventDefault();
                  logger.info('Project menu clicked', { projectId: project.id });
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Owner */}
            {owner && (
              <div className="flex items-center gap-2">
                <Avatar name={owner.name} color={owner.color} size="sm" />
                <span className="text-sm text-neutral-600">{owner.name}</span>
              </div>
            )}

            {/* Description (if any) */}
            {project.description && (
              <p className="text-sm text-neutral-500 line-clamp-2">{project.description}</p>
            )}

            {/* Footer with status and updated time */}
            <div className="space-y-1 mt-auto">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  {project.status === 'completed' ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                  {project.status === 'completed' ? 'Completed' : 'In progress'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Updated {formatRelativeTime(project.updated_at)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Loading skeleton for projects
 */
function ProjectsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="h-8 w-8 bg-neutral-200 rounded" />
                <div className="flex-1">
                  <div className="h-5 bg-neutral-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-neutral-100 rounded w-16" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-neutral-100 rounded-full" />
                <div className="h-4 bg-neutral-100 rounded w-20" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 bg-neutral-100 rounded w-24" />
                <div className="h-3 bg-neutral-100 rounded w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Filter tabs for project status
 */
type FilterValue = ProjectStatus | 'all';

const statusFilters: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'planning', label: 'Planning' },
  { value: 'completed', label: 'Completed' },
];

/**
 * Projects Page Component
 */
export default function ProjectsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');

  // Fetch projects from database
  const { data: projects = [], isLoading, error } = useProjects();

  // Filter projects based on selected filter
  const filteredProjects = useMemo(() => {
    if (activeFilter === 'all') return projects;
    return projects.filter((p) => p.status === activeFilter);
  }, [projects, activeFilter]);

  // Log page load for debugging
  useEffect(() => {
    logger.info('Projects page loaded', {
      totalProjects: projects.length,
      filteredCount: filteredProjects.length,
      activeFilter,
    });
    logger.divider('Projects');
  }, [projects.length, filteredProjects.length, activeFilter]);

  // Error state
  if (error) {
    logger.error('Failed to load projects', { error });
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<FolderOpen className="h-16 w-16 text-red-500" />}
              title="Failed to load projects"
              description="There was an error loading your projects. Please try again."
              action={{
                label: 'Retry',
                onClick: () => window.location.reload(),
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-6 w-6 text-purple-600" />
          <h1 className="text-xl font-semibold text-neutral-900">Projects</h1>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>
          New Project
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
              activeFilter === filter.value
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && <ProjectsSkeleton />}

      {/* Projects grid or empty state */}
      {!isLoading && filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<FolderOpen className="h-16 w-16 text-purple-500" />}
              title={activeFilter === 'all' ? 'No projects yet' : `No ${activeFilter} projects`}
              description={
                activeFilter === 'all'
                  ? 'Create your first project to organize related tasks!'
                  : `You don't have any ${activeFilter} projects at the moment.`
              }
              action={{
                label: 'New Project',
                onClick: () => logger.info('New project clicked'),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        !isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
