'use client';

/**
 * ============================================================================
 * 📱 Sidebar Navigation
 * ============================================================================
 *
 * The main navigation sidebar for the app.
 * Shows navigation items, family info, and user profile.
 *
 * ============================================================================
 */

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Inbox,
  CalendarDays,
  CheckSquare,
  Target,
  Repeat,
  FolderOpen,
  Sparkles,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Avatar } from '@/components/shared/avatar';

/**
 * Navigation item type
 */
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

/**
 * Main navigation items
 */
const mainNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: Home },
  { label: 'Inbox', href: '/inbox', icon: Inbox },
  { label: 'Today', href: '/today', icon: CalendarDays },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Habits', href: '/habits', icon: Repeat },
  { label: 'Goals', href: '/goals', icon: Target },
  { label: 'Projects', href: '/projects', icon: FolderOpen },
  { label: 'Someday', href: '/someday', icon: Sparkles },
];

/**
 * Secondary navigation items
 */
const secondaryNavItems: NavItem[] = [
  { label: 'Family', href: '/family', icon: Users },
  { label: 'Settings', href: '/settings', icon: Settings },
];

/**
 * NavLink Component - Individual navigation item
 */
interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
}

function NavLink({ item, isActive }: NavLinkProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2',
        'text-sm font-medium transition-colors duration-200',
        isActive
          ? 'bg-indigo-50 text-indigo-600'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge && item.badge > 0 && (
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

/**
 * Sidebar Component
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-neutral-200 bg-white">
      {/* ━━━━━ Header with Logo ━━━━━ */}
      <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <Home className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-neutral-900">Fam</span>
      </div>

      {/* ━━━━━ Main Navigation ━━━━━ */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-neutral-200" />

        {/* Secondary navigation */}
        <div className="space-y-1">
          {secondaryNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </div>
      </nav>

      {/* ━━━━━ User Profile (Bottom) ━━━━━ */}
      <div className="border-t border-neutral-200 p-3">
        <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-neutral-100">
          <Avatar
            name="Hazel Q"
            color="#6366F1"
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">
              Hazel Q
            </p>
            <p className="text-xs text-neutral-500 truncate">
              Owner
            </p>
          </div>
          <button
            className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-200"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
