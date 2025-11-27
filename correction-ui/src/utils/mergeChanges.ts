/**
 * 3-Way Merge Utility for Conflict Resolution
 * Feature: 004-inline-edit
 * Task: T010
 * Requirements: FR-021, FR-022, FR-023
 *
 * Compares original, client changes, and server version to perform
 * automatic merging of non-conflicting changes and identify true conflicts
 *
 * Reference: research.md Section 2 - Optimistic Locking
 */

import type { InlineEditData, MergeResult, ConflictField } from '@/types/inline-edit'
import type { Classification } from '@/types/models'

/**
 * Performs a 3-way merge between original, client changes, and server version
 *
 * Algorithm:
 * 1. For each field the client changed:
 *    - If server hasn't changed the field -> use client value (auto-merge)
 *    - If server changed to same value as client -> use that value (convergent)
 *    - If server changed to different value -> conflict (manual resolution needed)
 *
 * @param original - The base version when client started editing
 * @param clientChanges - The fields the client wants to change
 * @param serverVersion - The current state on the server
 * @returns MergeResult with merged fields and any unresolvable conflicts
 *
 * @example
 * ```ts
 * const original = { category: 'WORK', urgency: 'LOW', action: 'FYI' }
 * const client = { category: 'PERSONAL', urgency: 'LOW', action: 'RESPOND' }
 * const server = { category: 'WORK', urgency: 'HIGH', action: 'FYI' }
 *
 * const result = mergeNonConflicting(original, client, server)
 * // result.merged = { category: 'PERSONAL', action: 'RESPOND' }
 * // result.conflicts = [] (urgency wasn't in client changes)
 * // result.success = true
 * ```
 */
export function mergeNonConflicting(
  original: InlineEditData,
  clientChanges: Partial<InlineEditData>,
  serverVersion: Classification | InlineEditData
): MergeResult {
  const merged: Partial<InlineEditData> = {}
  const conflicts: ConflictField[] = []

  // Iterate through all fields the client attempted to change
  for (const [key, clientValue] of Object.entries(clientChanges)) {
    const fieldKey = key as keyof InlineEditData

    // Get the original and server values for this field
    const originalValue = original[fieldKey]
    const serverValue = getFieldValue(serverVersion, fieldKey)

    // Skip if client didn't actually change the value from original
    if (JSON.stringify(originalValue) === JSON.stringify(clientValue)) {
      continue
    }

    // Case 1: Server hasn't changed this field -> use client value (auto-merge)
    if (JSON.stringify(originalValue) === JSON.stringify(serverValue)) {
      merged[fieldKey] = clientValue as string
      continue
    }

    // Case 2: Client and server made the same change -> use it (convergent)
    if (JSON.stringify(clientValue) === JSON.stringify(serverValue)) {
      merged[fieldKey] = clientValue as string
      continue
    }

    // Case 3: True conflict - both changed to different values
    conflicts.push({
      fieldName: fieldKey,
      baseValue: String(originalValue),
      clientValue: String(clientValue),
      serverValue: String(serverValue),
      canAutoMerge: false,
    })
  }

  return {
    merged,
    conflicts,
    success: conflicts.length === 0,
  }
}

/**
 * Helper to extract field value from either Classification or InlineEditData
 * Classification uses 'action' field name, same as InlineEditData
 */
function getFieldValue(
  data: Classification | InlineEditData,
  field: keyof InlineEditData
): string | undefined {
  // Both types use the same field names
  return (data as Record<string, unknown>)[field] as string | undefined
}

/**
 * Determines if a merge can be performed automatically without user intervention
 *
 * @param original - The base version when client started editing
 * @param clientChanges - The fields the client wants to change
 * @param serverVersion - The current state on the server
 * @returns true if all changes can be auto-merged, false if conflicts exist
 */
export function canAutoMerge(
  original: InlineEditData,
  clientChanges: Partial<InlineEditData>,
  serverVersion: Classification | InlineEditData
): boolean {
  const result = mergeNonConflicting(original, clientChanges, serverVersion)
  return result.success
}

/**
 * Gets a summary of what changed between original and server
 * Useful for displaying what the other user changed
 *
 * @param original - The base version when client started editing
 * @param serverVersion - The current state on the server
 * @returns Array of field changes made by server
 */
export function getServerChanges(
  original: InlineEditData,
  serverVersion: Classification | InlineEditData
): Array<{ field: keyof InlineEditData; from: string; to: string }> {
  const changes: Array<{ field: keyof InlineEditData; from: string; to: string }> = []
  const fields: Array<keyof InlineEditData> = ['category', 'urgency', 'action']

  for (const field of fields) {
    const originalValue = original[field]
    const serverValue = getFieldValue(serverVersion, field)

    if (originalValue !== serverValue && serverValue !== undefined) {
      changes.push({
        field,
        from: originalValue,
        to: serverValue,
      })
    }
  }

  return changes
}

/**
 * Applies resolution to create final update payload
 * Combines auto-merged fields with user-resolved conflicts
 *
 * @param mergeResult - Result from mergeNonConflicting
 * @param resolutions - User's choices for each conflict field
 * @returns Complete update payload ready to send to server
 */
export function applyResolutions(
  mergeResult: MergeResult,
  resolutions: Map<keyof InlineEditData, 'client' | 'server'>
): Partial<InlineEditData> {
  const result: Partial<InlineEditData> = { ...mergeResult.merged }

  for (const conflict of mergeResult.conflicts) {
    const resolution = resolutions.get(conflict.fieldName)

    if (resolution === 'client') {
      result[conflict.fieldName] = conflict.clientValue
    } else if (resolution === 'server') {
      // Server value doesn't need to be in our update since it's already there
      // But we include it for completeness in case of force update
      result[conflict.fieldName] = conflict.serverValue
    }
    // If no resolution provided, the field is not included (keeps server value)
  }

  return result
}

/**
 * Creates a human-readable description of a conflict
 * Useful for logging and user notifications
 *
 * @param conflict - The conflict field information
 * @returns Human-readable description string
 */
export function describeConflict(conflict: ConflictField): string {
  const fieldLabels: Record<keyof InlineEditData, string> = {
    category: 'Category',
    urgency: 'Urgency',
    action: 'Action Type',
  }

  const label = fieldLabels[conflict.fieldName] || conflict.fieldName

  return `${label}: You changed "${conflict.baseValue}" to "${conflict.clientValue}", but someone else changed it to "${conflict.serverValue}"`
}

/**
 * Validates that all conflicts have been resolved
 *
 * @param conflicts - Array of conflicts from merge result
 * @param resolutions - Map of user resolutions
 * @returns true if all conflicts are resolved, false otherwise
 */
export function allConflictsResolved(
  conflicts: ConflictField[],
  resolutions: Map<keyof InlineEditData, 'client' | 'server'>
): boolean {
  return conflicts.every(conflict => resolutions.has(conflict.fieldName))
}

export default mergeNonConflicting
