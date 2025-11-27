/**
 * Keyboard Shortcuts Composable
 * Feature: 005-table-enhancements, 007-instant-edit-undo
 * Tasks: T041, T044, T046 (005), T038-T042 (007)
 * Requirements: FR-019, FR-020, FR-021, FR-022, FR-023 (005), FR-007, FR-008 (007)
 *
 * Provides global keyboard shortcuts for the application:
 * - "/" to focus search input
 * - "?" to show shortcuts help modal
 * - "Escape" to close modals/cancel operations
 * - "Ctrl/Cmd+Z" to undo last change (007-instant-edit-undo)
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { logAction } from '@/utils/logger'

export interface KeyboardShortcut {
  key: string
  description: string
  category: 'navigation' | 'actions' | 'general'
  modifier?: 'ctrl' | 'shift' | 'alt' | 'meta'
}

export interface UseKeyboardShortcutsOptions {
  /** Callback when "/" is pressed */
  onFocusSearch?: () => void
  /** Callback when "?" is pressed */
  onShowHelp?: () => void
  /** Callback when "e" is pressed (expand/collapse current row) */
  onToggleExpand?: () => void
  /** Callback when "s" is pressed (save current edit) */
  onSave?: () => void
  /** Callback when Escape is pressed */
  onEscape?: () => void
  /** T038: Callback when Ctrl/Cmd+Z is pressed (undo last change) */
  onUndo?: () => void
  /** Whether shortcuts are enabled */
  enabled?: boolean
}

// All available keyboard shortcuts for help display
export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Navigation
  { key: '/', description: 'Focus search input', category: 'navigation' },
  { key: '↑↓', description: 'Navigate rows', category: 'navigation' },
  { key: '←→', description: 'Navigate columns', category: 'navigation' },
  { key: 'Home', description: 'Go to first cell in row', category: 'navigation' },
  { key: 'End', description: 'Go to last cell in row', category: 'navigation' },
  { key: 'Ctrl+Home', description: 'Go to first row', category: 'navigation', modifier: 'ctrl' },
  { key: 'Ctrl+End', description: 'Go to last row', category: 'navigation', modifier: 'ctrl' },
  { key: 'PageUp', description: 'Move up 5 rows', category: 'navigation' },
  { key: 'PageDown', description: 'Move down 5 rows', category: 'navigation' },

  // Actions
  { key: 'Enter', description: 'Edit selected row', category: 'actions' },
  { key: 'Space', description: 'Toggle row selection', category: 'actions' },
  { key: 'e', description: 'Expand/collapse row details', category: 'actions' },
  { key: 's', description: 'Save current edit', category: 'actions', modifier: 'ctrl' },
  { key: 'z', description: 'Undo last change', category: 'actions', modifier: 'ctrl' },

  // General
  { key: '?', description: 'Show keyboard shortcuts', category: 'general' },
  { key: 'Escape', description: 'Cancel / Close modal', category: 'general' },
]

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const {
    onFocusSearch,
    onShowHelp,
    onToggleExpand,
    onSave,
    onEscape,
    onUndo, // T038: Undo callback
    enabled = true,
  } = options

  const isHelpModalOpen = ref(false)
  const isEnabled = ref(enabled)

  /**
   * Check if event target is an input element (should not intercept)
   */
  function isInputElement(target: EventTarget | null): boolean {
    if (!target) return false
    const element = target as HTMLElement
    const tagName = element.tagName?.toLowerCase()
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      element.isContentEditable
    )
  }

  /**
   * Handle global keydown events
   */
  function handleGlobalKeydown(event: KeyboardEvent) {
    if (!isEnabled.value) return

    const target = event.target

    // "/" - Focus search (except when typing in input)
    if (event.key === '/' && !isInputElement(target)) {
      event.preventDefault()
      logAction('Keyboard shortcut: Focus search')
      onFocusSearch?.()
      return
    }

    // "?" - Show help (Shift + /)
    if (event.key === '?' || (event.shiftKey && event.key === '/')) {
      if (!isInputElement(target)) {
        event.preventDefault()
        logAction('Keyboard shortcut: Show help')
        isHelpModalOpen.value = true
        onShowHelp?.()
        return
      }
    }

    // "e" - Expand/collapse (except when typing in input)
    if (event.key === 'e' && !isInputElement(target) && !event.ctrlKey && !event.metaKey) {
      event.preventDefault()
      logAction('Keyboard shortcut: Toggle expand')
      onToggleExpand?.()
      return
    }

    // Ctrl/Cmd + S - Save
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault()
      logAction('Keyboard shortcut: Save')
      onSave?.()
      return
    }

    // T038: Ctrl/Cmd + Z - Undo last change
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      event.preventDefault()
      logAction('Keyboard shortcut: Undo')
      onUndo?.()
      return
    }

    // Escape - Close modal or cancel
    if (event.key === 'Escape') {
      if (isHelpModalOpen.value) {
        event.preventDefault()
        isHelpModalOpen.value = false
        return
      }
      onEscape?.()
      return
    }
  }

  /**
   * Open the help modal
   */
  function openHelpModal() {
    isHelpModalOpen.value = true
    logAction('Help modal opened')
  }

  /**
   * Close the help modal
   */
  function closeHelpModal() {
    isHelpModalOpen.value = false
    logAction('Help modal closed')
  }

  /**
   * Enable keyboard shortcuts
   */
  function enable() {
    isEnabled.value = true
  }

  /**
   * Disable keyboard shortcuts
   */
  function disable() {
    isEnabled.value = false
  }

  // Setup global event listeners
  onMounted(() => {
    document.addEventListener('keydown', handleGlobalKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleGlobalKeydown)
  })

  return {
    // State
    isHelpModalOpen,
    isEnabled,

    // Constants
    shortcuts: KEYBOARD_SHORTCUTS,

    // Methods
    openHelpModal,
    closeHelpModal,
    enable,
    disable,
  }
}

export type UseKeyboardShortcutsReturn = ReturnType<typeof useKeyboardShortcuts>
