'use client';

/**
 * ============================================================================
 * 👤 ContactModal Component
 * ============================================================================
 *
 * A comprehensive modal for creating and editing contacts. Contacts represent
 * people outside the immediate family - extended family, friends, neighbors,
 * kids' friends' parents, etc.
 *
 * PRIMARY USE CASES:
 * 1. Track birthdays for people you care about
 * 2. Remember relationship context ("Dad's brother", "Emma's friend's mom")
 * 3. Store contact info for people you interact with regularly
 *
 * MODAL BEHAVIOR:
 * - Opens in "create" mode when no contact is passed
 * - Opens in "edit" mode when an existing contact is passed
 * - Form state resets when modal opens/closes
 * - Keyboard shortcut: Cmd/Ctrl+Enter to save
 * - ESC key closes modal (handled by Dialog component)
 *
 * DATA FLOW:
 * 1. Props determine create vs edit mode
 * 2. Form state managed locally with useState
 * 3. On submit, calls useCreateContact or useUpdateContact
 * 4. On success, closes modal and invalidates contact queries
 * 5. Parent component handles modal visibility
 *
 * USER STORIES ADDRESSED:
 * - US-10.2: Manage Contacts - create and edit contacts with all details
 *
 * RELATED FILES:
 * - lib/hooks/use-contacts.ts - CRUD operations
 * - lib/constants/contact-styles.ts - Shared styling constants
 * - app/(app)/contacts/page.tsx - Parent page that opens this modal
 *
 * ============================================================================
 */

import * as React from 'react';
import {
  User,
  Mail,
  Phone,
  Cake,
  Calendar,
  FileText,
  MapPin,
  ChevronDown,
  ChevronUp,
  Heart,
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
import {
  CONTACT_TYPE_CONFIG,
  getContactTypeConfig,
  getAvatarColor,
} from '@/lib/constants/contact-styles';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils/cn';
import type { Contact, ContactType } from '@/types/database';

// ============================================================================
// 📦 TYPES
// ============================================================================

/**
 * Props for the ContactModal component.
 *
 * IMPORTANT FOR AI DEVS:
 * - If `contact` is provided, modal opens in EDIT mode
 * - If `contact` is null/undefined, modal opens in CREATE mode
 * - `onSuccess` is optional - use it for additional actions after save
 */
interface ContactModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when open state changes (e.g., user closes modal) */
  onOpenChange: (open: boolean) => void;
  /** Existing contact to edit (if provided, modal is in edit mode) */
  contact?: Contact | null;
  /** Initial name for quick create (e.g., from a "Add contact named X" flow) */
  initialName?: string;
  /** Callback when contact is saved successfully */
  onSuccess?: (contact: Contact) => void;
}

/**
 * Internal form state shape.
 * All fields are strings for controlled inputs.
 * Null/undefined handling happens on submit.
 */
interface ContactFormData {
  name: string;
  contact_type: ContactType;
  email: string;
  phone: string;
  birthday: string;
  anniversary: string;
  relationship: string;
  notes: string;
  // Address fields (collapsible section)
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

// ============================================================================
// 🔧 HELPERS
// ============================================================================

/**
 * Get initial form data from an existing contact or defaults.
 *
 * WHY THIS EXISTS:
 * When switching between create/edit mode or when the contact prop changes,
 * we need to reset the form to the appropriate values.
 *
 * @param contact - Existing contact for edit mode (null for create mode)
 * @param initialName - Pre-filled name for quick create flows
 * @returns Form data object with all fields populated
 */
function getInitialFormData(
  contact?: Contact | null,
  initialName?: string
): ContactFormData {
  if (contact) {
    // Edit mode: populate from existing contact
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

  // Create mode: start with defaults
  return {
    name: initialName || '',
    contact_type: 'family', // Default to family (most common use case)
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

/**
 * Check if any address fields are populated.
 * Used to auto-expand the address section in edit mode.
 *
 * @param contact - The contact to check
 * @returns True if any address field has a value
 */
function hasAddressData(contact: Contact | null | undefined): boolean {
  if (!contact) return false;
  return !!(
    contact.address_line1 ||
    contact.city ||
    contact.state ||
    contact.postal_code
  );
}

// ============================================================================
// 🧩 SUB-COMPONENTS
// ============================================================================

/**
 * ContactTypeSelector
 *
 * Visual button group for selecting contact type.
 * Shows icon, label, and uses color coding from shared constants.
 *
 * ACCESSIBILITY:
 * - Uses role="radiogroup" pattern
 * - Keyboard navigable with Tab
 * - Visual focus states
 */
interface ContactTypeSelectorProps {
  value: ContactType;
  onChange: (type: ContactType) => void;
}

function ContactTypeSelector({ value, onChange }: ContactTypeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Contact type">
      {(Object.keys(CONTACT_TYPE_CONFIG) as ContactType[]).map((type) => {
        const config = CONTACT_TYPE_CONFIG[type];
        const Icon = config.icon;
        const isSelected = value === type;

        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(type)}
            className={cn(
              'flex flex-col items-center py-2.5 px-2 rounded-lg text-xs font-medium transition-all',
              'border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
              isSelected
                ? config.buttonClassName
                : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
            )}
          >
            <Icon className="h-5 w-5 mb-1" />
            {config.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * AddressSection
 *
 * Collapsible section for address fields.
 * Keeps the main form clean while allowing full address capture.
 *
 * BEHAVIOR:
 * - Collapsed by default for new contacts
 * - Auto-expanded if contact has address data
 * - Toggle button shows chevron indicating expand/collapse
 */
interface AddressSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  formData: ContactFormData;
  onFieldChange: (field: keyof ContactFormData, value: string) => void;
}

function AddressSection({
  isExpanded,
  onToggle,
  formData,
  onFieldChange,
}: AddressSectionProps) {
  return (
    <div>
      {/* Section toggle header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
        aria-expanded={isExpanded}
      >
        <MapPin className="h-4 w-4" />
        Address
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        {!isExpanded && formData.city && (
          <span className="text-xs text-neutral-400 ml-1">
            ({formData.city})
          </span>
        )}
      </button>

      {/* Collapsible address fields */}
      {isExpanded && (
        <div className="mt-3 space-y-3 pl-6 border-l-2 border-neutral-100">
          <Input
            value={formData.address_line1}
            onChange={(e) => onFieldChange('address_line1', e.target.value)}
            placeholder="Street address"
            aria-label="Street address"
          />
          <Input
            value={formData.address_line2}
            onChange={(e) => onFieldChange('address_line2', e.target.value)}
            placeholder="Apt, suite, etc. (optional)"
            aria-label="Apartment or suite"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={formData.city}
              onChange={(e) => onFieldChange('city', e.target.value)}
              placeholder="City"
              aria-label="City"
            />
            <Input
              value={formData.state}
              onChange={(e) => onFieldChange('state', e.target.value)}
              placeholder="State"
              aria-label="State"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={formData.postal_code}
              onChange={(e) => onFieldChange('postal_code', e.target.value)}
              placeholder="Postal code"
              aria-label="Postal code"
            />
            <Input
              value={formData.country}
              onChange={(e) => onFieldChange('country', e.target.value)}
              placeholder="Country"
              aria-label="Country"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 📄 MAIN COMPONENT
// ============================================================================

/**
 * ContactModal
 *
 * Modal dialog for creating or editing a contact.
 *
 * FORM FIELDS:
 * - Name (required): Contact's full name
 * - Type: Family, Friend, or Other (visual selector)
 * - Relationship: How they're connected ("Dad's brother", "Emma's friend")
 * - Email: Contact email (validates format)
 * - Phone: Contact phone number
 * - Birthday: Date picker for birthday tracking
 * - Anniversary: Optional anniversary date
 * - Notes: Free-form text for additional info
 * - Address: Collapsible section with full address fields
 *
 * @example
 * // Create mode
 * <ContactModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * />
 *
 * @example
 * // Edit mode
 * <ContactModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   contact={existingContact}
 * />
 */
export function ContactModal({
  open,
  onOpenChange,
  contact,
  initialName,
  onSuccess,
}: ContactModalProps) {
  // Determine mode from props
  const isEditMode = !!contact;

  // ━━━━━ FORM STATE ━━━━━
  const [formData, setFormData] = React.useState<ContactFormData>(() =>
    getInitialFormData(contact, initialName)
  );

  // ━━━━━ UI STATE ━━━━━
  // Auto-expand address section if contact has address data
  const [showAddress, setShowAddress] = React.useState(() =>
    hasAddressData(contact)
  );

  // ━━━━━ MUTATIONS ━━━━━
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const isPending = createContact.isPending || updateContact.isPending;

  // ━━━━━ EFFECTS ━━━━━
  /**
   * Reset form when modal opens or contact changes.
   *
   * WHY: Ensures form state matches the current mode (create vs edit)
   * and prevents stale data from previous interactions.
   */
  React.useEffect(() => {
    if (open) {
      logger.info('👤 ContactModal opened', {
        mode: isEditMode ? 'edit' : 'create',
        contactId: contact?.id,
        contactName: contact?.name,
      });
      setFormData(getInitialFormData(contact, initialName));
      setShowAddress(hasAddressData(contact));
    }
  }, [open, contact, initialName, isEditMode]);

  // ━━━━━ EVENT HANDLERS ━━━━━

  /**
   * Update a single form field.
   * Uses generic type for type safety.
   */
  const updateField = <K extends keyof ContactFormData>(
    field: K,
    value: ContactFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Handle form submission.
   *
   * FLOW:
   * 1. Validate required fields (name)
   * 2. Prepare data (trim strings, convert empty to null)
   * 3. Call appropriate mutation (create or update)
   * 4. On success: close modal, trigger onSuccess callback
   * 5. On error: show toast (handled by mutation hook)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      logger.warn('⚠️ Contact name is required');
      return;
    }

    logger.info('💾 Saving contact...', {
      mode: isEditMode ? 'edit' : 'create',
      name: formData.name,
    });

    try {
      if (isEditMode && contact) {
        // ━━━ UPDATE EXISTING CONTACT ━━━
        const result = await updateContact.mutateAsync({
          id: contact.id,
          name: formData.name.trim(),
          contact_type: formData.contact_type,
          // Convert empty strings to null for optional fields
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
        logger.success('✅ Contact updated!', { id: result.id, name: result.name });
        onSuccess?.(result);
      } else {
        // ━━━ CREATE NEW CONTACT ━━━
        const input: CreateContactInput = {
          name: formData.name.trim(),
          contact_type: formData.contact_type,
          // Convert empty strings to undefined for optional fields
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
        logger.success('✅ Contact created!', { id: result.id, name: result.name });
        onSuccess?.(result);
      }

      // Close modal on success
      onOpenChange(false);
    } catch (error) {
      logger.error('❌ Failed to save contact', { error });
      // Error toast is handled by the mutation hook
    }
  };

  /**
   * Handle keyboard shortcuts.
   * Cmd/Ctrl + Enter = Submit form
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  // Get current type config for header styling
  const typeConfig = getContactTypeConfig(formData.contact_type);
  const TypeIcon = typeConfig.icon;

  // ━━━━━ RENDER ━━━━━
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        className="max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Modal header */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-500" />
            {isEditMode ? 'Edit Contact' : 'Add Contact'}
          </DialogTitle>
        </DialogHeader>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <DialogBody className="space-y-4 overflow-y-auto flex-1">
            {/* ━━━ NAME INPUT ━━━ */}
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

            {/* ━━━ CONTACT TYPE SELECTOR ━━━ */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-neutral-600 mb-2">
                <TypeIcon className="h-4 w-4" />
                Type
              </label>
              <ContactTypeSelector
                value={formData.contact_type}
                onChange={(type) => updateField('contact_type', type)}
              />
            </div>

            {/* ━━━ RELATIONSHIP ━━━ */}
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

            {/* ━━━ CONTACT INFO ROW ━━━ */}
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

            {/* ━━━ IMPORTANT DATES ROW ━━━ */}
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

            {/* ━━━ NOTES ━━━ */}
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

            {/* ━━━ ADDRESS SECTION (COLLAPSIBLE) ━━━ */}
            <AddressSection
              isExpanded={showAddress}
              onToggle={() => setShowAddress(!showAddress)}
              formData={formData}
              onFieldChange={updateField}
            />
          </DialogBody>

          {/* Footer with action buttons */}
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
// 📤 EXPORTS
// ============================================================================

export type { ContactModalProps };
