# Fam — Kanban Board Improvements

## Overview

This document describes the enhanced Kanban board system with improved drag-drop UX, touch support, and tag-based grouping.

---

## Features Implemented

### 1. Enhanced Drag-Drop UX with @dnd-kit

**Library:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

**Why @dnd-kit?**
- Modern, lightweight drag-drop library
- Native touch support (no polyfills needed)
- Accessible (keyboard navigation)
- Performant with virtualization support
- TypeScript-first

**Key Components:**
- `DndContext` - Wraps the board, provides drag state
- `DragOverlay` - Renders visual "ghost" during drag
- `useDroppable` - Makes columns drop targets
- `useSortable` - Makes cards draggable and sortable

### 2. Visual Feedback During Drag

**What Users See:**
- **Drag Handle** - Visible grip icon on each card
- **Drag Overlay** - "Moving" badge on dragged card with rotation effect
- **Column Highlighting** - Blue ring around target column
- **Drop Zone** - "Drop here" indicator at bottom of columns

**Animation:**
```tsx
<DragOverlay dropAnimation={{
  duration: 200,
  easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
}}>
  {activeItem && <KanbanDragOverlay item={activeItem} />}
</DragOverlay>
```

### 3. Touch Support (Mobile/Tablet)

**Sensors Configured:**
```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  }),
  useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,    // Long-press to initiate drag
      tolerance: 5,  // Allow slight movement during delay
    },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);
```

**Touch Behavior:**
- Long-press (250ms) to start drag
- Slight movement allowed during long-press
- Natural scroll behavior preserved
- Visual feedback shows "Touch mode" indicator

### 4. Tag-Based Grouping

**New GroupBy Mode:** `'tag'`

**How It Works:**
1. Extracts all unique tags from tasks
2. Creates dynamic columns for each tag
3. Items with multiple tags appear in ALL matching columns
4. Untagged items go to "Untagged" column

**Example:**
```
Task: "Fix bug" with tags: [@work, @urgent]
→ Appears in BOTH @work and @urgent columns

Task: "Buy groceries" with no tags
→ Appears in "Untagged" column
```

---

## Architecture

### File Structure

```
components/kanban/
├── index.ts                    # Public exports
├── kanban-board.tsx            # Main board with DndContext
├── kanban-column.tsx           # Column with useDroppable
├── kanban-card-content.tsx     # SHARED rendering logic (single source of truth)
├── kanban-card.tsx             # Static wrapper (uses KanbanCardContent)
├── kanban-sortable-card.tsx    # Draggable wrapper (uses KanbanCardContent)
├── kanban-drag-overlay.tsx     # Visual ghost (uses KanbanCardContent)
└── kanban-drop-indicator.tsx   # Position indicators

lib/hooks/
├── use-kanban.ts               # Data fetching & mutations
└── use-kanban-dnd.ts           # Drag-drop state & handlers

lib/constants/
└── kanban-styles.ts            # Shared style constants (TYPE_STYLES, PRIORITY_COLORS, etc.)

types/
└── kanban.ts                   # Types & column definitions
```

**DRY Architecture (Phase 3.4):**
The card rendering logic is centralized in `kanban-card-content.tsx`. All three card variants
(static, sortable, overlay) use this shared component, eliminating code duplication.

```
KanbanCard         → KanbanCardContent (static)
KanbanSortableCard → KanbanCardContent (with drag handlers)
KanbanDragOverlay  → KanbanCardContent (isOverlay=true)
```

### Data Flow

```
KanbanBoard
  └── DndContext (sensors, collision detection)
      └── useKanban (data fetching)
          └── useKanbanDnd (drag state)
              └── KanbanColumn (useDroppable)
                  └── SortableContext (item ordering)
                      └── KanbanSortableCard (useSortable)
                          └── handleDragEnd → moveItem mutation
```

---

## Column Definitions

### Time-Based (`groupBy: 'time'`)
| Column | Description |
|--------|-------------|
| Overdue | Past due date, not completed |
| Today | Due today |
| Tomorrow | Due tomorrow |
| This Week | Due this week (after tomorrow) |
| Later | Due after this week |
| Done | Completed items |

### Status-Based (`groupBy: 'status'`)
| Column | Description |
|--------|-------------|
| Inbox | Newly captured, not processed |
| Active | Currently working on |
| Waiting For | Blocked on someone/something |
| Someday | Maybe later |
| Done | Completed |

### Priority-Based (`groupBy: 'priority'`)
| Column | Description |
|--------|-------------|
| High | Priority level 3 |
| Medium | Priority level 2 |
| Low | Priority level 1 |
| None | Priority level 0 or null |

### Tag-Based (`groupBy: 'tag'`)
| Column | Description |
|--------|-------------|
| [Tag Name] | Dynamic column per unique tag |
| Untagged | Items without any tags |

---

## Usage Examples

### Basic Board
```tsx
import { KanbanBoard } from '@/components/kanban';

function TasksPage() {
  return (
    <KanbanBoard
      defaultGroupBy="time"
      defaultTimeScope="week"
      onCardClick={(item) => openEditModal(item)}
      onAddClick={(columnId) => openAddModal(columnId)}
    />
  );
}
```

### With Custom Filters
```tsx
<KanbanBoard
  defaultGroupBy="tag"
  defaultTimeScope="month"
  defaultFilters={{
    includeTypes: ['task'], // Only show tasks
    showCompleted: false,
    assignedTo: currentUser.id,
  }}
/>
```

---

## Future AI Developers

### Adding New Item Types

1. Create transformer in `use-kanban.ts`:
```typescript
export function transformNewItem(item: NewItemType): KanbanItem {
  return {
    id: `newtype-${item.id}`,
    type: 'newtype' as KanbanItemType,
    // ... map all KanbanItem fields
  };
}
```

2. Add to KanbanItemType in `types/kanban.ts`:
```typescript
export type KanbanItemType = 'task' | 'event' | 'external' | 'birthday' | 'newtype';
```

3. Fetch and transform in `useKanban`:
```typescript
// In the useMemo that creates columns
if (newItemsQuery.data) {
  for (const item of newItemsQuery.data) {
    items.push(transformNewItem(item));
  }
}
```

### Adding New GroupBy Modes

1. Add to KanbanGroupBy type:
```typescript
export type KanbanGroupBy = 'time' | 'status' | 'priority' | 'tag' | 'newmode';
```

2. Create column definitions (if static):
```typescript
export const NEWMODE_COLUMNS: Omit<KanbanColumn, 'items'>[] = [
  { id: 'col1', title: 'Column 1', ... },
];
```

3. Update `getColumnIdForItem` and `groupItemsIntoColumns` in `use-kanban.ts`

4. Add to GROUP_BY_OPTIONS in `kanban-board.tsx`

### Customizing Drag Behavior

The drag-drop system is configured in `use-kanban-dnd.ts`:

- `TOUCH_ACTIVATION_DELAY` - How long to hold before drag starts
- `ACTIVATION_DISTANCE` - Minimum movement to start drag
- Collision detection strategy in `kanban-board.tsx`

---

## Database Requirements

**No SQL changes required** - The existing `tasks.tags TEXT[]` column supports tag-based grouping.

---

## AuthProvider Refactor (December 2024)

### Problem

Previously, `useAuth` was a standalone hook that managed its own state. This caused issues:
- Multiple components calling `useAuth()` created independent state instances
- Each instance fetched family member data separately from Supabase
- Auth state wasn't shared across the component tree
- `use-kanban.ts` had a workaround `familyContextQuery` to cache the family_id

### Solution

Converted `useAuth` to an `AuthProvider` context pattern:

1. **`lib/contexts/auth-context.tsx`** - New centralized AuthProvider
   - Manages auth state in one place
   - Fetches family member data once on login
   - Provides `familyId` for quick access (common need across hooks)
   - Provides `refetchFamilyMember()` for manual refresh

2. **`lib/hooks/use-auth.ts`** - Now re-exports from context
   - Backwards compatible - all existing imports still work
   - New features: `familyId`, `refetchFamilyMember`

3. **`components/providers.tsx`** - Wraps app with AuthProvider
   - Inside QueryClientProvider, outside app content

4. **`lib/hooks/use-kanban.ts`** - Uses shared auth context
   - Removed redundant `familyContextQuery`
   - Now uses `familyId` from `useAuth()` directly
   - Birthday query enabled when `authState === 'authenticated'`

### Benefits

- **No redundant queries** - Family member fetched once, shared everywhere
- **Consistent auth state** - All components see the same auth state
- **Better performance** - Fewer database roundtrips
- **Cleaner code** - Hooks can just use `familyId` directly

### Future Optimization Opportunities

The following hooks still query `family_members` individually and could be updated to use `useAuth()`:

- `use-tasks.ts` - Mutations need `family_id`
- `use-habits.ts` - Mutations need `family_id`
- `use-family-events.ts` - Mutations need `family_id`
- `use-calendar-items.ts` - Queries need `family_id`
- `use-profiles.ts` - Multiple queries need `family_id`

These would benefit from the centralized AuthProvider pattern.

---

## Testing Checklist

- [ ] Drag card between columns (mouse)
- [ ] Drag card between columns (touch/mobile)
- [ ] Visual overlay appears during drag
- [ ] Column highlights on hover
- [ ] Drop indicator shows position
- [ ] Card snaps into place on drop
- [ ] Keyboard navigation works (Tab + Space)
- [ ] Tag grouping shows dynamic columns
- [ ] Multi-tag items appear in all columns
- [ ] Untagged items go to Untagged column
- [ ] Auth state is shared across all components
- [ ] Kanban loads without redundant family_members queries
