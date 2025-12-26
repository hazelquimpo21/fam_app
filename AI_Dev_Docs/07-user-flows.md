# Fam — User Flows

## Overview

This document maps the key multi-step user journeys in Fam. Each flow shows decision points, screens involved, and edge cases.

---

## Flow 1: New User Onboarding

**Goal:** Get a new user from signup to a populated family dashboard.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  Landing │───▶│  Signup  │───▶│  Verify  │───▶│  Create  │              │
│  │   Page   │    │   Form   │    │  Email   │    │  Family  │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│                                                       │                     │
│                                                       ▼                     │
│                                                  ┌──────────┐              │
│                                                  │  Setup   │              │
│                                                  │ Profile  │              │
│                                                  └──────────┘              │
│                                                       │                     │
│                                                       ▼                     │
│                                                  ┌──────────┐              │
│                                                  │  Invite  │──┐           │
│                                                  │  Family  │  │ Skip      │
│                                                  └──────────┘  │           │
│                                                       │        │           │
│                                                       ▼        ▼           │
│                                                  ┌──────────────────┐      │
│                                                  │  Quick Wins Tour │      │
│                                                  │  (Optional)      │      │
│                                                  └──────────────────┘      │
│                                                       │                     │
│                                                       ▼                     │
│                                                  ┌──────────┐              │
│                                                  │ Dashboard│              │
│                                                  │  (Home)  │              │
│                                                  └──────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step Details

**1. Landing Page → Signup Form**
- CTA: "Get Started Free"
- Signup form: name and email only (passwordless!)
- Alternative: "Already have an account? Sign in"

**2. Signup Form → Check Email Page**
- After submit, redirect to `/check-email` confirmation
- Magic link is sent to email
- Link expires in 1 hour
- Resend option available

**3. Magic Link Click → Auth Callback → Create Family**
- Clicking email link redirects to `/auth/callback`
- Callback exchanges code for session
- Redirect to family creation (or dashboard if family exists)
- Form: Family name (e.g., "The Johnsons")
- Auto-detect timezone from browser

**4. Create Family → Setup Profile**
- Form: Your name, birthday (optional), choose color
- Avatar: Upload or use initials
- Sets user as family "owner" role

**5. Setup Profile → Invite Family**
- Invite form: email, role (adult/kid), name (optional)
- Can invite multiple at once
- "Skip for now" prominent (don't force)
- Pending invites shown

**6. Invite Family → Quick Wins Tour (Optional)**
- 3-4 tooltip overlays showing key features
- "Add your first task"
- "Check off a habit"
- "Plan a meal"
- Can dismiss at any point

**7. → Dashboard**
- Land on family dashboard
- Show encouraging empty states
- Prompt to add first items

### Edge Cases

| Scenario | Handling |
|----------|----------|
| Email already registered | Show error: "Email already in use. Sign in instead?" |
| Verification link expired | Show error with resend option |
| User closes before completing | Resume from last step on next login |
| Invited user already has account | Link to existing account, add to family |

---

## Flow 2: Invited User Joining

**Goal:** Get an invited person into an existing family.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────┐    ┌──────────────────────────────────┐                      │
│  │  Email   │───▶│  Has account?                    │                      │
│  │  Invite  │    └──────────────────────────────────┘                      │
│  └──────────┘              │                │                               │
│                           Yes               No                              │
│                            │                │                               │
│                            ▼                ▼                               │
│                      ┌──────────┐    ┌──────────┐                          │
│                      │  Sign In │    │  Create  │                          │
│                      │          │    │  Account │                          │
│                      └──────────┘    └──────────┘                          │
│                            │                │                               │
│                            └───────┬────────┘                               │
│                                    ▼                                        │
│                              ┌──────────┐                                  │
│                              │  Accept  │                                  │
│                              │  Invite  │                                  │
│                              └──────────┘                                  │
│                                    │                                        │
│                                    ▼                                        │
│                              ┌──────────┐                                  │
│                              │  Setup   │                                  │
│                              │ Profile  │                                  │
│                              └──────────┘                                  │
│                                    │                                        │
│                                    ▼                                        │
│                              ┌──────────┐                                  │
│                              │ Dashboard│                                  │
│                              └──────────┘                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step Details

**Email Invite Contents:**
- From: Fam <noreply@fam.app>
- Subject: "[Inviter name] invited you to join [Family name] on Fam"
- Body: Friendly message, CTA button "Join Family"
- Link includes invite token

**Accept Invite Screen:**
- Shows: "[Inviter] invited you to join [Family name]"
- Shows family members already in family
- Shows assigned role (adult/kid)
- Buttons: "Join Family" / "Decline"

**Profile Setup (for invited):**
- Name (pre-filled if provided in invite)
- Birthday, color, avatar
- Simpler than owner setup (no family config)

---

## Flow 3: Quick Capture → Process

**Goal:** Capture a thought instantly, process it later.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                              │
│  │ Anywhere │───▶│  Quick   │───▶│  Inbox   │                              │
│  │  in App  │    │   Add    │    │  (+1)    │                              │
│  └──────────┘    └──────────┘    └──────────┘                              │
│                                       │                                     │
│                                       │ Later...                            │
│                                       ▼                                     │
│                                  ┌──────────┐                              │
│                                  │  Open    │                              │
│                                  │  Inbox   │                              │
│                                  └──────────┘                              │
│                                       │                                     │
│                                       ▼                                     │
│     ┌───────┬───────┬───────┬────────┼────────┬───────┐                   │
│     │       │       │       │        │        │       │                   │
│     ▼       ▼       ▼       ▼        ▼        ▼       ▼                   │
│ ┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐          │
│ │→ Task ││→ Goal ││→ Habit││→ Proj ││→ Smday││Archive││Delete │          │
│ │ Modal ││ Modal ││ Modal ││ Modal ││ Modal ││       ││       │          │
│ └───────┘└───────┘└───────┘└───────┘└───────┘└───────┘└───────┘          │
│     │       │       │       │        │                                    │
│     ▼       ▼       ▼       ▼        ▼                                    │
│ ┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐                            │
│ │ Task  ││ Goal  ││ Habit ││Project││Someday│                            │
│ │ List  ││ List  ││ List  ││ List  ││ List  │                            │
│ └───────┘└───────┘└───────┘└───────┘└───────┘                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Quick Add Details

**Trigger Methods:**
- Click floating "+" button (all screens)
- Keyboard: `Cmd/Ctrl + K` or `Cmd/Ctrl + N`
- From empty inbox state

**Quick Add Modal:**
```
┌────────────────────────────────────────┐
│ Quick Add                          ✕   │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ What's on your mind?               │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Save to: ○ Inbox  ○ Task  ○ Someday   │
│                                        │
│ [If Task selected:]                    │
│ Due: [Today ▼]  Assign: [Me ▼]        │
│                                        │
│                    [Cancel]  [Add ✓]   │
└────────────────────────────────────────┘
```

**Smart Parsing (Future Enhancement):**
- "Buy milk tomorrow" → Task, due tomorrow
- "Call dentist @waiting" → Task, waiting status
- "Someday: trip to Japan" → Someday item

### Processing Flow Details

**Process Actions:**

| Action | Result | Modal Used |
|--------|--------|------------|
| → Task | Opens TaskModal, title pre-filled. Save creates task, removes from inbox. | `TaskModal` |
| → Goal | Opens GoalModal, title pre-filled. Save creates goal, removes from inbox. | `GoalModal` |
| → Habit | Opens HabitModal, title pre-filled. Save creates habit, removes from inbox. | `HabitModal` |
| → Project | Opens ProjectModal, title pre-filled. Save creates project, removes from inbox. | `ProjectModal` |
| → Someday | Opens SomedayModal with category picker. Save creates someday item, removes from inbox. | `SomedayModal` |
| Archive | Marks inbox item as archived. Can be restored later. | - |
| Delete | Soft delete with 5-second undo toast. | - |

**Batch Processing Mode:**
- "Process All" button enters focused mode
- Shows one item at a time
- After action, auto-advances to next
- Progress indicator: "3 of 7 processed"
- Exit anytime with Escape

---

## Flow 4: Create & Complete Task

**Goal:** Full task lifecycle from creation to completion.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  Create  │───▶│  Task    │───▶│  Work    │───▶│ Complete │              │
│  │  Intent  │    │  Form    │    │  on It   │    │   Task   │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│       │                               │                │                    │
│       │                               │                │                    │
│       │                               ▼                ▼                    │
│       │                         ┌──────────┐    ┌──────────┐              │
│       │                         │ Subtasks │    │ Recurring│              │
│       │                         │ Progress │    │  Next?   │              │
│       │                         └──────────┘    └──────────┘              │
│       │                                               │                    │
│       │                                          Yes  │  No                │
│       │                                               ▼                    │
│       │                                         ┌──────────┐              │
│       │                                         │ Generate │              │
│       │                                         │   Next   │              │
│       │                                         │ Instance │              │
│       │                                         └──────────┘              │
│       │                                                                    │
│       ▼                                                                    │
│  Entry points:                                                             │
│  • Quick Add → Task                                                        │
│  • Task list "+" button                                                    │
│  • Project detail "+" button                                               │
│  • Inbox processing                                                        │
│  • Family meeting action item                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Task Form Details

**Required Fields:**
- Title

**Optional Fields:**
- Description (rich text)
- Due date
- Scheduled date
- Start date
- Assigned to
- Project
- Goal
- Priority
- Place
- Related to (person)
- Tags
- Recurrence

**Form Behavior:**
- Auto-save draft after 3 seconds of inactivity
- Save button: "Create Task" / "Save Changes"
- Cancel: confirm if unsaved changes
- Keyboard: `Cmd/Ctrl + Enter` to save

### Completion Behavior

**Single Task:**
1. User clicks checkbox
2. Checkbox animates (check draws in)
3. Task text gets strikethrough
4. Success sound (optional, can disable)
5. After 500ms, task fades if "hide completed" is on
6. `completed_at` timestamp set
7. Status changes to 'done'

**Recurring Task:**
1. Complete as above
2. System checks recurrence pattern
3. If not past end_date, generate next instance
4. Next instance has new due_date based on pattern
5. Next instance status = 'active'
6. Original instance stays 'done'

---

## Flow 5: Weekly Family Meeting

**Goal:** Run a structured family meeting that captures wins and creates action items.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  Open    │───▶│ Section 1│───▶│ Section 2│───▶│ Section 3│              │
│  │ Meeting  │    │  Wins    │    │  Goals   │    │ Last Week│              │
│  │   View   │    │          │    │          │    │          │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│                                                       │                     │
│                                                       ▼                     │
│                                                  ┌──────────┐              │
│                                                  │ Section 4│              │
│                                                  │This Week │              │
│                                                  │ Preview  │              │
│                                                  └──────────┘              │
│                                                       │                     │
│                                                       ▼                     │
│                                                  ┌──────────┐              │
│                                                  │ Section 5│              │
│                                                  │  Action  │              │
│                                                  │  Items   │              │
│                                                  └──────────┘              │
│                                                       │                     │
│                                                       ▼                     │
│                                                  ┌──────────┐              │
│                                                  │   End    │              │
│                                                  │ Meeting  │              │
│                                                  └──────────┘              │
│                                                       │                     │
│                                                       ▼                     │
│                                                  ┌──────────┐              │
│                                                  │  Save    │              │
│                                                  │  Notes   │              │
│                                                  └──────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Section Details

**Section 1: Celebrate Wins 🎉**
- Shows milestones from current week, grouped by person
- Can add new milestones inline
- Celebratory UI (confetti option for big wins?)
- "Next" button to advance

**Section 2: Goal Check-in 🎯**
- Shows active goals for all family members
- Progress bars / current values
- Can update progress inline
- Quick status: On Track / At Risk / Behind

**Section 3: Last Week's Items 📋**
- Shows tasks created in last meeting
- Checkbox to mark done (if not already)
- Carry-over option for incomplete items

**Section 4: This Week Preview 📅**
- Calendar snippet: next 7 days
- Shows: appointments, meals, due tasks
- Highlight important dates

**Section 5: New Action Items**
- Quick-add tasks during discussion
- Auto-populates assignee picker
- Auto-links to meeting record
- Due date defaults to this week

**End Meeting:**
- "End Meeting & Save" button
- Opens notes field for free-form recording
- Saves meeting record with:
  - Date
  - Attendees (who was present)
  - Duration
  - Notes
  - Decisions

---

## Flow 6: Meal Planning

**Goal:** Plan a week of meals using recipes or quick entries.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────┐    ┌──────────────────────────────────────────────────────┐  │
│  │  Open    │───▶│                Week View                             │  │
│  │  Meals   │    │  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐        │  │
│  └──────────┘    │  │ Sun │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │        │  │
│                  │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤        │  │
│                  │  │     │     │     │     │     │     │     │        │  │
│                  │  │  +  │  +  │  +  │  +  │  +  │  +  │  +  │        │  │
│                  │  │     │     │     │     │     │     │     │        │  │
│                  │  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘        │  │
│                  └──────────────────────────────────────────────────────┘  │
│                                       │                                     │
│                    Click cell (+)     │                                     │
│                                       ▼                                     │
│                          ┌────────────────────────┐                        │
│                          │  Add Meal Options      │                        │
│                          │                        │                        │
│                          │  ○ Choose Recipe       │                        │
│                          │  ○ Quick Entry         │                        │
│                          │  ○ Leftovers           │                        │
│                          │  ○ Eating Out          │                        │
│                          └────────────────────────┘                        │
│                                       │                                     │
│           ┌───────────────────────────┼───────────────────────────┐        │
│           │                           │                           │        │
│           ▼                           ▼                           ▼        │
│     ┌──────────┐               ┌──────────┐               ┌──────────┐    │
│     │  Recipe  │               │  Quick   │               │  Quick   │    │
│     │  Picker  │               │  Text    │               │  Tag     │    │
│     │          │               │  Entry   │               │(Leftover)│    │
│     └──────────┘               └──────────┘               └──────────┘    │
│           │                           │                           │        │
│           └───────────────────────────┼───────────────────────────┘        │
│                                       ▼                                     │
│                                  ┌──────────┐                              │
│                                  │  Assign  │                              │
│                                  │  Cook    │                              │
│                                  └──────────┘                              │
│                                       │                                     │
│                                       ▼                                     │
│                                  ┌──────────┐                              │
│                                  │  Meal    │                              │
│                                  │  Saved   │                              │
│                                  └──────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Add Meal Options

**Choose Recipe:**
- Opens recipe browser
- Search and filter
- Click to select
- Can view recipe details before confirming

**Quick Entry:**
- Simple text field
- Type anything: "Tacos", "Mom's lasagna", "Order pizza"
- No recipe link

**Leftovers:**
- Tags meal as leftovers
- Optional: link to original meal

**Eating Out:**
- Tags meal as restaurant
- Optional: link to place from Places library

### Recipe Browser (in context)

```
┌────────────────────────────────────────┐
│ Choose Recipe               🔍 Search  │
├────────────────────────────────────────┤
│ Filter: [All ▼] [Any cuisine ▼]        │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ 🍝 Mom's Spaghetti                 │ │
│ │ Italian · 30 min · Easy            │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ 🌮 Taco Night                      │ │
│ │ Mexican · 25 min · Easy            │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ 🍗 Chicken Stir-fry               │ │
│ │ Asian · 20 min · Medium            │ │
│ └────────────────────────────────────┘ │
│                                        │
│              [+ New Recipe]            │
└────────────────────────────────────────┘
```

### Grocery List Generation

**Trigger:** "Generate Grocery List" button on meal week view

**Process:**
1. Collect all recipes for selected date range
2. Extract ingredients from each recipe
3. Combine duplicates (sum quantities where possible)
4. Group by category (produce, dairy, meat, pantry, etc.)
5. Display as checklist

**Output Options:**
- View in-app (checklist)
- Copy to clipboard (text)
- Share (future: send to grocery app)

---

## Flow 7: Habit Tracking Daily

**Goal:** Check off daily habits and maintain streaks.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────┐                                                               │
│  │  Open    │                                                               │
│  │ Today or │                                                               │
│  │ Personal │                                                               │
│  │Dashboard │                                                               │
│  └──────────┘                                                               │
│       │                                                                     │
│       ▼                                                                     │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ Today's Habits                                                      │    │
│  │                                                                      │    │
│  │  [ ] Read 20 min          🔥 12 days                                │    │
│  │  [ ] Exercise             🔥 3 days                                 │    │
│  │  [✓] Journal              🔥 46 days  ← just checked               │    │
│  │  [ ] Vitamins                                                       │    │
│  │                                                                      │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│       │                                                                     │
│       │ Click checkbox                                                      │
│       ▼                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                              │
│  │  Check   │───▶│  Update  │───▶│  Streak  │                              │
│  │Animation │    │  Streak  │    │ Feedback │                              │
│  └──────────┘    └──────────┘    └──────────┘                              │
│                                       │                                     │
│                                       │ If milestone (7, 30, 100...)       │
│                                       ▼                                     │
│                                  ┌──────────┐                              │
│                                  │Celebrate!│                              │
│                                  │ 🎉       │                              │
│                                  └──────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Check Animation Details

1. **Click checkbox**
2. **Checkbox fills** with primary color (150ms scale animation)
3. **Check mark draws** in (SVG stroke animation, 200ms)
4. **Streak counter animates** from N to N+1 (number tick up)
5. **Fire emoji pulses** briefly
6. **If milestone:**
   - Larger celebration (confetti burst)
   - Toast: "🎉 30 day streak! Amazing!"

### Skip vs. Miss Logic

| Action | Effect on Streak | Log Status |
|--------|-----------------|------------|
| Check | Streak +1 | 'done' |
| Skip (intentional) | Streak maintained | 'skipped' |
| Miss (day passes unchecked) | Streak resets to 0 | 'missed' |

**Skip Option:**
- Long-press or right-click on habit
- "Skip today" option
- Useful for: sick days, travel, intentional rest

---

## Flow 8: Promote Someday to Project

**Goal:** Turn a dream into an actionable project.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  Someday │───▶│  Click   │───▶│ "Make it │───▶│  Project │              │
│  │   List   │    │   Item   │    │  Happen" │    │   Form   │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│                                                       │                     │
│                                                       │ Pre-filled:         │
│                                                       │ • Title             │
│                                                       │ • Description       │
│                                                       │ • Linked someday    │
│                                                       ▼                     │
│                                                  ┌──────────┐              │
│                                                  │  Add     │              │
│                                                  │  Initial │              │
│                                                  │  Tasks   │              │
│                                                  └──────────┘              │
│                                                       │                     │
│                                                       ▼                     │
│                                                  ┌──────────┐              │
│                                                  │  Project │              │
│                                                  │  Created │              │
│                                                  └──────────┘              │
│                                                       │                     │
│                                                       ▼                     │
│                                        Someday item marked as               │
│                                        "promoted" (not deleted)             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Promotion Flow Details

**Someday Item Actions:**
- View details
- Edit
- **Make it Happen** ← promotes to project
- Archive
- Delete

**Project Form (pre-filled):**
- Title: from someday item
- Description: from someday item
- Owner: defaults to current user
- Status: "Planning"
- Linked someday: automatically set

**Initial Tasks Suggestions:**
- "Research options"
- "Set budget"
- "Create timeline"
- User can add/remove/edit these

**After Promotion:**
- Someday item gets `promoted_to_project_id` set
- Someday item stays in list but marked as "In Progress"
- Project shows "Promoted from someday" badge

---

---

## Implementation Status

### Flow 1: New User Onboarding - ✅ IMPLEMENTED

The onboarding flow is now fully implemented:

- **Route:** `/onboarding`
- **File:** `app/(auth)/onboarding/page.tsx`
- **Middleware:** Enforces onboarding for users without a family

**Current Implementation:**
1. User signs up via magic link
2. Magic link redirects to `/auth/callback`
3. Middleware checks for `family_members` record
4. If no record exists, redirects to `/onboarding`
5. Onboarding page creates `families` and `family_members` records
6. User is redirected to dashboard

**Not Yet Implemented:**
- Invite family members (skip for now - can be done later from Family page)
- Quick wins tour (tooltips)

---

### Flow 2: Invited User Joining - 🔨 NOT YET IMPLEMENTED

---

### Flow 3: Quick Capture → Process - ✅ MOSTLY IMPLEMENTED

**Implemented:**
- Inbox page with list of items (`/inbox`)
- Triage actions: Task, Goal, Habit, Project, Someday, Delete
- All modals pre-fill title from inbox item
- Inbox badge count in sidebar

**Modals Available:**
| Modal | File | Status |
|-------|------|--------|
| TaskModal | `components/modals/task-modal.tsx` | ✅ |
| GoalModal | `components/modals/goal-modal.tsx` | ✅ |
| HabitModal | `components/modals/habit-modal.tsx` | ✅ |
| ProjectModal | `components/modals/project-modal.tsx` | ✅ |
| SomedayModal | `components/modals/someday-modal.tsx` | ✅ |

**Not Yet Implemented:**
- Quick Add modal (global Cmd+K)
- Batch processing mode ("Process All")
- Smart text parsing
- Archive functionality

---

### Flow 4: Create & Complete Task - ✅ IMPLEMENTED

**Implemented:**
- TaskModal for create/edit with all fields
- Task completion with checkbox
- Status changes (inbox → active → done)

**Not Yet Implemented:**
- Subtasks
- Recurring tasks (next instance generation)
- Draft auto-save

---

### Flow 5: Weekly Family Meeting - 🔨 NOT YET IMPLEMENTED

---

### Flow 6: Meal Planning - 🔨 NOT YET IMPLEMENTED

---

### Flow 7: Habit Tracking Daily - ✅ IMPLEMENTED

**Implemented:**
- Habits page with list (`/habits`)
- Check/uncheck daily habits
- Streak tracking and display
- HabitModal for create (+ button) and edit (click habit card)
- Today page habit section with click-to-edit
- Week progress display with real habit_logs data
- Create habit from Today page (header button + empty state CTA)

**Not Yet Implemented:**
- Skip functionality (long-press) - skip button exists but long-press not implemented
- Milestone celebrations (confetti)
- Heatmap visualization

---

### Flow 8: Promote Someday to Project - 🔨 PARTIAL

**Implemented:**
- Someday page with list (`/someday`)
- SomedayModal for create/edit
- Can manually create projects

**Not Yet Implemented:**
- "Make it Happen" promotion button
- Auto-linking someday → project
- Promotion status tracking

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-23 | Hazel + Claude | Initial user flows |
| 1.1 | 2024-12-23 | Claude | Updated for magic link (passwordless) auth |
| 1.2 | 2024-12-26 | Claude | Added implementation status for onboarding flow |
| 1.3 | 2024-12-26 | Claude | Updated Flow 3 diagram with all triage options; added implementation status for all 8 flows |
| 1.4 | 2024-12-26 | Claude | Updated Flow 7 with click-to-edit habits, Today page integration, real week progress |
