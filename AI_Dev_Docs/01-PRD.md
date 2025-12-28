# Fam — Product Requirements Document

## Vision

Fam is a family command center that brings household coordination, goal tracking, and shared memories into one warm, delightful app. It replaces the scattered sticky notes, forgotten Google Docs, and mental load that one parent usually carries alone.

**One sentence:** The family operating system that actually gets used.

---

## Problem Statement

Families juggle tasks, meals, appointments, goals, vendor contacts, and dreams across dozens of apps, paper lists, and one overwhelmed person's brain. Existing productivity tools are built for individuals or teams at work—not for the unique dynamics of a household with adults and kids, shared and personal responsibilities, and a need for both structure and celebration.

---

## Target Users

### Primary Personas

| Persona | Description | Needs |
|---------|-------------|-------|
| **The Organizer** | The parent who holds the family's mental load. Plans meals, tracks appointments, remembers birthdays. | Powerful tools, multiple views, bulk actions, peace of mind that nothing falls through cracks. |
| **The Contributor** | The other adult who participates but doesn't configure. Checks things off, adds items, shows up to meetings. | Simple interface, clear "what's mine today," low friction. |
| **The Older Kid** (8-14) | Has chores, personal goals, participates in family meetings. | Age-appropriate view, own dashboard, sense of ownership without overwhelm. |
| **The Younger Kid** (5-7) | Mostly view-only, maybe checks off assigned tasks with help. | Very simple, visual, encouraging. |

### Family Unit Assumptions
- 2-6 people per family
- Mix of adults and children
- One primary organizer, others contribute
- Weekly rhythm of planning and check-ins

---

## Core Principles

1. **Capture must be instant.** If adding something takes more than 5 seconds, it won't happen.

2. **The system must be trustworthy.** If users don't trust that everything is in Fam, they'll keep parallel systems.

3. **Celebrate more than nag.** Milestones, streaks, wins—Fam should feel encouraging, not like a guilt machine.

4. **Adults and kids need different experiences.** Same data, different views and permissions.

5. **Structure without rigidity.** Support GTD/EOS patterns for power users, but don't require them.

6. **Design for the weekly rhythm.** The family meeting is the heartbeat. Everything flows toward or from it.

---

## V1 Scope

### In Scope

**Core Entities**
- Tasks (one-time, with due/scheduled/start dates, recurrence)
- Habits (daily/weekly tracking with streaks)
- Goals (with definition of done, progress, linked habits/tasks)
- Milestones (celebratory moments, tied to person + date)
- Projects (containers for tasks, notes, links)
- Someday items (categorized wishlists)
- Family Events (appointments, activities, all-day or timed, with location)

**Profiles** *(See `AI_Dev_Docs/15-profile-architecture.md`)*
- Family Profile (identity, values, traditions, household info, AI preferences)
- Member Profiles (personality, interests, health/dietary, communication preferences)
- Progressive profile collection (feels like building a scrapbook, not filling forms)
- Foundation for AI personalization

**People & Libraries**
- Family members (profiles, colors, roles)
- Contacts (friends, extended family with birthdays)
- Vendors (service providers with specialty, contact info)
- Places (locations for reference and linking)
- Recipes (ingredients, steps, tags)

**Planning**
- Meals (weekly plan, linked to recipes)
- Inbox (quick capture, processing)

**Views**
- Family dashboard (today at a glance)
- Personal dashboard (my stuff)
- Calendar view (all dated items)
- Kanban view (tasks AND events by time/status/priority) ✅
- Family meeting view (structured weekly check-in)
- Library views (people, vendors, places, recipes)

**System**
- Role-based permissions (adult/kid)
- Multi-family-member support
- Responsive web (mobile-friendly)

### Out of Scope for V1 (Architected For)

- Native mobile apps (responsive web first)
- ~~Google Calendar sync (v1.5)~~ ✅ Implemented
- Task dependencies
- Issues list (EOS-style)
- Family scorecard
- Gamification / points
- Time estimates / energy levels
- Contexts beyond places
- File attachments (use links for now)
- AI-powered suggestions *(Profile architecture now in place to enable this)*

---

## Success Metrics

### Engagement
- Weekly active family members (target: 80% of household)
- Inbox processed to zero (target: daily for organizer)
- Family meeting held (target: weekly)

### Retention
- Week 4 retention (target: 60%)
- Week 12 retention (target: 40%)

### Satisfaction
- NPS score (target: 50+)
- "Would you go back to your old system?" (target: <10% yes)

---

## Key User Journeys

### Journey 1: Daily Morning Check-in
1. Open Fam (web or mobile browser)
2. See personal dashboard: today's tasks, habits to check, meals
3. Check off morning habits
4. See what's assigned to me today
5. Glance at family view if needed
6. Close, confident about the day

### Journey 2: Quick Capture
1. Think of something ("need to call dentist")
2. Open quick-add (keyboard shortcut or floating button)
3. Type naturally: "call dentist about Miles checkup"
4. Item goes to inbox
5. Later: process inbox, assign to task with due date and person

### Journey 3: Weekly Family Meeting
1. Sunday evening, open Family Meeting view
2. See this week's milestones by family member—celebrate!
3. Review goal progress (on track / off track)
4. Look at last week's action items—what got done?
5. Preview upcoming week (meals, big dates)
6. Discuss and create new action items
7. End meeting, items are now tasks

### Journey 4: Meal Planning
1. Open Meals > This Week
2. See 7-day grid (dinner focus, or all meals)
3. Browse recipe library in sidebar
4. Drag recipes onto days
5. Assign who's cooking each night
6. Click "Generate Grocery List" for shopping

### Journey 5: Project Planning (e.g., Summer Camp Research)
1. Create new project: "Summer 2025 Camps"
2. Add tasks: research options, compare costs, register by deadline
3. Add notes: links to camp websites, pros/cons
4. Link to relevant someday item if promoted from there
5. Track progress as tasks complete

---

## Non-Functional Requirements

### Performance
- Page load: <2 seconds
- Quick-add to inbox: <500ms
- Real-time sync across family members

### Security
- Row-level security (users only see their family's data)
- Secure authentication (Supabase Auth)
- No sensitive data in client-side storage

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigable
- Screen reader compatible

### Scalability
- Support up to 10,000 families in v1 infrastructure
- Architected for future: 100k+ families

---

## Tech Stack (Decided)

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+ (App Router) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui (customized) |
| Backend | Supabase (Postgres, Auth, Realtime) |
| Hosting | Vercel |
| State Management | TanStack Query (server state) + Zustand (client state) |

---

## Design Direction

### Personality
- Warm, encouraging, family-friendly
- Delightful without being childish
- Calm confidence, not overwhelming

### Visual Inspiration
- Soft, rounded corners (16-20px radius)
- Warm color palette with pops of color for status/priority
- Family member colors for quick visual identification
- Friendly typography (Inter or similar)
- Subtle shadows, not flat
- Micro-interactions for delight (check animations, celebrations)

### Color Palette (Starting Point)
- **Background:** Warm off-white (#FAFAF8)
- **Surface:** White with soft shadow
- **Primary:** Warm teal or sage green
- **Secondary:** Soft coral or peach
- **Accents:** Each family member gets a color
- **Status:** Green (done), Yellow (in progress), Red (overdue)

---

## Open Questions for Future Phases

1. ~~How deep should AI integration go?~~ *(Answered: See `15-profile-architecture.md` for AI use cases enabled by profiles—smart suggestions, personalized celebrations, dietary-aware meal planning, context-aware reminders)*

2. Should there be a "family score" or gamification layer for kids?

3. What's the right model for sharing outside the family? (Grandparents view? Babysitter mode?)

4. How do we handle divorced/blended families with complex custody arrangements?

5. Is there a B2B opportunity? (Family therapists, coaches)

---

---

## 🚀 Implementation Status (MVP)

> **Last Updated:** December 2024

### ✅ Implemented (MVP Complete)

| Feature | Status | Notes |
|---------|--------|-------|
| **Database Schema** | ✅ Complete | Full SQL with 18+ tables, enums, RLS, triggers |
| **Authentication** | ✅ Complete | Magic link (passwordless) login/signup via Supabase Auth |
| **Tasks** | ✅ Complete | CRUD, filtering, status workflow, optimistic updates |
| **Habits** | ✅ Complete | Tracking, streaks, logging (done/skip) |
| **Goals** | ✅ Complete | Qualitative/quantitative goals, progress tracking |
| **Projects** | ✅ Complete | Task containers with status workflow |
| **Someday** | ✅ Complete | Wishlist items with categories |
| **Family Events** | ✅ Complete | Native events, birthdays, ICS integration |
| **Dashboard** | ✅ Complete | Stats cards, today's overview |
| **Today Page** | ✅ Complete | Daily focus with events, birthdays, tasks, habits |
| **Calendar Integration** | ✅ Complete | ICS feeds + Google Calendar import |
| **UI Components** | ✅ Complete | Button, Input, Card, Checkbox, Spinner, Badge, Avatar, Dialog, Select |
| **Modals** | ✅ Complete | Task, Goal, Habit, Project, Someday, Event, Contact modals |
| **Contacts** | ✅ Complete | List, search, filters, birthday tracking, import-ready |
| **Layout** | ✅ Complete | AppShell, Sidebar, TopBar |
| **TanStack Query** | ✅ Complete | Query key factory, hooks, caching |

### 🔨 In Progress / Next Phase

| Feature | Status | Priority |
|---------|--------|----------|
| ~~Goals Page~~ | ✅ Complete | — |
| ~~Projects Page~~ | ✅ Complete | — |
| ~~Onboarding Flow~~ | ✅ Complete | — |
| ~~Family Member Management~~ | ✅ Complete | — |
| ~~Task Detail (Modal)~~ | ✅ Complete | — |
| Profiles Feature | 🔨 Pending | High |
| Calendar View (month/week) | 🔨 Pending | Medium |
| Personal Dashboard (/me) | 🔨 Pending | Medium |

### 📋 Future Phases

| Feature | Phase | Notes |
|---------|-------|-------|
| Meals & Recipes | v1.2 | Full meal planning UI |
| Family Meeting View | v1.2 | Weekly check-in experience |
| Calendar View | v1.2 | All dated items in calendar |
| Someday/Maybe | ✅ v1.0 | Wishlist management |
| ~~Google Calendar Sync~~ | ✅ v1.0 | External calendar integration - **DONE** |
| **Kanban Board** | ✅ v1.0 | Unified tasks + events board - **DONE** |
| **Contacts Library** | ✅ v1.0 | Extended family & friends with birthdays - **DONE** |
| Google Contacts Import | v1.5 | Import contacts from Google People API |
| Places & Vendors | v1.5 | Location/service provider libraries |
| Mobile App | v2.0 | Native apps (currently responsive web) |

### 📁 Project Structure (Implemented)

```
fam_app/
├── app/                      # Next.js App Router
│   ├── (app)/               # Authenticated routes
│   │   ├── page.tsx         # Dashboard ✅
│   │   ├── tasks/page.tsx   # Tasks list ✅
│   │   ├── habits/page.tsx  # Habits tracking ✅
│   │   └── layout.tsx       # App shell wrapper ✅
│   ├── (auth)/              # Public auth routes
│   │   ├── login/           # Login page ✅
│   │   └── signup/          # Signup page ✅
│   └── auth/callback/       # Auth callback ✅
├── components/
│   ├── ui/                  # 5 components ✅
│   ├── shared/              # 3 components ✅
│   └── layout/              # 3 components ✅
├── lib/
│   ├── supabase/            # Client, server, middleware ✅
│   ├── hooks/               # use-tasks, use-habits, use-auth ✅
│   └── utils/               # cn, logger ✅
├── types/database.ts        # TypeScript types ✅
└── supabase/migrations/     # SQL schema ✅
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-23 | Hazel + Claude | Initial PRD |
| 1.1 | 2024-12-23 | Claude | Added implementation status section |
| 1.2 | 2024-12-23 | Claude | Updated auth to magic link (passwordless) |
| 1.3 | 2024-12-26 | Claude | Added Profiles to V1 scope; updated AI integration as "architected for" via profiles |
| 1.4 | 2024-12-28 | Claude | Updated Kanban view to include events; marked Google Calendar sync and Kanban as complete |
| 1.5 | 2024-12-28 | Claude | Added Contacts feature as complete; updated roadmap with Google Contacts Import for v1.5 |
