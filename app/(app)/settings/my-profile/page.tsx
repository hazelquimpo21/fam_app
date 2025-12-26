'use client';

/**
 * ============================================================================
 * 👤 My Profile Settings Page
 * ============================================================================
 *
 * Page for editing the current user's personal profile. Includes:
 * - Personality traits
 * - Strengths and growth areas
 * - Motivation and recharging
 * - Interests and hobbies
 * - Health and dietary info
 * - Communication preferences
 * - Work/school context
 *
 * Route: /settings/my-profile
 *
 * User Stories:
 * - Set up personal preferences for AI personalization
 * - Define communication style
 * - Build context for personalized suggestions
 *
 * ============================================================================
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MemberProfileForm } from '@/components/profiles';
import { useCurrentFamilyMember } from '@/lib/hooks/use-family';
import { logger } from '@/lib/utils/logger';

export default function MyProfilePage() {
  // Get current member to check if they're a kid
  const { data: currentMember } = useCurrentFamilyMember();
  const isKid = currentMember?.role === 'kid';

  // Log page load
  useEffect(() => {
    logger.info('My profile page loaded', { isKid });
    logger.divider('My Profile');
  }, [isKid]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header with back navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </Link>
      </div>

      {/* Page title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <User className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Profile</h1>
          <p className="text-neutral-500">
            Tell us about yourself to personalize your experience
          </p>
        </div>
      </div>

      {/* Profile form */}
      <MemberProfileForm isKid={isKid} />
    </div>
  );
}
