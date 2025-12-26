'use client';

/**
 * ============================================================================
 * Onboarding Page - Family Setup
 * ============================================================================
 *
 * This page is shown to authenticated users who don't have a family yet.
 * It creates a new family and links the user as the owner.
 *
 * Route: /onboarding
 *
 * Flow:
 * 1. User enters family name
 * 2. System creates family record
 * 3. System creates family_member record linked to auth user
 * 4. User is redirected to dashboard
 *
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { logger } from '@/lib/utils/logger';

/**
 * Available family member colors for personalization
 */
const MEMBER_COLORS = [
  '#6366F1', // Indigo (default)
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#06B6D4', // Cyan
];

/**
 * OnboardingPage Component
 *
 * Guides new users through creating their family account.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  // Form state
  const [familyName, setFamilyName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [selectedColor, setSelectedColor] = useState(MEMBER_COLORS[0]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  /**
   * Check authentication status and pre-fill user data
   */
  useEffect(() => {
    const checkAuth = async () => {
      logger.info('Checking authentication for onboarding...');

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        logger.warn('No authenticated user, redirecting to login');
        router.push('/login');
        return;
      }

      // Check if user already has a family member record
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('id, family_id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (existingMember) {
        logger.info('User already has a family, redirecting to dashboard');
        router.push('/');
        return;
      }

      // Store user data for family creation
      setUserId(user.id);
      setUserEmail(user.email || null);

      // Pre-fill name from user metadata if available
      const userName = user.user_metadata?.name || user.email?.split('@')[0] || '';
      setMemberName(userName);

      // Suggest a family name based on the user's name
      if (userName) {
        setFamilyName(`${userName}'s Family`);
      }

      setIsCheckingAuth(false);
      logger.success('Ready for onboarding', { userId: user.id });
    };

    checkAuth();
  }, [supabase, router]);

  /**
   * Handle form submission - create family and family member
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      setError('Authentication error. Please try logging in again.');
      return;
    }

    if (!familyName.trim() || !memberName.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.info('Creating family...', { familyName });

      // Use the SECURITY DEFINER function to create family and member atomically
      // This bypasses RLS for the onboarding flow
      const { data, error } = await supabase.rpc('create_family_with_owner', {
        p_family_name: familyName.trim(),
        p_family_settings: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          week_starts_on: 'sunday',
        },
        p_member_name: memberName.trim(),
        p_member_email: userEmail,
        p_member_color: selectedColor,
      });

      if (error) {
        logger.error('Failed to create family', { error: error.message });
        throw new Error(`Failed to create family: ${error.message}`);
      }

      const { family, member } = data;
      logger.success('Family created!', { familyId: family.id });
      logger.success('Family member created!', { memberId: member.id, name: member.name });

      // Step 3: Redirect to dashboard
      logger.info('Onboarding complete, redirecting to dashboard...');

      // Use window.location for a full page refresh to ensure auth state is updated
      window.location.href = '/';

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
      logger.error('Onboarding failed', { error: message });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-neutral-900">
              Welcome to Fam!
            </h1>
            <p className="mt-2 text-neutral-600">
              Let&apos;s set up your family command center.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Family Name */}
            <div>
              <label
                htmlFor="familyName"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Family Name
              </label>
              <Input
                id="familyName"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="The Smith Family"
                required
              />
              <p className="mt-1 text-xs text-neutral-500">
                This is how your family will be identified in the app.
              </p>
            </div>

            {/* Member Name */}
            <div>
              <label
                htmlFor="memberName"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Your Name
              </label>
              <Input
                id="memberName"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Your Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {MEMBER_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      selectedColor === color
                        ? 'ring-2 ring-offset-2 ring-neutral-900 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                This color will identify you throughout the app.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={isLoading || !familyName.trim() || !memberName.trim()}
            >
              {isLoading ? 'Creating...' : 'Get Started'}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-4 text-center text-xs text-neutral-500">
            You&apos;ll be able to invite other family members later.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
