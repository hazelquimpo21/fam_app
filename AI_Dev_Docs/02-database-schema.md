# Fam — Database Schema

## Overview

This document defines the Supabase (PostgreSQL) database schema for Fam. All tables use UUIDs as primary keys, include standard timestamps, and are designed for row-level security (RLS).

---

## Schema Conventions

### Naming
- Tables: `snake_case`, plural (e.g., `tasks`, `family_members`)
- Columns: `snake_case`
- Foreign keys: `{referenced_table_singular}_id` (e.g., `family_id`, `assigned_to_id`)
- Enums: `{table}_{column}_enum` (e.g., `task_status_enum`)

### Standard Columns
Every table includes:
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMPTZ DEFAULT now(),
updated_at TIMESTAMPTZ DEFAULT now(),
created_by UUID REFERENCES family_members(id)
```

### Soft Deletes
Tables with user content use soft deletes:
```sql
deleted_at TIMESTAMPTZ DEFAULT NULL
```

---

## Entity Relationship Overview

```
families
  └── family_members (users belong to a family)
        ├── tasks (assigned_to, related_to)
        ├── habits (owner)
        ├── goals (owner)
        ├── milestones (person)
        └── projects (owner)

tasks
  ├── belongs to: project (optional)
  ├── supports: goal (optional)
  ├── assigned_to: family_member
  ├── related_to: person (optional)
  └── location: place (optional)

habits
  └── supports: goal (optional)

goals
  ├── has many: habits
  └── has many: tasks

projects
  ├── has many: tasks
  └── promoted_from: someday_item (optional)

someday_items
  └── category enum

meals
  ├── recipe (optional)
  └── assigned_to: family_member

recipes, vendors, contacts, places
  └── all scoped to family
```

---

## Core Tables

### families

The top-level container. All data is scoped to a family.

```sql
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  settings JSONB DEFAULT '{}'::jsonb
);

-- settings JSON structure:
-- {
--   "timezone": "America/Chicago",
--   "week_starts_on": "sunday",
--   "meeting_day": "sunday",
--   "meeting_time": "18:00"
-- }
```

### family_members

Users within a family. Links to Supabase Auth.

```sql
CREATE TYPE family_member_role_enum AS ENUM ('owner', 'adult', 'kid');

CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  auth_user_id UUID UNIQUE REFERENCES auth.users(id),
  
  -- Profile
  name TEXT NOT NULL,
  email TEXT,
  role family_member_role_enum NOT NULL DEFAULT 'adult',
  color TEXT DEFAULT '#6B7280', -- hex color for UI
  avatar_url TEXT,
  birthday DATE,
  
  -- Preferences (optional, for future personalization)
  preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_family_member UNIQUE (family_id, email)
);

CREATE INDEX idx_family_members_family ON family_members(family_id);
CREATE INDEX idx_family_members_auth ON family_members(auth_user_id);
```

---

## Task Management Tables

### tasks

The core unit of work.

```sql
CREATE TYPE task_status_enum AS ENUM (
  'inbox',
  'active',
  'waiting_for',
  'someday',
  'done'
);

CREATE TYPE recurrence_frequency_enum AS ENUM (
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'yearly',
  'custom'
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  
  -- Status
  status task_status_enum NOT NULL DEFAULT 'inbox',
  waiting_for TEXT, -- who/what we're waiting for (if status = waiting_for)
  
  -- Dates
  due_date DATE,
  scheduled_date DATE,
  start_date DATE, -- don't show until this date
  completed_at TIMESTAMPTZ,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_frequency recurrence_frequency_enum,
  recurrence_interval INTEGER DEFAULT 1, -- every X days/weeks/etc
  recurrence_days_of_week INTEGER[], -- for weekly: [0,2,4] = Sun, Tue, Thu
  recurrence_day_of_month INTEGER, -- for monthly: 15 = 15th of month
  recurrence_end_date DATE,
  recurrence_parent_id UUID REFERENCES tasks(id), -- links instances to template
  
  -- Relationships
  assigned_to_id UUID REFERENCES family_members(id),
  related_to_id UUID REFERENCES contacts(id), -- "about" this person
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  place_id UUID REFERENCES places(id) ON DELETE SET NULL,
  
  -- Metadata
  priority INTEGER DEFAULT 0, -- 0 = none, 1 = low, 2 = medium, 3 = high
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES family_members(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_tasks_family ON tasks(family_id);
CREATE INDEX idx_tasks_status ON tasks(family_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due ON tasks(family_id, due_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_project ON tasks(project_id) WHERE deleted_at IS NULL;
```

### subtasks

Simple checklist items within a task.

```sql
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
```

---

## Goals & Habits Tables

### goals

Objectives with a definition of done.

```sql
CREATE TYPE goal_status_enum AS ENUM (
  'active',
  'achieved',
  'abandoned'
);

CREATE TYPE goal_type_enum AS ENUM (
  'qualitative', -- just done/not done
  'quantitative' -- has target number
);

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  definition_of_done TEXT, -- clear criteria for completion
  
  -- Ownership
  owner_id UUID REFERENCES family_members(id),
  is_family_goal BOOLEAN DEFAULT false,
  
  -- Progress
  goal_type goal_type_enum DEFAULT 'qualitative',
  target_value NUMERIC, -- for quantitative: "read 50 books"
  current_value NUMERIC DEFAULT 0,
  unit TEXT, -- "books", "dollars", "pounds"
  
  -- Timing
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
```

### habits

Recurring practices to track.

```sql
CREATE TYPE habit_frequency_enum AS ENUM (
  'daily',
  'weekly',
  'custom'
);

CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  
  -- Schedule
  frequency habit_frequency_enum DEFAULT 'daily',
  target_days_per_week INTEGER, -- for weekly: aim for X days
  days_of_week INTEGER[], -- for custom: [1,3,5] = Mon, Wed, Fri
  
  -- Ownership
  owner_id UUID REFERENCES family_members(id),
  
  -- Relationship
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  
  -- Stats (denormalized for quick display)
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
```

### habit_logs

Daily check-ins for habits.

```sql
CREATE TYPE habit_log_status_enum AS ENUM (
  'done',
  'skipped',
  'missed'
);

CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  
  log_date DATE NOT NULL,
  status habit_log_status_enum NOT NULL,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_habit_log UNIQUE (habit_id, log_date)
);

CREATE INDEX idx_habit_logs_habit ON habit_logs(habit_id);
CREATE INDEX idx_habit_logs_date ON habit_logs(habit_id, log_date);
```

---

## Projects & Someday Tables

### projects

Containers for related tasks and notes.

```sql
CREATE TYPE project_status_enum AS ENUM (
  'planning',
  'active',
  'on_hold',
  'completed',
  'archived'
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT, -- rich text / markdown
  
  -- Status
  status project_status_enum DEFAULT 'planning',
  
  -- Ownership
  owner_id UUID REFERENCES family_members(id),
  
  -- Relationships
  promoted_from_id UUID REFERENCES someday_items(id) ON DELETE SET NULL,
  
  -- Dates
  target_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  color TEXT, -- optional project color
  icon TEXT, -- optional emoji
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES family_members(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_projects_family ON projects(family_id);
CREATE INDEX idx_projects_status ON projects(family_id, status) WHERE deleted_at IS NULL;
```

### someday_items

Wishlist / future ideas.

```sql
CREATE TYPE someday_category_enum AS ENUM (
  'trip',
  'purchase',
  'experience',
  'house',
  'other'
);

CREATE TABLE someday_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  
  -- Categorization
  category someday_category_enum DEFAULT 'other',
  
  -- Optional details
  estimated_cost NUMERIC,
  place_id UUID REFERENCES places(id) ON DELETE SET NULL,
  
  -- Who dreamed it up
  added_by_id UUID REFERENCES family_members(id),
  
  -- Status
  promoted_to_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  is_archived BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_someday_family ON someday_items(family_id);
CREATE INDEX idx_someday_category ON someday_items(family_id, category) WHERE deleted_at IS NULL;
```

---

## Milestones Table

### milestones

Celebratory moments to share at family meetings.

```sql
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  
  -- Who & When
  person_id UUID NOT NULL REFERENCES family_members(id),
  occurred_at DATE NOT NULL,
  
  -- For grouping in meetings
  week_year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM occurred_at)) STORED,
  week_number INTEGER GENERATED ALWAYS AS (EXTRACT(WEEK FROM occurred_at)) STORED,
  
  -- Optional link
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
```

---

## People & Libraries Tables

### contacts

Friends, extended family, non-vendor people.

```sql
CREATE TYPE contact_type_enum AS ENUM (
  'family', -- extended family
  'friend',
  'other'
);

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
  relationship TEXT, -- "Mike's college roommate", "Zelda's friend's mom"
  
  -- Address (optional)
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
```

### vendors

Service providers.

```sql
CREATE TYPE vendor_category_enum AS ENUM (
  'medical',
  'dental',
  'home',
  'auto',
  'financial',
  'legal',
  'childcare',
  'pet',
  'other'
);

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  category vendor_category_enum DEFAULT 'other',
  specialty TEXT, -- "pediatric dentist", "HVAC", "estate planning"
  
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
  notes TEXT, -- "Ask for Dr. Kim", "Best to call mornings"
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES family_members(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_vendors_family ON vendors(family_id);
CREATE INDEX idx_vendors_category ON vendors(family_id, category) WHERE deleted_at IS NULL;
```

### places

Locations for reference.

```sql
CREATE TYPE place_category_enum AS ENUM (
  'restaurant',
  'medical',
  'school',
  'activity',
  'travel',
  'shopping',
  'service',
  'other'
);

CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  category place_category_enum DEFAULT 'other',
  
  -- Location
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  
  -- Coordinates (for future map features)
  latitude NUMERIC,
  longitude NUMERIC,
  
  -- Details
  phone TEXT,
  website TEXT,
  notes TEXT, -- "Great patio", "Parking in back"
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES family_members(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_places_family ON places(family_id);
CREATE INDEX idx_places_category ON places(family_id, category) WHERE deleted_at IS NULL;
```

---

## Meal Planning Tables

### recipes

Recipe library.

```sql
CREATE TYPE recipe_difficulty_enum AS ENUM (
  'easy',
  'medium',
  'hard'
);

CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  
  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT, -- link to original recipe
  
  -- Details
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER,
  difficulty recipe_difficulty_enum DEFAULT 'medium',
  
  -- Content
  ingredients JSONB DEFAULT '[]'::jsonb, -- [{amount, unit, item}]
  instructions TEXT, -- markdown/rich text
  notes TEXT,
  
  -- Categorization
  cuisine TEXT, -- "Mexican", "Italian"
  meal_type TEXT[], -- ["dinner", "lunch"]
  dietary TEXT[], -- ["vegetarian", "gluten-free"]
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

-- ingredients JSON structure:
-- [
--   {"amount": "1", "unit": "lb", "item": "ground beef"},
--   {"amount": "2", "unit": "cups", "item": "rice"},
--   {"item": "salt to taste"}
-- ]
```

### meals

Planned meal instances.

```sql
CREATE TYPE meal_type_enum AS ENUM (
  'breakfast',
  'lunch',
  'dinner',
  'snack'
);

CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  
  -- When
  meal_date DATE NOT NULL,
  meal_type meal_type_enum NOT NULL,
  
  -- What
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  title TEXT, -- if no recipe, just a description
  notes TEXT,
  
  -- Who's cooking
  assigned_to_id UUID REFERENCES family_members(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_meal UNIQUE (family_id, meal_date, meal_type)
);

CREATE INDEX idx_meals_family ON meals(family_id);
CREATE INDEX idx_meals_date ON meals(family_id, meal_date);
```

---

## Family Meeting Tables

### meeting_notes

Records of family meetings.

```sql
CREATE TABLE meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  
  -- When
  meeting_date DATE NOT NULL,
  
  -- Content
  notes TEXT, -- markdown
  decisions TEXT, -- key decisions made
  
  -- Metadata
  attendees UUID[], -- family_member ids
  duration_minutes INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES family_members(id)
);

CREATE INDEX idx_meeting_notes_family ON meeting_notes(family_id);
CREATE INDEX idx_meeting_notes_date ON meeting_notes(family_id, meeting_date);
```

---

## Flexible Tagging (Future)

### tags

For cross-cutting concerns beyond the built-in tags arrays.

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_tag UNIQUE (family_id, name)
);

-- Polymorphic join table (if needed beyond arrays)
CREATE TABLE taggables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  taggable_type TEXT NOT NULL, -- 'task', 'project', 'recipe'
  taggable_id UUID NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_taggable UNIQUE (tag_id, taggable_type, taggable_id)
);

CREATE INDEX idx_taggables_lookup ON taggables(taggable_type, taggable_id);
```

---

## Row Level Security (RLS)

All tables must have RLS enabled. Here's the pattern:

```sql
-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their family's data
CREATE POLICY "Users can view own family data" ON tasks
  FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Users can insert to their family
CREATE POLICY "Users can insert to own family" ON tasks
  FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Users can update their family's data
CREATE POLICY "Users can update own family data" ON tasks
  FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Users can delete their family's data
CREATE POLICY "Users can delete own family data" ON tasks
  FOR DELETE
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE auth_user_id = auth.uid()
    )
  );
```

---

## Helper Functions

### Get current user's family_id

```sql
CREATE OR REPLACE FUNCTION get_my_family_id()
RETURNS UUID AS $$
  SELECT family_id FROM family_members
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
```

### Update streak on habit completion

```sql
CREATE OR REPLACE FUNCTION update_habit_streak()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' THEN
    UPDATE habits
    SET 
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
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
```

### Generate next recurring task instance

```sql
-- This would be called by an edge function or cron job
CREATE OR REPLACE FUNCTION generate_next_recurring_task(task_id UUID)
RETURNS UUID AS $$
DECLARE
  source_task tasks%ROWTYPE;
  next_date DATE;
  new_task_id UUID;
BEGIN
  SELECT * INTO source_task FROM tasks WHERE id = task_id;
  
  -- Calculate next date based on recurrence pattern
  -- (simplified - full logic would handle all patterns)
  CASE source_task.recurrence_frequency
    WHEN 'daily' THEN
      next_date := source_task.due_date + (source_task.recurrence_interval || ' days')::INTERVAL;
    WHEN 'weekly' THEN
      next_date := source_task.due_date + (source_task.recurrence_interval * 7 || ' days')::INTERVAL;
    WHEN 'monthly' THEN
      next_date := source_task.due_date + (source_task.recurrence_interval || ' months')::INTERVAL;
    WHEN 'yearly' THEN
      next_date := source_task.due_date + (source_task.recurrence_interval || ' years')::INTERVAL;
  END CASE;
  
  -- Don't create if past end date
  IF source_task.recurrence_end_date IS NOT NULL AND next_date > source_task.recurrence_end_date THEN
    RETURN NULL;
  END IF;
  
  -- Create new instance
  INSERT INTO tasks (
    family_id, title, description, status, due_date, scheduled_date,
    is_recurring, recurrence_frequency, recurrence_interval, recurrence_end_date,
    recurrence_parent_id, assigned_to_id, project_id, goal_id, priority, tags, created_by
  )
  VALUES (
    source_task.family_id, source_task.title, source_task.description, 'active', next_date, next_date,
    source_task.is_recurring, source_task.recurrence_frequency, source_task.recurrence_interval, source_task.recurrence_end_date,
    COALESCE(source_task.recurrence_parent_id, source_task.id), source_task.assigned_to_id, source_task.project_id, source_task.goal_id, source_task.priority, source_task.tags, source_task.created_by
  )
  RETURNING id INTO new_task_id;
  
  RETURN new_task_id;
END;
$$ LANGUAGE plpgsql;
```

---

## Indexes Summary

Key indexes for common queries:

| Query Pattern | Index |
|--------------|-------|
| Dashboard: today's tasks by family | `idx_tasks_due` |
| My assigned tasks | `idx_tasks_assigned` |
| Tasks in a project | `idx_tasks_project` |
| Habits for a person | `idx_habits_owner` |
| This week's milestones | `idx_milestones_week` |
| Upcoming birthdays | `idx_contacts_birthday` |
| Recipes by tag | `idx_recipes_tags` (GIN) |
| Meals for a date range | `idx_meals_date` |

---

## Migration Order

When creating tables, use this order to respect foreign key dependencies:

1. `families`
2. `family_members`
3. `places`
4. `contacts`
5. `vendors`
6. `goals`
7. `habits`
8. `habit_logs`
9. `someday_items`
10. `projects`
11. `tasks`
12. `subtasks`
13. `milestones`
14. `recipes`
15. `meals`
16. `meeting_notes`
17. `tags`
18. `taggables`

---

## Future Considerations

### AI Integration Points
- `tasks.ai_suggested` BOOLEAN - flag AI-generated suggestions
- `recipes.ai_generated` BOOLEAN - flag AI-generated recipes
- `ai_logs` table - track AI interactions for improvement

### File Attachments (v2)
- `attachments` table with polymorphic relationship
- Supabase Storage integration

### Calendar Sync (v1.5)
- `external_events` table for Google Calendar items
- `sync_tokens` table for incremental sync

---

---

## 🚀 Implementation Status

> **Status: ✅ FULLY IMPLEMENTED**

The complete database schema has been implemented in `supabase/migrations/001_initial_schema.sql`.

### Tables Implemented

| Table | Status | RLS | Notes |
|-------|--------|-----|-------|
| `families` | ✅ | ✅ | Top-level container |
| `family_members` | ✅ | ✅ | Users linked to auth |
| `tasks` | ✅ | ✅ | Full schema with recurrence |
| `subtasks` | ✅ | ✅ | Checklist items |
| `habits` | ✅ | ✅ | With streak tracking |
| `habit_logs` | ✅ | ✅ | Daily check-ins |
| `goals` | ✅ | ✅ | Qualitative & quantitative |
| `projects` | ✅ | ✅ | With someday promotion |
| `someday_items` | ✅ | ✅ | Wishlist items |
| `milestones` | ✅ | ✅ | With week grouping |
| `contacts` | ✅ | ✅ | Extended family/friends |
| `vendors` | ✅ | ✅ | Service providers |
| `places` | ✅ | ✅ | Locations |
| `recipes` | ✅ | ✅ | With ingredients JSONB |
| `meals` | ✅ | ✅ | Meal planning |
| `meeting_notes` | ✅ | ✅ | Family meetings |
| `family_invites` | ✅ | ✅ | Invite system |

### Helper Functions Implemented

| Function | Status | Purpose |
|----------|--------|---------|
| `get_my_family_id()` | ✅ | Get current user's family |
| `get_my_member_id()` | ✅ | Get current user's member ID |
| `get_my_role()` | ✅ | Get current user's role |
| `is_adult_or_owner()` | ✅ | Check permissions |
| `update_habit_streak()` | ✅ | Trigger for streak updates |

### Enums Implemented

All 14 enums from the spec are implemented:
- `family_member_role_enum`, `task_status_enum`, `recurrence_frequency_enum`
- `goal_status_enum`, `goal_type_enum`, `habit_frequency_enum`, `habit_log_status_enum`
- `project_status_enum`, `someday_category_enum`, `contact_type_enum`
- `vendor_category_enum`, `place_category_enum`, `recipe_difficulty_enum`, `meal_type_enum`

### How to Deploy

```bash
# In your Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Paste contents of: supabase/migrations/001_initial_schema.sql
# 3. Click "Run"
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-23 | Hazel + Claude | Initial schema |
| 1.1 | 2024-12-23 | Claude | Added implementation status |
| 1.2 | 2024-12-23 | Claude | Auth updated to magic link (no password storage needed) |
