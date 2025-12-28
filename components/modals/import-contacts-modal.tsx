/**
 * ============================================================================
 * 📥 ImportContactsModal Component
 * ============================================================================
 *
 * Multi-step modal for importing contacts from CSV files.
 * Guides users through upload, mapping, preview, and import.
 *
 * IMPORT FLOW (4 steps):
 * 1. UPLOAD - Drag & drop or click to select CSV file
 * 2. MAPPING - Review/adjust column mappings
 * 3. PREVIEW - Select which contacts to import, handle duplicates
 * 4. RESULTS - Show import summary
 *
 * KEY FEATURES:
 * - Drag & drop file upload with visual feedback
 * - Smart column auto-detection
 * - Duplicate detection with visual indicators
 * - Batch select/deselect
 * - Progress indicator
 *
 * USER STORIES ADDRESSED:
 * - US-IMPORT-1: CSV Import
 * - US-IMPORT-2: Import Preview
 * - US-IMPORT-3: Duplicate Detection
 *
 * RELATED FILES:
 * - lib/utils/csv-parser.ts - Parses CSV files
 * - lib/utils/contact-import.ts - Duplicate detection
 * - lib/hooks/use-contacts.ts - Database operations
 *
 * ============================================================================
 */

'use client';

import * as React from 'react';
import {
  Upload,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  X,
  CheckCircle2,
  Circle,
  Loader2,
  Cake,
  Mail,
  User,
  AlertTriangle,
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
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';
import {
  parseCSV,
  type ParsedCSV,
  type ColumnMapping,
  type ContactField,
  COLUMN_PATTERNS,
} from '@/lib/utils/csv-parser';
import {
  prepareImportCandidates,
  getImportSummary,
  getStatusLabel,
  getStatusBadgeClass,
  type ImportCandidate,
  type ImportSummary,
} from '@/lib/utils/contact-import';
import { useContacts, useCreateContact } from '@/lib/hooks/use-contacts';
import { getAvatarColor } from '@/lib/constants/contact-styles';

// ============================================================================
// 📦 TYPES
// ============================================================================

/**
 * Props for the ImportContactsModal.
 */
interface ImportContactsModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when import completes successfully */
  onSuccess?: (imported: number) => void;
}

/**
 * Steps in the import flow.
 */
type ImportStep = 'upload' | 'mapping' | 'preview' | 'results';

/**
 * Result of the import operation.
 */
interface ImportResults {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}

// ============================================================================
// 🔧 CONSTANTS
// ============================================================================

/**
 * Step configuration for the progress indicator.
 */
const STEPS: { id: ImportStep; label: string }[] = [
  { id: 'upload', label: 'Upload' },
  { id: 'mapping', label: 'Map Columns' },
  { id: 'preview', label: 'Preview' },
  { id: 'results', label: 'Done' },
];

/**
 * Contact fields that can be mapped from CSV.
 * Displayed in the mapping step.
 */
const MAPPABLE_FIELDS: { field: ContactField; label: string; required?: boolean }[] = [
  { field: 'name', label: 'Name', required: true },
  { field: 'email', label: 'Email' },
  { field: 'phone', label: 'Phone' },
  { field: 'birthday', label: 'Birthday' },
  { field: 'relationship', label: 'Relationship' },
  { field: 'notes', label: 'Notes' },
  { field: 'address_line1', label: 'Street Address' },
  { field: 'city', label: 'City' },
  { field: 'state', label: 'State' },
  { field: 'postal_code', label: 'Postal Code' },
  { field: 'country', label: 'Country' },
];

// ============================================================================
// 🧩 SUB-COMPONENTS
// ============================================================================

/**
 * StepIndicator
 *
 * Shows progress through the import steps.
 * Current step is highlighted, completed steps show checkmark.
 */
interface StepIndicatorProps {
  currentStep: ImportStep;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = step.id === currentStep;

        return (
          <React.Fragment key={step.id}>
            {/* Step circle */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  isCompleted && 'bg-green-500 text-white',
                  isCurrent && 'bg-indigo-500 text-white',
                  !isCompleted && !isCurrent && 'bg-neutral-200 text-neutral-500'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'text-xs',
                  isCurrent ? 'text-indigo-600 font-medium' : 'text-neutral-500'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-8 -mt-5',
                  index < currentIndex ? 'bg-green-500' : 'bg-neutral-200'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * FileDropZone
 *
 * Drag & drop area for CSV file upload.
 * Shows visual feedback during drag.
 */
interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  error: string | null;
}

function FileDropZone({ onFileSelect, isProcessing, error }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith('.csv')) {
      onFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
          'hover:border-indigo-300 hover:bg-indigo-50/50',
          isDragging && 'border-indigo-500 bg-indigo-50',
          error && 'border-red-300 bg-red-50',
          !isDragging && !error && 'border-neutral-300'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
            <p className="text-neutral-600">Processing file...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              'h-16 w-16 rounded-full flex items-center justify-center',
              isDragging ? 'bg-indigo-100' : 'bg-neutral-100'
            )}>
              <Upload className={cn(
                'h-8 w-8',
                isDragging ? 'text-indigo-500' : 'text-neutral-400'
              )} />
            </div>
            <div>
              <p className="text-neutral-900 font-medium">
                Drop your CSV file here
              </p>
              <p className="text-sm text-neutral-500 mt-1">
                or click to browse
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Supported sources */}
      <div className="text-center text-xs text-neutral-500">
        <p>Supports exports from:</p>
        <p className="mt-1">
          <span className="inline-flex items-center gap-1">
            <FileSpreadsheet className="h-3 w-3" />
            Google Contacts
          </span>
          {' · '}
          iPhone/iCloud
          {' · '}
          Outlook
          {' · '}
          Any CSV
        </p>
      </div>
    </div>
  );
}

/**
 * ColumnMappingEditor
 *
 * Allows user to review and adjust column mappings.
 */
interface ColumnMappingEditorProps {
  headers: string[];
  mapping: ColumnMapping;
  onChange: (mapping: ColumnMapping) => void;
}

function ColumnMappingEditor({
  headers,
  mapping,
  onChange,
}: ColumnMappingEditorProps) {
  const updateMapping = (field: ContactField, value: string | null) => {
    onChange({ ...mapping, [field]: value });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600">
        We detected these column mappings. Adjust if needed:
      </p>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {MAPPABLE_FIELDS.map(({ field, label, required }) => (
          <div key={field} className="flex items-center gap-3">
            {/* Field label */}
            <div className="w-32 shrink-0">
              <span className="text-sm font-medium text-neutral-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </div>

            {/* Arrow */}
            <ChevronRight className="h-4 w-4 text-neutral-400 shrink-0" />

            {/* Column selector */}
            <select
              value={mapping[field] || ''}
              onChange={(e) => updateMapping(field, e.target.value || null)}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg border text-sm',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500',
                mapping[field] ? 'border-indigo-300 bg-indigo-50' : 'border-neutral-300'
              )}
            >
              <option value="">— Not mapped —</option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Validation message */}
      {!mapping.name && (
        <div className="flex items-center gap-2 text-amber-600 text-sm">
          <AlertTriangle className="h-4 w-4" />
          Name column is required for import
        </div>
      )}
    </div>
  );
}

/**
 * CandidateRow
 *
 * Single row in the preview table showing a contact to import.
 */
interface CandidateRowProps {
  candidate: ImportCandidate;
  onToggle: () => void;
}

function CandidateRow({ candidate, onToggle }: CandidateRowProps) {
  const { data, status, existingContact, selected } = candidate;
  const avatarColor = getAvatarColor(data.name);

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
        selected
          ? 'border-indigo-200 bg-indigo-50/50'
          : 'border-neutral-200 bg-white hover:bg-neutral-50'
      )}
      onClick={onToggle}
    >
      {/* Checkbox */}
      <div className="shrink-0">
        {selected ? (
          <CheckCircle2 className="h-5 w-5 text-indigo-500" />
        ) : (
          <Circle className="h-5 w-5 text-neutral-300" />
        )}
      </div>

      {/* Avatar */}
      <div
        className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
        style={{ backgroundColor: avatarColor }}
      >
        {data.name.charAt(0).toUpperCase()}
      </div>

      {/* Contact info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-900 truncate">
            {data.name}
          </span>

          {/* Status badge */}
          <span
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium shrink-0',
              getStatusBadgeClass(status)
            )}
          >
            {getStatusLabel(status)}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
          {data.email && (
            <span className="flex items-center gap-1 truncate">
              <Mail className="h-3 w-3" />
              {data.email}
            </span>
          )}
          {data.birthday && (
            <span className="flex items-center gap-1">
              <Cake className="h-3 w-3" />
              {data.birthday}
            </span>
          )}
        </div>

        {/* Show existing contact info for duplicates */}
        {existingContact && (
          <p className="text-xs text-neutral-400 mt-1">
            Matches: {existingContact.name}
            {existingContact.email && ` (${existingContact.email})`}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * PreviewList
 *
 * Shows all candidates with selection controls.
 */
interface PreviewListProps {
  candidates: ImportCandidate[];
  summary: ImportSummary;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

function PreviewList({
  candidates,
  summary,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: PreviewListProps) {
  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-600">
          <span className="font-medium text-neutral-900">{summary.selected}</span>
          {' of '}
          <span className="font-medium text-neutral-900">{summary.total}</span>
          {' contacts selected'}
          {summary.withBirthdays > 0 && (
            <span className="text-amber-600 ml-2">
              ({summary.withBirthdays} with birthdays)
            </span>
          )}
        </div>

        {/* Batch actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAll}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            Select all
          </button>
          <span className="text-neutral-300">|</span>
          <button
            onClick={onDeselectAll}
            className="text-xs text-neutral-500 hover:text-neutral-700"
          >
            Deselect all
          </button>
        </div>
      </div>

      {/* Duplicate warning */}
      {(summary.duplicateEmail > 0 || summary.duplicateName > 0) && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-amber-700">
            <p className="font-medium">Potential duplicates found</p>
            <p className="text-xs mt-0.5">
              {summary.duplicateEmail > 0 && (
                <span>{summary.duplicateEmail} email matches, </span>
              )}
              {summary.duplicateName > 0 && (
                <span>{summary.duplicateName} name matches</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Contact list */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
        {candidates.map((candidate) => (
          <CandidateRow
            key={candidate.id}
            candidate={candidate}
            onToggle={() => onToggle(candidate.id)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * ResultsSummary
 *
 * Shows the final import results.
 */
interface ResultsSummaryProps {
  results: ImportResults;
}

function ResultsSummary({ results }: ResultsSummaryProps) {
  return (
    <div className="text-center space-y-6">
      {/* Success icon */}
      <div className="flex justify-center">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
      </div>

      {/* Main message */}
      <div>
        <h3 className="text-xl font-semibold text-neutral-900">
          Import Complete!
        </h3>
        <p className="text-neutral-600 mt-1">
          {results.imported} contact{results.imported !== 1 ? 's' : ''} imported successfully
        </p>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{results.imported}</p>
          <p className="text-neutral-500">Imported</p>
        </div>
        {results.skipped > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-neutral-400">{results.skipped}</p>
            <p className="text-neutral-500">Skipped</p>
          </div>
        )}
        {results.failed > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{results.failed}</p>
            <p className="text-neutral-500">Failed</p>
          </div>
        )}
      </div>

      {/* Errors */}
      {results.errors.length > 0 && (
        <div className="text-left p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
          <p className="font-medium text-red-700 mb-2">Some imports failed:</p>
          <ul className="list-disc list-inside text-red-600 space-y-1">
            {results.errors.slice(0, 5).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 📄 MAIN COMPONENT
// ============================================================================

/**
 * ImportContactsModal
 *
 * Multi-step wizard for importing contacts from CSV files.
 * Handles file parsing, column mapping, duplicate detection, and batch import.
 */
export function ImportContactsModal({
  open,
  onOpenChange,
  onSuccess,
}: ImportContactsModalProps) {
  // ━━━━━ STATE ━━━━━
  const [step, setStep] = React.useState<ImportStep>('upload');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // File parsing state
  const [parsedCSV, setParsedCSV] = React.useState<ParsedCSV | null>(null);
  const [mapping, setMapping] = React.useState<ColumnMapping | null>(null);

  // Import candidates state
  const [candidates, setCandidates] = React.useState<ImportCandidate[]>([]);
  const [results, setResults] = React.useState<ImportResults | null>(null);

  // ━━━━━ DATA HOOKS ━━━━━
  const { data: existingContacts = [] } = useContacts();
  const createContact = useCreateContact();

  // ━━━━━ DERIVED STATE ━━━━━
  const summary = React.useMemo(
    () => getImportSummary(candidates),
    [candidates]
  );

  // ━━━━━ RESET ON CLOSE ━━━━━
  React.useEffect(() => {
    if (!open) {
      // Reset state when modal closes
      setTimeout(() => {
        setStep('upload');
        setError(null);
        setParsedCSV(null);
        setMapping(null);
        setCandidates([]);
        setResults(null);
      }, 200);
    }
  }, [open]);

  // ━━━━━ HANDLERS ━━━━━

  /**
   * Handle file selection.
   * Parses the CSV and moves to mapping step.
   */
  const handleFileSelect = async (file: File) => {
    logger.info('📁 File selected', { name: file.name, size: file.size });
    setError(null);
    setIsProcessing(true);

    try {
      const result = await parseCSV(file);

      if (result.rows.length === 0) {
        throw new Error('No valid contacts found in file');
      }

      setParsedCSV(result);
      setMapping(result.suggestedMapping);
      setStep('mapping');

      logger.success('✅ File parsed', {
        headers: result.headers.length,
        rows: result.rows.length,
      });
    } catch (err) {
      logger.error('❌ Failed to parse CSV', { error: err });
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Move from mapping to preview step.
   * Prepares import candidates with duplicate detection.
   */
  const handleMappingConfirm = () => {
    if (!parsedCSV || !mapping) return;

    if (!mapping.name) {
      setError('Please map the Name column');
      return;
    }

    logger.info('🔍 Preparing import candidates...');
    const preparedCandidates = prepareImportCandidates(
      parsedCSV.rows,
      mapping,
      existingContacts
    );

    setCandidates(preparedCandidates);
    setStep('preview');
  };

  /**
   * Toggle selection of a candidate.
   */
  const handleToggleCandidate = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  /**
   * Select all candidates.
   */
  const handleSelectAll = () => {
    setCandidates((prev) => prev.map((c) => ({ ...c, selected: true })));
  };

  /**
   * Deselect all candidates.
   */
  const handleDeselectAll = () => {
    setCandidates((prev) => prev.map((c) => ({ ...c, selected: false })));
  };

  /**
   * Execute the import.
   * Creates contacts for all selected candidates.
   */
  const handleImport = async () => {
    const selected = candidates.filter((c) => c.selected);
    if (selected.length === 0) return;

    logger.info('📥 Starting import...', { count: selected.length });
    setIsProcessing(true);

    const importResults: ImportResults = {
      imported: 0,
      skipped: candidates.filter((c) => !c.selected).length,
      failed: 0,
      errors: [],
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Import each selected contact
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // We iterate sequentially to avoid overwhelming the database with
    // too many concurrent requests. Each contact is created via the
    // useCreateContact hook which handles family_id injection and RLS.
    // 
    // IMPORTANT: We set imported_from: 'csv' to track that this contact
    // came from a CSV import rather than being manually created.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    for (const candidate of selected) {
      try {
        logger.debug('📤 Importing contact...', { 
          name: candidate.data.name,
          hasBirthday: !!candidate.data.birthday 
        });
        
        await createContact.mutateAsync({
          name: candidate.data.name,
          contact_type: candidate.data.contact_type,
          email: candidate.data.email || undefined,
          phone: candidate.data.phone || undefined,
          birthday: candidate.data.birthday || undefined,
          relationship: candidate.data.relationship || undefined,
          notes: candidate.data.notes || undefined,
          address_line1: candidate.data.address_line1 || undefined,
          city: candidate.data.city || undefined,
          state: candidate.data.state || undefined,
          postal_code: candidate.data.postal_code || undefined,
          country: candidate.data.country || undefined,
          // Mark as CSV import (not manual) for tracking purposes
          imported_from: 'csv',
        });
        importResults.imported++;
        
        logger.debug('✅ Contact imported', { name: candidate.data.name });
      } catch (err) {
        importResults.failed++;
        importResults.errors.push(
          `Failed to import "${candidate.data.name}": ${
            err instanceof Error ? err.message : 'Unknown error'
          }`
        );
        logger.error('❌ Failed to import contact', {
          name: candidate.data.name,
          error: err,
        });
      }
    }

    setResults(importResults);
    setStep('results');
    setIsProcessing(false);

    if (importResults.imported > 0) {
      onSuccess?.(importResults.imported);
    }

    logger.success('✅ Import complete', importResults);
  };

  /**
   * Go back to previous step.
   */
  const handleBack = () => {
    switch (step) {
      case 'mapping':
        setStep('upload');
        break;
      case 'preview':
        setStep('mapping');
        break;
      default:
        break;
    }
  };

  // ━━━━━ RENDER HELPERS ━━━━━

  /**
   * Render step content based on current step.
   */
  const renderStepContent = () => {
    switch (step) {
      case 'upload':
        return (
          <FileDropZone
            onFileSelect={handleFileSelect}
            isProcessing={isProcessing}
            error={error}
          />
        );

      case 'mapping':
        return parsedCSV && mapping ? (
          <ColumnMappingEditor
            headers={parsedCSV.headers}
            mapping={mapping}
            onChange={setMapping}
          />
        ) : null;

      case 'preview':
        return (
          <PreviewList
            candidates={candidates}
            summary={summary}
            onToggle={handleToggleCandidate}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
          />
        );

      case 'results':
        return results ? <ResultsSummary results={results} /> : null;
    }
  };

  /**
   * Render footer buttons based on current step.
   */
  const renderFooter = () => {
    switch (step) {
      case 'upload':
        return (
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        );

      case 'mapping':
        return (
          <>
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button
              onClick={handleMappingConfirm}
              disabled={!mapping?.name}
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </>
        );

      case 'preview':
        return (
          <>
            <Button variant="outline" onClick={handleBack} disabled={isProcessing}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button
              onClick={handleImport}
              disabled={summary.selected === 0 || isProcessing}
              loading={isProcessing}
            >
              Import {summary.selected} Contact{summary.selected !== 1 ? 's' : ''}
            </Button>
          </>
        );

      case 'results':
        return (
          <Button onClick={() => onOpenChange(false)}>
            Done
          </Button>
        );
    }
  };

  // ━━━━━ RENDER ━━━━━
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-indigo-500" />
            Import Contacts
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="flex-1 overflow-y-auto">
          {/* Step indicator */}
          {step !== 'results' && <StepIndicator currentStep={step} />}

          {/* Step content */}
          {renderStepContent()}
        </DialogBody>

        <DialogFooter>{renderFooter()}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// 📤 EXPORTS
// ============================================================================

export type { ImportContactsModalProps };
