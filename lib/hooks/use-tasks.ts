'use client';

/**
 * ============================================================================
 * ✅ Tasks Hooks
 * ============================================================================
 *
 * React Query hooks for task operations:
 * - Fetching tasks (with filters)
 * - Creating tasks
 * - Updating tasks
 * - Completing tasks
 * - Deleting tasks
 *
 * ============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { queryKeys, type TaskFilters } from '@/lib/query-keys';
import { logger } from '@/lib/utils/logger';
import type { Task, TaskStatus } from '@/types/database';

// ============================================================================
// 📖 QUERY HOOKS (Read operations)
// ============================================================================

/**
 * Fetch all tasks with optional filters
 *
 * @example
 * const { data: tasks, isLoading } = useTasks({ status: 'active' })
 */
export function useTasks(filters: TaskFilters = {}) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: async (): Promise<Task[]> => {
      logger.info('📋 Fetching tasks...', { filters });

      let query = supabase
        .from('tasks')
        .select(`
          *,
          assigned_to:family_members!assigned_to_id(id, name, color, avatar_url),
          project:projects(id, title, color)
        `)
        .is('deleted_at', null)
        .order('due_date', { ascending: true, nullsFirst: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.assignedTo) {
        query = query.eq('assigned_to_id', filters.assignedTo);
      }
      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters.dueBefore) {
        query = query.lte('due_date', filters.dueBefore);
      }
      if (filters.dueAfter) {
        query = query.gte('due_date', filters.dueAfter);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('❌ Failed to fetch tasks', { error: error.message });
        throw error;
      }

      logger.success(`✅ Fetched ${data?.length || 0} tasks`);
      return data as Task[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch inbox tasks (status = 'inbox')
 */
export function useInboxTasks() {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.tasks.inbox(),
    queryFn: async (): Promise<Task[]> => {
      logger.info('📥 Fetching inbox tasks...');

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'inbox')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('❌ Failed to fetch inbox', { error: error.message });
        throw error;
      }

      logger.success(`✅ Inbox: ${data?.length || 0} items`);
      return data as Task[];
    },
    staleTime: 1000 * 30, // 30 seconds - inbox changes frequently
  });
}

/**
 * Fetch today's tasks (due or scheduled today)
 */
export function useTodayTasks() {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  return useQuery({
    queryKey: queryKeys.tasks.today(),
    queryFn: async (): Promise<Task[]> => {
      logger.info('📅 Fetching today\'s tasks...', { date: today });

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to:family_members!assigned_to_id(id, name, color),
          project:projects(id, title)
        `)
        .or(`due_date.eq.${today},scheduled_date.eq.${today}`)
        .neq('status', 'done')
        .is('deleted_at', null)
        .order('due_date', { ascending: true });

      if (error) {
        logger.error('❌ Failed to fetch today\'s tasks', { error: error.message });
        throw error;
      }

      logger.success(`✅ Today: ${data?.length || 0} tasks`);
      return data as Task[];
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Fetch overdue tasks (due before today, not completed)
 */
export function useOverdueTasks() {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  return useQuery({
    queryKey: queryKeys.tasks.overdue(),
    queryFn: async (): Promise<Task[]> => {
      logger.info('⚠️ Fetching overdue tasks...', { beforeDate: today });

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to:family_members!assigned_to_id(id, name, color)
        `)
        .lt('due_date', today)
        .neq('status', 'done')
        .is('deleted_at', null)
        .order('due_date', { ascending: true });

      if (error) {
        logger.error('❌ Failed to fetch overdue tasks', { error: error.message });
        throw error;
      }

      logger.success(`✅ Overdue: ${data?.length || 0} tasks`);
      return data as Task[];
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Fetch a single task by ID
 */
export function useTask(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: async (): Promise<Task> => {
      logger.info('📋 Fetching task...', { id });

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to:family_members!assigned_to_id(id, name, color, avatar_url),
          project:projects(id, title, color),
          goal:goals(id, title),
          subtasks(id, title, is_complete, sort_order)
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        logger.error('❌ Failed to fetch task', { error: error.message });
        throw error;
      }

      logger.success('✅ Task loaded', { title: data?.title });
      return data as Task;
    },
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minute
  });
}

// ============================================================================
// ✏️ MUTATION HOOKS (Write operations)
// ============================================================================

/**
 * Input type for creating a task
 */
export interface CreateTaskInput {
  title: string;
  description?: string;
  due_date?: string;
  scheduled_date?: string;
  assigned_to_id?: string;
  project_id?: string;
  goal_id?: string;
  priority?: number;
  status?: TaskStatus;
}

/**
 * Create a new task
 *
 * @example
 * const createTask = useCreateTask()
 * createTask.mutate({ title: 'Buy groceries', due_date: '2024-12-25' })
 */
export function useCreateTask() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      logger.info('➕ Creating task...', { title: input.title });

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...input,
          status: input.status || 'inbox',
        })
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to create task', { error: error.message });
        throw error;
      }

      logger.success('✅ Task created!', { title: data?.title });
      return data as Task;
    },

    onSuccess: (data) => {
      // Invalidate task queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });

      // Show success toast
      if (data.status === 'inbox') {
        toast.success('📥 Added to inbox');
      } else {
        toast.success('✅ Task created!');
      }
    },

    onError: (error) => {
      toast.error('Failed to create task. Please try again.');
      logger.error('Create task error', { error });
    },
  });
}

/**
 * Update an existing task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      logger.info('📝 Updating task...', { id });

      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to update task', { error: error.message });
        throw error;
      }

      logger.success('✅ Task updated!');
      return data as Task;
    },

    onSuccess: (data) => {
      // Update the cache with new data
      queryClient.setQueryData(queryKeys.tasks.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },

    onError: () => {
      toast.error('Failed to update task');
    },
  });
}

/**
 * Complete a task (mark as done)
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      logger.info('✅ Completing task...', { taskId });

      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: 'done',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to complete task', { error: error.message });
        throw error;
      }

      logger.success('🎉 Task completed!');
      return data as Task;
    },

    // Optimistic update for instant feedback
    onMutate: async (taskId) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });

      // Snapshot current data for rollback
      const previousData = queryClient.getQueryData(queryKeys.tasks.lists());

      // Optimistically update the UI
      queryClient.setQueriesData(
        { queryKey: queryKeys.tasks.all },
        (old: Task[] | undefined) => {
          if (!old) return old;
          return old.map((task) =>
            task.id === taskId
              ? { ...task, status: 'done' as TaskStatus, completed_at: new Date().toISOString() }
              : task
          );
        }
      );

      return { previousData };
    },

    onError: (_err, _taskId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.tasks.lists(), context.previousData);
      }
      toast.error('Failed to complete task');
    },

    onSuccess: () => {
      toast.success('🎉 Task completed!');
    },

    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}

/**
 * Delete a task (soft delete)
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      logger.info('🗑️ Deleting task...', { taskId });

      const { error } = await supabase
        .from('tasks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) {
        logger.error('❌ Failed to delete task', { error: error.message });
        throw error;
      }

      logger.success('✅ Task deleted');
      return taskId;
    },

    // Optimistic update
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });

      const previousData = queryClient.getQueryData(queryKeys.tasks.lists());

      queryClient.setQueriesData(
        { queryKey: queryKeys.tasks.all },
        (old: Task[] | undefined) => old?.filter((t) => t.id !== taskId)
      );

      return { previousData };
    },

    onError: (_err, _taskId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.tasks.lists(), context.previousData);
      }
      toast.error('Failed to delete task');
    },

    onSuccess: () => {
      toast('Task deleted', {
        action: {
          label: 'Undo',
          onClick: () => {
            // In a real app, you'd call an "undelete" mutation here
            toast.info('Undo not yet implemented');
          },
        },
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}
