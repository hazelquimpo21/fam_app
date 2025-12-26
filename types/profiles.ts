/**
 * ============================================================================
 * 🎭 FAM - Profile Type Definitions
 * ============================================================================
 *
 * TypeScript types for family and member profiles. These enable rich
 * personalization and AI context building.
 *
 * Design Philosophy:
 * - Profiles should feel like building a scrapbook, not filling out forms
 * - Progressive disclosure - not all fields need to be filled
 * - Every field enables some form of personalization
 *
 * Reference: AI_Dev_Docs/15-profile-architecture.md
 *
 * ============================================================================
 */

// ============================================================================
// 🏠 FAMILY PROFILE TYPES
// ============================================================================

/**
 * Family tradition structure
 * Traditions are recurring family activities that define family culture
 *
 * @example
 * {
 *   id: 'abc123',
 *   name: 'Friday Movie Night',
 *   frequency: 'weekly',
 *   description: 'We watch a movie together every Friday',
 *   day_of_week: 5
 * }
 */
export interface Tradition {
  /** Unique identifier for the tradition */
  id: string;
  /** Name of the tradition */
  name: string;
  /** How often the tradition occurs */
  frequency: 'weekly' | 'monthly' | 'yearly' | 'special';
  /** Optional description of the tradition */
  description?: string;
  /** For weekly traditions: day of week (0=Sunday, 6=Saturday) */
  day_of_week?: number;
  /** For monthly traditions: day of month (1-31) */
  day_of_month?: number;
  /** For yearly traditions: month (1-12) */
  month?: number;
}

/**
 * Family pet structure
 * Pets are important family members too!
 */
export interface Pet {
  /** Pet's name */
  name: string;
  /** Type of pet */
  type: 'dog' | 'cat' | 'fish' | 'bird' | 'hamster' | 'rabbit' | 'other';
  /** Optional emoji for the pet */
  emoji?: string;
  /** Optional notes about the pet */
  notes?: string;
}

/**
 * Decision making styles for family governance
 */
export type DecisionStyle = 'adults' | 'family_vote' | 'consensus';

/**
 * Family communication style preferences
 */
export type CommunicationStyle = 'direct' | 'gentle' | 'playful';

/**
 * Family life stages based on children's ages
 */
export type LifeStage =
  | 'young_kids'    // 0-5 years
  | 'elementary'    // 6-10 years
  | 'tweens'        // 11-13 years
  | 'teens'         // 14-17 years
  | 'mixed'         // Multiple age groups
  | 'empty_nest';   // Adult children

/**
 * Home types for household context
 */
export type HomeType =
  | 'apartment'
  | 'condo'
  | 'house'
  | 'house_with_yard'
  | 'rural';

/**
 * Travel style preferences
 */
export type TravelStyle = 'adventure' | 'relaxation' | 'cultural' | 'mixed';

/**
 * Activity level preferences
 */
export type ActivityLevel = 'low' | 'moderate' | 'high';

/**
 * AI tone preferences for generated content
 */
export type AITone = 'encouraging' | 'direct' | 'playful' | 'minimal';

/**
 * How often the AI should proactively make suggestions
 */
export type SuggestionFrequency = 'minimal' | 'moderate' | 'proactive';

/**
 * Complete family profile structure
 * Stored as JSONB in families.profile column
 *
 * All fields are optional to support progressive disclosure.
 * Families can fill in what they want, when they want.
 */
export interface FamilyProfile {
  // ━━━━━ Identity ━━━━━
  /** Family nickname (e.g., "Team J", "The Chaos Crew") */
  nickname?: string;
  /** Family motto or slogan */
  motto?: string;
  /** Representative emoji for the family */
  emoji?: string;
  /** When parents/partners got together */
  anniversary_date?: string;
  /** When the family moved to their current home */
  home_since?: string;

  // ━━━━━ Values & Culture ━━━━━
  /** Core family values (e.g., ["education", "adventure", "health"]) */
  core_values?: string[];
  /** Theme for the current year (e.g., "Year of Yes") */
  yearly_theme?: string;
  /** How the family makes big decisions */
  decision_style?: DecisionStyle;
  /** Family's communication style */
  communication_style?: CommunicationStyle;

  // ━━━━━ Traditions ━━━━━
  /** Family traditions and rituals */
  traditions?: Tradition[];

  // ━━━━━ Household Context ━━━━━
  /** Current life stage of the family */
  life_stage?: LifeStage;
  /** Type of home */
  home_type?: HomeType;
  /** General location/region for seasonal suggestions */
  region?: string;
  /** Languages spoken at home */
  languages?: string[];

  // ━━━━━ Pets ━━━━━
  /** Family pets */
  pets?: Pet[];

  // ━━━━━ Shared Interests ━━━━━
  /** Activities the family enjoys together */
  shared_interests?: string[];
  /** Cuisine preferences for meal planning */
  cuisine_preferences?: string[];
  /** Family-wide dietary restrictions */
  dietary_restrictions?: string[];
  /** Family's travel style preference */
  travel_style?: TravelStyle;
  /** Overall activity level preference */
  activity_level?: ActivityLevel;

  // ━━━━━ Narrative ━━━━━
  /** Free-form "About Us" story */
  family_story?: string;

  // ━━━━━ AI Preferences ━━━━━
  /** Preferred tone for AI-generated content */
  ai_tone?: AITone;
  /** How often AI should make proactive suggestions */
  suggestion_frequency?: SuggestionFrequency;
}


// ============================================================================
// 👤 MEMBER PROFILE TYPES
// ============================================================================

/**
 * Personality type archetypes
 * Based on common behavioral patterns
 */
export type PersonalityType =
  | 'The Organizer'   // Detail-oriented, loves planning
  | 'The Creative'    // Artistic, innovative thinker
  | 'The Connector'   // Social, relationship-focused
  | 'The Thinker'     // Analytical, thoughtful
  | 'The Adventurer'  // Spontaneous, loves new experiences
  | 'The Supporter'   // Nurturing, puts others first
  | string;           // Allow custom types

/**
 * Energy style (introversion/extroversion spectrum)
 */
export type EnergyType = 'introvert' | 'ambivert' | 'extrovert';

/**
 * Sleep/work timing preference
 */
export type Chronotype = 'morning' | 'night' | 'flexible';

/**
 * Approach to planning
 */
export type PlanningStyle = 'planner' | 'spontaneous' | 'mixed';

/**
 * The 5 love languages
 */
export type LoveLanguage = 'words' | 'acts' | 'gifts' | 'time' | 'touch';

/**
 * Learning style preferences
 */
export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading';

/**
 * Preferred reminder urgency level
 */
export type ReminderStyle = 'gentle' | 'direct' | 'urgent';

/**
 * Best time for focused work
 */
export type FocusTime = 'morning' | 'afternoon' | 'evening';

/**
 * Notification batching preference
 */
export type NotificationPreference = 'realtime' | 'batched' | 'minimal';

/**
 * Work arrangement type
 */
export type WorkStyle = 'office' | 'remote' | 'hybrid' | 'other';

/**
 * Sleep schedule preferences
 */
export interface SleepSchedule {
  /** Target bedtime (e.g., "22:00") */
  target_bedtime?: string;
  /** Target wake time (e.g., "06:00") */
  target_waketime?: string;
}

/**
 * Complete member profile structure
 * Stored as JSONB in family_members.profile column
 *
 * Supports both adults and kids with appropriate fields for each.
 * All fields are optional to support progressive disclosure.
 */
export interface MemberProfile {
  // ━━━━━ Personality ━━━━━
  /** Personality archetype */
  personality_type?: PersonalityType;
  /** Introvert/extrovert spectrum */
  energy_type?: EnergyType;
  /** Morning person or night owl */
  chronotype?: Chronotype;
  /** Approach to planning */
  planning_style?: PlanningStyle;
  /** How they handle stress */
  stress_response?: string;

  // ━━━━━ Strengths & Growth ━━━━━
  /** Personal superpowers */
  strengths?: string[];
  /** Areas they're working on improving */
  growth_areas?: string[];
  /** Preferred way to learn new things */
  learning_style?: LearningStyle;

  // ━━━━━ Motivation ━━━━━
  /** How they feel most appreciated */
  love_language?: LoveLanguage;
  /** What drives them */
  motivated_by?: string[];
  /** How they recharge */
  recharged_by?: string[];

  // ━━━━━ Interests ━━━━━
  /** Long-term hobbies and interests */
  hobbies?: string[];
  /** What they're currently excited about */
  current_interests?: string[];
  /** Favorite types of food */
  favorite_cuisines?: string[];
  /** Go-to comfort foods */
  comfort_foods?: string[];

  // ━━━━━ Health & Wellness ━━━━━
  /** Dietary restrictions and preferences */
  dietary_restrictions?: string[];
  /** Food or environmental allergies */
  allergies?: string[];
  /** Sleep goals */
  sleep_schedule?: SleepSchedule;
  /** Preferred exercise activities */
  exercise_preferences?: string[];

  // ━━━━━ Communication ━━━━━
  /** How they prefer to receive reminders */
  reminder_style?: ReminderStyle;
  /** Best time for focused work */
  best_focus_time?: FocusTime;
  /** How they want notifications delivered */
  notification_preference?: NotificationPreference;
  /** Preferred AI tone for this person */
  preferred_ai_tone?: AITone;

  // ━━━━━ Life Context (Adults) ━━━━━
  /** Job title or occupation */
  occupation?: string;
  /** Work arrangement */
  work_style?: WorkStyle;
  /** Times of year that are particularly busy */
  busy_seasons?: string[];

  // ━━━━━ Life Context (Kids) ━━━━━
  /** School name */
  school_name?: string;
  /** Current grade level */
  grade?: string;
  /** Favorite school subjects */
  favorite_subjects?: string[];
  /** Extracurricular activities */
  activities?: string[];

  // ━━━━━ Narrative ━━━━━
  /** Free-form "About Me" bio */
  bio?: string;

  // ━━━━━ Quick Preferences ━━━━━
  /** Things they don't like */
  dislikes?: string[];
  /** Areas where they need support (especially for kids) */
  needs_help_with?: string[];
}


// ============================================================================
// 🛠️ PROFILE UTILITY TYPES
// ============================================================================

/**
 * Partial update to a family profile
 * Used when updating only specific fields
 */
export type FamilyProfileUpdate = Partial<FamilyProfile>;

/**
 * Partial update to a member profile
 * Used when updating only specific fields
 */
export type MemberProfileUpdate = Partial<MemberProfile>;

/**
 * Profile section for organizing UI
 */
export type FamilyProfileSection =
  | 'identity'
  | 'values'
  | 'traditions'
  | 'household'
  | 'interests'
  | 'ai';

export type MemberProfileSection =
  | 'personality'
  | 'strengths'
  | 'motivation'
  | 'interests'
  | 'health'
  | 'communication'
  | 'life_context';


// ============================================================================
// 📊 PROFILE COMPLETION TRACKING
// ============================================================================

/**
 * Profile completion info for progress indicators
 */
export interface ProfileCompletion {
  /** Percentage complete (0-100) */
  percentage: number;
  /** Sections that are complete */
  completeSections: string[];
  /** Sections that need more info */
  incompleteSections: string[];
  /** Next suggested section to complete */
  nextSuggestion?: string;
}


// ============================================================================
// 🔮 AI CONTEXT BUILDING
// ============================================================================

/**
 * Context object built from profiles for AI prompts
 * This is what gets passed to AI for personalization
 */
export interface AIProfileContext {
  family: {
    name: string;
    nickname?: string;
    communication_style?: CommunicationStyle;
    ai_tone?: AITone;
    values?: string[];
    life_stage?: LifeStage;
    shared_interests?: string[];
  };
  member: {
    name: string;
    is_kid: boolean;
    personality_type?: PersonalityType;
    love_language?: LoveLanguage;
    preferred_tone?: AITone;
    chronotype?: Chronotype;
    strengths?: string[];
    dietary_restrictions?: string[];
    allergies?: string[];
  };
}


// ============================================================================
// 🎨 PREDEFINED OPTIONS FOR UI
// ============================================================================

/**
 * Predefined core values for the value picker
 */
export const CORE_VALUES = [
  'education',
  'adventure',
  'health',
  'creativity',
  'faith',
  'quality_time',
  'independence',
  'kindness',
  'financial_security',
  'fun_and_play',
  'honesty',
  'respect',
  'hard_work',
  'community',
  'nature',
] as const;

/**
 * Predefined strengths for the strength picker
 */
export const STRENGTHS = [
  'organization',
  'patience',
  'creativity',
  'problem_solving',
  'communication',
  'empathy',
  'focus',
  'humor',
  'leadership',
  'adaptability',
  'persistence',
  'attention_to_detail',
] as const;

/**
 * Predefined hobbies/interests
 */
export const COMMON_INTERESTS = [
  'reading',
  'hiking',
  'cooking',
  'board_games',
  'movies',
  'music',
  'gardening',
  'sports',
  'travel',
  'photography',
  'arts_crafts',
  'video_games',
  'yoga',
  'cycling',
  'swimming',
] as const;

/**
 * Common dietary restrictions
 */
export const DIETARY_RESTRICTIONS = [
  'vegetarian',
  'vegan',
  'gluten_free',
  'dairy_free',
  'nut_free',
  'kosher',
  'halal',
  'low_carb',
  'pescatarian',
  'keto',
] as const;
