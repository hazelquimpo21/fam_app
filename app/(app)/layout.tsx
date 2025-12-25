'use client';

/**
 * ============================================================================
 * 🏠 App Layout (Authenticated Routes)
 * ============================================================================
 *
 * Layout for all authenticated app pages.
 * Includes the AppShell with sidebar and top bar.
 *
 * Handles:
 * - Redirecting users without a family to onboarding
 * - Loading state while checking family membership
 *
 * ============================================================================
 */

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/lib/hooks/use-auth';
import { logger } from '@/lib/utils/logger';

/**
 * Map routes to page titles
 */
const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/inbox': 'Inbox',
  '/today': 'Today',
  '/tasks': 'Tasks',
  '/habits': 'Habits',
  '/goals': 'Goals',
  '/projects': 'Projects',
  '/someday': 'Someday',
  '/family': 'Family',
  '/settings': 'Settings',
  '/onboarding': 'Welcome',
};

/**
 * Get page title from pathname
 */
function getPageTitle(pathname: string): string {
  // Exact match
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  // Check for nested routes
  const basePath = '/' + pathname.split('/')[1];
  return pageTitles[basePath] || 'Fam';
}

/**
 * App Layout Component
 *
 * Wraps authenticated pages with the AppShell.
 * Redirects to onboarding if user hasn't set up their family.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { authState, familyMember } = useAuth();
  const title = getPageTitle(pathname);

  // Check if we're on the onboarding page
  const isOnboardingPage = pathname === '/onboarding';

  // Redirect to onboarding if user needs to set up family
  useEffect(() => {
    if (authState === 'needs_family' && !isOnboardingPage) {
      logger.info('🔀 Redirecting to onboarding (no family member record)');
      router.push('/onboarding');
    }
  }, [authState, isOnboardingPage, router]);

  // Show loading state while checking auth
  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  // If needs family and not on onboarding page, show loading while redirecting
  if (authState === 'needs_family' && !isOnboardingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm text-neutral-500">Setting up your account...</p>
        </div>
      </div>
    );
  }

  // On onboarding page, render without the shell
  if (isOnboardingPage) {
    return <>{children}</>;
  }

  // Normal authenticated user with family
  return (
    <AppShell title={title}>
      {children}
    </AppShell>
  );
}
