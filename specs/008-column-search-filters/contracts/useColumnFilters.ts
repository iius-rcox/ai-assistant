/**
 * useColumnFilters Contract
 * Feature: 008-column-search-filters
 *
 * This file defines the public interface for the useColumnFilters composable.
 * Implementation must conform to this contract.
 */

import type { Ref, ComputedRef } from 'vue'
import type { ClassificationWithEmail } from '@/types/models'

/**
 * Column filter state - one entry per filterable column
 */
export interface ColumnFilterState {
  subject: string
  sender: string
  category: string
  urgency: string
  action: string
}

/**
 * Valid column keys for filtering
 */
export type FilterableColumn = keyof ColumnFilterState

/**
 * Options for useColumnFilters composable
 */
export interface UseColumnFiltersOptions {
  /**
   * Debounce delay in milliseconds
   * @default 300
   */
  debounceMs?: number

  /**
   * Callback when any filter changes
   */
  onFilterChange?: (filters: ColumnFilterState) => void

  /**
   * Callback when all filters are cleared
   */
  onFiltersCleared?: () => void
}

/**
 * Return type for useColumnFilters composable
 */
export interface UseColumnFiltersReturn {
  // ===== State =====

  /**
   * Current filter values for all columns
   * @reactive
   */
  filters: Ref<ColumnFilterState>

  // ===== Computed =====

  /**
   * Number of columns with active filters
   * @computed
   */
  activeFilterCount: ComputedRef<number>

  /**
   * Whether any column has an active filter
   * @computed
   */
  hasActiveFilters: ComputedRef<boolean>

  /**
   * Array of column keys that have active filters
   * @computed
   */
  activeColumns: ComputedRef<FilterableColumn[]>

  // ===== Methods =====

  /**
   * Set filter value for a specific column
   * Triggers debounced filtering
   *
   * @param column - Column to filter
   * @param value - Filter text (empty string clears filter)
   */
  setFilter: (column: FilterableColumn, value: string) => void

  /**
   * Clear filter for a specific column
   *
   * @param column - Column to clear
   */
  clearFilter: (column: FilterableColumn) => void

  /**
   * Clear all column filters
   */
  clearAllFilters: () => void

  /**
   * Apply current filters to an array of classifications
   * Returns filtered array (original array not mutated)
   *
   * @param rows - Classifications to filter
   * @returns Filtered classifications
   */
  applyFilters: (rows: ClassificationWithEmail[]) => ClassificationWithEmail[]

  /**
   * Check if a specific column has an active filter
   *
   * @param column - Column to check
   * @returns true if column has non-empty filter
   */
  isColumnFiltered: (column: FilterableColumn) => boolean

  /**
   * Get current filter value for a column
   *
   * @param column - Column to get filter for
   * @returns Current filter value (empty string if not filtered)
   */
  getFilterValue: (column: FilterableColumn) => string
}

/**
 * useColumnFilters composable function signature
 */
export type UseColumnFilters = (options?: UseColumnFiltersOptions) => UseColumnFiltersReturn

// ===== Default Initial State =====

export const INITIAL_COLUMN_FILTERS: ColumnFilterState = {
  subject: '',
  sender: '',
  category: '',
  urgency: '',
  action: ''
}

// ===== Column Configuration =====

export interface ColumnFilterConfig {
  /** Column ID matching table column definition */
  columnId: string
  /** Key in ColumnFilterState */
  filterKey: FilterableColumn
  /** Placeholder text for input */
  placeholder: string
  /** Field path or accessor function */
  getValue: (row: ClassificationWithEmail) => string
}

export const FILTERABLE_COLUMNS: ColumnFilterConfig[] = [
  {
    columnId: 'subject',
    filterKey: 'subject',
    placeholder: 'Filter subject...',
    getValue: (row) => row.email?.subject ?? ''
  },
  {
    columnId: 'sender',
    filterKey: 'sender',
    placeholder: 'Filter sender...',
    getValue: (row) => row.email?.sender ?? ''
  },
  {
    columnId: 'category',
    filterKey: 'category',
    placeholder: 'Filter category...',
    getValue: (row) => row.category
  },
  {
    columnId: 'urgency',
    filterKey: 'urgency',
    placeholder: 'Filter urgency...',
    getValue: (row) => row.urgency
  },
  {
    columnId: 'action',
    filterKey: 'action',
    placeholder: 'Filter action...',
    getValue: (row) => row.action
  }
]
