'use client';

/**
 * ============================================================================
 * 🏠 FamilyProfileForm Component
 * ============================================================================
 *
 * A comprehensive form for editing family profile information.
 * Organized into sections matching the profile architecture.
 *
 * Sections:
 * - Identity: nickname, motto, emoji
 * - Values: core values, yearly theme, decision style
 * - Traditions: family traditions (weekly, monthly, yearly)
 * - Household: life stage, home type, region, pets
 * - Interests: shared interests, cuisine preferences
 * - AI Preferences: tone, suggestion frequency
 *
 * Features:
 * - Auto-save on blur/change
 * - Section-by-section editing
 * - Completion progress tracking
 * - Pet and tradition management
 *
 * User Stories:
 * - Family profile setup and personalization
 * - Foundation for AI-powered features
 *
 * ============================================================================
 */

import * as React from 'react';
import {
  Home,
  Heart,
  Calendar,
  Users,
  Sparkles,
  Bot,
  PawPrint,
  Plus,
  Trash2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  ProfileSection,
  ProfileCompletionCard,
  ProfileField,
} from '@/components/profiles/profile-section';
import { MultiSelectChips } from '@/components/profiles/multi-select-chips';
import {
  RadioCardGroup,
  LIFE_STAGE_OPTIONS,
  AI_TONE_OPTIONS,
} from '@/components/profiles/radio-card-group';
import {
  useFamilyProfile,
  useUpdateFamilyProfile,
  useFamilyProfileCompletion,
} from '@/lib/hooks/use-profiles';
import { CORE_VALUES, COMMON_INTERESTS } from '@/types/profiles';
import type { FamilyProfile, Tradition, Pet, DecisionStyle } from '@/types/profiles';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// Constants
// ============================================================================

const DECISION_STYLE_OPTIONS = [
  { value: 'adults', label: 'Adults decide', description: 'Kids are informed' },
  { value: 'family_vote', label: 'Family vote', description: 'Everyone gets a say' },
  { value: 'consensus', label: 'Consensus', description: 'Full agreement needed' },
];

const HOME_TYPE_OPTIONS = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'condo', label: 'Condo' },
  { value: 'house', label: 'House' },
  { value: 'house_with_yard', label: 'House with Yard' },
  { value: 'rural', label: 'Rural' },
];

const TRADITION_FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'special', label: 'Special Occasion' },
];

const PET_TYPE_OPTIONS = [
  { value: 'dog', label: 'Dog', emoji: '🐕' },
  { value: 'cat', label: 'Cat', emoji: '🐱' },
  { value: 'fish', label: 'Fish', emoji: '🐠' },
  { value: 'bird', label: 'Bird', emoji: '🐦' },
  { value: 'hamster', label: 'Hamster', emoji: '🐹' },
  { value: 'rabbit', label: 'Rabbit', emoji: '🐰' },
  { value: 'other', label: 'Other', emoji: '🐾' },
];

const SUGGESTION_FREQUENCY_OPTIONS = [
  { value: 'minimal', label: 'Minimal', description: 'Only when I ask' },
  { value: 'moderate', label: 'Moderate', description: 'When it seems helpful' },
  { value: 'proactive', label: 'Proactive', description: 'Surprise me with ideas!' },
];

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Tradition editor for adding/removing family traditions
 */
interface TraditionEditorProps {
  traditions: Tradition[];
  onChange: (traditions: Tradition[]) => void;
}

function TraditionEditor({ traditions, onChange }: TraditionEditorProps) {
  const [isAdding, setIsAdding] = React.useState(false);
  const [newTradition, setNewTradition] = React.useState<Partial<Tradition>>({
    name: '',
    frequency: 'weekly',
    description: '',
  });

  const addTradition = () => {
    if (!newTradition.name?.trim()) return;

    const tradition: Tradition = {
      id: crypto.randomUUID(),
      name: newTradition.name.trim(),
      frequency: newTradition.frequency || 'weekly',
      description: newTradition.description?.trim() || undefined,
    };

    onChange([...traditions, tradition]);
    setNewTradition({ name: '', frequency: 'weekly', description: '' });
    setIsAdding(false);
  };

  const removeTradition = (id: string) => {
    onChange(traditions.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Existing traditions */}
      {traditions.map((tradition) => (
        <div
          key={tradition.id}
          className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
        >
          <div>
            <p className="font-medium text-neutral-900">{tradition.name}</p>
            <p className="text-sm text-neutral-500">
              {tradition.frequency.charAt(0).toUpperCase() + tradition.frequency.slice(1)}
              {tradition.description && ` · ${tradition.description}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => removeTradition(tradition.id)}
            className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
            aria-label={`Remove ${tradition.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {/* Add tradition form */}
      {isAdding ? (
        <div className="p-4 border border-neutral-200 rounded-lg space-y-3">
          <Input
            value={newTradition.name || ''}
            onChange={(e) => setNewTradition({ ...newTradition, name: e.target.value })}
            placeholder="Tradition name (e.g., Friday Movie Night)"
            autoFocus
          />
          <div className="flex gap-2">
            {TRADITION_FREQUENCY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setNewTradition({ ...newTradition, frequency: opt.value as Tradition['frequency'] })}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                  newTradition.frequency === opt.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-neutral-200 hover:bg-neutral-50'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Input
            value={newTradition.description || ''}
            onChange={(e) => setNewTradition({ ...newTradition, description: e.target.value })}
            placeholder="Description (optional)"
          />
          <div className="flex gap-2">
            <Button onClick={addTradition} disabled={!newTradition.name?.trim()}>
              Add Tradition
            </Button>
            <Button variant="outline" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Tradition
        </button>
      )}
    </div>
  );
}

/**
 * Pet editor for adding/removing family pets
 */
interface PetEditorProps {
  pets: Pet[];
  onChange: (pets: Pet[]) => void;
}

function PetEditor({ pets, onChange }: PetEditorProps) {
  const [isAdding, setIsAdding] = React.useState(false);
  const [newPet, setNewPet] = React.useState<Partial<Pet>>({
    name: '',
    type: 'dog',
  });

  const addPet = () => {
    if (!newPet.name?.trim()) return;

    const petType = PET_TYPE_OPTIONS.find((p) => p.value === newPet.type);
    const pet: Pet = {
      name: newPet.name.trim(),
      type: (newPet.type || 'other') as Pet['type'],
      emoji: petType?.emoji || '🐾',
    };

    onChange([...pets, pet]);
    setNewPet({ name: '', type: 'dog' });
    setIsAdding(false);
  };

  const removePet = (name: string) => {
    onChange(pets.filter((p) => p.name !== name));
  };

  return (
    <div className="space-y-3">
      {/* Existing pets */}
      <div className="flex flex-wrap gap-2">
        {pets.map((pet) => (
          <div
            key={pet.name}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-full"
          >
            <span>{pet.emoji || '🐾'}</span>
            <span className="font-medium text-sm">{pet.name}</span>
            <button
              type="button"
              onClick={() => removePet(pet.name)}
              className="text-neutral-400 hover:text-red-500 transition-colors"
              aria-label={`Remove ${pet.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add pet form */}
      {isAdding ? (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              value={newPet.name || ''}
              onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
              placeholder="Pet's name"
              autoFocus
            />
          </div>
          <select
            value={newPet.type}
            onChange={(e) => setNewPet({ ...newPet, type: e.target.value as Pet['type'] })}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
          >
            {PET_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.emoji} {opt.label}
              </option>
            ))}
          </select>
          <Button onClick={addPet} disabled={!newPet.name?.trim()}>
            Add
          </Button>
          <Button variant="outline" onClick={() => setIsAdding(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Pet
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface FamilyProfileFormProps {
  /** Additional className */
  className?: string;
}

export function FamilyProfileForm({ className }: FamilyProfileFormProps) {
  // Fetch current profile
  const { data: profile, isLoading } = useFamilyProfile();
  const { data: completion } = useFamilyProfileCompletion();
  const updateProfile = useUpdateFamilyProfile();

  // Local form state (initialized from server data)
  const [formData, setFormData] = React.useState<Partial<FamilyProfile>>({});

  // Sync local state with server data
  React.useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  /**
   * Update a single field and save to server
   */
  const updateField = <K extends keyof FamilyProfile>(
    field: K,
    value: FamilyProfile[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Debounced save (or save on blur)
  };

  /**
   * Save current form data to server
   */
  const saveProfile = async () => {
    logger.info('💾 Saving family profile...', { fields: Object.keys(formData) });
    try {
      await updateProfile.mutateAsync(formData);
    } catch (error) {
      logger.error('Failed to save profile', { error });
    }
  };

  // Auto-save when formData changes (debounced)
  React.useEffect(() => {
    if (Object.keys(formData).length === 0) return;

    const timer = setTimeout(() => {
      saveProfile();
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [formData]);

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
      {/* Completion Card */}
      {completion && (
        <ProfileCompletionCard
          percentage={completion.percentage}
          completeSections={completion.completeSections}
          incompleteSections={completion.incompleteSections}
          nextSuggestion={completion.nextSuggestion}
          sectionLabels={{
            identity: 'Identity',
            values: 'Values',
            traditions: 'Traditions',
            household: 'Household',
            interests: 'Interests',
            ai: 'AI Settings',
          }}
        />
      )}

      {/* Identity Section */}
      <ProfileSection
        title="Family Identity"
        icon={<Home className="h-5 w-5" />}
        description="What makes your family unique"
      >
        <div className="space-y-4">
          <ProfileField label="Family Nickname" helpText='A fun name for your family (e.g., "Team J", "The Chaos Crew")'>
            <Input
              value={formData.nickname || ''}
              onChange={(e) => updateField('nickname', e.target.value)}
              placeholder="What do you call yourselves?"
            />
          </ProfileField>

          <ProfileField label="Family Motto" helpText="A phrase that captures your family spirit">
            <Input
              value={formData.motto || ''}
              onChange={(e) => updateField('motto', e.target.value)}
              placeholder="Adventure awaits!"
            />
          </ProfileField>

          <ProfileField label="Family Emoji" helpText="An emoji that represents your family">
            <Input
              value={formData.emoji || ''}
              onChange={(e) => updateField('emoji', e.target.value)}
              placeholder="🌟"
              className="w-24 text-2xl text-center"
            />
          </ProfileField>
        </div>
      </ProfileSection>

      {/* Values Section */}
      <ProfileSection
        title="Values & Culture"
        icon={<Heart className="h-5 w-5" />}
        description="What your family believes in"
      >
        <div className="space-y-5">
          <ProfileField label="Core Values" helpText="The principles that guide your family (pick up to 5)">
            <MultiSelectChips
              value={formData.core_values || []}
              onChange={(values) => updateField('core_values', values)}
              options={[...CORE_VALUES]}
              maxItems={5}
              colorVariant="indigo"
              placeholder="Add custom value..."
            />
          </ProfileField>

          <ProfileField label="This Year's Theme" helpText="Optional focus for the year">
            <Input
              value={formData.yearly_theme || ''}
              onChange={(e) => updateField('yearly_theme', e.target.value)}
              placeholder='e.g., "Year of Yes", "Simplify 2025"'
            />
          </ProfileField>

          <ProfileField label="Decision Style" helpText="How does your family make big decisions?">
            <div className="flex flex-wrap gap-2">
              {DECISION_STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateField('decision_style', opt.value as DecisionStyle)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm border transition-colors',
                    formData.decision_style === opt.value
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
        </div>
      </ProfileSection>

      {/* Traditions Section */}
      <ProfileSection
        title="Traditions & Rituals"
        icon={<Calendar className="h-5 w-5" />}
        description="The special things your family does together"
      >
        <TraditionEditor
          traditions={formData.traditions || []}
          onChange={(traditions) => updateField('traditions', traditions)}
        />
      </ProfileSection>

      {/* Household Section */}
      <ProfileSection
        title="Household"
        icon={<Users className="h-5 w-5" />}
        description="About your home and family setup"
      >
        <div className="space-y-5">
          <ProfileField label="Life Stage" helpText="Based on your children's ages">
            <RadioCardGroup
              value={formData.life_stage}
              onChange={(value) => updateField('life_stage', value as FamilyProfile['life_stage'])}
              options={LIFE_STAGE_OPTIONS}
              direction="grid"
              columns={3}
              colorVariant="indigo"
            />
          </ProfileField>

          <ProfileField label="Home Type">
            <div className="flex flex-wrap gap-2">
              {HOME_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateField('home_type', opt.value as FamilyProfile['home_type'])}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm border transition-colors',
                    formData.home_type === opt.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </ProfileField>

          <ProfileField label="Region" helpText="General location for seasonal suggestions">
            <Input
              value={formData.region || ''}
              onChange={(e) => updateField('region', e.target.value)}
              placeholder="e.g., Midwest USA, Pacific Northwest"
            />
          </ProfileField>

          <ProfileField label="Pets" icon={<PawPrint className="h-4 w-4" />}>
            <PetEditor
              pets={formData.pets || []}
              onChange={(pets) => updateField('pets', pets)}
            />
          </ProfileField>
        </div>
      </ProfileSection>

      {/* Shared Interests Section */}
      <ProfileSection
        title="Shared Interests"
        icon={<Sparkles className="h-5 w-5" />}
        description="Activities and preferences your family enjoys"
      >
        <div className="space-y-5">
          <ProfileField label="Activities We Enjoy Together">
            <MultiSelectChips
              value={formData.shared_interests || []}
              onChange={(values) => updateField('shared_interests', values)}
              options={[...COMMON_INTERESTS]}
              maxItems={10}
              colorVariant="green"
              placeholder="Add custom activity..."
            />
          </ProfileField>

          <ProfileField label="Cuisine Preferences" helpText="For meal planning suggestions">
            <MultiSelectChips
              value={formData.cuisine_preferences || []}
              onChange={(values) => updateField('cuisine_preferences', values)}
              options={['Mexican', 'Italian', 'Asian', 'American', 'Mediterranean', 'Indian', 'Thai', 'Japanese']}
              maxItems={8}
              colorVariant="orange"
              placeholder="Add cuisine..."
            />
          </ProfileField>

          <ProfileField label="Family Dietary Restrictions" helpText="Apply to meal planning">
            <MultiSelectChips
              value={formData.dietary_restrictions || []}
              onChange={(values) => updateField('dietary_restrictions', values)}
              options={['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'nut_free', 'kosher', 'halal']}
              colorVariant="blue"
              placeholder="Add restriction..."
              labels={{
                gluten_free: 'Gluten-Free',
                dairy_free: 'Dairy-Free',
                nut_free: 'Nut-Free',
              }}
            />
          </ProfileField>
        </div>
      </ProfileSection>

      {/* AI Preferences Section */}
      <ProfileSection
        title="AI Preferences"
        icon={<Bot className="h-5 w-5" />}
        description="How Fam should communicate with your family"
      >
        <div className="space-y-5">
          <ProfileField label="Communication Tone" helpText="How should Fam talk to your family?">
            <RadioCardGroup
              value={formData.ai_tone}
              onChange={(value) => updateField('ai_tone', value as FamilyProfile['ai_tone'])}
              options={AI_TONE_OPTIONS}
              direction="grid"
              columns={4}
              colorVariant="purple"
            />
          </ProfileField>

          <ProfileField label="Suggestion Frequency" helpText="How often should Fam make suggestions?">
            <div className="flex flex-wrap gap-2">
              {SUGGESTION_FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateField('suggestion_frequency', opt.value as FamilyProfile['suggestion_frequency'])}
                  className={cn(
                    'px-4 py-3 rounded-lg text-sm border transition-colors flex-1 min-w-[140px]',
                    formData.suggestion_frequency === opt.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  )}
                >
                  <span className="font-medium block">{opt.label}</span>
                  <span className="text-xs text-neutral-500">{opt.description}</span>
                </button>
              ))}
            </div>
          </ProfileField>
        </div>
      </ProfileSection>

      {/* Save indicator */}
      {updateProfile.isPending && (
        <div className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Saving...
        </div>
      )}
    </div>
  );
}
