# Fam — Auth & Permissions Specification

## Overview

This document defines authentication flows, role-based access control, and Row Level Security (RLS) policies for Fam.

---

## Authentication

### Auth Provider

Fam uses **Supabase Auth** with **magic link (passwordless)** authentication.

This provides:
- ✅ Better UX (no passwords to remember)
- ✅ More secure (no password to leak/guess)
- ✅ Simpler signup flow (email only)

Future considerations:
- OAuth (Google, Apple)
- Phone/SMS

### Auth States

```typescript
type AuthState = 
  | 'loading'           // Checking session
  | 'unauthenticated'   // No session, show login
  | 'authenticated'     // Has session, has family
  | 'needs_family'      // Has session, needs to create/join family
```

### Session Management

```typescript
// lib/hooks/use-auth.ts

interface AuthContext {
  user: User | null               // Supabase auth user
  familyMember: FamilyMember | null  // App-level user with family
  family: Family | null           // Current family
  authState: AuthState
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}
```

---

## Sign Up Flow (Magic Link)

```typescript
// 1. Send magic link to user's email
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    data: { name },  // Store name in user metadata
    emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
  },
})

// 2. Redirect user to check-email confirmation page
if (!error) {
  router.push(`/check-email?email=${encodeURIComponent(email)}&type=signup`)
}

// 3. When user clicks magic link, /auth/callback handles:
//    - Exchange code for session
//    - Redirect to dashboard (or onboarding if no family)

// 4. In app, check for family membership
const { data: member } = await supabase
  .from('family_members')
  .select('*, family:families(*)')
  .eq('auth_user_id', user.id)
  .single()

// 5. If no family member exists, redirect to create/join family
if (!member) {
  router.push('/onboarding')
}
```

### Create Family Flow

```typescript
// 1. Create family
const { data: family } = await supabase
  .from('families')
  .insert({ name: familyName })
  .select()
  .single()

// 2. Create family member (as owner)
const { data: member } = await supabase
  .from('family_members')
  .insert({
    family_id: family.id,
    auth_user_id: user.id,
    name: user.user_metadata.name,
    email: user.email,
    role: 'owner',
    color: selectedColor,
  })
  .select()
  .single()

// 3. Redirect to dashboard
router.push('/')
```

### Join Family Flow (via Invite)

```typescript
// 1. Validate invite token
const { data: invite } = await supabase
  .from('family_invites')
  .select('*, family:families(*)')
  .eq('token', inviteToken)
  .gt('expires_at', new Date().toISOString())
  .single()

// 2. Create family member
const { data: member } = await supabase
  .from('family_members')
  .insert({
    family_id: invite.family_id,
    auth_user_id: user.id,
    name: user.user_metadata.name,
    email: user.email,
    role: invite.role,  // 'adult' or 'kid'
  })
  .select()
  .single()

// 3. Mark invite as used
await supabase
  .from('family_invites')
  .update({ used_at: new Date().toISOString() })
  .eq('id', invite.id)
```

---

## Roles & Permissions

### Role Definitions

| Role | Description | Typical User |
|------|-------------|--------------|
| `owner` | Full access, can manage family settings and members | Primary organizer |
| `adult` | Full access to all features, limited admin | Other adults |
| `kid` | Limited access, simplified views | Children |

### Permission Matrix

| Action | Owner | Adult | Kid |
|--------|-------|-------|-----|
| **Tasks** |
| View all tasks | ✅ | ✅ | ✅ |
| Create tasks | ✅ | ✅ | ✅ |
| Edit any task | ✅ | ✅ | ❌ (own only) |
| Delete tasks | ✅ | ✅ | ❌ |
| Assign to others | ✅ | ✅ | ❌ |
| **Habits** |
| View all habits | ✅ | ✅ | ✅ |
| Create habits | ✅ | ✅ | ❌ (adult creates) |
| Log own habits | ✅ | ✅ | ✅ |
| Edit any habit | ✅ | ✅ | ❌ |
| **Goals** |
| View all goals | ✅ | ✅ | ✅ |
| Create goals | ✅ | ✅ | ✅ (own only) |
| Update own progress | ✅ | ✅ | ✅ |
| Edit any goal | ✅ | ✅ | ❌ |
| **Projects** |
| View all projects | ✅ | ✅ | ✅ |
| Create projects | ✅ | ✅ | ❌ |
| Edit projects | ✅ | ✅ | ❌ |
| Delete projects | ✅ | ✅ | ❌ |
| **Milestones** |
| View all milestones | ✅ | ✅ | ✅ |
| Add own milestones | ✅ | ✅ | ✅ |
| Add others' milestones | ✅ | ✅ | ❌ |
| Delete milestones | ✅ | ✅ | ❌ |
| **Meals & Recipes** |
| View meals | ✅ | ✅ | ✅ |
| Plan meals | ✅ | ✅ | ❌ |
| Manage recipes | ✅ | ✅ | ❌ |
| **People/Libraries** |
| View contacts/vendors | ✅ | ✅ | ✅ |
| Manage contacts/vendors | ✅ | ✅ | ❌ |
| **Family Meeting** |
| Participate | ✅ | ✅ | ✅ |
| Create action items | ✅ | ✅ | ❌ |
| Save meeting notes | ✅ | ✅ | ❌ |
| **Settings** |
| View own profile | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ (limited) |
| Family settings | ✅ | ❌ | ❌ |
| Invite members | ✅ | ❌ | ❌ |
| Remove members | ✅ | ❌ | ❌ |
| Change roles | ✅ | ❌ | ❌ |
| Delete family | ✅ | ❌ | ❌ |

### Permission Helper

```typescript
// lib/utils/permissions.ts

type Permission = 
  | 'task:create'
  | 'task:edit:any'
  | 'task:edit:own'
  | 'task:delete'
  | 'task:assign'
  | 'habit:create'
  | 'goal:create:any'
  | 'goal:create:own'
  | 'project:create'
  | 'project:delete'
  | 'milestone:add:any'
  | 'milestone:add:own'
  | 'meal:plan'
  | 'recipe:manage'
  | 'people:manage'
  | 'meeting:create-action'
  | 'meeting:save-notes'
  | 'settings:family'
  | 'members:invite'
  | 'members:remove'
  | 'members:change-role'

const ROLE_PERMISSIONS: Record<FamilyMemberRole, Permission[]> = {
  owner: [
    'task:create', 'task:edit:any', 'task:delete', 'task:assign',
    'habit:create', 'goal:create:any',
    'project:create', 'project:delete',
    'milestone:add:any',
    'meal:plan', 'recipe:manage', 'people:manage',
    'meeting:create-action', 'meeting:save-notes',
    'settings:family', 'members:invite', 'members:remove', 'members:change-role',
  ],
  adult: [
    'task:create', 'task:edit:any', 'task:delete', 'task:assign',
    'habit:create', 'goal:create:any',
    'project:create', 'project:delete',
    'milestone:add:any',
    'meal:plan', 'recipe:manage', 'people:manage',
    'meeting:create-action', 'meeting:save-notes',
  ],
  kid: [
    'task:create', 'task:edit:own',
    'goal:create:own',
    'milestone:add:own',
  ],
}

export function hasPermission(role: FamilyMemberRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function usePermission(permission: Permission): boolean {
  const { familyMember } = useAuth()
  if (!familyMember) return false
  return hasPermission(familyMember.role, permission)
}

// Usage in components
function DeleteTaskButton({ taskId }: { taskId: string }) {
  const canDelete = usePermission('task:delete')
  
  if (!canDelete) return null
  
  return <Button onClick={() => deleteTask(taskId)}>Delete</Button>
}
```

---

## Row Level Security (RLS)

### Enable RLS on All Tables

```sql
-- Run for each table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
-- ... etc
```

### Helper Functions

```sql
-- Get the current user's family_id
CREATE OR REPLACE FUNCTION get_my_family_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT family_id 
  FROM family_members 
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Get the current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS family_member_role_enum
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role 
  FROM family_members 
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Get the current family member's ID
CREATE OR REPLACE FUNCTION get_my_member_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id 
  FROM family_members 
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Check if current user is owner or adult
CREATE OR REPLACE FUNCTION is_adult_or_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_members 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('owner', 'adult')
  );
$$;
```

### RLS Policies

#### Tasks

```sql
-- SELECT: Everyone in family can view all tasks
CREATE POLICY "Family members can view tasks"
ON tasks FOR SELECT
USING (family_id = get_my_family_id());

-- INSERT: Everyone can create tasks
CREATE POLICY "Family members can create tasks"
ON tasks FOR INSERT
WITH CHECK (family_id = get_my_family_id());

-- UPDATE: Adults can update any, kids can update own assigned tasks
CREATE POLICY "Adults can update any task"
ON tasks FOR UPDATE
USING (
  family_id = get_my_family_id()
  AND (
    is_adult_or_owner()
    OR assigned_to_id = get_my_member_id()
    OR created_by = get_my_member_id()
  )
);

-- DELETE: Only adults (soft delete via update, but for actual delete)
CREATE POLICY "Adults can delete tasks"
ON tasks FOR DELETE
USING (
  family_id = get_my_family_id()
  AND is_adult_or_owner()
);
```

#### Habits

```sql
-- SELECT: All family members
CREATE POLICY "Family members can view habits"
ON habits FOR SELECT
USING (family_id = get_my_family_id());

-- INSERT: Adults only
CREATE POLICY "Adults can create habits"
ON habits FOR INSERT
WITH CHECK (
  family_id = get_my_family_id()
  AND is_adult_or_owner()
);

-- UPDATE: Adults for any, kids for own
CREATE POLICY "Update habits policy"
ON habits FOR UPDATE
USING (
  family_id = get_my_family_id()
  AND (
    is_adult_or_owner()
    OR owner_id = get_my_member_id()
  )
);
```

#### Habit Logs

```sql
-- SELECT: All family members
CREATE POLICY "Family members can view habit logs"
ON habit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM habits 
    WHERE habits.id = habit_logs.habit_id 
    AND habits.family_id = get_my_family_id()
  )
);

-- INSERT: Only for own habits
CREATE POLICY "Members can log own habits"
ON habit_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM habits 
    WHERE habits.id = habit_logs.habit_id 
    AND habits.family_id = get_my_family_id()
    AND habits.owner_id = get_my_member_id()
  )
);
```

#### Goals

```sql
-- SELECT: All family members
CREATE POLICY "Family members can view goals"
ON goals FOR SELECT
USING (family_id = get_my_family_id());

-- INSERT: Adults can create any, kids can create own
CREATE POLICY "Create goals policy"
ON goals FOR INSERT
WITH CHECK (
  family_id = get_my_family_id()
  AND (
    is_adult_or_owner()
    OR (
      get_my_role() = 'kid' 
      AND owner_id = get_my_member_id()
    )
  )
);

-- UPDATE: Adults any, kids own
CREATE POLICY "Update goals policy"
ON goals FOR UPDATE
USING (
  family_id = get_my_family_id()
  AND (
    is_adult_or_owner()
    OR owner_id = get_my_member_id()
  )
);
```

#### Projects

```sql
-- SELECT: All
CREATE POLICY "Family members can view projects"
ON projects FOR SELECT
USING (family_id = get_my_family_id());

-- INSERT: Adults only
CREATE POLICY "Adults can create projects"
ON projects FOR INSERT
WITH CHECK (
  family_id = get_my_family_id()
  AND is_adult_or_owner()
);

-- UPDATE: Adults only
CREATE POLICY "Adults can update projects"
ON projects FOR UPDATE
USING (
  family_id = get_my_family_id()
  AND is_adult_or_owner()
);

-- DELETE: Adults only
CREATE POLICY "Adults can delete projects"
ON projects FOR DELETE
USING (
  family_id = get_my_family_id()
  AND is_adult_or_owner()
);
```

#### Family Members

```sql
-- SELECT: Can view own family
CREATE POLICY "View family members"
ON family_members FOR SELECT
USING (family_id = get_my_family_id());

-- INSERT: Owner only (for invites)
CREATE POLICY "Owner can add members"
ON family_members FOR INSERT
WITH CHECK (
  family_id = get_my_family_id()
  AND get_my_role() = 'owner'
);

-- UPDATE: Own profile, or owner can update any
CREATE POLICY "Update family members"
ON family_members FOR UPDATE
USING (
  family_id = get_my_family_id()
  AND (
    id = get_my_member_id()  -- Own profile
    OR get_my_role() = 'owner'  -- Owner can edit any
  )
);

-- DELETE: Owner only
CREATE POLICY "Owner can remove members"
ON family_members FOR DELETE
USING (
  family_id = get_my_family_id()
  AND get_my_role() = 'owner'
  AND id != get_my_member_id()  -- Can't delete self
);
```

#### Families

```sql
-- SELECT: Only own family
CREATE POLICY "View own family"
ON families FOR SELECT
USING (id = get_my_family_id());

-- UPDATE: Owner only
CREATE POLICY "Owner can update family"
ON families FOR UPDATE
USING (
  id = get_my_family_id()
  AND get_my_role() = 'owner'
);
```

---

## Protected Routes

### Middleware

```typescript
// middleware.ts

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/auth/callback']
const ONBOARDING_ROUTES = ['/onboarding']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const pathname = request.nextUrl.pathname

  // Public routes - allow always
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    // Redirect to dashboard if already logged in
    if (session) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  }

  // No session - redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check if user has a family
  const { data: member } = await supabase
    .from('family_members')
    .select('id')
    .eq('auth_user_id', session.user.id)
    .single()

  // Needs family setup
  if (!member && !ONBOARDING_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Has family, trying to access onboarding
  if (member && ONBOARDING_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Client-side Route Guard

```typescript
// components/auth/require-permission.tsx

interface RequirePermissionProps {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}

export function RequirePermission({ 
  permission, 
  children, 
  fallback = null 
}: RequirePermissionProps) {
  const hasAccess = usePermission(permission)
  
  if (!hasAccess) return fallback
  return <>{children}</>
}

// Usage
<RequirePermission 
  permission="settings:family"
  fallback={<AccessDenied />}
>
  <FamilySettings />
</RequirePermission>
```

---

## Invite System

### Invite Table

```sql
CREATE TABLE family_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role family_member_role_enum NOT NULL DEFAULT 'adult',
  token TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES family_members(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE INDEX idx_invites_token ON family_invites(token) WHERE used_at IS NULL;
CREATE INDEX idx_invites_family ON family_invites(family_id);
```

### Create Invite

```typescript
export function useCreateInvite() {
  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: 'adult' | 'kid' }) => {
      const token = generateSecureToken()  // crypto.randomUUID() or similar
      const expiresAt = addDays(new Date(), 7)

      const { data, error } = await supabase
        .from('family_invites')
        .insert({
          email,
          role,
          token,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // Send invite email via edge function
      await supabase.functions.invoke('send-invite-email', {
        body: { email, token, familyName: family.name },
      })

      return data
    },
  })
}
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-23 | Hazel + Claude | Initial auth spec |
| 1.1 | 2024-12-23 | Claude | Updated to magic link (passwordless) authentication |
