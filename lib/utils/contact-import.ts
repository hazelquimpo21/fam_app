/**
 * ============================================================================
 * 📥 Contact Import Utility
 * ============================================================================
 *
 * Handles importing contacts from CSV files with duplicate detection.
 * Transforms parsed CSV data into contact records ready for database insert.
 *
 * KEY FEATURES:
 * - Maps CSV columns to contact fields
 * - Detects potential duplicates by name and email
 * - Provides merge/skip options for duplicates
 * - Batch import with progress tracking
 *
 * DUPLICATE DETECTION STRATEGY:
 * 1. Exact email match = definite duplicate
 * 2. Similar name (case-insensitive, trimmed) = potential duplicate
 * 3. User decides: skip, replace, or keep both
 *
 * USAGE:
 * ```ts
 * const candidates = await prepareImportCandidates(rows, mapping, existingContacts);
 * const results = await importContacts(candidates.filter(c => c.selected));
 * ```
 *
 * RELATED FILES:
 * - lib/utils/csv-parser.ts - Parses CSV files
 * - lib/hooks/use-contacts.ts - Database operations
 * - components/modals/import-contacts-modal.tsx - UI
 *
 * ============================================================================
 */

import { logger } from '@/lib/utils/logger';
import {
  type CSVRow,
  type ColumnMapping,
  type ContactField,
  extractFieldValue,
} from './csv-parser';
import type { Contact, ContactType } from '@/types/database';

// ============================================================================
// 📦 TYPES
// ============================================================================

/**
 * Status of a contact for import purposes.
 *
 * - new: No duplicate found, safe to import
 * - duplicate_email: Email matches existing contact
 * - duplicate_name: Name matches existing contact (might be different person)
 */
export type ImportStatus = 'new' | 'duplicate_email' | 'duplicate_name';

/**
 * What to do when a duplicate is detected.
 *
 * - skip: Don't import this contact
 * - replace: Update the existing contact with new data
 * - keep_both: Import as new contact (will have same name)
 */
export type DuplicateAction = 'skip' | 'replace' | 'keep_both';

/**
 * A contact candidate prepared for import.
 * Contains the extracted data plus import metadata.
 */
export interface ImportCandidate {
  /** Unique ID for this candidate (for React keys) */
  id: string;
  /** Extracted contact data ready for import */
  data: ImportContactData;
  /** Original CSV row (for reference) */
  originalRow: CSVRow;
  /** Status indicating if this is new or duplicate */
  status: ImportStatus;
  /** The existing contact this duplicates (if any) */
  existingContact: Contact | null;
  /** Whether user has selected this for import */
  selected: boolean;
  /** What to do with duplicates (default: skip for email, keep_both for name) */
  duplicateAction: DuplicateAction;
}

/**
 * Contact data extracted from CSV, ready for database insert.
 */
export interface ImportContactData {
  name: string;
  contact_type: ContactType;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  relationship: string | null;
  notes: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
}

/**
 * Result of an import operation.
 */
export interface ImportResult {
  /** Total candidates that were processed */
  total: number;
  /** Successfully imported (new) */
  imported: number;
  /** Updated existing contacts (replace action) */
  updated: number;
  /** Skipped (user chose to skip or duplicate) */
  skipped: number;
  /** Failed due to error */
  failed: number;
  /** Error messages for failed imports */
  errors: string[];
}

/**
 * Summary of import candidates for UI display.
 */
export interface ImportSummary {
  total: number;
  new: number;
  duplicateEmail: number;
  duplicateName: number;
  selected: number;
  withBirthdays: number;
}

// ============================================================================
// 🔍 DUPLICATE DETECTION
// ============================================================================

/**
 * Normalize a string for comparison (lowercase, trimmed, extra spaces removed).
 */
function normalizeForComparison(str: string | null | undefined): string {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Check if two names are similar enough to be duplicates.
 * Uses simple exact match after normalization.
 */
function areNamesSimilar(name1: string, name2: string): boolean {
  return normalizeForComparison(name1) === normalizeForComparison(name2);
}

/**
 * Check if two emails are the same.
 */
function areEmailsSame(email1: string | null, email2: string | null): boolean {
  if (!email1 || !email2) return false;
  return normalizeForComparison(email1) === normalizeForComparison(email2);
}

/**
 * Find a duplicate contact in the existing contacts list.
 *
 * PRIORITY:
 * 1. Email match = definite duplicate (same person)
 * 2. Name match = potential duplicate (might be different person)
 *
 * @param data - The import candidate data
 * @param existingContacts - List of existing contacts to check against
 * @returns Tuple of [status, existingContact or null]
 */
function findDuplicate(
  data: ImportContactData,
  existingContacts: Contact[]
): [ImportStatus, Contact | null] {
  // First, check for email match (definite duplicate)
  if (data.email) {
    const emailMatch = existingContacts.find((c) =>
      areEmailsSame(c.email, data.email)
    );
    if (emailMatch) {
      logger.info('🔄 Found email duplicate', {
        importName: data.name,
        existingName: emailMatch.name,
        email: data.email,
      });
      return ['duplicate_email', emailMatch];
    }
  }

  // Then, check for name match (potential duplicate)
  const nameMatch = existingContacts.find((c) =>
    areNamesSimilar(c.name, data.name)
  );
  if (nameMatch) {
    logger.info('🔄 Found name duplicate', {
      importName: data.name,
      existingName: nameMatch.name,
    });
    return ['duplicate_name', nameMatch];
  }

  return ['new', null];
}

// ============================================================================
// 📋 IMPORT PREPARATION
// ============================================================================

/**
 * Generate a unique ID for an import candidate.
 */
let candidateIdCounter = 0;
function generateCandidateId(): string {
  return `import-${Date.now()}-${++candidateIdCounter}`;
}

/**
 * Extract contact data from a CSV row using the column mapping.
 *
 * @param row - The CSV row to extract from
 * @param mapping - The column mapping to use
 * @returns Extracted contact data
 */
function extractContactData(
  row: CSVRow,
  mapping: ColumnMapping
): ImportContactData {
  const getValue = (field: ContactField): string => {
    return extractFieldValue(row, field, mapping);
  };

  // Get name (required field)
  const name = getValue('name');

  // Convert empty strings to null for optional fields
  const toNull = (val: string): string | null => (val ? val : null);

  return {
    name: name || 'Unknown',
    contact_type: 'other', // Default to 'other', user can change later
    email: toNull(getValue('email')),
    phone: toNull(getValue('phone')),
    birthday: toNull(getValue('birthday')),
    relationship: toNull(getValue('relationship')),
    notes: toNull(getValue('notes')),
    address_line1: toNull(getValue('address_line1')),
    city: toNull(getValue('city')),
    state: toNull(getValue('state')),
    postal_code: toNull(getValue('postal_code')),
    country: toNull(getValue('country')),
  };
}

/**
 * Prepare import candidates from CSV rows.
 * Checks each row for duplicates against existing contacts.
 *
 * @param rows - Parsed CSV rows
 * @param mapping - Column mapping to use
 * @param existingContacts - Existing contacts to check for duplicates
 * @returns Array of import candidates with duplicate status
 */
export function prepareImportCandidates(
  rows: CSVRow[],
  mapping: ColumnMapping,
  existingContacts: Contact[]
): ImportCandidate[] {
  logger.info('📋 Preparing import candidates...', {
    rowCount: rows.length,
    existingCount: existingContacts.length,
  });

  const candidates: ImportCandidate[] = [];

  for (const row of rows) {
    // Extract contact data from row
    const data = extractContactData(row, mapping);

    // Skip rows with no name
    if (!data.name || data.name === 'Unknown') {
      continue;
    }

    // Check for duplicates
    const [status, existingContact] = findDuplicate(data, existingContacts);

    // Determine default selection and action
    let selected: boolean;
    let duplicateAction: DuplicateAction;

    switch (status) {
      case 'duplicate_email':
        // Email duplicates are not selected by default (clear duplicate)
        selected = false;
        duplicateAction = 'skip';
        break;
      case 'duplicate_name':
        // Name duplicates are selected by default (might be different person)
        selected = true;
        duplicateAction = 'keep_both';
        break;
      case 'new':
      default:
        selected = true;
        duplicateAction = 'skip'; // Not relevant for new contacts
        break;
    }

    candidates.push({
      id: generateCandidateId(),
      data,
      originalRow: row,
      status,
      existingContact,
      selected,
      duplicateAction,
    });
  }

  logger.success('✅ Import candidates prepared', {
    total: candidates.length,
    new: candidates.filter((c) => c.status === 'new').length,
    duplicateEmail: candidates.filter((c) => c.status === 'duplicate_email').length,
    duplicateName: candidates.filter((c) => c.status === 'duplicate_name').length,
  });

  return candidates;
}

/**
 * Calculate summary statistics for import candidates.
 */
export function getImportSummary(candidates: ImportCandidate[]): ImportSummary {
  return {
    total: candidates.length,
    new: candidates.filter((c) => c.status === 'new').length,
    duplicateEmail: candidates.filter((c) => c.status === 'duplicate_email').length,
    duplicateName: candidates.filter((c) => c.status === 'duplicate_name').length,
    selected: candidates.filter((c) => c.selected).length,
    withBirthdays: candidates.filter((c) => c.data.birthday).length,
  };
}

// ============================================================================
// ✅ VALIDATION
// ============================================================================

/**
 * Validate that the mapping has at least the required fields.
 * Name is required; everything else is optional.
 *
 * @param mapping - The column mapping to validate
 * @returns True if valid, false otherwise
 */
export function validateMapping(mapping: ColumnMapping): boolean {
  // At minimum, we need a name column
  if (!mapping.name) {
    logger.warn('⚠️ No name column mapped');
    return false;
  }
  return true;
}

/**
 * Check if a candidate has valid data for import.
 */
export function isValidCandidate(candidate: ImportCandidate): boolean {
  return !!candidate.data.name && candidate.data.name !== 'Unknown';
}

// ============================================================================
// 🎨 UI HELPERS
// ============================================================================

/**
 * Get a human-readable label for the import status.
 */
export function getStatusLabel(status: ImportStatus): string {
  switch (status) {
    case 'new':
      return 'New';
    case 'duplicate_email':
      return 'Email exists';
    case 'duplicate_name':
      return 'Name exists';
    default:
      return 'Unknown';
  }
}

/**
 * Get a badge color class for the import status.
 */
export function getStatusBadgeClass(status: ImportStatus): string {
  switch (status) {
    case 'new':
      return 'bg-green-100 text-green-700';
    case 'duplicate_email':
      return 'bg-red-100 text-red-700';
    case 'duplicate_name':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-neutral-100 text-neutral-700';
  }
}

/**
 * Get action options available for a duplicate.
 */
export function getDuplicateActionOptions(): { value: DuplicateAction; label: string }[] {
  return [
    { value: 'skip', label: 'Skip (don\'t import)' },
    { value: 'replace', label: 'Replace existing' },
    { value: 'keep_both', label: 'Keep both' },
  ];
}

// ============================================================================
// 📤 EXPORTS
// ============================================================================

export {
  normalizeForComparison,
  areNamesSimilar,
  areEmailsSame,
  extractContactData,
};
