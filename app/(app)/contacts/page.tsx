'use client';

/**
 * ============================================================================
 * 👥 Contacts Page
 * ============================================================================
 *
 * Manage extended family, friends, and other contacts.
 *
 * Route: /contacts
 *
 * Features:
 * - Contact list with search and filtering
 * - Filter by contact type (family, friend, other)
 * - Upcoming birthdays section
 * - Create and edit contacts via modal
 * - Contact cards with key info display
 *
 * User Stories Addressed:
 * - US-10.2: Manage Contacts - view, create, edit contacts
 *
 * ============================================================================
 */

import * as React from 'react';
import {
  Users,
  Plus,
  Search,
  User,
  Heart,
  Cake,
  Mail,
  Phone,
  MoreHorizontal,
  Trash2,
  Edit,
  Filter,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/shared/badge';
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
import { ContactModal } from '@/components/modals/contact-modal';
import type { Contact, ContactType } from '@/types/database';

// ============================================================================
// Types
// ============================================================================

type FilterType = 'all' | ContactType;

// ============================================================================
// Constants
// ============================================================================

/**
 * Contact type display configuration
 */
const CONTACT_TYPE_CONFIG: Record<
  ContactType,
  { label: string; icon: React.ElementType; className: string }
> = {
  family: {
    label: 'Family',
    icon: Users,
    className: 'bg-rose-100 text-rose-700',
  },
  friend: {
    label: 'Friend',
    icon: Heart,
    className: 'bg-blue-100 text-blue-700',
  },
  other: {
    label: 'Other',
    icon: User,
    className: 'bg-neutral-100 text-neutral-700',
  },
};

// ============================================================================
// Components
// ============================================================================

/**
 * ContactCard Component - Displays a single contact
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
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const typeConfig = CONTACT_TYPE_CONFIG[contact.contact_type || 'other'];
  const TypeIcon = typeConfig.icon;

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
   * Format birthday display with days until
   */
  const formatBirthday = () => {
    if (!contact.birthday) return null;

    const date = new Date(contact.birthday);
    const formatted = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    if (contact.daysUntilBirthday === 0) {
      return `${formatted} (Today!)`;
    } else if (contact.daysUntilBirthday === 1) {
      return `${formatted} (Tomorrow)`;
    } else if (
      contact.daysUntilBirthday !== null &&
      contact.daysUntilBirthday <= 7
    ) {
      return `${formatted} (in ${contact.daysUntilBirthday} days)`;
    }

    return formatted;
  };

  return (
    <Card className="transition-all hover:shadow-md group">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar placeholder */}
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center text-white font-medium text-lg shrink-0"
            style={{ backgroundColor: '#6366F1' }}
          >
            {contact.name.charAt(0).toUpperCase()}
          </div>

          {/* Contact info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-neutral-900 truncate">
                {contact.name}
              </h3>
              <div
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                  typeConfig.className
                )}
              >
                <TypeIcon className="h-3 w-3" />
                {typeConfig.label}
              </div>
            </div>

            {/* Relationship */}
            {contact.relationship && (
              <p className="text-sm text-neutral-600 mb-1">
                {contact.relationship}
              </p>
            )}

            {/* Contact details */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
              {contact.birthday && (
                <span className="flex items-center gap-1">
                  <Cake className="h-3 w-3" />
                  {formatBirthday()}
                </span>
              )}
              {contact.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {contact.email}
                </span>
              )}
              {contact.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {contact.phone}
                </span>
              )}
            </div>
          </div>

          {/* Actions menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10">
                <button
                  onClick={() => {
                    onEdit(contact);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(contact.id);
                    setShowMenu(false);
                  }}
                  disabled={isDeleting}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notes (if present) */}
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
 * UpcomingBirthdayCard - Small card for upcoming birthday section
 */
interface UpcomingBirthdayCardProps {
  contact: ContactWithMeta;
  onClick: () => void;
}

function UpcomingBirthdayCard({ contact, onClick }: UpcomingBirthdayCardProps) {
  const isToday = contact.daysUntilBirthday === 0;
  const isTomorrow = contact.daysUntilBirthday === 1;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border text-left transition-colors',
        isToday
          ? 'bg-amber-50 border-amber-200 hover:bg-amber-100'
          : 'bg-white border-neutral-200 hover:bg-neutral-50'
      )}
    >
      <div
        className={cn(
          'h-10 w-10 rounded-full flex items-center justify-center',
          isToday ? 'bg-amber-200' : 'bg-neutral-100'
        )}
      >
        <Cake className={cn('h-5 w-5', isToday ? 'text-amber-700' : 'text-neutral-500')} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-neutral-900 truncate">{contact.name}</p>
        <p className="text-xs text-neutral-500">
          {isToday
            ? 'Birthday today!'
            : isTomorrow
            ? 'Tomorrow'
            : `In ${contact.daysUntilBirthday} days`}
          {contact.age !== null && ` · Turning ${contact.age + 1}`}
        </p>
      </div>
    </button>
  );
}

/**
 * Filter pills for contact type
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
    <div className="flex gap-2">
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
        >
          {filter.label}
          <span className="ml-1.5 text-xs opacity-70">({filter.count})</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for contacts
 */
function ContactsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-9 w-24 bg-neutral-200 rounded-full animate-pulse"
          />
        ))}
      </div>

      {/* Cards skeleton */}
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
// Main Page Component
// ============================================================================

export default function ContactsPage() {
  // UI state
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<FilterType>('all');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingContact, setEditingContact] = React.useState<Contact | null>(
    null
  );

  // Data hooks
  const {
    data: contacts = [],
    isLoading,
    error,
  } = useContacts({
    contactType: typeFilter === 'all' ? undefined : typeFilter,
    search: search || undefined,
  });

  const { data: upcomingBirthdays = [] } = useUpcomingBirthdays(14);
  const deleteContact = useDeleteContact();
  const stats = useContactStats();

  // Log page load for debugging
  React.useEffect(() => {
    logger.info('Contacts page loaded', {
      contactCount: contacts.length,
      upcomingBirthdays: upcomingBirthdays.length,
    });
    logger.divider('Contacts');
  }, [contacts.length, upcomingBirthdays.length]);

  /**
   * Handle opening the modal for editing
   */
  const handleEdit = (contact: Contact) => {
    logger.info('Opening contact for edit', { contactId: contact.id });
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  /**
   * Handle opening the modal for creating
   */
  const handleCreate = () => {
    logger.info('Opening modal to create new contact');
    setEditingContact(null);
    setIsModalOpen(true);
  };

  /**
   * Handle deleting a contact
   */
  const handleDelete = (contactId: string) => {
    logger.info('Deleting contact', { contactId });
    deleteContact.mutate(contactId);
  };

  /**
   * Handle modal close
   */
  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setEditingContact(null);
    }
  };

  /**
   * Clear search
   */
  const handleClearSearch = () => {
    setSearch('');
  };

  // Error state
  if (error) {
    logger.error('Failed to load contacts', { error });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-indigo-600" />
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Contacts</h1>
            {!isLoading && (
              <p className="text-sm text-neutral-500">
                {stats.total} contacts
                {stats.withBirthdays > 0 &&
                  ` · ${stats.withBirthdays} with birthdays`}
              </p>
            )}
          </div>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleCreate}>
          Add Contact
        </Button>
      </div>

      {/* Upcoming birthdays section */}
      {!isLoading && upcomingBirthdays.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-3">
            Upcoming Birthdays
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {upcomingBirthdays.slice(0, 4).map((contact) => (
              <UpcomingBirthdayCard
                key={contact.id}
                contact={contact}
                onClick={() => handleEdit(contact)}
              />
            ))}
          </div>
        </div>
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
                placeholder="Search contacts..."
                className="pl-10 pr-8"
              />
              {search && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
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
                      : "Add extended family, friends, and other contacts you want to remember. Track birthdays and stay connected!"
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

      {/* Contact Modal */}
      <ContactModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        contact={editingContact}
      />
    </div>
  );
}
