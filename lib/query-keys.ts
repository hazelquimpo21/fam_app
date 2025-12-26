/**
 * ============================================================================
 * 🔑 Query Key Factory
 * ============================================================================
 *
 * Centralized query keys for TanStack Query.
 * Consistent keys enable proper cache invalidation and data sharing.
 *
 * Pattern: ['entity', 'scope', ...params]
 *
 * Why this matters:
 * - When you complete a task, invalidate ['tasks'] to refetch all task queries
 * - When you update a specific task, invalidate ['tasks', 'detail', taskId]
 * - Prevents stale data and cache bugs!
 *
 * ============================================================================
 */

import type { TaskStatus, GoalStatus, ProjectStatus, HabitFrequency } from '@/types/database';

// ============================================================================
// 📦 FILTER TYPES
// ============================================================================

/** Filters for task queries */
export interface TaskFilters {
  status?: TaskStatus;
  assignedTo?: string;
  projectId?: string;
  dueBefore?: string;
  dueAfter?: string;
}

/** Filters for goal queries */
export interface GoalFilters {
  status?: GoalStatus;
  ownerId?: string;
  isFamilyGoal?: boolean;
}

/** Filters for project queries */
export interface ProjectFilters {
  status?: ProjectStatus;
  ownerId?: string;
}

/** Filters for someday item queries */
export interface SomedayFilters {
  category?: 'trip' | 'purchase' | 'experience' | 'house' | 'other';
  isArchived?: boolean;
  addedById?: string;
}

/** Date range for queries */
export interface DateRange {
  start: string;  // YYYY-MM-DD
  end: string;    // YYYY-MM-DD
}

// ============================================================================
// 🔑 QUERY KEY FACTORY
// ============================================================================

export const queryKeys = {
  // ━━━━━ Tasks ━━━━━
  tasks: {
    /** Base key for all task queries */
    all: ['tasks'] as const,

    /** All task list queries */
    lists: () => [...queryKeys.tasks.all, 'list'] as const,

    /** Filtered task list */
    list: (filters: TaskFilters) => [...queryKeys.tasks.lists(), filters] as const,

    /** All task detail queries */
    details: () => [...queryKeys.tasks.all, 'detail'] as const,

    /** Specific task detail */
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,

    /** Inbox tasks (status = 'inbox') */
    inbox: () => [...queryKeys.tasks.all, 'inbox'] as const,

    /** Today's tasks (due or scheduled today) */
    today: () => [...queryKeys.tasks.all, 'today'] as const,

    /** Overdue tasks */
    overdue: () => [...queryKeys.tasks.all, 'overdue'] as const,
  },

  // ━━━━━ Habits ━━━━━
  habits: {
    /** Base key for all habit queries */
    all: ['habits'] as const,

    /** Habit list (optionally filtered by owner) */
    list: (ownerId?: string) => [...queryKeys.habits.all, 'list', ownerId] as const,

    /** Specific habit detail */
    detail: (id: string) => [...queryKeys.habits.all, 'detail', id] as const,

    /** Habit logs for a specific habit and date range */
    logs: (habitId: string, range?: DateRange) =>
      [...queryKeys.habits.all, 'logs', habitId, range] as const,

    /** Today's habit check-ins */
    today: () => [...queryKeys.habits.all, 'today'] as const,
  },

  // ━━━━━ Goals ━━━━━
  goals: {
    /** Base key for all goal queries */
    all: ['goals'] as const,

    /** Goal list with filters */
    list: (filters?: GoalFilters) => [...queryKeys.goals.all, 'list', filters] as const,

    /** Specific goal detail */
    detail: (id: string) => [...queryKeys.goals.all, 'detail', id] as const,
  },

  // ━━━━━ Projects ━━━━━
  projects: {
    /** Base key for all project queries */
    all: ['projects'] as const,

    /** Project list with filters */
    list: (filters?: ProjectFilters) => [...queryKeys.projects.all, 'list', filters] as const,

    /** Specific project detail */
    detail: (id: string) => [...queryKeys.projects.all, 'detail', id] as const,
  },

  // ━━━━━ Someday Items ━━━━━
  someday: {
    /** Base key for all someday queries */
    all: ['someday'] as const,

    /** Someday items list with filters */
    list: (filters?: SomedayFilters) => [...queryKeys.someday.all, 'list', filters] as const,

    /** Specific someday item detail */
    detail: (id: string) => [...queryKeys.someday.all, 'detail', id] as const,
  },

  // ━━━━━ Milestones ━━━━━
  milestones: {
    /** Base key for all milestone queries */
    all: ['milestones'] as const,

    /** Milestones for a specific week */
    list: (weekYear?: number, weekNumber?: number) =>
      [...queryKeys.milestones.all, 'list', weekYear, weekNumber] as const,
  },

  // ━━━━━ Family Members ━━━━━
  family: {
    /** Base key for family queries */
    all: ['family'] as const,

    /** All family members */
    members: () => [...queryKeys.family.all, 'members'] as const,

    /** Specific family member */
    member: (id: string) => [...queryKeys.family.all, 'member', id] as const,

    /** Current user's family member record */
    current: () => [...queryKeys.family.all, 'current'] as const,

    /** Pending invites for the family */
    invites: () => [...queryKeys.family.all, 'invites'] as const,
  },

  // ━━━━━ Profiles ━━━━━
  profiles: {
    /** Base key for all profile queries */
    all: ['profiles'] as const,

    /** Family profile (there's only one per family) */
    family: () => [...queryKeys.profiles.all, 'family'] as const,

    /** Member profile for a specific member */
    member: (memberId: string) => [...queryKeys.profiles.all, 'member', memberId] as const,

    /** Current user's member profile */
    current: () => [...queryKeys.profiles.all, 'current'] as const,

    /** Profile completion stats for family */
    familyCompletion: () => [...queryKeys.profiles.all, 'family', 'completion'] as const,

    /** Profile completion stats for member */
    memberCompletion: (memberId: string) => [...queryKeys.profiles.all, 'member', memberId, 'completion'] as const,
  },

  // ━━━━━ Dashboard ━━━━━
  dashboard: {
    /** Base key for dashboard queries */
    all: ['dashboard'] as const,

    /** Family dashboard aggregates */
    family: () => [...queryKeys.dashboard.all, 'family'] as const,

    /** Personal dashboard for a specific member */
    personal: (memberId: string) => [...queryKeys.dashboard.all, 'personal', memberId] as const,
  },

  // ━━━━━ Meals & Recipes ━━━━━
  meals: {
    /** Base key for meal queries */
    all: ['meals'] as const,

    /** Meals for a specific week */
    week: (startDate: string) => [...queryKeys.meals.all, 'week', startDate] as const,
  },

  recipes: {
    /** Base key for recipe queries */
    all: ['recipes'] as const,

    /** Recipe list */
    list: () => [...queryKeys.recipes.all, 'list'] as const,

    /** Specific recipe */
    detail: (id: string) => [...queryKeys.recipes.all, 'detail', id] as const,
  },

  // ━━━━━ Calendar Integration ━━━━━
  calendar: {
    /** Base key for all calendar queries */
    all: ['calendar'] as const,

    /** ICS calendar feeds */
    feeds: () => [...queryKeys.calendar.all, 'feeds'] as const,

    /** Specific feed */
    feed: (id: string) => [...queryKeys.calendar.all, 'feed', id] as const,

    /** Google Calendar connections */
    connections: () => [...queryKeys.calendar.all, 'connections'] as const,

    /** Current user's Google connection */
    myConnection: () => [...queryKeys.calendar.all, 'my-connection'] as const,

    /** Calendar subscriptions for a connection */
    subscriptions: (connectionId: string) =>
      [...queryKeys.calendar.all, 'subscriptions', connectionId] as const,

    /** Available calendars from Google (during setup) */
    availableCalendars: (connectionId: string) =>
      [...queryKeys.calendar.all, 'available', connectionId] as const,

    /** External events for a date range */
    externalEvents: (start: string, end: string) =>
      [...queryKeys.calendar.all, 'external-events', start, end] as const,

    /** External events for today */
    todayEvents: () => [...queryKeys.calendar.all, 'today-events'] as const,
  },
} as const;
