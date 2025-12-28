# Fam — Contacts Feature

> **Last Updated:** December 28, 2024
> **Status:** Phase 1 Complete (Manual Management), Phase 2 Planned (Google Import)

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
- [x] Upcoming birthdays section (next 14 days) with countdown
- [x] Contact cards show days until birthday, age calculation
- [x] Click to view/edit via ContactModal
- [x] Delete contacts with optimistic update
- [x] Import tracking fields ready for Google Contacts import (Phase 2)

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

### React Hooks

**File:** `lib/hooks/use-contacts.ts`

| Hook | Purpose | Example |
|------|---------|---------|
| `useContacts(filters?)` | List contacts with optional filters | `useContacts({ contactType: 'family' })` |
| `useContact(id)` | Get single contact with computed metadata | `useContact(contactId)` |
| `useUpcomingBirthdays(days)` | Contacts with birthdays in next N days | `useUpcomingBirthdays(14)` |
| `useSearchContacts(query)` | Search by name or email | `useSearchContacts('smith')` |
| `useCreateContact()` | Create new contact | `createContact.mutate({ name: 'Grandma', ... })` |
| `useUpdateContact()` | Update existing contact | `updateContact.mutate({ id, phone: '555-1234' })` |
| `useDeleteContact()` | Soft delete with optimistic update | `deleteContact.mutate(contactId)` |
| `useContactStats()` | Get counts by type | `const { total, family, friends } = useContactStats()` |

**Computed Properties:**

Contacts are enhanced with computed metadata:
- `daysUntilBirthday` - Days until next birthday (null if no birthday set)
- `age` - Current age in years (null if no birthday set)

---

## UI Components

### Contacts Page

**Route:** `/contacts`
**File:** `app/(app)/contacts/page.tsx`

**Features:**
- Header with contact count and stats
- Upcoming birthdays section (next 14 days)
- Search input (searches name and email)
- Filter pills (All, Family, Friends, Other)
- Contact cards in responsive grid
- Empty state with helpful guidance
- Add Contact button → opens ContactModal

### ContactModal

**File:** `components/modals/contact-modal.tsx`

**Features:**
- Create and edit modes
- Contact type selection (visual buttons)
- Relationship field with helper text
- Email and phone inputs
- Birthday and anniversary date pickers
- Notes textarea
- Collapsible address section
- Keyboard shortcut (Cmd+Enter to save)

### Contact Cards

Each card displays:
- Avatar with initial
- Name and contact type badge
- Relationship (if set)
- Birthday with countdown ("in 5 days", "Tomorrow", "Today!")
- Email and phone (if set)
- Notes preview (if set)
- Actions menu (Edit, Delete)

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
├── hooks/
│   └── use-contacts.ts         # CRUD hooks with birthday calculations
├── query-keys.ts               # ContactFilters type, contacts query keys

components/
├── modals/
│   └── contact-modal.tsx       # Create/edit modal

app/(app)/
├── contacts/
│   └── page.tsx               # Contacts list page

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

### Phase 2: Google Import (Planned)

- [ ] Add `contacts.readonly` scope to OAuth
- [ ] Create Google People API integration
- [ ] Build import preview/selection UI
- [ ] Implement de-duplication logic
- [ ] Add "Import from Google" button on Contacts page

### Phase 3: CSV Import (Planned)

- [ ] CSV file upload
- [ ] Column mapping UI
- [ ] Preview and confirm flow
- [ ] Support exports from Facebook, iPhone, Outlook, etc.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-28 | Claude | Initial documentation for Contacts feature Phase 1 |
