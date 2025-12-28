# Fam - Implementation Status

> **Last Updated:** December 28, 2024
> **Status:** MVP Phase 3.4 Complete - UI/UX Cleanup & Code Quality

---

## Quick Summary

| Area | Status | Completion |
|------|--------|------------|
| Database Schema | ✅ Complete | 100% |
| Authentication (Magic Link) | ✅ Complete | 100% |
| Onboarding Flow | ✅ Complete | 100% |
| Core UI Components | ✅ Complete | ~65% |
| Tasks Feature | ✅ Complete | 100% |
| Habits Feature | ✅ Complete | 95% |
| Dashboard | ✅ Complete | 95% |
| Goals Feature | ✅ Complete | 80% |
| Projects Feature | ✅ Complete | 95% |
| Inbox Feature | ✅ Complete | 100% |
| Today Feature | ✅ Complete | 100% |
| Someday Feature | ✅ Complete | 95% |
| Family Feature | ✅ Complete | 75% |
| **Kanban Board** | ✅ **Complete** | 100% |
| **Profiles Feature** | 📋 Planned | 0% |
| Settings Feature | ✅ Stub | 25% |
| **Calendar Integration** | ✅ **Complete** | 100% |
| Meals Feature | 🔨 Pending | 0% |

---

## What's Been Built

### 1. Database (100% Complete)

**File:** `supabase/migrations/001_initial_schema.sql`

All 17 tables implemented with:
- ✅ Full schema matching specs
- ✅ 14 custom enums
- ✅ Row Level Security (RLS) on all tables
- ✅ Helper functions (`get_my_family_id`, `is_adult_or_owner`, etc.)
- ✅ Streak tracking trigger for habits

```
Tables: families, family_members, tasks, subtasks, habits, habit_logs,
        goals, projects, someday_items, milestones, contacts, vendors,
        places, recipes, meals, meeting_notes, family_invites
```

### 2. Authentication - Magic Link (100% Complete)

**Files:**
- `lib/contexts/auth-context.tsx` - **Centralized AuthProvider** (manages all auth state)
- `lib/hooks/use-auth.ts` - Auth hook (re-exports from AuthProvider, backwards compatible)
- `lib/supabase/client.ts` - Browser client
- `lib/supabase/server.ts` - Server component client
- `lib/supabase/middleware.ts` - Auth middleware helper
- `lib/supabase/admin.ts` - Admin client for privileged operations
- `components/providers.tsx` - Wraps app with AuthProvider
- `app/(auth)/login/page.tsx` - Magic link login page
- `app/(auth)/signup/page.tsx` - Magic link signup page
- `app/(auth)/check-email/page.tsx` - Email confirmation page
- `app/auth/callback/route.ts` - Magic link callback handler
- `middleware.ts` - Route protection

**Features:**
- ✅ Passwordless magic link authentication
- ✅ Email-based login and signup
- ✅ "Check your email" confirmation page
- ✅ Session management
- ✅ Protected routes
- ✅ Auth state hook with `sendMagicLink` method
- ✅ Onboarding flow for new users
- ✅ **AuthProvider context pattern** - Centralized auth state management
- ✅ **Shared familyId** - Available via `useAuth()` without redundant queries

### 2.5 Onboarding Flow (100% Complete)

**Files:**
- `app/(auth)/onboarding/page.tsx` - Family creation page
- `middleware.ts` - Enforces onboarding for new users
- `lib/supabase/middleware.ts` - Family membership check

**Features:**
- ✅ Automatic redirect to onboarding for users without a family
- ✅ Family creation with name and timezone
- ✅ Family member creation with name, email, color picker
- ✅ User set as owner role
- ✅ Graceful handling of auth states (loading, needs_family)
- ✅ Server-side enforcement via middleware

### 3. UI Components (~60% Complete)

**Built (18 components):**

| Component | File | Features |
|-----------|------|----------|
| Button | `components/ui/button.tsx` | 6 variants, 4 sizes, loading state |
| Input | `components/ui/input.tsx` | Icons, error states |
| Card | `components/ui/card.tsx` | Composable (Header/Title/Content) |
| Checkbox | `components/ui/checkbox.tsx` | Animated SVG |
| Spinner | `components/ui/spinner.tsx` | 3 sizes |
| Dialog | `components/ui/dialog.tsx` | Modal with Header/Body/Footer, ESC close, focus trap |
| Select | `components/ui/select.tsx` | Dropdown with keyboard nav, click-outside |
| Avatar | `components/shared/avatar.tsx` | Image + initials fallback |
| Badge | `components/shared/badge.tsx` | 6 variants + StreakBadge |
| EmptyState | `components/shared/empty-state.tsx` | Icon, action button |
| ProgressBar | `components/shared/progress-bar.tsx` | 3 sizes, 5 variants (auto color) |
| FamilyMemberPicker | `components/shared/family-member-picker.tsx` | Select family member, shows "(you)" |
| ProjectPicker | `components/shared/project-picker.tsx` | Select project with color/status |
| GoalPicker | `components/shared/goal-picker.tsx` | Select goal with progress bar |
| TaskModal | `components/modals/task-modal.tsx` | Full task create/edit form |
| GoalModal | `components/modals/goal-modal.tsx` | Full goal create/edit form (qualitative/quantitative) |
| HabitModal | `components/modals/habit-modal.tsx` | Habit create form with frequency, goal linking |
| ProjectModal | `components/modals/project-modal.tsx` | Project create/edit form with status, owner, icon |
| SomedayModal | `components/modals/someday-modal.tsx` | Someday item create/edit form with category, cost |
| EventModal | `components/modals/event-modal.tsx` | Event create/edit form with date/time, location, assignee |
| AppShell | `components/layout/app-shell.tsx` | Main wrapper |
| Sidebar | `components/layout/sidebar.tsx` | Navigation |
| TopBar | `components/layout/top-bar.tsx` | User menu |

**Not Yet Built (~18 components):**
- DatePicker, Skeleton, Tooltip
- QuickAddModal, SearchModal, ConfirmDialog
- Feature-specific components (TaskCard, HabitCard as standalone)

### 4. Data Hooks (All Core Entities Complete)

**File:** `lib/hooks/use-tasks.ts`
- ✅ `useTasks(filters)` - List with filtering
- ✅ `useTask(id)` - Single task detail
- ✅ `useInboxTasks()` - Inbox items
- ✅ `useTodayTasks()` - Today's tasks with project info
- ✅ `useOverdueTasks()` - Overdue tasks
- ✅ `useCreateTask()` - Create with toast
- ✅ `useUpdateTask()` - Update with cache
- ✅ `useCompleteTask()` - Optimistic update
- ✅ `useDeleteTask()` - Soft delete with undo

**File:** `lib/hooks/use-habits.ts`
- ✅ `useHabits()` - List with today's status
- ✅ `useHabitLogs(habitId, start, end)` - Log history for single habit
- ✅ `useWeeklyHabitLogs(habitIds)` - Batch fetch weekly logs for all habits (efficient)
- ✅ `useLogHabit()` - Log done/skipped with optimistic update
- ✅ `useCreateHabit()` - Create new habit
- ✅ `useUpdateHabit()` - Update existing habit with optimistic update

**File:** `lib/hooks/use-goals.ts`
- ✅ `useGoals(filters)` - List with filtering (status, owner, family goals)
- ✅ `useActiveGoals()` - Convenience hook for active goals
- ✅ `useGoal(id)` - Single goal detail
- ✅ `useCreateGoal()` - Create with toast
- ✅ `useUpdateGoal()` - Update with cache
- ✅ `useUpdateGoalProgress()` - Update quantitative progress
- ✅ `useAchieveGoal()` - Mark goal as achieved
- ✅ `useAbandonGoal()` - Mark goal as abandoned
- ✅ `useDeleteGoal()` - Soft delete

**File:** `lib/hooks/use-projects.ts`
- ✅ `useProjects(filters)` - List with filtering (status, owner)
- ✅ `useActiveProjects()` - Convenience hook for active projects
- ✅ `useProject(id)` - Single project detail
- ✅ `useCreateProject()` - Create with toast
- ✅ `useUpdateProject()` - Update with cache
- ✅ `useChangeProjectStatus()` - Change status with appropriate toast
- ✅ `useCompleteProject()` - Mark project as completed
- ✅ `useDeleteProject()` - Soft delete
- ✅ `usePromoteSomedayToProject()` - Promote a someday item to project

**File:** `lib/hooks/use-someday.ts` *(NEW)*
- ✅ `useSomedayItems(filters)` - List with filtering (category, archived, added by)
- ✅ `useActiveSomedayItems()` - Non-archived items
- ✅ `useSomedayItem(id)` - Single item detail
- ✅ `useCreateSomedayItem()` - Create with toast
- ✅ `useUpdateSomedayItem()` - Update with cache
- ✅ `useArchiveSomedayItem()` - Archive item
- ✅ `useDeleteSomedayItem()` - Soft delete with optimistic update

**File:** `lib/hooks/use-family.ts` *(NEW)*
- ✅ `useFamilyMembers()` - All family members
- ✅ `useFamilyMember(id)` - Single member detail
- ✅ `useCurrentFamilyMember()` - Current user's family record
- ✅ `useFamilyInvites()` - Pending invites
- ✅ `useCreateFamilyMember()` - Add member (for kids)
- ✅ `useUpdateFamilyMember()` - Update profile
- ✅ `useCreateFamilyInvite()` - Send invite
- ✅ `useResendInvite()` - Resend invite
- ✅ `useCancelInvite()` - Cancel invite

**File:** `lib/hooks/use-family-events.ts` *(NEW)*
- ✅ `useFamilyEvents(dateRange)` - Events in date range
- ✅ `useTodayFamilyEvents()` - Today's events
- ✅ `useFamilyEvent(id)` - Single event detail
- ✅ `useCreateFamilyEvent()` - Create event with toast
- ✅ `useUpdateFamilyEvent()` - Update event with cache
- ✅ `useDeleteFamilyEvent()` - Delete event
- ✅ `useBirthdays(dateRange)` - Birthdays in date range
- ✅ `useTodayBirthdays()` - Today's birthdays
- ✅ `useUpcomingBirthdays(days)` - Birthdays in next N days
- ✅ `formatEventTime()`, `isMultiDayEvent()`, `getEventDuration()` - Utilities

### 4.5 Calendar Integration (100% Complete)

**Files:**
- `supabase/migrations/003_calendar_integration.sql` - Database schema
- `types/calendar.ts` - TypeScript types
- `lib/hooks/use-calendar.ts` - React Query hooks
- `lib/utils/ics-generator.ts` - ICS feed generation
- `app/api/calendar/feed/[token]/route.ts` - ICS feed endpoint
- `app/api/calendar/sync/route.ts` - Google Calendar sync endpoint
- `app/api/auth/google/route.ts` - Google OAuth initiation
- `app/api/auth/google/callback/route.ts` - Google OAuth callback
- `app/(app)/settings/calendar/page.tsx` - Calendar settings UI

**ICS Calendar Feeds:**
- ✅ Create personal or family-wide calendar feeds
- ✅ Subscribe in Google Calendar, Apple Calendar, Outlook, etc.
- ✅ Include tasks, meals, and/or goal deadlines
- ✅ Auto-updates every 15-30 minutes (calendar app refresh)
- ✅ No RRULE complexity - recurring tasks generate individual instances
- ✅ Secure token-based URLs (regeneratable)

**Google Calendar Import:**
- ✅ OAuth 2.0 connection flow
- ✅ Import multiple calendars (selectable)
- ✅ Visibility controls (owner-only, adults, or family)
- ✅ Periodic sync with token refresh
- ✅ View external events in Fam's Today page
- ✅ Manual "Sync Now" button
- ✅ Graceful error handling

**Database Tables:**
- `calendar_feeds` - ICS feed configurations
- `google_calendar_connections` - OAuth tokens
- `google_calendar_subscriptions` - Which calendars to import
- `external_events` - Cached events from Google

### 4.6 Unified Kanban Board (100% Complete)

**Core Files:**
- `types/kanban.ts` - TypeScript types (KanbanItem, KanbanColumn, configs)
- `lib/hooks/use-kanban.ts` - React Query hook for data fetching/transformation
- `lib/hooks/use-kanban-dnd.ts` - Drag-and-drop mechanics with @dnd-kit
- `components/kanban/kanban-board.tsx` - Main board with controls
- `app/(app)/kanban/page.tsx` - Kanban page with modal integration

**Card Components (Refactored - DRY Architecture):**
- `components/kanban/kanban-card-content.tsx` - **SHARED** rendering logic (single source of truth)
- `components/kanban/kanban-card.tsx` - Static wrapper for non-draggable cards
- `components/kanban/kanban-sortable-card.tsx` - Draggable wrapper with @dnd-kit
- `components/kanban/kanban-drag-overlay.tsx` - Ghost card during drag
- `components/kanban/kanban-column.tsx` - Column with header and drop zone

**Shared Constants (Refactored - Eliminates Duplication):**
- `lib/constants/kanban-styles.ts` - TYPE_STYLES, PRIORITY_COLORS, COLUMN_COLORS, EMPTY_STATE_MESSAGES

**Unified Kanban Features:**
- ✅ **GroupBy Modes**: Time (Overdue/Today/Tomorrow/This Week/Later), Status (Inbox/Active/Waiting/Done), Priority (High/Medium/Low/None)
- ✅ **Time Scope Filters**: Week, Month, Quarter, Year
- ✅ **Item Types**: Tasks, Family Events, Google Calendar (read-only), Birthdays (read-only)
- ✅ **Drag & Drop**: Drag tasks/events between columns to reschedule or change status
- ✅ **Visual Distinction**: Each item type has unique colors and badges
- ✅ **Edit Integration**: Click cards to open TaskModal or EventModal
- ✅ **Unified Data**: Uses CalendarItem transformation for consistent display
- ✅ **Empty State Hints**: Action-oriented messages guide users on what to do

**Architecture:**
```
KanbanBoard
├── KanbanControls (groupBy, timeScope, filters)
└── Columns container (horizontal scroll)
    ├── KanbanColumn (Overdue) → KanbanSortableCard[]
    │     └── KanbanCardContent (shared rendering)
    ├── KanbanColumn (Today) → KanbanSortableCard[]
    │     └── KanbanCardContent (shared rendering)
    └── ... more columns based on groupBy mode

DragOverlay
└── KanbanDragOverlay
      └── KanbanCardContent (shared rendering, isOverlay=true)
```

**Code Quality (Phase 3.4 Cleanup):**
- ✅ Extracted shared `KanbanCardContent` component (eliminates 3-file duplication)
- ✅ Centralized style constants in `lib/constants/kanban-styles.ts`
- ✅ Added comprehensive AI-dev documentation comments
- ✅ Fixed duplicate startup logging (React Strict Mode issue)
- ✅ Added action hints to empty state messages

### 5. Pages (All Core Pages Wired to Database)

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Dashboard | `/` | ✅ **Connected** | Stats, tasks, habits (click-to-edit), goals (click-to-edit), Add buttons |
| Tasks | `/tasks` | ✅ **Connected** | List, filters, quick add, connected to DB |
| **Kanban** | `/kanban` | ✅ **NEW** | Unified board with tasks + events, groupBy modes, drag-drop |
| Habits | `/habits` | ✅ **Connected** | Week progress, click-to-edit via HabitModal, streaks |
| Login | `/login` | ✅ | Magic link (passwordless) |
| Signup | `/signup` | ✅ | Magic link (passwordless) |
| Check Email | `/check-email` | ✅ | Confirmation after magic link |
| Onboarding | `/onboarding` | ✅ **NEW** | Family creation for new users |
| Inbox | `/inbox` | ✅ **Connected** | Quick capture, ALL triage actions use modals (Task/Goal/Habit/Project/Someday) |
| Today | `/today` | ✅ **Connected** | Daily focus with events, birthdays banner, Add Task/Event buttons, click-to-edit |
| Goals | `/goals` | ✅ **Connected** | Goal tracking with progress bars, grouped by owner |
| Projects | `/projects` | ✅ **Connected** | Project cards with status filtering |
| Someday | `/someday` | ✅ **Connected** | Wishlist with categories, promote to project |
| Family | `/family` | ✅ **Connected** | Family member list, pending invites |
| Settings | `/settings` | ✅ Stub | User and app preferences |
| Calendar Settings | `/settings/calendar` | ✅ **Complete** | ICS feeds (with events/birthdays), Google Calendar connection |

---

## Development Setup

### Prerequisites
- Node.js 18+
- Supabase account

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit with your Supabase credentials

# 3. Run database migration
# Go to Supabase Dashboard -> SQL Editor
# Paste contents of: supabase/migrations/001_initial_schema.sql
# Click Run

# 4. Start dev server
npm run dev
```

---

## Next Steps (Priority Order)

### Phase 2.5 (High Priority) ✅ Complete

1. ~~**Onboarding Flow**~~ ✅ Complete
   - ~~Create family on signup~~
   - ~~Link user to family_members table~~
   - ~~Redirect to dashboard~~

2. ~~**Create/Edit Modals**~~ ✅ All Entity Modals Complete
   - ~~Task creation modal~~ ✅
   - ~~Goal creation modal~~ ✅ (qualitative + quantitative support)
   - ~~Habit creation modal~~ ✅ (with goal linking)
   - ~~Project creation modal~~ ✅ (with status, owner, icon)
   - ~~Someday item creation modal~~ ✅ (with category, estimated cost)

3. ~~**Task Detail Panel**~~ ✅ Via TaskModal
   - ~~Modal form~~ ✅ (using modal instead of slide-out)
   - ~~Full edit form~~ ✅
   - Subtasks management (pending)

4. ~~**Additional Components**~~ ✅ Core Complete
   - DatePicker (pending)
   - ~~Dialog/Modal~~ ✅
   - ~~Select dropdown~~ ✅
   - ~~FamilyMemberPicker~~ ✅
   - ~~ProjectPicker~~ ✅
   - ~~GoalPicker~~ ✅
   - ~~ProgressBar~~ ✅

### Phase 3 (Medium Priority)

5. **Family & Member Profiles** *(See `AI_Dev_Docs/15-profile-architecture.md`)*
   - Add `profile` JSONB column to families and family_members tables
   - Create `useProfiles` hooks for reading/updating profiles
   - Build Family Profile page (`/settings/family-profile`)
   - Build Member Profile page (`/settings/profile`)
   - Progressive profile collection prompts
   - Prepare for AI personalization integration

6. **Real-time Updates**
   - Supabase subscriptions
   - Cross-family-member sync

7. **Improve Settings Page**
   - Connect to actual user preferences
   - Theme switching (light/dark)
   - Notification preferences

### Phase 4 (Lower Priority)

8. **Meals & Recipes**
   - Recipe library
   - Meal calendar
   - Grocery list generation

9. **Family Meeting View**
   - Weekly check-in UI
   - Milestone celebration

10. **Calendar View**
    - All dated items
    - Week/month views

11. **Personal Dashboard (/me)**
    - User-specific view
    - Personal goals and habits

### Phase 5 (AI Integration)

12. **AI-Powered Personalization** *(Enabled by Profiles)*
    - Profile context builder for AI prompts
    - Personalized task suggestions
    - Smart celebration messages based on love language
    - Meal planning with dietary awareness
    - Context-aware reminders

---

## Architecture Decisions

### Why These Choices?

| Decision | Rationale |
|----------|-----------|
| Next.js App Router | Server components, great DX |
| Supabase | All-in-one (DB, Auth, Realtime) |
| Magic Link Auth | Passwordless = better UX, more secure |
| TanStack Query | Best-in-class caching |
| Custom components vs shadcn | Full control, learning opportunity |
| Inline components in pages | MVP speed, extract later |

### Patterns Established

1. **Query Key Factory** - Consistent cache keys in `lib/query-keys.ts`
2. **Optimistic Updates** - Instant UI feedback for mutations
3. **Emoji Logging** - Friendly dev experience with debugging info
4. **RLS-First** - Security at database level
5. **Modular Hooks** - One hook file per entity
6. **Magic Link Auth** - Passwordless authentication
7. **Navigation Handlers** - Consistent logging + routing pattern
8. **JSDoc Comments** - Clear documentation for all hooks and components
9. **Loading Skeletons** - Per-page loading states
10. **Error Boundaries** - Graceful error handling with retry options
11. **AuthProvider Context** - Centralized auth state management (no redundant queries)

---

## File Reference

```
fam_app/
├── app/
│   ├── (app)/
│   │   ├── layout.tsx          # App shell with sidebar
│   │   ├── page.tsx            # Dashboard
│   │   ├── tasks/page.tsx      # Tasks list
│   │   ├── kanban/page.tsx     # Unified Kanban board (tasks + events)
│   │   ├── habits/page.tsx     # Habits with streaks
│   │   ├── inbox/page.tsx      # Quick capture (connected to DB)
│   │   ├── today/page.tsx      # Daily focus view (connected to DB)
│   │   ├── goals/page.tsx      # Goal tracking (connected to DB)
│   │   ├── projects/page.tsx   # Project management (connected to DB)
│   │   ├── someday/page.tsx    # Wishlist ideas (connected to DB)
│   │   ├── family/page.tsx     # Family members (connected to DB)
│   │   └── settings/page.tsx   # User preferences (stub)
│   ├── (auth)/
│   │   ├── login/page.tsx      # Magic link login
│   │   ├── signup/page.tsx     # Magic link signup
│   │   ├── check-email/page.tsx # Email confirmation
│   │   └── onboarding/page.tsx # Family setup (new users)
│   ├── auth/callback/route.ts   # Magic link callback
│   ├── layout.tsx              # Root layout
│   └── globals.css
├── components/
│   ├── ui/                     # 7 components (button, input, card, checkbox, spinner, dialog, select)
│   ├── shared/                 # 7 components (avatar, badge, empty-state, progress-bar, family-member-picker, project-picker, goal-picker)
│   ├── modals/                 # 6 components (task-modal, goal-modal, habit-modal, project-modal, someday-modal, event-modal)
│   ├── kanban/                 # 7 components (kanban-board, kanban-column, kanban-card-content, kanban-card, kanban-sortable-card, kanban-drag-overlay, kanban-drop-indicator)
│   ├── layout/                 # 3 components
│   └── providers.tsx
├── lib/
│   ├── contexts/               # 1 context (auth-context) - AuthProvider for centralized auth state
│   ├── supabase/               # 4 files (client, server, middleware, admin)
│   ├── hooks/                  # 10 hooks (auth, tasks, habits, goals, projects, someday, family, calendar, family-events, kanban)
│   ├── constants/              # 1 file (kanban-styles) - Shared style constants
│   ├── utils/                  # 3 utilities (cn, logger, ics-generator)
│   ├── query-client.ts
│   └── query-keys.ts
├── types/
│   ├── database.ts
│   ├── calendar.ts
│   └── kanban.ts
├── supabase/migrations/001_initial_schema.sql
├── middleware.ts
├── .env.example
└── README.md
```

---

## Contributing

When adding new features:

1. **Database Changes** -> Add to migrations folder
2. **New Hook** -> Create in `lib/hooks/use-{entity}.ts`
3. **New Component** -> Add to appropriate folder in `components/`
4. **Query Keys** -> Add to `lib/query-keys.ts`
5. **Types** -> Add to `types/database.ts`

Keep files under 400 lines. Extract components when they grow.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-23 | Hazel + Claude | Initial PRD |
| 1.1 | 2024-12-23 | Claude | Added implementation status section |
| 1.2 | 2024-12-23 | Claude | Updated auth to magic link |
| 1.3 | 2024-12-25 | Claude | Added 7 stub pages |
| 1.4 | 2024-12-25 | Claude | Added useGoals and useProjects hooks |
| 1.5 | 2024-12-25 | Claude | Connected ALL pages to database (inbox, today, goals, projects, someday, family) |
| 1.6 | 2024-12-25 | Claude | Wired dashboard to real data (tasks, habits, goals with live updates) |
| 1.7 | 2024-12-26 | Claude | Added onboarding flow for new users (family creation) |
| 1.8 | 2024-12-26 | Claude | Added TaskModal, Dialog, Select, entity pickers (FamilyMember, Project, Goal), ProgressBar |
| 1.9 | 2024-12-26 | Claude | Added GoalModal, HabitModal, full inbox triage (Goal/Habit), linked entity counts on Goals/Projects pages |
| 2.0 | 2024-12-26 | Claude | Added ProjectModal, SomedayModal, inbox badge count, wired create/edit on Projects & Someday pages |
| 2.1 | 2024-12-26 | Claude | Habits/Today modal connections: useUpdateHabit, useWeeklyHabitLogs, click-to-edit habits, create habit from Today |
| 3.0 | 2024-12-26 | Claude | Dashboard & Inbox UI/UX: Dashboard habits/goals click-to-edit, Add buttons open modals; Inbox triage uses modals for Project/Someday; Today Add Task button |
| 3.1 | 2024-12-26 | Claude | Added Profiles Feature to roadmap (Phase 3), AI Integration (Phase 5); references 15-profile-architecture.md |
| 3.2 | 2024-12-26 | Claude | Added Calendar Integration: ICS feeds (export) + Google Calendar import. See 16-google-calendar-integration.md |
| 3.3 | 2024-12-28 | Claude | Added Unified Kanban Board: tasks + events in configurable columns (time/status/priority), drag-drop, time scope filters |
| 3.4 | 2024-12-28 | Claude | UI/UX Cleanup: Extracted shared KanbanCardContent (DRY), centralized styles in lib/constants, fixed duplicate logging, added empty state hints |
| 3.5 | 2024-12-28 | Claude | AuthProvider Refactor: Converted useAuth to context pattern, centralized auth state in lib/contexts/auth-context.tsx, eliminated redundant family_members queries |

*This document is auto-generated. See individual docs for detailed specs.*
