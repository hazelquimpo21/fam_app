-- ============================================================================
-- 📅 CALENDAR INTEGRATION
-- ============================================================================
--
-- This migration adds support for:
-- 1. ICS calendar feed subscriptions (export Fam events to external calendars)
-- 2. Google Calendar connections and imports (view external events in Fam)
--
-- Design Philosophy:
-- - ICS feeds: Simple token-based URLs that any calendar app can subscribe to
-- - Google import: Read-only sync to show external appointments in Fam
-- - No two-way sync complexity - Fam is source of truth for Fam data
--
-- ============================================================================


-- ============================================================================
-- PART 1: ICS CALENDAR FEEDS
-- ============================================================================
-- These allow users to subscribe to Fam events in Google Calendar, Apple
-- Calendar, Outlook, or any app that supports ICS/iCal feeds.
-- ============================================================================

CREATE TABLE calendar_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- NULL member_id means "entire family" feed, otherwise it's personal
  member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,

  -- Secure, unguessable token for the feed URL (48 hex chars)
  -- Users can share this URL, but revoking it regenerates a new token
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),

  -- Human-readable name for the feed (shown in settings)
  name TEXT NOT NULL DEFAULT 'Fam Calendar',

  -- What types of items to include in this feed
  include_tasks BOOLEAN DEFAULT true,
  include_meals BOOLEAN DEFAULT true,
  include_goals BOOLEAN DEFAULT false,  -- Goal target dates as reminders

  -- Tracking
  last_accessed_at TIMESTAMPTZ,  -- Updated each time the feed is fetched
  access_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast token lookups (this is the hot path when feeds are fetched)
CREATE INDEX idx_calendar_feeds_token ON calendar_feeds(token);

-- Index for listing a family's feeds
CREATE INDEX idx_calendar_feeds_family ON calendar_feeds(family_id);

-- Ensure only one personal feed per member, and one family-wide feed per family
CREATE UNIQUE INDEX idx_calendar_feeds_member ON calendar_feeds(family_id, member_id)
  WHERE member_id IS NOT NULL;
CREATE UNIQUE INDEX idx_calendar_feeds_family_wide ON calendar_feeds(family_id)
  WHERE member_id IS NULL;

-- RLS: Users can only access their own family's feeds
ALTER TABLE calendar_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own family feeds" ON calendar_feeds
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create feeds for own family" ON calendar_feeds
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own family feeds" ON calendar_feeds
  FOR UPDATE USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own family feeds" ON calendar_feeds
  FOR DELETE USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE auth_user_id = auth.uid()
    )
  );


-- ============================================================================
-- PART 2: GOOGLE CALENDAR CONNECTIONS
-- ============================================================================
-- Stores OAuth tokens and connection state for each family member's
-- Google Calendar integration.
-- ============================================================================

CREATE TABLE google_calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,

  -- Google account identifier (for display and uniqueness)
  google_email TEXT NOT NULL,
  google_user_id TEXT NOT NULL,

  -- OAuth tokens
  -- In production, these should be encrypted at the application level
  -- using Supabase Vault or a similar secrets manager
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Scopes that were granted (for reference)
  granted_scopes TEXT[],

  -- Sync status
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,  -- Last error message if sync failed

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Each member can only have one Google connection
  CONSTRAINT unique_google_connection UNIQUE (member_id)
);

-- Index for finding a member's connection
CREATE INDEX idx_google_connections_member ON google_calendar_connections(member_id);

-- RLS: Members can only access their own connections
ALTER TABLE google_calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own connection" ON google_calendar_connections
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM family_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create own connection" ON google_calendar_connections
  FOR INSERT WITH CHECK (
    member_id IN (
      SELECT id FROM family_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update own connection" ON google_calendar_connections
  FOR UPDATE USING (
    member_id IN (
      SELECT id FROM family_members WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete own connection" ON google_calendar_connections
  FOR DELETE USING (
    member_id IN (
      SELECT id FROM family_members WHERE auth_user_id = auth.uid()
    )
  );


-- ============================================================================
-- PART 3: GOOGLE CALENDAR SUBSCRIPTIONS
-- ============================================================================
-- Tracks which calendars from Google should be imported and how they should
-- be displayed in Fam.
-- ============================================================================

-- Visibility options for imported calendar events
CREATE TYPE calendar_visibility_enum AS ENUM (
  'owner',   -- Only the member who connected can see these events
  'adults',  -- All adults in the family can see
  'family'   -- Everyone in the family can see
);

CREATE TABLE google_calendar_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES google_calendar_connections(id) ON DELETE CASCADE,

  -- Google Calendar identifier (e.g., "primary" or the calendar's email)
  google_calendar_id TEXT NOT NULL,

  -- Display info (fetched from Google)
  calendar_name TEXT NOT NULL,
  calendar_color TEXT,  -- Hex color from Google

  -- Who in the family can see events from this calendar
  visibility calendar_visibility_enum DEFAULT 'owner',

  -- Whether to actively sync this calendar
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Can't subscribe to the same calendar twice
  CONSTRAINT unique_calendar_subscription UNIQUE (connection_id, google_calendar_id)
);

-- Index for finding subscriptions by connection
CREATE INDEX idx_google_subscriptions_connection ON google_calendar_subscriptions(connection_id);

-- RLS: Same access as the parent connection
ALTER TABLE google_calendar_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access via connection" ON google_calendar_subscriptions
  FOR ALL USING (
    connection_id IN (
      SELECT gcc.id FROM google_calendar_connections gcc
      JOIN family_members fm ON gcc.member_id = fm.id
      WHERE fm.auth_user_id = auth.uid()
    )
  );


-- ============================================================================
-- PART 4: EXTERNAL EVENTS (CACHED)
-- ============================================================================
-- Stores events fetched from Google Calendar for display in Fam.
-- These are periodically refreshed and should be considered a cache.
-- ============================================================================

CREATE TABLE external_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES google_calendar_subscriptions(id) ON DELETE CASCADE,

  -- Google event identifier (for deduplication during sync)
  google_event_id TEXT NOT NULL,

  -- Event content
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,

  -- Timing (always stored in UTC, converted for display)
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  is_all_day BOOLEAN DEFAULT false,

  -- Original timezone from Google (for reference)
  original_timezone TEXT,

  -- Display properties
  color TEXT,  -- From the calendar or event

  -- Sync metadata
  google_updated_at TIMESTAMPTZ,  -- etag equivalent from Google
  fetched_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate events from the same subscription
  CONSTRAINT unique_external_event UNIQUE (subscription_id, google_event_id)
);

-- Primary index for querying events by family and date range
-- This is the hot path for the Today view and Calendar view
CREATE INDEX idx_external_events_family_time ON external_events(family_id, start_time);

-- Index for cleanup - finding old events to delete
CREATE INDEX idx_external_events_fetched ON external_events(fetched_at);

-- RLS: Based on subscription visibility
ALTER TABLE external_events ENABLE ROW LEVEL SECURITY;

-- This policy is more complex because it respects the visibility setting
CREATE POLICY "View based on subscription visibility" ON external_events
  FOR SELECT USING (
    -- First, check if user is in this family
    family_id IN (
      SELECT family_id FROM family_members WHERE auth_user_id = auth.uid()
    )
    AND (
      -- Then, check visibility rules
      -- Owner visibility: only the person who connected
      subscription_id IN (
        SELECT gcs.id FROM google_calendar_subscriptions gcs
        JOIN google_calendar_connections gcc ON gcs.connection_id = gcc.id
        JOIN family_members fm ON gcc.member_id = fm.id
        WHERE gcs.visibility = 'owner' AND fm.auth_user_id = auth.uid()
      )
      OR
      -- Adults visibility: any adult in the family
      subscription_id IN (
        SELECT gcs.id FROM google_calendar_subscriptions gcs
        JOIN google_calendar_connections gcc ON gcs.connection_id = gcc.id
        JOIN family_members fm ON fm.auth_user_id = auth.uid()
        WHERE gcs.visibility = 'adults' AND fm.role IN ('owner', 'adult')
          AND gcc.family_id = fm.family_id
      )
      OR
      -- Family visibility: anyone in the family
      subscription_id IN (
        SELECT gcs.id FROM google_calendar_subscriptions gcs
        WHERE gcs.visibility = 'family'
      )
    )
  );


-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

/**
 * Update the access tracking for a calendar feed when it's fetched.
 * Called by the API route that serves the ICS content.
 */
CREATE OR REPLACE FUNCTION update_calendar_feed_access(feed_token TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE calendar_feeds
  SET
    last_accessed_at = now(),
    access_count = access_count + 1
  WHERE token = feed_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Clean up old external events that are past and no longer relevant.
 * Should be called periodically (e.g., weekly) to keep the table lean.
 */
CREATE OR REPLACE FUNCTION cleanup_old_external_events(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM external_events
  WHERE start_time < now() - (days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE calendar_feeds IS
  'ICS calendar feed configurations. Each feed generates a subscribable URL.';

COMMENT ON TABLE google_calendar_connections IS
  'OAuth connections to Google Calendar. One per family member.';

COMMENT ON TABLE google_calendar_subscriptions IS
  'Which Google Calendars to import from each connection.';

COMMENT ON TABLE external_events IS
  'Cached events from Google Calendar. Refreshed periodically.';

COMMENT ON COLUMN calendar_feeds.token IS
  'Secret token used in the feed URL. Regenerate to revoke access.';

COMMENT ON COLUMN google_calendar_subscriptions.visibility IS
  'Who can see events from this calendar: owner, adults, or family.';

COMMENT ON COLUMN external_events.google_event_id IS
  'Google''s event ID. Used for deduplication during sync.';
