'use client';

/**
 * ============================================================================
 * 🏠 App Layout (Authenticated Routes)
 * ============================================================================
 *
 * Layout for all authenticated app pages.
 * Includes the AppShell with sidebar and top bar.
 *
 * ============================================================================
 */

import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';

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
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <AppShell title={title}>
      {children}
    </AppShell>
  );
}
