# Fam — Contacts Feature

> **Last Updated:** December 28, 2025
> **Status:** Phase 1.2 Complete (Improved Interactions), Phase 2 Planned (Google Import)

---

## Overview

The Contacts feature allows families to manage extended family, friends, and other important people outside the immediate household. Key use cases include:

- Remembering birthdays for extended family and friends
- Tracking relationships (e.g., "Dad's brother", "Emma's friend's mom")
- Storing contact information for people you interact with regularly
- Future: Importing contacts from Google to quickly populate birthday data

---

## User Stories Addressed

### US-10.2: Manage Contacts ✅ COMPLETE

> **As a** user, **I want** to save contacts, **so that** I remember birthdays and details.

**Acceptance Criteria:**
- [x] Can add contact with: name, type (family/friend/other), birthday, relationship, notes
- [x] Can add email, phone, anniversary, full address
- [x] List view with search by name or email
- [x] Filter by contact type (All, Family, Friends, Other)
- [x] Upcoming birthdays section (next 30 days) with countdown
- [x] Contact cards show days until birthday, age calculation
- [x] Click to view/edit via ContactModal
- [x] Delete contacts with optimistic update
- [x] Import tracking fields ready for Google Contacts import (Phase 2)

### US-CONTACTS-1: Click Card to Edit ✅ NEW

> **As a** user, **I want** to click on a contact card to view/edit it directly, **so that** I don't have to navigate through menus.

**Implementation:**
- Contact cards are clickable (cursor pointer, hover effects)
- Clicking anywhere on the card opens the edit modal
- Email/phone links and dropdown menu have click handlers that prevent card click

### US-CONTACTS-2: Unique Avatar Colors ✅ NEW

> **As a** user, **I want** each contact to have a unique avatar color based on their name, **so that** I can visually distinguish between contacts.

**Implementation:**
- 10-color palette with WCAG-compliant contrast
- Deterministic hash function: same name → same color every time
- Color generated from `getAvatarColor(name)` helper

### US-CONTACTS-3: Quick Contact Actions ✅ NEW

> **As a** user, **I want** to tap on email/phone to initiate contact (opens mail client/phone app), **so that** I can reach out quickly.

**Implementation:**
- Email addresses are `mailto:` links
- Phone numbers are `tel:` links (strips non-numeric for link, displays formatted)
- Hover effects indicate clickability
- Click stops propagation to prevent card edit opening

### US-CONTACTS-4: Expandable Upcoming Birthdays ✅

> **As a** user, **I want** to see all upcoming birthdays with a "show more" option, **so that** I don't miss any.

**Implementation:**
- Initially shows 4 birthdays (clean 2x2 or 1x4 grid)
- "Show X more" button appears if more than 4 birthdays
- Expands to show all with "Show less" toggle
- Birthday count badge in section header

### US-CONTACTS-5: Sort Contacts ✅ NEW

> **As a** user, **I want** to sort my contacts by different criteria (name, birthday, recently added), **so that** I can find who I need faster.

**Implementation:**
- Sort dropdown next to filter pills
- Sort options: Name A→Z, Name Z→A, Upcoming Birthday, Recently Added
- Birthday sort puts contacts without birthdays at the end
- Sort is applied client-side on the filtered results

### US-CONTACTS-6: Delete Confirmation ✅ NEW

> **As a** user, **I want** to confirm before deleting a contact, **so that** I don't accidentally lose important data.

**Implementation:**
- ConfirmDialog component (reusable across app)
- Shows contact name in confirmation title
- Destructive variant with red styling
- Loading state during delete operation
- Cancel via button, backdrop click, or ESC key

### US-CONTACTS-7: Enhanced Search ✅ NEW

> **As a** user, **I want** to search contacts by relationship description or phone number, **so that** I can find contacts using different criteria.

**Implementation:**
- Search now includes: name, email, relationship, phone
- Updated placeholder text to indicate searchable fields
- Case-insensitive matching on all fields

### US-CONTACTS-8: Quick Action Buttons ✅ NEW

> **As a** user, **I want** to see email/call buttons without hovering, **so that** I can contact people faster.

**Implementation:**
- Always-visible email and phone action buttons on cards
- Circular button design with hover states
- Separate from card click (opens mailto:/tel: directly)
- Menu button visible on mobile, hover-only on desktop
### US-IMPORT-1: CSV Import ✅ NEW (Phase 1.2)

> **As a** user, **I want** to import contacts from a CSV file, **so that** I can quickly add birthdays from exports (iPhone, Google, Outlook).

**Implementation:**
- Import button on Contacts page header
- 4-step wizard modal: Upload → Map Columns → Preview → Results
- Drag & drop file upload with visual feedback
- Auto-detects column mappings from common export formats
- Preview shows all contacts with selection checkboxes

### US-IMPORT-2: Import Preview ✅ NEW (Phase 1.2)

> **As a** user, **I want** to preview contacts before importing, **so that** I can select only the ones I want.

**Implementation:**
- Preview table shows name, email, birthday for each contact
- Checkbox to select/deselect individual contacts
- "Select all" / "Deselect all" batch controls
- Summary stats: total, selected, with birthdays

### US-IMPORT-3: Duplicate Detection ✅ NEW (Phase 1.2)

> **As a** user, **I want** to be warned about duplicate contacts, **so that** I don't create duplicates.

**Implementation:**
- Checks existing contacts by email (definite match) and name (potential match)
- Visual indicators: green "New", red "Email exists", amber "Name exists"
- Email duplicates are deselected by default
- Name duplicates are selected (might be different people)
- Warning banner summarizes duplicate counts

### US-DELETE-1: Delete Confirmation ✅ NEW (Phase 1.2)

> **As a** user, **I want** a confirmation before deleting a contact, **so that** I don't accidentally lose data.

**Implementation:**
- ConfirmDialog component with destructive styling
- Shows contact name in confirmation message
- Cancel and Delete buttons with loading state
- Reusable hook: `useConfirmDialog<Contact>()`

---

## Architecture

### Database Schema

The `contacts` table stores all contact data:

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES families(id),

  -- Basic info
  name TEXT NOT NULL,
  contact_type contact_type_enum DEFAULT 'other',  -- 'family', 'friend', 'other'

  -- Contact details
  email TEXT,
  phone TEXT,
  birthday DATE,
  anniversary DATE,

  -- Relationship context
  notes TEXT,
  relationship TEXT,  -- "Mike's college roommate", "Zelda's friend's mom"

  -- Address (optional)
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,

  -- Import tracking (for Google import)
  google_contact_id TEXT,           -- Unique ID from Google People API
  google_photo_url TEXT,            -- Profile photo URL from Google
  imported_from TEXT DEFAULT 'manual',  -- 'manual', 'google', 'csv'
  imported_at TIMESTAMPTZ,          -- When contact was imported

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES family_members(id),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_contacts_family ON contacts(family_id);
CREATE INDEX idx_contacts_birthday ON contacts(family_id, birthday) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_contacts_google_id_per_family
  ON contacts(family_id, google_contact_id)
  WHERE google_contact_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_contacts_imported_from
  ON contacts(family_id, imported_from)
  WHERE deleted_at IS NULL;
```

**Migration:** `supabase/migrations/005_contacts_import.sql`

---

### TypeScript Types

```typescript
// types/database.ts

export type ContactType = 'family' | 'friend' | 'other';
export type ContactImportSource = 'manual' | 'google' | 'csv';

export interface Contact {
  id: string;
  family_id: string;
  name: string;
  contact_type: ContactType;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  anniversary: string | null;
  notes: string | null;
  relationship: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  google_contact_id: string | null;
  google_photo_url: string | null;
  imported_from: ContactImportSource;
  imported_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  deleted_at: string | null;
}
```

---

### Query Keys

```typescript
// lib/query-keys.ts

export interface ContactFilters {
  contactType?: 'family' | 'friend' | 'other';
  importedFrom?: 'google' | 'manual' | 'csv';
  hasBirthday?: boolean;
  search?: string;
}

contacts: {
  all: ['contacts'] as const,
  list: (filters?: ContactFilters) => [...queryKeys.contacts.all, 'list', filters] as const,
  detail: (id: string) => [...queryKeys.contacts.all, 'detail', id] as const,
  upcomingBirthdays: (days: number) => [...queryKeys.contacts.all, 'upcoming-birthdays', days] as const,
  search: (query: string) => [...queryKeys.contacts.all, 'search', query] as const,
}
```

---

### Shared Constants

**File:** `lib/constants/contact-styles.ts`

Centralized styling constants used by both the Contacts page and ContactModal:

| Export | Purpose |
|--------|---------|
| `AVATAR_COLORS` | 10-color palette for contact avatars |
| `getAvatarColor(name)` | Generate deterministic color from name hash |
| `CONTACT_TYPE_CONFIG` | Icons, labels, colors for family/friend/other |
| `getContactTypeConfig(type)` | Safe accessor with fallback to 'other' |
| `formatBirthdayCountdown(days)` | "Today!", "Tomorrow", "in X days" |
| `isBirthdaySoon(days)` | Check if birthday is within 7 days |
| `getEmailLink(email)` | Generate `mailto:` URL |
| `getPhoneLink(phone)` | Generate `tel:` URL (strips formatting) |

---

### React Hooks

**File:** `lib/hooks/use-contacts.ts`

| Hook | Purpose | Example |
|------|---------|---------|
| `useContacts(filters?)` | List contacts with optional filters | `useContacts({ contactType: 'family' })` |
| `useContact(id)` | Get single contact with computed metadata | `useContact(contactId)` |
| `useUpcomingBirthdays(days)` | Contacts with birthdays in next N days | `useUpcomingBirthdays(30)` |
| `useSearchContacts(query)` | Search by name or email | `useSearchContacts('smith')` |
| `useCreateContact()` | Create new contact | `createContact.mutate({ name: 'Grandma', ... })` |
| `useUpdateContact()` | Update existing contact | `updateContact.mutate({ id, phone: '555-1234' })` |
| `useDeleteContact()` | Soft delete with optimistic update | `deleteContact.mutate(contactId)` |
| `useContactStats()` | Get counts by type | `const { total, family, friends } = useContactStats()` |

**Computed Properties (ContactWithMeta):**

Contacts are enhanced with computed metadata:
- `daysUntilBirthday` - Days until next birthday (null if no birthday set)
- `age` - Current age in years (null if no birthday set)

---

## UI Components

### Contacts Page

**Route:** `/contacts`
**File:** `app/(app)/contacts/page.tsx`

**Features:**
- Header with contact count and "X with birthdays" stat
- Upcoming birthdays section (next 30 days, expandable)
- Search input (searches name, email, relationship, phone)
- Filter pills (All, Family, Friends, Other) with counts
- **Sort dropdown** (Name A→Z/Z→A, Birthday, Recently Added)
- **Clickable contact cards** in responsive 2-column grid
- **Delete confirmation dialog** before removing contacts
- Empty state with helpful guidance
- Add Contact button → opens ContactModal
- Loading skeleton during data fetch

**Sub-components (inline):**
- `UpcomingBirthdayCard` - Compact birthday card with countdown
- `UpcomingBirthdaysSection` - Expandable section with "show more"
- `FilterPills` - Type filter buttons with counts
- `SortDropdown` - Sort option selector
- `ContactsSkeleton` - Loading placeholder

**Imported components:**
- `ContactCard` - From `components/contacts/` (extracted for modularity)

### ContactModal

**File:** `components/modals/contact-modal.tsx`

**Features:**
- Create and edit modes (determined by `contact` prop)
- Visual contact type selector using shared constants
- Relationship field with helper text
- Email and phone inputs
- Birthday and anniversary date pickers
- Notes textarea
- Collapsible address section (auto-expands if has data)
- Keyboard shortcut (Cmd+Enter to save)
- Form validation (name required)

**Sub-components (inline):**
- `ContactTypeSelector` - Visual button group with accessibility
- `AddressSection` - Collapsible address fields

### Contact Cards

Each card displays:
- **Unique colored avatar** with initial (based on name hash)
- Name and contact type badge (color-coded)
- Relationship description (if set)
- Birthday with countdown ("in 5 days", "Tomorrow", "Today!")
- **Clickable email link** (mailto:)
- **Clickable phone link** (tel:)
- Notes preview (2 lines max, if set)
- Actions dropdown menu (Edit, Delete) - visible on hover

**Interaction:**
- Click card → opens edit modal
- Click email → opens mail client
- Click phone → opens phone app
- Click menu → shows Edit/Delete options

---

## Integration with Birthday System

The contacts feature integrates with the existing birthday system:

1. **Birthday Query:** The `get_birthdays_in_range()` SQL function already queries both `family_members.birthday` AND `contacts.birthday`.

2. **Today Page:** Birthday banners can show contact birthdays.

3. **ICS Feeds:** Calendar feeds include contact birthdays when enabled.

4. **Kanban Board:** Birthday cards can be displayed alongside tasks and events.

---

## Future: Google Contacts Import (Phase 2)

### Why Google Import?

Users have existing contacts in Google with birthdays already entered. Instead of manual re-entry, we can import:
- Names and photos
- Email addresses and phone numbers
- Birthdays (the primary value)

### Technical Approach

1. **OAuth Scope:** Add `https://www.googleapis.com/auth/contacts.readonly` to existing Google OAuth flow.

2. **Google People API:** Fetch contacts using `people.connections.list`.

3. **De-duplication:** Use `google_contact_id` to prevent duplicate imports on re-import.

4. **User Selection:** Show preview of importable contacts (those with birthdays), let user select which to import.

5. **One-time Copy:** Import as one-time snapshot (not ongoing sync) for simplicity.

### Why NOT Facebook?

Facebook deprecated the Friends API in 2014-2015 following privacy concerns. Apps can no longer access:
- Friends list
- Friends' birthdays
- Friends' contact information

The only alternative is manual GDPR data export from Facebook, which is cumbersome and not recommended as a primary flow.

---

## File Reference

```
lib/
├── constants/
│   └── contact-styles.ts       # Shared styling constants (avatar colors, type config)
├── hooks/
│   └── use-contacts.ts         # CRUD hooks with birthday calculations, enhanced search
├── query-keys.ts               # ContactFilters type, contacts query keys

components/
├── contacts/
│   ├── index.ts               # NEW: Barrel export for contacts components
│   └── contact-card.tsx       # NEW: Extracted ContactCard with quick actions
├── shared/
│   └── confirm-dialog.tsx     # NEW: Reusable confirmation dialog
├── modals/
│   ├── contact-modal.tsx       # Create/edit modal with ContactTypeSelector, AddressSection
│   └── import-contacts-modal.tsx # NEW: 4-step CSV import wizard
├── ui/
│   └── confirm-dialog.tsx      # NEW: Reusable confirmation dialog component

app/(app)/
├── contacts/
│   └── page.tsx               # Contacts list with sorting, filtering, delete confirmation

types/
└── database.ts                # Contact, ContactType, ContactImportSource

supabase/migrations/
└── 005_contacts_import.sql    # Import tracking columns
```

---

## Roadmap

### Phase 1: Manual Contacts ✅ Complete

- [x] Contacts page with list, search, filters
- [x] ContactModal for create/edit
- [x] useContacts hooks with full CRUD
- [x] Birthday countdown display
- [x] Upcoming birthdays section
- [x] Import tracking columns (prepared for Phase 2)

### Phase 1.1: Enhanced UI/UX ✅ Complete

- [x] Clickable contact cards (direct edit)
- [x] Unique avatar colors based on name
- [x] Clickable email/phone (mailto:/tel: links)
- [x] Expandable upcoming birthdays ("show more")
- [x] Shared constants file (contact-styles.ts)
- [x] Comprehensive AI-dev comments throughout

### Phase 1.2: Improved Interactions ✅ Complete (NEW)

- [x] Delete confirmation dialog (ConfirmDialog component)
- [x] Sorting options (Name A→Z/Z→A, Upcoming Birthday, Recently Added)
- [x] Enhanced search (name, email, relationship, phone)
- [x] Quick action buttons for email/phone (always visible)
- [x] ContactCard extracted to dedicated component file
- [x] Reusable ConfirmDialog component for app-wide use
### Phase 1.2: CSV Import & UX Improvements ✅ Complete (NEW)

- [x] CSV Import modal with 4-step wizard flow
- [x] Drag & drop file upload with visual feedback
- [x] Auto-detect column mappings (Google, iPhone, Outlook, generic)
- [x] Date format normalization (MM/DD/YYYY, YYYY-MM-DD, etc.)
- [x] Duplicate detection (by email and name)
- [x] Preview with select/deselect individual contacts
- [x] Import summary with success/skip/fail counts
- [x] Delete confirmation dialog (prevents accidental deletions)
- [x] Reusable ConfirmDialog + useConfirmDialog hook
- [x] Well-commented code for AI developers

### Phase 2: Google Import (Planned)

- [ ] Add `contacts.readonly` scope to OAuth
- [ ] Create Google People API integration
- [ ] Reuse preview/selection UI from CSV import
- [ ] Implement de-duplication using google_contact_id
- [ ] Add "Import from Google" option in Import modal

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-28 | Claude | Initial documentation for Contacts feature Phase 1 |
| 1.1 | 2024-12-28 | Claude | Phase 1.1: Enhanced UI/UX - clickable cards, unique avatars, mailto/tel links, expandable birthdays, shared constants |
| 1.2 | 2025-12-28 | Claude | Phase 1.2: Improved Interactions - delete confirmation, sorting, enhanced search, quick action buttons, component extraction |
