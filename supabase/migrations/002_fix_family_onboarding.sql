-- ============================================================================
-- Migration: Fix Family Onboarding RLS Issue
-- ============================================================================
--
-- Problem: When creating a family during onboarding, the user can't SELECT
-- the family they just created because get_my_family_id() returns NULL
-- (no family_member record exists yet).
--
-- Solution: Create a SECURITY DEFINER function that bypasses RLS and handles
-- the entire onboarding transaction atomically.
-- ============================================================================

-- Function to create a family and owner member in one atomic operation
CREATE OR REPLACE FUNCTION create_family_with_owner(
  p_family_name TEXT,
  p_family_settings JSONB,
  p_member_name TEXT,
  p_member_email TEXT,
  p_member_color TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_family_id UUID;
  v_member_id UUID;
  v_existing_member_id UUID;
BEGIN
  -- Get the current authenticated user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user already has a family member record
  SELECT id INTO v_existing_member_id
  FROM family_members
  WHERE auth_user_id = v_user_id
  LIMIT 1;

  IF v_existing_member_id IS NOT NULL THEN
    RAISE EXCEPTION 'User already belongs to a family';
  END IF;

  -- Create the family
  INSERT INTO families (name, settings)
  VALUES (p_family_name, p_family_settings)
  RETURNING id INTO v_family_id;

  -- Create the family member as owner
  INSERT INTO family_members (family_id, auth_user_id, name, email, role, color)
  VALUES (v_family_id, v_user_id, p_member_name, p_member_email, 'owner', p_member_color)
  RETURNING id INTO v_member_id;

  -- Return the results as JSON
  RETURN json_build_object(
    'family', json_build_object(
      'id', v_family_id,
      'name', p_family_name
    ),
    'member', json_build_object(
      'id', v_member_id,
      'name', p_member_name,
      'role', 'owner'
    )
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_family_with_owner TO authenticated;

-- Add a comment explaining the function
COMMENT ON FUNCTION create_family_with_owner IS
  'Creates a new family and adds the current user as owner. Bypasses RLS for onboarding.';
