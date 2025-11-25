/**
 * Unsaved Changes Guard Composable
 * Feature: 004-inline-edit
 * Task: T053
 * Requirements: FR-025, FR-026 (Prevent accidental data loss)
 *
 * Warns users before leaving page with unsaved changes
 */

import { ref, onMounted, onUnmounted, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { logAction, logWarn } from '@/utils/logger'

export interface UseUnsavedChangesGuardOptions {
  /** Function that returns true if there are unsaved changes */
  hasChanges: () => boolean
  /** Custom message for the confirmation dialog */
  message?: string
  /** Called when user confirms leaving */
  onConfirmLeave?: () => void
}

export function useUnsavedChangesGuard(options: UseUnsavedChangesGuardOptions) {
  const {
    hasChanges,
    message = 'You have unsaved changes. Are you sure you want to leave?',
    onConfirmLeave
  } = options

  const router = useRouter()
  const isGuardActive = ref(true)

  /**
   * Handle browser beforeunload event (T068)
   */
  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (isGuardActive.value && hasChanges()) {
      event.preventDefault()
      // Modern browsers require returnValue to be set
      event.returnValue = message
      logWarn('Blocked page unload due to unsaved changes')
      return message
    }
  }

  /**
   * Temporarily disable the guard (e.g., during save)
   */
  function disableGuard() {
    isGuardActive.value = false
  }

  /**
   * Re-enable the guard
   */
  function enableGuard() {
    isGuardActive.value = true
  }

  /**
   * Manually confirm navigation
   */
  function confirmNavigation(): boolean {
    if (!hasChanges()) return true

    const confirmed = confirm(message)
    if (confirmed) {
      onConfirmLeave?.()
      logAction('User confirmed leaving with unsaved changes')
    }
    return confirmed
  }

  // Set up beforeunload listener (T068)
  onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  // Vue Router navigation guard (T069)
  onBeforeRouteLeave((to, from, next) => {
    if (!isGuardActive.value || !hasChanges()) {
      next()
      return
    }

    const confirmed = confirm(message)
    if (confirmed) {
      onConfirmLeave?.()
      logAction('User confirmed route leave with unsaved changes', { to: to.path })
      next()
    } else {
      logAction('User cancelled route leave')
      next(false)
    }
  })

  return {
    isGuardActive,
    disableGuard,
    enableGuard,
    confirmNavigation
  }
}
