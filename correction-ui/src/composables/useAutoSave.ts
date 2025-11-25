/**
 * Auto-Save Composable
 * Feature: 004-inline-edit
 * Task: T052
 * Requirements: FR-023, FR-024 (localStorage backup for edit state)
 *
 * Automatically saves edit state to localStorage for recovery
 */

import { watch, onUnmounted } from 'vue'
import { useStorage, useDebounceFn } from '@vueuse/core'
import type { InlineEditData } from '@/types/inline-edit'
import { STORAGE_KEYS, STORAGE_EXPIRY_MS } from '@/constants/storage'
import { logAction, logInfo } from '@/utils/logger'

export interface AutoSaveState {
  rowId: number
  data: InlineEditData
  timestamp: number
  version?: number
}

export interface UseAutoSaveOptions {
  /** Debounce delay in ms (default: 1000) */
  debounceMs?: number
  /** Called when saved state is recovered */
  onRecover?: (state: AutoSaveState) => void
}

export function useAutoSave(options: UseAutoSaveOptions = {}) {
  const { debounceMs = 1000, onRecover } = options

  // Use VueUse's useStorage for reactive localStorage
  const savedState = useStorage<AutoSaveState | null>(
    STORAGE_KEYS.INLINE_EDIT_DRAFT,
    null,
    localStorage,
    { mergeDefaults: true }
  )

  /**
   * Save current edit state to localStorage
   */
  const saveToStorage = useDebounceFn((rowId: number, data: InlineEditData, version?: number) => {
    const state: AutoSaveState = {
      rowId,
      data: { ...data },
      timestamp: Date.now(),
      version
    }
    savedState.value = state
    logInfo('Auto-saved edit state to localStorage', { rowId })
  }, debounceMs)

  /**
   * Clear saved state from localStorage
   */
  function clearSavedState() {
    savedState.value = null
    logAction('Cleared auto-saved state')
  }

  /**
   * Check if there's a recoverable saved state
   */
  function hasSavedState(): boolean {
    if (!savedState.value) return false

    // Check if saved state has expired
    const age = Date.now() - savedState.value.timestamp
    if (age > STORAGE_EXPIRY_MS) {
      clearSavedState()
      return false
    }

    return true
  }

  /**
   * Get saved state if available and not expired
   */
  function getSavedState(): AutoSaveState | null {
    if (!hasSavedState()) return null
    return savedState.value
  }

  /**
   * Recover saved state
   */
  function recoverSavedState(): AutoSaveState | null {
    const state = getSavedState()
    if (state && onRecover) {
      onRecover(state)
      logAction('Recovered auto-saved state', { rowId: state.rowId })
    }
    return state
  }

  /**
   * Watch edit data and auto-save changes
   */
  function watchAndSave(
    rowIdGetter: () => number | null,
    dataGetter: () => InlineEditData | null,
    versionGetter?: () => number | null
  ) {
    return watch(
      [rowIdGetter, dataGetter],
      ([rowId, data]) => {
        if (rowId !== null && data !== null) {
          const version = versionGetter?.() ?? undefined
          saveToStorage(rowId, data, version)
        }
      },
      { deep: true }
    )
  }

  // Clean up on unmount
  onUnmounted(() => {
    // Don't clear on unmount - we want to preserve for recovery
  })

  return {
    savedState,
    saveToStorage,
    clearSavedState,
    hasSavedState,
    getSavedState,
    recoverSavedState,
    watchAndSave
  }
}
