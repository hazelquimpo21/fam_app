'use client';

/**
 * ============================================================================
 * 👥 Contacts Page
 * ============================================================================
 *
 * Manage extended family, friends, and other contacts outside the immediate
 * household. Primary use case is tracking birthdays and contact information
 * for people you interact with regularly.
 *
 * Route: /contacts
 *
 * KEY FEATURES:
 * - Contact list with search and type filtering
 * - Clickable cards that open edit modal directly
 * - Unique avatar colors based on contact name (deterministic)
 * - Clickable email/phone links (opens mail client/phone app)
 * - Upcoming birthdays section with expandable "show more"
 * - Optimistic delete with immediate UI feedback
 *
 * USER STORIES ADDRESSED:
 * - US-10.2: Manage Contacts - view, create, edit, delete contacts
 * - US-CONTACTS-1: Click card to view/edit directly
 * - US-CONTACTS-2: Unique avatar colors per contact
 * - US-CONTACTS-3: Tap email/phone to initiate contact
 * - US-CONTACTS-4: Expandable upcoming birthdays
 *
 * DATA FLOW:
 * 1. useContacts() fetches contacts from Supabase with filtering
 * 2. useUpcomingBirthdays() fetches contacts with birthdays in next N days
 * 3. ContactCard displays each contact with computed metadata
 * 4. ContactModal handles create/edit with form validation
 * 5. useDeleteContact() handles soft delete with optimistic update
 *
 * RELATED FILES:
 * - lib/hooks/use-contacts.ts - Data fetching and mutations
 * - lib/constants/contact-styles.ts - Shared styling constants
 * - components/modals/contact-modal.tsx - Create/edit form
 *
 * ============================================================================
 */

import * as React from 'react';
import {
  Users,
  Plus,
  Search,
  Cake,
  Mail,
  Phone,
  MoreHorizontal,
  Trash2,
  Edit,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';
import {
  useContacts,
  useUpcomingBirthdays,
  useDeleteContact,
  useContactStats,
  type ContactWithMeta,
} from '@/lib/hooks/use-contacts';
import {
  CONTACT_TYPE_CONFIG,
  getContactTypeConfig,
  getAvatarColor,
  formatBirthdayCountdown,
  isBirthdaySoon,
  getEmailLink,
  getPhoneLink,
} from '@/lib/constants/contact-styles';
import { ContactModal } from '@/components/modals/contact-modal';
import type { Contact, ContactType } from '@/types/database';

// ============================================================================
// 📦 TYPES
// ============================================================================

/**
 * Filter type includes 'all' plus the standard contact types.
 * Used for the filter pill selection.
 */
type FilterType = 'all' | ContactType;

// ============================================================================
// 🔧 CONSTANTS
// ============================================================================

/**
 * Number of upcoming birthdays to show before "Show more" is needed.
 * Set to 4 for a clean 2x2 or 1x4 grid layout.
 */
const INITIAL_BIRTHDAYS_SHOWN = 4;

/**
 * Number of days ahead to look for upcoming birthdays.
 * 30 days gives users about a month's notice.
 */
const UPCOMING_BIRTHDAYS_DAYS = 30;

// ============================================================================
// 🧩 SUB-COMPONENTS
// ============================================================================

/**
 * ContactCard Component
 *
 * Displays a single contact with their key information.
 *
 * INTERACTION DESIGN:
 * - Clicking the card opens the edit modal (primary action)
 * - Dropdown menu provides Edit/Delete as secondary actions
 * - Email/phone are clickable links (opens mail client/phone app)
 * - Menu button only shows on hover to keep UI clean
 *
 * ACCESSIBILITY:
 * - Card is a button for keyboard navigation
 * - Menu items have proper labels
 * - Color contrast meets WCAG AA
 *
 * @param contact - The contact data with computed metadata
 * @param onEdit - Callback when edit is triggered
 * @param onDelete - Callback when delete is triggered
 * @param isDeleting - Whether a delete is in progress (disables button)
 */
interface ContactCardProps {
  contact: ContactWithMeta;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function ContactCard({
  contact,
  onEdit,
  onDelete,
  isDeleting,
}: ContactCardProps) {
  // Track whether the dropdown menu is open
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Get styling config for this contact's type
  const typeConfig = getContactTypeConfig(contact.contact_type);
  const TypeIcon = typeConfig.icon;

  // Generate unique avatar color based on contact name
  const avatarColor = getAvatarColor(contact.name);

  // Format birthday display with countdown if soon
  const birthdayDisplay = React.useMemo(() => {
    if (!contact.birthday) return null;

    const date = new Date(contact.birthday);
    const formatted = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const countdown = formatBirthdayCountdown(contact.daysUntilBirthday ?? null);
    if (countdown) {
      return `${formatted} (${countdown})`;
    }

    return formatted;
  }, [contact.birthday, contact.daysUntilBirthday]);

  // Close menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handle click on the card body.
   * Opens the edit modal unless clicking on interactive elements.
   */
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on the menu or interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('[data-menu]') ||
      target.closest('a') ||
      target.closest('button')
    ) {
      return;
    }
    onEdit(contact);
  };

  /**
   * Handle click on email - stops propagation to prevent card click
   */
  const handleEmailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Let the <a> tag handle the navigation
  };

  /**
   * Handle click on phone - stops propagation to prevent card click
   */
  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Let the <a> tag handle the navigation
  };

  // Pre-compute contact links
  const emailLink = getEmailLink(contact.email);
  const phoneLink = getPhoneLink(contact.phone);

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md group cursor-pointer',
        'hover:border-indigo-200'
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar with unique color based on name */}
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center text-white font-medium text-lg shrink-0 transition-transform group-hover:scale-105"
            style={{ backgroundColor: avatarColor }}
            aria-hidden="true"
          >
            {contact.name.charAt(0).toUpperCase()}
          </div>

          {/* Contact info */}
          <div className="flex-1 min-w-0">
            {/* Name and type badge */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-neutral-900 truncate">
                {contact.name}
              </h3>
              <div
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium shrink-0',
                  typeConfig.badgeClassName
                )}
              >
                <TypeIcon className="h-3 w-3" />
                {typeConfig.label}
              </div>
            </div>

            {/* Relationship description */}
            {contact.relationship && (
              <p className="text-sm text-neutral-600 mb-1 truncate">
                {contact.relationship}
              </p>
            )}

            {/* Contact details - birthday, email, phone */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
              {/* Birthday with countdown */}
              {birthdayDisplay && (
                <span
                  className={cn(
                    'flex items-center gap-1',
                    isBirthdaySoon(contact.daysUntilBirthday ?? null) &&
                      'text-amber-600 font-medium'
                  )}
                >
                  <Cake className="h-3 w-3" />
                  {birthdayDisplay}
                </span>
              )}

              {/* Clickable email link */}
              {emailLink && (
                <a
                  href={emailLink}
                  onClick={handleEmailClick}
                  className="flex items-center gap-1 hover:text-indigo-600 hover:underline transition-colors"
                  title={`Email ${contact.name}`}
                >
                  <Mail className="h-3 w-3" />
                  <span className="truncate max-w-[150px]">{contact.email}</span>
                </a>
              )}

              {/* Clickable phone link */}
              {phoneLink && (
                <a
                  href={phoneLink}
                  onClick={handlePhoneClick}
                  className="flex items-center gap-1 hover:text-indigo-600 hover:underline transition-colors"
                  title={`Call ${contact.name}`}
                >
                  <Phone className="h-3 w-3" />
                  {contact.phone}
                </a>
              )}
            </div>
          </div>

          {/* Actions menu - only visible on hover */}
          <div className="relative" ref={menuRef} data-menu>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className={cn(
                'p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-all',
                'opacity-0 group-hover:opacity-100',
                showMenu && 'opacity-100 bg-neutral-100'
              )}
              aria-label="Contact actions"
              aria-expanded={showMenu}
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10"
                role="menu"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(contact);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  role="menuitem"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(contact.id);
                    setShowMenu(false);
                  }}
                  disabled={isDeleting}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  role="menuitem"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notes preview (if present) */}
        {contact.notes && (
          <p className="mt-3 text-sm text-neutral-500 line-clamp-2 border-t border-neutral-100 pt-3">
            {contact.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * UpcomingBirthdayCard
 *
 * Compact card for the upcoming birthdays section.
 * Shows name, countdown, and age they'll be turning.
 *
 * VISUAL TREATMENT:
 * - Today's birthdays get amber/gold background
 * - Other upcoming birthdays have neutral background
 * - Avatar color matches the contact's card avatar
 */
interface UpcomingBirthdayCardProps {
  contact: ContactWithMeta;
  onClick: () => void;
}

function UpcomingBirthdayCard({ contact, onClick }: UpcomingBirthdayCardProps) {
  const isToday = contact.daysUntilBirthday === 0;
  const isTomorrow = contact.daysUntilBirthday === 1;
  const avatarColor = getAvatarColor(contact.name);

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border text-left transition-all w-full',
        'hover:scale-[1.02] active:scale-[0.98]',
        isToday
          ? 'bg-amber-50 border-amber-200 hover:bg-amber-100'
          : 'bg-white border-neutral-200 hover:bg-neutral-50'
      )}
    >
      {/* Avatar with cake icon overlay for today */}
      <div className="relative">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium"
          style={{ backgroundColor: avatarColor }}
        >
          {contact.name.charAt(0).toUpperCase()}
        </div>
        {isToday && (
          <div className="absolute -bottom-1 -right-1 bg-amber-400 rounded-full p-1">
            <Cake className="h-3 w-3 text-white" />
          </div>
        )}
      </div>

      {/* Name and countdown */}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-neutral-900 truncate">{contact.name}</p>
        <p className="text-xs text-neutral-500">
          {isToday
            ? '🎉 Birthday today!'
            : isTomorrow
            ? 'Tomorrow'
            : `In ${contact.daysUntilBirthday} days`}
          {contact.age !== null && ` · Turning ${(contact.age ?? 0) + 1}`}
        </p>
      </div>
    </button>
  );
}

/**
 * UpcomingBirthdaysSection
 *
 * Displays contacts with upcoming birthdays with expandable "show more".
 *
 * BEHAVIOR:
 * - Initially shows up to INITIAL_BIRTHDAYS_SHOWN contacts
 * - "Show more" expands to show all upcoming birthdays
 * - "Show less" collapses back to initial count
 * - Hidden entirely if no upcoming birthdays
 */
interface UpcomingBirthdaysSectionProps {
  birthdays: ContactWithMeta[];
  onContactClick: (contact: Contact) => void;
}

function UpcomingBirthdaysSection({
  birthdays,
  onContactClick,
}: UpcomingBirthdaysSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Don't render if no birthdays
  if (birthdays.length === 0) return null;

  const hasMore = birthdays.length > INITIAL_BIRTHDAYS_SHOWN;
  const displayedBirthdays = isExpanded
    ? birthdays
    : birthdays.slice(0, INITIAL_BIRTHDAYS_SHOWN);
  const hiddenCount = birthdays.length - INITIAL_BIRTHDAYS_SHOWN;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-2">
          <Cake className="h-4 w-4" />
          Upcoming Birthdays
          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-semibold">
            {birthdays.length}
          </span>
        </h2>

        {/* Show more/less toggle */}
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
          >
            {isExpanded ? (
              <>
                Show less
                <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                Show {hiddenCount} more
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Birthday cards grid */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {displayedBirthdays.map((contact) => (
          <UpcomingBirthdayCard
            key={contact.id}
            contact={contact}
            onClick={() => onContactClick(contact)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * FilterPills
 *
 * Horizontal pill buttons for filtering contacts by type.
 * Shows count for each type.
 */
interface FilterPillsProps {
  selected: FilterType;
  onChange: (filter: FilterType) => void;
  stats: { total: number; family: number; friends: number; other: number };
}

function FilterPills({ selected, onChange, stats }: FilterPillsProps) {
  const filters: { value: FilterType; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: stats.total },
    { value: 'family', label: 'Family', count: stats.family },
    { value: 'friend', label: 'Friends', count: stats.friends },
    { value: 'other', label: 'Other', count: stats.other },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            selected === filter.value
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          )}
          aria-pressed={selected === filter.value}
        >
          {filter.label}
          <span className="ml-1.5 text-xs opacity-70">({filter.count})</span>
        </button>
      ))}
    </div>
  );
}

/**
 * ContactsSkeleton
 *
 * Loading placeholder that matches the layout of the actual content.
 * Uses shimmer animation for visual feedback.
 */
function ContactsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter pills skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-9 w-24 bg-neutral-200 rounded-full animate-pulse"
          />
        ))}
      </div>

      {/* Contact cards skeleton */}
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-neutral-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-5 bg-neutral-200 rounded w-32 mb-2" />
                  <div className="h-4 bg-neutral-100 rounded w-48" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 📄 MAIN PAGE COMPONENT
// ============================================================================

/**
 * ContactsPage
 *
 * Main page component for the /contacts route.
 * Manages UI state and orchestrates data fetching/mutations.
 */
export default function ContactsPage() {
  // ━━━━━ UI STATE ━━━━━
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<FilterType>('all');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingContact, setEditingContact] = React.useState<Contact | null>(null);

  // ━━━━━ DATA HOOKS ━━━━━
  const {
    data: contacts = [],
    isLoading,
    error,
  } = useContacts({
    contactType: typeFilter === 'all' ? undefined : typeFilter,
    search: search || undefined,
  });

  const { data: upcomingBirthdays = [] } = useUpcomingBirthdays(UPCOMING_BIRTHDAYS_DAYS);
  const deleteContact = useDeleteContact();
  const stats = useContactStats();

  // ━━━━━ LOGGING ━━━━━
  // Log page load for debugging (only on contact count change)
  React.useEffect(() => {
    logger.info('👥 Contacts page loaded', {
      contactCount: contacts.length,
      upcomingBirthdays: upcomingBirthdays.length,
      filter: typeFilter,
    });
  }, [contacts.length, upcomingBirthdays.length, typeFilter]);

  // ━━━━━ EVENT HANDLERS ━━━━━

  /**
   * Open modal to edit an existing contact
   */
  const handleEdit = (contact: Contact) => {
    logger.info('📝 Opening contact for edit', {
      contactId: contact.id,
      name: contact.name,
    });
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  /**
   * Open modal to create a new contact
   */
  const handleCreate = () => {
    logger.info('➕ Opening modal to create new contact');
    setEditingContact(null);
    setIsModalOpen(true);
  };

  /**
   * Delete a contact (with confirmation in future)
   */
  const handleDelete = (contactId: string) => {
    logger.info('🗑️ Deleting contact', { contactId });
    deleteContact.mutate(contactId);
  };

  /**
   * Handle modal close - reset editing state
   */
  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setEditingContact(null);
    }
  };

  /**
   * Clear search input
   */
  const handleClearSearch = () => {
    setSearch('');
  };

  // ━━━━━ ERROR STATE ━━━━━
  if (error) {
    logger.error('❌ Failed to load contacts', { error });
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Users className="h-16 w-16 text-red-500" />}
              title="Failed to load contacts"
              description="There was an error loading your contacts. Please try again."
              action={{
                label: 'Retry',
                onClick: () => window.location.reload(),
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ━━━━━ RENDER ━━━━━
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-indigo-600" />
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Contacts</h1>
            {!isLoading && (
              <p className="text-sm text-neutral-500">
                {stats.total} contact{stats.total !== 1 ? 's' : ''}
                {stats.withBirthdays > 0 && (
                  <> · {stats.withBirthdays} with birthdays</>
                )}
              </p>
            )}
          </div>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleCreate}>
          Add Contact
        </Button>
      </div>

      {/* Upcoming birthdays section */}
      {!isLoading && (
        <UpcomingBirthdaysSection
          birthdays={upcomingBirthdays}
          onContactClick={handleEdit}
        />
      )}

      {/* Loading state */}
      {isLoading && <ContactsSkeleton />}

      {/* Loaded state */}
      {!isLoading && (
        <>
          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-10 pr-8"
              />
              {search && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter pills */}
            <FilterPills
              selected={typeFilter}
              onChange={setTypeFilter}
              stats={stats}
            />
          </div>

          {/* Empty state */}
          {contacts.length === 0 && (
            <Card>
              <CardContent className="p-8">
                <EmptyState
                  icon={<Users className="h-16 w-16 text-indigo-500" />}
                  title={
                    search || typeFilter !== 'all'
                      ? 'No contacts found'
                      : 'No contacts yet'
                  }
                  description={
                    search || typeFilter !== 'all'
                      ? 'Try adjusting your search or filters.'
                      : 'Add extended family, friends, and other contacts you want to remember. Track birthdays and stay connected!'
                  }
                  action={
                    search || typeFilter !== 'all'
                      ? {
                          label: 'Clear filters',
                          onClick: () => {
                            setSearch('');
                            setTypeFilter('all');
                          },
                        }
                      : {
                          label: 'Add Contact',
                          onClick: handleCreate,
                        }
                  }
                />
              </CardContent>
            </Card>
          )}

          {/* Contact list */}
          {contacts.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {contacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isDeleting={deleteContact.isPending}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Contact Modal for create/edit */}
      <ContactModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        contact={editingContact}
      />
    </div>
  );
}
