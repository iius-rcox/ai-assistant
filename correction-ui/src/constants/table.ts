/**
 * Table Constants
 * Feature: 005-table-enhancements
 *
 * Column definitions, keyboard shortcuts, and table configuration constants.
 */

import type { ColumnDefinition, KeyboardShortcut, SortState } from '@/types/table-enhancements'

// =============================================================================
// Column Definitions
// =============================================================================

export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  {
    id: 'select',
    label: '',
    sortable: false,
    resizable: false,
    minWidth: 40,
    defaultWidth: 40,
    visible: true
  },
  {
    id: 'expand',
    label: '',
    sortable: false,
    resizable: false,
    minWidth: 40,
    defaultWidth: 40,
    visible: true
  },
  {
    id: 'subject',
    label: 'Subject',
    sortable: true,
    resizable: true,
    minWidth: 150,
    defaultWidth: 300,
    visible: true
  },
  {
    id: 'sender',
    label: 'From',
    sortable: true,
    resizable: true,
    minWidth: 100,
    defaultWidth: 180,
    visible: true
  },
  {
    id: 'category',
    label: 'Category',
    sortable: true,
    resizable: true,
    minWidth: 80,
    defaultWidth: 120,
    visible: true
  },
  {
    id: 'urgency',
    label: 'Urgency',
    sortable: true,
    resizable: true,
    minWidth: 80,
    defaultWidth: 100,
    visible: true
  },
  {
    id: 'action',
    label: 'Action',
    sortable: true,
    resizable: true,
    minWidth: 80,
    defaultWidth: 100,
    visible: true
  },
  {
    id: 'confidence',
    label: 'Confidence',
    sortable: true,
    resizable: true,
    minWidth: 80,
    defaultWidth: 120,
    visible: true
  },
  {
    id: 'created_at',
    label: 'Date',
    sortable: true,
    resizable: true,
    minWidth: 100,
    defaultWidth: 150,
    visible: true
  },
  {
    id: 'actions',
    label: '',
    sortable: false,
    resizable: false,
    minWidth: 80,
    defaultWidth: 80,
    visible: true
  }
]

// =============================================================================
// Default Sort Configuration
// =============================================================================

export const DEFAULT_SORT: SortState = {
  column: 'created_at',
  direction: 'desc'
}

// =============================================================================
// Keyboard Shortcuts
// =============================================================================

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Global shortcuts
  {
    key: '/',
    description: 'Focus search input',
    action: 'focus-search',
    context: 'global'
  },
  {
    key: '?',
    modifiers: ['shift'],
    description: 'Show keyboard shortcuts',
    action: 'show-shortcuts',
    context: 'global'
  },
  {
    key: 'Escape',
    description: 'Close modals/dialogs',
    action: 'close-modal',
    context: 'global'
  },
  // Table navigation
  {
    key: 'ArrowUp',
    description: 'Move to previous row',
    action: 'nav-up',
    context: 'table'
  },
  {
    key: 'ArrowDown',
    description: 'Move to next row',
    action: 'nav-down',
    context: 'table'
  },
  {
    key: 'Home',
    description: 'Go to first row',
    action: 'nav-first',
    context: 'table'
  },
  {
    key: 'End',
    description: 'Go to last row',
    action: 'nav-last',
    context: 'table'
  },
  // Row actions
  {
    key: 'Enter',
    description: 'Expand/collapse row',
    action: 'toggle-expand',
    context: 'row'
  },
  {
    key: ' ',
    description: 'Toggle row selection',
    action: 'toggle-select',
    context: 'row'
  },
  {
    key: 'e',
    description: 'Edit row',
    action: 'edit-row',
    context: 'row'
  }
]

// =============================================================================
// Search Configuration
// =============================================================================

export const SEARCH_CONFIG = {
  /** Debounce delay in milliseconds */
  DEBOUNCE_MS: 300,
  /** Minimum query length to trigger search */
  MIN_QUERY_LENGTH: 2,
  /** Maximum query length */
  MAX_QUERY_LENGTH: 200,
  /** Row count threshold for server-side search */
  SERVER_SEARCH_THRESHOLD: 1000,
  /** Cache TTL in milliseconds (5 minutes) */
  CACHE_TTL_MS: 5 * 60 * 1000
} as const

// =============================================================================
// Pagination Configuration
// =============================================================================

export const PAGINATION_CONFIG = {
  /** Default page size */
  DEFAULT_PAGE_SIZE: 25,
  /** Available page size options */
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  /** Rows before end to trigger infinite scroll load */
  INFINITE_SCROLL_THRESHOLD: 5,
  /** Batch size for infinite scroll */
  INFINITE_SCROLL_BATCH_SIZE: 25
} as const

// =============================================================================
// Confidence Thresholds
// =============================================================================

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 50
} as const

export const CONFIDENCE_COLORS = {
  high: '#27ae60', // Green
  medium: '#f39c12', // Amber
  low: '#e74c3c' // Red
} as const

// =============================================================================
// Bulk Action Configuration
// =============================================================================

export const BULK_ACTION_CONFIG = {
  /** Maximum items that can be selected for bulk action */
  MAX_SELECTION: 100
} as const

// =============================================================================
// Column Resize Configuration
// =============================================================================

export const COLUMN_RESIZE_CONFIG = {
  /** Minimum column width in pixels */
  MIN_WIDTH: 50,
  /** Maximum column width in pixels */
  MAX_WIDTH: 800
} as const

// =============================================================================
// Mobile Breakpoints
// =============================================================================

export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280
} as const
