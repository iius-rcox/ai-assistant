/**
 * useBulkActions Composable
 * Feature: 005-table-enhancements
 * Tasks: T024, T025
 *
 * Provides bulk action functionality with:
 * - Multi-select state management
 * - Select all / clear selection
 * - Batch update operations
 */

import { ref, computed, watch } from 'vue'
import { useClassificationStore } from '@/stores/classificationStore'
import { logAction, logError } from '@/utils/logger'
import type {
  BulkActionPayload,
  BulkActionResult,
  BulkActionType,
} from '@/types/table-enhancements'
import type { ClassificationWithEmail } from '@/types/models'
import { BULK_ACTION_CONFIG } from '@/constants/table'
import type { ActionTypeV2 } from '@/types/actions'

// V2 to V1 action mapping for backward compatibility
const V2_TO_V1_ACTION_MAP: Record<ActionTypeV2, string> = {
  IGNORE: 'FYI',
  SHIPMENT: 'NONE',
  DRAFT_REPLY: 'RESPOND',
  JUNK: 'NONE',
  NOTIFY: 'FYI',
  CALENDAR: 'CALENDAR',
}

export interface UseBulkActionsOptions {
  /** Maximum items that can be selected */
  maxSelection?: number
  /** Callback when selection changes */
  onSelectionChange?: (selectedIds: number[]) => void
  /** Callback when bulk action completes */
  onActionComplete?: (result: BulkActionResult) => void
}

export function useBulkActions(options: UseBulkActionsOptions = {}) {
  const store = useClassificationStore()
  const {
    maxSelection = BULK_ACTION_CONFIG.MAX_SELECTION,
    onSelectionChange,
    onActionComplete,
  } = options

  // State
  const selectedIds = ref<Set<number>>(new Set())
  const isProcessing = ref(false)
  const lastActionResult = ref<BulkActionResult | null>(null)

  // Computed
  const selectedCount = computed(() => selectedIds.value.size)

  const isAllSelected = computed(() => {
    const classifications = store.classifications
    if (classifications.length === 0) return false
    return classifications.every(c => selectedIds.value.has(c.id))
  })

  const isIndeterminate = computed(() => selectedIds.value.size > 0 && !isAllSelected.value)

  const hasSelection = computed(() => selectedIds.value.size > 0)

  const canSelectMore = computed(() => selectedIds.value.size < maxSelection)

  const selectedClassifications = computed(() =>
    store.classifications.filter(c => selectedIds.value.has(c.id))
  )

  // ==========================================================================
  // Selection Methods (T025)
  // ==========================================================================

  /**
   * Toggle selection for a single item
   */
  function toggleSelection(id: number) {
    const newSelection = new Set(selectedIds.value)

    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      if (canSelectMore.value) {
        newSelection.add(id)
      } else {
        logAction('Max selection reached', { maxSelection })
        return false
      }
    }

    selectedIds.value = newSelection
    onSelectionChange?.(Array.from(newSelection))
    logAction('Selection toggled', { id, selected: newSelection.has(id), total: newSelection.size })
    return true
  }

  /**
   * Select a single item
   */
  function select(id: number) {
    if (selectedIds.value.has(id)) return true

    if (!canSelectMore.value) {
      logAction('Cannot select: max selection reached', { maxSelection })
      return false
    }

    const newSelection = new Set(selectedIds.value)
    newSelection.add(id)
    selectedIds.value = newSelection
    onSelectionChange?.(Array.from(newSelection))
    return true
  }

  /**
   * Deselect a single item
   */
  function deselect(id: number) {
    if (!selectedIds.value.has(id)) return

    const newSelection = new Set(selectedIds.value)
    newSelection.delete(id)
    selectedIds.value = newSelection
    onSelectionChange?.(Array.from(newSelection))
  }

  /**
   * Select all visible items (up to maxSelection)
   * @param items - Optional array of classifications to select from (defaults to store.classifications)
   */
  function selectAll(items?: ClassificationWithEmail[]) {
    const classifications = items ?? store.classifications
    const newSelection = new Set<number>()

    for (let i = 0; i < Math.min(classifications.length, maxSelection); i++) {
      const item = classifications[i]
      if (item) {
        newSelection.add(item.id)
      }
    }

    selectedIds.value = newSelection
    onSelectionChange?.(Array.from(newSelection))
    logAction('Select all', { count: newSelection.size })
  }

  /**
   * Clear all selections
   */
  function clearSelection() {
    selectedIds.value = new Set()
    onSelectionChange?.([])
    logAction('Selection cleared')
  }

  /**
   * Toggle select all / clear all
   * @param items - Optional array of classifications to select from (defaults to store.classifications)
   */
  function toggleSelectAll(items?: ClassificationWithEmail[]) {
    if (isAllSelected.value) {
      clearSelection()
    } else {
      selectAll(items)
    }
  }

  /**
   * Check if an item is selected
   */
  function isSelected(id: number): boolean {
    return selectedIds.value.has(id)
  }

  /**
   * Select a range of items (shift+click support)
   */
  function selectRange(startId: number, endId: number) {
    const classifications = store.classifications
    const startIndex = classifications.findIndex(c => c.id === startId)
    const endIndex = classifications.findIndex(c => c.id === endId)

    if (startIndex === -1 || endIndex === -1) return

    const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex]

    const newSelection = new Set(selectedIds.value)
    let added = 0

    for (let i = from; i <= to && newSelection.size < maxSelection; i++) {
      const item = classifications[i]
      if (item && !newSelection.has(item.id)) {
        newSelection.add(item.id)
        added++
      }
    }

    selectedIds.value = newSelection
    onSelectionChange?.(Array.from(newSelection))
    logAction('Range selection', { from: startId, to: endId, added })
  }

  // ==========================================================================
  // Bulk Action Execution
  // ==========================================================================

  /**
   * Execute a bulk action on selected items
   */
  async function executeBulkAction(
    actionType: BulkActionType,
    value?: string
  ): Promise<BulkActionResult> {
    if (selectedIds.value.size === 0) {
      const result: BulkActionResult = { success: [], failed: [] }
      lastActionResult.value = result
      return result
    }

    isProcessing.value = true
    const ids = Array.from(selectedIds.value)

    logAction('Starting bulk action', { actionType, value, count: ids.length })

    const result: BulkActionResult = {
      success: [],
      failed: [],
    }

    try {
      // Process each item (can be optimized with batch API if available)
      for (const id of ids) {
        try {
          await executeSingleAction(id, actionType, value)
          result.success.push(id)
        } catch (error) {
          result.failed.push({
            id,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      logAction('Bulk action completed', {
        actionType,
        success: result.success.length,
        failed: result.failed.length,
      })

      // Clear selection on success
      if (result.failed.length === 0) {
        clearSelection()
      }

      // Refresh data
      await store.refreshClassifications()

      lastActionResult.value = result
      onActionComplete?.(result)

      return result
    } catch (error) {
      logError('Bulk action failed', error)
      throw error
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * Execute action on a single item
   */
  async function executeSingleAction(
    id: number,
    actionType: BulkActionType,
    value?: string
  ): Promise<void> {
    const classification = store.classifications.find(c => c.id === id)
    if (!classification) {
      throw new Error(`Classification ${id} not found`)
    }

    const updates: any = {}

    switch (actionType) {
      case 'change_category':
        if (!value) throw new Error('Category value required')
        updates.category = value
        updates.urgency = classification.urgency
        updates.action = classification.action
        break

      case 'change_urgency':
        if (!value) throw new Error('Urgency value required')
        updates.category = classification.category
        updates.urgency = value
        updates.action = classification.action
        break

      case 'change_action':
        if (!value) throw new Error('Action value required')
        updates.category = classification.category
        updates.urgency = classification.urgency
        // Set both v1 and v2 action fields
        updates.action = V2_TO_V1_ACTION_MAP[value as ActionTypeV2] || 'NONE'
        updates.action_v2 = value
        break

      case 'mark_reviewed':
        // Mark as reviewed by setting correction_reason
        updates.category = classification.category
        updates.urgency = classification.urgency
        updates.action = classification.action
        updates.correction_reason = 'Bulk reviewed'
        break
    }

    await store.updateClassification(id, updates)
  }

  // Clear selection when classifications change (e.g., page change)
  watch(
    () => store.classifications,
    () => {
      // Remove any selected IDs that are no longer in the current view
      const currentIds = new Set(store.classifications.map(c => c.id))
      const newSelection = new Set<number>()

      selectedIds.value.forEach(id => {
        if (currentIds.has(id)) {
          newSelection.add(id)
        }
      })

      if (newSelection.size !== selectedIds.value.size) {
        selectedIds.value = newSelection
        onSelectionChange?.(Array.from(newSelection))
      }
    }
  )

  return {
    // State
    selectedIds,
    isProcessing,
    lastActionResult,

    // Computed
    selectedCount,
    isAllSelected,
    isIndeterminate,
    hasSelection,
    canSelectMore,
    selectedClassifications,

    // Selection methods
    toggleSelection,
    select,
    deselect,
    selectAll,
    clearSelection,
    toggleSelectAll,
    isSelected,
    selectRange,

    // Action methods
    executeBulkAction,
  }
}

export type UseBulkActionsReturn = ReturnType<typeof useBulkActions>
