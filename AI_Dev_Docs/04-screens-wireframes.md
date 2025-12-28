# Fam — Screen Inventory & Wireframes

## Overview

This document describes every screen in Fam with enough detail for implementation. Each screen includes layout, components, states, and responsive behavior.

---

## Design Tokens Reference

Before diving into screens, reference these design decisions:

| Token | Value | Notes |
|-------|-------|-------|
| Border radius (cards) | 16px | Soft, friendly |
| Border radius (buttons) | 8px | Slightly less rounded |
| Border radius (inputs) | 8px | Match buttons |
| Shadow (cards) | `0 2px 8px rgba(0,0,0,0.08)` | Subtle lift |
| Shadow (modals) | `0 8px 32px rgba(0,0,0,0.12)` | More prominent |
| Spacing scale | 4, 8, 12, 16, 24, 32, 48 | Use consistently |
| Max content width | 1200px | Centered on large screens |
| Sidebar width | 240px desktop | Collapsible |
| Card padding | 16px | Comfortable |

---

## Global Components

### G1: Navigation Sidebar (Desktop)

```
┌─────────────────────────┐
│ [Logo] Fam              │
├─────────────────────────┤
│ 🏠 Home                 │
│ 📥 Inbox            (3) │  ← Badge for count
│ ☀️ Today                │
│ 📅 Calendar             │
├─────────────────────────┤
│ ✓ Tasks                 │
│ 🔄 Habits               │
│ 🎯 Goals                │
│ 📁 Projects             │
│ ✨ Someday              │
├─────────────────────────┤
│ 🍽️ Meals                │
│ 👥 Family Meeting       │
├─────────────────────────┤
│ 👤 People          ▼    │  ← Expandable
│   ├─ Family             │
│   ├─ Contacts           │
│   └─ Vendors            │
│ 📍 Places               │
├─────────────────────────┤
│ ⚙️ Settings             │
└─────────────────────────┘
│ [Avatar] Hazel      ▼   │  ← User menu
└─────────────────────────┘
```

**Behavior:**
- Current page highlighted with accent background
- Badge count on Inbox updates in real-time
- Expandable sections remember state
- Collapse to icons only on smaller desktop
- User menu shows: profile, switch family (future), sign out

### G2: Navigation Bar (Mobile)

```
┌─────────────────────────────────────┐
│  🏠    📥(3)   ☀️    📅    ☰       │
│ Home   Inbox  Today  Cal   More    │
└─────────────────────────────────────┘
```

**Behavior:**
- Fixed to bottom of screen
- "More" opens drawer with remaining nav items
- Active tab highlighted
- Badge on Inbox

### G3: Top Bar (All Screens)

```
┌────────────────────────────────────────────────────┐
│ [Page Title]                    🔍  [+]  [Avatar] │
└────────────────────────────────────────────────────┘
```

**Behavior:**
- Page title reflects current location
- Search icon opens global search modal
- [+] is quick-add button (always visible)
- Avatar opens user menu on mobile (desktop has it in sidebar)

### G4: Quick Add Modal

```
┌────────────────────────────────────────┐
│ Quick Add                          ✕   │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ What's on your mind?               │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Type: [Inbox ▼]  [Task]  [Someday]     │
│                                        │
│                    [Cancel]  [Add ✓]   │
└────────────────────────────────────────┘
```

**Behavior:**
- Opens with Cmd/Ctrl + K or [+] button
- Text input auto-focused
- Type defaults to Inbox
- If Task selected, shows due date picker inline
- Enter submits, Escape closes
- After add, modal stays open for batch capture (with "Add another" or close)

### G5: Search Modal

```
┌────────────────────────────────────────┐
│ 🔍 Search...                       ✕   │
├────────────────────────────────────────┤
│ Recent                                 │
│ ├─ Summer camp planning                │
│ └─ Dr. Patterson                       │
├────────────────────────────────────────┤
│ Results for "dentist"                  │
│                                        │
│ Tasks                                  │
│ ├─ ✓ Schedule Miles dentist checkup    │
│                                        │
│ Vendors                                │
│ ├─ 🏥 Shorewood Family Dental          │
│                                        │
│ Places                                 │
│ └─ 📍 Shorewood Family Dental (place)  │
└────────────────────────────────────────┘
```

**Behavior:**
- Results update as you type (debounced 200ms)
- Grouped by type
- Keyboard navigation (arrows, enter to select)
- Click or Enter opens the item

---

## Screen 0: Onboarding — Family Setup

**URL:** `/onboarding`

**Purpose:** Create a family for new authenticated users who don't have one yet

### Layout

```
┌────────────────────────────────────────────────────┐
│                                                    │
│            Welcome to Fam!                         │
│    Let's set up your family command center.        │
│                                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  Family Name                                       │
│  ┌──────────────────────────────────────────────┐  │
│  │ The Smith Family                             │  │
│  └──────────────────────────────────────────────┘  │
│  This is how your family will be identified.       │
│                                                    │
│  Your Name                                         │
│  ┌──────────────────────────────────────────────┐  │
│  │ Hazel                                        │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Your Color                                        │
│  ● ● ● ● ● ● ● ●   ← Color picker                 │
│  This color will identify you throughout the app.  │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │              Get Started                     │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  You'll be able to invite other family members     │
│  later.                                            │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Behavior

- Shown to authenticated users without a family_member record
- Pre-fills user name from auth metadata if available
- Creates family record then family_member record as owner
- Redirects to dashboard on success
- Middleware enforces this page for users without family

---

## Screen 1: Home — Family Dashboard

**URL:** `/`

**Purpose:** At-a-glance family status, daily orientation

### Layout (Desktop)

```
┌──────────────────────────────────────────────────────────┐
│ Good morning, Hazel! ☀️                   Dec 23, 2024   │
│ Here's what's happening today.                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐│
│ │ 📋 Tasks Today  │ │ 🔄 Habits       │ │ 🍽️ Meals    ││
│ │                 │ │                 │ │              ││
│ │ 5 due           │ │ 3/4 checked     │ │ Dinner:      ││
│ │ 2 overdue       │ │ 🔥 12 day       │ │ Tacos 🌮     ││
│ │                 │ │    streak       │ │ Mike cooking ││
│ └─────────────────┘ └─────────────────┘ └──────────────┘│
│                                                          │
│ ┌────────────────────────────────────────────────────────┤
│ │ 🎉 This Week's Wins                                   │
│ │                                                        │
│ │ Zelda: Finished her book report! 📚                   │
│ │ Miles: Scored a goal at soccer ⚽                      │
│ │ Hazel: Launched newsletter 🚀                         │
│ └────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─────────────────────────┐ ┌────────────────────────────┤
│ │ 📁 Active Projects      │ │ 🎂 Upcoming                │
│ │                         │ │                            │
│ │ ┌───────────────────┐   │ │ Dec 28 - Grandma's bday    │
│ │ │ Summer Camps      │   │ │ Jan 3 - Mike's bday        │
│ │ │ ████░░░░ 4/10     │   │ │                            │
│ │ └───────────────────┘   │ │                            │
│ │ ┌───────────────────┐   │ │                            │
│ │ │ Bathroom Reno     │   │ │                            │
│ │ │ ██░░░░░░ 2/8      │   │ │                            │
│ │ └───────────────────┘   │ └────────────────────────────┤
│ └─────────────────────────┘                              │
│                                                          │
│                                            [+] ← FAB     │
└──────────────────────────────────────────────────────────┘
```

### Components

**Stats Cards (3-up)**
- Task card: count due today, count overdue (red if >0), link to Today view
- Habits card: X/Y checked today, current family streak champion
- Meals card: today's meals with recipe name and cook

**Milestones Section**
- This week's milestones, max 5 shown
- Each shows: person (avatar + name), milestone title, emoji if applicable
- "See all" link to meeting view
- If no milestones: encouraging empty state "No wins yet this week—add one!"

**Projects Section**
- Top 3-4 active projects
- Card shows: title, progress bar (tasks done/total), owner avatar
- "View all" link

**Upcoming Section**
- Birthdays in next 14 days
- Family member colors for quick ID
- Link to contacts if clicked

### Modal Connections (Implemented)

The Dashboard has full modal integration for creating and editing entities:

**Habits Section:**
- Click checkbox → Toggle habit completion (done/undone)
- Click habit card → Opens HabitModal for editing
- Click "Add Habit" button → Opens HabitModal in create mode

**Goals Section:**
- Click goal card → Opens GoalModal for editing
- Click "Add Goal" button → Opens GoalModal in create mode
- Click progress (+) button → Opens GoalModal for quick progress update

**Tasks Section:**
- Click task checkbox → Toggle task completion
- Click task row → Opens TaskModal for editing
- Click "Add Task" button → Opens TaskModal in create mode

**Pattern Note:** For habits, the toggle action uses `stopPropagation()` to prevent the card click handler from firing when checking/unchecking habits.

### Mobile Layout

Stack cards vertically:
1. Stats row (3 cards, horizontally scrollable if needed)
2. Meals (today only)
3. Milestones (collapsed to 3)
4. Projects (horizontally scrollable cards)
5. Upcoming

---

## Screen 2: Home — Personal Dashboard

**URL:** `/me`

**Purpose:** Individual's tasks, habits, goals

### Layout

```
┌──────────────────────────────────────────────────────────┐
│ My Day                                   [Family View →] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌────────────────────────────────────────────────────────┤
│ │ 🔄 Today's Habits                                     │
│ │                                                        │
│ │ [✓] Read 20 min          🔥 12 days                   │
│ │ [ ] Exercise             🔥 3 days                    │
│ │ [✓] Journal              🔥 45 days                   │
│ │ [ ] Vitamins                                          │
│ └────────────────────────────────────────────────────────┤
│                                                          │
│ ┌────────────────────────────────────────────────────────┤
│ │ ✓ My Tasks                                            │
│ │                                                        │
│ │ Overdue (2)                                      ▼    │
│ │ ├─ [ ] Pay water bill           Due Dec 21  🔴       │
│ │ └─ [ ] Schedule dentist         Due Dec 20  🔴       │
│ │                                                        │
│ │ Today (3)                                        ▼    │
│ │ ├─ [ ] Review camp options      Due today            │
│ │ ├─ [ ] Call mom                 Due today            │
│ │ └─ [ ] Grocery run              Due today            │
│ │                                                        │
│ │ Upcoming (5)                                     ▼    │
│ │ └─ [ ] Prep family meeting      Due Dec 28           │
│ └────────────────────────────────────────────────────────┤
│                                                          │
│ ┌────────────────────────────────────────────────────────┤
│ │ 🎯 My Goals                                           │
│ │                                                        │
│ │ Read 50 books                   ████████░░ 42/50     │
│ │ Save $5K for Japan             ██████░░░░ $3,200     │
│ │ Exercise 3x/week               On track ✓            │
│ └────────────────────────────────────────────────────────┤
└──────────────────────────────────────────────────────────┘
```

### Behavior

- Habits checkable inline with immediate feedback
- Tasks checkable inline
- Overdue section red-tinted, collapsible
- Click task to open detail panel
- Goals link to goal detail

---

## Screen 3: Inbox

**URL:** `/inbox`

**Purpose:** Process captured items

### Layout

```
┌──────────────────────────────────────────────────────────┐
│ Inbox                                      [Process All] │
│ 3 items to process                                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌────────────────────────────────────────────────────────┤
│ │ Look into summer camp options                         │
│ │ Added Dec 22                                          │
│ │                                                        │
│ │ [Task] [Goal] [Habit] [Project] [Someday] [Archive] [🗑️]│
│ └────────────────────────────────────────────────────────┤
│                                                          │
│ ┌────────────────────────────────────────────────────────┤
│ │ Call plumber about leak                               │
│ │ Added Dec 23                                          │
│ │                                                        │
│ │ [Task] [Goal] [Habit] [Project] [Someday] [Archive] [🗑️]│
│ └────────────────────────────────────────────────────────┤
│                                                          │
│ ┌────────────────────────────────────────────────────────┤
│ │ Trip idea: Japan in spring                            │
│ │ Added Dec 23                                          │
│ │                                                        │
│ │ [Task] [Goal] [Habit] [Project] [Someday] [Archive] [🗑️]│
│ └────────────────────────────────────────────────────────┤
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Empty State

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                    🎉                                    │
│                                                          │
│              Inbox Zero!                                 │
│     Everything's been processed.                         │
│                                                          │
│              [+ Capture something]                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Processing Behavior

**→ Task:** Opens TaskModal pre-filled with title. User adds details (assignee, project, goal, due date), saves. Original inbox item deleted automatically.

**→ Goal:** Opens GoalModal pre-filled with title. User selects qualitative/quantitative, sets target, owner, deadline.

**→ Habit:** Opens HabitModal pre-filled with title. User selects frequency, owner, linked goal.

**→ Project:** Opens ProjectModal pre-filled with title. User selects status, owner, target date, icon.

**→ Someday:** Opens SomedayModal with category picker (Trip, Purchase, Experience, House, Other). Includes estimated cost field.

**Archive:** Marks as archived (can restore later).

**Delete:** Soft delete with undo toast.

**Process All Mode:** Steps through each item. After action, auto-advances to next. Shows progress (2/5 processed). (Not yet implemented)

**Implementation Note:** All modals are fully implemented:
- `TaskModal` - `components/modals/task-modal.tsx`
- `GoalModal` - `components/modals/goal-modal.tsx`
- `HabitModal` - `components/modals/habit-modal.tsx`
- `ProjectModal` - `components/modals/project-modal.tsx`
- `SomedayModal` - `components/modals/someday-modal.tsx`

---

## Screen 4: Today

**URL:** `/today`

**Purpose:** Focused view of today's work including events, birthdays, tasks, and habits

### Layout

```
┌──────────────────────────────────────────────────────────┐
│ Today                            Monday, December 23     │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ 🎂 BIRTHDAY BANNER (when applicable)                     │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ 🎉 Happy Birthday, Miles! 🎂                         │ │
│ │    Turning 8 years old today                         │ │
│ └──────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ 📅 EVENTS                                    [+ Event]   │
│ ┌──────────────────────────────────────────────────────┐ │
│ │  9:00 AM   Dentist appointment           Dr. Smith  │ │
│ │            → Miles                                   │ │
│ │ 3:30 PM   Soccer practice                           │ │
│ │            → Miles                                   │ │
│ │  All day   School holiday                            │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ 🍳 Meals                                                 │
│ ├─ Breakfast: Oatmeal                                   │
│ ├─ Lunch: Leftovers                                     │
│ └─ Dinner: Tacos 🌮 (Mike cooking)                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ 🔄 Habits                                    [+ Habit]   │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ [✓] Read       [ ] Exercise    [✓] Journal   [ ] Vit │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ ⚠️ Overdue                                        2     │
│                                                          │
│ [ ] Pay water bill                        Dec 21  🔴    │
│     → Hazel                                             │
│                                                          │
│ [ ] Schedule dentist                      Dec 20  🔴    │
│     → Hazel                                             │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ 📋 Today's Tasks                              [+ Task]   │
│                                                          │
│ [ ] Review camp options                   Today         │
│     → Hazel · Summer Camps                              │
│                                                          │
│ [ ] Grocery run                           Today         │
│     → Hazel                                             │
│                                                          │
│ [ ] Miles homework help                   Today         │
│     → Mike                                              │
│                                                          │
│ [ ] Family movie night prep               Today         │
│     → Zelda                                             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Behavior

- **Birthday banner:** Shows at top when someone has a birthday today
- **Events section:** Native family events with times and assignees
  - Click event → Opens EventModal for editing
  - "Add Event" button opens EventModal in create mode
  - All-day events shown without time
  - Timed events sorted chronologically
- Meals shown for daily planning context
- Habits inline, checkable
- Overdue section collapsible, red accent
- Tasks grouped: Overdue, Today
- Each task shows: checkbox, title, time (if any), assignee, project badge
- Filter by family member available
- Completing task: animation, moves to done (hidden unless toggled)
- **Click task row → Opens TaskModal for editing**

**Implementation Note:** Click-to-edit via TaskModal/EventModal is fully implemented. Checkbox stops event propagation to prevent opening modal when completing tasks. Birthday banner uses `useTodayBirthdays()` hook.

---

## Screen 5: Tasks List

**URL:** `/tasks`

**Purpose:** Full task management

### Layout with Filters

```
┌──────────────────────────────────────────────────────────┐
│ Tasks                                         [+ Task]   │
│                                                          │
│ View: [List ▼]  [Kanban]  [Calendar]                    │
│                                                          │
│ Filters: [All ▼] [Anyone ▼] [Any project ▼] [Active ▼]  │
│                                                          │
│ ☐ Show completed                                        │
├──────────────────────────────────────────────────────────┤
│ ☐  │ Title               │ Due     │ Assigned │ Project │
│────┼─────────────────────┼─────────┼──────────┼─────────│
│ [ ]│ Pay water bill      │ Dec 21🔴│ Hazel    │ —       │
│ [ ]│ Schedule dentist    │ Dec 20🔴│ Hazel    │ —       │
│ [ ]│ Review camp options │ Dec 23  │ Hazel    │ Camps   │
│ [ ]│ Call plumber        │ Dec 24  │ Mike     │ Reno    │
│ [ ]│ Book flights        │ Dec 28  │ Hazel    │ Japan   │
│ [ ]│ Weekly grocery      │ Dec 23  │ 🔄       │ —       │
└──────────────────────────────────────────────────────────┘
```

### Row Behavior

- Hover: shows quick actions (edit, delete, move to project)
- **Click row: opens TaskModal for editing**
- Check: completes with animation
- Recurring indicator (🔄) on recurring tasks
- Overdue dates in red
- Sorting by clicking column headers
- "New Task" button opens TaskModal in create mode

**Implementation Note:** TaskModal is fully integrated - click any task to open the edit form with all entity pickers (FamilyMemberPicker, ProjectPicker, GoalPicker). Quick add creates inbox tasks, "New Task" button opens full modal.

---

## Screen 6: Tasks Kanban

**URL:** `/tasks?view=kanban`

### Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│ Tasks                                                       [+ Task]   │
│ View: [List]  [Kanban ▼]  [Calendar]                                   │
│ Filter: [Summer Camps ▼]                                               │
├────────────┬────────────┬────────────┬────────────┬────────────────────┤
│  Backlog   │  Up Next   │ In Progress│ Waiting For│       Done         │
│     3      │     2      │     1      │     1      │        4           │
├────────────┼────────────┼────────────┼────────────┼────────────────────┤
│┌──────────┐│┌──────────┐│┌──────────┐│┌──────────┐│ ┌──────────┐       │
││Research  │││Compare   │││Register  │││Waiting   ││ │ ✓ Email  │       │
││options   │││costs     │││for Camp A│││for Camp B││ │   camps  │       │
││          │││          │││          │││response  ││ └──────────┘       │
││Dec 28    │││Dec 30    │││Dec 31    │││          ││                    │
││👤 Hazel  │││👤 Hazel  │││👤 Hazel  │││👤 Mike   ││                    │
│└──────────┘│└──────────┘│└──────────┘│└──────────┘│                    │
│┌──────────┐│┌──────────┐│            │            │                    │
││Get refs  │││Schedule  ││            │            │                    │
││from      │││tours     ││            │            │                    │
││parents   │││          ││            │            │                    │
│└──────────┘│└──────────┘│            │            │                    │
│┌──────────┐│            │            │            │                    │
││Budget    ││            │            │            │                    │
││planning  ││            │            │            │                    │
│└──────────┘│            │            │            │                    │
└────────────┴────────────┴────────────┴────────────┴────────────────────┘
```

### Card Design

```
┌────────────────────┐
│ Research options   │  ← Title (truncate if long)
│                    │
│ Dec 28             │  ← Due date (red if overdue)
│ 👤 Hazel           │  ← Assignee avatar + name
│ ● Summer Camps     │  ← Project badge (color dot)
└────────────────────┘
```

### Behavior

- Drag cards between columns (updates status)
- Drag within column to reorder (manual sort)
- Click card opens detail panel
- Column counts update dynamically
- Done column shows limited recent items

---

## Screen 7: Task Detail (Modal - Implemented)

**Opens from:** Task list, kanban card, today view, inbox triage, etc.

**Implementation:** Using TaskModal (`components/modals/task-modal.tsx`) instead of side panel for better mobile experience.

### Layout (Current Implementation)

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
│ │ Look at Camp Widjiwagan, YMCA camps...         │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ Status          Priority        Due Date          │
│ [Active ▼]      [Medium ▼]      [📅 Dec 23]      │
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

### Current Features
- ✅ Title and description editing
- ✅ Status selector (inbox, active, waiting_for, done)
- ✅ Priority selector (low, medium, high)
- ✅ Due date picker (native input)
- ✅ Assigned to picker (FamilyMemberPicker)
- ✅ Project picker (ProjectPicker)
- ✅ Goal picker (GoalPicker)
- ✅ Keyboard shortcut (Cmd/Ctrl+Enter to save)
- ✅ Loading states during mutation
- ✅ Toast notifications

### Future Enhancements (Not Yet Built)
- Scheduled date (separate from due date)
- Place picker
- Related to picker (family member)
- Tags
- Recurrence settings
- Subtasks management
- Notes/comments section
- Created/updated metadata display
- More menu (duplicate, convert to someday, delete)

---

## Screen 8: Calendar

**URL:** `/calendar`

### Layout (Month View)

```
┌──────────────────────────────────────────────────────────┐
│ Calendar                                                 │
│                                                          │
│ [< Dec 2024 >]          [Month ▼] [Week] [Day]          │
│                                                          │
│ Show: [✓ Tasks] [✓ Meals] [✓ Milestones]                │
├──────────────────────────────────────────────────────────┤
│ Sun     Mon     Tue     Wed     Thu     Fri     Sat     │
├───────┬───────┬───────┬───────┬───────┬───────┬─────────┤
│  1    │  2    │  3    │  4    │  5    │  6    │   7     │
│       │●Task  │       │🍽️Taco│       │       │         │
│       │●Task  │       │       │       │       │         │
├───────┼───────┼───────┼───────┼───────┼───────┼─────────┤
│  8    │  9    │  10   │  11   │  12   │  13   │  14     │
│🎉Mile │       │       │       │●Task  │       │         │
│       │       │       │       │       │       │         │
├───────┼───────┼───────┼───────┼───────┼───────┼─────────┤
│ ...                                                      │
└──────────────────────────────────────────────────────────┘
```

### Day Cell Detail

```
┌───────────────┐
│ 23            │
│ ● Pay bill 🔴 │  ← Overdue task
│ ● Review camp │  ← Task due today
│ 🍽️ Tacos     │  ← Dinner
│ 🎂 Mom's bday │  ← Birthday
└───────────────┘
```

### Behavior

- Click day: shows day detail panel or navigates to day view
- Drag task to different day: updates due date
- Color dots match assignee colors
- Week view: more detail per day
- Day view: time-blocked if tasks have times

---

## Screen 9: Habits

**URL:** `/habits`

### Layout

```
┌──────────────────────────────────────────────────────────┐
│ Habits                                      [+ Habit]    │
│                                                          │
│ Filter: [Everyone ▼]                                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌────────────────────────────────────────────────────────┤
│ │ 📖 Read 20 min                                        │
│ │ Daily · Hazel                                         │
│ │                                                        │
│ │ 🔥 Current streak: 12 days                            │
│ │ 🏆 Best: 45 days                                      │
│ │                                                        │
│ │ [Mon][Tue][Wed][Thu][Fri][Sat][Sun]                   │
│ │  ✓    ✓    ✓    ✓    ✓    -    ○     ← This week     │
│ │                                                        │
│ │ Last 30 days:                                         │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓      ← Mini heatmap  │
│ └────────────────────────────────────────────────────────┤
│                                                          │
│ ┌────────────────────────────────────────────────────────┤
│ │ 🏃 Exercise                                           │
│ │ 3x per week · Hazel                                   │
│ │                                                        │
│ │ 🔥 Current streak: 2 weeks (target met)               │
│ │ 🏆 Best: 8 weeks                                      │
│ │                                                        │
│ │ This week: 2/3 ██░                                    │
│ └────────────────────────────────────────────────────────┤
│                                                          │
│ ┌────────────────────────────────────────────────────────┤
│ │ 💊 Vitamins                                           │
│ │ Daily · Miles                                         │
│ │                                                        │
│ │ 🔥 3 days · 🏆 21 days                                │
│ │ [ ] Today                                             │
│ └────────────────────────────────────────────────────────┤
└──────────────────────────────────────────────────────────┘
```

### Habit Card Interaction

- Click checkbox: logs today as done, streak animates up
- Click card body: opens habit detail for editing
- Heatmap clickable: shows that day's log

---

## Screen 10: Goals

**URL:** `/goals`

### Layout

```
┌──────────────────────────────────────────────────────────┐
│ Goals                                        [+ Goal]    │
│                                                          │
│ Filter: [Everyone ▼]  [Active ▼]                        │
│                                                          │
│ ┌─ Family Goals ─────────────────────────────────────────┤
│ │                                                        │
│ │ ┌────────────────────────────────────────────────────┐ │
│ │ │ 🏡 Pay off car                                     │ │
│ │ │                                                    │ │
│ │ │ $2,400 / $8,000                                    │ │
│ │ │ ████████░░░░░░░░░░░░ 30%                          │ │
│ │ │                                                    │ │
│ │ │ Target: Dec 2025                                   │ │
│ │ │ Status: On track ✓                                 │ │
│ │ └────────────────────────────────────────────────────┘ │
│ └────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─ Hazel's Goals ────────────────────────────────────────┤
│ │                                                        │
│ │ ┌────────────────────────────────────────────────────┐ │
│ │ │ 📚 Read 50 books                                   │ │
│ │ │ 42/50 · ████████████████░░░░ 84%                  │ │
│ │ │ Target: Dec 31 · On track ✓                        │ │
│ │ └────────────────────────────────────────────────────┘ │
│ │                                                        │
│ │ ┌────────────────────────────────────────────────────┐ │
│ │ │ 💴 Save $5K for Japan                              │ │
│ │ │ $3,200 / $5,000 · ████████████░░░░ 64%            │ │
│ │ │ Target: Jun 2025 · On track ✓                      │ │
│ │ │                                                    │ │
│ │ │ Supported by: "Save $50/week" habit                │ │
│ │ └────────────────────────────────────────────────────┘ │
│ └────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─ Miles's Goals ────────────────────────────────────────┤
│ │ ...                                                   │
│ └────────────────────────────────────────────────────────┤
└──────────────────────────────────────────────────────────┘
```

---

## Screen 11: Projects List

**URL:** `/projects`

### Layout

```
┌──────────────────────────────────────────────────────────┐
│ Projects                                   [+ Project]   │
│                                                          │
│ Filter: [Active ▼]  [Anyone ▼]                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐│
│ │ 🏕️ Summer Camps │ │ 🛁 Bathroom Reno│ │ 🗾 Japan Trip ││
│ │                 │ │                 │ │               ││
│ │ Planning        │ │ Active          │ │ Planning      ││
│ │ 👤 Hazel        │ │ 👤 Mike         │ │ 👤 Hazel      ││
│ │                 │ │                 │ │               ││
│ │ ████░░░░ 4/10   │ │ ██░░░░░░ 2/8    │ │ ░░░░░░░░ 0/3  ││
│ │                 │ │                 │ │               ││
│ │ Updated 2d ago  │ │ Updated today   │ │ Updated 1w ago││
│ └─────────────────┘ └─────────────────┘ └───────────────┘│
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Project Card

- Icon/emoji + Title
- Status badge
- Owner avatar
- Progress bar (tasks complete/total)
- Last updated

---

## Screen 12: Project Detail

**URL:** `/projects/[id]`

### Layout

```
┌──────────────────────────────────────────────────────────┐
│ ← Projects                                        [···]  │
├──────────────────────────────────────────────────────────┤
│ 🏕️ Summer Camps 2025                                     │
│                                                          │
│ Status: [Planning ▼]    Owner: [👤 Hazel ▼]             │
│ Target: March 1, 2025                                    │
│                                                          │
│ Progress: ████░░░░░░ 4/10 tasks                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [Tasks]  [Notes]  [Activity]                      tabs   │
│                                                          │
│ ─── Tasks ───────────────────────────────────────────────│
│                                              [+ Task]    │
│                                                          │
│ [ ] Research Camp Widjiwagan           Dec 28  Hazel    │
│ [ ] Research YMCA camps                Dec 28  Hazel    │
│ [ ] Get recommendations from parents   Dec 30  Mike     │
│ [ ] Compare costs                      Jan 5   Hazel    │
│ [✓] Email camps for brochures          Done             │
│ [✓] Create comparison spreadsheet      Done             │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ ─── Notes ───────────────────────────────────────────────│
│                                                          │
│ ## Research Notes                                        │
│                                                          │
│ ### Camp Widjiwagan                                      │
│ - 2 week sessions, $2,400                               │
│ - Ages 8-14                                             │
│ - Sarah's kids loved it                                 │
│                                                          │
│ ### YMCA Camp                                           │
│ - 1 week sessions, $800                                 │
│ - More flexible dates                                   │
│                                                          │
│ [Edit notes]                                            │
└──────────────────────────────────────────────────────────┘
```

---

## Screen 13: Family Meeting

**URL:** `/meeting`

### Layout (Meeting Mode)

```
┌──────────────────────────────────────────────────────────┐
│ 👥 Family Meeting                    Sunday, Dec 22     │
│                                                          │
│                              [End Meeting & Save Notes]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─ 1. Celebrate Wins! 🎉 ───────────────────────────────┐│
│ │                                                        ││
│ │  Zelda                                                ││
│ │  ├─ 📚 Finished her book report!                     ││
│ │  └─ 🎨 Art project selected for display              ││
│ │                                                        ││
│ │  Miles                                                ││
│ │  └─ ⚽ Scored first goal of the season!              ││
│ │                                                        ││
│ │  Hazel                                                ││
│ │  └─ 🚀 Launched the newsletter                       ││
│ │                                                        ││
│ │  Mike                                                 ││
│ │  └─ (No milestones this week)  [+ Add]               ││
│ │                                                        ││
│ │                                          [+ Add Win]  ││
│ └────────────────────────────────────────────────────────┘│
│                                                          │
│ ┌─ 2. Goal Check-in 🎯 ─────────────────────────────────┐│
│ │                                                        ││
│ │  Family: Pay off car     ████░░░░ $2,400/$8,000      ││
│ │  Hazel: Read 50 books    ████████ 42/50 ✓            ││
│ │  Miles: Practice piano   ██░░░░░░ 2 days this week   ││
│ │                                                        ││
│ │  [Update progress]                                    ││
│ └────────────────────────────────────────────────────────┘│
│                                                          │
│ ┌─ 3. Last Week's Action Items 📋 ──────────────────────┐│
│ │                                                        ││
│ │  [✓] Schedule dentist appointments - Hazel           ││
│ │  [✓] Fix leaky faucet - Mike                         ││
│ │  [ ] Research summer camps - Hazel (carried over)    ││
│ │                                                        ││
│ └────────────────────────────────────────────────────────┘│
│                                                          │
│ ┌─ 4. This Week Preview 📅 ─────────────────────────────┐│
│ │                                                        ││
│ │  Mon: Soccer practice                                 ││
│ │  Tue: Dentist (Miles, 3pm)                           ││
│ │  Wed: —                                               ││
│ │  Thu: School concert (Zelda)                         ││
│ │  Fri: Movie night! 🎬                                ││
│ │  Sat: Grandma's birthday party                       ││
│ │  Sun: —                                               ││
│ │                                                        ││
│ └────────────────────────────────────────────────────────┘│
│                                                          │
│ ┌─ 5. New Action Items ─────────────────────────────────┐│
│ │                                                        ││
│ │  ┌──────────────────────────────────────────────────┐ ││
│ │  │ + Add action item...                             │ ││
│ │  └──────────────────────────────────────────────────┘ ││
│ │                                                        ││
│ │  • Buy Grandma's gift        → Hazel    Due: Fri     ││
│ │  • Prep concert outfit       → Zelda    Due: Thu     ││
│ │                                                        ││
│ └────────────────────────────────────────────────────────┘│
│                                                          │
│ ┌─ 6. Notes & Decisions ────────────────────────────────┐│
│ │                                                        ││
│ │  ┌──────────────────────────────────────────────────┐ ││
│ │  │ Decided to do Camp Widjiwagan if spots available │ ││
│ │  │ Movie night vote: Home Alone won                 │ ││
│ │  └──────────────────────────────────────────────────┘ ││
│ └────────────────────────────────────────────────────────┘│
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

---

## 🚀 Implementation Status

> **Last Updated:** December 2024

### Screens Implementation

| Screen | Route | Status | Notes |
|--------|-------|--------|-------|
| Screen 0: Onboarding | `/onboarding` | ✅ Complete | Family setup for new users |
| G1: Navigation Sidebar | All `/` routes | ✅ Complete | Desktop sidebar with inbox badge |
| G2: Mobile Navigation | All `/` routes | 🔨 Pending | Using responsive sidebar |
| G3: Top Bar | All `/` routes | ✅ Complete | With user menu |
| G4: Quick Add Modal | Global | 🔨 Pending | Not yet implemented |
| G5: Search Modal | Global | 🔨 Pending | Not yet implemented |
| Screen 1: Family Dashboard | `/` | ✅ Complete | Stats cards, preview |
| Screen 2: Personal Dashboard | `/me` | 🔨 Pending | Not yet implemented |
| Screen 3: Inbox | `/inbox` | ✅ **Connected** | Full triage with all 5 modals |
| Screen 4: Today | `/today` | ✅ **Connected** | Daily focus, click task → TaskModal |
| Screen 5: Tasks List | `/tasks` | ✅ Complete | Full functionality + TaskModal |
| Screen 6: Tasks Kanban | `/tasks?view=kanban` | 🔨 Pending | View toggle pending |
| Screen 7: Task Detail | TaskModal | ✅ **Complete** | Modal form (not side panel) |
| Screen 8: Calendar | `/calendar` | 🔨 Pending | Not yet implemented |
| Screen 9: Habits | `/habits` | ✅ **Connected** | Full functionality + HabitModal |
| Screen 10: Goals | `/goals` | ✅ **Connected** | Goal tracking + GoalModal |
| Screen 11: Projects List | `/projects` | ✅ **Connected** | Cards + ProjectModal create/edit |
| Screen 12: Project Detail | `/projects/[id]` | 🔨 Pending | Not yet implemented |
| Screen 13: Family Meeting | `/meeting` | 🔨 Pending | Not yet implemented |
| Someday | `/someday` | ✅ **Connected** | Cards + SomedayModal create/edit |
| Family | `/family` | ✅ **Connected** | Members list, pending invites |
| Settings | `/settings` | ✅ Stub | UI with mock data |
| **Family Profile** | `/settings/family-profile` | 📋 Planned | See `15-profile-architecture.md` |
| **Member Profile** | `/settings/profile` | 📋 Planned | See `15-profile-architecture.md` |

### Modals Implementation

| Modal | File | Status | Notes |
|-------|------|--------|-------|
| TaskModal | `components/modals/task-modal.tsx` | ✅ Complete | Full create/edit with entity pickers |
| GoalModal | `components/modals/goal-modal.tsx` | ✅ Complete | Qualitative/quantitative goals |
| HabitModal | `components/modals/habit-modal.tsx` | ✅ Complete | Frequency, owner, goal linking |
| ProjectModal | `components/modals/project-modal.tsx` | ✅ Complete | Status, owner, target date, icon |
| SomedayModal | `components/modals/someday-modal.tsx` | ✅ Complete | Category, estimated cost |
| EventModal | `components/modals/event-modal.tsx` | ✅ Complete | Date/time pickers, location, assignee |

> **Note:** **"Connected"** screens are fully wired to Supabase with React Query hooks. "Stub" screens have UI scaffolding with mock data.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-23 | Hazel + Claude | Initial screens |
| 1.1 | 2024-12-23 | Claude | Auth screens updated to magic link (passwordless) |
| 1.2 | 2024-12-25 | Claude | Added implementation status section |
| 1.3 | 2024-12-25 | Claude | All core screens now connected to database |
| 1.4 | 2024-12-26 | Claude | Added onboarding screen for new user family setup |
| 1.5 | 2024-12-26 | Claude | Updated Task Detail to reflect TaskModal implementation (modal vs side panel) |
| 1.6 | 2024-12-26 | Claude | Updated Inbox wireframe with all triage options (Task/Goal/Habit/Project/Someday/Archive/Delete); added Modals Implementation table |
| 1.7 | 2024-12-26 | Claude | Added "Modal Connections" section to Dashboard documenting click-to-edit patterns for habits, goals, and tasks |
| 1.8 | 2024-12-26 | Claude | Added Family Profile and Member Profile screens to implementation table (planned); see `15-profile-architecture.md` for wireframes |
| 1.9 | 2024-12-27 | Claude | Updated Today page wireframe with birthday banner, events section, Add Event button; added EventModal to modals table |
