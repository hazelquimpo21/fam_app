/**
 * ============================================================================
 * 🏠 FAM - Database Types
 * ============================================================================
 *
 * This file contains TypeScript types that mirror our Supabase database schema.
 * These types ensure type safety when working with database operations.
 *
 * 💡 TIP: If you change the database schema, update these types too!
 *
 * ============================================================================
 */

// Profile types are defined separately for modularity
import type { FamilyProfile, MemberProfile } from '@/types/profiles';

// ============================================================================
// 📦 ENUMS - These match the database enums exactly
// ============================================================================

/** Family member roles determine what actions they can perform */
export type FamilyMemberRole = 'owner' | 'adult' | 'kid';

/** Task workflow states - from captured to completed */
export type TaskStatus = 'inbox' | 'active' | 'waiting_for' | 'someday' | 'done';

/** How often tasks/habits repeat */
export type RecurrenceFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'custom';

/** Goal completion states */
export type GoalStatus = 'active' | 'achieved' | 'abandoned';

/** Whether goal is measurable or just done/not done */
export type GoalType = 'qualitative' | 'quantitative';

/** How often habits should be done */
export type HabitFrequency = 'daily' | 'weekly' | 'custom';

/** Daily habit check-in status */
export type HabitLogStatus = 'done' | 'skipped' | 'missed';

/** Project lifecycle states */
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';

/** Categories for someday items (dreams & wishes) */
export type SomedayCategory = 'trip' | 'purchase' | 'experience' | 'house' | 'other';

/** Types of contacts (extended family, friends) */
export type ContactType = 'family' | 'friend' | 'other';

/** Categories for vendors (service providers) */
export type VendorCategory =
  | 'medical'
  | 'dental'
  | 'home'
  | 'auto'
  | 'financial'
  | 'legal'
  | 'childcare'
  | 'pet'
  | 'other';

/** Categories for saved places */
export type PlaceCategory =
  | 'restaurant'
  | 'medical'
  | 'school'
  | 'activity'
  | 'travel'
  | 'shopping'
  | 'service'
  | 'other';

/** Recipe difficulty levels */
export type RecipeDifficulty = 'easy' | 'medium' | 'hard';

/** Meal times of day */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';


// ============================================================================
// 👨‍👩‍👧‍👦 CORE ENTITIES
// ============================================================================

/** A family is the top-level container for all data */
export interface Family {
  id: string;
  name: string;
  settings: FamilySettings;
  /** Rich family profile for personalization - see types/profiles.ts */
  profile: FamilyProfile;
  created_at: string;
  updated_at: string;
}

/** Family settings stored as JSON */
export interface FamilySettings {
  timezone?: string;         // e.g., "America/Chicago"
  week_starts_on?: 'sunday' | 'monday';
  meeting_day?: string;      // e.g., "sunday"
  meeting_time?: string;     // e.g., "18:00"
}

/** A person in the family */
export interface FamilyMember {
  id: string;
  family_id: string;
  auth_user_id: string | null;
  name: string;
  email: string | null;
  role: FamilyMemberRole;
  color: string;             // Hex color like "#6366F1"
  avatar_url: string | null;
  birthday: string | null;   // ISO date string
  preferences: Record<string, unknown>;
  /** Rich member profile for personalization - see types/profiles.ts */
  profile: MemberProfile;
  created_at: string;
  updated_at: string;
}


// ============================================================================
// ✅ TASKS
// ============================================================================

/** A task is a one-time item of work */
export interface Task {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  waiting_for: string | null;

  // Dates
  due_date: string | null;       // YYYY-MM-DD
  scheduled_date: string | null; // YYYY-MM-DD
  start_date: string | null;     // YYYY-MM-DD
  completed_at: string | null;   // ISO timestamp

  // Recurrence
  is_recurring: boolean;
  recurrence_frequency: RecurrenceFrequency | null;
  recurrence_interval: number | null;
  recurrence_days_of_week: number[] | null;
  recurrence_day_of_month: number | null;
  recurrence_end_date: string | null;
  recurrence_parent_id: string | null;

  // Relationships
  assigned_to_id: string | null;
  related_to_id: string | null;
  project_id: string | null;
  goal_id: string | null;
  place_id: string | null;

  // Metadata
  priority: number;
  tags: string[];

  // Timestamps
  created_at: string;
  updated_at: string;
  created_by: string | null;
  deleted_at: string | null;

  // Joined data (populated by queries)
  assigned_to?: FamilyMember | null;
  project?: Project | null;
  goal?: Goal | null;
  subtasks?: Subtask[];
}

/** A checklist item within a task */
export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_complete: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}


// ============================================================================
// 🔄 HABITS
// ============================================================================

/** An ongoing practice to track for consistency */
export interface Habit {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  frequency: HabitFrequency;
  target_days_per_week: number | null;
  days_of_week: number[] | null;  // 0=Sun, 1=Mon, etc.
  owner_id: string | null;
  goal_id: string | null;
  current_streak: number;
  longest_streak: number;
  last_completed_at: string | null;  // YYYY-MM-DD
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  deleted_at: string | null;

  // Joined data
  owner?: FamilyMember | null;
  goal?: Goal | null;
}

/** A single check-in for a habit on a specific day */
export interface HabitLog {
  id: string;
  habit_id: string;
  log_date: string;  // YYYY-MM-DD
  status: HabitLogStatus;
  notes: string | null;
  created_at: string;
}


// ============================================================================
// 🎯 GOALS
// ============================================================================

/** An outcome to work toward */
export interface Goal {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  definition_of_done: string | null;
  owner_id: string | null;
  is_family_goal: boolean;
  goal_type: GoalType;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  status: GoalStatus;
  target_date: string | null;  // YYYY-MM-DD
  achieved_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
  deleted_at: string | null;

  // Joined data
  owner?: FamilyMember | null;
}


// ============================================================================
// 📁 PROJECTS
// ============================================================================

/** A container for related tasks */
export interface Project {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  notes: string | null;
  status: ProjectStatus;
  owner_id: string | null;
  promoted_from_id: string | null;
  target_date: string | null;
  completed_at: string | null;
  color: string | null;
  icon: string | null;  // Emoji
  tags: string[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
  deleted_at: string | null;

  // Joined data
  owner?: FamilyMember | null;
}


// ============================================================================
// ✨ SOMEDAY ITEMS
// ============================================================================

/** A dream or wish for the future */
export interface SomedayItem {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  category: SomedayCategory;
  estimated_cost: number | null;
  place_id: string | null;
  added_by_id: string | null;
  promoted_to_project_id: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}


// ============================================================================
// 🎉 MILESTONES
// ============================================================================

/** A noteworthy achievement worth celebrating */
export interface Milestone {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  person_id: string;
  occurred_at: string;  // YYYY-MM-DD
  week_year: number;
  week_number: number;
  goal_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  deleted_at: string | null;

  // Joined data
  person?: FamilyMember | null;
}


// ============================================================================
// 👥 PEOPLE & PLACES
// ============================================================================

/** A person outside the family */
export interface Contact {
  id: string;
  family_id: string;
  name: string;
  contact_type: ContactType;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  anniversary: string | null;
  notes: string | null;
  relationship: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  deleted_at: string | null;
}

/** A service provider */
export interface Vendor {
  id: string;
  family_id: string;
  name: string;
  category: VendorCategory;
  specialty: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  place_id: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  last_used_at: string | null;
  notes: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  deleted_at: string | null;
}

/** A saved location */
export interface Place {
  id: string;
  family_id: string;
  name: string;
  category: PlaceCategory;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  deleted_at: string | null;
}


// ============================================================================
// 🍳 MEALS & RECIPES
// ============================================================================

/** A saved recipe */
export interface Recipe {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  source_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  difficulty: RecipeDifficulty;
  ingredients: RecipeIngredient[];
  instructions: string | null;
  notes: string | null;
  cuisine: string | null;
  meal_type: string[] | null;
  dietary: string[] | null;
  tags: string[];
  image_url: string | null;
  times_made: number;
  last_made_at: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  deleted_at: string | null;
}

/** An ingredient in a recipe */
export interface RecipeIngredient {
  amount: string;
  unit: string;
  item: string;
}

/** A planned meal */
export interface Meal {
  id: string;
  family_id: string;
  meal_date: string;  // YYYY-MM-DD
  meal_type: MealType;
  recipe_id: string | null;
  title: string | null;
  notes: string | null;
  assigned_to_id: string | null;
  created_at: string;
  updated_at: string;

  // Joined data
  recipe?: Recipe | null;
  assigned_to?: FamilyMember | null;
}


// ============================================================================
// 👥 MEETINGS
// ============================================================================

/** Notes from a family meeting */
export interface MeetingNote {
  id: string;
  family_id: string;
  meeting_date: string;  // YYYY-MM-DD
  notes: string | null;
  decisions: string | null;
  attendees: string[] | null;  // family_member ids
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}


// ============================================================================
// 🎟️ INVITES
// ============================================================================

/** An invitation to join a family */
export interface FamilyInvite {
  id: string;
  family_id: string;
  email: string;
  role: FamilyMemberRole;
  token: string;
  created_by: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
}
