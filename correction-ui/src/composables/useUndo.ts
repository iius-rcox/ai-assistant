/**
 * Undo Composable
 * Feature: 007-instant-edit-undo
 * Tasks: T003-T008
 * Requirements: FR-002 through FR-006, FR-012
 *
 * Provides single-level undo functionality for inline edits
 * with 30-second timeout window
 */

import { ref, computed, readonly, onUnmounted } from 'vue'
import { supabase } from '@/services/supabase'
import type { UndoEntry, UndoChange, UndoResult } from '@/types/undo'
import type { Category, UrgencyLevel, ActionType } from '@/types/enums'
import { logAction, logError, logInfo } from '@/utils/logger'

/** Undo window duration in milliseconds (30 seconds) */
const UNDO_TIMEOUT_MS = 30000

/** Timer ID for cleanup */
let undoTimer: ReturnType<typeof setTimeout> | null = null

/** Interval ID for time remaining updates */
let timeRemainingInterval: ReturnType<typeof setInterval> | null = null

// =============================================================================
// State (module-level singleton)
// =============================================================================

/** Current undo entry (null if nothing to undo) */
const undoEntry = ref<UndoEntry | null>(null)

/** Whether undo operation is in progress */
const isUndoing = ref(false)

/** Seconds remaining in undo window */
const timeRemaining = ref(0)

// =============================================================================
// Computed
// =============================================================================

/** Whether undo is available */
const canUndo = computed(() => {
  return undoEntry.value !== null && !isUndoing.value && timeRemaining.value > 0
})

/** Description of the undoable action */
const undoDescription = computed(() => {
  return undoEntry.value?.description ?? null
})

// =============================================================================
// Internal Functions
// =============================================================================

/**
 * Clear the undo timer
 */
function clearUndoTimer(): void {
  if (undoTimer) {
    clearTimeout(undoTimer)
    undoTimer = null
  }
  if (timeRemainingInterval) {
    clearInterval(timeRemainingInterval)
    timeRemainingInterval = null
  }
}

/**
 * Start the undo expiration timer
 */
function startUndoTimer(): void {
  clearUndoTimer()

  // Set initial time remaining
  timeRemaining.value = Math.ceil(UNDO_TIMEOUT_MS / 1000)

  // Update time remaining every second
  timeRemainingInterval = setInterval(() => {
    timeRemaining.value = Math.max(0, timeRemaining.value - 1)
    if (timeRemaining.value === 0) {
      clearUndo()
    }
  }, 1000)

  // Set main expiration timer
  undoTimer = setTimeout(() => {
    logInfo('Undo expired', { entryId: undoEntry.value?.id })
    clearUndo()
  }, UNDO_TIMEOUT_MS)
}

/**
 * Generate a unique ID for undo entries
 */
function generateUndoId(): string {
  return `undo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// =============================================================================
// Public Functions
// =============================================================================

/**
 * Record a change that can be undone (T004)
 *
 * Stores a single UndoEntry with 30-second timer.
 * New changes replace previous undo entry (single-level undo).
 *
 * @param entry - The undo entry data (without id and timestamp)
 */
function recordChange(entry: Omit<UndoEntry, 'id' | 'timestamp'>): void {
  // Clear any existing undo entry
  clearUndoTimer()

  // Create new undo entry
  const newEntry: UndoEntry = {
    id: generateUndoId(),
    timestamp: Date.now(),
    ...entry,
  }

  undoEntry.value = newEntry

  logAction('Undo recorded', {
    id: newEntry.id,
    type: newEntry.type,
    changeCount: newEntry.changes.length,
    description: newEntry.description,
  })

  // Start 30-second timer
  startUndoTimer()
}

/**
 * Execute undo operation (T005)
 *
 * Restores previous values via Supabase for all changes in the entry.
 *
 * @returns UndoResult indicating success or failure
 */
async function executeUndo(): Promise<UndoResult> {
  if (!undoEntry.value) {
    logInfo('No undo entry available')
    return { success: false, error: 'Nothing to undo' }
  }

  if (isUndoing.value) {
    logInfo('Undo already in progress')
    return { success: false, error: 'Undo already in progress' }
  }

  // Check if undo has expired
  if (timeRemaining.value <= 0) {
    clearUndo()
    return { success: false, error: 'Undo has expired' }
  }

  const entry = undoEntry.value
  isUndoing.value = true

  logAction('Executing undo', {
    id: entry.id,
    type: entry.type,
    changeCount: entry.changes.length,
  })

  try {
    const restoredRecords: number[] = []
    const errors: string[] = []

    // Process each change in the entry
    for (const change of entry.changes) {
      try {
        const result = await restoreChange(change)
        if (result.success) {
          restoredRecords.push(change.recordId)
        } else {
          errors.push(`Record ${change.recordId}: ${result.error}`)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`Record ${change.recordId}: ${message}`)
      }
    }

    // Clear undo entry regardless of result
    clearUndo()

    if (errors.length > 0) {
      const errorMessage = errors.join('; ')
      logError('Undo partially failed', new Error(errorMessage), {
        entry: entry.id,
        restored: restoredRecords,
        errors,
      })
      return {
        success: false,
        error: errorMessage,
        restoredRecords,
      }
    }

    logAction('Undo successful', {
      id: entry.id,
      restoredRecords,
    })

    return {
      success: true,
      restoredRecords,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Undo failed'
    logError('Undo exception', err, { entry: entry.id })

    // Don't clear undo entry on exception - allow retry
    isUndoing.value = false

    return {
      success: false,
      error: message,
    }
  } finally {
    isUndoing.value = false
  }
}

/**
 * Restore a single change via Supabase
 *
 * Clears corrected_timestamp and corrected_by to indicate
 * the record is back to its original uncorrected state.
 *
 * @param change - The change to restore
 * @returns Result of the restore operation
 */
async function restoreChange(change: UndoChange): Promise<{ success: boolean; error?: string }> {
  // Build update payload - restore the field value AND clear ALL correction metadata
  // We must clear original_* fields so the database trigger won't treat this as a correction
  // The trigger only sets corrected_timestamp when original_category IS NULL
  const updatePayload: Record<string, unknown> = {
    [change.field]: change.previousValue,
    // Clear all correction metadata
    original_category: null,
    original_urgency: null,
    original_action: null,
    corrected_timestamp: null,
    corrected_by: null,
  }

  console.log('🔄 Undo restoreChange:', {
    recordId: change.recordId,
    field: change.field,
    previousValue: change.previousValue,
    updatePayload,
  })

  const { error, data } = await (supabase.from('classifications') as any)
    .update(updatePayload)
    .eq('id', change.recordId)
    .select(
      'id, category, urgency, action, original_category, original_urgency, original_action, corrected_timestamp, corrected_by'
    )

  console.log('🔄 Undo result:', { error, data })

  if (data && data[0]) {
    console.log('🔄 After undo:', {
      original_category: data[0].original_category,
      corrected_timestamp: data[0].corrected_timestamp,
      corrected_by: data[0].corrected_by,
    })
  }

  if (error) {
    console.log('🔄 Undo error:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Clear undo state (T006)
 *
 * Clears the current undo entry and stops the timer.
 * Called manually, on timeout expiration, or on route navigation.
 */
function clearUndo(): void {
  clearUndoTimer()
  undoEntry.value = null
  timeRemaining.value = 0

  logInfo('Undo cleared')
}

// =============================================================================
// Composable Export
// =============================================================================

/**
 * Composable for undo functionality
 *
 * Provides single-level undo with 30-second timeout window.
 * New changes replace previous undo entry.
 * Cleans up on route navigation.
 *
 * @example
 * ```vue
 * <script setup>
 * const { canUndo, executeUndo, recordChange } = useUndo()
 *
 * // After successful save
 * recordChange({
 *   type: 'single',
 *   changes: [{ recordId: 123, field: 'category', previousValue: 'WORK', newValue: 'FINANCIAL' }],
 *   description: 'Changed category to Financial'
 * })
 *
 * // On undo trigger
 * if (canUndo.value) {
 *   const result = await executeUndo()
 * }
 * </script>
 * ```
 */
export function useUndo() {
  // Cleanup on unmount (T008 - FR-012)
  onUnmounted(() => {
    if (undoEntry.value) {
      logInfo('Component unmounted, clearing undo', {
        entryId: undoEntry.value.id,
      })
      clearUndo()
    }
  })

  return {
    // State (readonly)
    undoEntry: readonly(undoEntry),
    isUndoing: readonly(isUndoing),
    timeRemaining: readonly(timeRemaining),

    // Computed
    canUndo,
    undoDescription,

    // Actions
    recordChange,
    executeUndo,
    clearUndo,
  }
}

export default useUndo
