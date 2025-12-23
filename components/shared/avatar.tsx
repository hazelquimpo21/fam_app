/**
 * ============================================================================
 * 👤 Avatar Component
 * ============================================================================
 *
 * Displays a family member's avatar with image or initials fallback.
 *
 * Usage:
 *   <Avatar name="Hazel Johnson" color="#6366F1" />
 *   <Avatar name="Mike" src="/avatars/mike.jpg" color="#10B981" />
 *
 * ============================================================================
 */

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface AvatarProps {
  /** Image URL (optional - falls back to initials) */
  src?: string | null;
  /** Person's name (used for initials and alt text) */
  name: string;
  /** Background color (hex) for initials fallback */
  color: string;
  /** Size of the avatar */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Size configurations
 */
const sizeConfig = {
  xs: { container: 'h-5 w-5', text: 'text-[10px]' },
  sm: { container: 'h-6 w-6', text: 'text-xs' },
  md: { container: 'h-8 w-8', text: 'text-sm' },
  lg: { container: 'h-10 w-10', text: 'text-base' },
  xl: { container: 'h-14 w-14', text: 'text-xl' },
};

/**
 * Generate initials from a name
 *
 * "Hazel Johnson" → "HJ"
 * "Mike" → "MI"
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);

  if (parts.length >= 2) {
    // First letter of first and last name
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  } else if (parts.length === 1 && parts[0].length >= 2) {
    // First two letters of single name
    return parts[0].substring(0, 2).toUpperCase();
  }

  return parts[0]?.[0]?.toUpperCase() || '?';
}

/**
 * Avatar Component
 *
 * @example
 * // With initials
 * <Avatar name="Hazel Johnson" color="#6366F1" size="md" />
 *
 * @example
 * // With image
 * <Avatar name="Mike" src="/avatars/mike.jpg" color="#10B981" size="lg" />
 */
export function Avatar({
  src,
  name,
  color,
  size = 'md',
  className,
}: AvatarProps) {
  const config = sizeConfig[size];
  const initials = getInitials(name);
  const [imageError, setImageError] = React.useState(false);

  // Show initials if no src or if image fails to load
  const showInitials = !src || imageError;

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-full',
        'overflow-hidden',
        config.container,
        className
      )}
      style={{ backgroundColor: showInitials ? color : undefined }}
      title={name}
    >
      {showInitials ? (
        // Initials fallback
        <span className={cn('font-medium text-white', config.text)}>
          {initials}
        </span>
      ) : (
        // Image
        <img
          src={src!}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}

/**
 * Avatar Group - Shows multiple avatars with overlap
 */
export interface AvatarGroupProps {
  members: Array<{
    id: string;
    name: string;
    color: string;
    avatar_url?: string | null;
  }>;
  /** Maximum avatars to show before "+N" */
  max?: number;
  /** Size of avatars */
  size?: AvatarProps['size'];
  /** Additional CSS classes */
  className?: string;
}

export function AvatarGroup({
  members,
  max = 3,
  size = 'sm',
  className,
}: AvatarGroupProps) {
  const visibleMembers = members.slice(0, max);
  const remainingCount = members.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visibleMembers.map((member) => (
        <Avatar
          key={member.id}
          name={member.name}
          src={member.avatar_url}
          color={member.color}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full',
            'bg-neutral-200 text-neutral-600 ring-2 ring-white',
            sizeConfig[size].container,
            sizeConfig[size].text
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
