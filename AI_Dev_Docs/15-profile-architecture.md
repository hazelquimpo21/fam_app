# Fam — Profile Architecture & AI Personalization

## Overview

This document defines the architecture for **Family Profiles** and **User Profiles** in Fam. These rich profiles serve two purposes:

1. **Human Delight** — Help families feel seen, understood, and celebrated for who they are
2. **AI Foundation** — Enable intelligent, personalized suggestions, reminders, and content generation

> **Design Philosophy:** Profiles should feel like building a family scrapbook, not filling out a government form. Progressive disclosure, delightful prompts, and immediate value.

---

## The Profile Vision

### Why Profiles Matter

Current state: Fam knows *what* families do (tasks, habits, goals) but not *who* they are.

Future state: Fam understands family dynamics, individual personalities, shared values, and can generate truly personalized experiences.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         THE PERSONALIZATION PYRAMID                      │
│                                                                          │
│                              ┌─────────┐                                 │
│                              │   AI    │  ← Generates personalized      │
│                              │ Output  │    content, suggestions        │
│                              └────┬────┘                                 │
│                                   │                                      │
│                         ┌─────────┴─────────┐                           │
│                         │   Rich Profiles   │  ← WHO they are           │
│                         │  Family + Member  │    Values, personality    │
│                         └─────────┬─────────┘                           │
│                                   │                                      │
│                    ┌──────────────┴──────────────┐                      │
│                    │     Activity & Behavior     │  ← WHAT they do      │
│                    │  Tasks, Habits, Goals, etc. │    Patterns, prefs   │
│                    └──────────────┬──────────────┘                      │
│                                   │                                      │
│              ┌────────────────────┴────────────────────┐                │
│              │           Core Identity                  │  ← WHO exists │
│              │   Family name, members, roles, colors    │    Basic info │
│              └──────────────────────────────────────────┘                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Progressive Discovery** — Don't ask for everything upfront. Reveal profile sections over time as users engage with features.

2. **Immediate Value** — Every piece of profile data should unlock visible personalization. "Because you said you love hiking, here's a someday idea..."

3. **Delight Over Data** — Prompts should spark joy. "What's a family inside joke?" beats "Enter family notes."

4. **Organic Collection** — Infer what you can from behavior. Ask only what you can't observe.

5. **Privacy-First** — Clear about what data is used for. Family-scoped. Never shared.

6. **Kid-Appropriate** — Simplified profiles for children. Age-appropriate questions.

---

## Family Profile

### What It Captures

The Family Profile represents the household as a unit — shared identity, values, and culture.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FAMILY PROFILE                                 │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 🏠 IDENTITY                                                          ││
│  │ • Family name: "The Johnsons"                                       ││
│  │ • Family nickname: "Team J" / "The Chaos Crew"                      ││
│  │ • Family motto: "Adventure awaits!"                                 ││
│  │ • Family emoji: 🌟                                                  ││
│  │ • Anniversary: June 15, 2015                                        ││
│  │ • Home since: March 2018                                            ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 💫 VALUES & PRIORITIES                                               ││
│  │ • Top values: [Education] [Adventure] [Quality Time] [Health]       ││
│  │ • This year's theme: "Year of Yes"                                  ││
│  │ • Decision style: ○ Adults decide  ● Family votes  ○ Consensus     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 🎉 TRADITIONS & RITUALS                                              ││
│  │ • Weekly: Friday movie night, Sunday brunch                         ││
│  │ • Monthly: First Saturday = adventure day                           ││
│  │ • Annual: Summer camping trip, Holiday cookie baking                ││
│  │ • Special: Birthday person chooses dinner                           ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 🏡 HOUSEHOLD                                                         ││
│  │ • Life stage: [Young Kids] [Tweens] [Teens] [Mixed] [Empty Nest]   ││
│  │ • Home type: House with yard                                        ││
│  │ • Location/Region: Midwest USA                                      ││
│  │ • Languages: English, learning Spanish                              ││
│  │ • Pets: 🐕 Max (golden retriever), 🐱 Luna (tabby)                 ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 🎯 SHARED INTERESTS                                                  ││
│  │ • Activities: [Hiking] [Board Games] [Cooking] [Movies]            ││
│  │ • Cuisine preferences: Mexican, Italian, Asian                      ││
│  │ • Travel style: Adventure > Relaxation                              ││
│  │ • Weekend vibe: Mix of activity and downtime                        ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 📝 FAMILY STORY                                                      ││
│  │ Free-form narrative: "We're a curious bunch who loves trying        ││
│  │ new things. Dad's the planner, Mom's the spontaneous one, and       ││
│  │ the kids keep us laughing. Our best memories involve getting        ││
│  │ slightly lost on road trips..."                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Family Profile Data Model

```typescript
interface FamilyProfile {
  // Identity
  nickname?: string;              // "Team J", "The Chaos Crew"
  motto?: string;                 // "Adventure awaits!"
  emoji?: string;                 // Family emoji/icon
  anniversary_date?: string;      // When parents/partners got together
  home_since?: string;            // When they moved to current home

  // Values & Culture
  core_values?: string[];         // ["education", "adventure", "health", "creativity"]
  yearly_theme?: string;          // "Year of Yes", "Simplify 2025"
  decision_style?: 'adults' | 'family_vote' | 'consensus';
  communication_style?: 'direct' | 'gentle' | 'playful';

  // Traditions (structured for AI to suggest activities)
  traditions?: Tradition[];

  // Household Context
  life_stage?: 'young_kids' | 'elementary' | 'tweens' | 'teens' | 'mixed' | 'empty_nest';
  home_type?: 'apartment' | 'condo' | 'house' | 'house_with_yard' | 'rural';
  region?: string;                // General location for seasonal suggestions
  languages?: string[];           // Languages spoken at home
  pets?: Pet[];

  // Interests & Preferences
  shared_interests?: string[];    // ["hiking", "board_games", "movies"]
  cuisine_preferences?: string[]; // ["mexican", "italian", "asian"]
  dietary_restrictions?: string[]; // Family-wide (individual in member profile)
  travel_style?: 'adventure' | 'relaxation' | 'cultural' | 'mixed';
  activity_level?: 'low' | 'moderate' | 'high';

  // Narrative
  family_story?: string;          // Free-form "About Us"

  // AI Preferences
  ai_tone?: 'encouraging' | 'direct' | 'playful' | 'gentle';
  suggestion_frequency?: 'minimal' | 'moderate' | 'proactive';
}

interface Tradition {
  id: string;
  name: string;                   // "Friday Movie Night"
  frequency: 'weekly' | 'monthly' | 'yearly' | 'special';
  description?: string;
  day_of_week?: number;           // For weekly traditions
  month?: number;                 // For yearly traditions
}

interface Pet {
  name: string;
  type: 'dog' | 'cat' | 'fish' | 'bird' | 'hamster' | 'other';
  emoji?: string;
}
```

---

## User/Member Profile

### What It Captures

Each family member has a rich profile capturing their personality, preferences, and what makes them tick.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MEMBER PROFILE: Hazel                             │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 👤 IDENTITY (existing)                                               ││
│  │ • Name: Hazel Johnson                                               ││
│  │ • Role: Owner (adult)                                               ││
│  │ • Color: #6366F1 (indigo)                                           ││
│  │ • Birthday: March 15                                                ││
│  │ • Avatar: [photo or generated]                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ ✨ PERSONALITY                                                       ││
│  │ • Type: The Organizer / The Planner                                 ││
│  │ • Energy: ○ Introvert ◐ Ambivert ● Extrovert                       ││
│  │ • Time: ● Morning person ○ Night owl ○ Flexible                    ││
│  │ • Style: ● Planner ○ Spontaneous ○ Mix                             ││
│  │ • Stress response: Needs quiet time to recharge                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 💪 STRENGTHS & GROWTH                                                ││
│  │ • Superpowers: [Organization] [Creativity] [Patience]              ││
│  │ • Working on: Saying no, delegating more                            ││
│  │ • Learning style: Visual learner, needs written instructions        ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 💕 WHAT MOTIVATES ME                                                 ││
│  │ • Love language: Words of Affirmation                               ││
│  │ • Motivated by: Checking things off, seeing progress                ││
│  │ • Celebrated by: Recognition, quiet acknowledgment                  ││
│  │ • Recharged by: Reading, solo walks, coffee time                    ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 🎨 INTERESTS & FAVORITES                                             ││
│  │ • Hobbies: Reading, yoga, gardening, puzzles                        ││
│  │ • Current obsession: True crime podcasts                            ││
│  │ • Favorite cuisine: Thai, Mediterranean                             ││
│  │ • Comfort food: Mac and cheese                                      ││
│  │ • Favorite color: Already captured (indigo)                         ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 🍎 HEALTH & WELLNESS                                                 ││
│  │ • Dietary: Vegetarian, lactose intolerant                           ││
│  │ • Allergies: Tree nuts                                              ││
│  │ • Sleep goal: 10pm-6am                                              ││
│  │ • Exercise preference: Yoga, walking                                ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 📱 COMMUNICATION PREFERENCES                                         ││
│  │ • Reminder style: Gentle nudge > Urgent alarm                       ││
│  │ • Best time for tasks: Morning (9-11am)                             ││
│  │ • Notification preference: Batched, not constant                    ││
│  │ • AI tone: Encouraging but not over-the-top                         ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 🏫 LIFE CONTEXT (Adults)                                             ││
│  │ • Work: Product Manager at tech company                             ││
│  │ • Work style: Remote, flexible hours                                ││
│  │ • Busy seasons: Q4, product launches                                ││
│  │ • Commute: None (WFH)                                               ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 📝 ABOUT ME                                                          ││
│  │ "I'm the one who keeps the family calendar straight and makes       ││
│  │ sure we don't run out of milk. I dream of a clutter-free house      ││
│  │ and actually finishing my book club books on time."                 ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Kid-Specific Profile (Simplified)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MEMBER PROFILE: Miles (Kid)                       │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 👤 ABOUT ME                                                          ││
│  │ • Name: Miles                                                       ││
│  │ • Age: 10                                                           ││
│  │ • My color: 🟢 Green                                                ││
│  │ • My emoji: ⚽                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ ⭐ WHAT I LOVE                                                       ││
│  │ • Favorite things: Soccer, Minecraft, Legos, pizza                  ││
│  │ • Best at: Sports, math, making people laugh                        ││
│  │ • Learning: Piano, coding                                           ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 🏫 SCHOOL                                                            ││
│  │ • Grade: 5th grade                                                  ││
│  │ • School: Lincoln Elementary                                        ││
│  │ • Favorite subject: PE, Science                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ 🍎 GOOD TO KNOW                                                      ││
│  │ • Food allergies: Peanuts                                           ││
│  │ • Doesn't like: Mushrooms, early mornings                           ││
│  │ • Needs help with: Staying organized, remembering homework          ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Member Profile Data Model

```typescript
interface MemberProfile {
  // Personality
  personality_type?: string;      // "The Organizer", "The Creative", etc.
  energy_type?: 'introvert' | 'ambivert' | 'extrovert';
  chronotype?: 'morning' | 'night' | 'flexible';
  planning_style?: 'planner' | 'spontaneous' | 'mixed';
  stress_response?: string;       // How they handle stress

  // Strengths & Growth
  strengths?: string[];           // ["organization", "creativity", "patience"]
  growth_areas?: string[];        // Things they're working on
  learning_style?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';

  // Motivation
  love_language?: 'words' | 'acts' | 'gifts' | 'time' | 'touch';
  motivated_by?: string[];        // ["progress", "recognition", "helping others"]
  recharged_by?: string[];        // ["reading", "exercise", "socializing"]

  // Interests
  hobbies?: string[];
  current_interests?: string[];   // What they're into right now
  favorite_cuisines?: string[];
  comfort_foods?: string[];

  // Health & Wellness
  dietary_restrictions?: string[];
  allergies?: string[];
  sleep_schedule?: {
    target_bedtime?: string;      // "22:00"
    target_waketime?: string;     // "06:00"
  };
  exercise_preferences?: string[];

  // Communication
  reminder_style?: 'gentle' | 'direct' | 'urgent';
  best_focus_time?: 'morning' | 'afternoon' | 'evening';
  notification_preference?: 'realtime' | 'batched' | 'minimal';
  preferred_ai_tone?: 'encouraging' | 'direct' | 'playful' | 'minimal';

  // Life Context (adults)
  occupation?: string;
  work_style?: 'office' | 'remote' | 'hybrid' | 'other';
  busy_seasons?: string[];        // ["q4", "tax_season", "summer"]

  // Life Context (kids)
  school_name?: string;
  grade?: string;
  favorite_subjects?: string[];
  activities?: string[];          // Extracurriculars

  // Narrative
  bio?: string;                   // Free-form "About Me"

  // Quick preferences (used often)
  dislikes?: string[];            // Foods, activities to avoid
  needs_help_with?: string[];     // For kids especially
}
```

---

## AI Use Cases

### What Rich Profiles Enable

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      AI PERSONALIZATION FEATURES                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  🎯 SMART SUGGESTIONS                                                    │
│  ├─ "It's almost summer! Based on your camping tradition, should I      │
│  │   create a 'Summer Camp Prep' project?"                              │
│  ├─ "Miles has soccer practice today. Reminder to pack snacks?"         │
│  └─ "Friday's coming—time to pick a movie for movie night!"             │
│                                                                          │
│  📝 TASK ENRICHMENT                                                      │
│  ├─ Auto-assign based on who usually does what                          │
│  ├─ Suggest due dates based on urgency patterns                         │
│  └─ "This looks like a Hazel task—she usually handles doctor stuff"     │
│                                                                          │
│  🔄 HABIT RECOMMENDATIONS                                                │
│  ├─ "Based on your health goals, consider a '10-min walk' habit"        │
│  ├─ "Miles mentioned wanting to practice piano—add as habit?"           │
│  └─ Time suggestions based on chronotype                                 │
│                                                                          │
│  🍽️ MEAL PLANNING                                                       │
│  ├─ Exclude recipes with allergens (peanuts, tree nuts)                 │
│  ├─ Vegetarian options for Hazel, kid-friendly for Miles                │
│  ├─ "Thai Tuesday" suggestions based on cuisine preferences             │
│  └─ Comfort food suggestions during stressful weeks                     │
│                                                                          │
│  ✨ SOMEDAY INSPIRATION                                                  │
│  ├─ "Adventure families like yours might enjoy: Ziplining!"             │
│  ├─ Trip suggestions based on travel style + kids' ages                 │
│  └─ Experience ideas aligned with shared interests                      │
│                                                                          │
│  🎉 CELEBRATION & RECOGNITION                                            │
│  ├─ Milestone messages tailored to love language                        │
│  ├─ Streak celebrations that match personality                          │
│  │   (Hazel: "Quietly crushing it! 🎯"                                  │
│  │    Miles: "WOOO! You're on FIRE! 🔥🔥🔥")                            │
│  └─ Weekly win summaries in preferred tone                              │
│                                                                          │
│  ⏰ SMART REMINDERS                                                      │
│  ├─ Timing based on best focus time                                     │
│  ├─ Tone matching reminder_style preference                             │
│  ├─ Batched vs. real-time based on preference                           │
│  └─ Urgency calibrated to stress tolerance                              │
│                                                                          │
│  📅 FAMILY MEETING PREP                                                  │
│  ├─ Auto-generate agenda based on the week                              │
│  ├─ Highlight each person's wins in their style                         │
│  ├─ Suggest discussion topics from incomplete goals                     │
│  └─ Draft action items based on patterns                                │
│                                                                          │
│  🧠 CONTEXTUAL INTELLIGENCE                                              │
│  ├─ "It's Q4—Hazel's busy season. Redistribute tasks?"                  │
│  ├─ "School starts next week. Time for back-to-school tasks?"           │
│  └─ Seasonal activity suggestions for your region                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### AI Prompt Context Building

When calling AI, profiles provide rich context:

```typescript
// Example: Generating a milestone celebration message
const context = {
  family: {
    name: family.profile.nickname || family.name,
    communication_style: family.profile.ai_tone,
    values: family.profile.core_values,
  },
  member: {
    name: member.name,
    personality: member.profile.personality_type,
    love_language: member.profile.love_language,
    preferred_tone: member.profile.preferred_ai_tone,
    is_kid: member.role === 'kid',
  },
  achievement: {
    type: 'habit_streak',
    streak_days: 30,
    habit_name: 'Read 20 minutes',
  }
};

// AI can generate personalized message:
// For Hazel (words of affirmation, encouraging tone):
// "30 days of reading! Your consistency is inspiring. 📚✨"
//
// For Miles (kid, playful tone):
// "THIRTY DAYS! You're a reading MACHINE! 🤖📖💥"
```

---

## Database Schema Changes

### Option A: JSONB Extension (Recommended for MVP)

Extend existing tables with JSONB columns for flexibility:

```sql
-- ============================================================================
-- FAMILY PROFILE EXTENSION
-- ============================================================================

-- Add profile column to families table
ALTER TABLE families
ADD COLUMN profile JSONB DEFAULT '{}'::jsonb;

-- Comment documenting structure
COMMENT ON COLUMN families.profile IS 'Rich family profile: {
  nickname, motto, emoji, anniversary_date, home_since,
  core_values[], yearly_theme, decision_style, communication_style,
  traditions[], life_stage, home_type, region, languages[], pets[],
  shared_interests[], cuisine_preferences[], dietary_restrictions[],
  travel_style, activity_level, family_story,
  ai_tone, suggestion_frequency
}';

-- ============================================================================
-- MEMBER PROFILE EXTENSION
-- ============================================================================

-- Add profile column to family_members table
ALTER TABLE family_members
ADD COLUMN profile JSONB DEFAULT '{}'::jsonb;

-- Comment documenting structure
COMMENT ON COLUMN family_members.profile IS 'Rich member profile: {
  personality_type, energy_type, chronotype, planning_style, stress_response,
  strengths[], growth_areas[], learning_style,
  love_language, motivated_by[], recharged_by[],
  hobbies[], current_interests[], favorite_cuisines[], comfort_foods[],
  dietary_restrictions[], allergies[], sleep_schedule, exercise_preferences[],
  reminder_style, best_focus_time, notification_preference, preferred_ai_tone,
  occupation, work_style, busy_seasons[],
  school_name, grade, favorite_subjects[], activities[],
  bio, dislikes[], needs_help_with[]
}';

-- Index for querying profile fields (if needed)
CREATE INDEX idx_family_profile ON families USING GIN (profile);
CREATE INDEX idx_member_profile ON family_members USING GIN (profile);
```

### Option B: Normalized Tables (For Future Scale)

If profiles become very complex or need relational queries:

```sql
-- Separate profile tables
CREATE TABLE family_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID UNIQUE NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  nickname TEXT,
  motto TEXT,
  emoji TEXT,
  anniversary_date DATE,
  home_since DATE,

  core_values TEXT[],
  yearly_theme TEXT,
  decision_style TEXT,
  communication_style TEXT,

  life_stage TEXT,
  home_type TEXT,
  region TEXT,
  languages TEXT[],

  shared_interests TEXT[],
  cuisine_preferences TEXT[],
  dietary_restrictions TEXT[],
  travel_style TEXT,
  activity_level TEXT,

  family_story TEXT,
  ai_tone TEXT,
  suggestion_frequency TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE family_traditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL, -- weekly, monthly, yearly, special
  description TEXT,
  day_of_week INTEGER,
  month INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE family_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  emoji TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Similar for member_profiles...
```

**Recommendation:** Start with Option A (JSONB) for MVP. It's flexible, fast to implement, and can be migrated to normalized tables later if needed.

---

## UX Design

### Profile Building Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PROGRESSIVE PROFILE BUILDING                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PHASE 1: ONBOARDING (existing + light additions)                       │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ • Family name ✓ (existing)                                          ││
│  │ • Your name ✓ (existing)                                            ││
│  │ • Your color ✓ (existing)                                           ││
│  │ + "What's your family's vibe?" (quick personality selector)         ││
│  │   [Adventurous] [Cozy homebodies] [Creative chaos] [Organized]      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  PHASE 2: FIRST WEEK PROMPTS                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Gentle prompts appear in dashboard/inbox:                           ││
│  │ • "🎉 Quick question: Any weekly traditions?" → Traditions form     ││
│  │ • "🌅 Are you a morning person or night owl?" → Chronotype          ││
│  │ • "🍕 Any dietary restrictions we should know?" → Diet prefs        ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  PHASE 3: CONTEXTUAL DISCOVERY                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ When features are used, collect relevant data:                      ││
│  │ • Creating meal plan → "Any cuisines you love?"                     ││
│  │ • Adding habit → "Best time of day for you to do this?"            ││
│  │ • Planning trip → "What's your travel style?"                       ││
│  │ • Completing milestone → "How do you like to celebrate?"            ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  PHASE 4: DEDICATED PROFILE PAGES                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Settings → Family Profile                                           ││
│  │ Settings → My Profile                                                ││
│  │                                                                      ││
│  │ Sections with completion indicators:                                 ││
│  │ [Identity ●●●○○] [Personality ●●○○○] [Interests ●○○○○] ...         ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Family Profile Page Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Settings > Family Profile                            [Save] [Cancel]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  🏠 THE JOHNSON FAMILY                                              ││
│  │     "Team J" • Adventure awaits! 🌟                                 ││
│  │                                                                      ││
│  │     [Edit Identity]                                                  ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  💫 WHAT WE VALUE                                     [●●●○○ 60%]  ││
│  ├─────────────────────────────────────────────────────────────────────┤│
│  │                                                                      ││
│  │  Our core values (pick up to 5):                                    ││
│  │  [Education ✓] [Adventure ✓] [Health ✓] [Creativity]               ││
│  │  [Faith] [Quality Time ✓] [Independence] [Kindness]                ││
│  │  [Financial Security] [Fun & Play] [+ Add custom]                  ││
│  │                                                                      ││
│  │  This year's theme (optional):                                       ││
│  │  ┌──────────────────────────────────────────────────────────────┐   ││
│  │  │ Year of Yes                                                   │   ││
│  │  └──────────────────────────────────────────────────────────────┘   ││
│  │                                                                      ││
│  │  How do big decisions get made?                                      ││
│  │  ○ Adults decide, kids informed                                     ││
│  │  ● Family vote (everyone gets a say)                                ││
│  │  ○ Full consensus required                                          ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  🎉 OUR TRADITIONS                                    [●●○○○ 40%]  ││
│  ├─────────────────────────────────────────────────────────────────────┤│
│  │                                                                      ││
│  │  ┌────────────────────────────────────────────────────────────────┐ ││
│  │  │ 🎬 Friday Movie Night                              Weekly  ✕  │ ││
│  │  │    Every Friday evening                                        │ ││
│  │  └────────────────────────────────────────────────────────────────┘ ││
│  │  ┌────────────────────────────────────────────────────────────────┐ ││
│  │  │ 🥞 Sunday Brunch                                   Weekly  ✕  │ ││
│  │  │    Pancakes and family time                                    │ ││
│  │  └────────────────────────────────────────────────────────────────┘ ││
│  │  ┌────────────────────────────────────────────────────────────────┐ ││
│  │  │ 🏕️ Summer Camping Trip                             Yearly  ✕  │ ││
│  │  │    Usually August                                              │ ││
│  │  └────────────────────────────────────────────────────────────────┘ ││
│  │                                                                      ││
│  │  [+ Add Tradition]                                                   ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  🐾 OUR PETS                                          [●●●●● 100%]  ││
│  ├─────────────────────────────────────────────────────────────────────┤│
│  │                                                                      ││
│  │  🐕 Max (Golden Retriever)        🐱 Luna (Tabby Cat)              ││
│  │                                                                      ││
│  │  [+ Add Pet]                                                         ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  🤖 AI PREFERENCES                                    [●○○○○ 20%]  ││
│  ├─────────────────────────────────────────────────────────────────────┤│
│  │                                                                      ││
│  │  How should Fam talk to your family?                                ││
│  │  ○ Direct and efficient                                             ││
│  │  ● Warm and encouraging                                             ││
│  │  ○ Playful and fun                                                  ││
│  │  ○ Minimal — just the facts                                         ││
│  │                                                                      ││
│  │  How often should Fam make suggestions?                             ││
│  │  ○ Proactively — surprise us with ideas!                            ││
│  │  ● Sometimes — when it seems helpful                                ││
│  │  ○ Rarely — only when we ask                                        ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Member Profile Page Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Settings > My Profile                                [Save] [Cancel]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  [Avatar]  HAZEL JOHNSON                                            ││
│  │            owner · joined Dec 2024                                  ││
│  │                                                                      ││
│  │            [Change Photo] [Edit Name]                                ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  Profile Completion: ████████░░ 78%                                     │
│  "Complete your personality section for better suggestions!"            │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════════│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  ✨ MY PERSONALITY                                    [●●○○○ 40%]  ││
│  ├─────────────────────────────────────────────────────────────────────┤│
│  │                                                                      ││
│  │  I'm most like...                                                   ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               ││
│  │  │ 📋       │ │ 🎨       │ │ 🤝       │ │ 📚       │               ││
│  │  │   The    │ │   The    │ │   The    │ │   The    │               ││
│  │  │ Organizer│ │ Creative │ │Connector │ │ Thinker  │               ││
│  │  │    ✓     │ │          │ │          │ │          │               ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘               ││
│  │                                                                      ││
│  │  My energy style:                                                    ││
│  │  [Introvert]     [○─────●─────○]     [Extrovert]                    ││
│  │                    Ambivert                                          ││
│  │                                                                      ││
│  │  I'm definitely a...                                                ││
│  │  [● Morning person]  [○ Night owl]  [○ Flexible]                   ││
│  │                                                                      ││
│  │  My style is more...                                                ││
│  │  [● Planner]  [○ Spontaneous]  [○ Depends on the day]              ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  💪 STRENGTHS & GROWTH                                [●●●○○ 60%]  ││
│  ├─────────────────────────────────────────────────────────────────────┤│
│  │                                                                      ││
│  │  My superpowers (pick 3-5):                                         ││
│  │  [Organization ✓] [Patience ✓] [Creativity] [Problem Solving ✓]    ││
│  │  [Communication] [Empathy] [Focus] [Humor] [+ Add]                 ││
│  │                                                                      ││
│  │  Things I'm working on:                                              ││
│  │  ┌──────────────────────────────────────────────────────────────┐   ││
│  │  │ Saying no to things, delegating more                          │   ││
│  │  └──────────────────────────────────────────────────────────────┘   ││
│  │                                                                      ││
│  │  I learn best by:                                                    ││
│  │  [● Reading/Writing]  [○ Listening]  [○ Doing]  [○ Watching]       ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  💕 WHAT MOTIVATES ME                                 [●●●●○ 80%]  ││
│  ├─────────────────────────────────────────────────────────────────────┤│
│  │                                                                      ││
│  │  My love language (how I feel appreciated):                         ││
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            ││
│  │  │  💬    │ │  🤲    │ │  🎁    │ │  ⏰    │ │  🤗    │            ││
│  │  │ Words  │ │ Acts of│ │ Gifts  │ │Quality │ │Physical│            ││
│  │  │   ✓    │ │Service │ │        │ │  Time  │ │ Touch  │            ││
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘            ││
│  │                                                                      ││
│  │  I'm motivated by:                                                   ││
│  │  [Progress ✓] [Recognition ✓] [Helping Others] [Competition]        ││
│  │  [Learning] [Achievement ✓] [+ Add]                                 ││
│  │                                                                      ││
│  │  I recharge by:                                                      ││
│  │  [Reading ✓] [Solo time ✓] [Nature walks ✓] [Coffee/Tea]           ││
│  │  [Socializing] [Exercise] [Creative projects] [+ Add]               ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  🍎 HEALTH & DIET                                     [●●●●● 100%]  ││
│  ├─────────────────────────────────────────────────────────────────────┤│
│  │                                                                      ││
│  │  Dietary preferences:                                                ││
│  │  [Vegetarian ✓] [Lactose-free ✓] [Gluten-free] [Vegan]             ││
│  │  [Low-carb] [Pescatarian] [None] [+ Add]                           ││
│  │                                                                      ││
│  │  Allergies (important for meal planning):                           ││
│  │  ┌──────────────────────────────────────────────────────────────┐   ││
│  │  │ Tree nuts                                                     │   ││
│  │  └──────────────────────────────────────────────────────────────┘   ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  📱 HOW I LIKE TO BE REMINDED                         [●●●○○ 60%]  ││
│  ├─────────────────────────────────────────────────────────────────────┤│
│  │                                                                      ││
│  │  Reminder style:                                                     ││
│  │  [● Gentle nudge]  [○ Direct reminder]  [○ Urgent push]            ││
│  │                                                                      ││
│  │  My best focus time:                                                 ││
│  │  [● Morning (9-12)]  [○ Afternoon (1-5)]  [○ Evening (6-9)]        ││
│  │                                                                      ││
│  │  Fam's tone with me should be:                                      ││
│  │  [● Encouraging]  [○ Direct]  [○ Playful]  [○ Minimal]             ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Schema + Basic UI)
**Effort: ~1-2 days**

1. **Database Migration**
   - Add `profile` JSONB column to `families`
   - Add `profile` JSONB column to `family_members`
   - Create TypeScript types for profiles

2. **Hooks**
   - `useFamilyProfile()` - read/update family profile
   - `useMemberProfile()` - read/update member profile
   - `useUpdateFamilyProfile()` - mutation with optimistic updates
   - `useUpdateMemberProfile()` - mutation with optimistic updates

3. **Basic Profile Pages**
   - `/settings/family-profile` - family profile form
   - `/settings/profile` - member profile form (existing settings could expand)

### Phase 2: Progressive Collection
**Effort: ~1-2 days**

1. **Profile Prompts Component**
   - Dismissible cards that appear on dashboard
   - "Tell us more about your family" prompts
   - Appear based on what's missing

2. **Contextual Collection**
   - When creating habits → ask about best time
   - When planning meals → ask about dietary restrictions
   - When completing milestones → ask about celebration style

3. **Profile Completion Indicator**
   - Show % complete on settings page
   - Gamify a bit: "Unlock personalized suggestions!"

### Phase 3: AI Integration Points
**Effort: ~2-3 days**

1. **Profile Context Builder**
   - Function to build AI prompt context from profiles
   - Include relevant profile data in API calls

2. **Personalized Suggestions**
   - Task assignment suggestions based on who usually does what
   - Habit time suggestions based on chronotype
   - Celebration messages based on love language

3. **Smart Defaults**
   - Pre-fill forms based on profile preferences
   - Suggest due dates based on work patterns
   - Filter recipes by dietary restrictions

### Phase 4: Polish & Delight
**Effort: ~1-2 days**

1. **Family Story Visualization**
   - Nice "About Us" card on dashboard
   - Show family traditions upcoming

2. **Profile-Based Features**
   - Pet section in family profile
   - Tradition reminders/suggestions
   - Kid-friendly profile view

3. **AI-Generated Insights**
   - Weekly insights based on profile + behavior
   - "The Johnsons had a great week!" summaries

---

## File Changes Summary

### New Files

```
lib/
├── hooks/
│   └── use-profiles.ts           # Profile hooks (family + member)

components/
├── profiles/
│   ├── family-profile-form.tsx   # Family profile edit form
│   ├── member-profile-form.tsx   # Member profile edit form
│   ├── profile-prompt-card.tsx   # Dashboard prompt for profile completion
│   ├── personality-selector.tsx  # Fun personality type picker
│   ├── value-picker.tsx          # Multi-select for values
│   ├── tradition-list.tsx        # Add/edit traditions
│   └── pet-list.tsx              # Add/edit pets

app/(app)/settings/
├── family-profile/
│   └── page.tsx                  # Family profile page
└── profile/
    └── page.tsx                  # Personal profile page (or extend existing settings)

types/
└── profiles.ts                   # Profile type definitions

supabase/migrations/
└── 003_add_profiles.sql          # Schema migration
```

### Modified Files

```
types/database.ts                  # Add FamilyProfile, MemberProfile types
lib/query-keys.ts                 # Add profile query keys
components/layout/sidebar.tsx     # Add profile links to settings
app/(app)/settings/page.tsx       # Add links to profile pages
```

---

## Success Metrics

### User Engagement
- % of families with >50% profile completion
- Time spent on profile pages
- Profile fields that get filled vs. skipped

### AI Impact
- Click-through rate on AI suggestions before/after profiles
- User satisfaction with personalized content
- Reduction in irrelevant suggestions (e.g., wrong dietary recipes)

### Qualitative
- User feedback on "feeling understood"
- "This is so us!" moments when AI suggests things

---

## Open Questions

1. **Privacy Controls** — Should members be able to hide parts of their profile from other family members? (Probably not needed for MVP)

2. **Profile for Kids** — How simplified should kid profiles be? Who fills them out?

3. **AI Consent** — Explicit opt-in for AI features using profile