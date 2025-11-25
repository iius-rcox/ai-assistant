/**
 * Inline Edit Type Definitions
 * Feature: 004-inline-edit
 * Task: T006
 * Requirements: FR-001 through FR-036
 *
 * Types for inline table editing state management
 */

import type { Classification } from './models'

/**
 * Edit data for a single row
 * Contains only the editable fields
 */
export interface InlineEditData {
  category: string
  urgency: string
  action: string
}

/**
 * Save operation status
 */
export type SaveStatus = 'idle' | 'saving' | 'success' | 'error' | 'conflict' | 'offline'

/**
 * Display mode for responsive design
 */
export type DisplayMode = 'inline' | 'modal'

/**
 * Complete inline edit state for a single row
 */
export interface InlineEditState {
  /** ID of the row being edited (null if no row in edit mode) */
  editingRowId: number | null

  /** Original values when edit started (for revert on cancel) */
  originalData: InlineEditData | null

  /** Original version number (for optimistic locking) */
  originalVersion: number | null

  /** Current modified values */
  currentData: InlineEditData | null

  /** Whether the form has unsaved changes */
  isDirty: boolean

  /** List of fields that have been modified */
  dirtyFields: string[]

  /** Current save operation status */
  saveStatus: SaveStatus

  /** Error message if save failed */
  saveError: string | null

  /** Display mode (inline vs modal based on screen size) */
  displayMode: DisplayMode

  /** Whether beforeunload handler is attached */
  hasBeforeUnloadHandler: boolean
}

/**
 * Conflict data when optimistic locking detects version mismatch
 */
export interface ConflictData {
  /** The row ID with the conflict */
  rowId: number

  /** Client's attempted changes */
  clientVersion: InlineEditData

  /** Current server state */
  serverVersion: Classification

  /** Original state when client started editing */
  baseVersion: InlineEditData

  /** Version number client expected */
  expectedVersion: number

  /** Current version number on server */
  currentVersion: number
}

/**
 * User's choice for resolving a conflict
 */
export type ConflictResolution = 'keep-mine' | 'use-server' | 'merge' | 'cancel'

/**
 * Field-level conflict information
 */
export interface ConflictField {
  fieldName: keyof InlineEditData
  baseValue: string
  clientValue: string
  serverValue: string
  canAutoMerge: boolean
}

/**
 * Result of 3-way merge operation
 */
export interface MergeResult {
  /** Successfully merged fields */
  merged: Partial<InlineEditData>

  /** Fields with unresolvable conflicts */
  conflicts: ConflictField[]

  /** Whether merge was fully successful */
  success: boolean
}

/**
 * Validation error for inline edit
 */
export interface ValidationError {
  field: keyof InlineEditData
  message: string
}

/**
 * Result of save operation
 */
export interface SaveResult {
  success: boolean
  data?: Classification
  conflict?: ConflictData
  error?: string
}
