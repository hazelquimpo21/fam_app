'use client';

/**
 * ============================================================================
 * 🔄 Habits Hooks
 * ============================================================================
 *
 * React Query hooks for habit operations:
 * - Fetching habits
 * - Logging habits (done/skipped)
 * - Creating/updating habits
 *
 * ============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query-keys';
import { logger } from '@/lib/utils/logger';
import type { Habit, HabitLog, HabitLogStatus } from '@/types/database';

// ============================================================================
// 📖 QUERY HOOKS
// ============================================================================

/**
 * Extended habit with today's log status
 */
export interface HabitWithTodayStatus extends Habit {
  todayStatus: HabitLogStatus | null;
}

/**
 * Fetch all active habits with today's status
 */
export function useHabits() {
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: queryKeys.habits.today(),
    queryFn: async (): Promise<HabitWithTodayStatus[]> => {
      logger.info('🔄 Fetching habits...');

      // Fetch habits
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select(`
          *,
          owner:family_members!owner_id(id, name, color, avatar_url)
        `)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('title');

      if (habitsError) {
        logger.error('❌ Failed to fetch habits', { error: habitsError.message });
        throw habitsError;
      }

      if (!habits || habits.length === 0) {
        logger.info('📭 No habits found');
        return [];
      }

      // Fetch today's logs
      const { data: logs, error: logsError } = await supabase
        .from('habit_logs')
        .select('habit_id, status')
        .eq('log_date', today)
        .in('habit_id', habits.map((h) => h.id));

      if (logsError) {
        logger.error('❌ Failed to fetch habit logs', { error: logsError.message });
        throw logsError;
      }

      // Map logs to habits
      const logMap = new Map(logs?.map((l) => [l.habit_id, l.status]) || []);

      const habitsWithStatus = habits.map((habit) => ({
        ...habit,
        todayStatus: logMap.get(habit.id) || null,
      })) as HabitWithTodayStatus[];

      logger.success(`✅ Fetched ${habits.length} habits`);
      return habitsWithStatus;
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Fetch habit logs for a single habit over a date range
 */
export function useHabitLogs(habitId: string, startDate: string, endDate: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.habits.logs(habitId, { start: startDate, end: endDate }),
    queryFn: async (): Promise<HabitLog[]> => {
      logger.info('📊 Fetching habit logs...', { habitId, startDate, endDate });

      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('habit_id', habitId)
        .gte('log_date', startDate)
        .lte('log_date', endDate)
        .order('log_date', { ascending: false });

      if (error) {
        logger.error('❌ Failed to fetch habit logs', { error: error.message });
        throw error;
      }

      return data as HabitLog[];
    },
    enabled: !!habitId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Weekly habit logs mapped by habit ID
 * Map<habitId, Set<completedDateStrings>>
 */
export type WeeklyHabitLogsMap = Map<string, Set<string>>;

/**
 * Get the start and end dates of the current week (Sunday-Saturday)
 */
function getWeekDateRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const currentDay = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDay);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  return {
    startDate: startOfWeek.toISOString().split('T')[0],
    endDate: endOfWeek.toISOString().split('T')[0],
  };
}

/**
 * Fetch weekly habit logs for all habits
 *
 * Returns a Map where keys are habit IDs and values are Sets of completed date strings.
 * This is more efficient than fetching logs for each habit individually.
 *
 * @example
 * ```tsx
 * const { data: weekLogs } = useWeeklyHabitLogs(habits);
 * const completedDays = weekLogs?.get(habitId) || new Set();
 * ```
 */
export function useWeeklyHabitLogs(habitIds: string[]) {
  const supabase = createClient();
  const { startDate, endDate } = getWeekDateRange();

  return useQuery({
    queryKey: ['habits', 'weekly-logs', startDate, endDate, habitIds],
    queryFn: async (): Promise<WeeklyHabitLogsMap> => {
      if (habitIds.length === 0) {
        return new Map();
      }

      logger.info('📊 Fetching weekly habit logs...', {
        habitCount: habitIds.length,
        startDate,
        endDate,
      });

      const { data, error } = await supabase
        .from('habit_logs')
        .select('habit_id, log_date, status')
        .in('habit_id', habitIds)
        .gte('log_date', startDate)
        .lte('log_date', endDate)
        .eq('status', 'done'); // Only fetch completed days

      if (error) {
        logger.error('❌ Failed to fetch weekly habit logs', { error: error.message });
        throw error;
      }

      // Build the map: habitId -> Set of completed date strings
      const logsMap: WeeklyHabitLogsMap = new Map();

      // Initialize empty sets for all habits
      habitIds.forEach((id) => logsMap.set(id, new Set()));

      // Populate with actual data
      data?.forEach((log) => {
        const habitSet = logsMap.get(log.habit_id);
        if (habitSet) {
          habitSet.add(log.log_date);
        }
      });

      logger.success('✅ Fetched weekly logs', { logsCount: data?.length ?? 0 });
      return logsMap;
    },
    enabled: habitIds.length > 0,
    staleTime: 1000 * 60, // 1 minute (same as habits)
  });
}

// ============================================================================
// ✏️ MUTATION HOOKS
// ============================================================================

/**
 * Log a habit (done or skipped)
 */
export function useLogHabit() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      habitId,
      status,
    }: {
      habitId: string;
      status: HabitLogStatus;
    }) => {
      const today = new Date().toISOString().split('T')[0];
      logger.info('📝 Logging habit...', { habitId, status });

      const { data, error } = await supabase
        .from('habit_logs')
        .upsert(
          {
            habit_id: habitId,
            log_date: today,
            status,
          },
          {
            onConflict: 'habit_id,log_date',
          }
        )
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to log habit', { error: error.message });
        throw error;
      }

      logger.success('✅ Habit logged!');
      return data as HabitLog;
    },

    // Optimistic update
    onMutate: async ({ habitId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.today() });

      const previousHabits = queryClient.getQueryData<HabitWithTodayStatus[]>(
        queryKeys.habits.today()
      );

      queryClient.setQueryData<HabitWithTodayStatus[]>(
        queryKeys.habits.today(),
        (old) =>
          old?.map((habit) =>
            habit.id === habitId
              ? {
                  ...habit,
                  todayStatus: status,
                  current_streak:
                    status === 'done'
                      ? habit.current_streak + 1
                      : habit.current_streak,
                }
              : habit
          )
      );

      return { previousHabits };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(queryKeys.habits.today(), context.previousHabits);
      }
      toast.error('Failed to log habit');
    },

    onSuccess: (data) => {
      if (data.status === 'done') {
        toast.success('🔥 Habit completed!');
      } else if (data.status === 'skipped') {
        toast('Habit skipped');
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all });
    },
  });
}

/**
 * Input for creating a habit
 */
export interface CreateHabitInput {
  title: string;
  description?: string;
  frequency?: 'daily' | 'weekly' | 'custom';
  target_days_per_week?: number;
  days_of_week?: number[];
  owner_id?: string;
  goal_id?: string;
}

/**
 * Input for updating an existing habit
 * All fields optional - only provided fields will be updated
 */
export interface UpdateHabitInput {
  id: string;
  title?: string;
  description?: string | null;
  frequency?: 'daily' | 'weekly' | 'custom';
  target_days_per_week?: number | null;
  days_of_week?: number[] | null;
  owner_id?: string | null;
  goal_id?: string | null;
  is_active?: boolean;
}

/**
 * Create a new habit
 */
export function useCreateHabit() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: CreateHabitInput) => {
      logger.info('➕ Creating habit...', { title: input.title });

      const { data, error } = await supabase
        .from('habits')
        .insert({
          ...input,
          frequency: input.frequency || 'daily',
          is_active: true,
          current_streak: 0,
          longest_streak: 0,
        })
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to create habit', { error: error.message });
        throw error;
      }

      logger.success('✅ Habit created!', { title: data?.title });
      return data as Habit;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all });
      toast.success('🔄 Habit created!');
    },

    onError: () => {
      toast.error('Failed to create habit');
    },
  });
}

/**
 * Update an existing habit
 *
 * Used by HabitModal in edit mode. Supports partial updates.
 *
 * @example
 * ```tsx
 * const updateHabit = useUpdateHabit();
 * updateHabit.mutate({ id: habitId, title: 'New Title', frequency: 'weekly' });
 * ```
 */
export function useUpdateHabit() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateHabitInput) => {
      logger.info('✏️ Updating habit...', { id, updates });

      const { data, error } = await supabase
        .from('habits')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          owner:family_members!owner_id(id, name, color, avatar_url)
        `)
        .single();

      if (error) {
        logger.error('❌ Failed to update habit', { error: error.message });
        throw error;
      }

      logger.success('✅ Habit updated!', { id, title: data?.title });
      return data as Habit;
    },

    // Optimistic update for instant UI feedback
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.today() });

      const previousHabits = queryClient.getQueryData<HabitWithTodayStatus[]>(
        queryKeys.habits.today()
      );

      if (previousHabits) {
        queryClient.setQueryData<HabitWithTodayStatus[]>(
          queryKeys.habits.today(),
          (old) =>
            old?.map((habit) =>
              habit.id === id ? { ...habit, ...updates } : habit
            )
        );
      }

      return { previousHabits };
    },

    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousHabits) {
        queryClient.setQueryData(queryKeys.habits.today(), context.previousHabits);
      }
      toast.error('Failed to update habit');
    },

    onSuccess: () => {
      toast.success('Habit updated!');
    },

    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all });
    },
  });
}
