-- ============================================================================
-- 🔧 FIX: Onboarding RLS Policies
-- ============================================================================
-- Run this migration if you're getting 403 errors when creating a family
-- during onboarding. This ensures new users can create families.
--
-- The issue: Original RLS policies required users to already have a family
-- (via get_my_family_id()), but new users don't have one yet.
--
-- This migration adds/updates policies to allow:
-- 1. Authenticated users to CREATE new families
-- 2. Authenticated users to INSERT their family_member record
-- ============================================================================

-- First, drop any existing policies that might be too restrictive
-- (These are safe to run even if the policies don't exist)

-- Drop existing family policies
DROP POLICY IF EXISTS "Create family" ON families;
DROP POLICY IF EXISTS "View own family" ON families;
DROP POLICY IF EXISTS "Update own family" ON families;

-- Drop existing family_members policies
DROP POLICY IF EXISTS "Insert family member" ON family_members;
DROP POLICY IF EXISTS "View family members" ON family_members;

-- ============================================================================
-- 📜 RECREATE: Families Policies
-- ============================================================================

-- Allow any authenticated user to create a new family
-- This is needed for onboarding - new users don't have a family yet
CREATE POLICY "Create family" ON families FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can only view their own family
CREATE POLICY "View own family" ON families FOR SELECT
  TO authenticated
  USING (id = get_my_family_id());

-- Only owners can update family settings
CREATE POLICY "Update own family" ON families FOR UPDATE
  TO authenticated
  USING (id = get_my_family_id() AND get_my_role() = 'owner');

-- ============================================================================
-- 📜 RECREATE: Family Members Policies
-- ============================================================================

-- Allow authenticated users to insert themselves as a family member
-- This is controlled by app logic:
-- - During onboarding: user creates themselves as owner
-- - During invite: user joins with invited role
CREATE POLICY "Insert family member" ON family_members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User can only insert a record for themselves
    auth_user_id = auth.uid()
  );

-- Users can view members of their own family
CREATE POLICY "View family members" ON family_members FOR SELECT
  TO authenticated
  USING (family_id = get_my_family_id());

-- ============================================================================
-- ✅ VERIFY: Check that policies were created
-- ============================================================================
-- Run this query to verify:
-- SELECT schemaname, tablename, policyname, cmd
-- FROM pg_policies
-- WHERE tablename IN ('families', 'family_members')
-- ORDER BY tablename, policyname;
