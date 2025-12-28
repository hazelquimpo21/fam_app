'use client';

/**
 * ============================================================================
 * 📁 Projects Hooks
 * ============================================================================
 *
 * React Query hooks for project operations:
 * - Fetching projects (with filters)
 * - Creating projects
 * - Updating projects
 * - Changing project status
 * - Deleting projects
 *
 * Projects are containers for related tasks that work toward a common outcome.
 * They can be promoted from someday items or created directly.
 *
 * ============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { queryKeys, type ProjectFilters } from '@/lib/query-keys';
import { logger } from '@/lib/utils/logger';
import type { Project, ProjectStatus } from '@/types/database';

// ============================================================================
// 📖 QUERY HOOKS (Read operations)
// ============================================================================

/**
 * Fetch all projects with optional filters
 *
 * @param filters - Optional filters for status or owner
 * @returns Query result with projects array
 *
 * @example
 * const { data: projects, isLoading } = useProjects({ status: 'active' })
 */
export function useProjects(filters: ProjectFilters = {}) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: async (): Promise<Project[]> => {
      logger.info('📁 Fetching projects...', { filters });

      let query = supabase
        .from('projects')
        .select(`
          *,
          owner:family_members!owner_id(id, name, color, avatar_url)
        `)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.ownerId) {
        query = query.eq('owner_id', filters.ownerId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('❌ Failed to fetch projects', { error: error.message });
        throw error;
      }

      logger.success(`✅ Fetched ${data?.length || 0} projects`);
      return data as Project[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch active projects only
 * Convenience hook for commonly needed active projects
 */
export function useActiveProjects() {
  return useProjects({ status: 'active' });
}

/**
 * Fetch a single project by ID with its tasks
 *
 * @param id - Project UUID
 * @returns Query result with project object
 */
export function useProject(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: async (): Promise<Project> => {
      logger.info('📁 Fetching project...', { id });

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          owner:family_members!owner_id(id, name, color, avatar_url)
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        logger.error('❌ Failed to fetch project', { error: error.message });
        throw error;
      }

      logger.success('✅ Project loaded', { title: data?.title });
      return data as Project;
    },
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minute
  });
}

// ============================================================================
// ✏️ MUTATION HOOKS (Write operations)
// ============================================================================

/**
 * Input type for creating a project
 */
export interface CreateProjectInput {
  title: string;
  description?: string;
  notes?: string;
  owner_id?: string;
  target_date?: string;
  color?: string;
  icon?: string;
  tags?: string[];
  status?: ProjectStatus;
  promoted_from_id?: string;
}

/**
 * Create a new project
 *
 * This hook fetches the user's family_id before creating the project.
 * The family_id is required for RLS policies to work correctly.
 *
 * @example
 * const createProject = useCreateProject()
 * createProject.mutate({
 *   title: 'Kitchen Renovation',
 *   description: 'Complete remodel of the kitchen',
 *   color: '#8B5CF6'
 * })
 */
export function useCreateProject() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      logger.info('➕ Creating project...', { title: input.title });

      // Step 1: Get the current user's family_id and member_id
      // This is required for RLS policies to allow the insert
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        logger.error('❌ No authenticated user when creating project');
        throw new Error('You must be logged in to create projects');
      }

      const { data: member, error: memberError } = await supabase
        .from('family_members')
        .select('id, family_id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (memberError) {
        logger.error('❌ Failed to get family info for project creation', { error: memberError.message });
        throw new Error('Failed to get your family information');
      }

      if (!member) {
        logger.error('❌ User has no family membership - cannot create project');
        throw new Error('Please complete onboarding to create projects');
      }

      logger.debug('👤 Got family context for project', { familyId: member.family_id, memberId: member.id });

      // Step 2: Create the project with family_id and created_by
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...input,
          family_id: member.family_id,
          created_by: member.id,
          status: input.status || 'planning',
        })
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to create project', { error: error.message, code: error.code, details: error.details });
        throw error;
      }

      logger.success('✅ Project created!', { title: data?.title, projectId: data?.id });
      return data as Project;
    },

    onSuccess: () => {
      // Invalidate project queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('📁 Project created!');
    },

    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to create project';
      toast.error(message);
      logger.error('Create project error', { error });
    },
  });
}

/**
 * Update an existing project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      logger.info('📝 Updating project...', { id });

      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to update project', { error: error.message });
        throw error;
      }

      logger.success('✅ Project updated!');
      return data as Project;
    },

    onSuccess: (data) => {
      // Update the cache with new data
      queryClient.setQueryData(queryKeys.projects.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },

    onError: () => {
      toast.error('Failed to update project');
    },
  });
}

/**
 * Change project status
 *
 * @example
 * const changeStatus = useChangeProjectStatus()
 * changeStatus.mutate({ id: projectId, status: 'active' })
 */
export function useChangeProjectStatus() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProjectStatus }) => {
      logger.info('🔄 Changing project status...', { id, status });

      const updates: Partial<Project> = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Set completed_at if marking as completed
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to change project status', { error: error.message });
        throw error;
      }

      logger.success('✅ Project status updated!');
      return data as Project;
    },

    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.projects.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });

      // Show appropriate toast based on new status
      const statusMessages: Record<ProjectStatus, string> = {
        planning: '📋 Project moved to planning',
        active: '🚀 Project is now active',
        on_hold: '⏸️ Project is on hold',
        completed: '🎉 Project completed!',
        archived: '📦 Project archived',
      };
      toast.success(statusMessages[data.status]);
    },

    onError: () => {
      toast.error('Failed to update project status');
    },
  });
}

/**
 * Complete a project
 * Convenience mutation for marking a project as completed
 */
export function useCompleteProject() {
  const changeStatus = useChangeProjectStatus();

  return {
    ...changeStatus,
    mutate: (projectId: string) => changeStatus.mutate({ id: projectId, status: 'completed' }),
    mutateAsync: (projectId: string) => changeStatus.mutateAsync({ id: projectId, status: 'completed' }),
  };
}

/**
 * Delete a project (soft delete)
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      logger.info('🗑️ Deleting project...', { projectId });

      const { error } = await supabase
        .from('projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', projectId);

      if (error) {
        logger.error('❌ Failed to delete project', { error: error.message });
        throw error;
      }

      logger.success('✅ Project deleted');
      return projectId;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast('Project deleted');
    },

    onError: () => {
      toast.error('Failed to delete project');
    },
  });
}

/**
 * Promote a someday item to a project
 *
 * This hook fetches the user's family_id before creating the project.
 * The family_id is required for RLS policies to work correctly.
 *
 * @example
 * const promote = usePromoteSomedayToProject()
 * promote.mutate({ somedayId: '...', title: 'New Project Title' })
 */
export function usePromoteSomedayToProject() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ somedayId, ...projectData }: CreateProjectInput & { somedayId: string }) => {
      logger.info('⬆️ Promoting someday item to project...', { somedayId });

      // Step 1: Get the current user's family_id and member_id
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        logger.error('❌ No authenticated user when promoting someday');
        throw new Error('You must be logged in to promote to project');
      }

      const { data: member, error: memberError } = await supabase
        .from('family_members')
        .select('id, family_id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (memberError) {
        logger.error('❌ Failed to get family info for promotion', { error: memberError.message });
        throw new Error('Failed to get your family information');
      }

      if (!member) {
        logger.error('❌ User has no family membership - cannot promote');
        throw new Error('Please complete onboarding first');
      }

      logger.debug('👤 Got family context for promotion', { familyId: member.family_id, memberId: member.id });

      // Step 2: Create the project with family_id and created_by
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          family_id: member.family_id,
          created_by: member.id,
          status: 'planning',
          promoted_from_id: somedayId,
        })
        .select()
        .single();

      if (projectError) {
        logger.error('❌ Failed to create project from someday', { error: projectError.message, code: projectError.code });
        throw projectError;
      }

      // Update the someday item to link to the new project
      const { error: somedayError } = await supabase
        .from('someday_items')
        .update({
          promoted_to_project_id: project.id,
          is_archived: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', somedayId);

      if (somedayError) {
        logger.warn('⚠️ Project created but failed to update someday item', { error: somedayError.message });
      }

      logger.success('✅ Someday item promoted to project!', { projectId: project.id });
      return project as Project;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      // Also invalidate someday items if we had that query key
      toast.success('🎉 Dream promoted to project!');
    },

    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to promote to project';
      toast.error(message);
      logger.error('Promote to project error', { error });
    },
  });
}
