# Data Model: Column Search Filters

**Feature**: 008-column-search-filters
**Date**: 2025-11-25

## Overview

This feature introduces column-level filtering state management. No database changes are required - all filtering is client-side on already-loaded data.

## New Types

### ColumnFilterState

Represents the current filter values for each filterable column.

```typescript
/**
 * Column filter state for table filtering
 * Feature: 008-column-search-filters
 */
export interface ColumnFilterState {
  /** Filter text for Subject column */
  subject: string
  /** Filter text for Sender column */
  sender: string
  /** Filter text for Category column */
  category: string
  /** Filter text for Urgency column */
  urgency: string
  /** Filter text for Action column */
  action: string
}

/**
 * Keys that can be filtered
 */
export type FilterableColumn = keyof ColumnFilterState

/**
 * Column filter configuration
 */
export interface ColumnFilterConfig {
  /** Column ID matching ColumnDefinition.id */
  columnId: string
  /** Key in ColumnFilterState */
  filterKey: FilterableColumn
  /** Placeholder text for filter input */
  placeholder: string
  /** Field path on classification object to filter */
  dataPath: string | ((row: ClassificationWithEmail) => string)
}
```

### FilterableColumns Configuration

Static configuration mapping columns to filter behavior.

```typescript
export const FILTERABLE_COLUMNS: ColumnFilterConfig[] = [
  {
    columnId: 'subject',
    filterKey: 'subject',
    placeholder: 'Filter subject...',
    dataPath: (row) => row.email?.subject ?? ''
  },
  {
    columnId: 'sender',
    filterKey: 'sender',
    placeholder: 'Filter sender...',
    dataPath: (row) => row.email?.sender ?? ''
  },
  {
    columnId: 'category',
    filterKey: 'category',
    placeholder: 'Filter category...',
    dataPath: 'category'
  },
  {
    columnId: 'urgency',
    filterKey: 'urgency',
    placeholder: 'Filter urgency...',
    dataPath: 'urgency'
  },
  {
    columnId: 'action',
    filterKey: 'action',
    placeholder: 'Filter action...',
    dataPath: 'action'
  }
]
```

## Existing Types (Reference)

### ClassificationWithEmail

The row data type being filtered (from `types/models.ts`):

```typescript
interface ClassificationWithEmail {
  id: number
  email_id: string
  category: 'KIDS' | 'ROBYN' | 'WORK' | 'FINANCIAL' | 'SHOPPING' | 'OTHER'
  urgency: 'HIGH' | 'MEDIUM' | 'LOW'
  action: 'FYI' | 'RESPOND' | 'TASK' | 'PAYMENT' | 'CALENDAR' | 'NONE'
  confidence_score: number
  classified_timestamp: string
  corrected_timestamp?: string
  corrected_by?: string
  version: number
  email: {
    id: string
    subject: string
    sender: string
    // ... other email fields
  }
}
```

## State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Subject  │  │ Sender   │  │ Category │  │ Urgency  │ ...    │
│  │ [_____]  │  │ [_____]  │  │ [_____]  │  │ [_____]  │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │               │
│       └─────────────┴─────────────┴─────────────┘               │
│                             │                                    │
│                      (debounce 300ms)                           │
│                             │                                    │
│                             ▼                                    │
│               ┌─────────────────────────┐                       │
│               │   useColumnFilters()     │                       │
│               │   - filters: Ref         │                       │
│               │   - setFilter()          │                       │
│               │   - applyFilters()       │                       │
│               └───────────┬─────────────┘                       │
│                           │                                      │
│                           ▼                                      │
│               ┌─────────────────────────┐                       │
│               │    Combined Filtering    │                       │
│               │  1. Global search        │                       │
│               │  2. Column filters       │                       │
│               │  3. Sidebar filters      │                       │
│               └───────────┬─────────────┘                       │
│                           │                                      │
│                           ▼                                      │
│               ┌─────────────────────────┐                       │
│               │   Filtered Rows         │                       │
│               │   (rendered in table)   │                       │
│               └─────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

## Constants Updates

### table.ts Updates

```typescript
// Add to existing constants/table.ts

/**
 * Column filter configuration
 * Feature: 008-column-search-filters
 */
export const COLUMN_FILTER_CONFIG = {
  /** Debounce delay for filter input */
  DEBOUNCE_MS: 300,
  /** Minimum characters to trigger filter */
  MIN_FILTER_LENGTH: 1,
  /** Maximum filter length */
  MAX_FILTER_LENGTH: 100
} as const

/**
 * Updated pagination config
 * Feature: 008-column-search-filters
 */
export const PAGINATION_CONFIG = {
  /** Default page size - UPDATED from 25 to 50 */
  DEFAULT_PAGE_SIZE: 50,
  /** Available page size options */
  PAGE_SIZE_OPTIONS: [25, 50, 100],
  /** Rows before end to trigger infinite scroll load */
  INFINITE_SCROLL_THRESHOLD: 5,
  /** Batch size for infinite scroll */
  INFINITE_SCROLL_BATCH_SIZE: 25
} as const
```

## No Database Changes Required

This feature operates entirely on client-side data. The filtering is applied to:
1. Data already fetched from Supabase
2. No new database columns, tables, or indexes needed
3. No API changes required

## Validation Rules

### Filter Input Validation

| Rule | Value | Behavior |
|------|-------|----------|
| Min length | 1 char | Filter applies immediately at 1 character |
| Max length | 100 chars | Input truncated, warning shown |
| Special chars | Allowed | Treated as literal text, not regex |
| Case | Insensitive | "WORK" matches "work" matches "Work" |
| Whitespace | Trimmed | Leading/trailing spaces removed before match |

### Filter Matching Logic

```typescript
function matchesFilter(value: string, filter: string): boolean {
  if (!filter || filter.trim() === '') return true
  const normalizedValue = value.toLowerCase().trim()
  const normalizedFilter = filter.toLowerCase().trim()
  return normalizedValue.includes(normalizedFilter)
}
```

## State Persistence (Optional Enhancement)

Column filter state could be persisted to localStorage for session continuity:

```typescript
// Storage key
const COLUMN_FILTERS_STORAGE_KEY = 'email-assistant:v1:column-filters'

// Structure (if implemented)
interface StoredColumnFilters {
  filters: ColumnFilterState
  timestamp: number
}
```

**Note**: Initial implementation will NOT persist filters. This is documented as an optional enhancement for future consideration.
