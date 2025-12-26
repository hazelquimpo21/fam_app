'use client';

/**
 * ============================================================================
 * 📅 Calendar Settings Page
 * ============================================================================
 *
 * Manage calendar integrations:
 * - ICS calendar feeds (subscribe in any calendar app)
 * - Google Calendar connection (import external events)
 *
 * Route: /settings/calendar
 *
 * ============================================================================
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ArrowLeft,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  AlertCircle,
  Settings,
  Eye,
  EyeOff,
  Users,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';
import {
  useCalendarFeeds,
  useCreateCalendarFeed,
  useDeleteCalendarFeed,
  useRegenerateCalendarFeedToken,
  useGoogleCalendarConnection,
  useCalendarSubscriptions,
  useUpdateCalendarSubscription,
  useDisconnectGoogleCalendar,
  useSyncGoogleCalendar,
} from '@/lib/hooks/use-calendar';
import type { CalendarFeed, GoogleCalendarSubscription, CalendarVisibility } from '@/types/calendar';

// ============================================================================
// 🔧 UTILITY COMPONENTS
// ============================================================================

/**
 * Copy to clipboard button with success feedback
 */
function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-1"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
}

/**
 * Get the full URL for a calendar feed
 */
function getFeedUrl(token: string): string {
  if (typeof window === 'undefined') {
    return `/api/calendar/feed/${token}.ics`;
  }
  return `${window.location.origin}/api/calendar/feed/${token}.ics`;
}

/**
 * Get the webcal:// URL for direct calendar app subscription
 */
function getWebcalUrl(token: string): string {
  if (typeof window === 'undefined') {
    return `webcal://localhost/api/calendar/feed/${token}.ics`;
  }
  const host = window.location.host;
  return `webcal://${host}/api/calendar/feed/${token}.ics`;
}


// ============================================================================
// 📤 ICS FEED COMPONENTS
// ============================================================================

/**
 * Single calendar feed row
 */
function CalendarFeedItem({ feed }: { feed: CalendarFeed }) {
  const deleteFeed = useDeleteCalendarFeed();
  const regenerateToken = useRegenerateCalendarFeedToken();
  const [showActions, setShowActions] = useState(false);

  const feedUrl = getFeedUrl(feed.token);
  const webcalUrl = getWebcalUrl(feed.token);

  // Format last accessed time
  const lastAccessed = feed.last_accessed_at
    ? new Date(feed.last_accessed_at).toLocaleDateString()
    : 'Never';

  return (
    <div
      className="border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-medium text-neutral-900">{feed.name}</h3>
            <p className="text-xs text-neutral-500">
              {feed.member_id ? 'Personal feed' : 'Family feed'} · Last accessed: {lastAccessed}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className={cn(
          'flex items-center gap-1 transition-opacity',
          showActions ? 'opacity-100' : 'opacity-0'
        )}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => regenerateToken.mutate(feed.id)}
            disabled={regenerateToken.isPending}
            title="Generate new URL (invalidates old one)"
          >
            <RefreshCw className={cn(
              'h-4 w-4',
              regenerateToken.isPending && 'animate-spin'
            )} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm('Delete this calendar feed? Subscribed calendars will stop updating.')) {
                deleteFeed.mutate(feed.id);
              }
            }}
            disabled={deleteFeed.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* URL display */}
      <div className="flex items-center gap-2 mb-3">
        <Input
          value={feedUrl}
          readOnly
          className="font-mono text-xs bg-neutral-50"
        />
        <CopyButton text={feedUrl} label="Copy" />
      </div>

      {/* Includes badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs text-neutral-500">Includes:</span>
        {feed.include_tasks && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            Tasks
          </span>
        )}
        {feed.include_meals && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            Meals
          </span>
        )}
        {feed.include_goals && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
            Goals
          </span>
        )}
      </div>

      {/* Subscribe button */}
      <a
        href={webcalUrl}
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
      >
        <ExternalLink className="h-4 w-4" />
        Open in Calendar App
      </a>
    </div>
  );
}

/**
 * Create new feed form
 */
function CreateFeedForm({ onClose }: { onClose: () => void }) {
  const createFeed = useCreateCalendarFeed();
  const [name, setName] = useState('My Fam Calendar');
  const [isPersonal, setIsPersonal] = useState(false);
  const [includeTasks, setIncludeTasks] = useState(true);
  const [includeMeals, setIncludeMeals] = useState(true);
  const [includeGoals, setIncludeGoals] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFeed.mutate(
      {
        name,
        member_id: isPersonal ? undefined : null, // undefined = personal, null = family
        include_tasks: includeTasks,
        include_meals: includeMeals,
        include_goals: includeGoals,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="border border-neutral-200 rounded-lg p-4 space-y-4">
      <h3 className="font-medium text-neutral-900">New Calendar Feed</h3>

      {/* Feed name */}
      <div>
        <label className="text-sm text-neutral-600 block mb-1">Feed Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Fam Calendar"
          required
        />
      </div>

      {/* Feed type */}
      <div>
        <label className="text-sm text-neutral-600 block mb-2">Feed Type</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsPersonal(false)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors',
              !isPersonal
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-neutral-200 hover:border-neutral-300'
            )}
          >
            <Users className="h-4 w-4" />
            Family
          </button>
          <button
            type="button"
            onClick={() => setIsPersonal(true)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors',
              isPersonal
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-neutral-200 hover:border-neutral-300'
            )}
          >
            <User className="h-4 w-4" />
            Personal (my items only)
          </button>
        </div>
      </div>

      {/* What to include */}
      <div>
        <label className="text-sm text-neutral-600 block mb-2">Include</label>
        <div className="flex flex-wrap gap-2">
          <ToggleChip
            label="Tasks"
            checked={includeTasks}
            onChange={setIncludeTasks}
          />
          <ToggleChip
            label="Meals"
            checked={includeMeals}
            onChange={setIncludeMeals}
          />
          <ToggleChip
            label="Goal Deadlines"
            checked={includeGoals}
            onChange={setIncludeGoals}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={createFeed.isPending}>
          {createFeed.isPending ? 'Creating...' : 'Create Feed'}
        </Button>
      </div>
    </form>
  );
}

/**
 * Toggle chip for boolean options
 */
function ToggleChip({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'px-3 py-1.5 rounded-full text-sm transition-colors',
        checked
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
      )}
    >
      {checked && <Check className="h-3 w-3 inline mr-1" />}
      {label}
    </button>
  );
}


// ============================================================================
// 🔗 GOOGLE CALENDAR COMPONENTS
// ============================================================================

/**
 * Google Calendar connection status and management
 */
function GoogleCalendarSection() {
  const { data: connection, isLoading: connectionLoading } = useGoogleCalendarConnection();
  const { data: subscriptions } = useCalendarSubscriptions();
  const disconnect = useDisconnectGoogleCalendar();
  const sync = useSyncGoogleCalendar();

  // Not connected state
  if (!connection && !connectionLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google Calendar
          </CardTitle>
          <CardDescription>
            Import your Google Calendar events to see them alongside your Fam tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-neutral-50 rounded-lg p-6 text-center">
            <Calendar className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
            <p className="text-neutral-600 mb-4">
              Connect your Google Calendar to see your appointments, meetings, and events inside Fam.
            </p>
            <Button
              onClick={() => {
                // Redirect to Google OAuth flow
                logger.info('Initiating Google Calendar OAuth flow');
                window.location.href = '/api/auth/google';
              }}
            >
              Connect Google Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (connectionLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 animate-pulse" />
            Google Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-neutral-200 rounded w-1/2" />
            <div className="h-4 bg-neutral-200 rounded w-1/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Connected state
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google Calendar
              <Check className="h-4 w-4 text-green-600" />
            </CardTitle>
            <CardDescription>
              Connected as {connection?.google_email}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => sync.mutate()}
              disabled={sync.isPending}
            >
              <RefreshCw className={cn(
                'h-4 w-4 mr-1',
                sync.isPending && 'animate-spin'
              )} />
              Sync Now
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm('Disconnect Google Calendar? Your imported events will be removed.')) {
                  disconnect.mutate();
                }
              }}
              disabled={disconnect.isPending}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Disconnect
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Sync status */}
        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
          {connection?.sync_error ? (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-600">Sync error: {connection.sync_error}</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span>
                Last synced: {connection?.last_synced_at
                  ? new Date(connection.last_synced_at).toLocaleString()
                  : 'Never'}
              </span>
            </>
          )}
        </div>

        {/* Calendar subscriptions */}
        {subscriptions && subscriptions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-neutral-700">Imported Calendars</h4>
            {subscriptions.map((sub) => (
              <CalendarSubscriptionRow key={sub.id} subscription={sub} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Single calendar subscription row
 */
function CalendarSubscriptionRow({ subscription }: { subscription: GoogleCalendarSubscription }) {
  const update = useUpdateCalendarSubscription();

  const visibilityLabels: Record<CalendarVisibility, string> = {
    owner: 'Only me',
    adults: 'Adults',
    family: 'Everyone',
  };

  const visibilityIcons: Record<CalendarVisibility, React.ReactNode> = {
    owner: <User className="h-3 w-3" />,
    adults: <Users className="h-3 w-3" />,
    family: <Users className="h-3 w-3" />,
  };

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-neutral-50">
      {/* Color dot */}
      <div
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: subscription.calendar_color || '#6366F1' }}
      />

      {/* Name and active toggle */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium text-sm truncate',
          subscription.is_active ? 'text-neutral-900' : 'text-neutral-400'
        )}>
          {subscription.calendar_name}
        </p>
      </div>

      {/* Visibility selector */}
      <select
        value={subscription.visibility}
        onChange={(e) => update.mutate({
          id: subscription.id,
          visibility: e.target.value as CalendarVisibility,
        })}
        disabled={update.isPending || !subscription.is_active}
        className="text-xs border border-neutral-200 rounded px-2 py-1 bg-white"
      >
        <option value="owner">Only me</option>
        <option value="adults">Adults</option>
        <option value="family">Everyone</option>
      </select>

      {/* Active toggle */}
      <button
        onClick={() => update.mutate({
          id: subscription.id,
          is_active: !subscription.is_active,
        })}
        disabled={update.isPending}
        className={cn(
          'p-1 rounded transition-colors',
          subscription.is_active
            ? 'text-blue-600 hover:bg-blue-50'
            : 'text-neutral-400 hover:bg-neutral-100'
        )}
        title={subscription.is_active ? 'Disable' : 'Enable'}
      >
        {subscription.is_active ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}


// ============================================================================
// 📄 MAIN PAGE COMPONENT
// ============================================================================

export default function CalendarSettingsPage() {
  const { data: feeds, isLoading: feedsLoading } = useCalendarFeeds();
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-1 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-neutral-600" />
        </Link>
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-neutral-900">Calendar Integration</h1>
        </div>
      </div>

      {/* ICS Calendar Feeds Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
            Subscribe to Fam Calendar
          </CardTitle>
          <CardDescription>
            Add your Fam tasks and meals to Google Calendar, Apple Calendar, or any other calendar app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Loading state */}
          {feedsLoading && (
            <div className="animate-pulse space-y-3">
              <div className="h-24 bg-neutral-100 rounded-lg" />
            </div>
          )}

          {/* Empty state */}
          {!feedsLoading && (!feeds || feeds.length === 0) && !showCreateForm && (
            <div className="bg-neutral-50 rounded-lg p-6 text-center">
              <Calendar className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
              <p className="text-neutral-600 mb-4">
                Create a calendar feed to subscribe in your favorite calendar app.
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create Calendar Feed
              </Button>
            </div>
          )}

          {/* Feed list */}
          {feeds && feeds.length > 0 && (
            <div className="space-y-3">
              {feeds.map((feed) => (
                <CalendarFeedItem key={feed.id} feed={feed} />
              ))}
            </div>
          )}

          {/* Create form */}
          {showCreateForm && (
            <CreateFeedForm onClose={() => setShowCreateForm(false)} />
          )}

          {/* Add button (when feeds exist) */}
          {feeds && feeds.length > 0 && !showCreateForm && (
            <Button variant="outline" onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Another Feed
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Google Calendar Import Section */}
      <GoogleCalendarSection />

      {/* Help text */}
      <div className="text-sm text-neutral-500 space-y-2 bg-neutral-50 rounded-lg p-4">
        <p className="font-medium text-neutral-700">How it works</p>
        <ul className="list-disc list-inside space-y-1 text-neutral-600">
          <li>
            <strong>Subscribe:</strong> Copy the calendar feed URL and add it to your calendar app.
            Events will update automatically every 15-30 minutes.
          </li>
          <li>
            <strong>Import:</strong> Connect Google Calendar to see your external appointments
            alongside your Fam tasks and meals.
          </li>
          <li>
            <strong>Privacy:</strong> Calendar feeds use a secret link. Anyone with the link can
            view your events, so don&apos;t share it publicly.
          </li>
        </ul>
      </div>
    </div>
  );
}
