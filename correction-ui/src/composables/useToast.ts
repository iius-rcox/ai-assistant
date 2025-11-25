/**
 * Toast Notification Composable
 * Feature: 003-correction-ui
 * Task: T088
 * Requirement: SC-005 - Better UX for success/error messages
 *
 * Provides type-safe access to toast notifications
 */

import { ref, readonly } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastOptions {
  duration?: number
}

interface ToastInstance {
  show: (message: string, type?: ToastType, duration?: number) => number
  success: (message: string, options?: ToastOptions) => number
  error: (message: string, options?: ToastOptions) => number
  warning: (message: string, options?: ToastOptions) => number
  info: (message: string, options?: ToastOptions) => number
  remove: (id: number) => void
}

// Internal toast state
const toasts = ref<Array<{
  id: number
  message: string
  type: ToastType
  duration: number
}>>([])

let nextId = 0

function show(message: string, type: ToastType = 'info', duration: number = 3000): number {
  const id = nextId++
  toasts.value.push({ id, message, type, duration })

  if (duration > 0) {
    setTimeout(() => {
      remove(id)
    }, duration)
  }

  return id
}

function remove(id: number): void {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

function success(message: string, options?: ToastOptions): number {
  return show(message, 'success', options?.duration ?? 3000)
}

function error(message: string, options?: ToastOptions): number {
  return show(message, 'error', options?.duration ?? 5000) // Errors stay longer
}

function warning(message: string, options?: ToastOptions): number {
  return show(message, 'warning', options?.duration ?? 4000)
}

function info(message: string, options?: ToastOptions): number {
  return show(message, 'info', options?.duration ?? 3000)
}

export function useToast(): ToastInstance & { toasts: typeof toasts } {
  return {
    toasts: readonly(toasts) as typeof toasts,
    show,
    success,
    error,
    warning,
    info,
    remove
  }
}

// Export for direct use in components
export const toast = {
  show,
  success,
  error,
  warning,
  info,
  remove
}
