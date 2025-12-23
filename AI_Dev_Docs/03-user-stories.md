# Fam — User Stories & Acceptance Criteria

## Overview

User stories organized by feature area. Each story follows the format:
> **As a** [persona], **I want** [action], **so that** [benefit].

Priority uses MoSCoW: **M**ust have, **S**hould have, **C**ould have, **W**on't have (this release).

---

## Epic 1: Authentication & Onboarding

### US-1.1: Sign Up (Magic Link)
**Priority:** Must

> **As a** new user, **I want** to create an account with just my email, **so that** I can start using Fam without remembering a password.

**Acceptance Criteria:**
- [x] User can sign up with email only (passwordless)
- [x] Magic link is sent to email
- [x] User sees "Check your email" confirmation page
- [ ] User is prompted to create or join a family after clicking magic link
- [x] Error messages are clear and helpful
- [x] Magic link expires in 1 hour

### US-1.2: Sign In (Magic Link)
**Priority:** Must

> **As a** returning user, **I want** to sign in with just my email, **so that** I can access my family's data without remembering a password.

**Acceptance Criteria:**
- [x] User can sign in with email only (passwordless)
- [x] Magic link is sent to email
- [x] User sees "Check your email" confirmation page
- [x] Session persists across browser sessions
- [x] User is redirected to their family dashboard after clicking magic link

### US-1.3: Create Family
**Priority:** Must

> **As a** new user, **I want** to create a family, **so that** I have a space for my household.

**Acceptance Criteria:**
- [ ] User can enter family name
- [ ] User becomes the family "owner" role
- [ ] User is prompted to set up their own profile
- [ ] Family is created with default settings (timezone auto-detected)

### US-1.4: Invite Family Members
**Priority:** Must

> **As a** family owner, **I want** to invite other people to my family, **so that** we can collaborate.

**Acceptance Criteria:**
- [ ] Owner can invite by email
- [ ] Invitee receives email with join link
- [ ] Owner can specify role (adult/kid) for invitee
- [ ] Invitee creates account and is added to family
- [ ] Owner can see pending invitations

### US-1.5: Join Existing Family
**Priority:** Must

> **As an** invited person, **I want** to join an existing family, **so that** I don't have to create a new one.

**Acceptance Criteria:**
- [ ] Clicking invite link takes user to join flow
- [ ] User creates account or signs in
- [ ] User is added to family with assigned role
- [ ] User sees family dashboard

### US-1.6: Create Family Member Without Account
**Priority:** Should

> **As a** parent, **I want** to create profiles for my kids without needing email accounts, **so that** I can track their tasks and habits.

**Acceptance Criteria:**
- [ ] Adult can create a family member without auth_user_id
- [ ] Kid profile has name, birthday, color, avatar
- [ ] Adult can later "activate" the profile by linking to an account
- [ ] Non-activated profiles can still have tasks assigned

---

## Epic 2: Inbox & Quick Capture

### US-2.1: Quick Add
**Priority:** Must

> **As a** user, **I want** to quickly capture a thought, **so that** I don't lose it while doing other things.

**Acceptance Criteria:**
- [ ] Floating "+" button visible on all screens
- [ ] Keyboard shortcut (Cmd/Ctrl + K) opens quick add
- [ ] Single text field for input
- [ ] Pressing Enter saves to inbox
- [ ] Item appears in inbox within 500ms
- [ ] Can optionally set type (task/note/someday) at capture

### US-2.2: View Inbox
**Priority:** Must

> **As a** user, **I want** to see all my captured items, **so that** I can process them later.

**Acceptance Criteria:**
- [ ] Inbox shows all items with status = 'inbox'
- [ ] Items show title, created date
- [ ] Badge count shows in navigation
- [ ] Empty state is encouraging, not scolding

### US-2.3: Process Inbox Item
**Priority:** Must

> **As a** user, **I want** to process an inbox item into the right place, **so that** I keep my system organized.

**Acceptance Criteria:**
- [ ] Can convert to task (opens task form)
- [ ] Can convert to someday item (picks category)
- [ ] Can add to project
- [ ] Can delete
- [ ] Keyboard shortcuts for quick processing (T for task, D for delete, etc.)
- [ ] After processing, next item is focused

### US-2.4: Bulk Process Inbox
**Priority:** Should

> **As the** organizer, **I want** to quickly process multiple inbox items, **so that** I can get to inbox zero efficiently.

**Acceptance Criteria:**
- [ ] Can select multiple items
- [ ] Bulk delete
- [ ] Bulk move to project
- [ ] Processing mode that auto-advances after each action

---

## Epic 3: Tasks

### US-3.1: Create Task
**Priority:** Must

> **As a** user, **I want** to create a task with details, **so that** I know exactly what needs to be done.

**Acceptance Criteria:**
- [ ] Can set: title (required), description, due date, scheduled date, start date
- [ ] Can assign to family member
- [ ] Can set priority (none, low, medium, high)
- [ ] Can add to project
- [ ] Can link to goal
- [ ] Can add tags
- [ ] Task saves and appears in appropriate lists

### US-3.2: View Tasks List
**Priority:** Must

> **As a** user, **I want** to see my tasks in a list, **so that** I know what needs to be done.

**Acceptance Criteria:**
- [ ] List shows: checkbox, title, due date, assignee avatar, project badge
- [ ] Overdue tasks highlighted
- [ ] Can filter by: status, assignee, project, due date range
- [ ] Can sort by: due date, priority, created date
- [ ] Completed tasks hidden by default, toggle to show
- [ ] Click task to open detail panel

### US-3.3: View Tasks Kanban
**Priority:** Should

> **As a** visual thinker, **I want** to see tasks on a kanban board, **so that** I can understand status at a glance.

**Acceptance Criteria:**
- [ ] Columns: Backlog, Up Next, In Progress, Waiting For, Done
- [ ] Cards show: title, due date, assignee avatar
- [ ] Drag cards between columns (updates status)
- [ ] Can filter by project or assignee
- [ ] Cards are color-coded by priority or project

### US-3.4: Complete Task
**Priority:** Must

> **As a** user, **I want** to mark a task done, **so that** I can track my progress.

**Acceptance Criteria:**
- [ ] Clicking checkbox completes task
- [ ] Satisfying animation/feedback
- [ ] completed_at timestamp set
- [ ] Task moves to Done status
- [ ] If recurring: next instance is generated

### US-3.5: Set Task Recurrence
**Priority:** Must

> **As a** user, **I want** to set a task to repeat, **so that** I don't have to recreate it every time.

**Acceptance Criteria:**
- [ ] Can set frequency: daily, weekly, biweekly, monthly, quarterly, yearly
- [ ] Can set interval (every 2 weeks, every 3 months)
- [ ] For weekly: can pick days of week
- [ ] Can set end date (or never)
- [ ] When completed, next instance auto-creates
- [ ] Parent task preserved as template

### US-3.6: Mark Task Waiting For
**Priority:** Should

> **As a** user, **I want** to mark a task as waiting for someone/something, **so that** I remember to follow up.

**Acceptance Criteria:**
- [ ] Status changes to 'waiting_for'
- [ ] Can specify who/what we're waiting for (text)
- [ ] Task appears in "Waiting For" filter/view
- [ ] Task removed from active lists

### US-3.7: Add Subtasks
**Priority:** Should

> **As a** user, **I want** to break a task into subtasks, **so that** I can track granular progress.

**Acceptance Criteria:**
- [ ] Can add multiple subtasks to a task
- [ ] Subtasks have: title, checkbox
- [ ] Can reorder subtasks (drag)
- [ ] Parent task shows subtask progress (3/5 complete)
- [ ] Checking all subtasks doesn't auto-complete parent

### US-3.8: View Today's Tasks
**Priority:** Must

> **As a** user, **I want** a focused view of today's tasks, **so that** I know what to work on now.

**Acceptance Criteria:**
- [ ] Shows tasks due today or scheduled for today
- [ ] Shows overdue tasks
- [ ] Grouped by: Overdue, Morning, Afternoon, Evening (or just Today/Overdue)
- [ ] Shows today's habits inline
- [ ] Shows today's meals

---

## Epic 4: Habits

### US-4.1: Create Habit
**Priority:** Must

> **As a** user, **I want** to create a habit to track, **so that** I can build consistent practices.

**Acceptance Criteria:**
- [ ] Can set: title, description, frequency
- [ ] Frequency options: daily, X times per week, specific days
- [ ] Can assign owner (defaults to self)
- [ ] Can link to goal
- [ ] Habit appears in daily view

### US-4.2: Check Off Habit
**Priority:** Must

> **As a** user, **I want** to log my habit completion, **so that** I can see my streak.

**Acceptance Criteria:**
- [ ] Checkbox or tap to mark done for today
- [ ] Can mark as skipped (doesn't break streak)
- [ ] Streak count updates immediately
- [ ] Satisfying animation for streak milestones (7, 30, 100)

### US-4.3: View Habit Streaks
**Priority:** Must

> **As a** user, **I want** to see my streak and history, **so that** I stay motivated.

**Acceptance Criteria:**
- [ ] Current streak shown prominently
- [ ] Longest streak shown
- [ ] Mini calendar/heatmap of last 30 days
- [ ] Can click to see full history

### US-4.4: View All Habits
**Priority:** Must

> **As a** user, **I want** to see all my habits, **so that** I can manage them.

**Acceptance Criteria:**
- [ ] List shows: habit name, owner, frequency, current streak
- [ ] Filter by owner
- [ ] Can toggle inactive habits
- [ ] Click to edit

---

## Epic 5: Goals

### US-5.1: Create Goal
**Priority:** Must

> **As a** user, **I want** to set a goal, **so that** I have something to work toward.

**Acceptance Criteria:**
- [ ] Can set: title, description, definition of done
- [ ] Can set as qualitative (done/not done) or quantitative (target number)
- [ ] For quantitative: set target, unit, current value
- [ ] Can assign owner or mark as family goal
- [ ] Can set target date
- [ ] Can link habits that support this goal

### US-5.2: View Goal Progress
**Priority:** Must

> **As a** user, **I want** to see my progress toward goals, **so that** I know if I'm on track.

**Acceptance Criteria:**
- [ ] Progress bar or fraction for quantitative goals
- [ ] Linked habits shown with their streaks
- [ ] Linked tasks shown (completed/total)
- [ ] Status indicator: on track, at risk, behind

### US-5.3: Update Goal Progress
**Priority:** Must

> **As a** user, **I want** to update my goal progress, **so that** it reflects reality.

**Acceptance Criteria:**
- [ ] For quantitative: can update current_value
- [ ] Can add notes on update
- [ ] History of updates visible
- [ ] Can mark goal as achieved (celebration!)

### US-5.4: View All Goals
**Priority:** Must

> **As a** user, **I want** to see all goals, **so that** I can review and prioritize.

**Acceptance Criteria:**
- [ ] Cards/list showing: title, owner, progress, target date
- [ ] Filter by: owner, status, family vs personal
- [ ] Group by timeframe (this quarter, this year)

---

## Epic 6: Projects

### US-6.1: Create Project
**Priority:** Must

> **As a** user, **I want** to create a project, **so that** I can group related tasks and information.

**Acceptance Criteria:**
- [ ] Can set: title, description, status, target date
- [ ] Can assign owner
- [ ] Can choose color/icon
- [ ] Project created in 'planning' status

### US-6.2: View Project Detail
**Priority:** Must

> **As a** user, **I want** to see all project details in one place, **so that** I have full context.

**Acceptance Criteria:**
- [ ] Header with title, status, owner, progress
- [ ] Tasks section (filterable, can add new)
- [ ] Notes section (rich text editor)
- [ ] Activity log showing recent changes

### US-6.3: Add Task to Project
**Priority:** Must

> **As a** user, **I want** to add tasks to a project, **so that** work is organized.

**Acceptance Criteria:**
- [ ] Quick-add task from within project view
- [ ] Existing tasks can be moved into project
- [ ] Task shows project badge in all views

### US-6.4: View All Projects
**Priority:** Must

> **As a** user, **I want** to see all projects, **so that** I can navigate to the right one.

**Acceptance Criteria:**
- [ ] Grid/list of project cards
- [ ] Cards show: title, status, owner, task progress, last updated
- [ ] Filter by: status, owner
- [ ] Quick status indicator (on track, stalled, etc.)

### US-6.5: Complete Project
**Priority:** Should

> **As a** user, **I want** to mark a project complete, **so that** I can celebrate and archive it.

**Acceptance Criteria:**
- [ ] Can mark as completed
- [ ] Celebration moment!
- [ ] Completed projects move to archive
- [ ] Can still view archived projects

---

## Epic 7: Someday / Wishlist

### US-7.1: Add Someday Item
**Priority:** Must

> **As a** dreamer, **I want** to capture a someday idea, **so that** wishes don't get lost.

**Acceptance Criteria:**
- [ ] Can set: title, description, category
- [ ] Categories: trip, purchase, experience, house, other
- [ ] Can set estimated cost (optional)
- [ ] Can link to place (optional)
- [ ] Records who added it

### US-7.2: View Someday Lists
**Priority:** Must

> **As a** user, **I want** to browse someday items by category, **so that** I can dream and plan.

**Acceptance Criteria:**
- [ ] Tabs or sidebar for categories
- [ ] Cards show: title, added by, estimated cost
- [ ] Can sort by: date added, cost
- [ ] Visually distinct from active tasks (dreamy!)

### US-7.3: Promote to Project
**Priority:** Should

> **As a** planner, **I want** to turn a someday item into a project, **so that** I can start making it happen.

**Acceptance Criteria:**
- [ ] "Make it happen" action creates project
- [ ] Someday item links to new project
- [ ] Project pre-filled with someday title/description
- [ ] Someday item marked as promoted

---

## Epic 8: Milestones

### US-8.1: Add Milestone
**Priority:** Must

> **As a** family member, **I want** to record a win or achievement, **so that** we can celebrate at family meeting.

**Acceptance Criteria:**
- [ ] Can set: title, description, date, person
- [ ] Person defaults to self
- [ ] Date defaults to today
- [ ] Can optionally link to goal
- [ ] Saved milestone appears in meeting view

### US-8.2: View Milestones
**Priority:** Must

> **As a** family, **I want** to see this week's milestones, **so that** we can celebrate together.

**Acceptance Criteria:**
- [ ] Grouped by family member
- [ ] Chronological within person
- [ ] Visually celebratory (confetti? stars?)
- [ ] Can view past weeks

---

## Epic 9: Meal Planning

### US-9.1: Plan Meals
**Priority:** Must

> **As the** meal planner, **I want** to assign meals to days, **so that** we know what we're eating.

**Acceptance Criteria:**
- [ ] Weekly grid view (7 days)
- [ ] Can focus on dinner only or all meals
- [ ] Click cell to add meal
- [ ] Can link recipe or just type description
- [ ] Can assign who's cooking

### US-9.2: Browse Recipes
**Priority:** Must

> **As a** meal planner, **I want** to browse and search recipes, **so that** I can plan varied meals.

**Acceptance Criteria:**
- [ ] List/grid of recipes
- [ ] Search by title
- [ ] Filter by: cuisine, meal type, dietary, difficulty
- [ ] Cards show: image (if any), title, time, difficulty

### US-9.3: Add Recipe
**Priority:** Must

> **As a** cook, **I want** to save recipes, **so that** I can use them for meal planning.

**Acceptance Criteria:**
- [ ] Can set: title, description, source URL
- [ ] Can set: prep time, cook time, servings, difficulty
- [ ] Can add ingredients (structured: amount, unit, item)
- [ ] Can add instructions (rich text)
- [ ] Can set tags: cuisine, meal type, dietary

### US-9.4: Generate Grocery List
**Priority:** Should

> **As a** shopper, **I want** to generate a grocery list from meal plan, **so that** I don't forget ingredients.

**Acceptance Criteria:**
- [ ] Button to generate from current week's meals
- [ ] Combines duplicate ingredients
- [ ] Groups by category (produce, dairy, etc.) if possible
- [ ] Can copy to clipboard or export

---

## Epic 10: People / Libraries

### US-10.1: Manage Family Profiles
**Priority:** Must

> **As a** parent, **I want** to edit family member profiles, **so that** they're personalized.

**Acceptance Criteria:**
- [ ] Can edit: name, color, avatar, birthday
- [ ] Adults can edit all profiles
- [ ] Kids can edit their own (limited fields)
- [ ] Color picker with curated palette

### US-10.2: Manage Contacts
**Priority:** Should

> **As a** user, **I want** to save contacts, **so that** I remember birthdays and details.

**Acceptance Criteria:**
- [ ] Can add contact with: name, type, birthday, relationship, notes
- [ ] List view with search
- [ ] Upcoming birthdays highlighted
- [ ] Click to view/edit detail

### US-10.3: Manage Vendors
**Priority:** Should

> **As a** homeowner, **I want** to save vendor contacts, **so that** I can find "our plumber" quickly.

**Acceptance Criteria:**
- [ ] Can add vendor with: name, category, specialty, contact info
- [ ] Can rate vendor
- [ ] Can add notes
- [ ] Filter by category
- [ ] Search by name or specialty

### US-10.4: Manage Places
**Priority:** Should

> **As a** user, **I want** to save places, **so that** I can reference them later.

**Acceptance Criteria:**
- [ ] Can add place with: name, category, address, notes
- [ ] Categories: restaurant, medical, school, activity, etc.
- [ ] Click for details and notes
- [ ] Link to vendors at that place (optional)

---

## Epic 11: Family Meeting

### US-11.1: Start Family Meeting
**Priority:** Must

> **As a** family, **I want** a structured meeting view, **so that** our weekly check-in is effective.

**Acceptance Criteria:**
- [ ] "Start Meeting" button or automatic view
- [ ] Sections in order: Milestones, Goals, Last Week's Items, Upcoming Week
- [ ] Can collapse/expand sections
- [ ] Visual design is engaging for kids

### US-11.2: Review Milestones
**Priority:** Must

> **As a** family, **I want** to celebrate wins during meeting, **so that** we stay positive.

**Acceptance Criteria:**
- [ ] This week's milestones shown by person
- [ ] Celebratory visuals
- [ ] Can add milestones on the fly
- [ ] "Next" button to advance

### US-11.3: Review Goals
**Priority:** Should

> **As a** family, **I want** to check goal status, **so that** we stay accountable.

**Acceptance Criteria:**
- [ ] Shows each person's active goals
- [ ] Progress indicator
- [ ] Can update progress inline
- [ ] Discussion notes field

### US-11.4: Create Action Items
**Priority:** Must

> **As a** meeting facilitator, **I want** to capture action items, **so that** decisions turn into tasks.

**Acceptance Criteria:**
- [ ] Quick-add task from meeting view
- [ ] Auto-assigns "created in meeting" context
- [ ] Can assign to family member
- [ ] Can set due date inline

### US-11.5: End Meeting & Save Notes
**Priority:** Should

> **As a** family, **I want** to save meeting notes, **so that** we remember what we discussed.

**Acceptance Criteria:**
- [ ] "End Meeting" button
- [ ] Can add free-form notes/decisions
- [ ] Meeting record saved with date
- [ ] Can view past meetings

---

## Epic 12: Dashboards & Views

### US-12.1: Family Dashboard
**Priority:** Must

> **As a** family member, **I want** a home dashboard, **so that** I see everything at a glance.

**Acceptance Criteria:**
- [ ] Today's date and greeting
- [ ] Quick stats: tasks due today, habits checked, meals planned
- [ ] Today's meals
- [ ] This week's milestones (condensed)
- [ ] Upcoming birthdays (next 14 days)
- [ ] Active projects (cards)
- [ ] Quick-add button prominent

### US-12.2: Personal Dashboard
**Priority:** Must

> **As a** family member, **I want** my own dashboard, **so that** I see what matters to me.

**Acceptance Criteria:**
- [ ] My tasks: overdue, due today, upcoming
- [ ] My habits: today's checklist with streaks
- [ ] My goals: progress overview
- [ ] Tasks assigned to me
- [ ] Toggle to family view

### US-12.3: Calendar View
**Priority:** Must

> **As a** visual planner, **I want** to see everything on a calendar, **so that** I can plan around dates.

**Acceptance Criteria:**
- [ ] Month, week, day views
- [ ] Shows: tasks (by due date), meals, milestones
- [ ] Color-coded by type or assignee
- [ ] Click to open item detail
- [ ] Drag to reschedule (due date)

### US-12.4: Kid-Friendly Dashboard
**Priority:** Should

> **As a** kid, **I want** a simple view, **so that** I'm not overwhelmed.

**Acceptance Criteria:**
- [ ] Shows only: my tasks, my habits, my goals
- [ ] Larger touch targets
- [ ] More visual, less text
- [ ] Encouraging language
- [ ] No access to settings or advanced features

---

## Epic 13: Settings & Permissions

### US-13.1: Family Settings
**Priority:** Must

> **As a** family owner, **I want** to configure family settings, **so that** Fam works for our household.

**Acceptance Criteria:**
- [ ] Set family name
- [ ] Set timezone
- [ ] Set week start day
- [ ] Set family meeting day/time

### US-13.2: Manage Members
**Priority:** Must

> **As a** family owner, **I want** to manage family members, **so that** the right people have access.

**Acceptance Criteria:**
- [ ] See all family members
- [ ] Change member roles
- [ ] Remove members
- [ ] Resend invitations

### US-13.3: Role-Based Access
**Priority:** Must

> **As a** parent, **I want** kids to have limited access, **so that** they can't break things.

**Acceptance Criteria:**
- [ ] Kids cannot: delete projects, manage settings, invite members
- [ ] Kids can: view family data, complete their tasks, add milestones
- [ ] Adults have full access
- [ ] Owner has all admin capabilities

### US-13.4: Personal Preferences
**Priority:** Could

> **As a** user, **I want** to set my preferences, **so that** Fam feels personalized.

**Acceptance Criteria:**
- [ ] Default view preference
- [ ] Notification preferences (future)
- [ ] Theme preference (light/dark)

---

## Epic 14: Search & Navigation

### US-14.1: Global Search
**Priority:** Should

> **As a** user, **I want** to search for anything, **so that** I can find things quickly.

**Acceptance Criteria:**
- [ ] Keyboard shortcut (Cmd/Ctrl + K) opens search
- [ ] Search across: tasks, projects, recipes, people, places, vendors
- [ ] Results grouped by type
- [ ] Recent searches shown
- [ ] Click result to navigate

### US-14.2: Sidebar Navigation
**Priority:** Must

> **As a** user, **I want** clear navigation, **so that** I can move around the app easily.

**Acceptance Criteria:**
- [ ] Sidebar on desktop, bottom nav on mobile
- [ ] Sections: Home, Inbox, Today, Calendar, Tasks, Habits, Goals, Projects, Someday, Meals, Meeting, People, Settings
- [ ] Inbox shows badge count
- [ ] Current location highlighted
- [ ] Collapsible on desktop

---

## Non-Functional Stories

### US-NF.1: Fast Loading
**Priority:** Must

> **As a** user, **I want** pages to load quickly, **so that** I don't get frustrated.

**Acceptance Criteria:**
- [ ] Initial page load < 2 seconds
- [ ] Navigation between pages < 500ms
- [ ] Quick-add saves < 500ms

### US-NF.2: Mobile Responsive
**Priority:** Must

> **As a** mobile user, **I want** the app to work on my phone, **so that** I can use it anywhere.

**Acceptance Criteria:**
- [ ] All features work on mobile browsers
- [ ] Touch-friendly targets (min 44px)
- [ ] Responsive layouts
- [ ] No horizontal scrolling

### US-NF.3: Real-Time Sync
**Priority:** Should

> **As a** family, **I want** changes to appear instantly, **so that** we're always in sync.

**Acceptance Criteria:**
- [ ] When one user makes a change, others see it within 2 seconds
- [ ] No refresh required
- [ ] Conflict handling for simultaneous edits

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-23 | Hazel + Claude | Initial user stories |
| 1.1 | 2024-12-23 | Claude | Updated auth stories for magic link (passwordless) |
