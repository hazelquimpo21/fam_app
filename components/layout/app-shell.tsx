'use client';

/**
 * ============================================================================
 * 🏠 App Shell Component
 * ============================================================================
 *
 * The main layout wrapper for the authenticated app.
 * Includes sidebar, top bar, and main content area.
 *
 * Usage:
 *   <AppShell>
 *     <DashboardPage />
 *   </AppShell>
 *
 * ============================================================================
 */

import * as React from 'react';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { cn } from '@/lib/utils/cn';

interface AppShellProps {
  /** Page content */
  children: React.ReactNode;
  /** Page title for the top bar */
  title?: string;
}

/**
 * App Shell Component
 *
 * Provides the main layout structure:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ [TopBar]                                                    │
 * ├──────────┬──────────────────────────────────────────────────┤
 * │          │                                                   │
 * │ [Sidebar]│                [Main Content]                    │
 * │          │                                                   │
 * │          │                                                   │
 * └──────────┴──────────────────────────────────────────────────┘
 *
 * @example
 * <AppShell title="Dashboard">
 *   <DashboardContent />
 * </AppShell>
 */
export function AppShell({ children, title }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* ━━━━━ Sidebar (Desktop) ━━━━━ */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* ━━━━━ Mobile Sidebar Overlay ━━━━━ */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
            <Sidebar />
          </div>
        </>
      )}

      {/* ━━━━━ Main Content Area ━━━━━ */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar
          title={title}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
