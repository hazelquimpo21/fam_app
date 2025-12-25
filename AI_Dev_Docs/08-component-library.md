# Fam — Component Library Spec

## Overview

This document specifies reusable UI components for Fam. Components are organized by complexity and use case. All components should be built with shadcn/ui as a base, customized to match Fam's design system.

---

## Component Organization

```
components/
├── ui/              # Base primitives (shadcn)
├── shared/          # Fam-specific shared components
└── features/        # Feature-specific components
```

---

## Base UI Components (shadcn/ui)

These are installed from shadcn/ui and customized with our design tokens.

### Button

**File:** `components/ui/button.tsx`

**Variants:**
| Variant | Use Case |
|---------|----------|
| `default` (primary) | Main actions: "Add Task", "Save" |
| `secondary` | Secondary actions: "Cancel", "Back" |
| `outline` | Tertiary actions, less emphasis |
| `ghost` | Icon buttons, subtle actions |
| `destructive` | Delete, remove actions |
| `link` | Inline text links |

**Sizes:** `sm` (32px), `default` (40px), `lg` (48px), `icon` (40x40px)

**Props:**
```tsx
interface ButtonProps {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'
  size?: 'sm' | 'default' | 'lg' | 'icon'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children: React.ReactNode
  disabled?: boolean
  onClick?: () => void
}
```

**Usage:**
```tsx
<Button variant="default" size="default" leftIcon={<Plus />}>
  Add Task
</Button>

<Button variant="ghost" size="icon">
  <MoreHorizontal />
</Button>

<Button variant="destructive" loading={isDeleting}>
  Delete
</Button>
```

### Input

**File:** `components/ui/input.tsx`

**Props:**
```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}
```

**States:** default, hover, focus, error, disabled

### Checkbox

**File:** `components/ui/checkbox.tsx`

**Custom Animation:**
- Check draws in with SVG stroke animation
- Background fills with scale animation
- Total duration: 200ms

**Props:**
```tsx
interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  indeterminate?: boolean  // For parent checkboxes
}
```

### Select

**File:** `components/ui/select.tsx`

Standard shadcn select with our styling.

### Dialog / Modal

**File:** `components/ui/dialog.tsx`

**Sizes:** `sm` (400px), `default` (500px), `lg` (700px), `full` (90vw)

**Animation:**
- Backdrop fades in (150ms)
- Content scales from 0.95 with fade (200ms)

### Card

**File:** `components/ui/card.tsx`

**Variants:**
| Variant | Styling |
|---------|---------|
| `default` | White bg, shadow-md |
| `bordered` | White bg, neutral-200 border, no shadow |
| `interactive` | Default + hover shadow + cursor pointer |
| `flat` | Subtle bg color, no shadow |

### Progress

**File:** `components/ui/progress.tsx`

**Props:**
```tsx
interface ProgressProps {
  value: number  // 0-100
  max?: number   // default 100
  variant?: 'default' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'default' | 'lg'
  showLabel?: boolean
}
```

### Skeleton

**File:** `components/ui/skeleton.tsx`

Animated shimmer placeholder for loading states.

### Toast

**File:** `components/ui/toast.tsx` (via sonner)

**Types:** `success`, `error`, `warning`, `info`, `default`

**Usage:**
```tsx
toast.success('Task completed! 🎉')
toast.error('Failed to save')
toast('Processing...', { duration: Infinity })
```

### Tooltip

**File:** `components/ui/tooltip.tsx`

Delay: 500ms before show.

---

## Shared Components

These are Fam-specific components used across features.

### Avatar

**File:** `components/shared/avatar.tsx`

Displays a family member's avatar (image or initials).

**Props:**
```tsx
interface AvatarProps {
  src?: string | null
  name: string
  color: string           // Hex color for background
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showStatus?: boolean    // Online indicator (future)
  className?: string
}
```

**Sizes:**
| Size | Dimensions | Font Size |
|------|------------|-----------|
| xs | 20px | 10px |
| sm | 24px | 11px |
| md | 32px | 13px |
| lg | 40px | 16px |
| xl | 56px | 22px |

**Behavior:**
- If `src` provided and valid: show image
- Otherwise: show initials (first letter of first + last name, or first 2 of single name)
- Background: `color` prop
- Text: white (ensure contrast)

**Usage:**
```tsx
<Avatar 
  name="Hazel Johnson" 
  color="#6366F1" 
  size="md" 
/>

<Avatar 
  src="/avatars/hazel.jpg" 
  name="Hazel Johnson" 
  color="#6366F1" 
  size="lg" 
/>
```

### AvatarGroup

**File:** `components/shared/avatar-group.tsx`

Shows multiple avatars with overlap.

**Props:**
```tsx
interface AvatarGroupProps {
  members: Array<{
    id: string
    name: string
    color: string
    src?: string | null
  }>
  max?: number        // Max to show before "+N"
  size?: AvatarProps['size']
}
```

**Usage:**
```tsx
<AvatarGroup 
  members={familyMembers} 
  max={3} 
  size="sm" 
/>
// Shows: [Hazel][Mike][+2]
```

### Badge

**File:** `components/shared/badge.tsx`

**Props:**
```tsx
interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline'
  size?: 'sm' | 'default'
  dot?: boolean        // Show colored dot instead of background
  children: React.ReactNode
}
```

**Usage:**
```tsx
<Badge variant="success">Completed</Badge>
<Badge variant="warning">In Progress</Badge>
<Badge dot variant="error">Overdue</Badge>
```

### StreakBadge

**File:** `components/shared/streak-badge.tsx`

Displays habit streak with fire emoji.

**Props:**
```tsx
interface StreakBadgeProps {
  count: number
  size?: 'sm' | 'default'
  animate?: boolean    // Pulse on milestone
}
```

**Behavior:**
- Shows: 🔥 {count} days
- Milestones (7, 14, 30, 60, 100, 365) get special styling
- `animate` triggers pulse animation

**Usage:**
```tsx
<StreakBadge count={12} />
<StreakBadge count={30} animate />  // Just hit 30!
```

### DatePicker

**File:** `components/shared/date-picker.tsx`

**Props:**
```tsx
interface DatePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  shortcuts?: boolean  // Show "Today", "Tomorrow", "Next week"
}
```

**Shortcuts (when enabled):**
- Today
- Tomorrow
- Next week
- In 2 weeks
- Next month

**Usage:**
```tsx
<DatePicker 
  value={dueDate} 
  onChange={setDueDate}
  placeholder="Set due date"
  shortcuts
/>
```

### FamilyMemberPicker

**File:** `components/shared/family-member-picker.tsx`

Dropdown to select a family member.

**Props:**
```tsx
interface FamilyMemberPickerProps {
  value: string | null          // family_member.id
  onChange: (id: string | null) => void
  placeholder?: string
  allowClear?: boolean
  excludeIds?: string[]         // Hide certain members
  showUnassigned?: boolean      // Show "Unassigned" option
}
```

**Dropdown Item:**
```
┌─────────────────────────────┐
│ [Avatar] Hazel (you)        │
│ [Avatar] Mike               │
│ [Avatar] Zelda              │
│ [Avatar] Miles              │
│ ─────────────────────────── │
│ [○] Unassigned              │
└─────────────────────────────┘
```

### ProjectPicker

**File:** `components/shared/project-picker.tsx`

**Props:**
```tsx
interface ProjectPickerProps {
  value: string | null          // project.id
  onChange: (id: string | null) => void
  placeholder?: string
  allowClear?: boolean
  allowCreate?: boolean         // Show "+ Create project"
}
```

### GoalPicker

**File:** `components/shared/goal-picker.tsx`

Similar pattern to ProjectPicker.

### PlacePicker

**File:** `components/shared/place-picker.tsx`

Similar pattern, with category grouping.

### EmptyState

**File:** `components/shared/empty-state.tsx`

**Props:**
```tsx
interface EmptyStateProps {
  icon?: React.ReactNode        // Lucide icon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}
```

**Usage:**
```tsx
<EmptyState
  icon={<CheckSquare className="w-12 h-12" />}
  title="No tasks yet"
  description="Add your first task to get organized."
  action={{
    label: "Add Task",
    onClick: openTaskForm
  }}
/>
```

### LoadingSpinner

**File:** `components/shared/loading-spinner.tsx`

**Props:**
```tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'default' | 'lg'
  className?: string
}
```

### PageHeader

**File:** `components/shared/page-header.tsx`

**Props:**
```tsx
interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode     // Right-aligned buttons
  breadcrumb?: Array<{
    label: string
    href?: string
  }>
}
```

**Usage:**
```tsx
<PageHeader
  title="Tasks"
  description="Manage your to-dos"
  actions={
    <Button leftIcon={<Plus />}>Add Task</Button>
  }
/>
```

### QuickAddModal

**File:** `components/shared/quick-add-modal.tsx`

Global quick capture modal (see User Flows for spec).

**Props:**
```tsx
interface QuickAddModalProps {
  open: boolean
  onClose: () => void
}
```

**Keyboard:** Opens with `Cmd/Ctrl + K`

### SearchModal

**File:** `components/shared/search-modal.tsx`

Global search modal (see Screens for spec).

**Props:**
```tsx
interface SearchModalProps {
  open: boolean
  onClose: () => void
}
```

**Keyboard:** Opens with `Cmd/Ctrl + /` or `/` when no input focused

### ConfirmDialog

**File:** `components/shared/confirm-dialog.tsx`

**Props:**
```tsx
interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string         // Default: "Confirm"
  cancelLabel?: string          // Default: "Cancel"
  variant?: 'default' | 'destructive'
  loading?: boolean
}
```

**Usage:**
```tsx
<ConfirmDialog
  open={showDeleteConfirm}
  onClose={() => setShowDeleteConfirm(false)}
  onConfirm={handleDelete}
  title="Delete task?"
  description="This action cannot be undone."
  confirmLabel="Delete"
  variant="destructive"
  loading={isDeleting}
/>
```

---

## Feature Components

These are specific to feature areas.

### Tasks

#### TaskCard

**File:** `components/features/tasks/task-card.tsx`

**Props:**
```tsx
interface TaskCardProps {
  task: Task
  onComplete: (id: string) => void
  onClick: (id: string) => void
  showProject?: boolean
  showAssignee?: boolean
  compact?: boolean
}
```

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ [✓]  Task title here that might be longer...     Dec 23   │
│      [Project badge]                        [Avatar]      │
└────────────────────────────────────────────────────────────┘
```

#### TaskCheckbox

**File:** `components/features/tasks/task-checkbox.tsx`

Custom checkbox with task-specific animations.

**Props:**
```tsx
interface TaskCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}
```

#### TaskForm

**File:** `components/features/tasks/task-form.tsx`

Full task create/edit form.

**Props:**
```tsx
interface TaskFormProps {
  task?: Task                   // Edit mode if provided
  defaultValues?: Partial<Task> // Pre-fill for create
  projectId?: string            // Lock to project
  onSubmit: (data: TaskFormData) => void
  onCancel: () => void
  loading?: boolean
}
```

#### TaskDetailPanel

**File:** `components/features/tasks/task-detail-panel.tsx`

Slide-out panel for task details.

**Props:**
```tsx
interface TaskDetailPanelProps {
  taskId: string | null
  onClose: () => void
}
```

#### TaskList

**File:** `components/features/tasks/task-list.tsx`

**Props:**
```tsx
interface TaskListProps {
  tasks: Task[]
  onTaskComplete: (id: string) => void
  onTaskClick: (id: string) => void
  showCompleted?: boolean
  emptyMessage?: string
  groupBy?: 'none' | 'status' | 'project' | 'assignee'
}
```

#### TaskKanban

**File:** `components/features/tasks/task-kanban.tsx`

**Props:**
```tsx
interface TaskKanbanProps {
  tasks: Task[]
  onTaskMove: (taskId: string, newStatus: TaskStatus) => void
  onTaskClick: (id: string) => void
  columns?: TaskStatus[]        // Which columns to show
}
```

### Habits

#### HabitCard

**File:** `components/features/habits/habit-card.tsx`

**Props:**
```tsx
interface HabitCardProps {
  habit: Habit
  todayStatus: 'done' | 'pending' | 'skipped' | null
  onCheck: (habitId: string) => void
  onSkip: (habitId: string) => void
  onClick: (habitId: string) => void
}
```

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ 📖 Read 20 min                             🔥 12 days     │
│ Daily · Hazel                                             │
│                                                            │
│ [Mon][Tue][Wed][Thu][Fri][Sat][Sun]  ← This week          │
│  ✓    ✓    ✓    ✓    ○    ○    ○                         │
└────────────────────────────────────────────────────────────┘
```

#### HabitHeatmap

**File:** `components/features/habits/habit-heatmap.tsx`

30-day or 365-day heatmap visualization.

**Props:**
```tsx
interface HabitHeatmapProps {
  logs: HabitLog[]
  days?: 30 | 365
}
```

#### HabitForm

**File:** `components/features/habits/habit-form.tsx`

### Goals

#### GoalCard

**File:** `components/features/goals/goal-card.tsx`

**Props:**
```tsx
interface GoalCardProps {
  goal: Goal
  onClick: (id: string) => void
  compact?: boolean
}
```

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ 📚 Read 50 books                                          │
│                                                            │
│ 42/50 · ████████████████░░░░ 84%                         │
│                                                            │
│ Target: Dec 31 · On track ✓                               │
│ Supported by: "Read 20 min" habit                         │
└────────────────────────────────────────────────────────────┘
```

#### GoalProgress

**File:** `components/features/goals/goal-progress.tsx`

Progress bar with value display.

### Projects

#### ProjectCard

**File:** `components/features/projects/project-card.tsx`

**Props:**
```tsx
interface ProjectCardProps {
  project: Project
  taskStats: { completed: number; total: number }
  onClick: (id: string) => void
}
```

### Meals

#### MealCalendar

**File:** `components/features/meals/meal-calendar.tsx`

Week view with meal slots.

**Props:**
```tsx
interface MealCalendarProps {
  meals: Meal[]
  weekStart: Date
  onAddMeal: (date: Date, mealType: MealType) => void
  onMealClick: (id: string) => void
  mealTypes?: MealType[]        // Default: ['dinner']
}
```

#### MealCell

**File:** `components/features/meals/meal-cell.tsx`

Single cell in meal calendar.

#### RecipeCard

**File:** `components/features/meals/recipe-card.tsx`

**Props:**
```tsx
interface RecipeCardProps {
  recipe: Recipe
  onClick: (id: string) => void
  onAddToMeal?: (id: string) => void
}
```

### Meeting

#### MeetingSection

**File:** `components/features/meeting/meeting-section.tsx`

Collapsible section of meeting view.

**Props:**
```tsx
interface MeetingSectionProps {
  title: string
  icon: React.ReactNode
  number: number              // Section number (1-5)
  defaultOpen?: boolean
  children: React.ReactNode
}
```

#### MilestoneList

**File:** `components/features/meeting/milestone-list.tsx`

**Props:**
```tsx
interface MilestoneListProps {
  milestones: Milestone[]
  groupByPerson?: boolean
  onAdd: () => void
}
```

### Dashboard

#### StatsCard

**File:** `components/features/dashboard/stats-card.tsx`

**Props:**
```tsx
interface StatsCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  onClick?: () => void
}
```

#### MilestonesPreview

**File:** `components/features/dashboard/milestones-preview.tsx`

Compact milestone display for dashboard.

#### UpcomingBirthdays

**File:** `components/features/dashboard/upcoming-birthdays.tsx`

---

## Layout Components

### AppShell

**File:** `components/layout/app-shell.tsx`

Main application wrapper.

**Props:**
```tsx
interface AppShellProps {
  children: React.ReactNode
}
```

**Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ [TopBar]                                                    │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                   │
│ [Sidebar]│                [Main Content]                    │
│          │                                                   │
│          │                                                   │
│          │                                                   │
│          │                                                   │
│          │                                                   │
│          │                                                   │
├──────────┴──────────────────────────────────────────────────┤
│ [MobileNav] (mobile only)                                   │
└─────────────────────────────────────────────────────────────┘
```

### Sidebar

**File:** `components/layout/sidebar.tsx`

Desktop navigation sidebar.

### MobileNav

**File:** `components/layout/mobile-nav.tsx`

Bottom navigation for mobile.

### TopBar

**File:** `components/layout/top-bar.tsx`

**Props:**
```tsx
interface TopBarProps {
  title?: string                // Override page title
}
```

---

## Component Patterns

### Controlled vs. Uncontrolled

All form components should be **controlled**:
```tsx
// ✅ Good - controlled
<Input value={name} onChange={setName} />

// ❌ Avoid - uncontrolled
<Input defaultValue={name} />
```

### Loading States

Components that fetch data should accept `loading` prop:
```tsx
interface TaskListProps {
  tasks: Task[]
  loading?: boolean  // Show skeletons
}
```

### Error States

Components should handle errors gracefully:
```tsx
interface TaskListProps {
  tasks: Task[]
  error?: Error | null
  onRetry?: () => void
}
```

### Forwarding Refs

All base components should forward refs:
```tsx
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => {
    return <button ref={ref} {...props}>{children}</button>
  }
)
```

### Composition

Prefer composition over configuration:
```tsx
// ✅ Good - composable
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// ❌ Avoid - too many props
<Card title="Title" content="Content" headerIcon={...} />
```

---

---

## 🚀 Implementation Status

> **Last Updated:** December 2024

### UI Components (Base Primitives)

| Component | Spec | Implemented | Location | Notes |
|-----------|------|-------------|----------|-------|
| Button | ✅ | ✅ | `components/ui/button.tsx` | All variants, sizes, loading state |
| Input | ✅ | ✅ | `components/ui/input.tsx` | With icons, error states |
| Checkbox | ✅ | ✅ | `components/ui/checkbox.tsx` | SVG animation |
| Card | ✅ | ✅ | `components/ui/card.tsx` | Composable (Header, Title, Content) |
| Spinner | ✅ | ✅ | `components/ui/spinner.tsx` | Multiple sizes |
| Select | ✅ | 🔨 | - | Not yet built |
| Dialog/Modal | ✅ | 🔨 | - | Not yet built |
| Progress | ✅ | 🔨 | - | Not yet built |
| Skeleton | ✅ | 🔨 | - | Not yet built |
| Toast | ✅ | ✅ | Via Sonner | Using sonner library |
| Tooltip | ✅ | 🔨 | - | Not yet built |

### Shared Components

| Component | Spec | Implemented | Location | Notes |
|-----------|------|-------------|----------|-------|
| Avatar | ✅ | ✅ | `components/shared/avatar.tsx` | Initials fallback, colors |
| AvatarGroup | ✅ | 🔨 | - | Not yet built |
| Badge | ✅ | ✅ | `components/shared/badge.tsx` | Multiple variants |
| StreakBadge | ✅ | ✅ | `components/shared/badge.tsx` | Fire emoji, animate prop |
| EmptyState | ✅ | ✅ | `components/shared/empty-state.tsx` | Icon, action button |
| DatePicker | ✅ | 🔨 | - | Not yet built |
| FamilyMemberPicker | ✅ | 🔨 | - | Not yet built |
| ProjectPicker | ✅ | 🔨 | - | Not yet built |
| QuickAddModal | ✅ | 🔨 | - | Not yet built |
| SearchModal | ✅ | 🔨 | - | Not yet built |
| ConfirmDialog | ✅ | 🔨 | - | Not yet built |

### Layout Components

| Component | Spec | Implemented | Location | Notes |
|-----------|------|-------------|----------|-------|
| AppShell | ✅ | ✅ | `components/layout/app-shell.tsx` | Main wrapper |
| Sidebar | ✅ | ✅ | `components/layout/sidebar.tsx` | Navigation with icons |
| TopBar | ✅ | ✅ | `components/layout/top-bar.tsx` | With user menu |
| MobileNav | ✅ | 🔨 | - | Using responsive sidebar |
| PageHeader | ✅ | 🔨 | - | Not yet built |

### Feature Components

| Component | Spec | Implemented | Notes |
|-----------|------|-------------|-------|
| TaskCard | ✅ | ⚠️ Inline | Logic in tasks/page.tsx |
| TaskList | ✅ | ⚠️ Inline | Logic in tasks/page.tsx |
| TaskForm | ✅ | 🔨 | Quick add only |
| HabitCard | ✅ | ⚠️ Inline | Logic in habits/page.tsx |
| HabitHeatmap | ✅ | 🔨 | Not yet built |
| GoalCard | ✅ | 🔨 | Not yet built |
| ProjectCard | ✅ | 🔨 | Not yet built |
| MealCalendar | ✅ | 🔨 | Not yet built |
| StatsCard | ✅ | ⚠️ Inline | Logic in dashboard |

### Implementation Summary

**Total from spec:** ~40 components
**Implemented:** 11 components (standalone files)
**Inline/Partial:** 4 components (logic in page files)
**Pending:** ~25 components

### Recommended Next Steps

1. **High Priority:**
   - `DatePicker` - needed for task/goal forms
   - `Dialog/Modal` - needed for forms and confirmations
   - `FamilyMemberPicker` - needed for assignments
   - `Select` - needed for status/filter dropdowns

2. **Medium Priority:**
   - Extract `TaskCard` to standalone component
   - Extract `HabitCard` to standalone component
   - Build `ConfirmDialog` for delete actions

3. **Lower Priority:**
   - `SearchModal` - global search
   - `QuickAddModal` - keyboard shortcut capture
   - Feature-specific components (Meals, Goals, etc.)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-23 | Hazel + Claude | Initial component library |
| 1.1 | 2024-12-23 | Claude | Added implementation status |
| 1.2 | 2024-12-23 | Claude | Auth pages updated to magic link flow |
| 1.3 | 2024-12-25 | Claude | Pages now connected to DB (loading/error states inline) |
