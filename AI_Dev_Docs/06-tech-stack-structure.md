# Fam — Tech Stack & Project Structure

## Overview

This document defines the technology choices and project organization for Fam. The goal is a modular, maintainable codebase that an AI dev (or future team) can easily navigate and extend.

---

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Framework** | Next.js 14+ (App Router) | Server components, file-based routing, great DX |
| **Language** | TypeScript (strict mode) | Type safety, better IDE support, self-documenting |
| **Styling** | Tailwind CSS | Utility-first, design tokens, consistent |
| **UI Components** | shadcn/ui | Accessible, customizable, copy-paste ownership |
| **Database** | Supabase (PostgreSQL) | Realtime, auth, RLS, great DX |
| **Auth** | Supabase Auth | Magic links (passwordless), OAuth ready |
| **State (server)** | TanStack Query v5 | Caching, optimistic updates, background refetch |
| **State (client)** | Zustand | Lightweight, simple, no boilerplate |
| **Forms** | React Hook Form + Zod | Validation, performance, type inference |
| **Dates** | date-fns | Lightweight, tree-shakeable, immutable |
| **Icons** | Lucide React | Consistent, comprehensive, tree-shakeable |
| **Hosting** | Vercel | Perfect Next.js integration, edge functions |
| **Testing** | Vitest + React Testing Library | Fast, modern, compatible |
| **E2E Testing** | Playwright | Cross-browser, reliable |

---

## Project Structure

```
fam/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group (no layout)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   ├── check-email/
│   │   │   └── page.tsx
│   │   ├── onboarding/           # Family setup for new users
│   │   │   └── page.tsx
│   │   └── forgot-password/
│   │       └── page.tsx
│   │
│   ├── (app)/                    # Main app route group (with layout)
│   │   ├── layout.tsx            # App shell with sidebar
│   │   ├── page.tsx              # Home / Family Dashboard
│   │   ├── me/
│   │   │   └── page.tsx          # Personal Dashboard
│   │   ├── inbox/
│   │   │   └── page.tsx
│   │   ├── today/
│   │   │   └── page.tsx
│   │   ├── calendar/
│   │   │   └── page.tsx
│   │   ├── tasks/
│   │   │   ├── page.tsx          # Task list/kanban
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Task detail (optional full page)
│   │   ├── habits/
│   │   │   └── page.tsx
│   │   ├── goals/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── someday/
│   │   │   └── page.tsx
│   │   ├── meals/
│   │   │   └── page.tsx
│   │   ├── recipes/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── meeting/
│   │   │   └── page.tsx
│   │   ├── people/
│   │   │   ├── family/
│   │   │   │   └── page.tsx
│   │   │   ├── contacts/
│   │   │   │   └── page.tsx
│   │   │   └── vendors/
│   │   │       └── page.tsx
│   │   ├── places/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── api/                      # API routes (if needed)
│   │   └── webhooks/
│   │       └── route.ts
│   │
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles, Tailwind imports
│   └── providers.tsx             # Client providers wrapper
│
├── components/                   # Shared components
│   ├── ui/                       # Base UI components (shadcn)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── progress.tsx
│   │   ├── select.tsx
│   │   ├── skeleton.tsx
│   │   ├── toast.tsx
│   │   └── tooltip.tsx
│   │
│   ├── layout/                   # Layout components
│   │   ├── sidebar.tsx
│   │   ├── mobile-nav.tsx
│   │   ├── top-bar.tsx
│   │   ├── page-header.tsx
│   │   └── app-shell.tsx
│   │
│   ├── shared/                   # Shared app components
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── date-picker.tsx
│   │   ├── empty-state.tsx
│   │   ├── family-member-picker.tsx
│   │   ├── loading-spinner.tsx
│   │   ├── quick-add-modal.tsx
│   │   ├── search-modal.tsx
│   │   └── streak-badge.tsx
│   │
│   └── features/                 # Feature-specific components
│       ├── tasks/
│       │   ├── task-card.tsx
│       │   ├── task-detail-panel.tsx
│       │   ├── task-form.tsx
│       │   ├── task-list.tsx
│       │   ├── task-kanban.tsx
│       │   └── task-checkbox.tsx
│       ├── habits/
│       │   ├── habit-card.tsx
│       │   ├── habit-form.tsx
│       │   ├── habit-streak.tsx
│       │   └── habit-heatmap.tsx
│       ├── goals/
│       │   ├── goal-card.tsx
│       │   ├── goal-form.tsx
│       │   └── goal-progress.tsx
│       ├── projects/
│       │   ├── project-card.tsx
│       │   ├── project-form.tsx
│       │   └── project-tasks.tsx
│       ├── meals/
│       │   ├── meal-calendar.tsx
│       │   ├── meal-cell.tsx
│       │   └── recipe-card.tsx
│       ├── meeting/
│       │   ├── meeting-section.tsx
│       │   ├── milestone-list.tsx
│       │   └── action-item-form.tsx
│       └── dashboard/
│           ├── stats-card.tsx
│           ├── milestones-preview.tsx
│           └── upcoming-birthdays.tsx
│
├── lib/                          # Core utilities
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   ├── middleware.ts         # Auth middleware helper
│   │   └── types.ts              # Generated types (supabase gen types)
│   │
│   ├── hooks/                    # Custom hooks
│   │   ├── use-tasks.ts
│   │   ├── use-habits.ts
│   │   ├── use-goals.ts
│   │   ├── use-projects.ts
│   │   ├── use-family.ts
│   │   ├── use-current-user.ts
│   │   └── use-keyboard-shortcut.ts
│   │
│   ├── stores/                   # Zustand stores
│   │   ├── ui-store.ts           # Sidebar state, modals, etc.
│   │   └── quick-add-store.ts
│   │
│   ├── utils/
│   │   ├── cn.ts                 # Classname helper (clsx + twMerge)
│   │   ├── dates.ts              # Date formatting helpers
│   │   ├── recurrence.ts         # Recurrence calculation helpers
│   │   └── format.ts             # Number, currency formatters
│   │
│   └── validations/              # Zod schemas
│       ├── task.ts
│       ├── habit.ts
│       ├── goal.ts
│       ├── project.ts
│       ├── recipe.ts
│       └── family-member.ts
│
├── types/                        # TypeScript types
│   ├── database.ts               # Supabase generated types
│   ├── entities.ts               # App-level entity types
│   └── api.ts                    # API request/response types
│
├── public/                       # Static assets
│   ├── icons/
│   ├── images/
│   └── fonts/
│
├── supabase/                     # Supabase local config
│   ├── migrations/               # Database migrations
│   │   ├── 20241223000000_initial_schema.sql
│   │   └── ...
│   ├── seed.sql                  # Seed data for dev
│   └── config.toml
│
├── tests/                        # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.local                    # Local env vars (not committed)
├── .env.example                  # Example env vars
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
├── package.json
└── README.md
```

---

## File Guidelines

### Maximum File Length: ~400 Lines

If a file exceeds 400 lines:
1. Extract components into separate files
2. Extract hooks into `lib/hooks/`
3. Extract utilities into `lib/utils/`
4. Split large forms into step components

### Component File Structure

```tsx
// components/features/tasks/task-card.tsx

// 1. Imports (grouped: react, external, internal, types)
import { useState } from 'react'
import { format } from 'date-fns'
import { CheckSquare } from 'lucide-react'

import { cn } from '@/lib/utils/cn'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar } from '@/components/shared/avatar'
import type { Task } from '@/types/entities'

// 2. Types
interface TaskCardProps {
  task: Task
  onComplete: (id: string) => void
  onSelect: (id: string) => void
  className?: string
}

// 3. Component (prefer function declaration for main export)
export function TaskCard({ 
  task, 
  onComplete, 
  onSelect,
  className 
}: TaskCardProps) {
  // Hooks first
  const [isHovered, setIsHovered] = useState(false)
  
  // Derived state
  const isOverdue = task.due_date && new Date(task.due_date) < new Date()
  
  // Handlers
  const handleComplete = () => {
    onComplete(task.id)
  }
  
  // Render
  return (
    <Card 
      className={cn(
        'p-4 cursor-pointer transition-shadow hover:shadow-lg',
        isOverdue && 'border-l-4 border-l-error-main',
        className
      )}
      onClick={() => onSelect(task.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Component content */}
    </Card>
  )
}

// 4. Sub-components (if small and only used here)
function DueDate({ date }: { date: string }) {
  return <span>{format(new Date(date), 'MMM d')}</span>
}
```

### Hook File Structure

```tsx
// lib/hooks/use-tasks.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { Task } from '@/types/entities'

// Query keys factory
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
}

// Types
interface TaskFilters {
  status?: string
  assignedTo?: string
  projectId?: string
}

// Fetch function
async function fetchTasks(filters: TaskFilters): Promise<Task[]> {
  let query = supabase
    .from('tasks')
    .select('*')
    .is('deleted_at', null)
    .order('due_date', { ascending: true })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  
  if (filters.assignedTo) {
    query = query.eq('assigned_to_id', filters.assignedTo)
  }
  
  if (filters.projectId) {
    query = query.eq('project_id', filters.projectId)
  }

  const { data, error } = await query
  
  if (error) throw error
  return data
}

// Query hook
export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => fetchTasks(filters),
  })
}

// Mutation hook
export function useCompleteTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ 
          status: 'done',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}
```

---

## Naming Conventions

### Files & Folders
- **kebab-case** for all files and folders
- Components: `task-card.tsx` (not `TaskCard.tsx`)
- Hooks: `use-tasks.ts`
- Utils: `format-date.ts`

### Code
- **PascalCase** for components and types
- **camelCase** for functions, variables, hooks
- **SCREAMING_SNAKE_CASE** for constants
- **snake_case** for database columns (matches Supabase)

### Examples

```tsx
// File: components/features/tasks/task-card.tsx
// Component: TaskCard
// Hook: useTaskCard (if it had one)
// Type: TaskCardProps

const MAX_TITLE_LENGTH = 100

function formatTaskTitle(title: string): string {
  return title.slice(0, MAX_TITLE_LENGTH)
}

interface Task {
  id: string
  title: string
  due_date: string | null  // Matches DB column
}
```

---

## Import Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["components/*"],
      "@/lib/*": ["lib/*"],
      "@/types/*": ["types/*"]
    }
  }
}
```

**Import Order:**
1. React
2. External packages
3. Internal aliases (@/)
4. Relative imports
5. Types (use `import type`)

```tsx
import { useState, useEffect } from 'react'

import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'

import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { TaskCard } from './task-card'

import type { Task } from '@/types/entities'
```

---

## Environment Variables

```bash
# .env.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Future: Analytics, etc.
# NEXT_PUBLIC_POSTHOG_KEY=
```

**Rules:**
- `NEXT_PUBLIC_*` = exposed to browser
- No prefix = server-only
- Never commit `.env.local`

---

## Code Comments

### When to Comment

```tsx
// DO: Explain WHY, not WHAT
// We check both due_date and scheduled_date because some users prefer
// to schedule tasks for specific days rather than set hard deadlines.
const isRelevantToday = task.due_date === today || task.scheduled_date === today

// DON'T: State the obvious
// Get the task title
const title = task.title
```

### Comment Types

```tsx
// Single line for brief explanations

/**
 * Multi-line for function documentation.
 * Include params and return type for complex functions.
 * 
 * @param taskId - The UUID of the task to complete
 * @returns The updated task object
 */

// TODO: Short description of what needs doing
// FIXME: Description of known bug
// HACK: Explanation of why this workaround exists
```

---

## Error Handling

```tsx
// Use try/catch with typed errors
try {
  const { data, error } = await supabase.from('tasks').select()
  if (error) throw error
  return data
} catch (error) {
  // Log for debugging
  console.error('Failed to fetch tasks:', error)
  
  // Re-throw or return error state
  throw new Error('Unable to load tasks. Please try again.')
}

// For mutations, use toast notifications
const { mutate } = useCompleteTask()

mutate(taskId, {
  onError: (error) => {
    toast.error('Failed to complete task')
    console.error(error)
  },
  onSuccess: () => {
    toast.success('Task completed! 🎉')
  },
})
```

---

## Performance Guidelines

### React
- Use `React.memo` sparingly, only for expensive components
- Prefer composition over context for passing data
- Use `useMemo` / `useCallback` when passing to memoized children

### Data Fetching
- Use TanStack Query for all server state
- Set appropriate `staleTime` (5 min for lists, 1 min for details)
- Use optimistic updates for instant feedback

### Images
- Use Next.js `Image` component
- Provide width/height or use `fill`
- Use appropriate formats (WebP where supported)

### Bundle
- Import icons individually: `import { Check } from 'lucide-react'`
- Use dynamic imports for heavy components
- Analyze bundle with `@next/bundle-analyzer`

---

## Supabase Patterns

### Client Setup

```tsx
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Server Setup

```tsx
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### Realtime Subscriptions

```tsx
// In a component or hook
useEffect(() => {
  const channel = supabase
    .channel('tasks')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `family_id=eq.${familyId}`,
      },
      (payload) => {
        // Invalidate query to refetch
        queryClient.invalidateQueries({ queryKey: taskKeys.all })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [familyId, queryClient])
```

---

## AI Integration Points (Future)

When adding AI features, follow this pattern:

```tsx
// lib/ai/analyze-task.ts
interface AITaskSuggestion {
  suggestedProject?: string
  suggestedPriority?: number
  suggestedDueDate?: string
  reasoning: string
}

export async function analyzeTask(title: string): Promise<AITaskSuggestion> {
  // Call GPT-4o-mini or similar
  // Return structured suggestion
}
```

**Principles:**
- AI features are always suggestions, never auto-applied
- Store `ai_suggested: true` flag on AI-generated content
- Allow users to dismiss/modify AI suggestions
- Log AI interactions for improvement (with consent)

---

---

## 🚀 Implementation Status

> **Last Updated:** December 2024

### Tech Stack Implementation

| Technology | Spec | Implemented | Notes |
|------------|------|-------------|-------|
| Next.js 14 (App Router) | ✅ | ✅ | Using latest App Router patterns |
| TypeScript (strict) | ✅ | ✅ | Strict mode enabled |
| Tailwind CSS | ✅ | ✅ | With design tokens |
| shadcn/ui | ✅ | ⚠️ Partial | Custom components inspired by shadcn |
| Supabase | ✅ | ✅ | PostgreSQL, Auth, RLS |
| TanStack Query v5 | ✅ | ✅ | With query key factory |
| Zustand | ✅ | 🔨 Pending | Not yet implemented |
| React Hook Form + Zod | ✅ | ✅ | Auth forms done |
| date-fns | ✅ | ✅ | Date formatting |
| Lucide React | ✅ | ✅ | Icon library |
| Sonner | ✅ | ✅ | Toast notifications |
| Vitest / Playwright | ✅ | 🔨 Pending | Tests not yet written |

### Project Structure (Actual vs. Spec)

```
fam_app/                       # ✅ Implemented
├── app/                       # ✅ Next.js App Router
│   ├── (auth)/               # ✅ Auth routes
│   │   ├── login/            # ✅
│   │   ├── signup/           # ✅
│   │   ├── check-email/      # ✅
│   │   └── onboarding/       # ✅ Family setup
│   ├── (app)/                # ✅ Authenticated routes
│   │   ├── layout.tsx        # ✅ App shell
│   │   ├── page.tsx          # ✅ Dashboard
│   │   ├── tasks/            # ✅ Full feature
│   │   ├── habits/           # ✅ Full feature
│   │   ├── inbox/            # ✅ Connected to DB
│   │   ├── today/            # ✅ Connected to DB
│   │   ├── goals/            # ✅ Connected to DB
│   │   ├── projects/         # ✅ Connected to DB
│   │   ├── someday/          # ✅ Connected to DB
│   │   ├── family/           # ✅ Connected to DB
│   │   └── settings/         # ✅ Stub page
│   ├── auth/callback/        # ✅
│   ├── layout.tsx            # ✅
│   └── globals.css           # ✅
│
├── components/               # ✅
│   ├── ui/                   # ✅ 5 components
│   │   ├── button.tsx        # ✅ With variants & loading
│   │   ├── input.tsx         # ✅ With icons & errors
│   │   ├── card.tsx          # ✅ Composable
│   │   ├── checkbox.tsx      # ✅ Animated
│   │   └── spinner.tsx       # ✅
│   ├── shared/               # ✅ 3 components
│   │   ├── avatar.tsx        # ✅ With initials fallback
│   │   ├── badge.tsx         # ✅ Includes StreakBadge
│   │   └── empty-state.tsx   # ✅
│   ├── layout/               # ✅ 3 components
│   │   ├── app-shell.tsx     # ✅
│   │   ├── sidebar.tsx       # ✅
│   │   └── top-bar.tsx       # ✅
│   └── providers.tsx         # ✅
│
├── lib/                      # ✅
│   ├── supabase/             # ✅
│   │   ├── client.ts         # ✅ Browser client
│   │   ├── server.ts         # ✅ Server client
│   │   └── middleware.ts     # ✅
│   ├── hooks/                # ✅ 7 hooks
│   │   ├── use-auth.ts       # ✅ Auth state
│   │   ├── use-tasks.ts      # ✅ Full CRUD + inbox/today/overdue
│   │   ├── use-habits.ts     # ✅ Full CRUD
│   │   ├── use-goals.ts      # ✅ Full CRUD
│   │   ├── use-projects.ts   # ✅ Full CRUD
│   │   ├── use-someday.ts    # ✅ Full CRUD
│   │   └── use-family.ts     # ✅ Full CRUD + invites
│   ├── utils/                # ✅
│   │   ├── cn.ts             # ✅
│   │   └── logger.ts         # ✅
│   ├── query-client.ts       # ✅
│   └── query-keys.ts         # ✅
│
├── types/                    # ✅
│   └── database.ts           # ✅ All entity types
│
├── supabase/                 # ✅
│   └── migrations/           # ✅
│       └── 001_initial_schema.sql # ✅
│
├── middleware.ts             # ✅ Route protection
├── .env.example              # ✅
└── README.md                 # ✅ Comprehensive
```

### Not Yet Implemented (From Spec)

| Item | Priority | Notes |
|------|----------|-------|
| `lib/stores/` (Zustand) | Low | Client state minimal so far |
| `lib/validations/` | Medium | Zod schemas for all entities |
| `components/features/` | High | Feature-specific components |
| `tests/` directory | Medium | Unit and E2E tests |
| Mobile nav | Low | Currently responsive sidebar |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-23 | Hazel + Claude | Initial tech stack |
| 1.1 | 2024-12-23 | Claude | Added implementation status |
| 1.2 | 2024-12-23 | Claude | Updated auth to magic link (passwordless) |
| 1.3 | 2024-12-25 | Claude | Added 7 stub pages, updated project structure |
| 1.4 | 2024-12-25 | Claude | All pages now connected to database (7 hooks total) |
| 1.5 | 2024-12-26 | Claude | Added onboarding page for new user family creation |
