# Fam — Google Calendar Integration

## Overview

This document outlines the implementation plan for Google Calendar integration with two features:

1. **ICS Calendar Feeds** — Subscribe to Fam events in any calendar app
2. **Google Calendar Import** — See external appointments inside Fam (read-only)

> **Design Philosophy:** Start simple, avoid over-engineering. Fam is the source of truth for Fam things. Google is the source of truth for external appointments. No two-way sync complexity.

---

## Scope

### In Scope
- ICS feed endpoint for subscribing to Fam events
- Google OAuth for connecting calendars
- Import and display external Google Calendar events
- Show external events on Fam's calendar view and Today page
- Per-family-member calendar connections

### Out of Scope (for now)
- Two-way sync (editing Fam events from Google)
- Push notifications / webhooks from Google
- Real-time sync (we'll use periodic fetch)
- Apple Calendar / Outlook direct integration (ICS handles these)

---

## Part 1: ICS Calendar Feeds

### How It Works

```
User Flow:
1. Go to Settings → Calendar → "Subscribe to Calendar"
2. Copy the ICS URL
3. Paste into Google Calendar / Apple Calendar / Outlook
4. Fam events appear as a subscribed calendar
5. Updates automatically when calendar app refreshes (every 15-30 min)
```

### Endpoint Design

```
GET /api/calendar/feed/[token].ics

Token = unique per family or per member, stored in database
Returns: text/calendar (ICS format)
```

### What Goes in the Feed

| Entity | Include? | As Event Type | Notes |
|--------|----------|---------------|-------|
| Tasks with `due_date` | ✅ Yes | Timed or all-day | Only active/inbox, not done |
| Tasks with `scheduled_date` | ✅ Yes | All-day event | "Scheduled to work on" |
| Meals | ✅ Yes | Timed event | Breakfast 8am, Lunch 12pm, Dinner 6pm |
| Goals with `target_date` | ✅ Optional | All-day event | As a reminder/deadline |
| Habits | ❌ No | — | Too noisy, not calendar events |
| Milestones | ❌ No | — | Past events, not scheduling |

### ICS Generation Strategy

**Simple approach (recommended):** Generate events on-the-fly, no RRULE complexity.

```typescript
// Pseudo-code for ICS generation
function generateICS(familyId: string, memberId?: string) {
  // Fetch active tasks with dates
  const tasks = await fetchTasksWithDates(familyId, memberId)

  // Fetch meals for next 4 weeks
  const meals = await fetchUpcomingMeals(familyId, 28)

  // Build ICS string
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Fam App//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Fam Tasks
`

  for (const task of tasks) {
    ics += generateEventFromTask(task)
  }

  for (const meal of meals) {
    ics += generateEventFromMeal(meal)
  }

  ics += `END:VCALENDAR`
  return ics
}
```

### Recurring Tasks: Keep It Simple

**Problem:** Fam has recurring tasks. ICS supports RRULE. But RRULE is complex and can cause issues.

**Solution:** Don't use RRULE in ICS output. Instead:

1. For recurring tasks, only include the NEXT instance (or next N instances)
2. Generate concrete events, not recurrence rules
3. When Fam generates the next instance of a recurring task, it will appear in the next ICS fetch

```typescript
// Instead of RRULE, just include next 4 instances of recurring tasks
function getRecurringTaskEvents(task: RecurringTask): ICSEvent[] {
  const events = []
  let nextDate = task.due_date

  for (let i = 0; i < 4; i++) {
    events.push({
      uid: `${task.id}-${i}`,
      date: nextDate,
      title: task.title,
    })
    nextDate = calculateNextDate(nextDate, task.recurrence_frequency)
  }

  return events
}
```

**Why this is better:**
- No RRULE parsing issues in different calendar apps
- No performance cost of expanding recurrence
- Keeps ICS simple and predictable
- 4 instances ahead is enough for most planning

### Calendar Feed Tokens

```sql
-- Add to schema
CREATE TABLE calendar_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID REFERENCES family_members(id) ON DELETE CASCADE, -- null = whole family

  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  name TEXT NOT NULL DEFAULT 'Fam Calendar',

  -- What to include
  include_tasks BOOLEAN DEFAULT true,
  include_meals BOOLEAN DEFAULT true,
  include_goals BOOLEAN DEFAULT false,

  -- Metadata
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_feed UNIQUE (family_id, member_id)
);

CREATE INDEX idx_calendar_feeds_token ON calendar_feeds(token);
```

### API Routes

```
GET  /api/calendar/feed/[token].ics   → Returns ICS content
POST /api/calendar/feeds              → Create new feed
GET  /api/calendar/feeds              → List my feeds
DELETE /api/calendar/feeds/[id]       → Revoke a feed
```

---

## Part 2: Google Calendar Import

### How It Works

```
User Flow:
1. Go to Settings → Calendar → "Connect Google Calendar"
2. OAuth flow → Select which calendars to import
3. Fam fetches events from selected calendars
4. Events appear on Fam's calendar view and Today page
5. Fam refreshes periodically (every 15-30 min)
```

### Database Schema

```sql
-- Google calendar connections (per family member)
CREATE TABLE google_calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,

  -- OAuth tokens (encrypted in production)
  google_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Sync state
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_google_connection UNIQUE (member_id)
);

-- Which calendars to import from each connection
CREATE TABLE google_calendar_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES google_calendar_connections(id) ON DELETE CASCADE,

  google_calendar_id TEXT NOT NULL, -- e.g., "primary" or calendar email
  calendar_name TEXT NOT NULL,
  calendar_color TEXT,

  -- Visibility: who in the family can see these events?
  visibility TEXT DEFAULT 'owner', -- 'owner' | 'adults' | 'family'

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_subscription UNIQUE (connection_id, google_calendar_id)
);

-- Cached external events (refreshed periodically)
CREATE TABLE external_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES google_calendar_subscriptions(id) ON DELETE CASCADE,

  -- Event data (denormalized from Google)
  google_event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,

  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  is_all_day BOOLEAN DEFAULT false,

  -- For display
  color TEXT, -- from calendar or event

  -- Sync metadata
  google_updated_at TIMESTAMPTZ, -- etag equivalent
  fetched_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_external_event UNIQUE (subscription_id, google_event_id)
);

CREATE INDEX idx_external_events_family ON external_events(family_id);
CREATE INDEX idx_external_events_time ON external_events(family_id, start_time);
```

### Sync Strategy: Keep It Performant

**The trap:** Fetching ALL events from ALL calendars every time = slow and expensive.

**The solution:** Incremental sync with time windows.

```typescript
async function syncGoogleCalendar(subscriptionId: string) {
  const subscription = await getSubscription(subscriptionId)
  const connection = await getConnection(subscription.connection_id)

  // Refresh OAuth token if needed
  const accessToken = await ensureFreshToken(connection)

  // Only fetch events in a reasonable window
  const timeMin = subDays(new Date(), 7)   // 1 week back
  const timeMax = addDays(new Date(), 60)  // 2 months forward

  // Use Google's incremental sync if we have a sync token
  const params = {
    calendarId: subscription.google_calendar_id,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,  // ← KEY: Expand recurring events for us!
    maxResults: 250,
  }

  const events = await googleCalendarAPI.events.list(params)

  // Upsert events to our table
  await upsertExternalEvents(subscription.id, events)

  // Update last synced
  await updateLastSynced(subscriptionId)
}
```

**Critical setting: `singleEvents: true`**

This tells Google to expand recurring events into individual instances. This means:
- We don't have to parse RRULE
- We don't have to calculate recurrence ourselves
- We just store simple start/end times
- Google does the hard work

**Performance wins:**
- 60-day window = reasonable data size
- `singleEvents: true` = no recurrence parsing
- Periodic sync (not real-time) = predictable load
- Indexed by family_id + start_time = fast queries

### Sync Frequency

**Option A: Cron job (simple)**
- Supabase Edge Function runs every 15 minutes
- Syncs all active connections
- Good for MVP

**Option B: On-demand + background (better UX)**
- When user opens Calendar view, check if stale (>15 min)
- If stale, trigger background sync
- Show cached data immediately, refresh in background
- "Last updated 10 min ago" indicator

**Recommendation:** Start with Option A (cron), add Option B polish later.

### OAuth Flow

```
1. User clicks "Connect Google Calendar"
2. Redirect to Google OAuth with scopes:
   - https://www.googleapis.com/auth/calendar.readonly
   - https://www.googleapis.com/auth/calendar.events.readonly
3. User grants permission
4. Callback receives auth code
5. Exchange for access_token + refresh_token
6. Store encrypted tokens in google_calendar_connections
7. Fetch calendar list, show picker
8. User selects calendars to import
9. Create google_calendar_subscriptions
10. Trigger initial sync
```

### Privacy: Visibility Settings

Each calendar subscription has a `visibility` setting:

| Visibility | Who Sees Events |
|------------|-----------------|
| `owner` | Only the person who connected (default) |
| `adults` | Adults in the family can see |
| `family` | Everyone in the family can see |

**UX:** When adding a work calendar, default to `owner`. When adding "Kids Activities" shared calendar, suggest `family`.

---

## UI/UX Design

### Settings → Calendar Page

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Settings > Calendar                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════════│
│  SUBSCRIBE TO FAM CALENDAR                                               │
│  ═══════════════════════════════════════════════════════════════════════│
│                                                                          │
│  Add Fam events to your favorite calendar app.                          │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ 📅 My Tasks & Meals                                                 │ │
│  │    https://fam.app/api/calendar/feed/abc123.ics                    │ │
│  │    [Copy Link]  [Open in Google Calendar]                          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ 👨‍👩‍👧‍👦 Family Calendar (all members)                                  │ │
│  │    https://fam.app/api/calendar/feed/xyz789.ics                    │ │
│  │    [Copy Link]  [Open in Google Calendar]                          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  [+ Create Custom Feed]                                                   │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════════│
│  IMPORT EXTERNAL CALENDARS                                               │
│  ═══════════════════════════════════════════════════════════════════════│
│                                                                          │
│  See your other calendars inside Fam.                                    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ 🔗 Connected: hazel@gmail.com                    [Manage] [Disconnect]│
│  │                                                                      │ │
│  │    ✓ Work Calendar           visible to: Me only         [⚙️]      │ │
│  │    ✓ Personal                visible to: Me only         [⚙️]      │ │
│  │    ✓ Kids Activities         visible to: Family          [⚙️]      │ │
│  │    ☐ Holidays (US)           —                            [⚙️]      │ │
│  │                                                                      │ │
│  │    Last synced: 5 minutes ago                        [Sync Now]     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  [+ Connect Another Account]                                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Today Page with External Events

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TODAY                                          Friday, Dec 27, 2024     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  📅 SCHEDULE                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  9:00 AM   Team standup                    🔵 Work Calendar         ││
│  │ 10:00 AM   —                                                        ││
│  │ 11:00 AM   —                                                        ││
│  │ 12:00 PM   Lunch with Sarah                🟢 Personal              ││
│  │  1:00 PM   —                                                        ││
│  │  2:00 PM   Dentist - Miles                 🟣 Kids Activities       ││
│  │  3:00 PM   —                                                        ││
│  │  5:30 PM   🍽️ Dinner: Tacos               (Fam)                    ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ✓ TODAY'S TASKS                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ □ Review camp options                      Due today    📁 Camps    ││
│  │ □ Grocery run                              Due today                 ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  🔄 TODAY'S HABITS                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ [✓] Read 20 min   🔥 12   [ ] Exercise   🔥 3   [ ] Vitamins        ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Order

### Phase 1: ICS Feeds (2-3 days)

1. **Database**
   - Add `calendar_feeds` table
   - Migration script

2. **API**
   - `GET /api/calendar/feed/[token].ics` - generate ICS
   - `POST /api/calendar/feeds` - create feed
   - `GET /api/calendar/feeds` - list feeds
   - `DELETE /api/calendar/feeds/[id]` - delete feed

3. **ICS Generation**
   - Build ICS string from tasks + meals
   - Handle timezones properly
   - Include 4 instances of recurring tasks (no RRULE)

4. **UI**
   - Settings → Calendar page
   - Copy link button
   - "Open in Google Calendar" link (uses webcal:// protocol)

### Phase 2: Google Calendar Import (4-5 days)

1. **Database**
   - Add `google_calendar_connections` table
   - Add `google_calendar_subscriptions` table
   - Add `external_events` table
   - Migration script

2. **OAuth Flow**
   - Set up Google Cloud project
   - Configure OAuth consent screen
   - Implement auth routes: `/api/auth/google/connect`, `/api/auth/google/callback`
   - Token storage (encrypt in production)

3. **Sync Logic**
   - Fetch calendar list from Google
   - Fetch events with `singleEvents: true`
   - Upsert to `external_events` table
   - Periodic sync (Supabase Edge Function cron)

4. **Hooks**
   - `useGoogleCalendarConnection()` - connection state
   - `useGoogleCalendarSubscriptions()` - manage subscriptions
   - `useExternalEvents(dateRange)` - fetch cached events

5. **UI**
   - Settings → Calendar: connect Google account
   - Calendar picker modal
   - Visibility settings per calendar
   - Today page: show external events
   - Calendar view: show external events (when built)

### Phase 3: Polish (1-2 days)

- Loading states and error handling
- "Last synced" indicator
- Manual "Sync Now" button
- Disconnect confirmation
- Token refresh handling

---

## Performance Considerations

### ICS Feed Performance

| Concern | Solution |
|---------|----------|
| Large families with many tasks | Limit to active tasks only, max 500 events |
| Frequent requests | Cache ICS output for 5 min (CDN or in-memory) |
| Recurring tasks | Generate max 4 future instances, no RRULE |

### Google Sync Performance

| Concern | Solution |
|---------|----------|
| Too many API calls | Batch sync all subscriptions per connection |
| Large calendars | Use time window (7 days back, 60 days forward) |
| Recurring events | Use `singleEvents: true` (Google expands for us) |
| Stale data | 15-minute sync interval, manual refresh option |
| Many families syncing | Stagger cron jobs, rate limit per connection |

### Database Query Performance

```sql
-- Indexes for common queries
CREATE INDEX idx_external_events_family_time
  ON external_events(family_id, start_time)
  WHERE start_time > now() - interval '7 days';

-- Today's external events query (fast with index)
SELECT * FROM external_events
WHERE family_id = $1
  AND start_time >= $2::date
  AND start_time < $2::date + interval '1 day'
ORDER BY start_time;
```

---

## Security Considerations

1. **ICS Feed Tokens**
   - Long random tokens (48 chars hex)
   - Revocable from settings
   - Rate limited per token
   - No auth required (by design, for calendar app compatibility)

2. **Google OAuth Tokens**
   - Store encrypted at rest (Supabase Vault or app-level encryption)
   - Refresh tokens stored separately
   - Scoped to read-only calendar access
   - Revocable from both Fam and Google

3. **RLS for External Events**
   - Events scoped to family_id
   - Visibility setting respected in queries
   - Only connection owner can modify subscriptions

---

## Open Questions

1. **Calendar View** — We don't have a calendar view yet. Should we build that as part of this, or just show external events on Today page first?

2. **Event Details** — When user taps an external event, what do we show? Link to open in Google Calendar? Read-only details modal?

3. **Conflicts** — If a Fam task is due at the same time as a Google event, do we highlight the conflict?

4. **Notifications** — Should Fam remind about external events? Or leave that to the calendar app?

---

## Success Metrics

- % of families using ICS feeds
- % of families with Google Calendar connected
- User feedback on "feeling organized"
- Reduction in "I forgot about my appointment" issues

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-26 | Hazel + Claude | Initial calendar integration plan |
