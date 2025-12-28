/**
 * ============================================================================
 * 📄 CSV Parser Utility
 * ============================================================================
 *
 * Parses CSV files into structured data for contact imports.
 * Handles various CSV formats from different sources (iPhone, Google, Outlook).
 *
 * KEY FEATURES:
 * - Auto-detects column headers
 * - Handles quoted fields with commas
 * - Normalizes date formats for birthdays
 * - Maps common column names to our contact fields
 *
 * SUPPORTED SOURCES:
 * - Google Contacts export (CSV)
 * - iPhone/iCloud contacts export
 * - Outlook contacts export
 * - Generic CSV with standard headers
 *
 * USAGE:
 * ```ts
 * const file = event.target.files[0];
 * const { headers, rows, suggestedMapping } = await parseCSV(file);
 * ```
 *
 * RELATED FILES:
 * - lib/utils/contact-import.ts - Uses parsed data for import
 * - components/modals/import-contacts-modal.tsx - UI for import flow
 *
 * ============================================================================
 */

import { logger } from '@/lib/utils/logger';

// ============================================================================
// 📦 TYPES
// ============================================================================

/**
 * Represents a single row of parsed CSV data.
 * Keys are the original column headers (lowercased).
 */
export type CSVRow = Record<string, string>;

/**
 * Result of parsing a CSV file.
 */
export interface ParsedCSV {
  /** Original headers from the CSV file */
  headers: string[];
  /** Array of data rows (each row is a key-value object) */
  rows: CSVRow[];
  /** Suggested mapping of CSV columns to contact fields */
  suggestedMapping: ColumnMapping;
  /** Number of rows that were skipped (empty or invalid) */
  skippedRows: number;
}

/**
 * Maps CSV column names to our contact field names.
 * null means the column won't be imported.
 */
export interface ColumnMapping {
  name: string | null;
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
 * Contact field that can be mapped from CSV.
 */
export type ContactField = keyof ColumnMapping;

// ============================================================================
// 🔧 COLUMN DETECTION PATTERNS
// ============================================================================

/**
 * Patterns for auto-detecting column mappings.
 * Each contact field has an array of possible CSV column names (lowercased).
 *
 * WHY MULTIPLE PATTERNS:
 * Different export sources use different column names.
 * - Google: "Name", "E-mail 1 - Value"
 * - iPhone: "First", "Last", "Email"
 * - Outlook: "First Name", "E-mail Address"
 */
const COLUMN_PATTERNS: Record<ContactField, string[]> = {
  name: [
    'name',
    'full name',
    'fullname',
    'display name',
    'displayname',
    'contact name',
    // For first/last name columns, we'll handle combination separately
    'first name',
    'firstname',
    'first',
    'given name',
    'givenname',
  ],
  email: [
    'email',
    'e-mail',
    'email address',
    'e-mail address',
    'primary email',
    'email 1',
    'e-mail 1 - value',
    'email1',
    'mail',
  ],
  phone: [
    'phone',
    'telephone',
    'phone number',
    'mobile',
    'mobile phone',
    'cell',
    'cell phone',
    'phone 1 - value',
    'primary phone',
    'home phone',
  ],
  birthday: [
    'birthday',
    'birth date',
    'birthdate',
    'date of birth',
    'dob',
    'born',
  ],
  relationship: [
    'relationship',
    'relation',
    'notes',
    'description',
    'custom field 1',
  ],
  notes: [
    'notes',
    'note',
    'comments',
    'comment',
    'memo',
    'description',
  ],
  address_line1: [
    'address',
    'street',
    'street address',
    'address 1',
    'address line 1',
    'home address',
    'address 1 - street',
  ],
  city: [
    'city',
    'town',
    'address 1 - city',
    'home city',
  ],
  state: [
    'state',
    'province',
    'region',
    'address 1 - region',
    'home state',
  ],
  postal_code: [
    'postal code',
    'postalcode',
    'zip',
    'zip code',
    'zipcode',
    'postcode',
    'address 1 - postal code',
  ],
  country: [
    'country',
    'nation',
    'address 1 - country',
    'home country',
  ],
};

/**
 * Patterns for detecting first name and last name columns.
 * Used to combine into a full name if no "name" column exists.
 */
const FIRST_NAME_PATTERNS = ['first name', 'firstname', 'first', 'given name', 'givenname'];
const LAST_NAME_PATTERNS = ['last name', 'lastname', 'last', 'surname', 'family name', 'familyname'];

// ============================================================================
// 📄 CSV PARSING
// ============================================================================

/**
 * Parse a CSV file into structured data.
 *
 * ALGORITHM:
 * 1. Read file as text
 * 2. Split into lines, handling quoted newlines
 * 3. Parse first line as headers
 * 4. Parse remaining lines as data rows
 * 5. Auto-detect column mappings
 *
 * @param file - The CSV file to parse
 * @returns Parsed data with headers, rows, and suggested mapping
 */
export async function parseCSV(file: File): Promise<ParsedCSV> {
  logger.info('📄 Parsing CSV file...', { fileName: file.name, size: file.size });

  const text = await file.text();
  const lines = splitCSVLines(text);

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // First line is headers
  const headers = parseCSVLine(lines[0]);
  logger.info('📋 Found headers', { count: headers.length, headers });

  // Parse data rows
  const rows: CSVRow[] = [];
  let skippedRows = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      skippedRows++;
      continue;
    }

    const values = parseCSVLine(line);

    // Create row object with header keys
    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header.toLowerCase().trim()] = values[index]?.trim() || '';
    });

    // Skip rows with no meaningful data
    if (isEmptyRow(row)) {
      skippedRows++;
      continue;
    }

    rows.push(row);
  }

  logger.info('✅ CSV parsed', {
    totalRows: lines.length - 1,
    validRows: rows.length,
    skippedRows
  });

  // Auto-detect column mappings
  const suggestedMapping = detectColumnMapping(headers);

  return {
    headers,
    rows,
    suggestedMapping,
    skippedRows,
  };
}

/**
 * Split CSV text into lines, handling quoted fields that may contain newlines.
 *
 * EDGE CASES HANDLED:
 * - Fields with newlines inside quotes
 * - Empty lines
 * - Different line endings (\r\n, \n, \r)
 */
function splitCSVLines(text: string): string[] {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;

  // Normalize line endings
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (char === '"') {
      // Check for escaped quote
      if (insideQuotes && normalized[i + 1] === '"') {
        currentLine += '""';
        i++; // Skip next quote
      } else {
        insideQuotes = !insideQuotes;
        currentLine += char;
      }
    } else if (char === '\n' && !insideQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }

  // Don't forget the last line
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Parse a single CSV line into an array of values.
 * Handles quoted fields with commas inside.
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Check for escaped quote
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Don't forget the last value
  values.push(current.trim());

  return values;
}

/**
 * Check if a row is essentially empty (all values are blank).
 */
function isEmptyRow(row: CSVRow): boolean {
  return Object.values(row).every((value) => !value || !value.trim());
}

// ============================================================================
// 🔍 COLUMN MAPPING DETECTION
// ============================================================================

/**
 * Auto-detect which CSV columns map to which contact fields.
 *
 * ALGORITHM:
 * 1. Lowercase all headers for matching
 * 2. For each contact field, find matching column
 * 3. Handle special case: combine first+last name
 *
 * @param headers - Array of CSV column headers
 * @returns Suggested mapping from contact fields to CSV columns
 */
function detectColumnMapping(headers: string[]): ColumnMapping {
  const lowercaseHeaders = headers.map((h) => h.toLowerCase().trim());

  // Initialize all mappings as null
  const mapping: ColumnMapping = {
    name: null,
    email: null,
    phone: null,
    birthday: null,
    relationship: null,
    notes: null,
    address_line1: null,
    city: null,
    state: null,
    postal_code: null,
    country: null,
  };

  // Try to find a match for each field
  for (const field of Object.keys(COLUMN_PATTERNS) as ContactField[]) {
    const patterns = COLUMN_PATTERNS[field];

    for (const pattern of patterns) {
      const index = lowercaseHeaders.findIndex((h) => h === pattern || h.includes(pattern));
      if (index !== -1) {
        mapping[field] = headers[index];
        break;
      }
    }
  }

  // Special case: If no "name" column, try to combine first + last name
  if (!mapping.name) {
    const firstNameCol = findColumnByPatterns(headers, FIRST_NAME_PATTERNS);
    const lastNameCol = findColumnByPatterns(headers, LAST_NAME_PATTERNS);

    if (firstNameCol || lastNameCol) {
      // Mark as special "combined" mapping
      mapping.name = firstNameCol
        ? `${firstNameCol}+${lastNameCol || ''}`
        : lastNameCol;
    }
  }

  logger.info('🔍 Auto-detected column mapping', { mapping });
  return mapping;
}

/**
 * Find a column header that matches any of the given patterns.
 */
function findColumnByPatterns(headers: string[], patterns: string[]): string | null {
  const lowercaseHeaders = headers.map((h) => h.toLowerCase().trim());

  for (const pattern of patterns) {
    const index = lowercaseHeaders.findIndex((h) => h === pattern || h.includes(pattern));
    if (index !== -1) {
      return headers[index];
    }
  }

  return null;
}

// ============================================================================
// 🔄 DATA EXTRACTION
// ============================================================================

/**
 * Extract a contact field value from a CSV row using the column mapping.
 *
 * HANDLES SPECIAL CASES:
 * - Combined first+last name
 * - Date format normalization for birthdays
 *
 * @param row - The CSV row to extract from
 * @param field - The contact field to extract
 * @param mapping - The column mapping to use
 * @returns The extracted value, or empty string if not found
 */
export function extractFieldValue(
  row: CSVRow,
  field: ContactField,
  mapping: ColumnMapping
): string {
  const column = mapping[field];
  if (!column) return '';

  // Handle combined first+last name
  if (field === 'name' && column.includes('+')) {
    const [firstCol, lastCol] = column.split('+');
    const firstName = firstCol ? row[firstCol.toLowerCase()]?.trim() || '' : '';
    const lastName = lastCol ? row[lastCol.toLowerCase()]?.trim() || '' : '';
    return `${firstName} ${lastName}`.trim();
  }

  const value = row[column.toLowerCase()]?.trim() || '';

  // Normalize date format for birthday
  if (field === 'birthday' && value) {
    return normalizeDateFormat(value);
  }

  return value;
}

/**
 * Normalize various date formats to YYYY-MM-DD.
 *
 * SUPPORTED FORMATS:
 * - YYYY-MM-DD (already correct)
 * - MM/DD/YYYY (US format)
 * - DD/MM/YYYY (EU format - we guess based on values)
 * - Month DD, YYYY (e.g., "January 15, 1990")
 */
export function normalizeDateFormat(dateStr: string): string {
  if (!dateStr) return '';

  // Already in correct format?
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Try parsing with Date
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    // Check if year is reasonable (1900-2100)
    const year = parsed.getFullYear();
    if (year >= 1900 && year <= 2100) {
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  // Try MM/DD/YYYY format
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, first, second, year] = slashMatch;
    const firstNum = parseInt(first, 10);
    const secondNum = parseInt(second, 10);

    // Guess: If first > 12, it must be day (EU format)
    // Otherwise assume US format (MM/DD/YYYY)
    let month: string, day: string;
    if (firstNum > 12) {
      day = first.padStart(2, '0');
      month = second.padStart(2, '0');
    } else {
      month = first.padStart(2, '0');
      day = second.padStart(2, '0');
    }

    return `${year}-${month}-${day}`;
  }

  // Can't parse, return empty
  logger.warn('⚠️ Could not parse date', { dateStr });
  return '';
}

// ============================================================================
// 📤 EXPORTS
// ============================================================================

export { COLUMN_PATTERNS, FIRST_NAME_PATTERNS, LAST_NAME_PATTERNS };
