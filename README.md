# 🏠 Fam - Family Command Center

> **A modern family productivity app** for organizing tasks, habits, goals, and more.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)](https://tailwindcss.com/)

---

## 📚 Table of Contents

1. [Quick Start](#-quick-start)
2. [Architecture Overview](#-architecture-overview)
3. [Project Structure](#-project-structure)
4. [Key Concepts](#-key-concepts)
5. [Database Setup](#-database-setup)
6. [Authentication Flow](#-authentication-flow)
7. [State Management](#-state-management)
8. [Adding New Features](#-adding-new-features)
9. [Common Patterns](#-common-patterns)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works!)
- Git

### Step 1: Clone & Install

```bash
# Clone the repo
git clone <your-repo-url>
cd fam_app

# Install dependencies
npm install
```

### Step 2: Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run it in the SQL Editor

### Step 3: Configure Environment

```bash
# Copy the example env file
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# Get these from Supabase Dashboard → Settings → API
```

Your `.env.local` should look like:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Pages     │  │ Components  │  │    Hooks    │             │
│  │  (Routes)   │  │   (UI)      │  │  (Logic)    │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┴────────────────┘                     │
│                          │                                      │
│                    TanStack Query                               │
│                   (Cache & State)                               │
│                          │                                      │
├──────────────────────────┼──────────────────────────────────────┤
│                          │                                      │
│              Supabase Client (Browser/Server)                   │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Supabase)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  PostgreSQL │  │    Auth     │  │  Realtime   │             │
│  │  (Database) │  │  (Login)    │  │ (WebSocket) │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  Row Level Security (RLS) ensures data isolation per family     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 14 (App Router) | React framework with SSR/SSG |
| **Language** | TypeScript | Type safety |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Database** | Supabase (PostgreSQL) | Backend-as-a-Service |
| **Auth** | Supabase Auth | Magic link (passwordless) authentication |
| **State** | TanStack Query | Server state management |
| **Forms** | React Hook Form + Zod | Form handling & validation |
| **Notifications** | Sonner | Toast notifications |

---

## 📁 Project Structure

```
fam_app/
├── 📁 app/                      # Next.js App Router pages
│   ├── 📁 (app)/               # Authenticated routes (with layout)
│   │   ├── layout.tsx          # App shell wrapper
│   │   ├── page.tsx            # Dashboard (/) ✅ Connected
│   │   ├── 📁 tasks/           # Tasks feature ✅
│   │   ├── 📁 habits/          # Habits feature ✅
│   │   ├── 📁 inbox/           # Quick capture ✅ Connected
│   │   ├── 📁 today/           # Daily focus view ✅ Connected
│   │   ├── 📁 goals/           # Goal tracking ✅ Connected
│   │   ├── 📁 projects/        # Project management ✅ Connected
│   │   ├── 📁 someday/         # Wishlist ideas ✅ Connected
│   │   ├── 📁 kanban/          # Unified Kanban board ✅ NEW
│   │   ├── 📁 family/          # Family members ✅ Connected
│   │   └── 📁 settings/        # User preferences (stub)
│   │
│   ├── 📁 (auth)/              # Public auth routes
│   │   ├── 📁 login/           # Magic link login
│   │   ├── 📁 signup/          # Magic link signup
│   │   ├── 📁 check-email/     # Email confirmation
│   │   └── 📁 onboarding/      # Family setup (post-auth)
│   │
│   ├── 📁 auth/callback/       # Magic link callback handler
│   ├── layout.tsx              # Root layout (providers)
│   └── globals.css             # Global styles
│
├── 📁 components/               # React components
│   ├── 📁 ui/                  # Base primitives (Button, Input, Dialog, etc.)
│   ├── 📁 shared/              # Shared components (Avatar, Badge, Pickers, etc.)
│   ├── 📁 modals/              # Modal components for entity CRUD
│   │   ├── task-modal.tsx      # Task create/edit modal
│   │   ├── goal-modal.tsx      # Goal create/edit modal
│   │   ├── habit-modal.tsx     # Habit create/edit modal
│   │   ├── project-modal.tsx   # Project create/edit modal
│   │   ├── someday-modal.tsx   # Someday create/edit modal
│   │   └── event-modal.tsx     # Event create/edit modal ✅ NEW
│   ├── 📁 kanban/              # Kanban board components ✅ NEW
│   │   ├── kanban-board.tsx    # Main board with controls
│   │   ├── kanban-column.tsx   # Column with header and drop zone
│   │   └── kanban-card.tsx     # Unified card for tasks/events
│   ├── 📁 features/            # Feature-specific components
│   ├── 📁 layout/              # Layout components (Sidebar, TopBar)
│   └── providers.tsx           # App providers wrapper
│
├── 📁 lib/                      # Core utilities
│   ├── 📁 supabase/            # Supabase client utilities
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   └── middleware.ts       # Middleware client
│   ├── 📁 hooks/               # Custom React hooks
│   │   ├── use-auth.ts         # Authentication hook
│   │   ├── use-tasks.ts        # Tasks CRUD hooks (inbox, today, overdue)
│   │   ├── use-habits.ts       # Habits CRUD hooks
│   │   ├── use-goals.ts        # Goals CRUD hooks
│   │   ├── use-projects.ts     # Projects CRUD hooks
│   │   ├── use-someday.ts      # Someday items CRUD hooks
│   │   ├── use-family.ts       # Family members & invites hooks
│   │   ├── use-calendar.ts     # Calendar feed & Google sync hooks
│   │   ├── use-family-events.ts # Family events CRUD hooks
│   │   └── use-kanban.ts       # Kanban board data & mutations ✅ NEW
│   ├── 📁 utils/               # Utility functions
│   │   ├── cn.ts               # Class name utility
│   │   └── logger.ts           # Logging utility
│   ├── query-client.ts         # TanStack Query config
│   └── query-keys.ts           # Query key factory
│
├── 📁 types/                    # TypeScript types
│   ├── database.ts             # Database entity types
│   ├── calendar.ts             # Calendar/event types
│   └── kanban.ts               # Kanban board types ✅ NEW
│
├── 📁 supabase/                 # Supabase configuration
│   └── 📁 migrations/          # SQL migrations
│       └── 001_initial_schema.sql
│
├── middleware.ts                # Next.js middleware (auth)
├── .env.example                 # Environment variables template
└── README.md                    # This file!
```

---

## 🔑 Key Concepts

### 1. Family-Based Data Isolation

All data in Fam is scoped to a **Family**. Each family member belongs to one family, and Row Level Security (RLS) ensures users can only see their family's data.

```
Family (Johnson Family)
├── Family Members
│   ├── Hazel (owner)
│   ├── Mike (adult)
│   └── Zelda (kid)
├── Tasks (visible to all members)
├── Habits (owned by individual members)
├── Goals (personal or family-wide)
└── Projects (shared)
```

### 2. Task Status Workflow

Tasks flow through these states:

```
┌─────────┐   Process   ┌─────────┐   Work    ┌─────────┐
│  INBOX  │ ──────────▶ │ ACTIVE  │ ────────▶ │  DONE   │
└─────────┘             └─────────┘           └─────────┘
     │                       │
     │ Delegate              │ Block
     ▼                       ▼
┌─────────────┐        ┌─────────────┐
│ WAITING_FOR │        │   SOMEDAY   │
└─────────────┘        └─────────────┘
```

### 3. Role-Based Permissions

| Role | Capabilities |
|------|--------------|
| **Owner** | Full access + family settings + invite members |
| **Adult** | Full feature access (no admin) |
| **Kid** | View + complete assigned tasks + log own habits |

---

## 💾 Database Setup

### Running Migrations

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run**

### Key Tables

| Table | Purpose |
|-------|---------|
| `families` | Top-level container for all data |
| `family_members` | Users linked to a family (with rich profiles) |
| `tasks` | To-do items with status, dates, assignments |
| `habits` | Recurring practices with streaks |
| `habit_logs` | Daily check-ins for habits |
| `goals` | Outcomes with progress tracking |
| `projects` | Containers for related tasks |
| `milestones` | Celebrations and achievements |

**Profile Data:**
- `families.profile` - JSONB with family identity, values, traditions, AI preferences
- `family_members.profile` - JSONB with personality, interests, dietary restrictions, communication preferences

*(See `AI_Dev_Docs/15-profile-architecture.md` for full profile spec)*

### Row Level Security

All tables have RLS policies that:
- Allow users to see only their family's data
- Enforce role-based permissions for mutations
- Use helper functions like `get_my_family_id()`

---

## 🔐 Authentication Flow

Fam uses **passwordless magic link authentication** for better UX and security.

```
┌────────────────────────────────────────────────────────────┐
│                  MAGIC LINK AUTH FLOW                       │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User enters email on /login or /signup                  │
│                    │                                        │
│                    ▼                                        │
│  2. Magic link sent to email                                │
│                    │                                        │
│                    ▼                                        │
│  3. Redirect to /check-email (confirmation page)            │
│                    │                                        │
│                    ▼                                        │
│  4. User clicks link in email                               │
│                    │                                        │
│                    ▼                                        │
│  5. /auth/callback exchanges code for session               │
│                    │                                        │
│                    ▼                                        │
│  6. Middleware checks for family_member record              │
│                    │                                        │
│        ┌──────────┴──────────┐                              │
│        ▼                     ▼                              │
│  Has family?             No family?                         │
│        │                     │                              │
│        ▼                     ▼                              │
│  7a. Redirect to /      7b. Redirect to /onboarding         │
│     (dashboard)              │                              │
│                              ▼                              │
│                   8. Create family + member                 │
│                              │                              │
│                              ▼                              │
│                   9. Redirect to / (dashboard)              │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Key Files

- `lib/contexts/auth-context.tsx` - **AuthProvider** (centralized auth state management)
- `lib/hooks/use-auth.ts` - Auth hook (re-exports from AuthProvider)
- `components/providers.tsx` - Wraps app with AuthProvider
- `middleware.ts` - Protects routes, handles session refresh, enforces onboarding
- `lib/supabase/middleware.ts` - Session management, family membership check
- `app/(auth)/login/page.tsx` - Magic link login
- `app/(auth)/signup/page.tsx` - Magic link signup
- `app/(auth)/check-email/page.tsx` - Email confirmation screen
- `app/(auth)/onboarding/page.tsx` - Family creation for new users
- `app/auth/callback/route.ts` - Magic link callback handler

---

## 🔄 State Management

### TanStack Query (Server State)

All data from Supabase is managed with TanStack Query:

```typescript
// Fetching data
const { data: tasks, isLoading } = useTasks({ status: 'active' })

// Mutations with optimistic updates
const completeTask = useCompleteTask()
completeTask.mutate(taskId)
```

### Query Keys

Centralized in `lib/query-keys.ts` for consistent cache management:

```typescript
queryKeys.tasks.list({ status: 'active' })  // ['tasks', 'list', { status: 'active' }]
queryKeys.tasks.detail(id)                   // ['tasks', 'detail', '123']
queryKeys.habits.today()                     // ['habits', 'today']
```

### Cache Invalidation

When data changes, invalidate related queries:

```typescript
// After creating a task
queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
```

---

## ➕ Adding New Features

### 1. Create Types

Add types to `types/database.ts`:

```typescript
export interface NewEntity {
  id: string;
  family_id: string;
  title: string;
  // ...
}
```

### 2. Add Query Keys

In `lib/query-keys.ts`:

```typescript
export const queryKeys = {
  // ...existing keys
  newEntity: {
    all: ['newEntity'] as const,
    list: () => [...queryKeys.newEntity.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.newEntity.all, 'detail', id] as const,
  },
}
```

### 3. Create Hooks

In `lib/hooks/use-new-entity.ts`:

```typescript
export function useNewEntities() {
  const supabase = createClient()

  return useQuery({
    queryKey: queryKeys.newEntity.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('new_entities')
        .select('*')
      if (error) throw error
      return data
    },
  })
}
```

### 4. Build the Page

In `app/(app)/new-feature/page.tsx`:

```typescript
export default function NewFeaturePage() {
  const { data, isLoading } = useNewEntities()

  return (
    <div>
      {/* Your UI here */}
    </div>
  )
}
```

---

## 🎨 Common Patterns

### AuthProvider Context

Auth state is managed centrally via the AuthProvider context:

```typescript
// Access auth state anywhere in the app
import { useAuth } from '@/lib/hooks/use-auth'

function MyComponent() {
  const { user, familyMember, familyId, authState, signOut } = useAuth()

  if (authState === 'loading') return <Spinner />
  if (authState !== 'authenticated') return null

  // familyId is available without extra queries
  return <div>Family: {familyId}</div>
}
```

### Optimistic Updates

```typescript
useMutation({
  mutationFn: async (data) => {
    // API call
  },
  onMutate: async (data) => {
    // Cancel queries
    await queryClient.cancelQueries({ queryKey })

    // Snapshot
    const previous = queryClient.getQueryData(queryKey)

    // Optimistic update
    queryClient.setQueryData(queryKey, (old) => /* update */)

    return { previous }
  },
  onError: (err, data, context) => {
    // Rollback
    queryClient.setQueryData(queryKey, context?.previous)
  },
})
```

### Error Handling

```typescript
try {
  const { data, error } = await supabase.from('table').select()
  if (error) throw error
  return data
} catch (error) {
  logger.error('Failed to fetch', { error })
  throw error
}
```

### Loading States

```typescript
if (isLoading) return <Spinner />
if (error) return <EmptyState title="Error" />
if (!data?.length) return <EmptyState title="No items" />
return <List items={data} />
```

---

## 🛠️ Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

---

## 📝 Logging

The app includes a friendly logger with emojis:

```typescript
import { logger } from '@/lib/utils/logger'

logger.info('Loading tasks...')      // 📘 [12:34:56] Loading tasks...
logger.success('Task created!')      // ✅ [12:34:56] Task created!
logger.error('Failed to save')       // ❌ [12:34:56] Failed to save
logger.warn('Rate limit approaching') // ⚠️ [12:34:56] Rate limit approaching
```

---

## 🚀 Deployment (Vercel)

1. Push your code to GitHub
2. Import the repo in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (your Vercel URL)
4. Deploy!

---

## 📖 Further Reading

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 📊 Current Implementation Status

> **Last Updated:** December 2024

### Core Features

| Feature | Status | Notes |
|---------|--------|-------|
| Database Schema | ✅ Complete | 17 tables with RLS |
| Magic Link Auth | ✅ Complete | Passwordless login |
| Onboarding Flow | ✅ Complete | Family creation for new users |
| Dashboard | ✅ **Connected** | Real-time stats, tasks, habits, goals with click-to-edit modals and Add buttons |
| Tasks | ✅ Complete | Full CRUD with TaskModal |
| Habits | ✅ Complete | Streaks, logging, HabitModal create/edit |
| Goals | ✅ **Connected** | GoalModal with qualitative/quantitative support |
| Projects | ✅ **Connected** | ProjectModal with status, owner, icons |
| Someday | ✅ **Connected** | SomedayModal with categories and estimated cost |
| Inbox | ✅ **Connected** | Full triage to any entity via modals (Task/Goal/Habit/Project/Someday) |
| Today | ✅ **Connected** | Daily focus with habits, overdue, today's tasks |
| **Kanban** | ✅ **NEW** | Unified board with tasks + events, groupBy (time/status/priority), drag-drop |
| Calendar Integration | ✅ **Complete** | ICS feeds, Google Calendar import |
| Family | ✅ **Connected** | Family member list, pending invites |
| **Profiles** | 📋 Planned | Rich family + member profiles for AI |
| Settings | ✅ Stub | UI ready, needs preferences |
| Meals | 🔨 Pending | Not started |

### Modals (Entity CRUD)

| Modal | File | Status |
|-------|------|--------|
| TaskModal | `components/modals/task-modal.tsx` | ✅ Complete |
| GoalModal | `components/modals/goal-modal.tsx` | ✅ Complete |
| HabitModal | `components/modals/habit-modal.tsx` | ✅ Complete |
| ProjectModal | `components/modals/project-modal.tsx` | ✅ Complete |
| SomedayModal | `components/modals/someday-modal.tsx` | ✅ Complete |
| EventModal | `components/modals/event-modal.tsx` | ✅ Complete |

### Kanban Components

| Component | File | Purpose |
|-----------|------|---------|
| KanbanBoard | `components/kanban/kanban-board.tsx` | Main board with controls, groupBy, timeScope |
| KanbanColumn | `components/kanban/kanban-column.tsx` | Column with header, items, drop zone |
| KanbanCard | `components/kanban/kanban-card.tsx` | Unified card for tasks, events, birthdays |

> **All core pages are now connected to the Supabase database** with React Query hooks for caching and real-time updates. Full create/edit modals are available for all productivity entities. The unified Kanban board shows tasks and events together with drag-drop support.

See `AI_Dev_Docs/00-IMPLEMENTATION-STATUS.md` for detailed status.

---

Made with ❤️ for families everywhere.
