'use client';

/**
 * ============================================================================
 * 🏠 Onboarding Page - Family Setup
 * ============================================================================
 *
 * First-time users land here after authentication to create their family.
 * This creates both a family record and links the user as a family member.
 *
 * Route: /onboarding
 *
 * Flow:
 * 1. User enters family name
 * 2. Creates family in database
 * 3. Creates family_member record linking auth user to family
 * 4. Redirects to dashboard
 *
 * ============================================================================
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

/**
 * Color options for the user's profile
 */
const PROFILE_COLORS = [
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Cyan', value: '#06B6D4' },
];

/**
 * Onboarding Page Component
 */
export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, authState } = useAuth();

  // Form state
  const [familyName, setFamilyName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROFILE_COLORS[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Log page load
  logger.info('Onboarding page loaded', { authState, userId: user?.id });

  /**
   * Handle family creation form submission
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!familyName.trim()) {
      setError('Please enter a family name');
      return;
    }
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!user) {
      setError('You must be logged in to create a family');
      return;
    }

    setIsSubmitting(true);
    logger.info('Creating family...', { familyName, displayName });

    try {
      // Step 1: Create the family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          name: familyName.trim(),
          settings: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            week_starts_on: 'sunday',
          },
        })
        .select()
        .single();

      if (familyError) {
        logger.error('Failed to create family', { error: familyError.message });
        throw new Error(`Failed to create family: ${familyError.message}`);
      }

      logger.success('Family created!', { familyId: family.id });

      // Step 2: Create the family member record (as owner)
      const { data: member, error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          auth_user_id: user.id,
          name: displayName.trim(),
          email: user.email,
          role: 'owner',
          color: selectedColor,
        })
        .select()
        .single();

      if (memberError) {
        logger.error('Failed to create family member', { error: memberError.message });
        // Try to clean up the family we just created
        await supabase.from('families').delete().eq('id', family.id);
        throw new Error(`Failed to create family member: ${memberError.message}`);
      }

      logger.success('Family member created!', { memberId: member.id, name: member.name });

      // Success! Show toast and redirect
      toast.success('Welcome to Fam! Your family has been created.');

      // Force a page reload to refresh auth state
      window.location.href = '/';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      logger.error('Onboarding error', { error: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking auth
  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (authState === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  // Redirect if already has a family
  if (authState === 'authenticated') {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Home className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Welcome to Fam!</h1>
          <p className="text-neutral-600">
            Let's set up your family command center
          </p>
        </div>

        {/* Setup Form */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Family Name */}
              <div className="space-y-2">
                <label htmlFor="familyName" className="block text-sm font-medium text-neutral-700">
                  Family Name
                </label>
                <Input
                  id="familyName"
                  type="text"
                  placeholder="e.g., The Smiths, Johnson Family"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <p className="text-xs text-neutral-500">
                  This is how your family will be identified
                </p>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <label htmlFor="displayName" className="block text-sm font-medium text-neutral-700">
                  Your Name
                </label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="e.g., John, Mom, Dad"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <p className="text-xs text-neutral-500">
                  How other family members will see you
                </p>
              </div>

              {/* Color Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Your Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PROFILE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      disabled={isSubmitting}
                      className={`w-10 h-10 rounded-full transition-all ${
                        selectedColor === color.value
                          ? 'ring-2 ring-offset-2 ring-neutral-900 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
                <p className="text-xs text-neutral-500">
                  Used to identify your tasks and assignments
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating your family...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Create Family
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-500">
          You can invite other family members after setup
        </p>
      </div>
    </div>
  );
}
