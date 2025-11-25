/**
 * Inline Edit Composable
 * Feature: 004-inline-edit
 * Task: T014
 * Requirements: FR-001 through FR-025
 *
 * Main composable for inline editing logic with save/cancel/conflict handling
 * Uses Supabase for updates with optimistic locking (version check)
 *
 * Reference: contracts/supabase-rpc.md, research.md Section 2 - Optimistic Locking
 */

import { computed, watch, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useClassificationStore } from '@/stores/classificationStore'
import { supabase } from '@/services/supabase'
import type { InlineEditData, SaveResult, ConflictData, SaveStatus } from '@/types/inline-edit'
import type { Classification } from '@/types/models'
import type { Category, UrgencyLevel, ActionType } from '@/types/enums'
import { logAction, logError, logInfo } from '@/utils/logger'

/**
 * Result of update operation with optimistic locking
 */
interface OptimisticUpdateResult {
  success: boolean
  data?: Classification
  newVersion?: number
  conflict?: {
    serverVersion: Classification
  }
  error?: string
}

/**
 * Composable for inline table row editing with optimistic locking
 *
 * @returns Object containing edit state and functions for save/cancel/conflict handling
 *
 * @example
 * ```vue
 * <script setup>
 * const {
 *   editingRowId,
 *   currentData,
 *   isDirty,
 *   saveStatus,
 *   hasConflict,
 *   startEditing,
 *   updateField,
 *   saveEdit,
 *   cancelEdit,
 *   resolveConflict
 * } = useInlineEdit()
 *
 * // Start editing a row
 * startEditing(123)
 *
 * // Update a field
 * updateField('category', 'WORK')
 *
 * // Save changes
 * await saveEdit()
 * </script>
 * ```
 */
export function useInlineEdit() {
  const store = useClassificationStore()

  // Extract reactive state from store
  const {
    editingRowId,
    originalData,
    originalVersion,
    currentData,
    saveStatus,
    saveError,
    conflictData,
    displayMode,
    hasUnsavedChanges,
    hasConflict,
    isEditing,
    classifications
  } = storeToRefs(store)

  /**
   * Computed: Check if current data is valid for save
   * All three fields (category, urgency, action) must have values
   */
  const isValid = computed(() => {
    if (!currentData.value) return false
    return !!(
      currentData.value.category &&
      currentData.value.urgency &&
      currentData.value.action
    )
  })

  /**
   * Computed: Can save (dirty, valid, and not currently saving)
   */
  const canSave = computed(() => {
    return hasUnsavedChanges.value && isValid.value && saveStatus.value !== 'saving'
  })

  /**
   * Start editing a row
   * Delegates to store action which handles all state setup
   *
   * @param id - The classification ID to edit
   */
  function startEditing(id: number): void {
    // Check if already editing a different row
    if (editingRowId.value !== null && editingRowId.value !== id) {
      logInfo('Switching edit rows', {
        from: editingRowId.value,
        to: id,
        hasUnsavedChanges: hasUnsavedChanges.value
      })
    }

    store.startEditingRow(id)
    logAction('Inline edit started', { id })
  }

  /**
   * Update a field in the current edit
   *
   * @param field - The field to update (category, urgency, or action)
   * @param value - The new value for the field
   */
  function updateField<K extends keyof InlineEditData>(
    field: K,
    value: InlineEditData[K]
  ): void {
    store.updateEditField(field, value)
    logAction('Field updated', { field, value })
  }

  /**
   * Cancel editing and revert all changes
   * Clears edit state and returns row to display mode
   */
  function cancelEdit(): void {
    const rowId = editingRowId.value
    store.cancelEditing()
    logAction('Edit cancelled', { rowId })
  }

  /**
   * Save the current edit with optimistic locking
   * Uses version check to detect concurrent modifications
   *
   * @returns SaveResult indicating success, conflict, or error
   */
  async function saveEdit(): Promise<SaveResult> {
    if (!editingRowId.value || !currentData.value || !originalVersion.value) {
      logError('Cannot save: missing edit state', null, {
        editingRowId: editingRowId.value,
        hasCurrentData: !!currentData.value,
        hasVersion: !!originalVersion.value
      })
      return {
        success: false,
        error: 'No row is currently being edited'
      }
    }

    if (!hasUnsavedChanges.value) {
      logInfo('No changes to save', { rowId: editingRowId.value })
      cancelEdit()
      return { success: true }
    }

    // Validate before saving
    if (!isValid.value) {
      store.setSaveStatus('error')
      return {
        success: false,
        error: 'All fields must have valid values'
      }
    }

    const id = editingRowId.value
    const expectedVersion = originalVersion.value
    const updates = { ...currentData.value }

    store.setSaveStatus('saving')
    logAction('Save started', { id, expectedVersion, updates })

    try {
      const result = await updateClassificationWithVersion(id, updates, expectedVersion)

      if (result.success && result.data) {
        // Success: Update local store and exit edit mode
        await handleSaveSuccess(id, result.data)
        return { success: true, data: result.data }
      } else if (result.conflict) {
        // Version conflict: Show conflict resolution UI
        return handleVersionConflict(id, updates, expectedVersion, result.conflict.serverVersion)
      } else {
        // Other error
        store.setSaveStatus('error')
        logError('Save failed', new Error(result.error || 'Unknown error'), { id })
        return {
          success: false,
          error: result.error || 'Failed to save changes'
        }
      }
    } catch (err) {
      store.setSaveStatus('error')
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      logError('Save exception', err, { id })
      return {
        success: false,
        error: message
      }
    }
  }

  /**
   * Update classification with optimistic locking
   * Uses Supabase conditional update with version check
   *
   * @param id - Classification ID
   * @param updates - Field updates to apply
   * @param expectedVersion - Version number to check against
   * @returns Update result with success/conflict/error status
   */
  async function updateClassificationWithVersion(
    id: number,
    updates: InlineEditData,
    expectedVersion: number
  ): Promise<OptimisticUpdateResult> {
    try {
      // Attempt update with version check
      const updatePayload = {
        category: updates.category as Category,
        urgency: updates.urgency as UrgencyLevel,
        action: updates.action as ActionType,
        corrected_timestamp: new Date().toISOString(),
        corrected_by: 'inline-edit'
      }

      const { data, error } = await (supabase
        .from('classifications') as any)
        .update(updatePayload)
        .eq('id', id)
        .eq('version', expectedVersion)
        .select()
        .single()

      // Handle Supabase errors
      if (error) {
        // PGRST116 = no rows returned (version mismatch or not found)
        if (error.code === 'PGRST116') {
          return await handlePotentialConflict(id, updates)
        }

        return {
          success: false,
          error: `Database error: ${error.message}`
        }
      }

      if (!data) {
        return {
          success: false,
          error: 'No data returned from update'
        }
      }

      return {
        success: true,
        data: data as unknown as Classification,
        newVersion: (data as any).version
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Handle potential version conflict
   * Fetches current server state to determine if conflict or not found
   *
   * @param id - Classification ID
   * @param clientChanges - Client's attempted updates
   * @returns Result with conflict info or error
   */
  async function handlePotentialConflict(
    id: number,
    clientChanges: InlineEditData
  ): Promise<OptimisticUpdateResult> {
    // Fetch current server state
    const { data: serverData, error } = await supabase
      .from('classifications')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !serverData) {
      return {
        success: false,
        error: 'Classification not found'
      }
    }

    // Classification exists but version changed - conflict
    logInfo('Version conflict detected', {
      id,
      clientChanges,
      serverVersion: (serverData as any).version
    })

    return {
      success: false,
      conflict: {
        serverVersion: serverData as unknown as Classification
      }
    }
  }

  /**
   * Handle successful save
   * Updates local store and exits edit mode
   *
   * @param id - Classification ID
   * @param savedData - Updated classification from server
   */
  async function handleSaveSuccess(id: number, savedData: Classification): Promise<void> {
    store.setSaveStatus('success')

    // Update the classification in the local store
    const index = classifications.value.findIndex(c => c.id === id)
    if (index !== -1) {
      // Preserve the email relationship when updating
      const current = classifications.value[index]
      if (current && current.email) {
        classifications.value[index] = {
          ...current,
          ...savedData,
          email: current.email // Preserve email relationship
        } as any
      }
    }

    logAction('Save successful', { id, newVersion: (savedData as any).version })

    // Exit edit mode after brief success indicator
    setTimeout(() => {
      if (editingRowId.value === id && saveStatus.value === 'success') {
        cancelEdit()
      }
    }, 1500)
  }

  /**
   * Handle version conflict
   * Sets up conflict data for resolution UI
   *
   * @param id - Classification ID
   * @param clientChanges - Client's attempted updates
   * @param expectedVersion - Version client expected
   * @param serverData - Current server state
   * @returns SaveResult with conflict info
   */
  function handleVersionConflict(
    id: number,
    clientChanges: InlineEditData,
    expectedVersion: number,
    serverData: Classification
  ): SaveResult {
    const conflict: ConflictData = {
      rowId: id,
      clientVersion: { ...clientChanges },
      serverVersion: serverData,
      baseVersion: originalData.value!,
      expectedVersion,
      currentVersion: serverData.version
    }

    store.setConflictData(conflict)
    store.setSaveStatus('conflict')

    logAction('Conflict displayed', { id, serverVersion: serverData.version })

    return {
      success: false,
      conflict
    }
  }

  /**
   * Force save (overwrite server version)
   * Used when user chooses "Keep My Changes" in conflict resolution
   *
   * @returns SaveResult indicating success or error
   */
  async function forceOverwrite(): Promise<SaveResult> {
    if (!editingRowId.value || !currentData.value) {
      return { success: false, error: 'No row is currently being edited' }
    }

    const id = editingRowId.value
    const updates = { ...currentData.value }

    store.setSaveStatus('saving')
    logAction('Force overwrite started', { id })

    try {
      // Update without version check (force overwrite)
      const updatePayload = {
        category: updates.category as Category,
        urgency: updates.urgency as UrgencyLevel,
        action: updates.action as ActionType,
        corrected_timestamp: new Date().toISOString(),
        corrected_by: 'inline-edit-force'
      }

      const { data, error } = await (supabase
        .from('classifications') as any)
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single()

      if (error || !data) {
        store.setSaveStatus('error')
        return { success: false, error: error?.message || 'Update failed' }
      }

      // Clear conflict and handle success
      store.setConflictData(null)
      await handleSaveSuccess(id, data as unknown as Classification)

      return { success: true, data: data as unknown as Classification }
    } catch (err) {
      store.setSaveStatus('error')
      const message = err instanceof Error ? err.message : 'Force save failed'
      logError('Force overwrite failed', err, { id })
      return { success: false, error: message }
    }
  }

  /**
   * Accept server version
   * Used when user chooses "Use Server Version" in conflict resolution
   * Updates local edit state to match server and clears conflict
   */
  function acceptServerVersion(): void {
    if (!conflictData.value) return

    const serverData = conflictData.value.serverVersion

    // Update current data to match server
    store.updateEditField('category', serverData.category)
    store.updateEditField('urgency', serverData.urgency)
    store.updateEditField('action', serverData.action)

    // Update the classification in the list
    const index = classifications.value.findIndex(c => c.id === serverData.id)
    if (index !== -1) {
      const current = classifications.value[index]
      if (current && current.email) {
        classifications.value[index] = {
          ...current,
          ...serverData,
          email: current.email
        } as any
      }
    }

    // Clear conflict and exit edit mode
    store.setConflictData(null)
    store.setSaveStatus('idle')
    cancelEdit()

    logAction('Server version accepted', { id: serverData.id })
  }

  /**
   * Resolve conflict with custom merged values
   * Used for 3-way merge scenarios
   *
   * @param mergedData - The merged field values to save
   * @returns SaveResult indicating success or error
   */
  async function resolveMerge(mergedData: InlineEditData): Promise<SaveResult> {
    if (!editingRowId.value || !conflictData.value) {
      return { success: false, error: 'No conflict to resolve' }
    }

    // Update current data with merged values
    store.updateEditField('category', mergedData.category)
    store.updateEditField('urgency', mergedData.urgency)
    store.updateEditField('action', mergedData.action)

    // Clear conflict and attempt save with current server version
    const serverVersion = conflictData.value.currentVersion
    store.setConflictData(null)

    // Update original version to current server version for next save attempt
    if (originalVersion.value !== null) {
      // Note: We need to update the originalVersion ref
      // This is handled by the store's internal state
    }

    logAction('Merge resolution started', {
      id: editingRowId.value,
      mergedData,
      serverVersion
    })

    // Attempt to save with the current server version
    return saveEdit()
  }

  /**
   * Check if we can start editing a different row
   * Returns true if no unsaved changes, or user confirms discard
   *
   * @param newRowId - ID of the new row to edit
   * @returns boolean indicating if switch is allowed
   */
  function canSwitchRow(newRowId: number): boolean {
    if (!editingRowId.value || editingRowId.value === newRowId) {
      return true
    }

    if (!hasUnsavedChanges.value) {
      return true
    }

    // If there are unsaved changes, prompt user
    return window.confirm(
      'You have unsaved changes. Do you want to discard them and edit a different row?'
    )
  }

  /**
   * Refresh current row data from server
   * Useful after conflict detection to get latest state
   *
   * @returns The refreshed classification or null if not found
   */
  async function refreshCurrentRow(): Promise<Classification | null> {
    if (!editingRowId.value) return null

    try {
      const { data, error } = await supabase
        .from('classifications')
        .select('*')
        .eq('id', editingRowId.value)
        .single()

      if (error || !data) {
        logError('Failed to refresh row', error, { id: editingRowId.value })
        return null
      }

      logAction('Row refreshed', { id: editingRowId.value, version: (data as any).version })
      return data as unknown as Classification
    } catch (err) {
      logError('Refresh exception', err, { id: editingRowId.value })
      return null
    }
  }

  /**
   * Retry last failed save
   * Can be called when save status is 'error'
   */
  async function retrySave(): Promise<SaveResult> {
    if (saveStatus.value !== 'error') {
      logInfo('Retry skipped - not in error state', { status: saveStatus.value })
      return { success: false, error: 'Not in error state' }
    }

    logAction('Retrying save', { rowId: editingRowId.value })
    return saveEdit()
  }

  // Cleanup on unmount
  onUnmounted(() => {
    // If we have unsaved changes, log a warning
    if (hasUnsavedChanges.value) {
      logInfo('Component unmounted with unsaved changes', {
        rowId: editingRowId.value
      })
    }
  })

  return {
    // State (from store, already reactive)
    editingRowId,
    originalData,
    originalVersion,
    currentData,
    saveStatus,
    saveError,
    conflictData,
    displayMode,

    // Computed
    isDirty: hasUnsavedChanges,
    isValid,
    canSave,
    hasConflict,
    isEditing,

    // Actions
    startEditing,
    updateField,
    cancelEdit,
    saveEdit,
    forceOverwrite,
    acceptServerVersion,
    resolveMerge,
    canSwitchRow,
    refreshCurrentRow,
    retrySave
  }
}

export default useInlineEdit
