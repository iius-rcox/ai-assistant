# Data Model: Shadcn Blue Theme and Pagination Refactor

**Feature**: 010-shadcn-blue-theme
**Date**: 2025-11-26
**Status**: Complete

## Overview

This feature is primarily a CSS/UI refactor with no database schema changes. The data model focuses on:
1. CSS Custom Property structure (design tokens)
2. Pagination component props and state
3. Theme state management

## CSS Token Structure

### Shadcn Base Tokens

```css
/* Token naming convention: --{semantic-role} */
/* Value format: H S% L% (HSL without hsl() wrapper) */

:root {
  /* Core semantic tokens */
  --background: H S% L%;
  --foreground: H S% L%;

  /* Component tokens */
  --card: H S% L%;
  --card-foreground: H S% L%;
  --popover: H S% L%;
  --popover-foreground: H S% L%;

  /* Interactive tokens */
  --primary: H S% L%;
  --primary-foreground: H S% L%;
  --secondary: H S% L%;
  --secondary-foreground: H S% L%;
  --muted: H S% L%;
  --muted-foreground: H S% L%;
  --accent: H S% L%;
  --accent-foreground: H S% L%;

  /* State tokens */
  --destructive: H S% L%;
  --destructive-foreground: H S% L%;

  /* UI element tokens */
  --border: H S% L%;
  --input: H S% L%;
  --ring: H S% L%;

  /* Shape tokens */
  --radius: length;

  /* Chart tokens */
  --chart-1: H S% L%;
  --chart-2: H S% L%;
  --chart-3: H S% L%;
  --chart-4: H S% L%;
  --chart-5: H S% L%;
}
```

### Token Inheritance Mapping

```
Shadcn Token          →  M3 Legacy Alias
─────────────────────────────────────────────
--background          →  --md-sys-color-surface
--foreground          →  --md-sys-color-on-surface
--primary             →  --md-sys-color-primary
--primary-foreground  →  --md-sys-color-on-primary
--secondary           →  --md-sys-color-secondary
--secondary-foreground→  --md-sys-color-on-secondary
--muted               →  --md-sys-color-surface-variant
--muted-foreground    →  --md-sys-color-on-surface-variant
--accent              →  --md-sys-color-tertiary
--destructive         →  --md-sys-color-error
--border              →  --md-sys-color-outline
--ring                →  --md-sys-color-primary (focus)
--card                →  --md-sys-color-surface-container
--input               →  --md-sys-color-surface-container-low
```

## Pagination Component Model

### PaginationProps Interface

```typescript
interface PaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number;

  /** Total number of pages */
  totalPages: number;

  /** Number of sibling pages to show on each side */
  siblingCount?: number; // default: 1

  /** Number of boundary pages to show at start/end */
  boundaryCount?: number; // default: 1

  /** Show first/last page buttons */
  showEdges?: boolean; // default: true

  /** Disabled state */
  disabled?: boolean; // default: false
}
```

### PaginationEmits Interface

```typescript
interface PaginationEmits {
  /** Emitted when page changes */
  (e: 'update:currentPage', page: number): void;

  /** Emitted when page changes (alias) */
  (e: 'change', page: number): void;
}
```

### PaginationItem Types

```typescript
type PaginationItemType =
  | 'page'      // Clickable page number
  | 'ellipsis'  // Non-clickable "..."
  | 'previous'  // Previous button
  | 'next';     // Next button

interface PaginationItem {
  type: PaginationItemType;
  page?: number;        // Only for 'page' type
  isActive?: boolean;   // Only for 'page' type
  isDisabled?: boolean; // For previous/next when at bounds
}
```

### usePagination Composable Return

```typescript
interface UsePaginationReturn {
  /** Array of pagination items to render */
  items: ComputedRef<PaginationItem[]>;

  /** Whether previous is disabled */
  hasPrevious: ComputedRef<boolean>;

  /** Whether next is disabled */
  hasNext: ComputedRef<boolean>;

  /** Navigate to specific page */
  goToPage: (page: number) => void;

  /** Navigate to previous page */
  goToPrevious: () => void;

  /** Navigate to next page */
  goToNext: () => void;

  /** Navigate to first page */
  goToFirst: () => void;

  /** Navigate to last page */
  goToLast: () => void;
}
```

## Theme State Model

### Existing Theme State (unchanged)

```typescript
// From useTheme.ts - no changes required
type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  themePreference: Ref<Theme>;
  systemPrefersDark: Ref<boolean>;
  resolvedTheme: ComputedRef<'light' | 'dark'>;
  isDark: ComputedRef<boolean>;
  isLight: ComputedRef<boolean>;
}
```

### Chart Theme State (updated)

```typescript
// Updated color model for useChartTheme.ts
interface ChartColors {
  // Core semantic colors (mapped from new shadcn tokens)
  primary: string;
  secondary: string;
  muted: string;
  accent: string;
  destructive: string;

  // Surface colors
  background: string;
  foreground: string;
  card: string;
  border: string;

  // Chart-specific colors
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}
```

## File Structure

### CSS Files (Modified)

```
correction-ui/src/assets/
├── main.css              # Import order (no changes)
├── base.css              # Base styles (update color references)
└── themes/
    ├── tokens.css        # ADD: shadcn token declarations
    ├── light.css         # UPDATE: shadcn blue light values
    └── dark.css          # UPDATE: shadcn blue dark values
```

### Component Files (New)

```
correction-ui/src/components/ui/pagination/
├── Pagination.vue            # Root nav container
├── PaginationContent.vue     # ul list wrapper
├── PaginationItem.vue        # li item wrapper
├── PaginationLink.vue        # Page number button
├── PaginationPrevious.vue    # Previous button
├── PaginationNext.vue        # Next button
├── PaginationEllipsis.vue    # Ellipsis indicator
└── index.ts                  # Barrel exports
```

### Composable Files (New/Modified)

```
correction-ui/src/composables/
├── usePagination.ts          # NEW: Page range calculation
├── useTheme.ts               # No changes
└── useChartTheme.ts          # UPDATE: New color variable reading
```

## Entity Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                        CSS Token Hierarchy                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  tokens.css (declarations)                                      │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │   light.css     │     │    dark.css     │                   │
│  │   (values)      │     │    (values)     │                   │
│  └────────┬────────┘     └────────┬────────┘                   │
│           │                       │                             │
│           └──────────┬───────────┘                             │
│                      ▼                                          │
│              base.css (usage)                                   │
│                      │                                          │
│                      ▼                                          │
│           Component scoped styles                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Pagination Component Tree                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  <Pagination>                    [nav aria-label="pagination"]  │
│       │                                                         │
│       └─── <PaginationContent>   [ul]                          │
│                 │                                               │
│                 ├─── <PaginationItem>   [li]                   │
│                 │         └─── <PaginationPrevious />          │
│                 │                                               │
│                 ├─── <PaginationItem>   [li]                   │
│                 │         └─── <PaginationLink page=1 />       │
│                 │                                               │
│                 ├─── <PaginationItem>   [li]                   │
│                 │         └─── <PaginationEllipsis />          │
│                 │                                               │
│                 ├─── <PaginationItem>   [li]                   │
│                 │         └─── <PaginationLink page=N active/> │
│                 │                                               │
│                 └─── <PaginationItem>   [li]                   │
│                           └─── <PaginationNext />              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Validation Rules

### CSS Token Values

- HSL values must be space-separated: `H S% L%`
- Hue: 0-360 (degrees)
- Saturation: 0-100%
- Lightness: 0-100%
- Radius must be a valid CSS length unit

### Pagination Props

- `currentPage`: Must be >= 1 and <= totalPages
- `totalPages`: Must be >= 1
- `siblingCount`: Must be >= 0
- `boundaryCount`: Must be >= 0

### Accessibility

- Color contrast ratios must meet WCAG AA (4.5:1 for normal text)
- Interactive elements must have visible focus indicators
- Disabled states must be visually distinct

## Migration Notes

### Backward Compatibility

The legacy M3 token aliases will be maintained:
- `--md-sys-color-*` tokens continue to work
- `--bg-*`, `--text-*`, `--border-*` aliases preserved
- Existing component styles unchanged

### Breaking Changes

None anticipated. All existing CSS variable references will continue to work through the alias layer.
