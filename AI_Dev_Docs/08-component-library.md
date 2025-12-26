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

Custom dropdown component with keyboard navigation and click-outside handling.

**Props:**
```tsx
interface SelectProps {
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
  allowClear?: boolean
  className?: string
  children: React.ReactNode  // SelectOption components
}

interface SelectOptionProps {
  value: string
  children: React.ReactNode
  disabled?: boolean
}
```

**Usage:**
```tsx
<Select value={status} onChange={setStatus} placeholder="Select status...">
  <SelectOption value="active">Active</SelectOption>
  <SelectOption value="done">Done</SelectOption>
  <SelectDivider />
  <SelectOption value="archived">Archived</SelectOption>
</Select>
```

### Dialog / Modal

**File:** `components/ui/dialog.tsx`

Accessible modal dialog with composable parts.

**Sizes:** `sm` (400px), `default` (500px), `lg` (700px), `full` (90vw)

**Animation:**
- Backdrop fades in (150ms)
- Content scales from 0.95 with fade (200ms)

**Props:**
```tsx
interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  size?: 'sm' | 'default' | 'lg' | 'full'
  children: React.ReactNode
}
```

**Usage:**
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen} size="default">
  <DialogHeader>
    <DialogTitle>Edit Task</DialogTitle>
    <DialogDescription>Make changes to your task below.</DialogDescription>
  </DialogHeader>
  <DialogBody>
    {/* Form content */}
  </DialogBody>
  <DialogFooter>
    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button onClick={handleSave}>Save</Button>
  </DialogFooter>
</Dialog>
```

**Features:**
- ESC key closes the dialog
- Click outside closes the dialog
- Body scroll lock when open
- Focus trap within modal
- Accessible ARIA attributes

### Card

**File:** `components/ui/card.tsx`

**Variants:**
| Variant | Styling |
|---------|---------|
| `default` | White bg, shadow-md |
| `bordered` | White bg, neutral-200 border, no shadow |
| `interactive` | Default + hover shadow + cursor pointer |
| `flat` | Subtle bg color, no shadow |

### Progress / ProgressBar

**File:** `components/shared/progress-bar.tsx`

Visual progress indicator with auto-coloring based on percentage.

**Props:**
```tsx
interface ProgressBarProps {
  value: number  // 0-100
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error' | 'auto'
  className?: string
}
```

**Sizes:**
| Size | Height |
|------|--------|
| sm | 4px |
| md | 8px |
| lg | 12px |

**Auto Variant Behavior:**
- 0-33%: error (red)
- 34-66%: warning (yellow)
- 67-100%: success (green)

**Usage:**
```tsx
<ProgressBar value={75} size="md" variant="auto" />
<ProgressBar value={42} size="sm" variant="default" />
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

Dropdown to select a family member with avatar display.

**Props:**
```tsx
interface FamilyMemberPickerProps {
  value: string | null          // family_member.id
  onChange: (id: string | null) => void
  placeholder?: string
  disabled?: boolean
  allowNone?: boolean           // Show "Unassigned" option
  className?: string
}
```

**Features:**
- Shows avatar + name for each member
- Current user marked with "(you)"
- Optional "Unassigned" option
- Click outside to close
- ESC key to close
- Animated dropdown

**Dropdown Item:**
```
┌─────────────────────────────┐
│ [Avatar] Hazel (you)    ✓   │
│ [Avatar] Mike               │
│ [Avatar] Zelda              │
│ [Avatar] Miles              │
│ ─────────────────────────── │
│ [○] Unassigned              │
└─────────────────────────────┘
```

**Usage:**
```tsx
<FamilyMemberPicker
  value={assignedTo}
  onChange={setAssignedTo}
  placeholder="Assign to..."
  allowNone
/>
```

### ProjectPicker

**File:** `components/shared/project-picker.tsx`

Dropdown to select a project with color and status indicators.

**Props:**
```tsx
interface ProjectPickerProps {
  value: string | null          // project.id
  onChange: (id: string | null) => void
  placeholder?: string
  disabled?: boolean
  allowNone?: boolean           // Show "No project" option
  className?: string
}
```

**Features:**
- Project color dot indicator
- Status badge (planning, active, on_hold, completed)
- "No project" option when allowNone=true
- Fetches projects via useActiveProjects() hook

**Dropdown Item:**
```
┌─────────────────────────────┐
│ [○] No project          ✓   │
│ ─────────────────────────── │
│ [●] Summer Camps   Active   │
│ [●] Japan Trip    Planning  │
│ [●] Home Reno     On Hold   │
└─────────────────────────────┘
```

**Usage:**
```tsx
<ProjectPicker
  value={projectId}
  onChange={setProjectId}
  placeholder="Add to project..."
  allowNone
/>
```

### GoalPicker

**File:** `components/shared/goal-picker.tsx`

Dropdown to select a goal with progress visualization.

**Props:**
```tsx
interface GoalPickerProps {
  value: string | null          // goal.id
  onChange: (id: string | null) => void
  placeholder?: string
  disabled?: boolean
  allowNone?: boolean           // Show "No goal" option
  familyGoalsOnly?: boolean     // Only show family goals
  personalGoalsOnly?: boolean   // Only show personal goals
  ownerId?: string              // Filter by owner
  className?: string
}
```

**Features:**
- Shows goal title with target icon
- Family vs personal goal indicator (Users/User icon)
- Progress bar for quantitative goals
- Current/target value display

**Dropdown Item:**
```
┌─────────────────────────────┐
│ [🎯] No goal            ✓   │
│ ─────────────────────────── │
│ [🎯] Read 50 books    👥    │
│      ████████░░ 42/50       │
│ [🎯] Save $5K         👤    │
│      ██████░░░░ $3.2k/$5k   │
└─────────────────────────────┘
```

**Usage:**
```tsx
<GoalPicker
  value={goalId}
  onChange={setGoalId}
  placeholder="Link to goal..."
  allowNone
/>
```

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

#### TaskForm / TaskModal

**File:** `components/modals/task-modal.tsx`

Full task create/edit modal with all entity pickers.

**Props:**
```tsx
interface TaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null            // Edit mode if provided
  initialTitle?: string         // Pre-fill title for create
  initialStatus?: TaskStatus    // Default status (default: 'active')
  onSuccess?: () => void        // Called after successful save
}
```

**Features:**
- Create mode: empty form with optional initialTitle
- Edit mode: pre-filled with existing task data
- All entity pickers: FamilyMemberPicker, ProjectPicker, GoalPicker
- Status selector: inbox, active, waiting_for, done
- Priority selector: low, medium, high
- Due date input (native date picker)
- Description textarea
- Keyboard shortcut: Cmd/Ctrl+Enter to save
- Loading state during mutations
- Toast notifications on success/error

**Form Fields:**
```
┌────────────────────────────────────────────────────┐
│ Edit Task                                      ✕   │
├────────────────────────────────────────────────────┤
│                                                    │
│ Title *                                            │
│ ┌────────────────────────────────────────────────┐ │
│ │ Review camp options                            │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ Description                                        │
│ ┌────────────────────────────────────────────────┐ │
│ │ Look into options for summer camp...           │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ Status          Priority        Due Date          │
│ [Active ▼]      [Medium ▼]      [📅 Dec 28]      │
│                                                    │
│ Assigned To                Project                │
│ [👤 Hazel ▼]               [📁 Summer Camps ▼]   │
│                                                    │
│ Goal                                               │
│ [🎯 None ▼]                                       │
│                                                    │
├────────────────────────────────────────────────────┤
│                         [Cancel]  [Save Task]      │
│                                   ⌘+Enter          │
└────────────────────────────────────────────────────┘
```

**Usage:**
```tsx
// Create mode
<TaskModal
  open={isOpen}
  onOpenChange={setIsOpen}
  initialStatus="active"
/>

// Edit mode
<TaskModal
  open={isOpen}
  onOpenChange={setIsOpen}
  task={selectedTask}
/>

// Triage from inbox (with pre-filled title)
<TaskModal
  open={isOpen}
  onOpenChange={setIsOpen}
  initialTitle={inboxItem.title}
  initialStatus="active"
  onSuccess={handleDeleteInboxItem}
/>
```

#### GoalModal

**File:** `components/modals/goal-modal.tsx`

Full goal create/edit modal with qualitative/quantitative support.

**Props:**
```tsx
interface GoalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal?: Goal | null            // Edit mode if provided
  initialTitle?: string         // Pre-fill title for create
  onSuccess?: (goal: Goal) => void
}
```

**Features:**
- Create mode: empty form with optional initialTitle
- Edit mode: pre-filled with existing goal data
- Goal type toggle: qualitative (checkbox) vs quantitative (numeric)
- Target value and unit for quantitative goals
- Owner picker (family member)
- Target date input
- Family vs personal goal toggle
- Keyboard shortcut: Cmd/Ctrl+Enter to save

#### HabitModal

**File:** `components/modals/habit-modal.tsx`

Full habit create/edit modal with frequency and goal linking.

**Props:**
```tsx
interface HabitModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  habit?: Habit | null          // Edit mode if provided
  initialTitle?: string         // Pre-fill title for create
  onSuccess?: (habit: Habit) => void
}
```

**Features:**
- Create mode: empty form with optional initialTitle (uses `useCreateHabit`)
- Edit mode: pre-filled with existing habit data (uses `useUpdateHabit`)
- Frequency selector: daily, weekly (with target days picker), custom (specific days)
- Owner picker (family member)
- Goal picker to link habit to goal
- "More options" toggle for description/goal
- Keyboard shortcut: Cmd/Ctrl+Enter to save
- Optimistic updates for instant feedback

**Usage from Habits/Today pages:**
- Click "New Habit" button → opens in create mode
- Click habit card → opens in edit mode

#### ProjectModal

**File:** `components/modals/project-modal.tsx`

Full project create/edit modal with status and owner.

**Props:**
```tsx
interface ProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project | null      // Edit mode if provided
  initialTitle?: string         // Pre-fill title for create
  onSuccess?: (project: Project) => void
}
```

**Features:**
- Create mode: empty form with optional initialTitle
- Edit mode: pre-filled with existing project data
- Status selector: planning, active, on_hold, completed
- Owner picker (family member)
- Target date input
- Icon/emoji selector (click to cycle)
- Description and notes textareas (in "more options")
- Keyboard shortcut: Cmd/Ctrl+Enter to save

**Form Layout:**
```
┌────────────────────────────────────────────────────┐
│ Create Project                                  ✕   │
├────────────────────────────────────────────────────┤
│                                                    │
│ [📁] What's the project?                          │
│                                                    │
│ Status                                             │
│ [Planning] [Active] [On Hold] [Completed]         │
│                                                    │
│ Owner                                              │
│ [👤 Select owner... ▼]                            │
│                                                    │
│ Target date                                        │
│ [📅 _____________]                                │
│                                                    │
│ [Show more options]                                │
│                                                    │
├────────────────────────────────────────────────────┤
│                       [Cancel]  [Create Project]   │
│                                   ⌘+Enter          │
└────────────────────────────────────────────────────┘
```

#### SomedayModal

**File:** `components/modals/someday-modal.tsx`

Full someday item create/edit modal with category and estimated cost.

**Props:**
```tsx
interface SomedayModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: SomedayItem | null     // Edit mode if provided
  initialTitle?: string         // Pre-fill title for create
  initialCategory?: SomedayCategory
  onSuccess?: (item: SomedayItem) => void
}
```

**Features:**
- Create mode: empty form with optional initialTitle and category
- Edit mode: pre-filled with existing item data
- Category selector: trip, purchase, experience, house, other
- Category icons with color coding
- Estimated cost input with $ prefix
- Description textarea
- Keyboard shortcut: Cmd/Ctrl+Enter to save

**Category Config:**
| Category | Icon | Color |
|----------|------|-------|
| trip | Plane | Blue |
| purchase | ShoppingBag | Green |
| experience | Lightbulb | Orange |
| house | Home | Purple |
| other | Sparkles | Amber |

**Form Layout:**
```
┌────────────────────────────────────────────────────┐
│ ✨ Add Dream                                    ✕   │
├────────────────────────────────────────────────────┤
│                                                    │
│ What's your dream?                                 │
│ ┌────────────────────────────────────────────────┐ │
│ │                                                │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ Category                                           │
│ [✈️ Trip] [🛍️ Purchase] [💡 Experience]           │
│ [🏠 House] [✨ Other]                             │
│                                                    │
│ Description                                        │
│ ┌────────────────────────────────────────────────┐ │
│ │ What makes this dream special?                 │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ 💵 Estimated cost (optional)                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ $ ___________                                  │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
├────────────────────────────────────────────────────┤
│                         [Cancel]  [Add Dream]      │
│                                   ⌘+Enter          │
└────────────────────────────────────────────────────┘
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
| Select | ✅ | ✅ | `components/ui/select.tsx` | Keyboard nav, click-outside |
| Dialog/Modal | ✅ | ✅ | `components/ui/dialog.tsx` | ESC close, focus trap, composable |
| Progress | ✅ | ✅ | `components/shared/progress-bar.tsx` | 3 sizes, 5 variants, auto-color |
| Skeleton | ✅ | 🔨 | - | Not yet built |
| Toast | ✅ | ✅ | Via Sonner | Using sonner library |
| Tooltip | ✅ | 🔨 | - | Not yet built |

### Shared Components

| Component | Spec | Implemented | Location | Notes |
|-----------|------|-------------|----------|-------|
| Avatar | ✅ | ✅ | `components/shared/avatar.tsx` | Initials fallback, colors |
| AvatarGroup | ✅ | ✅ | `components/shared/avatar.tsx` | Overlap display, +N indicator |
| Badge | ✅ | ✅ | `components/shared/badge.tsx` | Multiple variants |
| StreakBadge | ✅ | ✅ | `components/shared/badge.tsx` | Fire emoji, animate prop |
| EmptyState | ✅ | ✅ | `components/shared/empty-state.tsx` | Icon, action button |
| ProgressBar | ✅ | ✅ | `components/shared/progress-bar.tsx` | 3 sizes, auto-color |
| DatePicker | ✅ | 🔨 | - | Not yet built (using native) |
| FamilyMemberPicker | ✅ | ✅ | `components/shared/family-member-picker.tsx` | Avatar, "(you)" indicator |
| ProjectPicker | ✅ | ✅ | `components/shared/project-picker.tsx` | Color dot, status badge |
| GoalPicker | ✅ | ✅ | `components/shared/goal-picker.tsx` | Progress bar, family/personal |
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
| TaskModal | ✅ | ✅ | `components/modals/task-modal.tsx` - Full create/edit |
| GoalModal | ✅ | ✅ | `components/modals/goal-modal.tsx` - Full create/edit |
| HabitModal | ✅ | ✅ | `components/modals/habit-modal.tsx` - Full create/edit |
| ProjectModal | ✅ | ✅ | `components/modals/project-modal.tsx` - Full create/edit |
| SomedayModal | ✅ | ✅ | `components/modals/someday-modal.tsx` - Full create/edit |
| HabitCard | ✅ | ⚠️ Inline | Logic in habits/page.tsx - click-to-edit via HabitModal |
| HabitHeatmap | ✅ | 🔨 | Not yet built |
| GoalCard | ✅ | ⚠️ Inline | Logic in goals/page.tsx |
| ProjectCard | ✅ | ⚠️ Inline | Logic in projects/page.tsx |
| SomedayCard | ✅ | ⚠️ Inline | Logic in someday/page.tsx |
| MealCalendar | ✅ | 🔨 | Not yet built |
| StatsCard | ✅ | ⚠️ Inline | Logic in dashboard (connected to real data) |

### Implementation Summary

**Total from spec:** ~45 components
**Implemented:** 23 components (standalone files)
**Inline/Partial:** 8 components (logic in page files)
**Pending:** ~14 components

### Recommended Next Steps

1. **High Priority:**
   - `DatePicker` - native input used for now, custom picker later
   - `ConfirmDialog` - needed for delete actions

2. **Medium Priority:**
   - Extract `TaskCard` to standalone component
   - Extract `HabitCard` to standalone component
   - Extract `GoalCard` to standalone component
   - Extract `ProjectCard` to standalone component
   - `Skeleton` - loading placeholder animations

3. **Lower Priority:**
   - `SearchModal` - global search
   - `QuickAddModal` - keyboard shortcut capture
   - `HabitHeatmap` - 30/365 day visualization
   - Feature-specific components (Meals, etc.)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-23 | Hazel + Claude | Initial component library |
| 1.1 | 2024-12-23 | Claude | Added implementation status |
| 1.2 | 2024-12-23 | Claude | Auth pages updated to magic link flow |
| 1.3 | 2024-12-25 | Claude | Pages now connected to DB (loading/error states inline) |
| 1.4 | 2024-12-25 | Claude | Dashboard StatsCard now connected to real data |
| 1.5 | 2024-12-26 | Claude | Added Dialog, Select, entity pickers (FamilyMember, Project, Goal), ProgressBar, TaskModal |
| 1.6 | 2024-12-26 | Claude | Added GoalModal, HabitModal, ProjectModal, SomedayModal documentation; updated implementation status |
| 1.7 | 2024-12-26 | Claude | Updated HabitModal to document edit mode with useUpdateHabit; HabitCard click-to-edit |
