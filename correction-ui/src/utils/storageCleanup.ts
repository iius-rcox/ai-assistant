/**
 * localStorage Cleanup Utility
 * Feature: 004-inline-edit
 * Task: T011
 * Requirements: FR-027, FR-028
 *
 * Removes stale drafts, old version keys, and corrupted data
 * from localStorage to maintain storage health
 *
 * Reference: research.md Section 3 - Offline/Network Resilience
 */

import { STORAGE_PREFIX, STORAGE_VERSION, STORAGE_TTL } from '@/constants/storage'
import type { CleanupResult, DraftData } from '@/types/storage'

/**
 * Maximum age for stale data cleanup (7 days)
 */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Cleans up stale localStorage entries for the correction-ui application
 *
 * Cleanup rules:
 * 1. Remove entries from old storage versions (not matching current STORAGE_VERSION)
 * 2. Remove draft entries older than 7 days
 * 3. Remove corrupted/unparseable data
 *
 * @returns CleanupResult with statistics about what was removed
 *
 * @example
 * ```ts
 * // Run on app startup
 * const result = cleanupStaleStorage()
 * console.log(`Cleaned up ${result.keysRemoved} stale entries`)
 * ```
 */
export function cleanupStaleStorage(): CleanupResult {
  const keysToRemove: string[] = []
  let bytesFreed = 0

  // Iterate through all localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)

    // Skip if key is null or doesn't belong to our app
    if (!key || !key.startsWith(STORAGE_PREFIX)) {
      continue
    }

    const value = localStorage.getItem(key)
    const valueSize = value ? new Blob([value]).size : 0

    // Rule 1: Remove old versions (not matching current STORAGE_VERSION)
    if (!key.includes(STORAGE_VERSION)) {
      keysToRemove.push(key)
      bytesFreed += valueSize
      continue
    }

    // Rule 2: Check TTL for draft entries
    if (key.includes(':draft:')) {
      if (shouldRemoveDraft(key, value)) {
        keysToRemove.push(key)
        bytesFreed += valueSize
        continue
      }
    }

    // Rule 3: Check TTL for pending submissions
    if (key.includes(':pending')) {
      if (shouldRemovePending(key, value)) {
        keysToRemove.push(key)
        bytesFreed += valueSize
        continue
      }
    }

    // Rule 4: Check TTL for session state
    if (key.includes(':session')) {
      if (shouldRemoveSession(key, value)) {
        keysToRemove.push(key)
        bytesFreed += valueSize
        continue
      }
    }
  }

  // Remove all identified stale keys
  for (const key of keysToRemove) {
    localStorage.removeItem(key)
  }

  return {
    keysRemoved: keysToRemove.length,
    removedKeys: keysToRemove,
    bytesFreed,
  }
}

/**
 * Determines if a draft entry should be removed
 *
 * @param key - The localStorage key
 * @param value - The stored value (JSON string)
 * @returns true if the draft should be removed
 */
function shouldRemoveDraft(key: string, value: string | null): boolean {
  if (!value) {
    return true // Remove empty entries
  }

  try {
    const data = JSON.parse(value) as DraftData
    const age = Date.now() - (data.savedAt || 0)

    // Remove if older than MAX_AGE_MS (7 days)
    if (age > MAX_AGE_MS) {
      return true
    }

    // Remove if missing required fields (corrupted)
    if (!data.data || typeof data.savedAt !== 'number') {
      return true
    }

    return false
  } catch {
    // Remove corrupted/unparseable data
    return true
  }
}

/**
 * Determines if a pending submissions entry should be removed
 *
 * @param key - The localStorage key
 * @param value - The stored value (JSON string)
 * @returns true if the pending queue should be removed
 */
function shouldRemovePending(key: string, value: string | null): boolean {
  if (!value) {
    return true // Remove empty entries
  }

  try {
    const data = JSON.parse(value)

    // If it's an array (legacy format) or has submissions array
    const submissions = Array.isArray(data) ? data : data.submissions

    if (!Array.isArray(submissions)) {
      return true // Corrupted structure
    }

    // Remove if all submissions are too old
    const allStale = submissions.every((sub: { queuedAt?: number }) => {
      const age = Date.now() - (sub.queuedAt || 0)
      return age > STORAGE_TTL.PENDING_QUEUE
    })

    return allStale && submissions.length > 0
  } catch {
    // Remove corrupted/unparseable data
    return true
  }
}

/**
 * Determines if a session state entry should be removed
 *
 * @param key - The localStorage key
 * @param value - The stored value (JSON string)
 * @returns true if the session state should be removed
 */
function shouldRemoveSession(key: string, value: string | null): boolean {
  if (!value) {
    return true // Remove empty entries
  }

  try {
    const data = JSON.parse(value)
    const age = Date.now() - (data.savedAt || 0)

    // Remove if older than session TTL (1 hour)
    if (age > STORAGE_TTL.SESSION_STATE) {
      return true
    }

    return false
  } catch {
    // Remove corrupted/unparseable data
    return true
  }
}

/**
 * Gets statistics about current localStorage usage for the app
 *
 * @returns Object with usage statistics
 */
export function getStorageStats(): {
  totalKeys: number
  appKeys: number
  totalBytes: number
  appBytes: number
  draftCount: number
  pendingCount: number
} {
  let totalKeys = 0
  let appKeys = 0
  let totalBytes = 0
  let appBytes = 0
  let draftCount = 0
  let pendingCount = 0

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue

    totalKeys++
    const value = localStorage.getItem(key) || ''
    const valueSize = new Blob([value]).size
    totalBytes += valueSize

    if (key.startsWith(STORAGE_PREFIX)) {
      appKeys++
      appBytes += valueSize

      if (key.includes(':draft:')) {
        draftCount++
      }

      if (key.includes(':pending')) {
        try {
          const data = JSON.parse(value)
          const submissions = Array.isArray(data) ? data : data.submissions || []
          pendingCount += submissions.length
        } catch {
          // Ignore parse errors for stats
        }
      }
    }
  }

  return {
    totalKeys,
    appKeys,
    totalBytes,
    appBytes,
    draftCount,
    pendingCount,
  }
}

/**
 * Clears ALL localStorage entries for the correction-ui app
 * Use with caution - this removes all drafts, pending submissions, and preferences
 *
 * @returns Number of keys removed
 */
export function clearAllAppStorage(): number {
  const keysToRemove: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key)
    }
  }

  for (const key of keysToRemove) {
    localStorage.removeItem(key)
  }

  return keysToRemove.length
}

/**
 * Removes a specific draft by row ID
 *
 * @param rowId - The row ID whose draft should be removed
 * @returns true if a draft was found and removed
 */
export function removeDraft(rowId: number | string): boolean {
  const key = `${STORAGE_PREFIX}:${STORAGE_VERSION}:draft:${rowId}`

  if (localStorage.getItem(key) !== null) {
    localStorage.removeItem(key)
    return true
  }

  return false
}

/**
 * Gets all current draft row IDs
 *
 * @returns Array of row IDs that have drafts
 */
export function getDraftRowIds(): Array<number | string> {
  const rowIds: Array<number | string> = []
  const draftPrefix = `${STORAGE_PREFIX}:${STORAGE_VERSION}:draft:`

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(draftPrefix)) {
      const rowId = key.slice(draftPrefix.length)
      // Try to parse as number, otherwise keep as string
      const numericId = parseInt(rowId, 10)
      rowIds.push(isNaN(numericId) ? rowId : numericId)
    }
  }

  return rowIds
}

export default cleanupStaleStorage
