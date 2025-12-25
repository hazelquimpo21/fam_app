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
│   │   ├── page.tsx            # Dashboard (/)
│   │   ├── 📁 tasks/           # Tasks feature ✅
│   │   ├── 📁 habits/          # Habits feature ✅
│   │   ├── 📁 inbox/           # Quick capture (stub)
│   │   ├── 📁 today/           # Daily focus view (stub)
│   │   ├── 📁 goals/           # Goal tracking (stub)
│   │   ├── 📁 projects/        # Project management (stub)
│   │   ├── 📁 someday/         # Wishlist ideas (stub)
│   │   ├── 📁 family/          # Family members (stub)
│   │   └── 📁 settings/        # User preferences (stub)
│   │
│   ├── 📁 (auth)/              # Public auth routes
│   │   ├── 📁 login/           # Magic link login
│   │   ├── 📁 signup/          # Magic link signup
│   │   └── 📁 check-email/     # Email confirmation
│   │
│   ├── 📁 auth/callback/       # Magic link callback handler
│   ├── layout.tsx              # Root layout (providers)
│   └── globals.css             # Global styles
│
├── 📁 components/               # React components
│   ├── 📁 ui/                  # Base primitives (Button, Input, etc.)
│   ├── 📁 shared/              # Shared components (Avatar, Badge, etc.)
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
│   │   ├── use-tasks.ts        # Tasks CRUD hooks
│   │   ├── use-habits.ts       # Habits CRUD hooks
│   │   ├── use-goals.ts        # Goals CRUD hooks (NEW)
│   │   └── use-projects.ts     # Projects CRUD hooks (NEW)
│   ├── 📁 utils/               # Utility functions
│   │   ├── cn.ts               # Class name utility
│   │   └── logger.ts           # Logging utility
│   ├── query-client.ts         # TanStack Query config
│   └── query-keys.ts           # Query key factory
│
├── 📁 types/                    # TypeScript types
│   └── database.ts             # Database entity types
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
| `family_members` | Users linked to a family |
| `tasks` | To-do items with status, dates, assignments |
| `habits` | Recurring practices with streaks |
| `habit_logs` | Daily check-ins for habits |
| `goals` | Outcomes with progress tracking |
| `projects` | Containers for related tasks |
| `milestones` | Celebrations and achievements |

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
│  6. Redirect to / (dashboard)                               │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Key Files

- `middleware.ts` - Protects routes, handles session refresh
- `lib/hooks/use-auth.ts` - Auth state with `sendMagicLink` method
- `app/(auth)/login/page.tsx` - Magic link login
- `app/(auth)/signup/page.tsx` - Magic link signup
- `app/(auth)/check-email/page.tsx` - Email confirmation screen
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

| Feature | Status | Notes |
|---------|--------|-------|
| Database Schema | ✅ Complete | 17 tables with RLS |
| Magic Link Auth | ✅ Complete | Passwordless login |
| Dashboard | ✅ Complete | Stats, previews, **navigation buttons working** |
| Tasks | ✅ Complete | Full CRUD, filters |
| Habits | ✅ Complete | Streaks, logging |
| Inbox | ✅ Stub | UI ready, needs DB hook connection |
| Today | ✅ Stub | UI ready, needs DB hook connection |
| Goals | ✅ Hook Ready | UI ready, **hook created** |
| Projects | ✅ Hook Ready | UI ready, **hook created** |
| Someday | ✅ Stub | UI ready, needs DB hook |
| Family | ✅ Stub | UI ready, needs DB hook |
| Settings | ✅ Stub | UI ready, needs DB hook |
| Meals | 🔨 Pending | Not started |
| Calendar | 🔨 Pending | Not started |

> **"Stub" pages** have complete UI scaffolding with mock data. **"Hook Ready"** pages have database hooks created but UI not yet connected.

See `AI_Dev_Docs/00-IMPLEMENTATION-STATUS.md` for detailed status.

---

Made with ❤️ for families everywhere.
