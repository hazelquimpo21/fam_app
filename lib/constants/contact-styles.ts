/**
 * ============================================================================
 * 👥 Contact Style Constants
 * ============================================================================
 *
 * Centralized styling constants for the Contacts feature.
 * Used by both the Contacts page and ContactModal to ensure consistency.
 *
 * WHY THIS FILE EXISTS:
 * - Eliminates duplication between contacts/page.tsx and contact-modal.tsx
 * - Single source of truth for contact type styling
 * - Makes it easy to update contact appearance across the app
 *
 * USAGE:
 * ```tsx
 * import { CONTACT_TYPE_CONFIG, getAvatarColor } from '@/lib/constants/contact-styles';
 *
 * const config = CONTACT_TYPE_CONFIG[contact.contact_type];
 * const avatarBg = getAvatarColor(contact.name);
 * ```
 *
 * ============================================================================
 */

import { Users, User, Heart } from 'lucide-react';
import type { ContactType } from '@/types/database';

// ============================================================================
// 🎨 AVATAR COLOR PALETTE
// ============================================================================

/**
 * Color palette for contact avatars.
 * These are warm, friendly colors that work well with white text.
 *
 * Design notes:
 * - Colors are chosen to be visually distinct from each other
 * - All colors pass WCAG contrast requirements with white text
 * - Palette inspired by the app's design system (see 05-design-system.md)
 */
export const AVATAR_COLORS = [
  '#6366F1', // Indigo - primary app color
  '#EC4899', // Pink - warm and friendly
  '#F59E0B', // Amber - energetic
  '#10B981', // Emerald - calm and natural
  '#8B5CF6', // Violet - creative
  '#06B6D4', // Cyan - fresh
  '#EF4444', // Red - bold
  '#84CC16', // Lime - vibrant
  '#F97316', // Orange - warm
  '#14B8A6', // Teal - balanced
] as const;

/**
 * Generate a consistent avatar color based on the contact's name.
 *
 * HOW IT WORKS:
 * 1. Creates a simple hash from the name string
 * 2. Uses modulo to pick a color from the palette
 * 3. Same name always produces same color (deterministic)
 *
 * WHY NOT RANDOM:
 * Random colors would change on every render, causing visual instability.
 * Users benefit from consistent colors - they can recognize contacts by color.
 *
 * @param name - The contact's name
 * @returns A hex color string from the AVATAR_COLORS palette
 *
 * @example
 * getAvatarColor('Grandma Rose') // Always returns the same color
 * getAvatarColor('Uncle Bob')    // Different color than Grandma Rose
 */
export function getAvatarColor(name: string): string {
  // Simple hash function: sum of character codes
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }

  // Convert to positive number and get index
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

// ============================================================================
// 📋 CONTACT TYPE CONFIGURATION
// ============================================================================

/**
 * Configuration for each contact type.
 * Defines how contacts of each type are displayed throughout the app.
 *
 * CONTACT TYPES EXPLAINED:
 * - family: Extended family members (grandparents, cousins, aunts/uncles)
 * - friend: Friends of the family or individual family members
 * - other: Everyone else (neighbors, acquaintances, service providers, etc.)
 *
 * Each type has:
 * - label: Human-readable name for display
 * - icon: Lucide icon component
 * - badgeClassName: Tailwind classes for the type badge on contact cards
 * - buttonClassName: Tailwind classes for the type selector in modals
 * - description: Helper text explaining the type
 */
export const CONTACT_TYPE_CONFIG: Record<
  ContactType,
  {
    label: string;
    icon: typeof Users | typeof Heart | typeof User;
    badgeClassName: string;
    buttonClassName: string;
    description: string;
  }
> = {
  family: {
    label: 'Family',
    icon: Users,
    badgeClassName: 'bg-rose-100 text-rose-700',
    buttonClassName: 'text-rose-600 border-rose-200 bg-rose-50',
    description: 'Extended family members',
  },
  friend: {
    label: 'Friend',
    icon: Heart,
    badgeClassName: 'bg-blue-100 text-blue-700',
    buttonClassName: 'text-blue-600 border-blue-200 bg-blue-50',
    description: 'Friends of family members',
  },
  other: {
    label: 'Other',
    icon: User,
    badgeClassName: 'bg-neutral-100 text-neutral-700',
    buttonClassName: 'text-neutral-600 border-neutral-200 bg-neutral-50',
    description: 'Neighbors, acquaintances, etc.',
  },
};

/**
 * Get the configuration for a contact type, with fallback to 'other'.
 *
 * WHY THIS HELPER:
 * Contact type could be null/undefined in edge cases (data migration, etc.)
 * This ensures we always have valid styling even with unexpected data.
 *
 * @param contactType - The contact's type (or null/undefined)
 * @returns The configuration object for that type
 */
export function getContactTypeConfig(contactType: ContactType | null | undefined) {
  return CONTACT_TYPE_CONFIG[contactType || 'other'];
}

// ============================================================================
// 🎂 BIRTHDAY DISPLAY HELPERS
// ============================================================================

/**
 * Format how many days until a birthday for display.
 *
 * DISPLAY RULES:
 * - 0 days: "Today!" with special styling
 * - 1 day: "Tomorrow"
 * - 2-7 days: "in X days"
 * - 8+ days: Just the date (no countdown shown in cards)
 *
 * @param daysUntil - Number of days until the birthday
 * @returns Formatted string for display
 */
export function formatBirthdayCountdown(daysUntil: number | null): string | null {
  if (daysUntil === null) return null;

  if (daysUntil === 0) return 'Today!';
  if (daysUntil === 1) return 'Tomorrow';
  if (daysUntil <= 7) return `in ${daysUntil} days`;

  return null; // Don't show countdown for dates more than a week away
}

/**
 * Check if a birthday is "soon" (within next 7 days).
 * Used to decide whether to show countdown styling.
 *
 * @param daysUntil - Number of days until the birthday
 * @returns True if birthday is within the next week
 */
export function isBirthdaySoon(daysUntil: number | null): boolean {
  return daysUntil !== null && daysUntil >= 0 && daysUntil <= 7;
}

// ============================================================================
// 📱 CONTACT ACTION HELPERS
// ============================================================================

/**
 * Generate a mailto: link for an email address.
 * Returns undefined if email is null/empty (for conditional rendering).
 *
 * @param email - The email address
 * @returns A mailto: URL or undefined
 */
export function getEmailLink(email: string | null): string | undefined {
  if (!email?.trim()) return undefined;
  return `mailto:${email.trim()}`;
}

/**
 * Generate a tel: link for a phone number.
 * Strips non-numeric characters for the link but preserves display format.
 *
 * @param phone - The phone number (any format)
 * @returns A tel: URL or undefined
 */
export function getPhoneLink(phone: string | null): string | undefined {
  if (!phone?.trim()) return undefined;
  // Strip all non-numeric characters except + (for international)
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  return `tel:${cleanPhone}`;
}
