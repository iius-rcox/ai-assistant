/**
 * Classification Store
 * Feature: 003-correction-ui, 004-inline-edit, 005-table-enhancements, 008-column-search-filters
 * Tasks: T020, T024, T025, T013, T007, T026
 *
 * Global state management for classifications using Pinia
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ClassificationWithEmail,
  ClassificationFilters,
  PaginationParams,
} from '@/types/models'
import type {
  InlineEditState,
  InlineEditData,
  SaveStatus,
  DisplayMode,
  ConflictData,
} from '@/types/inline-edit'
import type {
  SortState,
  SearchState,
  SelectionState,
  ExpandedRowData,
} from '@/types/table-enhancements'
import * as classificationService from '@/services/classificationService'
import { logAction, logError } from '@/utils/logger'
import { PAGINATION_CONFIG } from '@/constants/table'

export const useClassificationStore = defineStore('classification', () => {
  // State - List View
  const classifications = ref<ClassificationWithEmail[]>([])
  const totalCount = ref(0)
  const currentPage = ref(1)
  const pageSize = ref<number>(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE) // T026: Default 50 rows
  const filters = ref<ClassificationFilters>({})
  const sortBy = ref('classified_timestamp')
  const sortDir = ref<'asc' | 'desc'>('desc')
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  // State - Table Enhancements (Feature: 005-table-enhancements, Task: T007)
  const searchQuery = ref('')
  const searchResults = ref<number[] | null>(null)
  const isSearching = ref(false)
  const selectedIds = ref<Set<number>>(new Set())
  const expandedIds = ref<Set<number>>(new Set())
  const expandedData = ref<Map<number, ExpandedRowData>>(new Map())
  const focusedRowId = ref<number | null>(null)

  // State - Inline Edit (Feature: 004-inline-edit, Task: T013)
  const editingRowId = ref<number | null>(null)
  const originalData = ref<InlineEditData | null>(null)
  const originalVersion = ref<number | null>(null)
  const currentData = ref<InlineEditData | null>(null)
  const saveStatus = ref<SaveStatus>('idle')
  const saveError = ref<string | null>(null)
  const conflictData = ref<ConflictData | null>(null)
  const displayMode = ref<DisplayMode>('inline')

  // Getters
  const pageCount = computed(() => Math.ceil(totalCount.value / pageSize.value))

  // Check if any filters are active (T087 - for empty state message)
  const hasActiveFilters = computed(() => {
    const f = filters.value
    return !!(
      f.confidenceMin !== undefined ||
      f.confidenceMax !== undefined ||
      f.dateFrom !== undefined ||
      f.dateTo !== undefined ||
      (f.category && f.category.length > 0) ||
      f.corrected !== undefined
    )
  })

  // Table enhancement getters (Feature: 005-table-enhancements, Task: T007)
  const selectedCount = computed(() => selectedIds.value.size)
  const isAllSelected = computed(
    () =>
      classifications.value.length > 0 &&
      classifications.value.every(c => selectedIds.value.has(c.id))
  )
  const isIndeterminate = computed(() => selectedIds.value.size > 0 && !isAllSelected.value)
  const hasSearch = computed(() => searchQuery.value.length > 0)

  // Inline edit getters (Feature: 004-inline-edit, Task: T013)
  const isEditing = computed(() => editingRowId.value !== null)
  const hasUnsavedChanges = computed(() => {
    if (!originalData.value || !currentData.value) return false
    return JSON.stringify(originalData.value) !== JSON.stringify(currentData.value)
  })
  const hasConflict = computed(() => conflictData.value !== null)

  // Actions

  /**
   * Fetch classifications with current pagination/filters/sorting
   * Task: T024
   */
  async function fetchClassifications() {
    isLoading.value = true
    error.value = null

    try {
      logAction('Fetching classifications', {
        page: currentPage.value,
        pageSize: pageSize.value,
        filters: filters.value,
      })

      const result = await classificationService.listClassifications({
        page: currentPage.value,
        pageSize: pageSize.value,
        filters: filters.value,
        sortBy: sortBy.value,
        sortDir: sortDir.value,
      })

      classifications.value = result.data
      totalCount.value = result.totalCount

      logAction('Classifications fetched successfully', {
        count: result.data.length,
        total: result.totalCount,
        page: currentPage.value,
      })
    } catch (e) {
      error.value = e as Error
      logError('Failed to fetch classifications', e)
      classifications.value = []
      totalCount.value = 0
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Refresh classifications (re-fetch current page)
   */
  async function refreshClassifications() {
    await fetchClassifications()
  }

  /**
   * Update classification (save correction)
   * Task: T025
   */
  async function updateClassification(
    id: number,
    updates: {
      category: string
      urgency: string
      action: string
      correction_reason?: string | null
    }
  ) {
    try {
      logAction('Updating classification', { id, updates })

      const updated = await classificationService.updateClassification({
        id,
        updates: {
          category: updates.category as any,
          urgency: updates.urgency as any,
          action: updates.action as any,
          correction_reason: updates.correction_reason,
        },
      })

      // Update local state
      const index = classifications.value.findIndex(c => c.id === id)
      if (index !== -1) {
        const current = classifications.value[index]
        if (current && current.email) {
          classifications.value[index] = {
            ...current,
            ...updated.classification,
            email: current.email,
          } as any
        }
      }

      logAction('Classification updated successfully', { id })

      return updated.classification
    } catch (e) {
      error.value = e as Error
      logError('Failed to update classification', e, { id })
      throw e
    }
  }

  /**
   * Set current page and fetch
   */
  function setPage(page: number) {
    currentPage.value = page
    fetchClassifications()
  }

  /**
   * Set page size and reset to page 1
   */
  function setPageSize(size: number) {
    pageSize.value = size
    currentPage.value = 1
    fetchClassifications()
  }

  /**
   * Set filters and reset to page 1
   */
  function setFilters(newFilters: ClassificationFilters) {
    filters.value = newFilters
    currentPage.value = 1
    fetchClassifications()
  }

  /**
   * Clear all filters and refresh
   */
  function clearFilters() {
    filters.value = {}
    currentPage.value = 1
    fetchClassifications()
  }

  /**
   * Set sorting and refresh
   */
  function setSorting(column: string, direction: 'asc' | 'desc') {
    sortBy.value = column
    sortDir.value = direction
    fetchClassifications()
  }

  /**
   * Start editing a row
   * Feature: 004-inline-edit
   * Task: T013
   * Requirements: FR-001, FR-008
   */
  function startEditingRow(id: number) {
    const classification = classifications.value.find(c => c.id === id)
    if (!classification) {
      logError('Cannot start editing: classification not found', null, { id })
      return
    }

    editingRowId.value = id
    originalData.value = {
      category: classification.category,
      urgency: classification.urgency,
      action: classification.action,
    }
    originalVersion.value = classification.version
    currentData.value = { ...originalData.value }
    saveStatus.value = 'idle'
    saveError.value = null
    conflictData.value = null

    logAction('Started editing row', { id })
  }

  /**
   * Update a field in the current edit
   * Feature: 004-inline-edit
   * Task: T013
   * Requirement: FR-002
   */
  function updateEditField<K extends keyof InlineEditData>(field: K, value: InlineEditData[K]) {
    if (!currentData.value) return

    currentData.value[field] = value
    logAction('Updated edit field', { field, value })
  }

  /**
   * Cancel editing and revert changes
   * Feature: 004-inline-edit
   * Task: T013
   * Requirements: FR-015
   */
  function cancelEditing() {
    const rowId = editingRowId.value

    editingRowId.value = null
    originalData.value = null
    originalVersion.value = null
    currentData.value = null
    saveStatus.value = 'idle'
    saveError.value = null
    conflictData.value = null

    logAction('Cancelled editing', { rowId })
  }

  /**
   * Set save status
   * Feature: 004-inline-edit
   * Task: T013
   */
  function setSaveStatus(status: SaveStatus) {
    saveStatus.value = status
  }

  /**
   * Set conflict data
   * Feature: 004-inline-edit
   * Task: T013
   * Requirements: FR-021, FR-022
   */
  function setConflictData(conflict: ConflictData | null) {
    conflictData.value = conflict
    if (conflict) {
      saveStatus.value = 'conflict'
    }
  }

  /**
   * Set display mode (inline vs modal)
   * Feature: 004-inline-edit
   * Task: T013
   * Requirements: FR-031, FR-032, FR-033
   */
  function setDisplayMode(mode: DisplayMode) {
    displayMode.value = mode
  }

  return {
    // State - List View
    classifications,
    totalCount,
    currentPage,
    pageSize,
    filters,
    sortBy,
    sortDir,
    isLoading,
    error,
    // State - Table Enhancements
    searchQuery,
    searchResults,
    isSearching,
    selectedIds,
    expandedIds,
    expandedData,
    focusedRowId,
    // State - Inline Edit
    editingRowId,
    originalData,
    originalVersion,
    currentData,
    saveStatus,
    saveError,
    conflictData,
    displayMode,
    // Getters
    pageCount,
    hasActiveFilters,
    selectedCount,
    isAllSelected,
    isIndeterminate,
    hasSearch,
    isEditing,
    hasUnsavedChanges,
    hasConflict,
    // Actions - List View
    fetchClassifications,
    refreshClassifications,
    updateClassification,
    setPage,
    setPageSize,
    setFilters,
    clearFilters,
    setSorting,
    // Actions - Inline Edit
    startEditingRow,
    updateEditField,
    cancelEditing,
    setSaveStatus,
    setConflictData,
    setDisplayMode,
  }
})
