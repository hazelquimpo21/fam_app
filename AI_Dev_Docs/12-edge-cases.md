# Fam — Edge Cases & Error Handling

## Overview

This document covers edge cases, error scenarios, and how Fam handles them gracefully.

---

## Data Edge Cases

### Deleting Entities with Dependencies

#### Deleting a Project with Tasks

**Scenario:** User deletes a project that has tasks assigned to it.

**Behavior:**
- Project is soft-deleted (`deleted_at` set)
- Tasks remain but with `project_id` set to NULL
- Tasks appear in "No Project" filter

**Implementation:**
```sql
-- On project delete, tasks are unlinked (ON DELETE SET NULL)
project_id UUID REFERENCES projects(id) ON DELETE SET NULL
```

#### Deleting a Goal with Linked Habits/Tasks

**Scenario:** User deletes a goal that has habits and tasks linked to it.

**Behavior:**
- Goal is soft-deleted
- Habits lose their `goal_id` link (still exist independently)
- Tasks lose their `goal_id` link

**User confirmation:**
```
┌──────────────────────────────────────┐
│ Delete "Read 50 books"?              │
│                                      │
│ This goal has:                       │
│ • 2 linked habits                    │
│ • 5 linked tasks                     │
│                                      │
│ These will be unlinked but not       │
│ deleted.                             │
│                                      │
│              [Cancel]  [Delete]      │
└──────────────────────────────────────┘
```

#### Deleting a Family Member

**Scenario:** Owner removes a family member who has tasks assigned.

**Behavior:**
- Family member record is deleted
- Tasks assigned to them become unassigned (`assigned_to_id = NULL`)
- Tasks created by them retain `created_by` as historical reference
- Goals/habits owned by them: 
  - Option 1: Transfer to another member
  - Option 2: Archive/delete

**Confirmation flow:**
```
┌──────────────────────────────────────┐
│ Remove Mike from family?             │
│                                      │
│ Mike has:                            │
│ • 12 assigned tasks                  │
│ • 3 habits                           │
│ • 2 personal goals                   │
│                                      │
│ What would you like to do with       │
│ Mike's items?                        │
│                                      │
│ ( ) Reassign to: [Hazel ▼]           │
│ (●) Leave unassigned / archive       │
│                                      │
│              [Cancel]  [Remove]      │
└──────────────────────────────────────┘
```

#### Deleting a Recipe Used in Meal Plans

**Scenario:** User deletes a recipe that's already planned for meals.

**Behavior:**
- Recipe is soft-deleted
- Past meals keep the link (historical record)
- Future meals show "Recipe deleted" with meal title preserved
- Option to replace with another recipe

### Circular Dependencies (Future)

If task dependencies are added later:
- Prevent A → B → C → A loops
- Check for cycles before saving

---

## Concurrent Editing

### Optimistic Updates with Conflicts

**Scenario:** Two family members edit the same task simultaneously.

**Behavior:**
- Use optimistic updates for instant feedback
- On conflict, last write wins (simple)
- Show toast: "This task was updated by Mike. Refresh to see changes."

**Future enhancement:** Real-time cursors or locking

### Completing the Same Task Twice

**Scenario:** Task shows on both Hazel's and Mike's "Today" view. Both try to complete it.

**Behavior:**
- First completion succeeds
- Second attempt sees already-completed task
- UI updates via real-time subscription
- Second user sees satisfying "already done!" state

```typescript
async function completeTask(taskId: string) {
  // Check current status first
  const { data: task } = await supabase
    .from('tasks')
    .select('status')
    .eq('id', taskId)
    .single()

  if (task?.status === 'done') {
    toast.info('This task was already completed!')
    return
  }

  // Proceed with completion
  await supabase
    .from('tasks')
    .update({ status: 'done', completed_at: new Date() })
    .eq('id', taskId)
    .neq('status', 'done')  // Extra safety
}
```

---

## Empty States

### Every List Has an Empty State

| Screen | Empty State Message | Action |
|--------|---------------------|--------|
| Inbox | "Inbox Zero! 🎉 Everything's been processed." | [+ Capture something] |
| Today | "Nothing scheduled for today. Enjoy!" | [+ Add task] |
| Tasks | "No tasks yet. What needs to get done?" | [+ Add task] |
| Habits | "No habits being tracked. Start building routines!" | [+ Add habit] |
| Goals | "No goals set. What do you want to achieve?" | [+ Add goal] |
| Projects | "No projects. Group related tasks together." | [+ Create project] |
| Someday - Trips | "No dream trips yet. Where do you want to go?" | [+ Add trip idea] |
| Milestones | "No wins recorded this week. Celebrate something!" | [+ Add win] |
| Recipes | "No recipes saved. Start building your collection!" | [+ Add recipe] |
| Meals | "No meals planned. What's for dinner?" | [Plan meals] |
| Contacts | "No contacts saved." | [+ Add contact] |
| Vendors | "No vendors saved. Track your service providers." | [+ Add vendor] |
| Search Results | "No results found for '[query]'" | [Clear search] |

### Design Guidelines for Empty States

```tsx
function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-neutral-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-neutral-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-neutral-500 mb-6 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

---

## Error States

### Network Errors

**Scenario:** User loses internet connection.

**Behavior:**
- Show persistent banner: "You're offline. Changes will sync when reconnected."
- Allow viewing cached data
- Queue mutations locally (if implementing offline support)
- On reconnect: sync and show "Back online!"

```tsx
function NetworkStatus() {
  const isOnline = useNetworkStatus()
  
  if (isOnline) return null
  
  return (
    <Banner variant="warning" className="fixed bottom-0 w-full">
      <WifiOff className="w-4 h-4 mr-2" />
      You're offline. Changes will sync when reconnected.
    </Banner>
  )
}
```

### Failed Mutations

**Scenario:** Save fails (server error, validation error, etc.)

**Behavior:**
- Roll back optimistic update
- Show error toast with retry option
- Preserve user's input in form (don't clear)

```typescript
const mutation = useMutation({
  onError: (error, variables, context) => {
    // Rollback
    queryClient.setQueryData(key, context?.previousData)
    
    // Show error
    toast.error('Failed to save. Please try again.', {
      action: {
        label: 'Retry',
        onClick: () => mutation.mutate(variables),
      },
    })
  },
})
```

### Validation Errors

**Scenario:** User submits invalid data.

**Behavior:**
- Show inline field errors
- Scroll to first error
- Don't clear valid fields
- Focus on first errored field

```tsx
function TaskForm() {
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  })
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input
        {...form.register('title')}
        error={form.formState.errors.title?.message}
      />
      {/* Error displayed below input */}
    </form>
  )
}
```

### 404 - Not Found

**Scenario:** User navigates to deleted/nonexistent item.

**Behavior:**
- Show friendly 404 page
- Offer navigation back

```tsx
function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">Oops!</h1>
      <p className="text-neutral-500 mb-6">
        We couldn't find what you're looking for.
      </p>
      <Button as={Link} href="/">
        Back to Home
      </Button>
    </div>
  )
}
```

### Permission Denied

**Scenario:** Kid tries to access family settings.

**Behavior:**
- Show access denied message
- Don't expose what the page contains
- Offer to go back

```tsx
function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Lock className="w-12 h-12 text-neutral-400 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
      <p className="text-neutral-500 mb-6">
        You don't have permission to view this page.
      </p>
      <Button as={Link} href="/">
        Back to Home
      </Button>
    </div>
  )
}
```

---

## Date & Time Edge Cases

### Timezone Handling

**Scenario:** User in Pacific time creates task due "tomorrow" while traveling in Eastern time.

**Behavior:**
- Store dates without time in `DATE` type (not `TIMESTAMPTZ`)
- Due dates are "user-local" concepts
- Display in user's current timezone
- "Today" and "Tomorrow" calculated client-side

### Daylight Saving Time

**Scenario:** Task scheduled for 2 AM on DST transition night.

**Behavior:**
- For date-only fields: no issue
- For datetime fields: use `date-fns` which handles DST
- Avoid raw millisecond arithmetic

### Leap Years

**Scenario:** Task recurs on Feb 29.

**Behavior:**
- In non-leap years, occurs on Feb 28
- Document this in recurrence settings

---

## Form Edge Cases

### Long Input

**Scenario:** User pastes a very long title or description.

**Behavior:**
- Titles: Max 200 characters, show counter
- Descriptions: Max 5000 characters
- Notes fields: Max 50000 characters
- Show character count approaching limit
- Prevent submit if over limit

```tsx
<Input
  maxLength={200}
  {...form.register('title')}
/>
<span className={cn(
  "text-xs text-neutral-500",
  title.length > 180 && "text-warning-main",
  title.length >= 200 && "text-error-main"
)}>
  {title.length}/200
</span>
```

### Special Characters

**Scenario:** User enters HTML/script tags in input.

**Behavior:**
- Sanitize on display (React does this by default)
- Store raw (don't mangle user input)
- Never use `dangerouslySetInnerHTML`

### Duplicate Names

**Scenario:** Two projects with same name.

**Behavior:**
- Allow it (use UUIDs, not names, as identifiers)
- In pickers, show disambiguating info if needed

---

## Performance Edge Cases

### Large Data Sets

**Scenario:** Family has 500+ tasks, 100+ recipes.

**Behavior:**
- Paginate lists (load 50 at a time)
- Virtual scrolling for very long lists
- Index database columns properly
- Use `staleTime` to reduce refetches

```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['tasks', filters],
  queryFn: ({ pageParam = 0 }) => fetchTasks({ ...filters, offset: pageParam }),
  getNextPageParam: (lastPage, pages) => 
    lastPage.length === 50 ? pages.length * 50 : undefined,
})
```

### Slow Network

**Scenario:** User on slow 3G connection.

**Behavior:**
- Show skeleton loaders immediately
- Use optimistic updates for mutations
- Cache aggressively
- Consider reducing image quality

---

## Account Edge Cases

### Last Owner Leaving

**Scenario:** Family owner tries to leave/delete their account.

**Behavior:**
- Prevent if they're the only owner
- Require transferring ownership first

```
┌──────────────────────────────────────┐
│ Can't leave family                   │
│                                      │
│ You're the only owner. Please        │
│ transfer ownership before leaving.   │
│                                      │
│ Transfer to: [Mike ▼]                │
│                                      │
│         [Cancel]  [Transfer & Leave] │
└──────────────────────────────────────┘
```

### Deleting Family

**Scenario:** Owner wants to delete the entire family.

**Behavior:**
- Require confirmation (type family name)
- All data permanently deleted
- All members logged out
- No undo

```
┌──────────────────────────────────────┐
│ ⚠️ Delete Smith Family?              │
│                                      │
│ This will permanently delete:        │
│ • All tasks, projects, and goals     │
│ • All recipes and meal plans         │
│ • All family member accounts         │
│                                      │
│ This cannot be undone.               │
│                                      │
│ Type "Smith Family" to confirm:      │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│                                      │
│              [Cancel]  [Delete]      │
└──────────────────────────────────────┘
```

### Email Change

**Scenario:** User wants to change their email.

**Behavior:**
- Send magic link to new email address for verification
- Keep old email working until new email is verified
- Update family_members.email after confirmation

---

## Recovery & Undo

### Soft Deletes

Most entities use soft deletes (`deleted_at` timestamp).

**Undo window:** 30 days

**Recovery:**
- Owner can access "Trash" view
- Select items to restore
- After 30 days, permanently deleted (cron job)

### Action Undo

For immediate undo (e.g., task deletion):

```typescript
function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      await supabase
        .from('tasks')
        .update({ deleted_at: new Date() })
        .eq('id', taskId)
      return taskId
    },
    onSuccess: (taskId) => {
      const undoRestore = async () => {
        await supabase
          .from('tasks')
          .update({ deleted_at: null })
          .eq('id', taskId)
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
        toast.success('Task restored')
      }

      toast('Task deleted', {
        action: {
          label: 'Undo',
          onClick: undoRestore,
        },
        duration: 5000,
      })
    },
  })
}
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-23 | Hazel + Claude | Initial edge cases doc |
| 1.1 | 2024-12-23 | Claude | Auth updated to magic link (email change flow) |
