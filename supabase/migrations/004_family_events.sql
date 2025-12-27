-- ============================================================================
-- FAMILY EVENTS (Appointments, Meetings, Activities)
-- ============================================================================
--
-- This migration adds support for Fam-native time-specific events.
-- Unlike tasks (which are completable), events are temporal occurrences.
--
-- Key Design Decisions:
-- 1. Events have start_time/end_time (TIMESTAMPTZ), not just dates
-- 2. Events can be all-day (like birthdays) or timed (like appointments)
-- 3. Events are assigned to family members (who's attending/responsible)
-- 4. Separate from tasks - events aren't "completed", they just happen
--
-- See AI_Dev_Docs/17-family-events.md for full documentation.
-- ============================================================================


-- ============================================================================
-- PART 1: FAMILY EVENTS TABLE
-- ============================================================================

CREATE TABLE family_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Event basics
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,

  -- Timing (always stored in UTC)
  -- For all-day events, start_time is midnight UTC of that day
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  is_all_day BOOLEAN DEFAULT false,

  -- Timezone for display purposes (e.g., "America/Chicago")
  -- Used to show times correctly when viewing the event
  timezone TEXT DEFAULT 'UTC',

  -- Assignment: who attends or is responsible for this event
  -- NULL means it's a family-wide event (everyone)
  assigned_to UUID REFERENCES family_members(id) ON DELETE SET NULL,

  -- Display customization
  -- If null, uses the assigned member's color
  color TEXT,
  -- Optional emoji/icon for the event (e.g., "🏥", "⚽", "🎉")
  icon TEXT,

  -- Recurrence support (optional, for future enhancement)
  -- When is_recurring is true, this is the "master" event
  is_recurring BOOLEAN DEFAULT false,
  -- iCal RRULE format (e.g., "FREQ=WEEKLY;BYDAY=TU,TH")
  recurrence_rule TEXT,
  -- When the recurrence ends (null = forever)
  recurrence_end_date DATE,
  -- For recurring instances, link to the master event
  -- This allows editing/deleting individual occurrences
  parent_event_id UUID REFERENCES family_events(id) ON DELETE CASCADE,

  -- Audit trail
  created_by UUID REFERENCES family_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comments for documentation
COMMENT ON TABLE family_events IS
  'Time-specific events created in Fam (appointments, meetings, activities). Unlike tasks, events have times and are not completable.';

COMMENT ON COLUMN family_events.start_time IS
  'Event start time in UTC. For all-day events, this is midnight UTC.';

COMMENT ON COLUMN family_events.timezone IS
  'Timezone for display. Events are stored in UTC but displayed in this timezone.';

COMMENT ON COLUMN family_events.assigned_to IS
  'Family member who attends/is responsible. NULL means family-wide event.';

COMMENT ON COLUMN family_events.recurrence_rule IS
  'iCal RRULE format for recurring events (e.g., FREQ=WEEKLY;BYDAY=MO,WE,FR).';


-- ============================================================================
-- PART 2: INDEXES
-- ============================================================================

-- Primary query: events for a family in a date range (Today view, Calendar view)
-- This is the hot path - must be fast
CREATE INDEX idx_family_events_family_time
  ON family_events(family_id, start_time);

-- Find events assigned to a specific member (My Day view)
CREATE INDEX idx_family_events_assigned
  ON family_events(assigned_to)
  WHERE assigned_to IS NOT NULL;

-- Find recurring event instances by their parent
CREATE INDEX idx_family_events_parent
  ON family_events(parent_event_id)
  WHERE parent_event_id IS NOT NULL;

-- Find events created by a specific member (for audit purposes)
CREATE INDEX idx_family_events_created_by
  ON family_events(created_by)
  WHERE created_by IS NOT NULL;


-- ============================================================================
-- PART 3: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE family_events ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view events from their family
CREATE POLICY "Users can view own family events"
  ON family_events
  FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE auth_user_id = auth.uid()
    )
  );

-- INSERT: Users can create events for their family
CREATE POLICY "Users can create events for own family"
  ON family_events
  FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members WHERE auth_user_id = auth.uid()
    )
  );

-- UPDATE: Users can update events in their family
CREATE POLICY "Users can update own family events"
  ON family_events
  FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE auth_user_id = auth.uid()
    )
  );

-- DELETE: Users can delete events in their family
CREATE POLICY "Users can delete own family events"
  ON family_events
  FOR DELETE
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE auth_user_id = auth.uid()
    )
  );


-- ============================================================================
-- PART 4: UPDATE CALENDAR FEEDS TABLE
-- ============================================================================

-- Add column for including birthdays in ICS feeds
-- Default false to avoid changing existing feed behavior
ALTER TABLE calendar_feeds
  ADD COLUMN IF NOT EXISTS include_birthdays BOOLEAN DEFAULT false;

-- Add column for including family events in ICS feeds
-- Default true since events are a core calendar feature
ALTER TABLE calendar_feeds
  ADD COLUMN IF NOT EXISTS include_events BOOLEAN DEFAULT true;

COMMENT ON COLUMN calendar_feeds.include_birthdays IS
  'Include family member and contact birthdays as all-day events in the ICS feed.';

COMMENT ON COLUMN calendar_feeds.include_events IS
  'Include family events (appointments, meetings, activities) in the ICS feed.';


-- ============================================================================
-- PART 5: BIRTHDAY HELPER FUNCTION
-- ============================================================================

/**
 * Get birthdays for a date range, handling year boundaries correctly.
 * Returns both family member and contact birthdays.
 *
 * Example usage:
 *   SELECT * FROM get_birthdays_in_range(
 *     'family-uuid',
 *     '2024-12-01'::DATE,
 *     '2025-01-31'::DATE
 *   );
 *
 * Returns: source_type, source_id, name, birthday_date, display_date, age_turning
 */
CREATE OR REPLACE FUNCTION get_birthdays_in_range(
  p_family_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  source_type TEXT,
  source_id UUID,
  name TEXT,
  birthday_date DATE,
  display_date DATE,
  age_turning INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_year INTEGER := EXTRACT(YEAR FROM p_start_date)::INTEGER;
  end_year INTEGER := EXTRACT(YEAR FROM p_end_date)::INTEGER;
BEGIN
  -- Family member birthdays
  -- We need to check the birthday in each year within the range
  RETURN QUERY
  SELECT
    'family_member'::TEXT AS source_type,
    fm.id AS source_id,
    fm.name,
    fm.birthday AS birthday_date,
    -- Calculate the birthday occurrence in each year
    bd.occurrence_date AS display_date,
    -- Age they're turning on that date
    EXTRACT(YEAR FROM bd.occurrence_date)::INTEGER - EXTRACT(YEAR FROM fm.birthday)::INTEGER AS age_turning
  FROM family_members fm
  CROSS JOIN LATERAL (
    -- Generate birthday occurrences for years in range
    SELECT
      make_date(
        yr,
        EXTRACT(MONTH FROM fm.birthday)::INTEGER,
        -- Handle Feb 29 for non-leap years
        LEAST(
          EXTRACT(DAY FROM fm.birthday)::INTEGER,
          CASE
            WHEN EXTRACT(MONTH FROM fm.birthday) = 2 AND EXTRACT(DAY FROM fm.birthday) = 29
              AND NOT (yr % 4 = 0 AND (yr % 100 != 0 OR yr % 400 = 0))
            THEN 28
            ELSE EXTRACT(DAY FROM fm.birthday)::INTEGER
          END
        )
      ) AS occurrence_date
    FROM generate_series(start_year, end_year) AS yr
  ) bd
  WHERE fm.family_id = p_family_id
    AND fm.birthday IS NOT NULL
    AND bd.occurrence_date >= p_start_date
    AND bd.occurrence_date <= p_end_date;

  -- Contact birthdays (same logic)
  RETURN QUERY
  SELECT
    'contact'::TEXT AS source_type,
    c.id AS source_id,
    c.name,
    c.birthday AS birthday_date,
    bd.occurrence_date AS display_date,
    EXTRACT(YEAR FROM bd.occurrence_date)::INTEGER - EXTRACT(YEAR FROM c.birthday)::INTEGER AS age_turning
  FROM contacts c
  CROSS JOIN LATERAL (
    SELECT
      make_date(
        yr,
        EXTRACT(MONTH FROM c.birthday)::INTEGER,
        LEAST(
          EXTRACT(DAY FROM c.birthday)::INTEGER,
          CASE
            WHEN EXTRACT(MONTH FROM c.birthday) = 2 AND EXTRACT(DAY FROM c.birthday) = 29
              AND NOT (yr % 4 = 0 AND (yr % 100 != 0 OR yr % 400 = 0))
            THEN 28
            ELSE EXTRACT(DAY FROM c.birthday)::INTEGER
          END
        )
      ) AS occurrence_date
    FROM generate_series(start_year, end_year) AS yr
  ) bd
  WHERE c.family_id = p_family_id
    AND c.birthday IS NOT NULL
    AND bd.occurrence_date >= p_start_date
    AND bd.occurrence_date <= p_end_date;
END;
$$;

COMMENT ON FUNCTION get_birthdays_in_range IS
  'Returns birthdays (family members and contacts) within a date range, correctly handling year boundaries and leap years.';


-- ============================================================================
-- PART 6: UPDATED_AT TRIGGER
-- ============================================================================

-- Reuse the trigger function if it exists, otherwise create it
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_family_events_updated_at
  BEFORE UPDATE ON family_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- PART 7: EVENT RECURRENCE HELPER (Future Use)
-- ============================================================================

/**
 * Generate recurring event instances for a date range.
 * Currently supports basic daily, weekly, monthly patterns.
 * Full RRULE parsing can be added later if needed.
 *
 * NOTE: This is a placeholder for future implementation.
 * For MVP, we'll generate instances in application code.
 */

-- Placeholder comment for future RRULE parsing function
-- CREATE OR REPLACE FUNCTION expand_recurring_events(...) ...
