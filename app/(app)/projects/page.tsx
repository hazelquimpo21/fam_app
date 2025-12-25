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
 * Features (planned):
 * - Project cards with progress bars
 * - Status filtering (planning, active, completed)
 * - Owner filtering
 * - Project detail view with tasks and notes
 *
 * ============================================================================
 */

import { useEffect } from 'react';
import { FolderOpen, Plus, Clock, CheckCircle, Circle, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/shared/badge';
import { Avatar } from '@/components/shared/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';

/**
 * Project status type
 */
type ProjectStatus = 'planning' | 'active' | 'completed' | 'on_hold';

/**
 * Mock projects data
 * In production, this would come from useProjects() hook
 */
const mockProjects = [
  {
    id: '1',
    title: 'Summer Camps 2025',
    emoji: '🏕️',
    status: 'planning' as ProjectStatus,
    tasksCompleted: 4,
    tasksTotal: 10,
    owner: { name: 'Hazel', color: '#6366F1' },
    updatedAt: '2 days ago',
  },
  {
    id: '2',
    title: 'Bathroom Renovation',
    emoji: '🛁',
    status: 'active' as ProjectStatus,
    tasksCompleted: 2,
    tasksTotal: 8,
    owner: { name: 'Mike', color: '#10B981' },
    updatedAt: 'today',
  },
  {
    id: '3',
    title: 'Japan Trip Planning',
    emoji: '🗾',
    status: 'planning' as ProjectStatus,
    tasksCompleted: 0,
    tasksTotal: 3,
    owner: { name: 'Hazel', color: '#6366F1' },
    updatedAt: '1 week ago',
  },
  {
    id: '4',
    title: 'Holiday Gifts 2024',
    emoji: '🎁',
    status: 'completed' as ProjectStatus,
    tasksCompleted: 12,
    tasksTotal: 12,
    owner: { name: 'Hazel', color: '#6366F1' },
    updatedAt: '3 days ago',
  },
];

/**
 * Get status badge configuration
 */
function getStatusConfig(status: ProjectStatus) {
  const configs = {
    planning: { label: 'Planning', variant: 'outline' as const, className: 'text-blue-600 border-blue-200 bg-blue-50' },
    active: { label: 'Active', variant: 'default' as const, className: 'bg-green-100 text-green-700' },
    completed: { label: 'Completed', variant: 'default' as const, className: 'bg-neutral-100 text-neutral-600' },
    on_hold: { label: 'On Hold', variant: 'outline' as const, className: 'text-yellow-600 border-yellow-200 bg-yellow-50' },
  };
  return configs[status];
}

/**
 * ProjectCard Component
 * Displays a single project with progress
 */
interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    emoji: string;
    status: ProjectStatus;
    tasksCompleted: number;
    tasksTotal: number;
    owner: { name: string; color: string };
    updatedAt: string;
  };
}

function ProjectCard({ project }: ProjectCardProps) {
  const progress = project.tasksTotal > 0
    ? Math.round((project.tasksCompleted / project.tasksTotal) * 100)
    : 0;
  const statusConfig = getStatusConfig(project.status);

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="transition-all hover:shadow-md hover:border-neutral-300 h-full">
        <CardContent className="p-4">
          <div className="flex flex-col h-full space-y-3">
            {/* Header with emoji and title */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{project.emoji}</span>
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
            <div className="flex items-center gap-2">
              <Avatar name={project.owner.name} color={project.owner.color} size="sm" />
              <span className="text-sm text-neutral-600">{project.owner.name}</span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1 mt-auto">
              <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    project.status === 'completed'
                      ? 'bg-green-500'
                      : 'bg-gradient-to-r from-indigo-400 to-purple-500'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  {project.status === 'completed' ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                  {project.tasksCompleted}/{project.tasksTotal} tasks
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Updated {project.updatedAt}
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
 * Filter tabs for project status
 */
const statusFilters: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'planning', label: 'Planning' },
  { value: 'completed', label: 'Completed' },
];

/**
 * Projects Page Component
 */
export default function ProjectsPage() {
  // Log page load for debugging
  useEffect(() => {
    logger.info('Projects page loaded', { projectCount: mockProjects.length });
    logger.divider('Projects');
  }, []);

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
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filter.value === 'all'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Projects grid or empty state */}
      {mockProjects.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<FolderOpen className="h-16 w-16 text-purple-500" />}
              title="No projects yet"
              description="Create your first project to organize related tasks!"
              action={{
                label: 'New Project',
                onClick: () => logger.info('New project clicked'),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
