'use client';

/**
 * ============================================================================
 * ⚙️ Settings Page
 * ============================================================================
 *
 * Application and user settings including:
 * - Profile settings (name, avatar, color)
 * - Notification preferences
 * - Family settings (for owners)
 * - App preferences (theme, timezone)
 *
 * Route: /settings
 *
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  User,
  Bell,
  Palette,
  Shield,
  LogOut,
  ChevronRight,
  Globe,
  Moon,
  Sun,
  Home,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/shared/avatar';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';

/**
 * Mock user settings
 * In production, this would come from useCurrentUser() hook
 */
const mockUser = {
  id: '1',
  name: 'Hazel Quimpo',
  email: 'hazel@example.com',
  color: '#6366F1',
  avatarUrl: null,
  timezone: 'America/Los_Angeles',
  role: 'owner',
};

const mockSettings = {
  notifications: {
    email: true,
    push: false,
    dailyDigest: true,
  },
  preferences: {
    theme: 'light' as 'light' | 'dark' | 'system',
    showCompletedTasks: false,
    weekStartsOn: 'sunday' as 'sunday' | 'monday',
  },
};

/**
 * Settings Section Component
 */
interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SettingsSection({ title, icon, children }: SettingsSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * Settings Row Component
 */
interface SettingsRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingsRow({ label, description, children }: SettingsRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900">{label}</p>
        {description && (
          <p className="text-sm text-neutral-500">{description}</p>
        )}
      </div>
      <div className="ml-4">
        {children}
      </div>
    </div>
  );
}

/**
 * Toggle Switch Component
 */
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ToggleSwitch({ checked, onChange, disabled }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
        checked ? 'bg-indigo-600' : 'bg-neutral-200',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

/**
 * Settings Link Component - For navigation to sub-pages
 */
interface SettingsLinkProps {
  href: string;
  icon: React.ReactNode;
  iconColor?: string;
  label: string;
  description: string;
}

function SettingsLink({ href, icon, iconColor = 'text-indigo-600', label, description }: SettingsLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 py-3 px-1 rounded-lg hover:bg-neutral-50 transition-colors group"
    >
      <div className={cn('p-2 bg-neutral-100 rounded-lg', iconColor)}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-neutral-900 group-hover:text-indigo-600 transition-colors">
          {label}
        </p>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-neutral-400 group-hover:text-indigo-600 transition-colors" />
    </Link>
  );
}

/**
 * Settings Page Component
 */
export default function SettingsPage() {
  const [notifications, setNotifications] = useState(mockSettings.notifications);
  const [preferences, setPreferences] = useState(mockSettings.preferences);

  // Log page load for debugging
  useEffect(() => {
    logger.info('Settings page loaded', { userId: mockUser.id });
    logger.divider('Settings');
  }, []);

  /**
   * Handle notification setting change
   */
  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
    logger.info('Notification setting changed', { key, value });
  };

  /**
   * Handle sign out
   */
  const handleSignOut = () => {
    logger.info('Sign out clicked');
    // In production: call signOut mutation
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-neutral-600" />
        <h1 className="text-xl font-semibold text-neutral-900">Settings</h1>
      </div>

      {/* Profiles Section - Links to detailed profile pages */}
      <SettingsSection
        title="Profiles"
        icon={<Sparkles className="h-5 w-5 text-purple-500" />}
      >
        <p className="text-sm text-neutral-500 mb-3">
          Set up your profiles for personalized AI suggestions
        </p>
        <div className="space-y-1">
          <SettingsLink
            href="/settings/my-profile"
            icon={<User className="h-5 w-5" />}
            iconColor="text-indigo-600"
            label="My Profile"
            description="Personality, interests, preferences"
          />
          <SettingsLink
            href="/settings/family-profile"
            icon={<Home className="h-5 w-5" />}
            iconColor="text-green-600"
            label="Family Profile"
            description="Values, traditions, shared interests"
          />
          <SettingsLink
            href="/settings/calendar"
            icon={<Calendar className="h-5 w-5" />}
            iconColor="text-blue-600"
            label="Calendar Integration"
            description="Sync with Google Calendar, export feeds"
          />
        </div>
      </SettingsSection>

      {/* Basic Info Section */}
      <SettingsSection title="Your Info" icon={<User className="h-5 w-5 text-indigo-600" />}>
        <div className="flex items-center gap-4 py-3">
          <Avatar
            name={mockUser.name}
            color={mockUser.color}
            src={mockUser.avatarUrl || undefined}
            size="lg"
          />
          <div className="flex-1">
            <p className="font-medium text-neutral-900">{mockUser.name}</p>
            <p className="text-sm text-neutral-500">{mockUser.email}</p>
          </div>
          <Link href="/settings/my-profile">
            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
          </Link>
        </div>
        <SettingsRow label="Email" description="Your login email">
          <span className="text-sm text-neutral-600">{mockUser.email}</span>
        </SettingsRow>
        <SettingsRow label="Timezone" description="Used for due dates and reminders">
          <button className="flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
            <Globe className="h-4 w-4" />
            {mockUser.timezone.split('/')[1]}
            <ChevronRight className="h-4 w-4" />
          </button>
        </SettingsRow>
      </SettingsSection>

      {/* Notifications Section */}
      <SettingsSection title="Notifications" icon={<Bell className="h-5 w-5 text-orange-500" />}>
        <SettingsRow label="Email notifications" description="Receive updates via email">
          <ToggleSwitch
            checked={notifications.email}
            onChange={(v) => handleNotificationChange('email', v)}
          />
        </SettingsRow>
        <SettingsRow label="Push notifications" description="Browser push notifications">
          <ToggleSwitch
            checked={notifications.push}
            onChange={(v) => handleNotificationChange('push', v)}
          />
        </SettingsRow>
        <SettingsRow label="Daily digest" description="Get a daily summary email">
          <ToggleSwitch
            checked={notifications.dailyDigest}
            onChange={(v) => handleNotificationChange('dailyDigest', v)}
          />
        </SettingsRow>
      </SettingsSection>

      {/* Appearance Section */}
      <SettingsSection title="Appearance" icon={<Palette className="h-5 w-5 text-purple-500" />}>
        <SettingsRow label="Theme" description="Choose your preferred theme">
          <div className="flex items-center gap-2">
            {(['light', 'dark', 'system'] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => setPreferences((p) => ({ ...p, theme }))}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  preferences.theme === theme
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                )}
              >
                {theme === 'light' && <Sun className="h-4 w-4" />}
                {theme === 'dark' && <Moon className="h-4 w-4" />}
                {theme === 'system' && <Settings className="h-4 w-4" />}
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </button>
            ))}
          </div>
        </SettingsRow>
        <SettingsRow label="Show completed tasks" description="Display completed tasks in lists">
          <ToggleSwitch
            checked={preferences.showCompletedTasks}
            onChange={(v) => setPreferences((p) => ({ ...p, showCompletedTasks: v }))}
          />
        </SettingsRow>
      </SettingsSection>

      {/* Account Section */}
      <SettingsSection title="Account" icon={<Shield className="h-5 w-5 text-red-500" />}>
        <div className="py-3">
          <Button
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full justify-start"
            leftIcon={<LogOut className="h-4 w-4" />}
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </div>
      </SettingsSection>
    </div>
  );
}
