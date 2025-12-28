'use client';

/**
 * ============================================================================
 * 👥 Contacts Hooks
 * ============================================================================
 *
 * React Query hooks for managing contacts (extended family, friends, etc.)
 *
 * WHAT ARE CONTACTS?
 * Contacts are people outside the immediate family household. Unlike
 * family_members (who are part of the Fam app), contacts are external people
 * whose birthdays and contact info you want to track.
 *
 * USE CASES:
 * - Track extended family birthdays (grandparents, cousins, aunts/uncles)
 * - Remember friends' contact info and birthdays
 * - Store relationship context ("Dad's brother", "Emma's friend's mom")
 * - Future: Import from Google Contacts (Phase 2)
 *
 * FEATURES:
 * - Full CRUD operations with optimistic updates
 * - Filtering by contact type, import source
 * - Full-text search by name or email
 * - Upcoming birthday queries with computed countdown
 * - Contact stats (counts by type)
 *
 * DATA FLOW:
 * 1. Components call hooks (useContacts, useContact, etc.)
 * 2. Hooks use TanStack Query for caching and state management
 * 3. Data is fetched from/written to Supabase "contacts" table
 * 4. Cache is invalidated on mutations for consistency
 *
 * USER STORIES ADDRESSED:
 * - US-10.2: Manage Contacts - view, create, edit, delete contacts
 *
 * RELATED FILES:
 * - app/(app)/contacts/page.tsx - Main contacts page
 * - components/modals/contact-modal.tsx - Create/edit modal
 * - lib/constants/contact-styles.ts - Shared styling constants
 * - lib/query-keys.ts - Query key definitions (ContactFilters type)
 * - types/database.ts - Contact, ContactType types
 *
 * ============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { queryKeys, type ContactFilters } from '@/lib/query-keys';
import { logger } from '@/lib/utils/logger';
import type { Contact, ContactType } from '@/types/database';

// ============================================================================
// 📦 TYPES
// ============================================================================

/**
 * Input type for creating a new contact.
 *
 * WHY SEPARATE FROM Contact:
 * - Contact has auto-generated fields (id, family_id, created_at, etc.)
 * - CreateContactInput only includes user-provided fields
 * - All fields except name and contact_type are optional
 *
 * VALIDATION NOTES:
 * - Name is required (validated in ContactModal)
 * - Email format is validated by browser (type="email")
 * - Birthday/anniversary accept YYYY-MM-DD format
 */
export interface CreateContactInput {
  name: string;
  contact_type: ContactType;
  email?: string;
  phone?: string;
  birthday?: string;
  anniversary?: string;
  notes?: string;
  relationship?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

/**
 * Input type for updating an existing contact.
 * Extends CreateContactInput but makes all fields optional except id.
 *
 * WHY PARTIAL:
 * Allows updating just one field without sending entire contact.
 * e.g., updateContact.mutate({ id: 'abc', phone: '555-1234' })
 */
export interface UpdateContactInput extends Partial<CreateContactInput> {
  id: string;
}

/**
 * Extended contact with computed properties for UI display.
 *
 * COMPUTED FIELDS:
 * - daysUntilBirthday: Days until next birthday (0 = today, null = no birthday)
 * - age: Current age in years (null = no birthday)
 *
 * WHY COMPUTED IN CLIENT:
 * - These values change daily
 * - Computing in DB would require timezone awareness
 * - Client computation is fast and timezone-correct
 */
export interface ContactWithMeta extends Contact {
  /** Days until next birthday (null if no birthday set) */
  daysUntilBirthday?: number | null;
  /** Current age in years (null if no birthday set) */
  age?: number | null;
}

// ============================================================================
// 🔧 HELPERS
// ============================================================================

/**
 * Calculate days until next birthday.
 *
 * ALGORITHM:
 * 1. Get this year's birthday date
 * 2. If already passed, use next year's birthday
 * 3. Return difference in days
 *
 * EDGE CASES:
 * - Leap year birthdays (Feb 29) are handled by JavaScript Date
 * - Today's birthday returns 0
 * - Tomorrow's birthday returns 1
 *
 * @param birthdayStr - Birthday in YYYY-MM-DD format
 * @returns Days until next birthday, or null if no birthday
 */
function getDaysUntilBirthday(birthdayStr: string | null): number | null {
  if (!birthdayStr) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to midnight

  const birthday = new Date(birthdayStr);
  const thisYearBirthday = new Date(
    today.getFullYear(),
    birthday.getMonth(),
    birthday.getDate()
  );

  // If birthday already passed this year, calculate for next year
  if (thisYearBirthday < today) {
    thisYearBirthday.setFullYear(today.getFullYear() + 1);
  }

  const diffTime = thisYearBirthday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Calculate current age from birthday.
 *
 * ALGORITHM:
 * 1. Get year difference
 * 2. Subtract 1 if birthday hasn't occurred this year yet
 *
 * @param birthdayStr - Birthday in YYYY-MM-DD format
 * @returns Age in years, or null if no birthday
 */
function getAge(birthdayStr: string | null): number | null {
  if (!birthdayStr) return null;

  const today = new Date();
  const birthday = new Date(birthdayStr);
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();

  // Subtract 1 if birthday hasn't happened yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }

  return age;
}

/**
 * Enhance a contact with computed metadata (daysUntilBirthday, age).
 *
 * WHEN CALLED:
 * - After fetching contacts from Supabase
 * - Before returning data to components
 *
 * @param contact - Raw contact from database
 * @returns Contact with computed properties added
 */
function enhanceContact(contact: Contact): ContactWithMeta {
  return {
    ...contact,
    daysUntilBirthday: getDaysUntilBirthday(contact.birthday),
    age: getAge(contact.birthday),
  };
}

// ============================================================================
// 📖 QUERY HOOKS (Read operations)
// ============================================================================

/**
 * Fetch all contacts with optional filters.
 *
 * FILTERING OPTIONS:
 * - contactType: Filter by 'family', 'friend', or 'other'
 * - importedFrom: Filter by import source ('manual', 'google', 'csv')
 * - hasBirthday: true = only with birthdays, false = only without
 * - search: Case-insensitive search in name and email
 *
 * CACHING:
 * - staleTime: 5 minutes (contacts don't change frequently)
 * - Refetches on window focus
 * - Invalidated on create/update/delete mutations
 *
 * @param filters - Optional filters for the query
 * @returns Query result with contacts array
 *
 * @example
 * // Get all contacts
 * const { data: contacts } = useContacts()
 *
 * @example
 * // Get only family contacts
 * const { data: familyContacts } = useContacts({ contactType: 'family' })
 *
 * @example
 * // Search contacts
 * const { data: results } = useContacts({ search: 'smith' })
 */
export function useContacts(filters?: ContactFilters) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.contacts.list(filters),
    queryFn: async (): Promise<ContactWithMeta[]> => {
      logger.info('👥 Fetching contacts...', { filters });

      let query = supabase
        .from('contacts')
        .select('*')
        .is('deleted_at', null) // Only non-deleted contacts
        .order('name', { ascending: true }); // Alphabetical order

      // Apply filters dynamically
      if (filters?.contactType) {
        query = query.eq('contact_type', filters.contactType);
      }

      if (filters?.importedFrom) {
        query = query.eq('imported_from', filters.importedFrom);
      }

      if (filters?.hasBirthday === true) {
        query = query.not('birthday', 'is', null);
      } else if (filters?.hasBirthday === false) {
        query = query.is('birthday', null);
      }

      if (filters?.search) {
        // Search by name OR email (case-insensitive)
        query = query.or(
          `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        logger.error('❌ Failed to fetch contacts', { error: error.message });
        throw error;
      }

      // Enhance all contacts with computed properties
      const enhancedContacts = (data ?? []).map(enhanceContact);

      logger.success(`✅ Fetched ${enhancedContacts.length} contacts`);
      return enhancedContacts;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch a single contact by ID with computed metadata.
 *
 * USE CASES:
 * - Contact detail view
 * - Pre-populating edit form
 * - Checking contact existence
 *
 * @param id - Contact UUID
 * @returns Query result with single contact object
 *
 * @example
 * const { data: contact, isLoading } = useContact(contactId)
 */
export function useContact(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.contacts.detail(id),
    queryFn: async (): Promise<ContactWithMeta> => {
      logger.info('👤 Fetching contact...', { id });

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        logger.error('❌ Failed to fetch contact', { error: error.message });
        throw error;
      }

      logger.success('✅ Contact loaded', { name: data?.name });
      return enhanceContact(data as Contact);
    },
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Fetch contacts with upcoming birthdays in the next N days.
 *
 * ALGORITHM:
 * 1. Fetch all contacts with birthdays
 * 2. Filter to those within the date range
 * 3. Sort by days until birthday (soonest first)
 *
 * WHY CLIENT-SIDE FILTERING:
 * - Birthday month/day comparison is tricky in SQL with year wrapping
 * - Contact count is typically small (<1000)
 * - Client filtering is fast and accurate
 *
 * @param days - Number of days to look ahead (default: 30)
 * @returns Query result with contacts sorted by upcoming birthday
 *
 * @example
 * // Get contacts with birthdays in the next 14 days
 * const { data: upcoming } = useUpcomingBirthdays(14)
 */
export function useUpcomingBirthdays(days: number = 30) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.contacts.upcomingBirthdays(days),
    queryFn: async (): Promise<ContactWithMeta[]> => {
      logger.info('🎂 Fetching contacts with upcoming birthdays...', { days });

      // Fetch all contacts with birthdays set
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .is('deleted_at', null)
        .not('birthday', 'is', null)
        .order('name', { ascending: true });

      if (error) {
        logger.error('❌ Failed to fetch contacts', { error: error.message });
        throw error;
      }

      // Filter and sort by days until birthday
      const enhancedContacts = (data ?? [])
        .map(enhanceContact)
        .filter((contact) => {
          const daysUntil = contact.daysUntilBirthday;
          return daysUntil != null && daysUntil >= 0 && daysUntil <= days;
        })
        .sort((a, b) => (a.daysUntilBirthday ?? 999) - (b.daysUntilBirthday ?? 999));

      logger.success(`✅ Found ${enhancedContacts.length} upcoming birthdays`);
      return enhancedContacts;
    },
    staleTime: 1000 * 60 * 60, // 1 hour (birthdays don't change often)
  });
}

/**
 * Search contacts by name or email.
 * Convenience wrapper around useContacts with search filter.
 *
 * @param query - Search string (case-insensitive)
 * @returns Query result with matching contacts
 *
 * @example
 * const [search, setSearch] = useState('')
 * const { data: results } = useSearchContacts(search)
 */
export function useSearchContacts(searchQuery: string) {
  return useContacts({ search: searchQuery });
}

// ============================================================================
// ✏️ MUTATION HOOKS (Write operations)
// ============================================================================

/**
 * Create a new contact.
 *
 * FLOW:
 * 1. Insert new row in contacts table
 * 2. Set imported_from to 'manual' (user-created)
 * 3. On success: invalidate all contact queries, show toast
 * 4. On error: show error toast
 *
 * AUTO-SET FIELDS:
 * - id: Generated by Supabase (UUID)
 * - family_id: Set by RLS policy
 * - imported_from: 'manual'
 * - created_at, updated_at: Set by database
 *
 * @example
 * const createContact = useCreateContact()
 *
 * createContact.mutate({
 *   name: 'Grandma Rose',
 *   contact_type: 'family',
 *   birthday: '1945-03-15',
 *   relationship: "Dad's mom"
 * })
 */
export function useCreateContact() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: CreateContactInput) => {
      logger.info('➕ Creating contact...', { name: input.name });

      const { data, error } = await supabase
        .from('contacts')
        .insert({
          ...input,
          // Mark as manually created (vs imported from Google, CSV)
          imported_from: 'manual',
        })
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to create contact', { error: error.message });
        throw error;
      }

      logger.success('✅ Contact created!', { name: data?.name, id: data?.id });
      return data as Contact;
    },

    onSuccess: () => {
      // Invalidate all contact queries to refresh lists
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      // Also invalidate birthday queries since this contact might have a birthday
      queryClient.invalidateQueries({ queryKey: queryKeys.birthdays.all });
      toast.success('👤 Contact added!');
    },

    onError: (error) => {
      toast.error('Failed to add contact. Please try again.');
      logger.error('Create contact error', { error });
    },
  });
}

/**
 * Update an existing contact.
 *
 * FLOW:
 * 1. Update row with provided fields
 * 2. Auto-update updated_at timestamp
 * 3. On success: update cache directly, invalidate lists
 * 4. On error: show error toast
 *
 * PARTIAL UPDATES:
 * Only fields included in the input will be updated.
 * Other fields remain unchanged.
 *
 * @example
 * const updateContact = useUpdateContact()
 *
 * // Update just the phone number
 * updateContact.mutate({
 *   id: contactId,
 *   phone: '555-1234',
 * })
 *
 * // Update multiple fields
 * updateContact.mutate({
 *   id: contactId,
 *   phone: '555-1234',
 *   notes: 'Prefers text messages',
 * })
 */
export function useUpdateContact() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateContactInput) => {
      logger.info('📝 Updating contact...', { id });

      const { data, error } = await supabase
        .from('contacts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('❌ Failed to update contact', { error: error.message });
        throw error;
      }

      logger.success('✅ Contact updated!', { name: data?.name });
      return data as Contact;
    },

    onSuccess: (data) => {
      // Update the specific contact in cache (optimistic-ish)
      queryClient.setQueryData(
        queryKeys.contacts.detail(data.id),
        enhanceContact(data)
      );
      // Invalidate contact lists to refresh with new data
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.list() });
      // Invalidate birthday queries since birthday might have changed
      queryClient.invalidateQueries({ queryKey: queryKeys.birthdays.all });
      toast.success('Contact updated!');
    },

    onError: () => {
      toast.error('Failed to update contact');
    },
  });
}

/**
 * Delete a contact (soft delete).
 *
 * SOFT DELETE PATTERN:
 * - Sets deleted_at timestamp instead of removing row
 * - Allows recovery if needed
 * - Maintains referential integrity
 *
 * OPTIMISTIC UPDATE:
 * Contact is removed from UI immediately.
 * If delete fails, contact is restored.
 *
 * @example
 * const deleteContact = useDeleteContact()
 * deleteContact.mutate(contactId)
 */
export function useDeleteContact() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (contactId: string) => {
      logger.info('🗑️ Deleting contact...', { contactId });

      // Soft delete by setting deleted_at timestamp
      const { error } = await supabase
        .from('contacts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', contactId);

      if (error) {
        logger.error('❌ Failed to delete contact', { error: error.message });
        throw error;
      }

      logger.success('✅ Contact deleted');
      return contactId;
    },

    // ━━━ OPTIMISTIC UPDATE ━━━
    // Remove from UI immediately for snappy feel
    onMutate: async (contactId) => {
      // Cancel any in-flight queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.contacts.all });

      // Snapshot current contacts for rollback
      const previousContacts = queryClient.getQueryData<ContactWithMeta[]>(
        queryKeys.contacts.list()
      );

      // Optimistically remove from all contact list caches
      queryClient.setQueriesData(
        { queryKey: queryKeys.contacts.all },
        (old: ContactWithMeta[] | undefined) =>
          old?.filter((c) => c.id !== contactId)
      );

      // Return context for potential rollback
      return { previousContacts };
    },

    // ━━━ ERROR ROLLBACK ━━━
    onError: (err, contactId, context) => {
      // Restore previous contacts if delete failed
      if (context?.previousContacts) {
        queryClient.setQueryData(
          queryKeys.contacts.list(),
          context.previousContacts
        );
      }
      toast.error('Failed to delete contact');
    },

    onSuccess: () => {
      toast('Contact deleted');
    },

    // ━━━ CLEANUP ━━━
    // Always refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.birthdays.all });
    },
  });
}

// ============================================================================
// 📊 UTILITY HOOKS
// ============================================================================

/**
 * Get contact statistics (counts by type).
 *
 * COMPUTED FROM:
 * Uses the cached contacts from useContacts() - no additional fetch.
 *
 * RETURNS:
 * - total: Total contact count
 * - family: Contacts of type 'family'
 * - friends: Contacts of type 'friend'
 * - other: Contacts of type 'other'
 * - withBirthdays: Contacts that have birthday set
 *
 * @example
 * const stats = useContactStats()
 * // stats = { total: 42, family: 15, friends: 20, other: 7, withBirthdays: 35 }
 */
export function useContactStats() {
  const { data: contacts = [] } = useContacts();

  return {
    total: contacts.length,
    family: contacts.filter((c) => c.contact_type === 'family').length,
    friends: contacts.filter((c) => c.contact_type === 'friend').length,
    other: contacts.filter((c) => c.contact_type === 'other').length,
    withBirthdays: contacts.filter((c) => c.birthday !== null).length,
  };
}
