# Fam — API & Data Access Patterns

## Overview

This document defines how the frontend interacts with Supabase for data fetching, mutations, and real-time updates. All data access goes through TanStack Query for caching and state management.

---

## Query Key Factory

Consistent query keys enable proper cache invalidation.

```typescript
// lib/query-keys.ts

export const queryKeys = {
  // Tasks
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters: TaskFilters) => [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
    inbox: () => [...queryKeys.tasks.all, 'inbox'] as const,
    today: () => [...queryKeys.tasks.all, 'today'] as const,
  },

  // Habits
  habits: {
    all: ['habits'] as const,
    list: (ownerId?: string) => [...queryKeys.habits.all, 'list', ownerId] as const,
    detail: (id: string) => [...queryKeys.habits.all, 'detail', id] as const,
    logs: (habitId: string, range?: DateRange) => 
      [...queryKeys.habits.all, 'logs', habitId, range] as const,
  },

  // Goals
  goals: {
    all: ['goals'] as const,
    list: (filters?: GoalFilters) => [...queryKeys.goals.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.goals.all, 'detail', id] as const,
  },

  // Projects
  projects: {
    all: ['projects'] as const,
    list: (filters?: ProjectFilters) => [...queryKeys.projects.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.projects.all, 'detail', id] as const,
  },

  // Someday Items
  someday: {
    all: ['someday'] as const,
    list: (category?: SomedayCategory) => [...queryKeys.someday.all, 'list', category] as const,
  },

  // Milestones
  milestones: {
    all: ['milestones'] as const,
    list: (weekYear?: number, weekNumber?: number) => 
      [...queryKeys.milestones.all, 'list', weekYear, weekNumber] as const,
  },

  // Meals & Recipes
  meals: {
    all: ['meals'] as const,
    week: (startDate: string) => [...queryKeys.meals.all, 'week', startDate] as const,
  },
  recipes: {
    all: ['recipes'] as const,
    list: (filters?: RecipeFilters) => [...queryKeys.recipes.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.recipes.all, 'detail', id] as const,
  },

  // People
  family: {
    all: ['family'] as const,
    members: () => [...queryKeys.family.all, 'members'] as const,
    member: (id: string) => [...queryKeys.family.all, 'member', id] as const,
  },
  contacts: {
    all: ['contacts'] as const,
    list: (filters?: ContactFilters) => [...queryKeys.contacts.all, 'list', filters] as const,
  },
  vendors: {
    all: ['vendors'] as const,
    list: (category?: VendorCategory) => [...queryKeys.vendors.all, 'list', category] as const,
  },
  places: {
    all: ['places'] as const,
    list: (category?: PlaceCategory) => [...queryKeys.places.all, 'list', category] as const,
  },

  // Dashboard aggregates
  dashboard: {
    all: ['dashboard'] as const,
    family: () => [...queryKeys.dashboard.all, 'family'] as const,
    personal: (memberId: string) => [...queryKeys.dashboard.all, 'personal', memberId] as const,
  },
}
```

---

## Common Query Patterns

### Basic List Query

```typescript
// lib/hooks/use-tasks.ts

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/query-keys'
import type { Task, TaskFilters } from '@/types/entities'

async function fetchTasks(filters: TaskFilters): Promise<Task[]> {
  let query = supabase
    .from('tasks')
    .select(`
      *,
      assigned_to:family_members!assigned_to_id(id, name, color),
      project:projects(id, title, color)
    `)
    .is('deleted_at', null)
    .order('due_date', { ascending: true, nullsFirst: false })

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.assignedTo) {
    query = query.eq('assigned_to_id', filters.assignedTo)
  }
  if (filters.projectId) {
    query = query.eq('project_id', filters.projectId)
  }
  if (filters.dueBefore) {
    query = query.lte('due_date', filters.dueBefore)
  }
  if (filters.dueAfter) {
    query = query.gte('due_date', filters.dueAfter)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: () => fetchTasks(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
```

### Detail Query

```typescript
// lib/hooks/use-task.ts

async function fetchTask(id: string): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assigned_to:family_members!assigned_to_id(id, name, color, avatar_url),
      related_to:contacts(id, name),
      project:projects(id, title, color),
      goal:goals(id, title),
      place:places(id, name, address_line1, city),
      subtasks(id, title, is_complete, sort_order),
      created_by_member:family_members!created_by(id, name)
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) throw error
  return data
}

export function useTask(id: string) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => fetchTask(id),
    staleTime: 1000 * 60, // 1 minute for details
    enabled: !!id,
  })
}
```

### Specialized Queries

```typescript
// lib/hooks/use-inbox.ts
export function useInbox() {
  return useQuery({
    queryKey: queryKeys.tasks.inbox(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'inbox')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    staleTime: 1000 * 30, // 30 seconds - inbox changes frequently
  })
}

// lib/hooks/use-today-tasks.ts
export function useTodayTasks() {
  const today = format(new Date(), 'yyyy-MM-dd')
  
  return useQuery({
    queryKey: queryKeys.tasks.today(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to:family_members!assigned_to_id(id, name, color)
        `)
        .or(`due_date.eq.${today},scheduled_date.eq.${today},and(due_date.lt.${today},status.neq.done)`)
        .is('deleted_at', null)
        .order('due_date', { ascending: true })

      if (error) throw error
      return data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}
```

---

## Mutation Patterns

### Basic Mutation with Optimistic Update

```typescript
// lib/hooks/use-complete-task.ts

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/query-keys'
import { toast } from 'sonner'

export function useCompleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: 'done',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error
      return data
    },

    // Optimistic update
    onMutate: async (taskId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all })

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(queryKeys.tasks.lists())

      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: queryKeys.tasks.all },
        (old: Task[] | undefined) => {
          if (!old) return old
          return old.map((task) =>
            task.id === taskId
              ? { ...task, status: 'done', completed_at: new Date().toISOString() }
              : task
          )
        }
      )

      return { previousTasks }
    },

    onError: (err, taskId, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks.lists(), context.previousTasks)
      }
      toast.error('Failed to complete task')
      console.error('Complete task error:', err)
    },

    onSuccess: () => {
      toast.success('Task completed! 🎉')
    },

    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}
```

### Create Mutation

```typescript
// lib/hooks/use-create-task.ts

interface CreateTaskInput {
  title: string
  description?: string
  due_date?: string
  scheduled_date?: string
  assigned_to_id?: string
  project_id?: string
  goal_id?: string
  priority?: number
  status?: TaskStatus
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...input,
          family_id: currentUser!.family_id,
          created_by: currentUser!.id,
          status: input.status || 'inbox',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
      
      if (data.status === 'inbox') {
        toast.success('Added to inbox')
      } else {
        toast.success('Task created')
      }
    },

    onError: (error) => {
      toast.error('Failed to create task')
      console.error('Create task error:', error)
    },
  })
}
```

### Update Mutation

```typescript
// lib/hooks/use-update-task.ts

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },

    onSuccess: (data) => {
      // Update the specific task in cache
      queryClient.setQueryData(queryKeys.tasks.detail(data.id), data)
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() })
    },

    onError: (error) => {
      toast.error('Failed to update task')
      console.error('Update task error:', error)
    },
  })
}
```

### Delete (Soft Delete) Mutation

```typescript
// lib/hooks/use-delete-task.ts

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', taskId)

      if (error) throw error
      return taskId
    },

    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all })
      
      const previousTasks = queryClient.getQueryData(queryKeys.tasks.lists())
      
      // Optimistically remove from lists
      queryClient.setQueriesData(
        { queryKey: queryKeys.tasks.all },
        (old: Task[] | undefined) => old?.filter((t) => t.id !== taskId)
      )

      return { previousTasks }
    },

    onError: (err, taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks.lists(), context.previousTasks)
      }
      toast.error('Failed to delete task')
    },

    onSuccess: (taskId) => {
      toast('Task deleted', {
        action: {
          label: 'Undo',
          onClick: () => handleUndoDelete(taskId),
        },
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
    },
  })
}
```

---

## Real-time Subscriptions

### Task Updates Subscription

```typescript
// lib/hooks/use-tasks-subscription.ts

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/query-keys'
import { useCurrentUser } from './use-current-user'

export function useTasksSubscription() {
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const familyId = currentUser?.family_id

  useEffect(() => {
    if (!familyId) return

    const channel = supabase
      .channel(`tasks:${familyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          console.log('Task change:', payload.eventType, payload)

          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })

          // For inserts/updates, update the specific detail cache
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const task = payload.new
            queryClient.setQueryData(queryKeys.tasks.detail(task.id), task)
          }

          // For deletes, remove from cache
          if (payload.eventType === 'DELETE') {
            queryClient.removeQueries({ 
              queryKey: queryKeys.tasks.detail(payload.old.id) 
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [familyId, queryClient])
}
```

### Using Subscriptions in Layout

```typescript
// app/(app)/layout.tsx

export default function AppLayout({ children }: { children: ReactNode }) {
  // Enable real-time subscriptions at the app level
  useTasksSubscription()
  useHabitsSubscription()
  useMilestonesSubscription()

  return (
    <AppShell>
      {children}
    </AppShell>
  )
}
```

---

## Specific Data Patterns

### Dashboard Data (Aggregated)

```typescript
// lib/hooks/use-family-dashboard.ts

interface DashboardData {
  tasksToday: Task[]
  tasksOverdue: Task[]
  habitsToday: { habit: Habit; logged: boolean }[]
  mealsToday: Meal[]
  milestonesThisWeek: Milestone[]
  upcomingBirthdays: (Contact | FamilyMember)[]
  activeProjects: Project[]
}

export function useFamilyDashboard() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { weekYear, weekNumber } = getWeekInfo(new Date())
  const twoWeeksOut = format(addDays(new Date(), 14), 'yyyy-MM-dd')

  return useQuery({
    queryKey: queryKeys.dashboard.family(),
    queryFn: async (): Promise<DashboardData> => {
      // Parallel fetch for performance
      const [
        todayTasks,
        overdueTasks,
        habits,
        habitLogs,
        meals,
        milestones,
        familyMembers,
        contacts,
        projects,
      ] = await Promise.all([
        // Tasks due today
        supabase
          .from('tasks')
          .select('*, assigned_to:family_members!assigned_to_id(id, name, color)')
          .or(`due_date.eq.${today},scheduled_date.eq.${today}`)
          .neq('status', 'done')
          .is('deleted_at', null),

        // Overdue tasks
        supabase
          .from('tasks')
          .select('*, assigned_to:family_members!assigned_to_id(id, name, color)')
          .lt('due_date', today)
          .neq('status', 'done')
          .is('deleted_at', null),

        // Active habits
        supabase
          .from('habits')
          .select('*, owner:family_members!owner_id(id, name, color)')
          .eq('is_active', true)
          .is('deleted_at', null),

        // Today's habit logs
        supabase
          .from('habit_logs')
          .select('habit_id, status')
          .eq('log_date', today),

        // Today's meals
        supabase
          .from('meals')
          .select('*, recipe:recipes(id, title, image_url), assigned_to:family_members!assigned_to_id(id, name)')
          .eq('meal_date', today),

        // This week's milestones
        supabase
          .from('milestones')
          .select('*, person:family_members!person_id(id, name, color)')
          .eq('week_year', weekYear)
          .eq('week_number', weekNumber)
          .is('deleted_at', null),

        // Family members for birthdays
        supabase
          .from('family_members')
          .select('id, name, color, birthday')
          .not('birthday', 'is', null),

        // Contacts for birthdays
        supabase
          .from('contacts')
          .select('id, name, birthday')
          .not('birthday', 'is', null)
          .is('deleted_at', null),

        // Active projects
        supabase
          .from('projects')
          .select('*, owner:family_members!owner_id(id, name, color)')
          .eq('status', 'active')
          .is('deleted_at', null)
          .limit(4),
      ])

      // Process habit logs
      const loggedHabitIds = new Set(
        habitLogs.data?.filter(l => l.status === 'done').map(l => l.habit_id)
      )

      // Filter upcoming birthdays
      const upcomingBirthdays = [
        ...(familyMembers.data || []),
        ...(contacts.data || []),
      ].filter((person) => {
        if (!person.birthday) return false
        const bday = new Date(person.birthday)
        const thisYearBday = new Date(new Date().getFullYear(), bday.getMonth(), bday.getDate())
        return thisYearBday >= new Date() && thisYearBday <= new Date(twoWeeksOut)
      })

      return {
        tasksToday: todayTasks.data || [],
        tasksOverdue: overdueTasks.data || [],
        habitsToday: (habits.data || []).map(h => ({
          habit: h,
          logged: loggedHabitIds.has(h.id),
        })),
        mealsToday: meals.data || [],
        milestonesThisWeek: milestones.data || [],
        upcomingBirthdays,
        activeProjects: projects.data || [],
      }
    },
    staleTime: 1000 * 60, // 1 minute
  })
}
```

### Habit Logging

```typescript
// lib/hooks/use-log-habit.ts

export function useLogHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ habitId, status }: { habitId: string; status: 'done' | 'skipped' }) => {
      const today = format(new Date(), 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('habit_logs')
        .upsert({
          habit_id: habitId,
          log_date: today,
          status,
        }, {
          onConflict: 'habit_id,log_date',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },

    onSuccess: (data, { habitId }) => {
      // Invalidate habit queries
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })

      if (data.status === 'done') {
        toast.success('Habit logged! 🔥')
      }
    },

    onError: () => {
      toast.error('Failed to log habit')
    },
  })
}
```

---

## Error Handling

```typescript
// lib/utils/api-error.ts

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleSupabaseError(error: unknown): never {
  if (error instanceof Error) {
    // Supabase error
    if ('code' in error) {
      const code = (error as any).code
      
      switch (code) {
        case 'PGRST116':
          throw new ApiError('Not found', code)
        case '23505':
          throw new ApiError('This item already exists', code)
        case '42501':
          throw new ApiError('Permission denied', code)
        default:
          throw new ApiError(error.message, code)
      }
    }
    
    throw new ApiError(error.message)
  }
  
  throw new ApiError('An unexpected error occurred')
}

// Usage in fetch functions
async function fetchTask(id: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()

  if (error) handleSupabaseError(error)
  return data
}
```

---

## TanStack Query Configuration

```typescript
// lib/query-client.ts

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30,   // 30 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof ApiError && error.code?.startsWith('4')) {
          return false
        }
        return failureCount < 3
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
})
```

---

---

## 🚀 Implementation Status

> **Last Updated:** December 2024

### Query Key Factory

| Feature | Spec | Implemented | Location |
|---------|------|-------------|----------|
| Query key factory | ✅ | ✅ | `lib/query-keys.ts` |
| Tasks keys | ✅ | ✅ | all, lists, list, detail, inbox, today |
| Habits keys | ✅ | ✅ | all, today, logs |
| Other entity keys | ✅ | 🔨 | Defined but not all used yet |

### Hooks Implemented

| Hook | Spec | Implemented | Location | Notes |
|------|------|-------------|----------|-------|
| **Tasks** |
| `useTasks` | ✅ | ✅ | `lib/hooks/use-tasks.ts` | With filters |
| `useTask` | ✅ | ✅ | `lib/hooks/use-tasks.ts` | Single task detail |
| `useInboxTasks` | ✅ | ✅ | `lib/hooks/use-tasks.ts` | Inbox-specific |
| `useTodayTasks` | ✅ | ✅ | `lib/hooks/use-tasks.ts` | Due/scheduled today |
| `useCreateTask` | ✅ | ✅ | `lib/hooks/use-tasks.ts` | With toast |
| `useUpdateTask` | ✅ | ✅ | `lib/hooks/use-tasks.ts` | Cache update |
| `useCompleteTask` | ✅ | ✅ | `lib/hooks/use-tasks.ts` | Optimistic update |
| `useDeleteTask` | ✅ | ✅ | `lib/hooks/use-tasks.ts` | Soft delete |
| **Habits** |
| `useHabits` | ✅ | ✅ | `lib/hooks/use-habits.ts` | With today status |
| `useHabitLogs` | ✅ | ✅ | `lib/hooks/use-habits.ts` | Date range query |
| `useLogHabit` | ✅ | ✅ | `lib/hooks/use-habits.ts` | Optimistic update |
| `useCreateHabit` | ✅ | ✅ | `lib/hooks/use-habits.ts` | With toast |
| **Goals** |
| `useGoals` | ✅ | ✅ | `lib/hooks/use-goals.ts` | With filters (status, owner, isFamilyGoal) |
| `useActiveGoals` | ✅ | ✅ | `lib/hooks/use-goals.ts` | Convenience hook |
| `useGoal` | ✅ | ✅ | `lib/hooks/use-goals.ts` | Single goal detail |
| `useCreateGoal` | ✅ | ✅ | `lib/hooks/use-goals.ts` | With toast |
| `useUpdateGoal` | ✅ | ✅ | `lib/hooks/use-goals.ts` | Cache update |
| `useUpdateGoalProgress` | ✅ | ✅ | `lib/hooks/use-goals.ts` | For quantitative goals |
| `useAchieveGoal` | ✅ | ✅ | `lib/hooks/use-goals.ts` | Mark achieved |
| `useAbandonGoal` | ✅ | ✅ | `lib/hooks/use-goals.ts` | Mark abandoned |
| `useDeleteGoal` | ✅ | ✅ | `lib/hooks/use-goals.ts` | Soft delete |
| **Projects** |
| `useProjects` | ✅ | ✅ | `lib/hooks/use-projects.ts` | With filters (status, owner) |
| `useActiveProjects` | ✅ | ✅ | `lib/hooks/use-projects.ts` | Convenience hook |
| `useProject` | ✅ | ✅ | `lib/hooks/use-projects.ts` | Single project detail |
| `useCreateProject` | ✅ | ✅ | `lib/hooks/use-projects.ts` | With toast |
| `useUpdateProject` | ✅ | ✅ | `lib/hooks/use-projects.ts` | Cache update |
| `useChangeProjectStatus` | ✅ | ✅ | `lib/hooks/use-projects.ts` | Status transitions |
| `useCompleteProject` | ✅ | ✅ | `lib/hooks/use-projects.ts` | Mark completed |
| `useDeleteProject` | ✅ | ✅ | `lib/hooks/use-projects.ts` | Soft delete |
| `usePromoteSomedayToProject` | ✅ | ✅ | `lib/hooks/use-projects.ts` | Someday → Project |
| **Someday** |
| `useSomedayItems` | ✅ | ✅ | `lib/hooks/use-someday.ts` | With category filters |
| `useActiveSomedayItems` | ✅ | ✅ | `lib/hooks/use-someday.ts` | Non-archived items |
| `useSomedayItem` | ✅ | ✅ | `lib/hooks/use-someday.ts` | Single item detail |
| `useCreateSomedayItem` | ✅ | ✅ | `lib/hooks/use-someday.ts` | With toast |
| `useUpdateSomedayItem` | ✅ | ✅ | `lib/hooks/use-someday.ts` | Cache update |
| `useArchiveSomedayItem` | ✅ | ✅ | `lib/hooks/use-someday.ts` | Archive item |
| `useDeleteSomedayItem` | ✅ | ✅ | `lib/hooks/use-someday.ts` | Soft delete + optimistic |
| **Family** |
| `useFamilyMembers` | ✅ | ✅ | `lib/hooks/use-family.ts` | All family members |
| `useFamilyMember` | ✅ | ✅ | `lib/hooks/use-family.ts` | Single member detail |
| `useCurrentFamilyMember` | ✅ | ✅ | `lib/hooks/use-family.ts` | Current user's record |
| `useFamilyInvites` | ✅ | ✅ | `lib/hooks/use-family.ts` | Pending invites |
| `useCreateFamilyMember` | ✅ | ✅ | `lib/hooks/use-family.ts` | Add member (for kids) |
| `useUpdateFamilyMember` | ✅ | ✅ | `lib/hooks/use-family.ts` | Update profile |
| `useCreateFamilyInvite` | ✅ | ✅ | `lib/hooks/use-family.ts` | Send invite |
| `useResendInvite` | ✅ | ✅ | `lib/hooks/use-family.ts` | Resend invite |
| `useCancelInvite` | ✅ | ✅ | `lib/hooks/use-family.ts` | Cancel invite |
| **Auth** |
| `useAuth` | ✅ | ✅ | `lib/hooks/use-auth.ts` | Magic link auth |
| **Other** |
| `useFamilyDashboard` | ✅ | 🔨 | - | Aggregated data pending |
| Real-time subscriptions | ✅ | 🔨 | - | Not yet built |

### Patterns Implemented

| Pattern | Spec | Implemented | Notes |
|---------|------|-------------|-------|
| Optimistic updates | ✅ | ✅ | Tasks & Habits |
| Cache invalidation | ✅ | ✅ | On mutations |
| Error handling | ✅ | ✅ | Toast notifications |
| Query client config | ✅ | ✅ | `lib/query-client.ts` |
| Parallel fetches | ✅ | 🔨 | Dashboard aggregation pending |
| Real-time subscriptions | ✅ | 🔨 | Not yet implemented |

### Files Created

```
lib/
├── query-client.ts         # ✅ TanStack Query configuration
├── query-keys.ts           # ✅ Query key factory (with someday, family keys)
├── hooks/
│   ├── use-auth.ts         # ✅ Auth state & methods (magic link)
│   ├── use-tasks.ts        # ✅ Full CRUD + inbox/today/overdue queries
│   ├── use-habits.ts       # ✅ Full CRUD + streak tracking
│   ├── use-goals.ts        # ✅ Full CRUD + progress tracking
│   ├── use-projects.ts     # ✅ Full CRUD + status management
│   ├── use-someday.ts      # ✅ Full CRUD + category filtering
│   └── use-family.ts       # ✅ Full CRUD + invites management
└── supabase/
    ├── client.ts           # ✅ Browser client
    ├── server.ts           # ✅ Server component client
    └── middleware.ts       # ✅ Auth middleware helper
```

### Next Steps

1. **High Priority:**
   - ✅ ~~Add `useGoals` hook~~ (Done!)
   - ✅ ~~Add `useProjects` hook~~ (Done!)
   - ✅ ~~Add `useSomedayItems` hook~~ (Done!)
   - ✅ ~~Add `useFamilyMembers` hook~~ (Done!)
   - Implement real-time subscriptions for tasks/habits

2. **Medium Priority:**
   - Add `useFamilyDashboard` for aggregated data
   - Add optimistic updates to more mutations

3. **Lower Priority:**
   - Meal planning hooks
   - Recipe library hooks
   - Vendor/contact library hooks

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-23 | Hazel + Claude | Initial API patterns |
| 1.1 | 2024-12-23 | Claude | Added implementation status |
| 1.2 | 2024-12-23 | Claude | Updated auth hook docs for magic link |
| 1.3 | 2024-12-25 | Claude | Added useGoals and useProjects hooks documentation |
| 1.4 | 2024-12-25 | Claude | Added useSomeday and useFamily hooks (ALL hooks complete!) |
