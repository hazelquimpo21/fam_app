'use client';

/**
 * ============================================================================
 * 🏠 Family Profile Settings Page
 * ============================================================================
 *
 * Page for editing the family profile. Includes:
 * - Family identity (nickname, motto, emoji)
 * - Core values and culture
 * - Traditions and rituals
 * - Household context
 * - Shared interests
 * - AI preferences
 *
 * Route: /settings/family-profile
 *
 * Access: Adults and owners only
 *
 * User Stories:
 * - Define family identity for personalization
 * - Set up AI preferences for the family
 * - Build context for AI-powered features
 *
 * ============================================================================
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FamilyProfileForm } from '@/components/profiles';
import { logger } from '@/lib/utils/logger';

export default function FamilyProfilePage() {
  // Log page load
  useEffect(() => {
    logger.info('Family profile page loaded');
    logger.divider('Family Profile');
  }, []);

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
          <Home className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Family Profile</h1>
          <p className="text-neutral-500">
            Tell us about your family to personalize your experience
          </p>
        </div>
      </div>

      {/* Profile form */}
      <FamilyProfileForm />
    </div>
  );
}
