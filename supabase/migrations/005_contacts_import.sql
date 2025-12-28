-- ============================================================================
-- Migration: 005_contacts_import.sql
-- Description: Add import tracking columns to contacts table for Google import
-- ============================================================================
--
-- This migration prepares the contacts table for importing contacts from
-- external sources like Google People API. It adds:
--
-- 1. google_contact_id - Unique identifier from Google for de-duplication
-- 2. google_photo_url - Profile photo URL from Google
-- 3. imported_from - Source of the contact (google, manual, csv)
-- 4. imported_at - When the contact was imported
--
-- User Stories Addressed:
-- - US-10.2: Manage Contacts (enhanced for import feature)
--
-- ============================================================================

-- Add import tracking columns to contacts table
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS google_contact_id TEXT,
  ADD COLUMN IF NOT EXISTS google_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS imported_from TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ;

-- Add comment explaining the columns
COMMENT ON COLUMN contacts.google_contact_id IS 'Unique ID from Google People API for de-duplication during re-import';
COMMENT ON COLUMN contacts.google_photo_url IS 'Profile photo URL from Google';
COMMENT ON COLUMN contacts.imported_from IS 'Source of contact: manual, google, csv';
COMMENT ON COLUMN contacts.imported_at IS 'Timestamp when contact was imported (null for manually created)';

-- Create unique index for Google contact ID per family
-- This prevents duplicate imports of the same Google contact
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_google_id_per_family
  ON contacts(family_id, google_contact_id)
  WHERE google_contact_id IS NOT NULL AND deleted_at IS NULL;

-- Create index for filtering by import source
CREATE INDEX IF NOT EXISTS idx_contacts_imported_from
  ON contacts(family_id, imported_from)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- End of migration
-- ============================================================================
