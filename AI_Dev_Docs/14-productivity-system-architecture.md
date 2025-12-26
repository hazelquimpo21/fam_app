# Fam — Productivity System Architecture

## Overview

This document defines how Fam's productivity entities (Tasks, Habits, Goals, Projects, Someday, Inbox) connect and flow together as a cohesive system. It introduces a **Unified Triage Inbox** concept and establishes clear mental models for users.

> **Design Philosophy:** Fam is a GTD-inspired family productivity system that captures everything, organizes into actionable buckets, and connects daily actions to meaningful outcomes.

---

## The Four Layers

Fam's productivity system operates on four conceptual layers:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        1. CAPTURE LAYER                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Universal Inbox                               │    │
│  │  "Get it out of your head and into the system"                  │    │
│  │  Quick capture → Triage later                                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              ↓ Triage                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                      2. COMMITMENT LAYER                                 │
│                                                                          │
│  ┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐   │
│  │   GOALS   │────▶│  PROJECTS │────▶│   TASKS   │     │  HABITS   │   │
│  │ (Outcomes)│     │(Containers)│     │ (Actions) │     │(Practices)│   │
│  └───────────┘     └───────────┘     └───────────┘     └───────────┘   │
│       │                 │                                    │          │
│       └─────────────────┴────────────────────────────────────┘          │
│                         supports goal                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                        3. DREAMS LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Someday/Maybe                                 │    │
│  │  Ideas not yet committed to. Can be promoted when ready.        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              ↓ Promote                                   │
│                         → Goal or Project                                │
├─────────────────────────────────────────────────────────────────────────┤
│                       4. REFERENCE LAYER                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐   │
│  │  People  │  │  Places  │  │ Vendors  │  │ Recipes  │  │Contacts │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └─────────┘   │
│                                                                          │
│  Supporting information that can be linked to productivity items         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Entity Relationships

### Core Entity Hierarchy

```
                    ┌─────────────┐
                    │    GOAL     │
                    │  (Outcome)  │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   HABIT     │ │   PROJECT   │ │    TASK     │
    │ (Practice)  │ │ (Container) │ │  (Action)   │
    └─────────────┘ └──────┬──────┘ └─────────────┘
                           │
                           │ contains
                           ▼
                    ┌─────────────┐
                    │   TASKS     │
                    │  (Actions)  │
                    └─────────────┘
```

### Relationship Rules

| From | To | Relationship | Notes |
|------|-----|--------------|-------|
| **Task** → Goal | supports | Task completion contributes to goal progress |
| **Task** → Project | belongs to | Tasks are organized within projects |
| **Habit** → Goal | supports | Consistent habit practice drives goal achievement |
| **Project** → Goal | supports | Project completion may satisfy a goal |
| **Someday** → Project | promotes to | Dreams become projects when ready |
| **Someday** → Goal | promotes to | Dreams can become goals directly |

### Practical Examples

```
GOAL: "Read 50 books this year"
├── HABIT: "Read 20 minutes daily" (supports goal)
├── TASK: "Join library" (supports goal)
└── TASK: "Set up reading nook" (supports goal)

GOAL: "Family trip to Japan"
└── PROJECT: "Japan Trip Planning"
    ├── TASK: "Research best season to visit"
    ├── TASK: "Get passports renewed"
    ├── TASK: "Book flights"
    └── TASK: "Create itinerary"
    (originally promoted from SOMEDAY: "Trip to Japan")

HABIT: "Exercise 3x/week" (standalone or linked to health goal)

PROJECT: "Bathroom Renovation" (standalone, no goal)
├── TASK: "Get quotes from contractors"
├── TASK: "Choose tile"
└── TASK: "Schedule plumber"
```

---

## The Unified Triage Inbox

### Current State

Currently, the inbox only handles tasks with `status = 'inbox'`. This creates friction because:
- Users capture everything as "tasks" even when they're really habits, goals, or dreams
- Processing requires re-categorizing items that were never tasks to begin with
- No way to quickly capture recipe ideas, contact info, etc.

### Proposed: Universal Capture

**Concept:** One place to dump anything, with smart triage to the right bucket.

```
┌────────────────────────────────────────────────────────────────────────┐
│                     UNIVERSAL INBOX                                     │
│                                                                         │
│  "Anything on your mind goes here first"                               │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  [Quick capture input...]                              [Add]    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  □ Call dentist about Miles checkup                              │   │
│  │  □ Trip idea: Visit Grand Canyon                                 │   │
│  │  □ Start meditating habit                                        │   │
│  │  □ Goal: Save $5k for emergency fund                            │   │
│  │  □ Recipe from Sarah - her lasagna                               │   │
│  │  □ Get John's phone number from Mike                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Triage Actions:                                                        │
│  [→ Task] [→ Habit] [→ Goal] [→ Someday] [→ Recipe] [→ Contact] [🗑️]  │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Triage Flow

```
Inbox Item
    │
    ├──→ "This is actionable and specific" → TASK
    │       └── Add: due date, assignee, project
    │
    ├──→ "This is something I want to do regularly" → HABIT
    │       └── Add: frequency, owner, linked goal
    │
    ├──→ "This is an outcome I want to achieve" → GOAL
    │       └── Add: target, deadline, owner
    │
    ├──→ "This is a dream for someday" → SOMEDAY
    │       └── Add: category (trip/purchase/experience/house/other)
    │
    ├──→ "This is a multi-step effort" → PROJECT
    │       └── Add: owner, status, target date
    │
    ├──→ "This is reference info" → LIBRARY (Contact/Recipe/Place/Vendor)
    │
    └──→ "This is junk" → DELETE
```

### Implementation Approach

**Option A: Keep inbox in tasks table (simpler)**
- Inbox items are still tasks with `status = 'inbox'`
- Triage converts them to proper entities as needed
- Works with current schema

**Option B: Separate inbox_items table (cleaner)**
- New table: `inbox_items` with minimal fields
- Triage creates new records in proper tables
- Cleaner separation but more migration

**Recommendation:** Option A for MVP, consider Option B later if needed.

---

## The Connection Model: Goals as the North Star

### Mental Model

**Goals are outcomes. Everything else supports getting there.**

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER'S MIND                                 │
│                                                                      │
│  "I want to be healthier"                          ← OUTCOME        │
│       ↓                                                              │
│  "I'll exercise regularly"                         ← PRACTICE       │
│       ↓                                                              │
│  "I need to set up my home gym"                   ← EFFORT          │
│       ↓                                                              │
│  "Today I'll research equipment"                   ← ACTION         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

                    Maps to Fam:

┌─────────────────────────────────────────────────────────────────────┐
│                          FAM SYSTEM                                  │
│                                                                      │
│  GOAL: "Get healthier - lose 15 lbs by June"      ← OUTCOME        │
│       │                                                              │
│       ├── HABIT: "Exercise 30 min daily"          ← PRACTICE       │
│       │                                                              │
│       └── PROJECT: "Set up home gym"              ← EFFORT         │
│               │                                                      │
│               └── TASK: "Research equipment"       ← ACTION         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Goal Progress Calculation

Goals can show progress from multiple sources:

```typescript
interface GoalProgress {
  // Direct progress (for quantitative goals)
  currentValue: number       // e.g., 42 books read
  targetValue: number        // e.g., 50 books target

  // Indirect progress indicators
  linkedHabits: {
    total: number            // e.g., 3 habits
    onTrack: number          // e.g., 2 habits with active streaks
    averageStreak: number    // e.g., 15 days average
  }

  linkedTasks: {
    total: number            // e.g., 10 tasks
    completed: number        // e.g., 6 done
  }

  linkedProjects: {
    total: number            // e.g., 1 project
    completed: number        // e.g., 0 done
    activeTaskProgress: number // e.g., 60% of project tasks done
  }

  // Overall status
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved' | 'abandoned'
}
```

---

## Views & Navigation

### Recommended Navigation Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  SIDEBAR                                                             │
│                                                                      │
│  ─── HOME ───                                                        │
│  🏠 Dashboard          Family overview, today at a glance            │
│  📥 Inbox (3)          Universal capture, things to triage          │
│  ☀️ Today              What needs attention right now               │
│                                                                      │
│  ─── PRODUCTIVITY ───                                                │
│  🎯 Goals              Outcomes we're working toward                 │
│  📁 Projects           Multi-step efforts                           │
│  ✓  Tasks              All actionable items                          │
│  🔄 Habits             Daily/weekly practices                        │
│  ✨ Someday            Dreams for the future                         │
│                                                                      │
│  ─── PLANNING ───                                                    │
│  📅 Calendar           Everything on a timeline                      │
│  👥 Family Meeting     Weekly check-in                               │
│  🍽️ Meals              Meal planning                                 │
│                                                                      │
│  ─── LIBRARY ───                                                     │
│  👤 People             Family, contacts, vendors                     │
│  📍 Places             Saved locations                               │
│  📖 Recipes            Recipe collection                             │
│                                                                      │
│  ─── SYSTEM ───                                                      │
│  ⚙️ Settings                                                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### View Purposes

| View | Purpose | Key Question Answered |
|------|---------|----------------------|
| **Dashboard** | Orientation | "What's the family status at a glance?" |
| **Inbox** | Capture & Triage | "What needs to be processed?" |
| **Today** | Focus | "What should I work on right now?" |
| **Goals** | Direction | "What are we trying to achieve?" |
| **Projects** | Organization | "What are our ongoing efforts?" |
| **Tasks** | Execution | "What are all the things to do?" |
| **Habits** | Consistency | "What practices are we building?" |
| **Someday** | Dreams | "What would we like to do eventually?" |
| **Calendar** | Time | "When is everything happening?" |
| **Family Meeting** | Coordination | "How do we sync as a family?" |

---

## The "Today" View: Daily Focus

### What Appears in Today

```
┌─────────────────────────────────────────────────────────────────────┐
│  TODAY                                    Thursday, Dec 26, 2024     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ⚠️ OVERDUE (2)                                          [Collapse]  │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ □ Pay water bill                               Due Dec 21  🔴   ││
│  │ □ Schedule dentist                             Due Dec 23  🔴   ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  🔄 TODAY'S HABITS                                       [Collapse]  │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ [✓] Read 20 min        🔥 12   [ ] Exercise      🔥 3          ││
│  │ [✓] Journal            🔥 46   [ ] Vitamins                     ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ✓ TODAY'S TASKS (5)                                     [Collapse]  │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ □ Review camp options           Due today    Hazel  📁 Camps   ││
│  │ □ Soccer practice pickup        3:30 PM      Mike               ││
│  │ □ Grocery run                   Due today    Hazel              ││
│  │ □ Miles homework help           Due today    Mike               ││
│  │ □ Family movie night prep       Due today    Zelda              ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  🍽️ TODAY'S MEALS                                        [Collapse]  │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Breakfast: Oatmeal                                              ││
│  │ Lunch: Leftovers                                                ││
│  │ Dinner: Tacos 🌮 (Mike cooking)                                 ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  🎯 GOAL CHECK-IN (optional)                             [Collapse]  │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Read 50 books           ████████████████░░░░ 84% (42/50)        ││
│  │ Save for Japan          ████████████░░░░░░░░ 64% ($3.2k/$5k)    ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Today Logic

```typescript
interface TodayData {
  // Tasks
  overdueTasks: Task[]        // due_date < today AND status not done
  todayTasks: Task[]          // due_date = today OR scheduled_date = today

  // Habits
  todayHabits: HabitWithLog[] // habits that apply today (based on frequency)

  // Meals
  todayMeals: Meal[]          // meals for today

  // Goals (optional section)
  activeGoals: Goal[]         // status = active, ordered by priority
}

// What makes a task appear in "Today"?
function shouldAppearInToday(task: Task, today: Date): boolean {
  // Already done? No
  if (task.status === 'done') return false

  // Overdue? Yes
  if (task.due_date && isBefore(task.due_date, today)) return true

  // Due today? Yes
  if (task.due_date && isSameDay(task.due_date, today)) return true

  // Scheduled for today? Yes
  if (task.scheduled_date && isSameDay(task.scheduled_date, today)) return true

  // Has start_date in future? No (not visible yet)
  if (task.start_date && isAfter(task.start_date, today)) return false

  return false
}
```

---

## Weekly Review / Triage Session

### Structured Processing Flow

The **Weekly Review** is a GTD-inspired ritual that ensures the system stays current.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WEEKLY REVIEW FLOW                                │
│                                                                      │
│  1. 📥 INBOX TO ZERO                                                 │
│     Process every item: Task / Habit / Goal / Someday / Delete      │
│                                                                      │
│  2. ✓ TASK TRIAGE                                                    │
│     Review active tasks:                                             │
│     - Still relevant? Keep or delete                                 │
│     - Blocked? Mark waiting_for                                      │
│     - Not happening soon? Move to someday                            │
│     - Need to delegate? Reassign                                     │
│                                                                      │
│  3. 📁 PROJECT REVIEW                                                │
│     For each active project:                                         │
│     - What's the next action? Create task if missing                 │
│     - Stalled? Consider on_hold or close                             │
│     - Complete? Celebrate and archive                                │
│                                                                      │
│  4. 🎯 GOAL CHECK                                                    │
│     For each active goal:                                            │
│     - Update progress                                                │
│     - Still motivated? Keep or reconsider                            │
│     - Need new habits/tasks to support?                              │
│                                                                      │
│  5. 🔄 HABIT REVIEW                                                  │
│     - Any habits to retire?                                          │
│     - Any new habits to start?                                       │
│     - Adjust frequencies if needed                                   │
│                                                                      │
│  6. ✨ SOMEDAY SCAN                                                  │
│     Quick scan of someday list:                                      │
│     - Ready to commit? Promote to project/goal                       │
│     - No longer interested? Archive                                  │
│                                                                      │
│  7. 📅 WEEK AHEAD                                                    │
│     Preview next 7 days:                                             │
│     - Any tasks that need scheduling?                                │
│     - Any conflicts or over-commitments?                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Status Workflows

### Task Status Flow

```
                    ┌──────────┐
      Quick Add ───▶│  INBOX   │
                    └────┬─────┘
                         │ Triage
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌─────────┐    ┌──────────┐    ┌──────────┐
    │ ACTIVE  │◀──▶│ WAITING  │    │ SOMEDAY  │
    │         │    │   FOR    │    │          │
    └────┬────┘    └──────────┘    └──────────┘
         │                               │
         │ Complete                      │ Promote
         ▼                               ▼
    ┌─────────┐                    ┌──────────┐
    │  DONE   │                    │  ACTIVE  │
    └─────────┘                    └──────────┘
```

### Project Status Flow

```
    ┌───────────┐
    │ PLANNING  │ ←── Initial state
    └─────┬─────┘
          │ Ready to start
          ▼
    ┌───────────┐     ┌───────────┐
    │  ACTIVE   │◀───▶│  ON HOLD  │
    └─────┬─────┘     └───────────┘
          │ All tasks done
          ▼
    ┌───────────┐
    │ COMPLETED │
    └─────┬─────┘
          │ Archive
          ▼
    ┌───────────┐
    │ ARCHIVED  │
    └───────────┘
```

### Goal Status Flow

```
    ┌───────────┐
    │  ACTIVE   │ ←── Initial state
    └─────┬─────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌─────────┐ ┌───────────┐
│ACHIEVED │ │ ABANDONED │
│   🎉    │ │           │
└─────────┘ └───────────┘
```

---

## Smart Features (Future)

### Auto-Suggestions

Based on captured text, suggest the right bucket:

```typescript
function suggestBucket(text: string): SuggestedBucket {
  const lower = text.toLowerCase()

  // Goal patterns
  if (lower.includes('want to') || lower.includes('goal:') ||
      lower.match(/save \$|lose .* pounds|read .* books/)) {
    return { type: 'goal', confidence: 0.8 }
  }

  // Habit patterns
  if (lower.includes('daily') || lower.includes('every day') ||
      lower.includes('habit') || lower.includes('start doing')) {
    return { type: 'habit', confidence: 0.7 }
  }

  // Someday patterns
  if (lower.includes('someday') || lower.includes('trip to') ||
      lower.includes('would be nice') || lower.includes('bucket list')) {
    return { type: 'someday', confidence: 0.7 }
  }

  // Default to task
  return { type: 'task', confidence: 0.5 }
}
```

### Natural Language Processing (Future)

Parse dates and assignments from text:
- "Call dentist tomorrow" → Task due tomorrow
- "Hazel: buy groceries" → Task assigned to Hazel
- "Every Monday: take out trash" → Recurring task or habit

---

## Implementation Priority

### Phase 1: Foundation (Current State)
- [x] Tasks with status workflow
- [x] Habits with streaks
- [x] Goals with progress
- [x] Projects as containers
- [x] Someday items
- [x] Basic inbox (tasks only)

### Phase 2: Enhanced Inbox (Next)
- [ ] Triage actions for all entity types
- [ ] "Process All" focused mode
- [ ] Keyboard shortcuts for triage
- [ ] Badge count on inbox

### Phase 3: Connections
- [ ] Goal progress from linked habits/tasks
- [ ] Project progress visualization
- [ ] "Supports Goal" picker on tasks/habits
- [ ] Backlinks (show what supports a goal)

### Phase 4: Weekly Review
- [ ] Guided weekly review flow
- [ ] Stale task detection
- [ ] Orphan project detection (projects with no tasks)
- [ ] Someday promotion prompts

### Phase 5: Smart Features
- [ ] Auto-suggest bucket from text
- [ ] Natural language date parsing
- [ ] Smart defaults based on context

---

## UI Component Implications

### New/Updated Components Needed

| Component | Purpose | Priority |
|-----------|---------|----------|
| `InboxItem` | Captures with triage actions | High |
| `TriageActions` | Quick buttons for processing | High |
| `GoalProgress` | Shows goal + linked items | Medium |
| `EntityPicker` | Select goal/project to link | Medium |
| `WeeklyReview` | Guided review flow | Low |
| `QuickCapture` | Universal add modal | High |

### Data Requirements

```typescript
// Enhanced inbox query
interface InboxView {
  items: Task[]  // status = 'inbox'
  count: number
}

// Goal with connections
interface GoalWithConnections extends Goal {
  linkedHabits: Habit[]
  linkedTasks: Task[]
  linkedProjects: Project[]
  calculatedProgress: number  // 0-100
  status: 'on_track' | 'at_risk' | 'behind'
}

// Today view aggregation
interface TodayView {
  overdue: Task[]
  todayTasks: Task[]
  todayHabits: HabitWithTodayStatus[]
  todayMeals: Meal[]
  activeGoals: GoalWithProgress[]
}
```

---

## Database Changes Required

### No Schema Changes Needed

The current schema already supports all relationships:
- `tasks.goal_id` → links task to goal
- `habits.goal_id` → links habit to goal
- `tasks.project_id` → links task to project
- `projects.promoted_from_id` → links to someday item

### Possible Enhancements

```sql
-- Optional: Add goal_id to projects for direct goal support
ALTER TABLE projects ADD COLUMN goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;

-- Optional: Separate inbox table (if Option B chosen)
CREATE TABLE inbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  content TEXT NOT NULL,
  captured_by UUID REFERENCES family_members(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_to_type TEXT,  -- 'task', 'habit', 'goal', etc.
  processed_to_id UUID
);
```

---

## Summary: The Fam Productivity Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   CAPTURE → TRIAGE → COMMIT → ACT → REVIEW                          │
│                                                                      │
│   ┌─────┐    ┌─────┐    ┌─────────────────────────┐    ┌─────┐     │
│   │Inbox│───▶│Sort │───▶│ Goals / Projects /      │───▶│Done │     │
│   │     │    │     │    │ Tasks / Habits          │    │     │     │
│   └─────┘    └─────┘    └─────────────────────────┘    └─────┘     │
│                              │                                       │
│                              │ Weekly Review                         │
│                              ▼                                       │
│                         ┌─────────┐                                  │
│                         │ Refine  │                                  │
│                         └─────────┘                                  │
│                                                                      │
│   Key Principles:                                                    │
│   1. Capture everything - get it out of your head                   │
│   2. Process regularly - nothing stays in inbox forever             │
│   3. Connect to outcomes - tasks support goals                      │
│   4. Review weekly - keep the system current                        │
│   5. Celebrate wins - track milestones                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-26 | Hazel + Claude | Initial productivity system architecture |
