/**
 * ============================================================================
 * 🎭 Profile Components
 * ============================================================================
 *
 * Reusable components for building profile forms.
 * These components provide consistent UX for profile editing.
 *
 * Components:
 * - MultiSelectChips: Multi-select for values, interests, etc.
 * - RadioCardGroup: Single-select with visual cards
 * - ProfileSection: Section wrapper with title and completion
 * - ProfileCompletionCard: Overall completion progress
 * - ProfileField: Field wrapper with label and help text
 *
 * ============================================================================
 */

// Core profile form components
export { MultiSelectChips } from './multi-select-chips';
export {
  RadioCardGroup,
  PERSONALITY_OPTIONS,
  ENERGY_TYPE_OPTIONS,
  CHRONOTYPE_OPTIONS,
  PLANNING_STYLE_OPTIONS,
  LOVE_LANGUAGE_OPTIONS,
  AI_TONE_OPTIONS,
  LIFE_STAGE_OPTIONS,
} from './radio-card-group';
export {
  ProfileSection,
  ProfileCompletionCard,
  ProfileField,
} from './profile-section';

// Form components
export { FamilyProfileForm } from './family-profile-form';
export { MemberProfileForm } from './member-profile-form';
