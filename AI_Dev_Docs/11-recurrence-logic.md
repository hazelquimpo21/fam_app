# Fam — Recurrence Logic Specification

## Overview

This document defines how recurring tasks work in Fam, including storage patterns, instance generation, completion behavior, and edge cases.

---

## Recurrence Model

### Storage

Recurring tasks use a template pattern. The original task serves as the template, and completed instances link back to it.

```sql
-- Recurrence fields on tasks table
is_recurring BOOLEAN DEFAULT false,
recurrence_frequency recurrence_frequency_enum,  -- daily, weekly, biweekly, monthly, quarterly, yearly, custom
recurrence_interval INTEGER DEFAULT 1,           -- every X frequency units
recurrence_days_of_week INTEGER[],               -- for weekly: [0,2,4] = Sun, Tue, Thu
recurrence_day_of_month INTEGER,                 -- for monthly: 15 = 15th of month
recurrence_end_date DATE,                        -- optional end date
recurrence_parent_id UUID REFERENCES tasks(id),  -- links instances to template
```

### Recurrence Patterns

| Frequency | Example | Storage |
|-----------|---------|---------|
| Daily | Every day | `frequency: 'daily', interval: 1` |
| Every 3 days | Every 3 days | `frequency: 'daily', interval: 3` |
| Weekly | Every Monday | `frequency: 'weekly', interval: 1, days_of_week: [1]` |
| MWF | Mon, Wed, Fri | `frequency: 'weekly', interval: 1, days_of_week: [1,3,5]` |
| Biweekly | Every other Tuesday | `frequency: 'biweekly', interval: 1, days_of_week: [2]` |
| Monthly (date) | 15th of each month | `frequency: 'monthly', interval: 1, day_of_month: 15` |
| Monthly (last day) | Last day of month | `frequency: 'monthly', interval: 1, day_of_month: -1` |
| Quarterly | Every 3 months | `frequency: 'quarterly', interval: 1` |
| Yearly | Same date each year | `frequency: 'yearly', interval: 1` |

---

## Creating Recurring Tasks

### User Interface

```
┌──────────────────────────────────────┐
│ Recurrence                           │
│                                      │
│ [✓] Repeat this task                 │
│                                      │
│ Frequency: [Weekly ▼]                │
│                                      │
│ Every [1] week(s)                    │
│                                      │
│ On days:                             │
│ [✓] Mon [ ] Tue [✓] Wed [ ] Thu [✓] Fri [ ] Sat [ ] Sun │
│                                      │
│ Ends:                                │
│ ( ) Never                            │
│ (●) On date: [Dec 31, 2025 📅]       │
│ ( ) After [  ] occurrences           │
└──────────────────────────────────────┘
```

### Creation Logic

```typescript
// lib/utils/recurrence.ts

interface RecurrenceConfig {
  frequency: RecurrenceFrequency
  interval: number
  daysOfWeek?: number[]        // 0 = Sunday, 6 = Saturday
  dayOfMonth?: number          // 1-31, or -1 for last day
  endDate?: Date
  endAfterOccurrences?: number
}

function createRecurringTask(
  taskData: CreateTaskInput,
  recurrence: RecurrenceConfig
): Task {
  return {
    ...taskData,
    is_recurring: true,
    recurrence_frequency: recurrence.frequency,
    recurrence_interval: recurrence.interval,
    recurrence_days_of_week: recurrence.daysOfWeek,
    recurrence_day_of_month: recurrence.dayOfMonth,
    recurrence_end_date: recurrence.endDate,
    // First due date calculated based on pattern
    due_date: calculateFirstOccurrence(taskData.due_date || new Date(), recurrence),
  }
}
```

---

## Completion Behavior

When a recurring task is completed, the system generates the next instance.

### Completion Flow

```
User completes task
        │
        ▼
┌───────────────────┐
│ Is task recurring?│
└────────┬──────────┘
         │
    ┌────┴────┐
    │         │
    ▼ No      ▼ Yes
┌─────────┐  ┌─────────────────────────────┐
│Mark done│  │1. Mark current instance done│
│  END    │  │2. Calculate next due date   │
└─────────┘  │3. Check if past end date    │
             │4. If not ended: create next │
             │5. Link to parent template   │
             └─────────────────────────────┘
```

### Next Date Calculation

```typescript
// lib/utils/recurrence.ts

function calculateNextOccurrence(
  completedDate: Date,
  task: RecurringTask
): Date | null {
  const {
    recurrence_frequency: frequency,
    recurrence_interval: interval,
    recurrence_days_of_week: daysOfWeek,
    recurrence_day_of_month: dayOfMonth,
    recurrence_end_date: endDate,
  } = task

  let nextDate: Date

  switch (frequency) {
    case 'daily':
      // Next occurrence is interval days after completion
      nextDate = addDays(completedDate, interval)
      break

    case 'weekly':
      // Find next matching day of week
      nextDate = findNextDayOfWeek(completedDate, daysOfWeek!, interval)
      break

    case 'biweekly':
      // Every other week on specified days
      nextDate = findNextDayOfWeek(completedDate, daysOfWeek!, interval * 2)
      break

    case 'monthly':
      if (dayOfMonth === -1) {
        // Last day of next month
        nextDate = lastDayOfMonth(addMonths(completedDate, interval))
      } else {
        // Specific day of month
        nextDate = setDate(addMonths(completedDate, interval), dayOfMonth!)
        // Handle months with fewer days (e.g., Feb 30 → Feb 28)
        nextDate = adjustForMonthLength(nextDate, dayOfMonth!)
      }
      break

    case 'quarterly':
      nextDate = addMonths(completedDate, 3 * interval)
      break

    case 'yearly':
      nextDate = addYears(completedDate, interval)
      break

    default:
      throw new Error(`Unknown frequency: ${frequency}`)
  }

  // Check end date
  if (endDate && isAfter(nextDate, endDate)) {
    return null  // Recurrence has ended
  }

  return nextDate
}

function findNextDayOfWeek(
  fromDate: Date,
  daysOfWeek: number[],
  intervalWeeks: number
): Date {
  // Sort days for easier logic
  const sortedDays = [...daysOfWeek].sort((a, b) => a - b)
  const currentDay = fromDate.getDay()
  
  // Find next day in current week
  for (const day of sortedDays) {
    if (day > currentDay) {
      return setDay(fromDate, day)
    }
  }
  
  // Move to next week(s) and use first day
  const nextWeek = addWeeks(fromDate, intervalWeeks)
  return setDay(startOfWeek(nextWeek), sortedDays[0])
}
```

### Instance Creation

```typescript
// lib/hooks/use-complete-task.ts (extended for recurrence)

async function completeTask(taskId: string) {
  const task = await fetchTask(taskId)
  
  // Mark current task as done
  await supabase
    .from('tasks')
    .update({
      status: 'done',
      completed_at: new Date().toISOString(),
    })
    .eq('id', taskId)

  // Generate next instance if recurring
  if (task.is_recurring) {
    const nextDate = calculateNextOccurrence(new Date(), task)
    
    if (nextDate) {
      // Create next instance
      await supabase
        .from('tasks')
        .insert({
          // Copy from template
          family_id: task.family_id,
          title: task.title,
          description: task.description,
          assigned_to_id: task.assigned_to_id,
          project_id: task.project_id,
          goal_id: task.goal_id,
          priority: task.priority,
          tags: task.tags,
          created_by: task.created_by,
          
          // Recurrence settings
          is_recurring: true,
          recurrence_frequency: task.recurrence_frequency,
          recurrence_interval: task.recurrence_interval,
          recurrence_days_of_week: task.recurrence_days_of_week,
          recurrence_day_of_month: task.recurrence_day_of_month,
          recurrence_end_date: task.recurrence_end_date,
          
          // Link to parent (original template or first instance)
          recurrence_parent_id: task.recurrence_parent_id || task.id,
          
          // New dates
          due_date: nextDate.toISOString(),
          scheduled_date: nextDate.toISOString(),
          status: 'active',
        })
    }
  }
}
```

---

## Template vs Instance

### Identifying Templates

```typescript
// A task is a template if:
// - is_recurring = true
// - recurrence_parent_id = null

function isRecurrenceTemplate(task: Task): boolean {
  return task.is_recurring && !task.recurrence_parent_id
}

// A task is an instance if:
// - is_recurring = true
// - recurrence_parent_id != null

function isRecurrenceInstance(task: Task): boolean {
  return task.is_recurring && !!task.recurrence_parent_id
}
```

### Editing Recurring Tasks

When editing a recurring task, user is prompted:

```
┌──────────────────────────────────────┐
│ Edit recurring task                  │
│                                      │
│ Apply changes to:                    │
│                                      │
│ (●) This task only                   │
│ ( ) This and all future tasks        │
│ ( ) All tasks (past and future)      │
│                                      │
│               [Cancel]  [Apply]      │
└──────────────────────────────────────┘
```

**This task only:**
- Only update the current instance
- Instance "detaches" from template for changed fields

**This and future:**
- Update the template
- Future instances will use new values
- Past instances unchanged

**All tasks:**
- Update template and all existing instances
- Requires updating multiple rows

```typescript
type EditRecurrenceScope = 'this' | 'this_and_future' | 'all'

async function updateRecurringTask(
  taskId: string,
  updates: Partial<Task>,
  scope: EditRecurrenceScope
) {
  const task = await fetchTask(taskId)
  
  switch (scope) {
    case 'this':
      // Just update this instance
      await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
      break
      
    case 'this_and_future':
      // Update this task and template
      const templateId = task.recurrence_parent_id || taskId
      
      await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
      
      // Update template if not this task
      if (templateId !== taskId) {
        await supabase
          .from('tasks')
          .update(updates)
          .eq('id', templateId)
      }
      break
      
    case 'all':
      // Update all instances with same parent
      const parentId = task.recurrence_parent_id || taskId
      
      await supabase
        .from('tasks')
        .update(updates)
        .or(`id.eq.${parentId},recurrence_parent_id.eq.${parentId}`)
      break
  }
}
```

### Deleting Recurring Tasks

Similar prompt for deletion:

```
┌──────────────────────────────────────┐
│ Delete recurring task                │
│                                      │
│ Delete:                              │
│                                      │
│ (●) This task only                   │
│ ( ) This and all future tasks        │
│ ( ) All tasks in this series         │
│                                      │
│               [Cancel]  [Delete]     │
└──────────────────────────────────────┘
```

---

## Missed Recurrence Handling

### Scenario: Overdue Recurring Task

User didn't complete Monday's task. It's now Wednesday.

**Behavior:**
- Overdue task stays visible in "Overdue" section
- When completed, next instance is based on completion date, not original due date
- This prevents "pile up" of missed instances

```typescript
// When completing an overdue recurring task:
// - If task was due Monday, completed Wednesday
// - Next weekly task due NEXT Monday (not yesterday)
// - Calculated from completion date, not due date

const nextDate = calculateNextOccurrence(
  new Date(),  // Use completion date, not task.due_date
  task
)
```

### Skip vs Complete

For habits and some tasks, users may want to "skip" without completing:

```
┌──────────────────────────────────────┐
│ Weekly Review                        │
│ Due: Monday, Dec 16 (overdue)        │
│                                      │
│ [Complete ✓]  [Skip →]               │
└──────────────────────────────────────┘
```

**Skip behavior:**
- Creates next instance (same as complete)
- Marks current as `status: 'skipped'` instead of `'done'`
- Doesn't affect any streak counts (for habits)

---

## Display Logic

### Showing Recurring Tasks

Only show the **next upcoming instance** of a recurring task in lists.

```typescript
function filterTasksForDisplay(tasks: Task[]): Task[] {
  const seen = new Set<string>()
  
  return tasks.filter(task => {
    // Non-recurring: always show
    if (!task.is_recurring) return true
    
    // For recurring: only show if we haven't seen this series
    const seriesId = task.recurrence_parent_id || task.id
    
    if (seen.has(seriesId)) return false
    
    seen.add(seriesId)
    return true
  })
}
```

### Recurring Task Indicator

```tsx
function TaskRow({ task }: { task: Task }) {
  return (
    <div>
      <Checkbox checked={task.status === 'done'} />
      <span>{task.title}</span>
      {task.is_recurring && (
        <Tooltip content={formatRecurrence(task)}>
          <RefreshCw className="w-4 h-4 text-neutral-400" />
        </Tooltip>
      )}
    </div>
  )
}

function formatRecurrence(task: Task): string {
  const { recurrence_frequency, recurrence_interval, recurrence_days_of_week } = task
  
  switch (recurrence_frequency) {
    case 'daily':
      return recurrence_interval === 1 
        ? 'Repeats daily' 
        : `Repeats every ${recurrence_interval} days`
    case 'weekly':
      const days = recurrence_days_of_week!.map(d => DAY_NAMES[d]).join(', ')
      return `Repeats weekly on ${days}`
    // ... etc
  }
}
```

---

## Edge Cases

### Month-end handling

Task due on the 31st in February:

```typescript
function adjustForMonthLength(date: Date, targetDay: number): Date {
  const lastDay = lastDayOfMonth(date).getDate()
  
  if (targetDay > lastDay) {
    // Use last day of month instead
    return setDate(date, lastDay)
  }
  
  return date
}
```

### Timezone handling

All dates stored in UTC. Recurrence calculated in user's timezone.

```typescript
// Store in UTC
const dueDate = zonedTimeToUtc(localDate, userTimezone)

// Display in user's timezone
const displayDate = utcToZonedTime(task.due_date, userTimezone)
```

### DST transitions

When calculating "tomorrow" or "next week", account for DST:

```typescript
// Use date-fns which handles DST correctly
import { addDays, addWeeks } from 'date-fns'

// NOT: new Date(date.getTime() + 24 * 60 * 60 * 1000)
// This can skip/double days during DST
```

### Recurrence with no due date

If a recurring task has no due_date, use scheduled_date. If neither exists, use creation date as base.

---

## Database Queries

### Get next instance of recurring task

```sql
-- Find the next upcoming instance for a recurring series
SELECT * FROM tasks
WHERE (id = :templateId OR recurrence_parent_id = :templateId)
  AND status != 'done'
  AND deleted_at IS NULL
ORDER BY due_date ASC
LIMIT 1;
```

### Get all instances of a recurring task

```sql
-- Get complete history of a recurring task series
SELECT * FROM tasks
WHERE (id = :templateId OR recurrence_parent_id = :templateId)
  AND deleted_at IS NULL
ORDER BY due_date DESC;
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-23 | Hazel + Claude | Initial recurrence spec |
