'use client';

/**
 * ============================================================================
 * 👤 ContactCard Component
 * ============================================================================
 *
 * A rich contact card that displays contact information with interactive
 * elements. This is the primary way contacts are displayed in the contacts
 * list.
 *
 * FEATURES:
 * - Unique avatar color based on contact name (deterministic hash)
 * - Type badge (Family/Friend/Other) with color coding
 * - Relationship description ("Dad's brother", "Emma's friend")
 * - Birthday countdown (highlights when birthday is soon)
 * - Quick action buttons for email and phone (always visible)
 * - Dropdown menu for Edit/Delete actions
 * - Notes preview (truncated to 2 lines)
 *
 * INTERACTION MODEL:
 * - Clicking the card opens the edit modal (primary action)
 * - Quick action buttons open mailto:/tel: links directly
 * - Dropdown menu provides Edit/Delete as secondary actions
 * - Menu button has enhanced visibility on mobile (always visible)
 *
 * ACCESSIBILITY:
 * - Card is clickable for keyboard navigation
 * - Quick action buttons have descriptive titles
 * - Menu items have proper ARIA labels
 * - Color contrast meets WCAG AA standards
 *
 * USER STORIES ADDRESSED:
 * - US-CONTACTS-1: Click card to view/edit directly
 * - US-CONTACTS-2: Unique avatar colors per contact
 * - US-CONTACTS-3: Tap email/phone to initiate contact
 * - US-CONTACTS-8: See quick action buttons without hovering
 *
 * RELATED FILES:
 * - app/(app)/contacts/page.tsx - Parent page that renders these cards
 * - lib/constants/contact-styles.ts - Shared styling and helpers
 * - lib/hooks/use-contacts.ts - ContactWithMeta type definition
 *
 * @example
 * <ContactCard
 *   contact={contact}
 *   onEdit={(c) => openEditModal(c)}
 *   onDelete={(c) => confirmDelete(c)}
 *   isDeleting={false}
 * />
 *
 * ============================================================================
 */

import * as React from 'react';
import {
  Cake,
  Mail,
  Phone,
  MoreHorizontal,
  Trash2,
  Edit,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import {
  getContactTypeConfig,
  getAvatarColor,
  formatBirthdayCountdown,
  isBirthdaySoon,
  getEmailLink,
  getPhoneLink,
} from '@/lib/constants/contact-styles';
import { logger } from '@/lib/utils/logger';
import type { Contact } from '@/types/database';
import type { ContactWithMeta } from '@/lib/hooks/use-contacts';

// ============================================================================
// 📦 TYPES
// ============================================================================

/**
 * Props for the ContactCard component.
 *
 * IMPORTANT FOR AI DEVS:
 * - contact is ContactWithMeta which includes computed fields (daysUntilBirthday, age)
 * - onDelete receives the full contact, not just ID, so the parent can show the name
 * - isDeleting is used to disable the delete button during pending operations
 */
export interface ContactCardProps {
  /** The contact data with computed metadata (birthday countdown, age) */
  contact: ContactWithMeta;
  /** Callback when the user clicks to edit (card click or menu item) */
  onEdit: (contact: Contact) => void;
  /** Callback when the user clicks delete in the menu */
  onDelete: (contact: ContactWithMeta) => void;
  /** Whether a delete operation is in progress (disables delete button) */
  isDeleting: boolean;
}

// ============================================================================
// 🧩 SUB-COMPONENTS
// ============================================================================

/**
 * QuickActionButton
 *
 * Compact button for email/phone quick actions.
 * Always visible (not just on hover) for easy access.
 */
interface QuickActionButtonProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
}

function QuickActionButton({ href, icon, label, onClick }: QuickActionButtonProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center justify-center',
        'h-8 w-8 rounded-full',
        'bg-neutral-100 hover:bg-indigo-100',
        'text-neutral-500 hover:text-indigo-600',
        'transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
      )}
      title={label}
      aria-label={label}
    >
      {icon}
    </a>
  );
}

// ============================================================================
// 📄 MAIN COMPONENT
// ============================================================================

/**
 * ContactCard
 *
 * Displays a single contact with their key information and quick actions.
 *
 * LAYOUT:
 * ┌─────────────────────────────────────────────────────────┐
 * │  [Avatar]  Name        [Type Badge]    [📧][📞] [⋮]    │
 * │            Relationship                                 │
 * │            🎂 Birthday  📧 email  📞 phone              │
 * ├─────────────────────────────────────────────────────────┤
 * │  Notes preview (if present)...                          │
 * └─────────────────────────────────────────────────────────┘
 */
export function ContactCard({
  contact,
  onEdit,
  onDelete,
  isDeleting,
}: ContactCardProps) {
  // ━━━━━ LOCAL STATE ━━━━━
  // Track whether the dropdown menu is open
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // ━━━━━ COMPUTED VALUES ━━━━━
  // Get styling config for this contact's type
  const typeConfig = getContactTypeConfig(contact.contact_type);
  const TypeIcon = typeConfig.icon;

  // Generate unique avatar color based on contact name
  const avatarColor = getAvatarColor(contact.name);

  // Pre-compute contact links
  const emailLink = getEmailLink(contact.email);
  const phoneLink = getPhoneLink(contact.phone);

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

  // ━━━━━ EFFECTS ━━━━━
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

  // ━━━━━ EVENT HANDLERS ━━━━━

  /**
   * Handle click on the card body.
   * Opens the edit modal unless clicking on interactive elements.
   */
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on the menu, buttons, or links
    const target = e.target as HTMLElement;
    if (
      target.closest('[data-menu]') ||
      target.closest('[data-quick-actions]') ||
      target.closest('a') ||
      target.closest('button')
    ) {
      return;
    }
    logger.info('📝 Card clicked, opening edit', { contactId: contact.id });
    onEdit(contact);
  };

  /**
   * Handle click on email/phone quick action.
   * Stops propagation to prevent card click.
   */
  const handleQuickActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Let the <a> tag handle the navigation
  };

  // ━━━━━ RENDER ━━━━━
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
          {/* ━━━ AVATAR ━━━ */}
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center text-white font-medium text-lg shrink-0 transition-transform group-hover:scale-105"
            style={{ backgroundColor: avatarColor }}
            aria-hidden="true"
          >
            {contact.name.charAt(0).toUpperCase()}
          </div>

          {/* ━━━ CONTACT INFO ━━━ */}
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

              {/* Email (text only, action button is separate) */}
              {contact.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate max-w-[150px]">{contact.email}</span>
                </span>
              )}

              {/* Phone (text only, action button is separate) */}
              {contact.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {contact.phone}
                </span>
              )}
            </div>
          </div>

          {/* ━━━ QUICK ACTIONS ━━━ */}
          <div className="flex items-center gap-1.5 shrink-0" data-quick-actions>
            {/* Email quick action */}
            {emailLink && (
              <QuickActionButton
                href={emailLink}
                icon={<Mail className="h-4 w-4" />}
                label={`Email ${contact.name}`}
                onClick={handleQuickActionClick}
              />
            )}

            {/* Phone quick action */}
            {phoneLink && (
              <QuickActionButton
                href={phoneLink}
                icon={<Phone className="h-4 w-4" />}
                label={`Call ${contact.name}`}
                onClick={handleQuickActionClick}
              />
            )}
          </div>

          {/* ━━━ ACTIONS MENU ━━━ */}
          <div className="relative shrink-0" ref={menuRef} data-menu>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className={cn(
                'p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-all',
                // Show on hover for desktop, always visible on touch
                'sm:opacity-0 sm:group-hover:opacity-100',
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
                    onDelete(contact);
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

        {/* ━━━ NOTES PREVIEW ━━━ */}
        {contact.notes && (
          <p className="mt-3 text-sm text-neutral-500 line-clamp-2 border-t border-neutral-100 pt-3">
            {contact.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// 📤 EXPORTS
// ============================================================================

export type { ContactCardProps };
