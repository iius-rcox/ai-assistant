/**
 * Dirty Tracking Composable
 * Feature: 004-inline-edit
 * Task: T009
 * Requirements: FR-003, FR-015, FR-018
 *
 * Tracks which fields have changed between original and current values
 * Used to enable/disable save button and track unsaved changes
 *
 * Reference: research.md Section 1 - State Management Patterns
 */

import { ref, computed, watch } from 'vue'
import type { Ref, ComputedRef } from 'vue'

/**
 * Composable for tracking dirty (changed) state between original and current values
 *
 * @template T - The type of the object being tracked (must be Record<string, unknown>)
 * @param original - Reactive reference to the original values
 * @param current - Reactive reference to the current (potentially modified) values
 * @returns Object containing isDirty computed, dirtyFields computed, and reset function
 *
 * @example
 * ```ts
 * const original = ref({ category: 'WORK', urgency: 'HIGH' })
 * const current = ref({ category: 'PERSONAL', urgency: 'HIGH' })
 *
 * const { isDirty, dirtyFields, reset } = useDirtyTracking(original, current)
 *
 * console.log(isDirty.value) // true
 * console.log(dirtyFields.value) // ['category']
 *
 * reset() // Reverts current to match original
 * console.log(isDirty.value) // false
 * ```
 */
export function useDirtyTracking<T extends Record<string, unknown>>(
  original: Ref<T | null>,
  current: Ref<T | null>
): {
  isDirty: ComputedRef<boolean>
  dirtyFields: ComputedRef<string[]>
  reset: () => void
} {
  /**
   * Computed property that determines if any field has changed
   * Returns false if either original or current is null
   * Uses JSON.stringify for deep comparison
   */
  const isDirty = computed<boolean>(() => {
    if (!original.value || !current.value) {
      return false
    }
    return JSON.stringify(original.value) !== JSON.stringify(current.value)
  })

  /**
   * Computed property that returns an array of field names that have changed
   * Compares each key in current against the corresponding key in original
   * Returns empty array if either original or current is null
   */
  const dirtyFields = computed<string[]>(() => {
    if (!original.value || !current.value) {
      return []
    }

    const changed: string[] = []

    for (const key of Object.keys(current.value)) {
      const originalValue = original.value[key as keyof T]
      const currentValue = current.value[key as keyof T]

      // Use JSON.stringify for deep comparison of values
      if (JSON.stringify(originalValue) !== JSON.stringify(currentValue)) {
        changed.push(key)
      }
    }

    return changed
  })

  /**
   * Resets current values to match original values
   * Uses Object.assign to maintain reactivity
   * No-op if either original or current is null
   */
  function reset(): void {
    if (original.value && current.value) {
      // Create a shallow copy to avoid reference issues
      Object.assign(current.value, JSON.parse(JSON.stringify(original.value)))
    }
  }

  return {
    isDirty,
    dirtyFields,
    reset,
  }
}

/**
 * Extended dirty tracking with field-level change detection
 * Useful for showing which specific values changed in conflict resolution
 *
 * @template T - The type of the object being tracked
 * @param original - Reactive reference to the original values
 * @param current - Reactive reference to the current values
 * @returns Extended tracking with field change details
 */
export function useDirtyTrackingExtended<T extends Record<string, unknown>>(
  original: Ref<T | null>,
  current: Ref<T | null>
): {
  isDirty: ComputedRef<boolean>
  dirtyFields: ComputedRef<string[]>
  fieldChanges: ComputedRef<Array<{ field: string; from: unknown; to: unknown }>>
  reset: () => void
  resetField: (field: keyof T) => void
} {
  const { isDirty, dirtyFields, reset } = useDirtyTracking(original, current)

  /**
   * Computed property that returns detailed change information for each dirty field
   */
  const fieldChanges = computed<Array<{ field: string; from: unknown; to: unknown }>>(() => {
    if (!original.value || !current.value) {
      return []
    }

    return dirtyFields.value.map(field => ({
      field,
      from: original.value![field as keyof T],
      to: current.value![field as keyof T],
    }))
  })

  /**
   * Resets a single field to its original value
   * @param field - The field name to reset
   */
  function resetField(field: keyof T): void {
    if (original.value && current.value && field in original.value) {
      const originalValue = original.value[field]
      // Deep copy the value to avoid reference issues
      ;(current.value as Record<string, unknown>)[field as string] =
        typeof originalValue === 'object' && originalValue !== null
          ? JSON.parse(JSON.stringify(originalValue))
          : originalValue
    }
  }

  return {
    isDirty,
    dirtyFields,
    fieldChanges,
    reset,
    resetField,
  }
}

export default useDirtyTracking
