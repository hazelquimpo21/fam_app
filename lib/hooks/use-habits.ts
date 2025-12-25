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
import { useFamilyContext } from '@/lib/hooks/use-family-context';
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
 * Fetch habit logs for a date range
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
 * Create a new habit
 *
 * Automatically includes family_id and created_by from the current user's
 * family context. Will fail if user hasn't completed onboarding.
 */
export function useCreateHabit() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { familyId, memberId } = useFamilyContext();

  return useMutation({
    mutationFn: async (input: CreateHabitInput) => {
      // Validate family context exists
      if (!familyId || !memberId) {
        logger.error('❌ Cannot create habit: no family context');
        throw new Error('Please complete family setup first');
      }

      logger.info('➕ Creating habit...', { title: input.title, familyId });

      const { data, error } = await supabase
        .from('habits')
        .insert({
          ...input,
          family_id: familyId,
          created_by: memberId,
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

      logger.success('✅ Habit created!', { title: data?.title, id: data?.id });
      return data as Habit;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all });
      toast.success('🔄 Habit created!');
    },

    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to create habit';
      if (message.includes('family setup')) {
        toast.error('Please complete family setup first');
      } else {
        toast.error('Failed to create habit');
      }
    },
  });
}
