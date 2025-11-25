/**
 * useExpandableRows Composable
 * Feature: 005-table-enhancements
 * Tasks: T034, T035, T036
 *
 * Provides expandable row functionality with:
 * - Toggle expand/collapse state
 * - Lazy-load email body and correction history
 * - Cache loaded details to avoid redundant fetches
 */

import { ref, computed, readonly } from 'vue'
import { getClassificationWithDetails } from '@/services/classificationService'
import { logAction, logError } from '@/utils/logger'
import type { ClassificationWithDetails } from '@/types/table-enhancements'

export interface UseExpandableRowsOptions {
  /** Only allow one row expanded at a time */
  singleExpand?: boolean
  /** Callback when row is expanded */
  onExpand?: (id: number, details: ClassificationWithDetails) => void
  /** Callback when row is collapsed */
  onCollapse?: (id: number) => void
  /** Callback on fetch error */
  onError?: (id: number, error: Error) => void
}

export function useExpandableRows(options: UseExpandableRowsOptions = {}) {
  const { singleExpand = true, onExpand, onCollapse, onError } = options

  // State
  const expandedIds = ref<Set<number>>(new Set())
  const loadingIds = ref<Set<number>>(new Set())
  const detailsCache = ref<Map<number, ClassificationWithDetails>>(new Map())
  const errorMap = ref<Map<number, string>>(new Map())

  // Computed
  const expandedCount = computed(() => expandedIds.value.size)
  const hasExpandedRows = computed(() => expandedIds.value.size > 0)

  /**
   * Check if a row is expanded
   */
  function isExpanded(id: number): boolean {
    return expandedIds.value.has(id)
  }

  /**
   * Check if a row is currently loading details
   */
  function isLoading(id: number): boolean {
    return loadingIds.value.has(id)
  }

  /**
   * Get cached details for a row
   */
  function getDetails(id: number): ClassificationWithDetails | undefined {
    return detailsCache.value.get(id)
  }

  /**
   * Get error message for a row
   */
  function getError(id: number): string | undefined {
    return errorMap.value.get(id)
  }

  /**
   * Toggle expand/collapse for a row
   */
  async function toggleExpand(id: number): Promise<void> {
    if (isExpanded(id)) {
      collapse(id)
    } else {
      await expand(id)
    }
  }

  /**
   * Expand a row and fetch details
   */
  async function expand(id: number): Promise<void> {
    // If single expand mode, collapse all others first
    if (singleExpand && expandedIds.value.size > 0) {
      collapseAll()
    }

    // Clear any previous error for this row
    errorMap.value.delete(id)

    // Check if we already have cached details
    if (detailsCache.value.has(id)) {
      const newExpanded = new Set(expandedIds.value)
      newExpanded.add(id)
      expandedIds.value = newExpanded

      const details = detailsCache.value.get(id)!
      logAction('Row expanded (cached)', { id })
      onExpand?.(id, details)
      return
    }

    // Start loading
    const newLoading = new Set(loadingIds.value)
    newLoading.add(id)
    loadingIds.value = newLoading

    // Add to expanded set immediately for UI responsiveness
    const newExpanded = new Set(expandedIds.value)
    newExpanded.add(id)
    expandedIds.value = newExpanded

    try {
      // Fetch details (T035, T036 - lazy load email body and history)
      const details = await getClassificationWithDetails(id)

      // Cache the details
      detailsCache.value.set(id, details)

      logAction('Row expanded (fetched)', {
        id,
        hasBody: !!details.email?.body,
        historyCount: details.correctionHistory?.length || 0
      })

      onExpand?.(id, details)
    } catch (error) {
      logError('Failed to fetch row details', error, { id })

      // Store error for display
      errorMap.value.set(id, error instanceof Error ? error.message : 'Failed to load details')

      onError?.(id, error instanceof Error ? error : new Error('Failed to load details'))
    } finally {
      // Remove from loading
      const updatedLoading = new Set(loadingIds.value)
      updatedLoading.delete(id)
      loadingIds.value = updatedLoading
    }
  }

  /**
   * Collapse a row
   */
  function collapse(id: number): void {
    if (!expandedIds.value.has(id)) return

    const newExpanded = new Set(expandedIds.value)
    newExpanded.delete(id)
    expandedIds.value = newExpanded

    logAction('Row collapsed', { id })
    onCollapse?.(id)
  }

  /**
   * Collapse all expanded rows
   */
  function collapseAll(): void {
    const previousIds = Array.from(expandedIds.value)
    expandedIds.value = new Set()

    previousIds.forEach(id => onCollapse?.(id))
    logAction('All rows collapsed', { count: previousIds.length })
  }

  /**
   * Clear cached details for a row (useful after updates)
   */
  function clearCache(id: number): void {
    detailsCache.value.delete(id)
    errorMap.value.delete(id)
  }

  /**
   * Clear all cached details
   */
  function clearAllCache(): void {
    detailsCache.value.clear()
    errorMap.value.clear()
  }

  /**
   * Refresh details for an expanded row
   */
  async function refreshDetails(id: number): Promise<void> {
    clearCache(id)
    if (isExpanded(id)) {
      // Collapse first, then re-expand to trigger fetch
      collapse(id)
      await expand(id)
    }
  }

  return {
    // State (readonly)
    expandedIds: readonly(expandedIds),
    loadingIds: readonly(loadingIds),

    // Computed
    expandedCount,
    hasExpandedRows,

    // Methods
    isExpanded,
    isLoading,
    getDetails,
    getError,
    toggleExpand,
    expand,
    collapse,
    collapseAll,
    clearCache,
    clearAllCache,
    refreshDetails
  }
}

export type UseExpandableRowsReturn = ReturnType<typeof useExpandableRows>
