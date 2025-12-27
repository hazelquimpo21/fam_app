# Fam — Family Events (Appointments, Meetings & Birthdays)

## Overview

This document outlines the implementation of **Family Events** — Fam-native time-specific events that are separate from tasks. While tasks are actionable items you complete, events are temporal occurrences you attend.

**Key Insight:** Tasks and events serve different purposes:
- **Tasks** = Actionable (you DO it, you COMPLETE it)
- **Events** = Temporal (they HAPPEN, you ATTEND)

> **Design Philosophy:** Fam is the source of truth for family data. We support importing external events from Google Calendar, but families should also be able to create events natively in Fam without needing an external calendar.

---

## Goals & User Stories

### Primary Goals

1. **Native Event Creation** — Families can create appointments, meetings, and activities directly in Fam
2. **Birthday Support** — Birthdays from family members and contacts are shown on the calendar
3. **Unified Calendar View** — All events (Fam events, tasks, meals, birthdays, imported) appear together
4. **ICS Export** — Family events and birthdays can be exported via ICS feeds

### User Stories

| Story | Persona | Need |
|-------|---------|------|
| **Create appointment** | Organizer | "I want to add Miles's dentist appointment at 2pm next Tuesday" |
| **See today's schedule** | Any | "I want to see all appointments/activities happening today" |
| **View birthdays** | Organizer | "I want to see upcoming birthdays on my calendar" |
| **Export to Google** | Contributor | "I want my Fam events to show up in my work calendar" |
| **Assign to member** | Organizer | "I want to assign who's attending or responsible for each event" |

---

## Data Model

### Tasks vs Events: Clear Distinction

| Aspect | Tasks | Events |
|--------|-------|--------|
| **Purpose** | Something to complete | Something to attend |
| **Has due date** | Yes (DATE) | No |
| **Has start time** | No | Yes (TIMESTAMPTZ) |
| **Has end time** | No | Yes (TIMESTAMPTZ) |
| **Completable** | Yes (status: done) | No (just happens) |
| **Recurring** | Yes (recurrence_frequency) | Yes (recurrence support) |
| **Examples** | "Call dentist", "Buy groceries" | "Dentist at 2pm", "Soccer practice" |

### New: `family_events` Table

```sql
CREATE TABLE family_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Event basics
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,

  -- Timing (always stored in UTC)
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  is_all_day BOOLEAN DEFAULT false,

  -- Timezone for display (e.g., "America/Chicago")
  timezone TEXT DEFAULT 'UTC',

  -- Assignment (who attends/is responsible)
  assigned_to UUID REFERENCES family_members(id) ON DELETE SET NULL,

  -- Display
  color TEXT,  -- Override color, else uses assigned member's color
  icon TEXT,   -- Optional emoji/icon

  -- Recurrence (optional)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,  -- iCal RRULE format (e.g., "FREQ=WEEKLY;BYDAY=TU,TH")
  recurrence_end_date DATE,
  parent_event_id UUID REFERENCES family_events(id) ON DELETE CASCADE,  -- For recurring instances

  -- Metadata
  created_by UUID REFERENCES family_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_family_events_family_time ON family_events(family_id, start_time);
CREATE INDEX idx_family_events_assigned ON family_events(assigned_to);
CREATE INDEX idx_family_events_recurring ON family_events(parent_event_id) WHERE parent_event_id IS NOT NULL;
```

### Update: `calendar_feeds` Table

Add birthday support to ICS feeds:

```sql
ALTER TABLE calendar_feeds ADD COLUMN include_birthdays BOOLEAN DEFAULT false;
```

---

## Event Categories

Events in Fam can be categorized by type for visual distinction:

| Category | Icon | Color | Example |
|----------|------|-------|---------|
| **Appointment** | 🏥 | Blue | Doctor visit, haircut |
| **Meeting** | 👥 | Purple | School meeting, work call |
| **Activity** | ⚽ | Green | Sports practice, lessons |
| **Social** | 🎉 | Pink | Party, playdate |
| **Travel** | ✈️ | Orange | Vacation, trip |
| **Other** | 📅 | Gray | Miscellaneous |

These are suggestions, not enforced. Users can pick any emoji/icon.

---

## Birthday Integration

### Where Birthdays Live

- **Family Members:** `family_members.birthday` (DATE)
- **Contacts:** `contacts.birthday` (DATE)

### Birthday Display Rules

1. Birthdays show as **all-day events** on the Calendar view
2. Birthdays appear in the **Today view** when it's someone's birthday
3. Birthdays appear in **"Upcoming" section** 14 days before
4. Birthdays can be included in **ICS feeds** (opt-in via `include_birthdays`)

### Birthday Query

```sql
-- Get birthdays for a date range (handles year wrapping)
CREATE OR REPLACE FUNCTION get_birthdays_in_range(
  p_family_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  source_type TEXT,
  source_id UUID,
  name TEXT,
  birthday_date DATE,
  display_date DATE,
  age_turning INTEGER
) AS $$
BEGIN
  -- Family member birthdays
  RETURN QUERY
  SELECT
    'family_member'::TEXT,
    fm.id,
    fm.name,
    fm.birthday,
    -- Calculate this year's or next year's birthday date
    CASE
      WHEN make_date(EXTRACT(YEAR FROM p_start_date)::INT,
                     EXTRACT(MONTH FROM fm.birthday)::INT,
                     EXTRACT(DAY FROM fm.birthday)::INT) >= p_start_date
      THEN make_date(EXTRACT(YEAR FROM p_start_date)::INT,
                     EXTRACT(MONTH FROM fm.birthday)::INT,
                     EXTRACT(DAY FROM fm.birthday)::INT)
      ELSE make_date(EXTRACT(YEAR FROM p_start_date)::INT + 1,
                     EXTRACT(MONTH FROM fm.birthday)::INT,
                     EXTRACT(DAY FROM fm.birthday)::INT)
    END AS display_date,
    -- Calculate age they're turning
    EXTRACT(YEAR FROM p_start_date)::INT - EXTRACT(YEAR FROM fm.birthday)::INT
  FROM family_members fm
  WHERE fm.family_id = p_family_id
    AND fm.birthday IS NOT NULL;

  -- Contact birthdays (similar logic)
  RETURN QUERY
  SELECT
    'contact'::TEXT,
    c.id,
    c.name,
    c.birthday,
    CASE
      WHEN make_date(EXTRACT(YEAR FROM p_start_date)::INT,
                     EXTRACT(MONTH FROM c.birthday)::INT,
                     EXTRACT(DAY FROM c.birthday)::INT) >= p_start_date
      THEN make_date(EXTRACT(YEAR FROM p_start_date)::INT,
                     EXTRACT(MONTH FROM c.birthday)::INT,
                     EXTRACT(DAY FROM c.birthday)::INT)
      ELSE make_date(EXTRACT(YEAR FROM p_start_date)::INT + 1,
                     EXTRACT(MONTH FROM c.birthday)::INT,
                     EXTRACT(DAY FROM c.birthday)::INT)
    END AS display_date,
    EXTRACT(YEAR FROM p_start_date)::INT - EXTRACT(YEAR FROM c.birthday)::INT
  FROM contacts c
  WHERE c.family_id = p_family_id
    AND c.birthday IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Unified Calendar Display

### CalendarItem Type (Virtual Unification)

Instead of duplicating data, we query each source and merge at display time:

```typescript
/**
 * Unified calendar item for display.
 * Created by merging tasks, meals, events, birthdays, and external events.
 */
export type CalendarItem = {
  // Common fields
  id: string;
  title: string;
  start: Date;
  end?: Date;
  isAllDay: boolean;
  color?: string;

  // Type discrimination
  type: 'task' | 'meal' | 'event' | 'birthday' | 'external';

  // Source-specific data (for click handling)
  sourceId: string;
  sourceType: string;

  // Display hints
  icon?: string;
  assignee?: { id: string; name: string; color: string };
  location?: string;
}
```

### Query Strategy

For a given date range, we query in parallel:
1. `tasks` with `due_date` or `scheduled_date` in range
2. `meals` with `date` in range
3. `family_events` with `start_time` in range
4. Birthdays in range (via function)
5. `external_events` with `start_time` in range (if Google connected)

Then merge into `CalendarItem[]` sorted by `start` time.

---

## UI Components

### EventModal

Similar to TaskModal, but with time-specific fields:

```
┌────────────────────────────────────────────────────┐
│ New Event                                      ✕   │
├────────────────────────────────────────────────────┤
│                                                    │
│ Title *                                            │
│ ┌────────────────────────────────────────────────┐ │
│ │ Dentist appointment - Miles                    │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ [ ] All day event                                  │
│                                                    │
│ Start                        End                   │
│ [📅 Dec 30, 2024]           [📅 Dec 30, 2024]     │
│ [🕐 2:00 PM]                [🕐 3:00 PM]          │
│                                                    │
│ Location                                           │
│ ┌────────────────────────────────────────────────┐ │
│ │ Shorewood Family Dental, 123 Main St           │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ Who's going                                        │
│ [👤 Miles ▼]                                      │
│                                                    │
│ Description                                        │
│ ┌────────────────────────────────────────────────┐ │
│ │ 6-month checkup                                │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
├────────────────────────────────────────────────────┤
│                         [Cancel]  [Save Event]     │
└────────────────────────────────────────────────────┘
```

### Today Page Integration

```
┌──────────────────────────────────────────────────────────┐
│  TODAY                                          Dec 27   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  🎂 BIRTHDAYS                                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🎂 Grandma turns 75 today!                         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  📅 SCHEDULE                                             │
│  ┌────────────────────────────────────────────────────┐ │
│  │  9:00 AM   Team standup              🔵 External   │ │
│  │ 10:30 AM   School meeting            📍 Miles      │ │
│  │  2:00 PM   Dentist - Miles           📍 Health     │ │
│  │  5:30 PM   🍽️ Dinner: Tacos                        │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ✓ TODAY'S TASKS                                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │ □ Review camp options                Due today     │ │
│  │ □ Grocery run                        Due today     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Calendar Page Integration

Events appear on the calendar grid with their time:
- All-day events (including birthdays) at the top of the day
- Timed events positioned according to their start time
- Color-coded by assignee or category
- Click to open EventModal for editing

---

## ICS Feed Updates

### Include Birthdays

When `include_birthdays` is true:
1. Query upcoming birthdays (next 60 days, wrapping around year)
2. Generate all-day events with `CATEGORIES:birthday`
3. Title format: "🎂 [Name]'s Birthday"

### Include Family Events

Family events are always included when `include_tasks` is true (they're considered "scheduled items"). For more granular control, we could add `include_events` column in the future.

```typescript
function generateEventFromFamilyEvent(event: FamilyEvent): string {
  const uid = `fam-event-${event.id}@fam.app`;
  const dtstart = event.is_all_day
    ? formatDateOnly(event.start_time)
    : formatDateTime(event.start_time);
  const dtend = event.end_time
    ? (event.is_all_day ? formatDateOnly(event.end_time) : formatDateTime(event.end_time))
    : dtstart;

  return `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatDateTime(new Date())}
DTSTART${event.is_all_day ? ';VALUE=DATE' : ''}:${dtstart}
DTEND${event.is_all_day ? ';VALUE=DATE' : ''}:${dtend}
SUMMARY:${escapeICS(event.title)}
${event.description ? `DESCRIPTION:${escapeICS(event.description)}` : ''}
${event.location ? `LOCATION:${escapeICS(event.location)}` : ''}
CATEGORIES:event
END:VEVENT
`;
}
```

---

## Implementation Plan

### Phase 1: Database & Types
1. Create migration `004_family_events.sql`
2. Add `include_birthdays` to `calendar_feeds`
3. Create TypeScript types in `types/calendar.ts`

### Phase 2: API & Hooks
1. Create `use-family-events.ts` hooks (CRUD operations)
2. Create `useBirthdays` hook for birthday queries
3. Create `useCalendarItems` hook for unified calendar data
4. Update query keys in `lib/query-keys.ts`

### Phase 3: UI Components
1. Create `EventModal` component
2. Add event creation button to Today/Calendar views
3. Add birthday display to Today view
4. Update Calendar view to show all event types

### Phase 4: ICS Integration
1. Update `/api/calendar/feed/[token]/route.ts` to include:
   - Family events
   - Birthdays (when enabled)
2. Test with Google Calendar subscription

---

## SQL Migration Summary

The following SQL changes are needed:

```sql
-- 1. Create family_events table
CREATE TABLE family_events (...);  -- See full schema above

-- 2. Add indexes
CREATE INDEX idx_family_events_family_time ON family_events(family_id, start_time);
CREATE INDEX idx_family_events_assigned ON family_events(assigned_to);

-- 3. Add RLS policies
ALTER TABLE family_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "..." ON family_events FOR SELECT ...;
CREATE POLICY "..." ON family_events FOR INSERT ...;
CREATE POLICY "..." ON family_events FOR UPDATE ...;
CREATE POLICY "..." ON family_events FOR DELETE ...;

-- 4. Add include_birthdays to calendar_feeds
ALTER TABLE calendar_feeds ADD COLUMN include_birthdays BOOLEAN DEFAULT false;

-- 5. Add birthday query function
CREATE OR REPLACE FUNCTION get_birthdays_in_range(...);
```

---

## Success Metrics

- Users creating events natively in Fam (adoption)
- Events exported via ICS to external calendars
- Birthday celebrations captured (birthday task/milestone connection)
- Reduction in "forgot about appointment" issues

---

## Future Enhancements

- **Reminders:** Push notifications for upcoming events
- **Recurring events:** Full RRULE support with exceptions
- **Event invites:** Invite family members to events
- **Event categories:** Predefined categories with icons
- **Conflict detection:** Warn when events overlap
- **Travel time:** Suggest leaving time based on location

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-27 | Hazel + Claude | Initial family events plan |
