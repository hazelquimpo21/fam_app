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
 * - Sorting options (name A-Z/Z-A, birthday, recently added)
 * - Delete confirmation dialog to prevent accidental data loss
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
 * - US-CONTACTS-5: Sort contacts by different criteria
 * - US-CONTACTS-6: Confirm before deleting a contact
 * - US-CONTACTS-7: Search by relationship or phone number
 *
 * DATA FLOW:
 * 1. useContacts() fetches contacts from Supabase with filtering
 * 2. useUpcomingBirthdays() fetches contacts with birthdays in next N days
 * 3. ContactCard displays each contact with computed metadata
 * 4. ContactModal handles create/edit with form validation
 * 5. ConfirmDialog confirms before delete
 * 6. useDeleteContact() handles soft delete with optimistic update
 *
 * RELATED FILES:
 * - lib/hooks/use-contacts.ts - Data fetching and mutations
 * - lib/constants/contact-styles.ts - Shared styling constants
 * - components/modals/contact-modal.tsx - Create/edit form
 * - components/shared/confirm-dialog.tsx - Delete confirmation
 *
 * ============================================================================
 */

import * as React from 'react';
import {
  Users,
  Plus,
  Search,
  Cake,
  X,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Upload,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';
import {
  useContacts,
  useUpcomingBirthdays,
  useDeleteContact,
  useContactStats,
  type ContactWithMeta,
} from '@/lib/hooks/use-contacts';
import { getAvatarColor } from '@/lib/constants/contact-styles';
import { ContactModal } from '@/components/modals/contact-modal';
import { ImportContactsModal } from '@/components/modals/import-contacts-modal';
import { ContactCard } from '@/components/contacts';
import type { Contact, ContactType } from '@/types/database';

// ============================================================================
// 📦 TYPES
// ============================================================================

/**
 * Filter type includes 'all' plus the standard contact types.
 * Used for the filter pill selection.
 */
type FilterType = 'all' | ContactType;

/**
 * Sort options for the contact list.
 *
 * WHY THESE OPTIONS:
 * - name_asc: Default alphabetical (most familiar to users)
 * - name_desc: Reverse alphabetical
 * - birthday: Sort by upcoming birthday (most useful for planning)
 * - recent: Recently added first (useful for finding new contacts)
 */
type SortOption = 'name_asc' | 'name_desc' | 'birthday' | 'recent';

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

/**
 * Sort option configuration for the dropdown.
 *
 * Each option has:
 * - label: Display text in dropdown
 * - icon: Visual indicator of sort direction/type
 */
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name_asc', label: 'Name A→Z' },
  { value: 'name_desc', label: 'Name Z→A' },
  { value: 'birthday', label: 'Upcoming Birthday' },
  { value: 'recent', label: 'Recently Added' },
];

// ============================================================================
// 🧩 SUB-COMPONENTS
// ============================================================================

// NOTE: ContactCard has been extracted to components/contacts/contact-card.tsx
// This keeps the page file focused on page-level logic and layout.

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
 * SortDropdown
 *
 * Dropdown for selecting how contacts are sorted.
 * Compact design that fits alongside filter pills.
 *
 * ACCESSIBILITY:
 * - Uses native button for keyboard support
 * - Dropdown closes on click outside and ESC
 * - Current sort is visually indicated
 */
interface SortDropdownProps {
  value: SortOption;
  onChange: (sort: SortOption) => void;
}

function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Find current sort label
  const currentLabel = SORT_OPTIONS.find((opt) => opt.value === value)?.label || 'Sort';

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
          'border border-neutral-200 hover:border-neutral-300 bg-white',
          isOpen && 'border-indigo-300 ring-1 ring-indigo-100'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <ArrowUpDown className="h-3.5 w-3.5 text-neutral-500" />
        <span className="text-neutral-700">{currentLabel}</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10"
          role="listbox"
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-sm transition-colors',
                value === option.value
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-neutral-700 hover:bg-neutral-50'
              )}
              role="option"
              aria-selected={value === option.value}
            >
              {option.label}
              {value === option.value && (
                <span className="text-indigo-500">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
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
  const [sortOption, setSortOption] = React.useState<SortOption>('name_asc');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [editingContact, setEditingContact] = React.useState<Contact | null>(null);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [contactToDelete, setContactToDelete] = React.useState<ContactWithMeta | null>(null);

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

  // ━━━━━ DERIVED STATE: SORTED CONTACTS ━━━━━
  /**
   * Sort contacts based on current sort option.
   *
   * SORTING LOGIC:
   * - name_asc: Alphabetical by name
   * - name_desc: Reverse alphabetical by name
   * - birthday: By days until next birthday (soonest first, null last)
   * - recent: By created_at descending (newest first)
   */
  const sortedContacts = React.useMemo(() => {
    const sorted = [...contacts];

    switch (sortOption) {
      case 'name_asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));

      case 'name_desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));

      case 'birthday':
        return sorted.sort((a, b) => {
          // Contacts without birthdays go to the end
          if (a.daysUntilBirthday === null && b.daysUntilBirthday === null) {
            return a.name.localeCompare(b.name);
          }
          if (a.daysUntilBirthday === null) return 1;
          if (b.daysUntilBirthday === null) return -1;
          // Sort by soonest birthday
          return (a.daysUntilBirthday ?? 999) - (b.daysUntilBirthday ?? 999);
        });

      case 'recent':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA; // Newest first
        });

      default:
        return sorted;
    }
  }, [contacts, sortOption]);

  // ━━━━━ LOGGING ━━━━━
  // Log page load for debugging (only on contact count change)
  React.useEffect(() => {
    logger.info('👥 Contacts page loaded', {
      contactCount: contacts.length,
      upcomingBirthdays: upcomingBirthdays.length,
      filter: typeFilter,
      sort: sortOption,
    });
  }, [contacts.length, upcomingBirthdays.length, typeFilter, sortOption]);

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
   * Initiate delete - opens confirmation dialog
   *
   * WHY CONFIRM:
   * Deleting a contact is destructive and cannot be undone from the UI.
   * Confirmation prevents accidental data loss.
   */
  const handleDeleteRequest = (contact: ContactWithMeta) => {
    logger.info('🗑️ Delete requested for contact', {
      contactId: contact.id,
      name: contact.name,
    });
    setContactToDelete(contact);
    setDeleteConfirmOpen(true);
  };

  /**
   * Confirm delete - actually performs the deletion
   */
  const handleDeleteConfirm = () => {
    if (contactToDelete) {
      logger.info('🗑️ Deleting contact confirmed', {
        contactId: contactToDelete.id,
        name: contactToDelete.name,
      });
      deleteContact.mutate(contactToDelete.id);
      setDeleteConfirmOpen(false);
      setContactToDelete(null);
    }
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

  /**
   * Open import modal for CSV import
   */
  const handleOpenImport = () => {
    logger.info('📥 Opening import modal');
    setIsImportModalOpen(true);
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={handleOpenImport}
          >
            Import
          </Button>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleCreate}>
            Add Contact
          </Button>
        </div>
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
                placeholder="Search name, email, relationship, phone..."
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

            {/* Filter pills and sort */}
            <div className="flex items-center gap-3 flex-wrap">
              <FilterPills
                selected={typeFilter}
                onChange={setTypeFilter}
                stats={stats}
              />
              <SortDropdown value={sortOption} onChange={setSortOption} />
            </div>
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
          {sortedContacts.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {sortedContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onEdit={handleEdit}
                  onDelete={handleDeleteRequest}
                  isDeleting={deleteContact.isPending}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ━━━━━ MODALS ━━━━━ */}

      {/* Contact Modal for create/edit */}
      <ContactModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        contact={editingContact}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${contactToDelete?.name || 'contact'}?`}
        description="This will permanently remove this contact. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteContact.isPending}
      />

      {/* Import Contacts Modal */}
      <ImportContactsModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
      />
    </div>
  );
}
