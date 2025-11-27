/**
 * Table Enhancements Types
 * Feature: 005-table-enhancements
 *
 * Type definitions for search, sort, bulk actions, expandable rows,
 * keyboard navigation, theme, pagination, and analytics features.
 */

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
  results: number[] // Classification IDs
  timestamp: number
  ttl: number // Time-to-live in ms
}

export interface SearchOptions {
  debounceMs?: number
  useServerSearch?: boolean
  threshold?: number // Row count threshold for server search
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
  value?: string // New category/urgency/action value
  ids: number[] // Selected classification IDs
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
  resolved: 'light' | 'dark' // Actual applied theme
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
  pattern: string // CSS pattern for accessibility
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
  expandedRows?: number[] // Optional: restore expanded state
}

// =============================================================================
// Analytics Types
// =============================================================================

export interface DateRange {
  start: string // ISO date string
  end: string // ISO date string
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

// =============================================================================
// Classification with Email (for expanded view)
// =============================================================================

export interface ClassificationWithDetails {
  id: number
  category: string
  urgency: string
  action: string
  confidence: number
  // Current values (after correction, if corrected)
  correctedCategory: string | null
  correctedUrgency: string | null
  correctedAction: string | null
  // Original values (before correction)
  originalCategory: string | null
  originalUrgency: string | null
  originalAction: string | null
  version: number
  createdAt: string
  updatedAt: string
  email: {
    id: number
    subject: string | null
    sender: string | null
    body: string | null
    receivedAt: string
  }
  correctionHistory?: CorrectionHistoryEntry[]
}

// =============================================================================
// Column Filter Types
// Feature: 008-column-search-filters
// =============================================================================

/**
 * Column filter state - one entry per filterable column
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
 * Valid column keys for filtering
 */
export type FilterableColumn = keyof ColumnFilterState
