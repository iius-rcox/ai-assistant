/**
 * useColumnFilters Composable
 * Feature: 008-column-search-filters
 * Tasks: T004-T010
 *
 * Provides column-level filtering state management for the classifications table.
 * Supports filtering by Subject, Sender, Category, Urgency, and Action columns
 * with case-insensitive substring matching and AND logic across columns.
 */

import { ref, computed, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { ColumnFilterState, FilterableColumn } from '@/types/table-enhancements'
import type { ClassificationWithEmail } from '@/types/models'
import { COLUMN_FILTER_CONFIG, FILTERABLE_COLUMNS } from '@/constants/table'
import { logAction } from '@/utils/logger'

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
 * Initial empty filter state
 */
const INITIAL_FILTERS: ColumnFilterState = {
  subject: '',
  sender: '',
  category: '',
  urgency: '',
  action: '',
}

/**
 * useColumnFilters composable for managing column-level table filtering
 *
 * @param options - Configuration options
 * @returns Filter state, computed properties, and methods
 *
 * @example
 * ```typescript
 * const {
 *   filters,
 *   hasActiveFilters,
 *   setFilter,
 *   clearAllFilters,
 *   applyFilters
 * } = useColumnFilters()
 *
 * // Set a filter
 * setFilter('category', 'WORK')
 *
 * // Apply filters to data
 * const filtered = applyFilters(classifications)
 * ```
 */
export function useColumnFilters(options: UseColumnFiltersOptions = {}) {
  const {
    debounceMs = COLUMN_FILTER_CONFIG.DEBOUNCE_MS,
    onFilterChange,
    onFiltersCleared,
  } = options

  // ===== State =====

  /**
   * Current filter values for all columns
   */
  const filters = ref<ColumnFilterState>({ ...INITIAL_FILTERS })

  // ===== Computed Properties =====

  /**
   * Number of columns with active filters
   */
  const activeFilterCount = computed(() => {
    return Object.values(filters.value).filter(v => v.trim().length > 0).length
  })

  /**
   * Whether any column has an active filter
   */
  const hasActiveFilters = computed(() => activeFilterCount.value > 0)

  /**
   * Array of column keys that have active filters
   */
  const activeColumns = computed<FilterableColumn[]>(() => {
    return (Object.keys(filters.value) as FilterableColumn[]).filter(
      key => filters.value[key].trim().length > 0
    )
  })

  // ===== Methods =====

  /**
   * Check if a value matches a filter (case-insensitive substring match)
   */
  function matchesFilter(value: string, filter: string): boolean {
    if (!filter || filter.trim() === '') return true
    const normalizedValue = (value || '').toLowerCase().trim()
    const normalizedFilter = filter.toLowerCase().trim()
    return normalizedValue.includes(normalizedFilter)
  }

  /**
   * Set filter value for a specific column
   * Triggers debounced callback if provided
   *
   * @param column - Column to filter
   * @param value - Filter text (empty string clears filter)
   */
  function setFilter(column: FilterableColumn, value: string) {
    // Truncate to max length
    const truncatedValue = value.slice(0, COLUMN_FILTER_CONFIG.MAX_FILTER_LENGTH)
    filters.value[column] = truncatedValue

    logAction('Column filter set', { column, value: truncatedValue })
  }

  /**
   * Debounced version of filter change notification
   */
  const debouncedNotify = useDebounceFn(() => {
    onFilterChange?.(filters.value)
  }, debounceMs)

  /**
   * Clear filter for a specific column
   *
   * @param column - Column to clear
   */
  function clearFilter(column: FilterableColumn) {
    filters.value[column] = ''
    logAction('Column filter cleared', { column })
  }

  /**
   * Clear all column filters
   */
  function clearAllFilters() {
    filters.value = { ...INITIAL_FILTERS }
    logAction('All column filters cleared')
    onFiltersCleared?.()
  }

  /**
   * Apply current filters to an array of classifications
   * Returns filtered array (original array not mutated)
   * Uses AND logic - row must match ALL active filters
   *
   * @param rows - Classifications to filter
   * @returns Filtered classifications
   */
  function applyFilters(rows: ClassificationWithEmail[]): ClassificationWithEmail[] {
    // If no active filters, return original array
    if (!hasActiveFilters.value) {
      return rows
    }

    return rows.filter(row => {
      // Check each filterable column
      return FILTERABLE_COLUMNS.every(columnConfig => {
        const filterValue = filters.value[columnConfig.filterKey]

        // No filter for this column = pass
        if (!filterValue || filterValue.trim() === '') {
          return true
        }

        // Get row value using the column's getValue function
        const rowValue = columnConfig.getValue(row)

        // Check if value matches filter
        return matchesFilter(rowValue, filterValue)
      })
    })
  }

  /**
   * Check if a specific column has an active filter
   *
   * @param column - Column to check
   * @returns true if column has non-empty filter
   */
  function isColumnFiltered(column: FilterableColumn): boolean {
    return filters.value[column].trim().length > 0
  }

  /**
   * Get current filter value for a column
   *
   * @param column - Column to get filter for
   * @returns Current filter value (empty string if not filtered)
   */
  function getFilterValue(column: FilterableColumn): string {
    return filters.value[column]
  }

  // ===== Watch for filter changes =====

  watch(
    filters,
    () => {
      debouncedNotify()
    },
    { deep: true }
  )

  // ===== Return =====

  return {
    // State
    filters,

    // Computed
    activeFilterCount,
    hasActiveFilters,
    activeColumns,

    // Methods
    setFilter,
    clearFilter,
    clearAllFilters,
    applyFilters,
    isColumnFiltered,
    getFilterValue,
  }
}

// Export type for external use
export type UseColumnFiltersReturn = ReturnType<typeof useColumnFilters>
