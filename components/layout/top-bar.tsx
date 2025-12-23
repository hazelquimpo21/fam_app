'use client';

/**
 * ============================================================================
 * 🔝 Top Bar Component
 * ============================================================================
 *
 * The top navigation bar with search, notifications, and quick actions.
 *
 * ============================================================================
 */

import * as React from 'react';
import { Search, Plus, Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface TopBarProps {
  /** Page title to display */
  title?: string;
  /** Callback to toggle mobile sidebar */
  onMenuClick?: () => void;
}

/**
 * TopBar Component
 *
 * @example
 * <TopBar title="Dashboard" />
 */
export function TopBar({ title = 'Dashboard', onMenuClick }: TopBarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:px-6">
      {/* ━━━━━ Left Side ━━━━━ */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg"
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
        <button className="md:hidden p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg">
          <Search className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg">
          <Bell className="h-5 w-5" />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Quick add button */}
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>
    </header>
  );
}
