'use client';

/**
 * ============================================================================
 * 👤 ContactModal Component
 * ============================================================================
 *
 * A comprehensive modal for creating and editing contacts.
 * Contacts are people outside the immediate family - extended family,
 * friends, kids' friends' parents, etc.
 *
 * Features:
 * - Create new contacts with full details
 * - Edit existing contacts
 * - Contact type selection (family, friend, other)
 * - Birthday and anniversary tracking
 * - Relationship description (e.g., "Dad's brother", "Emma's friend's mom")
 * - Address and contact info
 * - Keyboard shortcuts (Cmd+Enter to save)
 *
 * Usage:
 * ```tsx
 * // Create mode
 * <ContactModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * />
 *
 * // Edit mode
 * <ContactModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   contact={existingContact}
 * />
 * ```
 *
 * User Stories Addressed:
 * - US-10.2: Manage Contacts - create and edit contacts with all details
 *
 * ============================================================================
 */

import * as React from 'react';
import {
  Users,
  User,
  Heart,
  Mail,
  Phone,
  Cake,
  Calendar,
  FileText,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useCreateContact,
  useUpdateContact,
  type CreateContactInput,
} from '@/lib/hooks/use-contacts';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils/cn';
import type { Contact, ContactType } from '@/types/database';

// ============================================================================
// Types
// ============================================================================

interface ContactModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Existing contact to edit (if provided, modal is in edit mode) */
  contact?: Contact | null;
  /** Initial name (for quick create) */
  initialName?: string;
  /** Callback when contact is saved successfully */
  onSuccess?: (contact: Contact) => void;
}

interface ContactFormData {
  name: string;
  contact_type: ContactType;
  email: string;
  phone: string;
  birthday: string;
  anniversary: string;
  relationship: string;
  notes: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Contact type configuration with icons and colors
 *
 * Types help organize contacts:
 * - family: Extended family members (grandparents, cousins, aunts/uncles)
 * - friend: Friends of the family or individual family members
 * - other: Everyone else (neighbors, acquaintances, etc.)
 */
const CONTACT_TYPE_CONFIG: Record<
  ContactType,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    description: string;
  }
> = {
  family: {
    label: 'Family',
    icon: Users,
    color: 'text-rose-600 border-rose-200 bg-rose-50',
    description: 'Extended family',
  },
  friend: {
    label: 'Friend',
    icon: Heart,
    color: 'text-blue-600 border-blue-200 bg-blue-50',
    description: 'Friends',
  },
  other: {
    label: 'Other',
    icon: User,
    color: 'text-neutral-600 border-neutral-200 bg-neutral-50',
    description: 'Others',
  },
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get initial form data from contact or defaults
 */
function getInitialFormData(
  contact?: Contact | null,
  initialName?: string
): ContactFormData {
  if (contact) {
    return {
      name: contact.name,
      contact_type: contact.contact_type || 'other',
      email: contact.email || '',
      phone: contact.phone || '',
      birthday: contact.birthday || '',
      anniversary: contact.anniversary || '',
      relationship: contact.relationship || '',
      notes: contact.notes || '',
      address_line1: contact.address_line1 || '',
      address_line2: contact.address_line2 || '',
      city: contact.city || '',
      state: contact.state || '',
      postal_code: contact.postal_code || '',
      country: contact.country || '',
    };
  }

  return {
    name: initialName || '',
    contact_type: 'family',
    email: '',
    phone: '',
    birthday: '',
    anniversary: '',
    relationship: '',
    notes: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  };
}

// ============================================================================
// Component
// ============================================================================

/**
 * ContactModal - Create or edit a contact
 *
 * Contacts are people outside the immediate family that you want to
 * remember birthdays for, keep track of relationships, etc.
 */
export function ContactModal({
  open,
  onOpenChange,
  contact,
  initialName,
  onSuccess,
}: ContactModalProps) {
  const isEditMode = !!contact;

  // Form state
  const [formData, setFormData] = React.useState<ContactFormData>(() =>
    getInitialFormData(contact, initialName)
  );

  // UI state
  const [showAddress, setShowAddress] = React.useState(() => {
    // Show address section if any address field is populated
    if (contact) {
      return !!(
        contact.address_line1 ||
        contact.city ||
        contact.state ||
        contact.postal_code
      );
    }
    return false;
  });

  // Mutations
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();

  const isPending = createContact.isPending || updateContact.isPending;

  // Reset form when contact changes or modal opens
  React.useEffect(() => {
    if (open) {
      logger.info('👤 ContactModal opened', {
        isEditMode,
        contactId: contact?.id,
      });
      setFormData(getInitialFormData(contact, initialName));
      // Show address section if editing and has address data
      if (contact) {
        setShowAddress(
          !!(
            contact.address_line1 ||
            contact.city ||
            contact.state ||
            contact.postal_code
          )
        );
      } else {
        setShowAddress(false);
      }
    }
  }, [open, contact, initialName, isEditMode]);

  /**
   * Update a single form field
   */
  const updateField = <K extends keyof ContactFormData>(
    field: K,
    value: ContactFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      logger.warn('⚠️ Contact name is required');
      return;
    }

    logger.info('💾 Saving contact...', {
      isEditMode,
      name: formData.name,
    });

    try {
      if (isEditMode && contact) {
        // Update existing contact
        const result = await updateContact.mutateAsync({
          id: contact.id,
          name: formData.name.trim(),
          contact_type: formData.contact_type,
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          birthday: formData.birthday || null,
          anniversary: formData.anniversary || null,
          relationship: formData.relationship.trim() || null,
          notes: formData.notes.trim() || null,
          address_line1: formData.address_line1.trim() || null,
          address_line2: formData.address_line2.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          postal_code: formData.postal_code.trim() || null,
          country: formData.country.trim() || null,
        });
        logger.success('✅ Contact updated!', { id: result.id });
        onSuccess?.(result);
      } else {
        // Create new contact
        const input: CreateContactInput = {
          name: formData.name.trim(),
          contact_type: formData.contact_type,
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          birthday: formData.birthday || undefined,
          anniversary: formData.anniversary || undefined,
          relationship: formData.relationship.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          address_line1: formData.address_line1.trim() || undefined,
          address_line2: formData.address_line2.trim() || undefined,
          city: formData.city.trim() || undefined,
          state: formData.state.trim() || undefined,
          postal_code: formData.postal_code.trim() || undefined,
          country: formData.country.trim() || undefined,
        };
        const result = await createContact.mutateAsync(input);
        logger.success('✅ Contact created!', { id: result.id });
        onSuccess?.(result);
      }

      // Close modal on success
      onOpenChange(false);
    } catch (error) {
      logger.error('❌ Failed to save contact', { error });
      // Error is handled by the mutation hook (toast shown)
    }
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to save
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const TypeIcon = CONTACT_TYPE_CONFIG[formData.contact_type].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        className="max-h-[90vh] overflow-hidden flex flex-col"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-500" />
            {isEditMode ? 'Edit Contact' : 'Add Contact'}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <DialogBody className="space-y-4 overflow-y-auto flex-1">
            {/* Name input */}
            <div>
              <label htmlFor="contact-name" className="sr-only">
                Contact name
              </label>
              <Input
                id="contact-name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Contact name"
                autoFocus
                className="text-lg font-medium"
              />
            </div>

            {/* Contact type selection */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-2">
                <TypeIcon className="h-4 w-4" />
                Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(CONTACT_TYPE_CONFIG) as ContactType[]).map(
                  (type) => {
                    const config = CONTACT_TYPE_CONFIG[type];
                    const Icon = config.icon;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateField('contact_type', type)}
                        className={cn(
                          'flex flex-col items-center py-2.5 px-2 rounded-lg text-xs font-medium transition-colors',
                          'border',
                          formData.contact_type === type
                            ? config.color
                            : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                        )}
                      >
                        <Icon className="h-5 w-5 mb-1" />
                        {config.label}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Relationship */}
            <div>
              <label
                htmlFor="relationship"
                className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5"
              >
                <Heart className="h-4 w-4" />
                Relationship
              </label>
              <Input
                id="relationship"
                value={formData.relationship}
                onChange={(e) => updateField('relationship', e.target.value)}
                placeholder="e.g., Dad's brother, Emma's friend's mom"
              />
              <p className="text-xs text-neutral-500 mt-1">
                How is this person connected to your family?
              </p>
            </div>

            {/* Contact info row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="email"
                  className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5"
                >
                  <Phone className="h-4 w-4" />
                  Phone
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Important dates row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="birthday"
                  className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5"
                >
                  <Cake className="h-4 w-4" />
                  Birthday
                </label>
                <Input
                  id="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => updateField('birthday', e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="anniversary"
                  className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5"
                >
                  <Calendar className="h-4 w-4" />
                  Anniversary
                </label>
                <Input
                  id="anniversary"
                  type="date"
                  value={formData.anniversary}
                  onChange={(e) => updateField('anniversary', e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="notes"
                className="flex items-center gap-1.5 text-sm text-neutral-600 mb-1.5"
              >
                <FileText className="h-4 w-4" />
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Any notes about this contact..."
                rows={2}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border border-neutral-300',
                  'text-sm resize-none',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                )}
              />
            </div>

            {/* Address section (collapsible) */}
            <div>
              <button
                type="button"
                onClick={() => setShowAddress(!showAddress)}
                className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <MapPin className="h-4 w-4" />
                Address
                {showAddress ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showAddress && (
                <div className="mt-3 space-y-3 pl-6 border-l-2 border-neutral-100">
                  <Input
                    value={formData.address_line1}
                    onChange={(e) =>
                      updateField('address_line1', e.target.value)
                    }
                    placeholder="Street address"
                  />
                  <Input
                    value={formData.address_line2}
                    onChange={(e) =>
                      updateField('address_line2', e.target.value)
                    }
                    placeholder="Apt, suite, etc. (optional)"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="City"
                    />
                    <Input
                      value={formData.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      placeholder="State"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={formData.postal_code}
                      onChange={(e) =>
                        updateField('postal_code', e.target.value)
                      }
                      placeholder="Postal code"
                    />
                    <Input
                      value={formData.country}
                      onChange={(e) => updateField('country', e.target.value)}
                      placeholder="Country"
                    />
                  </div>
                </div>
              )}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isPending}
              disabled={!formData.name.trim()}
            >
              {isEditMode ? 'Save Changes' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Exports
// ============================================================================

export type { ContactModalProps };
