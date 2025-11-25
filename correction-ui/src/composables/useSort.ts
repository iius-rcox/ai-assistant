/**
 * useSort Composable
 * Feature: 005-table-enhancements
 * Tasks: T017, T021
 *
 * Provides sorting functionality with:
 * - Multi-column sort support
 * - LocalStorage persistence
 * - Type-specific comparison functions
 */

import { ref, computed, watch, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
import { useClassificationStore } from '@/stores/classificationStore'
import { logAction } from '@/utils/logger'
import { TABLE_STORAGE_KEYS } from '@/constants/storage'
import { DEFAULT_SORT } from '@/constants/table'
import type { SortState, SortDirection, SortableColumn } from '@/types/table-enhancements'
import type { ClassificationWithEmail } from '@/types/models'

export interface UseSortOptions {
  /** Persist sort preference to localStorage */
  persist?: boolean
  /** Default sort state */
  defaultSort?: SortState
  /** Callback when sort changes */
  onSortChange?: (sortState: SortState) => void
}

export function useSort(options: UseSortOptions = {}) {
  const store = useClassificationStore()
  const { persist = true, defaultSort = DEFAULT_SORT, onSortChange } = options

  // Sort state with optional localStorage persistence
  const storedSort = persist
    ? useStorage<SortState>(TABLE_STORAGE_KEYS.SORT, defaultSort)
    : ref<SortState>(defaultSort)

  const sortColumn = computed(() => storedSort.value.column)
  const sortDirection = computed(() => storedSort.value.direction)

  /**
   * Toggle sort for a column
   * Cycles: unsorted -> asc -> desc -> asc (sticky to column)
   * Task: T019
   */
  function toggleSort(column: SortableColumn) {
    const currentColumn = storedSort.value.column
    const currentDirection = storedSort.value.direction

    let newDirection: SortDirection

    if (currentColumn === column) {
      // Same column - toggle direction
      newDirection = currentDirection === 'asc' ? 'desc' : 'asc'
    } else {
      // New column - start with ascending
      newDirection = 'asc'
    }

    storedSort.value = { column, direction: newDirection }

    logAction('Sort toggled', { column, direction: newDirection })

    // Update store and trigger refetch
    store.setSorting(column, newDirection)

    onSortChange?.(storedSort.value)
  }

  /**
   * Set sort directly (for programmatic use)
   */
  function setSort(column: SortableColumn, direction: SortDirection) {
    storedSort.value = { column, direction }
    store.setSorting(column, direction)
    logAction('Sort set', { column, direction })
    onSortChange?.(storedSort.value)
  }

  /**
   * Reset to default sort
   */
  function resetSort() {
    storedSort.value = defaultSort
    store.setSorting(defaultSort.column, defaultSort.direction)
    logAction('Sort reset to default')
    onSortChange?.(storedSort.value)
  }

  /**
   * Check if column is currently sorted
   */
  function isColumnSorted(column: SortableColumn): boolean {
    return storedSort.value.column === column
  }

  /**
   * Get sort indicator for a column
   * Returns: 'asc', 'desc', or null
   */
  function getSortIndicator(column: SortableColumn): SortDirection | null {
    if (storedSort.value.column === column) {
      return storedSort.value.direction
    }
    return null
  }

  // ==========================================================================
  // Comparison Functions (T021)
  // ==========================================================================

  /**
   * Compare two values for sorting
   * Handles nulls, strings, numbers, and dates
   */
  function compareValues(a: any, b: any, direction: SortDirection): number {
    // Handle nulls - always sort to end
    if (a === null || a === undefined) return direction === 'asc' ? 1 : -1
    if (b === null || b === undefined) return direction === 'asc' ? -1 : 1

    // Handle numbers
    if (typeof a === 'number' && typeof b === 'number') {
      return direction === 'asc' ? a - b : b - a
    }

    // Handle dates (ISO strings)
    if (isDateString(a) && isDateString(b)) {
      const dateA = new Date(a).getTime()
      const dateB = new Date(b).getTime()
      return direction === 'asc' ? dateA - dateB : dateB - dateA
    }

    // Handle strings (case-insensitive)
    const strA = String(a).toLowerCase()
    const strB = String(b).toLowerCase()
    const result = strA.localeCompare(strB)
    return direction === 'asc' ? result : -result
  }

  /**
   * Check if a string is an ISO date
   */
  function isDateString(value: any): boolean {
    if (typeof value !== 'string') return false
    // Basic ISO date pattern check
    return /^\d{4}-\d{2}-\d{2}/.test(value)
  }

  /**
   * Get the value for a sortable column from a classification
   */
  function getColumnValue(item: ClassificationWithEmail, column: SortableColumn): any {
    switch (column) {
      case 'subject':
        return item.email?.subject
      case 'sender':
        return item.email?.sender
      case 'category':
        return item.category
      case 'urgency':
        return item.urgency
      case 'action':
        return item.action
      case 'confidence':
        return item.confidence_score
      case 'created_at':
        return item.created_at
      case 'updated_at':
        return item.updated_at
      default:
        return null
    }
  }

  /**
   * Sort an array of classifications client-side
   * Use when all data is loaded (for search results)
   */
  function sortClassifications(
    items: ClassificationWithEmail[],
    column: SortableColumn = sortColumn.value,
    direction: SortDirection = sortDirection.value
  ): ClassificationWithEmail[] {
    return [...items].sort((a, b) => {
      const valueA = getColumnValue(a, column)
      const valueB = getColumnValue(b, column)
      return compareValues(valueA, valueB, direction)
    })
  }

  // Sync with store on mount if persisted sort differs
  onMounted(() => {
    if (persist && store.sortBy !== storedSort.value.column) {
      store.setSorting(storedSort.value.column, storedSort.value.direction)
    }
  })

  return {
    // State
    sortState: storedSort,
    sortColumn,
    sortDirection,

    // Actions
    toggleSort,
    setSort,
    resetSort,

    // Helpers
    isColumnSorted,
    getSortIndicator,
    sortClassifications,
    compareValues
  }
}

export type UseSortReturn = ReturnType<typeof useSort>
