-- ============================================================================
-- 🎭 FAM - Profile Architecture Migration
-- ============================================================================
--
-- This migration adds rich profile support to families and family members.
-- Profiles enable AI personalization and help families feel seen/understood.
--
-- Key Features:
-- - Family Profile: identity, values, traditions, household info, AI preferences
-- - Member Profile: personality, interests, health/dietary, communication prefs
-- - JSONB for flexibility - no schema changes needed for new profile fields
--
-- Run this in your Supabase SQL Editor AFTER the initial schema.
--
-- Reference: AI_Dev_Docs/15-profile-architecture.md
--
-- ============================================================================

-- ============================================================================
-- 👨‍👩‍👧‍👦 FAMILY PROFILE
-- ============================================================================

-- Add profile column to families table
-- This stores rich family profile data as flexible JSONB
ALTER TABLE families
ADD COLUMN IF NOT EXISTS profile JSONB DEFAULT '{}'::jsonb;

-- Add helpful comment documenting the expected structure
COMMENT ON COLUMN families.profile IS '
Rich family profile for personalization and AI context.

Structure:
{
  // Identity
  "nickname": "Team J",              // Family nickname
  "motto": "Adventure awaits!",      // Family motto/slogan
  "emoji": "🌟",                     // Representative emoji
  "anniversary_date": "2015-06-15",  // When parents/partners got together
  "home_since": "2018-03-01",        // When moved to current home

  // Values & Culture
  "core_values": ["education", "adventure", "health"],
  "yearly_theme": "Year of Yes",
  "decision_style": "family_vote",   // adults | family_vote | consensus
  "communication_style": "playful",  // direct | gentle | playful

  // Traditions (structured for AI to suggest activities)
  "traditions": [
    {
      "id": "uuid",
      "name": "Friday Movie Night",
      "frequency": "weekly",         // weekly | monthly | yearly | special
      "description": "Every Friday evening",
      "day_of_week": 5               // For weekly traditions (0=Sun, 5=Fri)
    }
  ],

  // Household Context
  "life_stage": "young_kids",        // young_kids | elementary | tweens | teens | mixed | empty_nest
  "home_type": "house_with_yard",    // apartment | condo | house | house_with_yard | rural
  "region": "Midwest USA",           // General location for seasonal suggestions
  "languages": ["English", "Spanish"],

  // Pets
  "pets": [
    { "name": "Max", "type": "dog", "emoji": "🐕" }
  ],

  // Shared Interests & Preferences
  "shared_interests": ["hiking", "board_games", "movies"],
  "cuisine_preferences": ["Mexican", "Italian", "Asian"],
  "dietary_restrictions": ["nut-free"],  // Family-wide restrictions
  "travel_style": "adventure",       // adventure | relaxation | cultural | mixed
  "activity_level": "moderate",      // low | moderate | high

  // Narrative
  "family_story": "We are a curious bunch who loves trying new things...",

  // AI Preferences
  "ai_tone": "encouraging",          // encouraging | direct | playful | minimal
  "suggestion_frequency": "moderate" // minimal | moderate | proactive
}
';

-- Create GIN index for efficient JSONB queries on family profile
CREATE INDEX IF NOT EXISTS idx_family_profile ON families USING GIN (profile);


-- ============================================================================
-- 👤 MEMBER PROFILE
-- ============================================================================

-- Add profile column to family_members table
-- This stores individual member profile data as flexible JSONB
ALTER TABLE family_members
ADD COLUMN IF NOT EXISTS profile JSONB DEFAULT '{}'::jsonb;

-- Add helpful comment documenting the expected structure
COMMENT ON COLUMN family_members.profile IS '
Rich member profile for personalization and AI context.

Structure:
{
  // Personality
  "personality_type": "The Organizer",  // The Organizer | The Creative | The Connector | The Thinker
  "energy_type": "ambivert",            // introvert | ambivert | extrovert
  "chronotype": "morning",              // morning | night | flexible
  "planning_style": "planner",          // planner | spontaneous | mixed
  "stress_response": "Needs quiet time to recharge",

  // Strengths & Growth
  "strengths": ["organization", "creativity", "patience"],
  "growth_areas": ["Saying no", "delegating more"],
  "learning_style": "visual",           // visual | auditory | kinesthetic | reading

  // Motivation
  "love_language": "words",             // words | acts | gifts | time | touch
  "motivated_by": ["progress", "recognition", "helping_others"],
  "recharged_by": ["reading", "solo_time", "nature_walks"],

  // Interests
  "hobbies": ["reading", "yoga", "gardening"],
  "current_interests": ["true crime podcasts"],
  "favorite_cuisines": ["Thai", "Mediterranean"],
  "comfort_foods": ["Mac and cheese"],

  // Health & Wellness
  "dietary_restrictions": ["vegetarian", "lactose-free"],
  "allergies": ["tree_nuts"],
  "sleep_schedule": {
    "target_bedtime": "22:00",
    "target_waketime": "06:00"
  },
  "exercise_preferences": ["yoga", "walking"],

  // Communication
  "reminder_style": "gentle",           // gentle | direct | urgent
  "best_focus_time": "morning",         // morning | afternoon | evening
  "notification_preference": "batched", // realtime | batched | minimal
  "preferred_ai_tone": "encouraging",   // encouraging | direct | playful | minimal

  // Life Context (adults)
  "occupation": "Product Manager",
  "work_style": "remote",               // office | remote | hybrid | other
  "busy_seasons": ["q4", "product_launches"],

  // Life Context (kids)
  "school_name": "Lincoln Elementary",
  "grade": "5th grade",
  "favorite_subjects": ["PE", "Science"],
  "activities": ["soccer", "piano"],

  // Narrative
  "bio": "I keep the family calendar straight...",

  // Quick preferences
  "dislikes": ["mushrooms", "early mornings"],
  "needs_help_with": ["staying organized", "remembering homework"]
}
';

-- Create GIN index for efficient JSONB queries on member profile
CREATE INDEX IF NOT EXISTS idx_member_profile ON family_members USING GIN (profile);


-- ============================================================================
-- 🔄 HELPER FUNCTIONS FOR PROFILES
-- ============================================================================

-- Function to safely merge profile updates (preserves existing keys)
-- Usage: SELECT merge_profile('families', 'uuid', '{"motto": "New motto"}')
CREATE OR REPLACE FUNCTION merge_family_profile(
  family_uuid UUID,
  profile_updates JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  UPDATE families
  SET
    profile = COALESCE(profile, '{}'::jsonb) || profile_updates,
    updated_at = now()
  WHERE id = family_uuid
  RETURNING profile INTO result;

  RETURN result;
END;
$$;

-- Function to safely merge member profile updates
CREATE OR REPLACE FUNCTION merge_member_profile(
  member_uuid UUID,
  profile_updates JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  UPDATE family_members
  SET
    profile = COALESCE(profile, '{}'::jsonb) || profile_updates,
    updated_at = now()
  WHERE id = member_uuid
  RETURNING profile INTO result;

  RETURN result;
END;
$$;


-- ============================================================================
-- 📊 PROFILE COMPLETION HELPERS
-- ============================================================================

-- Function to calculate family profile completion percentage
-- Returns a number 0-100 based on how many key fields are filled
CREATE OR REPLACE FUNCTION get_family_profile_completion(family_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  p JSONB;
  total_fields INTEGER := 10;  -- Total key fields we're checking
  filled_fields INTEGER := 0;
BEGIN
  SELECT profile INTO p FROM families WHERE id = family_uuid;

  IF p IS NULL THEN
    RETURN 0;
  END IF;

  -- Count filled fields
  IF p->>'nickname' IS NOT NULL AND p->>'nickname' != '' THEN filled_fields := filled_fields + 1; END IF;
  IF p->>'motto' IS NOT NULL AND p->>'motto' != '' THEN filled_fields := filled_fields + 1; END IF;
  IF jsonb_array_length(COALESCE(p->'core_values', '[]'::jsonb)) > 0 THEN filled_fields := filled_fields + 1; END IF;
  IF jsonb_array_length(COALESCE(p->'traditions', '[]'::jsonb)) > 0 THEN filled_fields := filled_fields + 1; END IF;
  IF p->>'life_stage' IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF jsonb_array_length(COALESCE(p->'pets', '[]'::jsonb)) > 0 THEN filled_fields := filled_fields + 1; END IF;
  IF jsonb_array_length(COALESCE(p->'shared_interests', '[]'::jsonb)) > 0 THEN filled_fields := filled_fields + 1; END IF;
  IF p->>'family_story' IS NOT NULL AND p->>'family_story' != '' THEN filled_fields := filled_fields + 1; END IF;
  IF p->>'ai_tone' IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF p->>'suggestion_frequency' IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;

  RETURN (filled_fields * 100) / total_fields;
END;
$$;

-- Function to calculate member profile completion percentage
CREATE OR REPLACE FUNCTION get_member_profile_completion(member_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  p JSONB;
  total_fields INTEGER := 10;
  filled_fields INTEGER := 0;
BEGIN
  SELECT profile INTO p FROM family_members WHERE id = member_uuid;

  IF p IS NULL THEN
    RETURN 0;
  END IF;

  -- Count filled fields
  IF p->>'personality_type' IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF p->>'energy_type' IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF p->>'chronotype' IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF jsonb_array_length(COALESCE(p->'strengths', '[]'::jsonb)) > 0 THEN filled_fields := filled_fields + 1; END IF;
  IF p->>'love_language' IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF jsonb_array_length(COALESCE(p->'hobbies', '[]'::jsonb)) > 0 THEN filled_fields := filled_fields + 1; END IF;
  IF jsonb_array_length(COALESCE(p->'dietary_restrictions', '[]'::jsonb)) > 0 OR jsonb_array_length(COALESCE(p->'allergies', '[]'::jsonb)) > 0 THEN filled_fields := filled_fields + 1; END IF;
  IF p->>'reminder_style' IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF p->>'best_focus_time' IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF p->>'bio' IS NOT NULL AND p->>'bio' != '' THEN filled_fields := filled_fields + 1; END IF;

  RETURN (filled_fields * 100) / total_fields;
END;
$$;


-- ============================================================================
-- 🎊 DONE!
-- ============================================================================
-- Profile columns and helper functions are now ready!
--
-- Next steps:
-- 1. Run this migration in your Supabase SQL Editor
-- 2. The TypeScript types and hooks will use these new columns
--
-- ============================================================================
