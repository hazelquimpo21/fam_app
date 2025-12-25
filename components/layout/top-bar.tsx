'use client';

/**
 * ============================================================================
 * 🔝 Top Bar Component
 * ============================================================================
 *
 * The top navigation bar with search, notifications, and quick actions.
 *
 * Features:
 * - Mobile menu toggle button
 * - Dynamic page title
 * - Search input (desktop) and mobile search button
 * - Notifications button with badge
 * - Quick add button for creating new items
 *
 * ============================================================================
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';

interface TopBarProps {
  /** Page title to display */
  title?: string;
  /** Callback to toggle mobile sidebar */
  onMenuClick?: () => void;
  /** Optional callback for quick add button - defaults to navigating to /inbox */
  onQuickAdd?: () => void;
}

/**
 * TopBar Component
 *
 * Displays the top navigation bar with search, notifications, and quick add.
 * The quick add button navigates to /inbox by default for quick task capture.
 *
 * @example
 * <TopBar title="Dashboard" onMenuClick={() => setMobileOpen(true)} />
 */
export function TopBar({ title = 'Dashboard', onMenuClick, onQuickAdd }: TopBarProps) {
  const router = useRouter();

  /**
   * Handle quick add button click
   * Uses custom handler if provided, otherwise navigates to inbox for quick capture
   */
  const handleQuickAdd = React.useCallback(() => {
    if (onQuickAdd) {
      onQuickAdd();
    } else {
      // Default behavior: navigate to inbox for quick task capture
      logger.info('➕ Quick add clicked - navigating to inbox');
      router.push('/inbox');
    }
  }, [onQuickAdd, router]);

  /**
   * Handle search click (mobile)
   * For now, logs the action - can be expanded to open a search modal
   */
  const handleSearchClick = React.useCallback(() => {
    logger.info('🔍 Search clicked');
    // Future: open search modal or navigate to search page
  }, []);

  /**
   * Handle notifications click
   * For now, logs the action - can be expanded to open notifications panel
   */
  const handleNotificationsClick = React.useCallback(() => {
    logger.info('🔔 Notifications clicked');
    // Future: open notifications panel
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:px-6">
      {/* ━━━━━ Left Side ━━━━━ */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Page title */}
        <h1 className="text-xl font-semibold text-neutral-900">
          {title}
        </h1>
      </div>

      {/* ━━━━━ Center: Search ━━━━━ */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search... (⌘K)"
            className={cn(
              'w-full h-10 pl-10 pr-4 rounded-lg border border-neutral-200',
              'text-sm placeholder:text-neutral-400',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
              'transition-colors duration-200'
            )}
          />
        </div>
      </div>

      {/* ━━━━━ Right Side: Actions ━━━━━ */}
      <div className="flex items-center gap-2">
        {/* Mobile search */}
        <button
          onClick={handleSearchClick}
          className="md:hidden p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <button
          onClick={handleNotificationsClick}
          className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          aria-label="View notifications"
        >
          <Bell className="h-5 w-5" />
          {/* Notification dot - shows when there are unread notifications */}
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Quick add button - primary action */}
        <Button
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={handleQuickAdd}
        >
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>
    </header>
  );
}
