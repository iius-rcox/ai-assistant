# Data Model: Email Classifications Table Enhancements

**Feature**: 005-table-enhancements
**Date**: 2025-11-24
**Status**: Complete

## Overview

This feature enhances the existing `email_classifications` table display. No new database tables are required. This document defines the TypeScript types, state management models, and localStorage schemas for the frontend enhancements.

---

## Existing Database Entities (Reference)

These entities already exist in Supabase from previous features (001, 003, 004):

### email_classifications
```sql
-- Existing table (no changes)
CREATE TABLE email_classifications (
  id SERIAL PRIMARY KEY,
  email_id INTEGER REFERENCES emails(id),
  category VARCHAR(50) NOT NULL,
  urgency VARCHAR(20) NOT NULL,
  action VARCHAR(50) NOT NULL,
  confidence DECIMAL(5,2),
  corrected_category VARCHAR(50),
  corrected_urgency VARCHAR(20),
  corrected_action VARCHAR(50),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### emails
```sql
-- Existing table (no changes)
CREATE TABLE emails (
  id SERIAL PRIMARY KEY,
  message_id VARCHAR(255) UNIQUE,
  subject TEXT,
  sender VARCHAR(255),
  body TEXT,
  received_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Database Enhancements

### Full-Text Search Index (NEW)

```sql
-- Add GIN index for full-text search on emails
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_emails_search
ON emails USING GIN (
  to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(sender, '') || ' ' || coalesce(body, ''))
);

-- Create search function for Supabase RPC
CREATE OR REPLACE FUNCTION search_emails(search_query TEXT)
RETURNS SETOF emails AS $$
  SELECT * FROM emails
  WHERE to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(sender, '') || ' ' || coalesce(body, ''))
        @@ plainto_tsquery('english', search_query)
  ORDER BY ts_rank(
    to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(sender, '') || ' ' || coalesce(body, '')),
    plainto_tsquery('english', search_query)
  ) DESC;
$$ LANGUAGE SQL STABLE;
```

---

## TypeScript Types

### table-enhancements.ts (NEW)

```typescript
// =============================================================================
// Search Types
// =============================================================================

export interface SearchState {
  query: string
  isLoading: boolean
  resultCount: number | null
  lastSearchTime: number | null
}

export interface SearchCacheEntry {
  query: string
  results: number[]  // Classification IDs
  timestamp: number
  ttl: number        // Time-to-live in ms
}

export interface SearchOptions {
  debounceMs?: number
  useServerSearch?: boolean
  threshold?: number  // Row count threshold for server search
}

// =============================================================================
// Sort Types
// =============================================================================

export type SortDirection = 'asc' | 'desc'

export type SortableColumn =
  | 'subject'
  | 'sender'
  | 'category'
  | 'urgency'
  | 'action'
  | 'confidence'
  | 'created_at'
  | 'updated_at'

export interface SortState {
  column: SortableColumn
  direction: SortDirection
}

// =============================================================================
// Bulk Action Types
// =============================================================================

export type BulkActionType =
  | 'change_category'
  | 'change_urgency'
  | 'change_action'
  | 'mark_reviewed'

export interface BulkActionPayload {
  type: BulkActionType
  value?: string  // New category/urgency/action value
  ids: number[]   // Selected classification IDs
}

export interface BulkActionResult {
  success: number[]
  failed: Array<{
    id: number
    error: string
  }>
}

export interface SelectionState {
  selected: Set<number>
  isAllSelected: boolean
  isIndeterminate: boolean
}

// =============================================================================
// Expandable Row Types
// =============================================================================

export interface ExpandedRowData {
  emailBody: string | null
  correctionHistory: CorrectionHistoryEntry[]
  isLoading: boolean
  error: string | null
}

export interface CorrectionHistoryEntry {
  id: number
  previousCategory: string | null
  newCategory: string
  previousUrgency: string | null
  newUrgency: string
  previousAction: string | null
  newAction: string
  correctedAt: string
  source: 'user' | 'system'
}

// =============================================================================
// Column Types
// =============================================================================

export interface ColumnDefinition {
  id: SortableColumn | 'expand' | 'select' | 'actions'
  label: string
  sortable: boolean
  resizable: boolean
  minWidth: number
  defaultWidth: number
  visible: boolean
}

export interface ColumnWidths {
  [columnId: string]: number
}

// =============================================================================
// Keyboard Navigation Types
// =============================================================================

export interface KeyboardShortcut {
  key: string
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[]
  description: string
  action: string
  context: 'global' | 'table' | 'row'
}

export interface FocusState {
  focusedRowId: number | null
  focusedColumnId: string | null
  isTableFocused: boolean
}

// =============================================================================
// Theme Types
// =============================================================================

export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeState {
  mode: ThemeMode
  resolved: 'light' | 'dark'  // Actual applied theme
}

// =============================================================================
// Pagination Types
// =============================================================================

export type PaginationStyle = 'infinite' | 'pages'

export interface PaginationState {
  style: PaginationStyle
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasMore: boolean
  isLoadingMore: boolean
}

export interface InfiniteScrollState {
  loadedCount: number
  batchSize: number
  isLoading: boolean
  hasMore: boolean
  scrollPosition: number
}

// =============================================================================
// Confidence Indicator Types
// =============================================================================

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface ConfidenceDisplay {
  value: number
  level: ConfidenceLevel
  color: string
  pattern: string  // CSS pattern for accessibility
}

// =============================================================================
// User Preferences (localStorage)
// =============================================================================

export interface TableUserPreferences {
  sort: SortState
  columnWidths: ColumnWidths
  paginationStyle: PaginationStyle
  pageSize: number
  theme: ThemeMode
  expandedRows?: number[]  // Optional: restore expanded state
}

// =============================================================================
// Analytics Types
// =============================================================================

export interface DateRange {
  start: string  // ISO date string
  end: string    // ISO date string
}

export interface CorrectionsOverTime {
  date: string
  corrections: number
  total: number
  accuracy: number
}

export interface CategoryDistribution {
  category: string
  count: number
  percentage: number
}

export interface AccuracyTrend {
  date: string
  accuracy: number
  corrections: number
  classifications: number
}

export interface AnalyticsExportOptions {
  format: 'csv' | 'pdf'
  dateRange: DateRange
  includeCharts: boolean
}
```

---

## State Management (Pinia Store Extensions)

### classificationStore.ts Extensions

```typescript
// Add to existing classificationStore

interface TableEnhancementsState {
  // Search
  searchQuery: string
  searchResults: number[] | null
  isSearching: boolean
  searchCache: Map<string, SearchCacheEntry>

  // Sort
  sortState: SortState

  // Selection
  selectedIds: Set<number>

  // Expanded
  expandedIds: Set<number>
  expandedData: Map<number, ExpandedRowData>

  // Focus
  focusState: FocusState

  // Pagination
  paginationState: PaginationState
}

interface TableEnhancementsActions {
  // Search
  setSearchQuery(query: string): void
  clearSearch(): void
  cacheSearchResults(query: string, results: number[]): void

  // Sort
  setSortColumn(column: SortableColumn): void
  toggleSortDirection(): void

  // Selection
  toggleSelection(id: number): void
  selectAll(): void
  clearSelection(): void

  // Expanded
  toggleExpanded(id: number): Promise<void>
  collapseAll(): void

  // Bulk Actions
  executeBulkAction(action: BulkActionPayload): Promise<BulkActionResult>
}
```

---

## localStorage Schema

### Storage Keys

```typescript
const STORAGE_PREFIX = 'correction-ui'
const STORAGE_VERSION = 'v1'

export const TABLE_STORAGE_KEYS = {
  SORT: `${STORAGE_PREFIX}:${STORAGE_VERSION}:table:sort`,
  COLUMN_WIDTHS: `${STORAGE_PREFIX}:${STORAGE_VERSION}:table:columns`,
  PAGINATION_STYLE: `${STORAGE_PREFIX}:${STORAGE_VERSION}:table:pagination`,
  PAGE_SIZE: `${STORAGE_PREFIX}:${STORAGE_VERSION}:table:pageSize`,
  THEME: `${STORAGE_PREFIX}:${STORAGE_VERSION}:theme`,
  SEARCH_CACHE: `${STORAGE_PREFIX}:${STORAGE_VERSION}:search:cache`
} as const
```

### Storage Schema

```typescript
// Sort State
{
  key: 'correction-ui:v1:table:sort',
  value: {
    column: 'created_at',
    direction: 'desc'
  }
}

// Column Widths
{
  key: 'correction-ui:v1:table:columns',
  value: {
    subject: 300,
    category: 120,
    urgency: 100,
    action: 120,
    confidence: 100,
    created_at: 150
  }
}

// Theme
{
  key: 'correction-ui:v1:theme',
  value: 'system' // or 'light' | 'dark'
}
```

---

## Entity Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend State                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │ SearchState  │────▶│ SortState    │────▶│ Filtered &   │   │
│  │              │     │              │     │ Sorted List  │   │
│  └──────────────┘     └──────────────┘     └──────────────┘   │
│         │                                         │            │
│         ▼                                         ▼            │
│  ┌──────────────┐                         ┌──────────────┐    │
│  │ SearchCache  │                         │ SelectionSet │    │
│  │ (localStorage)│                         │              │    │
│  └──────────────┘                         └──────────────┘    │
│                                                   │            │
│                                                   ▼            │
│                                           ┌──────────────┐    │
│                                           │ BulkActions  │    │
│                                           │              │    │
│                                           └──────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase Database                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     ┌──────────────────────┐                │
│  │   emails     │◀────│ email_classifications │                │
│  │              │     │                      │                │
│  │ • subject    │     │ • category           │                │
│  │ • sender     │     │ • urgency            │                │
│  │ • body       │     │ • action             │                │
│  │ • GIN index  │     │ • confidence         │                │
│  └──────────────┘     │ • corrected_*        │                │
│                       └──────────────────────┘                │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Validation Rules

### Search
- Query minimum length: 2 characters (skip search for shorter)
- Query maximum length: 200 characters
- Debounce: 300ms

### Sort
- Only sortable columns can be sorted
- Default: `created_at` descending

### Column Widths
- Minimum: 50px
- Maximum: 800px
- Default widths defined per column

### Selection
- Maximum selection: 100 items (for bulk action performance)
- Selection clears on filter/sort change

### Bulk Actions
- Require at least 1 selected item
- Display confirmation for destructive actions

---

## Migration Notes

No database migrations required. The only database change is adding a GIN index for full-text search, which is non-destructive and can be added via:

```sql
-- Run once in Supabase SQL editor
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_emails_search
ON emails USING GIN (
  to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(sender, '') || ' ' || coalesce(body, ''))
);
```
