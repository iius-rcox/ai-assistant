/**
 * Toast Notification Composable
 * Features: 003-correction-ui, 007-instant-edit-undo
 * Tasks: T088 (003), T020-T021 (007)
 * Requirements: SC-005, FR-003 through FR-006
 *
 * Provides type-safe access to toast notifications
 *
 * 007-instant-edit-undo:
 * - T020: Extended to support action property
 * - T021: Added showWithUndo() method for undo toasts (30s duration)
 */

import { ref, readonly } from 'vue'
import type { ToastAction, ToastWithAction, ExtendedToastOptions } from '@/types/undo'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

/** Default toast duration in ms */
const DEFAULT_DURATION = 3000
/** Error toast duration in ms */
const ERROR_DURATION = 5000
/** Warning toast duration in ms */
const WARNING_DURATION = 4000
/** Undo toast duration in ms (30 seconds per FR-004) */
const UNDO_DURATION = 30000

// Internal toast state - now supports actions (T020)
const toasts = ref<ToastWithAction[]>([])

let nextId = 0

/**
 * Show a toast notification
 *
 * @param message - The message to display
 * @param type - Toast type (success, error, warning, info)
 * @param duration - Duration in ms (0 = no auto-dismiss)
 * @param action - Optional action button
 * @returns Toast ID for manual removal
 */
function show(
  message: string,
  type: ToastType = 'info',
  duration: number = DEFAULT_DURATION,
  action?: ToastAction
): number {
  const id = nextId++
  const toast: ToastWithAction = { id, message, type, duration, action }
  toasts.value.push(toast)

  if (duration > 0) {
    setTimeout(() => {
      remove(id)
    }, duration)
  }

  return id
}

/**
 * Remove a toast by ID
 */
function remove(id: number): void {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

/**
 * Show a success toast
 */
function success(message: string, options?: ExtendedToastOptions): number {
  return show(message, 'success', options?.duration ?? DEFAULT_DURATION, options?.action)
}

/**
 * Show an error toast
 */
function error(message: string, options?: ExtendedToastOptions): number {
  return show(message, 'error', options?.duration ?? ERROR_DURATION, options?.action)
}

/**
 * Show a warning toast
 */
function warning(message: string, options?: ExtendedToastOptions): number {
  return show(message, 'warning', options?.duration ?? WARNING_DURATION, options?.action)
}

/**
 * Show an info toast
 */
function info(message: string, options?: ExtendedToastOptions): number {
  return show(message, 'info', options?.duration ?? DEFAULT_DURATION, options?.action)
}

/**
 * Show a toast with an Undo action button (T021)
 * Feature: 007-instant-edit-undo
 *
 * Creates a success toast with a 30-second duration and an Undo button.
 * The onUndo callback is called when the user clicks the Undo button.
 *
 * @param message - The message to display
 * @param onUndo - Callback when Undo is clicked
 * @param options - Optional additional options
 * @returns Toast ID for manual removal
 *
 * @example
 * ```ts
 * showWithUndo('Category changed to Financial', async () => {
 *   await executeUndo()
 * })
 * ```
 */
function showWithUndo(
  message: string,
  onUndo: () => Promise<void>,
  options?: { duration?: number }
): number {
  const duration = options?.duration ?? UNDO_DURATION
  let isUndoing = false

  const action: ToastAction = {
    label: 'Undo',
    onClick: async () => {
      if (isUndoing) return
      isUndoing = true
      // Disable the button while undoing
      action.disabled = true
      // Trigger re-render by updating toasts
      toasts.value = [...toasts.value]

      try {
        await onUndo()
        // Remove the toast after successful undo
        remove(toastId)
      } catch (err) {
        // Re-enable if undo fails
        isUndoing = false
        action.disabled = false
        toasts.value = [...toasts.value]
        console.error('Undo failed:', err)
      }
    },
    disabled: false,
  }

  const toastId = show(message, 'success', duration, action)
  return toastId
}

/**
 * Composable for toast notifications
 *
 * @example
 * ```vue
 * <script setup>
 * const { toasts, success, error, showWithUndo } = useToast()
 *
 * // Show a simple success toast
 * success('Item saved')
 *
 * // Show a toast with undo action
 * showWithUndo('Item deleted', async () => {
 *   await restoreItem()
 * })
 * </script>
 * ```
 */
export function useToast() {
  return {
    toasts: readonly(toasts) as typeof toasts,
    show,
    success,
    error,
    warning,
    info,
    remove,
    showWithUndo, // T021: New method for undo toasts
  }
}

// Export for direct use in components
export const toast = {
  show,
  success,
  error,
  warning,
  info,
  remove,
  showWithUndo, // T021: New method for undo toasts
}
