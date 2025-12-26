# Fam — Glossary

## Overview

This glossary defines all domain terms used in Fam. Use consistent terminology across code, UI, and documentation.

---

## Core Entities

### Family
The top-level container. All data belongs to a family. A family represents a household unit—typically 2-6 people.

**Database:** `families` table  
**Key fields:** `id`, `name`, `settings`

### Family Member
A person within a family. Links to Supabase Auth for login credentials (via magic link—no passwords stored). Has a role (owner, adult, or kid) that determines permissions.

**Database:** `family_members` table  
**Key fields:** `id`, `name`, `email`, `role`, `color`, `auth_user_id`

---

## Task Management

### Task
A one-time item of work that can be completed. The fundamental unit of productivity in Fam.

**Database:** `tasks` table  
**Key fields:** `id`, `title`, `status`, `due_date`, `scheduled_date`, `assigned_to_id`

**Not to be confused with:** Habit (ongoing), Goal (outcome), Project (container)

### Subtask
A simple checklist item within a task. No dates or assignments—just a title and checkbox.

**Database:** `subtasks` table  
**Key fields:** `id`, `task_id`, `title`, `is_complete`

### Task Status
The current state of a task:

| Status | Meaning | Example |
|--------|---------|---------|
| `inbox` | Captured but not processed | "Call dentist" (just typed in quick add) |
| `active` | Ready to be worked on | "Research summer camps" (with due date, ready to do) |
| `waiting_for` | Blocked on someone/something | "Waiting for callback from plumber" |
| `someday` | Maybe later, not committed | "Learn to play guitar" |
| `done` | Completed | "Paid electric bill" ✓ |

### Due Date
When a task **must** be completed by. Missing this date makes the task overdue.

**Field:** `tasks.due_date` (DATE)

### Scheduled Date
When you **plan** to work on a task. A soft commitment, not a deadline.

**Field:** `tasks.scheduled_date` (DATE)

### Start Date
When a task becomes relevant. Tasks with future start dates are hidden until that date.

**Field:** `tasks.start_date` (DATE)

**Example:** "Book summer camp" with start date March 1 won't clutter Today view until March.

### Recurrence
A pattern for repeating tasks automatically. When a recurring task is completed, the next instance is generated.

**Key fields:** `is_recurring`, `recurrence_frequency`, `recurrence_interval`, `recurrence_parent_id`

### Inbox
The landing zone for quick captures. Items in inbox haven't been processed (given due dates, assigned, etc.).

**Implementation:** Tasks with `status = 'inbox'`

### Inbox Zero
The goal state where all inbox items have been processed. Celebrated with a happy empty state.

---

## Goals & Habits

### Goal
An outcome you're working toward with a clear definition of done. Has a target (qualitative or quantitative) and a deadline.

**Database:** `goals` table  
**Key fields:** `id`, `title`, `definition_of_done`, `target_value`, `current_value`, `target_date`

**Examples:**
- "Read 50 books" (quantitative: 50 books by Dec 31)
- "Run a 5K" (qualitative: done when you cross finish line)

### Habit
An ongoing practice you track for consistency. Has no end state—success is measured by streak and frequency.

**Database:** `habits` table  
**Key fields:** `id`, `title`, `frequency`, `current_streak`, `owner_id`

**Examples:**
- "Exercise" (3x per week)
- "Read 20 minutes" (daily)
- "Take vitamins" (daily)

**Not to be confused with:** Recurring Task (finite work item), Goal (has an end)

### Streak
Consecutive days/weeks of completing a habit. A key motivational metric.

**Fields:** `habits.current_streak`, `habits.longest_streak`

### Habit Log
A single check-in for a habit on a specific date.

**Database:** `habit_logs` table  
**Statuses:** `done`, `skipped`, `missed`

---

## Projects & Planning

### Project
A container for related tasks, notes, and resources. Represents a complex effort with multiple steps.

**Database:** `projects` table  
**Key fields:** `id`, `title`, `status`, `owner_id`

**Examples:**
- "Summer Camp Planning 2025"
- "Bathroom Renovation"
- "Japan Trip"

### Project Status

| Status | Meaning |
|--------|---------|
| `planning` | Still defining scope, not actively working |
| `active` | Currently being worked on |
| `on_hold` | Paused temporarily |
| `completed` | All tasks done, goals achieved |
| `archived` | No longer relevant, kept for reference |

### Someday Item
A dream, wish, or idea for the future. Not committed to yet. Lives on categorized lists until promoted to a project.

**Database:** `someday_items` table  
**Categories:** `trip`, `purchase`, `experience`, `house`, `other`

**Example:** "Trip to Japan" sits in Someday > Trips until you decide to make it happen.

### Promote
Converting a someday item into an active project. The dream becomes a plan.

---

## Milestones & Celebrations

### Milestone
A noteworthy achievement or win worth celebrating. Shared during family meetings.

**Database:** `milestones` table  
**Key fields:** `id`, `title`, `person_id`, `occurred_at`

**Examples:**
- "Zelda finished her book report"
- "Miles scored his first goal"
- "Hazel launched newsletter"

**Not to be confused with:** Task completion (routine), Goal achievement (can generate milestone)

---

## People & Libraries

### Contact
A person outside the immediate family—friends, extended family, acquaintances.

**Database:** `contacts` table  
**Types:** `family` (extended), `friend`, `other`

### Vendor
A service provider your family uses.

**Database:** `vendors` table  
**Categories:** `medical`, `dental`, `home`, `auto`, `financial`, `legal`, `childcare`, `pet`, `other`

**Examples:**
- Dr. Patterson (pediatrician)
- Joe's Plumbing
- State Farm (insurance)

### Place
A location saved for reference.

**Database:** `places` table  
**Categories:** `restaurant`, `medical`, `school`, `activity`, `travel`, `shopping`, `service`, `other`

**Examples:**
- Shorewood Family Dental (medical)
- Kopp's Custard (restaurant)
- Camp Widjiwagan (activity)

---

## Meal Planning

### Recipe
A saved recipe with ingredients and instructions.

**Database:** `recipes` table  
**Key fields:** `id`, `title`, `ingredients`, `instructions`, `meal_type`

### Meal
A planned meal for a specific date.

**Database:** `meals` table  
**Key fields:** `id`, `meal_date`, `meal_type`, `recipe_id`, `assigned_to_id`

### Meal Type
The time of day for a meal:
- `breakfast`
- `lunch`
- `dinner`
- `snack`

---

## Family Meeting

### Family Meeting
A weekly structured check-in where the family reviews wins, goals, and plans. Inspired by EOS Level 10 meetings.

**Sections:**
1. Celebrate Wins (milestones)
2. Goal Check-in
3. Review Last Week's Items
4. Preview Upcoming Week
5. Create New Action Items
6. Notes & Decisions

### Action Item
A task created during a family meeting as a result of discussion.

**Implementation:** Regular task with context that it came from a meeting.

### Meeting Notes
Free-form notes and decisions recorded during a family meeting.

**Database:** `meeting_notes` table

---

## Roles & Permissions

### Owner
The family member who created the family. Has full administrative access—can invite/remove members, change settings, delete family.

**Field:** `family_members.role = 'owner'`

### Adult
A family member with full feature access but limited admin capabilities. Cannot invite members or change family settings.

**Field:** `family_members.role = 'adult'`

### Kid
A family member with restricted access. Can view family data, complete assigned tasks, log habits, add milestones. Cannot delete content or access settings.

**Field:** `family_members.role = 'kid'`

---

## Profiles & Personalization

*(See `AI_Dev_Docs/15-profile-architecture.md` for full spec)*

### Family Profile
Rich information about the family as a unit—identity, values, traditions, household context, and AI preferences. Stored as JSONB in `families.profile`.

**Key sections:** Identity (nickname, motto), Values, Traditions, Household, Shared Interests, AI Preferences

### Member Profile
Personalized information about an individual family member—personality, interests, health/dietary, communication preferences. Stored as JSONB in `family_members.profile`.

**Key sections:** Personality, Strengths, Motivation (love language), Interests, Health/Dietary, Communication Preferences

### Tradition
A recurring family ritual or practice (e.g., "Friday Movie Night", "Summer Camping Trip"). Part of the family profile.

**Frequencies:** weekly, monthly, yearly, special

### Chronotype
Whether someone is a morning person, night owl, or flexible. Used for suggesting optimal times for habits and tasks.

**Values:** `morning`, `night`, `flexible`

### Love Language
How a family member prefers to give and receive appreciation. Used for personalizing celebration messages.

**Values:** `words` (Words of Affirmation), `acts` (Acts of Service), `gifts`, `time` (Quality Time), `touch` (Physical Touch)

### AI Tone
The preferred communication style for AI-generated content.

**Values:** `encouraging`, `direct`, `playful`, `minimal`

### Progressive Profile Collection
The strategy of gathering profile information gradually over time through contextual prompts rather than one long form. Makes profile-building feel like a scrapbook, not a government form.

---

## UI Concepts

### Dashboard
The main landing page showing an overview of relevant data.

**Types:**
- **Family Dashboard:** Today at a glance for the whole family
- **Personal Dashboard:** My tasks, habits, goals

### Quick Add
A keyboard-shortcut-accessible modal for rapid capture. Cmd/Ctrl + K or the [+] button.

### Side Panel
A slide-in panel showing details without navigating away from the list. Used for task details, editing, etc.

### Kanban
A column-based view showing tasks organized by status. Drag to move between columns.

### Empty State
The UI shown when a list has no items. Should be friendly and include a call to action.

### Skeleton
A placeholder UI shown while data is loading. Mimics the shape of real content.

---

## Technical Terms

### Soft Delete
Marking a record as deleted without removing it from the database. Uses `deleted_at` timestamp. Allows undo and recovery.

### Row Level Security (RLS)
Supabase feature ensuring users can only access their own family's data at the database level.

### Optimistic Update
Updating the UI immediately before the server confirms the change. Provides instant feedback. Rolls back if server fails.

### Query Key
A unique identifier for cached data in TanStack Query. Used to invalidate and refetch data.

### Realtime Subscription
A WebSocket connection that pushes database changes to the client immediately.

---

## Abbreviations

| Abbrev | Meaning |
|--------|---------|
| RLS | Row Level Security |
| UUID | Universally Unique Identifier |
| CRUD | Create, Read, Update, Delete |
| DST | Daylight Saving Time |
| UTC | Coordinated Universal Time |
| EOS | Entrepreneurial Operating System |
| GTD | Getting Things Done |
| OKR | Objectives and Key Results |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-23 | Hazel + Claude | Initial glossary |
| 1.1 | 2024-12-23 | Claude | Added magic link auth clarification |
| 1.2 | 2024-12-26 | Claude | Added Profiles & Personalization section (Family Profile, Member Profile, Tradition, Chronotype, Love Language, AI Tone, Progressive Profile Collection) |
