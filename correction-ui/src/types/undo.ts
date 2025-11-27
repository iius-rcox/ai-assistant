/**
 * Undo Type Definitions
 * Feature: 007-instant-edit-undo
 * Task: T001, T002
 * Requirements: FR-002 through FR-006, FR-012
 *
 * Types for undo functionality in inline editing
 */

import type { ToastType } from '@/composables/useToast'

/**
 * Represents a single field change that can be undone
 */
export interface UndoChange {
  /** Classification record ID */
  recordId: number
  /** Field that was changed (category, urgency, action) */
  field: 'category' | 'urgency' | 'action'
  /** Value before the change */
  previousValue: string
  /** Value after the change */
  newValue: string
}

/**
 * Represents an undoable action (single or bulk)
 */
export interface UndoEntry {
  /** Unique identifier for this undo entry */
  id: string
  /** Type of operation */
  type: 'single' | 'bulk'
  /** When the change was made (timestamp in ms) */
  timestamp: number
  /** Array of changes (single item for 'single' type, multiple for 'bulk') */
  changes: UndoChange[]
  /** Human-readable description for toast message */
  description: string
}

/**
 * State managed by useUndo composable
 */
export interface UndoState {
  /** Current undo entry (null if nothing to undo) */
  entry: UndoEntry | null
  /** Whether undo operation is in progress */
  isUndoing: boolean
  /** Error message if undo failed */
  error: string | null
}

/**
 * Result of executing an undo operation
 */
export interface UndoResult {
  success: boolean
  error?: string
  /** Records that were restored */
  restoredRecords?: number[]
}

// =============================================================================
// Extended Toast Types (T002)
// =============================================================================

/**
 * Action button configuration for toast
 */
export interface ToastAction {
  /** Button label (e.g., "Undo") */
  label: string
  /** Callback when button is clicked */
  onClick: () => void | Promise<void>
  /** Whether button is currently disabled */
  disabled?: boolean
}

/**
 * Extended toast with optional action
 */
export interface ToastWithAction {
  id: number
  message: string
  type: ToastType
  duration: number
  /** Optional action button */
  action?: ToastAction
}

/**
 * Extended toast options with action support
 */
export interface ExtendedToastOptions {
  duration?: number
  action?: ToastAction
}
