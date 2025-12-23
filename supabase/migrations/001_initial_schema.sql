-- ============================================================================
-- 🏠 FAM - Family Command Center
-- ============================================================================
-- Initial Database Schema for Supabase
--
-- Run this in your Supabase SQL Editor to set up the database.
-- Make sure to run it in order - the tables have dependencies!
--
-- ============================================================================

-- ============================================================================
-- 📦 ENUMS (Type Definitions)
-- ============================================================================
-- These define the allowed values for various fields

-- Family member roles (who can do what)
CREATE TYPE family_member_role_enum AS ENUM ('owner', 'adult', 'kid');

-- Task workflow states
CREATE TYPE task_status_enum AS ENUM (
  'inbox',        -- Just captured, needs processing
  'active',       -- Ready to work on
  'waiting_for',  -- Blocked on someone/something
  'someday',      -- Maybe later
  'done'          -- Completed! 🎉
);

-- How often things repeat
CREATE TYPE recurrence_frequency_enum AS ENUM (
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'yearly',
  'custom'
);

-- Goal types
CREATE TYPE goal_status_enum AS ENUM ('active', 'achieved', 'abandoned');
CREATE TYPE goal_type_enum AS ENUM ('qualitative', 'quantitative');

-- Habit tracking
CREATE TYPE habit_frequency_enum AS ENUM ('daily', 'weekly', 'custom');
CREATE TYPE habit_log_status_enum AS ENUM ('done', 'skipped', 'missed');

-- Project workflow
CREATE TYPE project_status_enum AS ENUM (
  'planning',
  'active',
  'on_hold',
  'completed',
  'archived'
);

-- Categorization enums
CREATE TYPE someday_category_enum AS ENUM ('trip', 'purchase', 'experience', 'house', 'other');
CREATE TYPE contact_type_enum AS ENUM ('family', 'friend', 'other');
CREATE TYPE vendor_category_enum AS ENUM (
  'medical', 'dental', 'home', 'auto',
  'financial', 'legal', 'childcare', 'pet', 'other'
);
CREATE TYPE place_category_enum AS ENUM (
  'restaurant', 'medical', 'school', 'activity',
  'travel', 'shopping', 'service', 'other'
);
CREATE TYPE recipe_difficulty_enum AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE meal_type_enum AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');


-- ============================================================================
-- 👨‍👩‍👧‍👦 CORE TABLES: Families & Members
-- ============================================================================

-- The top-level container - all data belongs to a family
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,  -- Timezone, meeting day, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comment explaining settings structure
COMMENT ON COLUMN families.settings IS 'JSON structure: {"timezone": "America/Chicago", "week_starts_on": "sunday", "meeting_day": "sunday", "meeting_time": "18:00"}';

-- People in a family - links to Supabase Auth
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  auth_user_id UUID UNIQUE REFERENCES auth.users(id),  -- Links to Supabase Auth

  -- Profile info
  name TEXT NOT NULL,
  email TEXT,
  role family_member_role_enum NOT NULL DEFAULT 'adult',
  color TEXT DEFAULT '#6366F1',  -- Hex color for UI identification
  avatar_url TEXT,
  birthday DATE,
  preferences JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_family_member UNIQUE (family_id, email)
);

-- Indexes for fast lookups
CREATE INDEX idx_family_members_family ON family_members(family_id);
CREATE INDEX idx_family_members_auth ON family_members(auth_user_id);


-- ============================================================================
-- 📍 PLACES (needed before vendors and tasks can reference them)
-- ============================================================================

CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  category place_category_enum DEFAULT 'other',

  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,

  -- For future map features
  latitude NUMERIC,
  longitude NUMERIC,

  -- Details
  phone TEXT,
  website TEXT,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES family_members(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_places_family ON places(family_id);


-- ============================================================================
-- 👥 CONTACTS (friends, extended family)
-- ============================================================================

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  contact_type contact_type_enum DEFAULT 'other',

  -- Contact details
  email TEXT,
  phone TEXT,

  -- Important dates
  birthday DATE,
  anniversary DATE,

  -- Notes
  notes TEXT,
  relationship TEXT,  -- "Mike's college roommate"

  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES family_members(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_contacts_family ON contacts(family_id);
CREATE INDEX idx_contacts_birthday ON contacts(family_id, birthday) WHERE deleted_at IS NULL;


-- ============================================================================
-- 🔧 VENDORS (service providers)
-- ============================================================================

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  category vendor_category_enum DEFAULT 'other',
  specialty TEXT,  -- "pediatric dentist", "HVAC"

  -- Contact
  phone TEXT,
  email TEXT,
  website TEXT,

  -- Location
  place_id UUID REFERENCES places(id) ON DELETE SET NULL,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,

  -- Tracking
  last_used_at DATE,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES family_members(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_vendors_family ON vendors(family_id);


-- ============================================================================
-- 🎯 GOALS
-- ============================================================================

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  description TEXT,
  definition_of_done TEXT,  -- Clear criteria for completion

  -- Ownership
  owner_id UUID REFERENCES family_members(id),
  is_family_goal BOOLEAN DEFAULT false,

  -- Progress tracking
  goal_type goal_type_enum DEFAULT 'qualitative',
  target_value NUMERIC,      -- For quantitative: "read 50 books"
  current_value NUMERIC DEFAULT 0,
  unit TEXT,                 -- "books", "dollars", "pounds"

  -- Status & timing
  status goal_status_enum DEFAULT 'active',
  target_date DATE,
  achieved_at TIMESTAMPTZ,

  -- Metadata
  tags TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES family_members(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_goals_family ON goals(family_id);
CREATE INDEX idx_goals_owner ON goals(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_goals_status ON goals(family_id, status) WHERE deleted_at IS NULL;


-- ============================================================================
-- 🔄 HABITS
-- ============================================================================

CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  description TEXT,

  -- Schedule
  frequency habit_frequency_enum DEFAULT 'daily',
  target_days_per_week INTEGER,  -- For weekly: aim for X days
  days_of_week INTEGER[],        -- For custom: [1,3,5] = Mon, Wed, Fri

  -- Ownership
  owner_id UUID REFERENCES family_members(id),

  -- Link to goal
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,

  -- Stats (denormalized for quick display) 🔥
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_at DATE,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES family_members(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_habits_family ON habits(family_id);
CREATE INDEX idx_habits_owner ON habits(owner_id) WHERE deleted_at IS NULL;


-- ============================================================================
-- 📊 HABIT LOGS (daily check-ins)
-- ============================================================================

CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,

  log_date DATE NOT NULL,
  status habit_log_status_enum NOT NULL,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),

  -- One log per habit per day
  CONSTRAINT unique_habit_log UNIQUE (habit_id, log_date)
);

CREATE INDEX idx_habit_logs_habit ON habit_logs(habit_id);
CREATE INDEX idx_habit_logs_date ON habit_logs(habit_id, log_date);


-- ============================================================================
-- ✨ SOMEDAY ITEMS (wishes & dreams)
-- ============================================================================

CREATE TABLE someday_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  description TEXT,
  category someday_category_enum DEFAULT 'other',

  -- Optional details
  estimated_cost NUMERIC,
  place_id UUID REFERENCES places(id) ON DELETE SET NULL,

  -- Who dreamed it up
  added_by_id UUID REFERENCES family_members(id),

  -- Status - will be set when promoted to project
  promoted_to_project_id UUID,  -- Set later, after projects table exists
  is_archived BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_someday_family ON someday_items(family_id);


-- ============================================================================
-- 📁 PROJECTS
-- ============================================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT,  -- Rich text / markdown

  -- Status
  status project_status_enum DEFAULT 'planning',

  -- Ownership
  owner_id UUID REFERENCES family_members(id),

  -- Link back to someday if promoted from there
  promoted_from_id UUID REFERENCES someday_items(id) ON DELETE SET NULL,

  -- Dates
  target_date DATE,
  completed_at TIMESTAMPTZ,

  -- Metadata
  color TEXT,
  icon TEXT,  -- Emoji
  tags TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES family_members(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_projects_family ON projects(family_id);
CREATE INDEX idx_projects_status ON projects(family_id, status) WHERE deleted_at IS NULL;

-- Now add the foreign key to someday_items
ALTER TABLE someday_items
ADD CONSTRAINT fk_someday_project
FOREIGN KEY (promoted_to_project_id) REFERENCES projects(id) ON DELETE SET NULL;


-- ============================================================================
-- ✅ TASKS (the core of productivity!)
-- ============================================================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  description TEXT,

  -- Status
  status task_status_enum NOT NULL DEFAULT 'inbox',
  waiting_for TEXT,  -- Who/what we're waiting for (if status = waiting_for)

  -- Dates 📅
  due_date DATE,        -- When it MUST be done
  scheduled_date DATE,  -- When you PLAN to do it
  start_date DATE,      -- Don't show until this date
  completed_at TIMESTAMPTZ,

  -- Recurrence settings 🔄
  is_recurring BOOLEAN DEFAULT false,
  recurrence_frequency recurrence_frequency_enum,
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_days_of_week INTEGER[],  -- [0,2,4] = Sun, Tue, Thu
  recurrence_day_of_month INTEGER,    -- 15 = 15th of month
  recurrence_end_date DATE,
  recurrence_parent_id UUID REFERENCES tasks(id),  -- Links instances to template

  -- Relationships
  assigned_to_id UUID REFERENCES family_members(id),
  related_to_id UUID REFERENCES contacts(id),  -- Task is "about" this person
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  place_id UUID REFERENCES places(id) ON DELETE SET NULL,

  -- Metadata
  priority INTEGER DEFAULT 0,  -- 0=none, 1=low, 2=medium, 3=high
  tags TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES family_members(id),
  deleted_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX idx_tasks_family ON tasks(family_id);
CREATE INDEX idx_tasks_status ON tasks(family_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due ON tasks(family_id, due_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_project ON tasks(project_id) WHERE deleted_at IS NULL;


-- ============================================================================
-- ☑️ SUBTASKS
-- ============================================================================

CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  is_complete BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subtasks_task ON subtasks(task_id);


-- ============================================================================
-- 🎉 MILESTONES (celebrations!)
-- ============================================================================

CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  description TEXT,

  -- Who & When
  person_id UUID NOT NULL REFERENCES family_members(id),
  occurred_at DATE NOT NULL,

  -- Week info for grouping in meetings
  week_year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM occurred_at)) STORED,
  week_number INTEGER GENERATED ALWAYS AS (EXTRACT(WEEK FROM occurred_at)) STORED,

  -- Optional link to goal
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES family_members(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_milestones_family ON milestones(family_id);
CREATE INDEX idx_milestones_week ON milestones(family_id, week_year, week_number);
CREATE INDEX idx_milestones_person ON milestones(person_id);


-- ============================================================================
-- 🍳 RECIPES
-- ============================================================================

CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,

  -- Details
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER,
  difficulty recipe_difficulty_enum DEFAULT 'medium',

  -- Content
  ingredients JSONB DEFAULT '[]'::jsonb,  -- [{amount, unit, item}]
  instructions TEXT,
  notes TEXT,

  -- Categorization
  cuisine TEXT,
  meal_type TEXT[],    -- ["dinner", "lunch"]
  dietary TEXT[],      -- ["vegetarian", "gluten-free"]
  tags TEXT[] DEFAULT '{}',

  -- Media
  image_url TEXT,

  -- Stats
  times_made INTEGER DEFAULT 0,
  last_made_at DATE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES family_members(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_recipes_family ON recipes(family_id);
CREATE INDEX idx_recipes_tags ON recipes USING GIN(tags) WHERE deleted_at IS NULL;


-- ============================================================================
-- 🍽️ MEALS (meal planning)
-- ============================================================================

CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- When
  meal_date DATE NOT NULL,
  meal_type meal_type_enum NOT NULL,

  -- What
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  title TEXT,  -- If no recipe, just a description
  notes TEXT,

  -- Who's cooking
  assigned_to_id UUID REFERENCES family_members(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One meal per slot per day
  CONSTRAINT unique_meal UNIQUE (family_id, meal_date, meal_type)
);

CREATE INDEX idx_meals_family ON meals(family_id);
CREATE INDEX idx_meals_date ON meals(family_id, meal_date);


-- ============================================================================
-- 👥 MEETING NOTES
-- ============================================================================

CREATE TABLE meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- When
  meeting_date DATE NOT NULL,

  -- Content
  notes TEXT,
  decisions TEXT,

  -- Metadata
  attendees UUID[],  -- family_member ids
  duration_minutes INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES family_members(id)
);

CREATE INDEX idx_meeting_notes_family ON meeting_notes(family_id);
CREATE INDEX idx_meeting_notes_date ON meeting_notes(family_id, meeting_date);


-- ============================================================================
-- 🎟️ FAMILY INVITES
-- ============================================================================

CREATE TABLE family_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role family_member_role_enum NOT NULL DEFAULT 'adult',
  token TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES family_members(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE INDEX idx_invites_token ON family_invites(token) WHERE used_at IS NULL;
CREATE INDEX idx_invites_family ON family_invites(family_id);


-- ============================================================================
-- 🔧 HELPER FUNCTIONS
-- ============================================================================

-- Get current user's family_id
CREATE OR REPLACE FUNCTION get_my_family_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT family_id
  FROM family_members
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Get current user's member ID
CREATE OR REPLACE FUNCTION get_my_member_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id
  FROM family_members
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS family_member_role_enum
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role
  FROM family_members
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Check if current user is adult or owner
CREATE OR REPLACE FUNCTION is_adult_or_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_members
    WHERE auth_user_id = auth.uid()
    AND role IN ('owner', 'adult')
  );
$$;


-- ============================================================================
-- 🔐 ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on all tables - users can only see their family's data!

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE someday_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 📜 RLS POLICIES - Families
-- ============================================================================

CREATE POLICY "View own family" ON families FOR SELECT
  USING (id = get_my_family_id());

CREATE POLICY "Update own family" ON families FOR UPDATE
  USING (id = get_my_family_id() AND get_my_role() = 'owner');

-- Allow creating a new family (for onboarding)
CREATE POLICY "Create family" ON families FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 📜 RLS POLICIES - Family Members
-- ============================================================================

CREATE POLICY "View family members" ON family_members FOR SELECT
  USING (family_id = get_my_family_id());

CREATE POLICY "Insert family member" ON family_members FOR INSERT
  WITH CHECK (true);  -- Controlled by app logic during signup/invite

CREATE POLICY "Update family members" ON family_members FOR UPDATE
  USING (
    family_id = get_my_family_id()
    AND (id = get_my_member_id() OR get_my_role() = 'owner')
  );

CREATE POLICY "Delete family members" ON family_members FOR DELETE
  USING (family_id = get_my_family_id() AND get_my_role() = 'owner');

-- ============================================================================
-- 📜 RLS POLICIES - Tasks
-- ============================================================================

CREATE POLICY "View tasks" ON tasks FOR SELECT
  USING (family_id = get_my_family_id());

CREATE POLICY "Create tasks" ON tasks FOR INSERT
  WITH CHECK (family_id = get_my_family_id());

CREATE POLICY "Update tasks" ON tasks FOR UPDATE
  USING (
    family_id = get_my_family_id()
    AND (
      is_adult_or_owner()
      OR assigned_to_id = get_my_member_id()
      OR created_by = get_my_member_id()
    )
  );

CREATE POLICY "Delete tasks" ON tasks FOR DELETE
  USING (family_id = get_my_family_id() AND is_adult_or_owner());

-- ============================================================================
-- 📜 RLS POLICIES - Subtasks
-- ============================================================================

CREATE POLICY "View subtasks" ON subtasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id
    AND tasks.family_id = get_my_family_id()
  ));

CREATE POLICY "Manage subtasks" ON subtasks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id
    AND tasks.family_id = get_my_family_id()
  ));

-- ============================================================================
-- 📜 RLS POLICIES - Habits
-- ============================================================================

CREATE POLICY "View habits" ON habits FOR SELECT
  USING (family_id = get_my_family_id());

CREATE POLICY "Create habits" ON habits FOR INSERT
  WITH CHECK (family_id = get_my_family_id() AND is_adult_or_owner());

CREATE POLICY "Update habits" ON habits FOR UPDATE
  USING (
    family_id = get_my_family_id()
    AND (is_adult_or_owner() OR owner_id = get_my_member_id())
  );

CREATE POLICY "Delete habits" ON habits FOR DELETE
  USING (family_id = get_my_family_id() AND is_adult_or_owner());

-- ============================================================================
-- 📜 RLS POLICIES - Habit Logs
-- ============================================================================

CREATE POLICY "View habit logs" ON habit_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id
    AND habits.family_id = get_my_family_id()
  ));

CREATE POLICY "Log habits" ON habit_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id
    AND habits.family_id = get_my_family_id()
    AND (habits.owner_id = get_my_member_id() OR is_adult_or_owner())
  ));

CREATE POLICY "Update habit logs" ON habit_logs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id
    AND habits.family_id = get_my_family_id()
  ));

-- ============================================================================
-- 📜 RLS POLICIES - Goals
-- ============================================================================

CREATE POLICY "View goals" ON goals FOR SELECT
  USING (family_id = get_my_family_id());

CREATE POLICY "Create goals" ON goals FOR INSERT
  WITH CHECK (
    family_id = get_my_family_id()
    AND (is_adult_or_owner() OR owner_id = get_my_member_id())
  );

CREATE POLICY "Update goals" ON goals FOR UPDATE
  USING (
    family_id = get_my_family_id()
    AND (is_adult_or_owner() OR owner_id = get_my_member_id())
  );

CREATE POLICY "Delete goals" ON goals FOR DELETE
  USING (family_id = get_my_family_id() AND is_adult_or_owner());

-- ============================================================================
-- 📜 RLS POLICIES - Projects
-- ============================================================================

CREATE POLICY "View projects" ON projects FOR SELECT
  USING (family_id = get_my_family_id());

CREATE POLICY "Create projects" ON projects FOR INSERT
  WITH CHECK (family_id = get_my_family_id() AND is_adult_or_owner());

CREATE POLICY "Update projects" ON projects FOR UPDATE
  USING (family_id = get_my_family_id() AND is_adult_or_owner());

CREATE POLICY "Delete projects" ON projects FOR DELETE
  USING (family_id = get_my_family_id() AND is_adult_or_owner());

-- ============================================================================
-- 📜 RLS POLICIES - Other tables (simplified for brevity)
-- ============================================================================

-- Someday Items
CREATE POLICY "Manage someday" ON someday_items FOR ALL
  USING (family_id = get_my_family_id());

-- Milestones
CREATE POLICY "View milestones" ON milestones FOR SELECT
  USING (family_id = get_my_family_id());

CREATE POLICY "Create milestones" ON milestones FOR INSERT
  WITH CHECK (family_id = get_my_family_id());

CREATE POLICY "Update milestones" ON milestones FOR UPDATE
  USING (family_id = get_my_family_id() AND is_adult_or_owner());

CREATE POLICY "Delete milestones" ON milestones FOR DELETE
  USING (family_id = get_my_family_id() AND is_adult_or_owner());

-- Contacts, Vendors, Places
CREATE POLICY "Manage contacts" ON contacts FOR ALL
  USING (family_id = get_my_family_id());

CREATE POLICY "Manage vendors" ON vendors FOR ALL
  USING (family_id = get_my_family_id());

CREATE POLICY "Manage places" ON places FOR ALL
  USING (family_id = get_my_family_id());

-- Recipes, Meals
CREATE POLICY "Manage recipes" ON recipes FOR ALL
  USING (family_id = get_my_family_id());

CREATE POLICY "Manage meals" ON meals FOR ALL
  USING (family_id = get_my_family_id());

-- Meeting Notes
CREATE POLICY "Manage meeting notes" ON meeting_notes FOR ALL
  USING (family_id = get_my_family_id());

-- Family Invites
CREATE POLICY "Manage invites" ON family_invites FOR ALL
  USING (family_id = get_my_family_id() AND get_my_role() = 'owner');


-- ============================================================================
-- 🔥 TRIGGERS - Auto-update streaks on habit completion
-- ============================================================================

CREATE OR REPLACE FUNCTION update_habit_streak()
RETURNS TRIGGER AS $$
DECLARE
  habit_record habits%ROWTYPE;
  last_log_date DATE;
  expected_date DATE;
BEGIN
  -- Only process 'done' status
  IF NEW.status != 'done' THEN
    RETURN NEW;
  END IF;

  -- Get the habit
  SELECT * INTO habit_record FROM habits WHERE id = NEW.habit_id;

  -- Calculate if this continues the streak
  last_log_date := habit_record.last_completed_at;

  IF last_log_date IS NULL THEN
    -- First completion ever
    UPDATE habits SET
      current_streak = 1,
      longest_streak = GREATEST(longest_streak, 1),
      last_completed_at = NEW.log_date,
      updated_at = now()
    WHERE id = NEW.habit_id;
  ELSIF NEW.log_date = last_log_date + INTERVAL '1 day' THEN
    -- Consecutive day - increment streak
    UPDATE habits SET
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_completed_at = NEW.log_date,
      updated_at = now()
    WHERE id = NEW.habit_id;
  ELSIF NEW.log_date > last_log_date + INTERVAL '1 day' THEN
    -- Streak broken - reset to 1
    UPDATE habits SET
      current_streak = 1,
      last_completed_at = NEW.log_date,
      updated_at = now()
    WHERE id = NEW.habit_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER habit_log_streak_trigger
  AFTER INSERT ON habit_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_habit_streak();


-- ============================================================================
-- 🎊 DONE!
-- ============================================================================
-- Your Fam database is ready!
--
-- Next steps:
-- 1. Create a new Supabase project at https://supabase.com
-- 2. Go to SQL Editor and paste this entire file
-- 3. Click "Run" to create all tables
-- 4. Copy your project URL and anon key to your .env.local
--
-- ============================================================================
