# Fam — Design System & Styling Guide

## Overview

Fam's design is warm, encouraging, and family-friendly. It should feel like a cozy command center—capable and organized, but never cold or corporate.

**Design Principles:**
1. **Warm, not sterile** — Soft colors, rounded corners, subtle shadows
2. **Encouraging, not nagging** — Celebrate wins, gentle reminders for overdue items
3. **Clear, not cluttered** — Ample whitespace, focused views
4. **Playful, not childish** — Delightful touches that adults appreciate too
5. **Accessible** — WCAG 2.1 AA compliant

---

## Color Palette

### Core Colors

```css
:root {
  /* Background layers */
  --bg-base: #FAFAF8;        /* Warm off-white, main background */
  --bg-surface: #FFFFFF;      /* Cards, panels */
  --bg-elevated: #FFFFFF;     /* Modals, dropdowns */
  --bg-subtle: #F5F5F3;       /* Hover states, secondary backgrounds */
  
  /* Primary - Warm Sage */
  --primary-50: #F0F7F4;
  --primary-100: #DCF0E6;
  --primary-200: #BBE1CE;
  --primary-300: #8DCBAD;
  --primary-400: #5BAF87;
  --primary-500: #3D9268;      /* Main primary */
  --primary-600: #2D7653;
  --primary-700: #275F45;
  --primary-800: #234C39;
  --primary-900: #1F3F31;
  
  /* Secondary - Soft Coral */
  --secondary-50: #FFF5F3;
  --secondary-100: #FFE8E3;
  --secondary-200: #FFD5CC;
  --secondary-300: #FFB5A6;
  --secondary-400: #FF8A71;
  --secondary-500: #F86A4D;      /* Main secondary */
  --secondary-600: #E54D2E;
  --secondary-700: #C13D22;
  --secondary-800: #9F3520;
  --secondary-900: #842F1F;
  
  /* Neutral - Warm Grays */
  --neutral-50: #FAFAF8;
  --neutral-100: #F5F5F3;
  --neutral-200: #E8E8E5;
  --neutral-300: #D4D4D0;
  --neutral-400: #A3A39E;
  --neutral-500: #737370;
  --neutral-600: #545451;
  --neutral-700: #3D3D3B;
  --neutral-800: #282827;
  --neutral-900: #1A1A19;
  
  /* Text */
  --text-primary: #1A1A19;
  --text-secondary: #545451;
  --text-tertiary: #737370;
  --text-disabled: #A3A39E;
  --text-inverse: #FFFFFF;
  
  /* Semantic - Status */
  --success-light: #E6F7ED;
  --success-main: #22C55E;
  --success-dark: #16A34A;
  
  --warning-light: #FFF8E6;
  --warning-main: #F59E0B;
  --warning-dark: #D97706;
  
  --error-light: #FEE9E7;
  --error-main: #EF4444;
  --error-dark: #DC2626;
  
  --info-light: #E8F4FD;
  --info-main: #3B82F6;
  --info-dark: #2563EB;
}
```

### Family Member Colors

Each family member gets a distinct color for avatars, task assignments, etc.

```css
:root {
  --member-1: #6366F1;  /* Indigo */
  --member-2: #EC4899;  /* Pink */
  --member-3: #F59E0B;  /* Amber */
  --member-4: #10B981;  /* Emerald */
  --member-5: #8B5CF6;  /* Violet */
  --member-6: #06B6D4;  /* Cyan */
}
```

### Priority Colors

```css
:root {
  --priority-high: #EF4444;     /* Red */
  --priority-medium: #F59E0B;   /* Amber */
  --priority-low: #3B82F6;      /* Blue */
  --priority-none: #A3A39E;     /* Gray */
}
```

### Dark Mode (Future)

```css
/* Dark mode tokens - implement when needed */
[data-theme="dark"] {
  --bg-base: #1A1A19;
  --bg-surface: #282827;
  --bg-elevated: #3D3D3B;
  --text-primary: #FAFAF8;
  --text-secondary: #D4D4D0;
  /* ... etc */
}
```

---

## Typography

### Font Stack

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

### Type Scale

```css
:root {
  /* Font sizes */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */
  
  /* Line heights */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  
  /* Font weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Letter spacing */
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
}
```

### Type Styles

```css
/* Headings */
.heading-1 {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
}

.heading-2 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  color: var(--text-primary);
}

.heading-3 {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
  color: var(--text-primary);
}

.heading-4 {
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  line-height: var(--leading-snug);
  color: var(--text-primary);
}

/* Body text */
.body-large {
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  color: var(--text-primary);
}

.body-base {
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--text-primary);
}

.body-small {
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--text-secondary);
}

/* Labels & captions */
.label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: var(--leading-none);
  color: var(--text-secondary);
}

.caption {
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
  color: var(--text-tertiary);
}
```

---

## Spacing

Use a consistent 4px base unit.

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
}
```

### Common Spacing Patterns

| Context | Spacing |
|---------|---------|
| Card padding | `--space-4` (16px) |
| Section gap | `--space-6` (24px) |
| List item gap | `--space-3` (12px) |
| Icon + text | `--space-2` (8px) |
| Button padding | `--space-2` vertical, `--space-4` horizontal |
| Modal padding | `--space-6` (24px) |
| Page margins | `--space-4` mobile, `--space-8` desktop |

---

## Border Radius

```css
:root {
  --radius-sm: 4px;     /* Small elements, badges */
  --radius-md: 8px;     /* Buttons, inputs */
  --radius-lg: 12px;    /* Small cards */
  --radius-xl: 16px;    /* Cards, panels */
  --radius-2xl: 24px;   /* Large cards, modals */
  --radius-full: 9999px; /* Circles, pills */
}
```

---

## Shadows

```css
:root {
  /* Subtle lift for cards */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  
  /* Default card shadow */
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08);
  
  /* Hover state, elevated cards */
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.1);
  
  /* Modals, dropdowns */
  --shadow-xl: 0 8px 32px rgba(0, 0, 0, 0.12);
  
  /* Focus rings */
  --shadow-focus: 0 0 0 3px rgba(61, 146, 104, 0.3);
}
```

---

## Components

### Buttons

```
┌─────────────────────────────────────────────────┐
│ Primary   │ Secondary │ Ghost    │ Danger      │
├───────────┼───────────┼──────────┼─────────────┤
│ [Add Task]│ [Cancel]  │ [Edit]   │ [Delete]    │
│           │           │          │             │
│ Solid     │ Outlined  │ Text only│ Red variant │
│ primary-  │ neutral   │ neutral  │ error       │
│ 500 bg    │ border    │ text     │ colors      │
└───────────┴───────────┴──────────┴─────────────┘
```

**Button Specs:**
```css
.btn {
  height: 40px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: all 150ms ease;
}

.btn-sm {
  height: 32px;
  padding: 0 var(--space-3);
  font-size: var(--text-xs);
}

.btn-lg {
  height: 48px;
  padding: 0 var(--space-6);
  font-size: var(--text-base);
}

.btn-primary {
  background: var(--primary-500);
  color: var(--text-inverse);
}

.btn-primary:hover {
  background: var(--primary-600);
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--neutral-300);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--neutral-100);
  border-color: var(--neutral-400);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}

.btn-ghost:hover {
  background: var(--neutral-100);
  color: var(--text-primary);
}

.btn-danger {
  background: var(--error-main);
  color: var(--text-inverse);
}
```

### Cards

```css
.card {
  background: var(--bg-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--space-4);
}

.card-interactive {
  cursor: pointer;
  transition: all 150ms ease;
}

.card-interactive:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-1px);
}
```

**Card Variants:**
- **Default**: White background, subtle shadow
- **Bordered**: White background, neutral-200 border, no shadow
- **Colored**: Tinted background (e.g., success-light for milestones)
- **Flat**: No shadow, subtle background color

### Inputs

```css
.input {
  height: 40px;
  padding: 0 var(--space-3);
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  background: var(--bg-surface);
  transition: all 150ms ease;
}

.input:hover {
  border-color: var(--neutral-400);
}

.input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: var(--shadow-focus);
}

.input-error {
  border-color: var(--error-main);
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.3);
}
```

### Checkbox

```
┌───┐        ┌───┐
│   │  →     │ ✓ │
└───┘        └───┘
Unchecked    Checked (with animation)
```

```css
.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--neutral-400);
  border-radius: var(--radius-sm);
  transition: all 150ms ease;
}

.checkbox:checked {
  background: var(--primary-500);
  border-color: var(--primary-500);
}

/* Check animation: scale in with slight bounce */
```

### Avatar

```css
.avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-medium);
  font-size: var(--text-xs);
  color: var(--text-inverse);
  /* Background set to member color */
}

.avatar-sm { width: 24px; height: 24px; }
.avatar-md { width: 32px; height: 32px; }
.avatar-lg { width: 40px; height: 40px; }
.avatar-xl { width: 56px; height: 56px; }
```

### Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.badge-default {
  background: var(--neutral-100);
  color: var(--text-secondary);
}

.badge-primary {
  background: var(--primary-100);
  color: var(--primary-700);
}

.badge-success {
  background: var(--success-light);
  color: var(--success-dark);
}

.badge-warning {
  background: var(--warning-light);
  color: var(--warning-dark);
}

.badge-error {
  background: var(--error-light);
  color: var(--error-dark);
}
```

### Progress Bar

```css
.progress {
  height: 8px;
  background: var(--neutral-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--primary-500);
  border-radius: var(--radius-full);
  transition: width 300ms ease;
}

/* Color variants for goals at risk */
.progress-bar-warning { background: var(--warning-main); }
.progress-bar-error { background: var(--error-main); }
```

### Streak Indicator

```
🔥 12 days
```

```css
.streak {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--secondary-600);
}

/* Pulse animation on milestone numbers (7, 30, 100, etc.) */
```

---

## Iconography

Use **Lucide Icons** (open source, consistent, comprehensive).

**Icon Sizes:**
- sm: 16px (inline with text)
- md: 20px (default, buttons)
- lg: 24px (navigation)
- xl: 32px (empty states)

**Common Icons:**
| Concept | Icon |
|---------|------|
| Home | `Home` |
| Inbox | `Inbox` |
| Tasks | `CheckSquare` |
| Habits | `Repeat` |
| Goals | `Target` |
| Projects | `Folder` |
| Calendar | `Calendar` |
| Meals | `UtensilsCrossed` |
| People | `Users` |
| Settings | `Settings` |
| Add | `Plus` |
| Search | `Search` |
| More | `MoreHorizontal` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Check | `Check` |
| Close | `X` |
| Arrow | `ChevronRight` |
| Overdue | `AlertCircle` |
| Recurring | `RefreshCw` |

---

## Animations & Micro-interactions

### Transitions

```css
:root {
  --transition-fast: 100ms ease;
  --transition-normal: 150ms ease;
  --transition-slow: 300ms ease;
}
```

### Key Animations

**Task Complete:**
1. Checkbox fills with primary color (scale in)
2. Check mark draws in (stroke animation)
3. Task text gets strikethrough with slight fade
4. Row fades out after 500ms delay (if hiding completed)

**Streak Milestone:**
1. Fire emoji pulses
2. Number counts up
3. Subtle confetti burst for 7, 30, 100 day milestones

**Card Hover:**
```css
.card-interactive {
  transition: transform var(--transition-normal), 
              box-shadow var(--transition-normal);
}

.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

**Button Press:**
```css
.btn:active {
  transform: scale(0.98);
}
```

**Modal Enter:**
- Backdrop fades in
- Modal scales from 0.95 to 1 with fade

**Toast/Notification:**
- Slides in from bottom right
- Auto-dismisses after 4 seconds
- Fade out on dismiss

---

## Responsive Breakpoints

```css
:root {
  --breakpoint-sm: 640px;   /* Mobile landscape */
  --breakpoint-md: 768px;   /* Tablet */
  --breakpoint-lg: 1024px;  /* Desktop */
  --breakpoint-xl: 1280px;  /* Large desktop */
}
```

**Layout Behavior:**

| Breakpoint | Sidebar | Navigation | Grid |
|------------|---------|------------|------|
| < 640px | Hidden | Bottom nav | 1 column |
| 640-768px | Hidden | Bottom nav | 2 columns |
| 768-1024px | Collapsed (icons) | Sidebar | 2-3 columns |
| > 1024px | Full | Sidebar | 3-4 columns |

---

## Accessibility

### Focus States

All interactive elements must have visible focus states:

```css
:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}
```

### Color Contrast

- Text on backgrounds: minimum 4.5:1 ratio
- Large text (18px+): minimum 3:1 ratio
- Interactive elements: minimum 3:1 against adjacent colors

### Touch Targets

- Minimum touch target: 44x44px
- Adequate spacing between targets: 8px minimum

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Empty States

Every list/view needs a friendly empty state:

```
┌────────────────────────────────────────────┐
│                                            │
│                 [Icon]                     │
│                                            │
│           No tasks yet!                    │
│   Add your first task to get started.     │
│                                            │
│              [+ Add Task]                  │
│                                            │
└────────────────────────────────────────────┘
```

**Empty State Copy Examples:**

| Screen | Headline | Subtext |
|--------|----------|---------|
| Inbox | Inbox Zero! 🎉 | Everything's been processed. Nice work! |
| Tasks | No tasks yet | Add your first task to get organized. |
| Habits | No habits tracked | Start building positive routines. |
| Goals | No goals set | What do you want to achieve? |
| Milestones | No wins this week | Share something you're proud of! |
| Projects | No projects | Create a project to organize related tasks. |

---

## Loading States

**Skeleton Screens:**
Use skeleton placeholders that match the shape of content:

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--neutral-200) 25%,
    var(--neutral-100) 50%,
    var(--neutral-200) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Spinners:**
Use sparingly. Prefer skeleton screens for initial loads, spinner for actions.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-23 | Hazel + Claude | Initial design system |
| 1.1 | 2024-12-23 | Claude | Auth UI updated with emerald/teal gradient for magic link pages |
