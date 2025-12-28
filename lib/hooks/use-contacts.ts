'use client';

/**
 * ============================================================================
 * 👥 Contacts Hooks
 * ============================================================================
 *
 * React Query hooks for managing contacts (extended family, friends, etc.)
 *
 * Features:
 * - Full CRUD operations for contacts
 * - Filtering by contact type, import source
 * - Search functionality
 * - Upcoming birthday queries
 * - Optimistic updates for better UX
 *
 * User Stories Addressed:
 * - US-10.2: Manage Contacts - view, create, edit contacts
 *
 * Data Flow:
 * 1. Components call hooks (useContacts, useContact, etc.)
 * 2. Hooks use TanStack Query for caching and state
 * 3. Data is fetched from/written to Supabase
 * 4. Cache is invalidated on mutations
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
 * Input type for creating a new contact
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
 * Input type for updating an existing contact
 */
export interface UpdateContactInput extends Partial<CreateContactInput> {
  id: string;
}

/**
 * Extended contact with computed properties
 */
export interface ContactWithMeta extends Contact {
  /** Days until next birthday (null if no birthday set) */
  daysUntilBirthday?: number | null;
  /** Age in years (null if no birthday set) */
  age?: number | null;
}

// ============================================================================
// 🔧 HELPERS
// ============================================================================

/**
 * Calculate days until next birthday
 */
function getDaysUntilBirthday(birthdayStr: string | null): number | null {
  if (!birthdayStr) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const birthday = new Date(birthdayStr);
  const thisYearBirthday = new Date(
    today.getFullYear(),
    birthday.getMonth(),
    birthday.getDate()
  );

  // If birthday already passed this year, look at next year
  if (thisYearBirthday < today) {
    thisYearBirthday.setFullYear(today.getFullYear() + 1);
  }

  const diffTime = thisYearBirthday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Calculate age from birthday
 */
function getAge(birthdayStr: string | null): number | null {
  if (!birthdayStr) return null;

  const today = new Date();
  const birthday = new Date(birthdayStr);
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }

  return age;
}

/**
 * Enhance contact with computed metadata
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
 * Fetch all contacts with optional filters
 *
 * @param filters - Optional filters for contact type, import source, etc.
 * @returns Query result with contacts array
 *
 * @example
 * // Get all contacts
 * const { data: contacts } = useContacts()
 *
 * // Get only family contacts
 * const { data: familyContacts } = useContacts({ contactType: 'family' })
 *
 * // Get contacts with birthdays
 * const { data: withBirthdays } = useContacts({ hasBirthday: true })
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
        .is('deleted_at', null)
        .order('name', { ascending: true });

      // Apply filters
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
        // Search by name or email (case-insensitive)
        query = query.or(
          `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        logger.error('❌ Failed to fetch contacts', { error: error.message });
        throw error;
      }

      // Enhance contacts with computed properties
      const enhancedContacts = (data ?? []).map(enhanceContact);

      logger.success(`✅ Fetched ${enhancedContacts.length} contacts`);
      return enhancedContacts;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch a single contact by ID
 *
 * @param id - Contact UUID
 * @returns Query result with contact object
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
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Fetch contacts with upcoming birthdays
 *
 * @param days - Number of days to look ahead (default: 30)
 * @returns Query result with contacts that have birthdays in the next N days
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

      // Fetch all contacts with birthdays
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

      // Filter to those with birthdays in the next N days
      const enhancedContacts = (data ?? [])
        .map(enhanceContact)
        .filter((contact) => {
          const daysUntil = contact.daysUntilBirthday;
          return daysUntil !== null && daysUntil >= 0 && daysUntil <= days;
        })
        .sort((a, b) => (a.daysUntilBirthday ?? 999) - (b.daysUntilBirthday ?? 999));

      logger.success(`✅ Found ${enhancedContacts.length} upcoming birthdays`);
      return enhancedContacts;
    },
    staleTime: 1000 * 60 * 60, // 1 hour (birthdays don't change often)
  });
}

/**
 * Search contacts by name or email
 *
 * @param query - Search string
 * @returns Query result with matching contacts
 *
 * @example
 * const { data: results } = useSearchContacts(searchQuery)
 */
export function useSearchContacts(searchQuery: string) {
  return useContacts({ search: searchQuery });
}

// ============================================================================
// ✏️ MUTATION HOOKS (Write operations)
// ============================================================================

/**
 * Create a new contact
 *
 * @example
 * const createContact = useCreateContact()
 * createContact.mutate({
 *   name: 'Grandma',
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
          // Default imported_from to 'manual' for user-created contacts
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
 * Update an existing contact
 *
 * @example
 * const updateContact = useUpdateContact()
 * updateContact.mutate({
 *   id: contactId,
 *   phone: '555-1234',
 *   notes: 'Prefers text messages'
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
      // Update the specific contact in cache
      queryClient.setQueryData(
        queryKeys.contacts.detail(data.id),
        enhanceContact(data)
      );
      // Invalidate contact lists
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.list() });
      // Also invalidate birthday queries since birthday might have changed
      queryClient.invalidateQueries({ queryKey: queryKeys.birthdays.all });
      toast.success('Contact updated!');
    },

    onError: () => {
      toast.error('Failed to update contact');
    },
  });
}

/**
 * Delete a contact (soft delete)
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

      // Soft delete by setting deleted_at
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

    // Optimistic update - remove from lists immediately
    onMutate: async (contactId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.contacts.all });

      // Snapshot the previous value
      const previousContacts = queryClient.getQueryData<ContactWithMeta[]>(
        queryKeys.contacts.list()
      );

      // Optimistically remove from all contact lists
      queryClient.setQueriesData(
        { queryKey: queryKeys.contacts.all },
        (old: ContactWithMeta[] | undefined) =>
          old?.filter((c) => c.id !== contactId)
      );

      // Return context for rollback
      return { previousContacts };
    },

    onError: (err, contactId, context) => {
      // Rollback on error
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

    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.birthdays.all });
    },
  });
}

// ============================================================================
// 📊 UTILITY HOOKS
// ============================================================================

/**
 * Get contact statistics
 *
 * @returns Object with contact counts by type
 *
 * @example
 * const { total, family, friends, other } = useContactStats()
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
