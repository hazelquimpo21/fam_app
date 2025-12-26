'use client';

/**
 * ============================================================================
 * 👤 MemberProfileForm Component
 * ============================================================================
 *
 * A comprehensive form for editing individual family member profiles.
 * Supports both adults and kids with appropriate sections for each.
 *
 * Sections:
 * - Personality: type, energy, chronotype, planning style
 * - Strengths & Growth: superpowers, areas to work on
 * - Motivation: love language, motivators, rechargers
 * - Interests: hobbies, current interests, cuisines
 * - Health: dietary restrictions, allergies
 * - Communication: reminder style, focus time, notifications
 * - Life Context: work (adults) or school (kids)
 *
 * Features:
 * - Auto-save on change
 * - Role-aware sections (adult vs kid)
 * - Completion progress tracking
 * - Responsive layout
 *
 * User Stories:
 * - Personal profile setup
 * - Parents editing kids' profiles
 * - Foundation for personalized AI features
 *
 * ============================================================================
 */

import * as React from 'react';
import {
  User,
  Sparkles,
  Heart,
  Music,
  Apple,
  MessageSquare,
  Briefcase,
  GraduationCap,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  ProfileSection,
  ProfileCompletionCard,
  ProfileField,
} from '@/components/profiles/profile-section';
import { MultiSelectChips } from '@/components/profiles/multi-select-chips';
import {
  RadioCardGroup,
  PERSONALITY_OPTIONS,
  ENERGY_TYPE_OPTIONS,
  CHRONOTYPE_OPTIONS,
  PLANNING_STYLE_OPTIONS,
  LOVE_LANGUAGE_OPTIONS,
  AI_TONE_OPTIONS,
} from '@/components/profiles/radio-card-group';
import {
  useCurrentMemberProfile,
  useMemberProfile,
  useUpdateCurrentMemberProfile,
  useUpdateMemberProfile,
  useCurrentMemberProfileCompletion,
} from '@/lib/hooks/use-profiles';
import { STRENGTHS, COMMON_INTERESTS, DIETARY_RESTRICTIONS } from '@/types/profiles';
import type { MemberProfile } from '@/types/profiles';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// Constants
// ============================================================================

const REMINDER_STYLE_OPTIONS = [
  { value: 'gentle', label: 'Gentle', description: 'Soft reminders' },
  { value: 'direct', label: 'Direct', description: 'Clear & to the point' },
  { value: 'urgent', label: 'Urgent', description: 'Can\'t miss it' },
];

const FOCUS_TIME_OPTIONS = [
  { value: 'morning', label: 'Morning', icon: '🌅' },
  { value: 'afternoon', label: 'Afternoon', icon: '☀️' },
  { value: 'evening', label: 'Evening', icon: '🌙' },
];

const NOTIFICATION_PREF_OPTIONS = [
  { value: 'realtime', label: 'Real-time', description: 'Instant notifications' },
  { value: 'batched', label: 'Batched', description: 'Grouped together' },
  { value: 'minimal', label: 'Minimal', description: 'Only important ones' },
];

const WORK_STYLE_OPTIONS = [
  { value: 'office', label: 'Office' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'other', label: 'Other' },
];

const LEARNING_STYLE_OPTIONS = [
  { value: 'visual', label: 'Visual', icon: '👁️', description: 'Learn by seeing' },
  { value: 'auditory', label: 'Auditory', icon: '👂', description: 'Learn by hearing' },
  { value: 'kinesthetic', label: 'Hands-on', icon: '🤲', description: 'Learn by doing' },
  { value: 'reading', label: 'Reading', icon: '📖', description: 'Learn by reading' },
];

// ============================================================================
// Main Component
// ============================================================================

interface MemberProfileFormProps {
  /** Member ID to edit (if editing another member's profile, e.g., kid) */
  memberId?: string;
  /** Whether this is a kid's profile (shows school section instead of work) */
  isKid?: boolean;
  /** Additional className */
  className?: string;
}

export function MemberProfileForm({
  memberId,
  isKid = false,
  className,
}: MemberProfileFormProps) {
  // Determine if we're editing current user or another member
  const isCurrentUser = !memberId;

  // Fetch profile (current user or specific member)
  const currentProfileQuery = useCurrentMemberProfile();
  const memberProfileQuery = useMemberProfile(memberId);
  const { data: completion } = useCurrentMemberProfileCompletion();

  const profileData = isCurrentUser ? currentProfileQuery.data : memberProfileQuery.data;
  const isLoading = isCurrentUser ? currentProfileQuery.isLoading : memberProfileQuery.isLoading;

  // Mutation hooks
  const updateCurrentProfile = useUpdateCurrentMemberProfile();
  const updateMemberProfile = useUpdateMemberProfile();

  // Local form state
  const [formData, setFormData] = React.useState<Partial<MemberProfile>>({});

  // Sync local state with server data
  React.useEffect(() => {
    if (profileData) {
      setFormData(profileData);
    }
  }, [profileData]);

  /**
   * Update a single field
   */
  const updateField = <K extends keyof MemberProfile>(
    field: K,
    value: MemberProfile[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Save current form data to server
   */
  const saveProfile = async () => {
    logger.info('💾 Saving member profile...', { isCurrentUser, memberId });

    try {
      if (isCurrentUser) {
        await updateCurrentProfile.mutateAsync(formData);
      } else if (memberId) {
        await updateMemberProfile.mutateAsync({ memberId, updates: formData });
      }
    } catch (error) {
      logger.error('Failed to save profile', { error });
    }
  };

  // Auto-save when formData changes (debounced)
  React.useEffect(() => {
    if (Object.keys(formData).length === 0) return;

    const timer = setTimeout(() => {
      saveProfile();
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData]);

  const isPending = updateCurrentProfile.isPending || updateMemberProfile.isPending;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-neutral-200 rounded-xl" />
        <div className="h-64 bg-neutral-200 rounded-xl" />
        <div className="h-64 bg-neutral-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Completion Card (only for current user) */}
      {isCurrentUser && completion && (
        <ProfileCompletionCard
          percentage={completion.percentage}
          completeSections={completion.completeSections}
          incompleteSections={completion.incompleteSections}
          nextSuggestion={completion.nextSuggestion}
          sectionLabels={{
            personality: 'Personality',
            strengths: 'Strengths',
            motivation: 'Motivation',
            interests: 'Interests',
            health: 'Health',
            communication: 'Communication',
            life_context: 'Life Context',
          }}
        />
      )}

      {/* Personality Section */}
      <ProfileSection
        title="Personality"
        icon={<User className="h-5 w-5" />}
        description="How you show up in the world"
      >
        <div className="space-y-5">
          <ProfileField label="Personality Type" helpText="What archetype best describes you?">
            <RadioCardGroup
              value={formData.personality_type as string}
              onChange={(value) => updateField('personality_type', value)}
              options={PERSONALITY_OPTIONS}
              direction="grid"
              columns={3}
              colorVariant="indigo"
            />
          </ProfileField>

          <ProfileField label="Energy Type" helpText="How do you recharge?">
            <RadioCardGroup
              value={formData.energy_type}
              onChange={(value) => updateField('energy_type', value as MemberProfile['energy_type'])}
              options={ENERGY_TYPE_OPTIONS}
              direction="horizontal"
              colorVariant="indigo"
            />
          </ProfileField>

          <ProfileField label="Chronotype" helpText="Are you a morning person or night owl?">
            <RadioCardGroup
              value={formData.chronotype}
              onChange={(value) => updateField('chronotype', value as MemberProfile['chronotype'])}
              options={CHRONOTYPE_OPTIONS}
              direction="horizontal"
              colorVariant="indigo"
            />
          </ProfileField>

          <ProfileField label="Planning Style" helpText="How do you approach planning?">
            <RadioCardGroup
              value={formData.planning_style}
              onChange={(value) => updateField('planning_style', value as MemberProfile['planning_style'])}
              options={PLANNING_STYLE_OPTIONS}
              direction="horizontal"
              colorVariant="indigo"
            />
          </ProfileField>
        </div>
      </ProfileSection>

      {/* Strengths & Growth Section */}
      <ProfileSection
        title="Strengths & Growth"
        icon={<Sparkles className="h-5 w-5" />}
        description="What you're great at and working on"
      >
        <div className="space-y-5">
          <ProfileField label="Your Superpowers" helpText="What are you naturally good at?">
            <MultiSelectChips
              value={formData.strengths || []}
              onChange={(values) => updateField('strengths', values)}
              options={[...STRENGTHS]}
              maxItems={6}
              colorVariant="green"
              placeholder="Add custom strength..."
            />
          </ProfileField>

          <ProfileField label="Growth Areas" helpText="What are you working on improving?">
            <MultiSelectChips
              value={formData.growth_areas || []}
              onChange={(values) => updateField('growth_areas', values)}
              options={[]}
              maxItems={5}
              colorVariant="blue"
              placeholder="Add growth area..."
            />
          </ProfileField>

          <ProfileField label="Learning Style" helpText="How do you learn best?">
            <RadioCardGroup
              value={formData.learning_style}
              onChange={(value) => updateField('learning_style', value as MemberProfile['learning_style'])}
              options={LEARNING_STYLE_OPTIONS}
              direction="grid"
              columns={4}
              colorVariant="green"
            />
          </ProfileField>
        </div>
      </ProfileSection>

      {/* Motivation Section */}
      <ProfileSection
        title="Motivation"
        icon={<Heart className="h-5 w-5" />}
        description="What drives and inspires you"
      >
        <div className="space-y-5">
          <ProfileField label="Love Language" helpText="How do you feel most appreciated?">
            <RadioCardGroup
              value={formData.love_language}
              onChange={(value) => updateField('love_language', value as MemberProfile['love_language'])}
              options={LOVE_LANGUAGE_OPTIONS}
              direction="grid"
              columns={3}
              colorVariant="purple"
            />
          </ProfileField>

          <ProfileField label="Motivated By" helpText="What gets you going?">
            <MultiSelectChips
              value={formData.motivated_by || []}
              onChange={(values) => updateField('motivated_by', values)}
              options={['progress', 'recognition', 'helping_others', 'competition', 'learning', 'creativity', 'autonomy', 'purpose']}
              maxItems={5}
              colorVariant="purple"
              placeholder="Add motivator..."
              labels={{
                helping_others: 'Helping Others',
              }}
            />
          </ProfileField>

          <ProfileField label="Recharged By" helpText="How do you restore your energy?">
            <MultiSelectChips
              value={formData.recharged_by || []}
              onChange={(values) => updateField('recharged_by', values)}
              options={['reading', 'solo_time', 'nature', 'exercise', 'music', 'socializing', 'creating', 'meditation']}
              maxItems={5}
              colorVariant="orange"
              placeholder="Add activity..."
              labels={{
                solo_time: 'Alone Time',
              }}
            />
          </ProfileField>
        </div>
      </ProfileSection>

      {/* Interests Section */}
      <ProfileSection
        title="Interests"
        icon={<Music className="h-5 w-5" />}
        description="What you enjoy and are into right now"
      >
        <div className="space-y-5">
          <ProfileField label="Hobbies" helpText="Activities you regularly enjoy">
            <MultiSelectChips
              value={formData.hobbies || []}
              onChange={(values) => updateField('hobbies', values)}
              options={[...COMMON_INTERESTS]}
              maxItems={10}
              colorVariant="green"
              placeholder="Add hobby..."
            />
          </ProfileField>

          <ProfileField label="Current Interests" helpText="What you're into right now">
            <MultiSelectChips
              value={formData.current_interests || []}
              onChange={(values) => updateField('current_interests', values)}
              options={[]}
              maxItems={5}
              colorVariant="blue"
              placeholder="Add current interest..."
            />
          </ProfileField>

          <ProfileField label="Favorite Cuisines">
            <MultiSelectChips
              value={formData.favorite_cuisines || []}
              onChange={(values) => updateField('favorite_cuisines', values)}
              options={['Mexican', 'Italian', 'Asian', 'American', 'Mediterranean', 'Indian', 'Thai', 'Japanese', 'Greek', 'French']}
              maxItems={6}
              colorVariant="orange"
              placeholder="Add cuisine..."
            />
          </ProfileField>

          <ProfileField label="Comfort Foods" helpText="Your go-to comfort foods">
            <MultiSelectChips
              value={formData.comfort_foods || []}
              onChange={(values) => updateField('comfort_foods', values)}
              options={[]}
              maxItems={5}
              colorVariant="orange"
              placeholder="Add comfort food..."
            />
          </ProfileField>
        </div>
      </ProfileSection>

      {/* Health & Wellness Section */}
      <ProfileSection
        title="Health & Wellness"
        icon={<Apple className="h-5 w-5" />}
        description="Dietary needs and wellness preferences"
      >
        <div className="space-y-5">
          <ProfileField label="Dietary Restrictions">
            <MultiSelectChips
              value={formData.dietary_restrictions || []}
              onChange={(values) => updateField('dietary_restrictions', values)}
              options={[...DIETARY_RESTRICTIONS]}
              colorVariant="blue"
              placeholder="Add restriction..."
              labels={{
                gluten_free: 'Gluten-Free',
                dairy_free: 'Dairy-Free',
                nut_free: 'Nut-Free',
                low_carb: 'Low Carb',
              }}
            />
          </ProfileField>

          <ProfileField label="Allergies" helpText="Important for meal planning and safety">
            <MultiSelectChips
              value={formData.allergies || []}
              onChange={(values) => updateField('allergies', values)}
              options={['peanuts', 'tree_nuts', 'dairy', 'eggs', 'wheat', 'soy', 'fish', 'shellfish', 'sesame']}
              colorVariant="blue"
              placeholder="Add allergy..."
              labels={{
                tree_nuts: 'Tree Nuts',
              }}
            />
          </ProfileField>

          <ProfileField label="Exercise Preferences">
            <MultiSelectChips
              value={formData.exercise_preferences || []}
              onChange={(values) => updateField('exercise_preferences', values)}
              options={['walking', 'running', 'yoga', 'weightlifting', 'swimming', 'cycling', 'hiking', 'dancing', 'sports', 'pilates']}
              maxItems={6}
              colorVariant="green"
              placeholder="Add exercise..."
            />
          </ProfileField>
        </div>
      </ProfileSection>

      {/* Communication Section */}
      <ProfileSection
        title="Communication"
        icon={<MessageSquare className="h-5 w-5" />}
        description="How you like to receive information"
      >
        <div className="space-y-5">
          <ProfileField label="Reminder Style" helpText="How should Fam remind you of things?">
            <div className="flex flex-wrap gap-2">
              {REMINDER_STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateField('reminder_style', opt.value as MemberProfile['reminder_style'])}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm border transition-colors',
                    formData.reminder_style === opt.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  )}
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className="block text-xs text-neutral-500">{opt.description}</span>
                </button>
              ))}
            </div>
          </ProfileField>

          <ProfileField label="Best Focus Time" helpText="When are you most productive?">
            <div className="flex flex-wrap gap-2">
              {FOCUS_TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateField('best_focus_time', opt.value as MemberProfile['best_focus_time'])}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm border transition-colors flex items-center gap-2',
                    formData.best_focus_time === opt.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  )}
                >
                  <span>{opt.icon}</span>
                  <span className="font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </ProfileField>

          <ProfileField label="Notification Preference" helpText="How do you want to receive notifications?">
            <div className="flex flex-wrap gap-2">
              {NOTIFICATION_PREF_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateField('notification_preference', opt.value as MemberProfile['notification_preference'])}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm border transition-colors flex-1 min-w-[140px]',
                    formData.notification_preference === opt.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  )}
                >
                  <span className="font-medium block">{opt.label}</span>
                  <span className="text-xs text-neutral-500">{opt.description}</span>
                </button>
              ))}
            </div>
          </ProfileField>

          <ProfileField label="Preferred AI Tone" helpText="How should Fam talk to you?">
            <RadioCardGroup
              value={formData.preferred_ai_tone}
              onChange={(value) => updateField('preferred_ai_tone', value as MemberProfile['preferred_ai_tone'])}
              options={AI_TONE_OPTIONS}
              direction="grid"
              columns={4}
              colorVariant="purple"
            />
          </ProfileField>
        </div>
      </ProfileSection>

      {/* Life Context Section - Different for adults and kids */}
      {isKid ? (
        <ProfileSection
          title="School & Activities"
          icon={<GraduationCap className="h-5 w-5" />}
          description="School and extracurricular information"
        >
          <div className="space-y-5">
            <ProfileField label="School Name">
              <Input
                value={formData.school_name || ''}
                onChange={(e) => updateField('school_name', e.target.value)}
                placeholder="Lincoln Elementary"
              />
            </ProfileField>

            <ProfileField label="Grade">
              <Input
                value={formData.grade || ''}
                onChange={(e) => updateField('grade', e.target.value)}
                placeholder="5th grade"
              />
            </ProfileField>

            <ProfileField label="Favorite Subjects">
              <MultiSelectChips
                value={formData.favorite_subjects || []}
                onChange={(values) => updateField('favorite_subjects', values)}
                options={['Math', 'Science', 'English', 'History', 'Art', 'Music', 'PE', 'Computer Science', 'Foreign Language']}
                maxItems={5}
                colorVariant="green"
                placeholder="Add subject..."
              />
            </ProfileField>

            <ProfileField label="Activities" helpText="Sports, clubs, lessons, etc.">
              <MultiSelectChips
                value={formData.activities || []}
                onChange={(values) => updateField('activities', values)}
                options={['soccer', 'basketball', 'piano', 'dance', 'swimming', 'martial_arts', 'scouts', 'drama', 'chess', 'robotics']}
                maxItems={6}
                colorVariant="blue"
                placeholder="Add activity..."
                labels={{
                  martial_arts: 'Martial Arts',
                }}
              />
            </ProfileField>

            <ProfileField label="Needs Help With" helpText="Areas where they need support">
              <MultiSelectChips
                value={formData.needs_help_with || []}
                onChange={(values) => updateField('needs_help_with', values)}
                options={['homework', 'organization', 'time_management', 'reading', 'math', 'focus', 'social_skills', 'emotional_regulation']}
                maxItems={5}
                colorVariant="orange"
                placeholder="Add area..."
                labels={{
                  time_management: 'Time Management',
                  social_skills: 'Social Skills',
                  emotional_regulation: 'Emotional Regulation',
                }}
              />
            </ProfileField>
          </div>
        </ProfileSection>
      ) : (
        <ProfileSection
          title="Work & Life"
          icon={<Briefcase className="h-5 w-5" />}
          description="Your professional context"
        >
          <div className="space-y-5">
            <ProfileField label="Occupation">
              <Input
                value={formData.occupation || ''}
                onChange={(e) => updateField('occupation', e.target.value)}
                placeholder="Product Manager"
              />
            </ProfileField>

            <ProfileField label="Work Style">
              <div className="flex flex-wrap gap-2">
                {WORK_STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateField('work_style', opt.value as MemberProfile['work_style'])}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm border transition-colors',
                      formData.work_style === opt.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </ProfileField>

            <ProfileField label="Busy Seasons" helpText="Times of year when work is heavier">
              <MultiSelectChips
                value={formData.busy_seasons || []}
                onChange={(values) => updateField('busy_seasons', values)}
                options={['Q1', 'Q2', 'Q3', 'Q4', 'summer', 'holidays', 'tax_season', 'back_to_school']}
                maxItems={4}
                colorVariant="orange"
                placeholder="Add busy season..."
                labels={{
                  tax_season: 'Tax Season',
                  back_to_school: 'Back to School',
                }}
              />
            </ProfileField>
          </div>
        </ProfileSection>
      )}

      {/* Bio Section */}
      <ProfileSection
        title="About You"
        icon={<User className="h-5 w-5" />}
        description="A short bio in your own words"
      >
        <ProfileField label="Bio" helpText="Write a few sentences about yourself">
          <textarea
            value={formData.bio || ''}
            onChange={(e) => updateField('bio', e.target.value)}
            placeholder="I'm the one who keeps the family calendar straight..."
            rows={3}
            className={cn(
              'w-full px-3 py-2 rounded-lg border border-neutral-300',
              'text-sm resize-none',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
            )}
          />
        </ProfileField>

        <div className="mt-4">
          <ProfileField label="Dislikes" helpText="Things you'd rather avoid">
            <MultiSelectChips
              value={formData.dislikes || []}
              onChange={(values) => updateField('dislikes', values)}
              options={[]}
              maxItems={10}
              colorVariant="orange"
              placeholder="Add dislike..."
            />
          </ProfileField>
        </div>
      </ProfileSection>

      {/* Save indicator */}
      {isPending && (
        <div className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Saving...
        </div>
      )}
    </div>
  );
}
