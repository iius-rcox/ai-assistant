/**
 * localStorage Schema Type Definitions
 * Feature: 004-inline-edit
 * Task: T007
 * Requirements: FR-024, FR-025, FR-027, FR-028, FR-030, FR-035, FR-036
 *
 * Types for data stored in browser localStorage
 */

import type { InlineEditData } from './inline-edit'

/**
 * Draft edit data saved to localStorage during editing
 * Key pattern: correction-ui:v1:draft:{rowId}
 * TTL: 24 hours
 */
export interface DraftData<T = InlineEditData> {
  /** The draft edit data */
  data: T

  /** When this draft was saved (timestamp) */
  savedAt: number

  /** Version number when editing started (for conflict detection) */
  version: number

  /** Row ID being edited */
  rowId: number
}

/**
 * Pending submission for offline queue
 */
export interface PendingSubmission {
  /** Row ID to update */
  id: number

  /** Fields to update */
  updates: InlineEditData

  /** Expected version for optimistic locking */
  expectedVersion: number

  /** When this was queued (timestamp) */
  queuedAt: number

  /** Number of submission attempts */
  attempts: number

  /** Last error message (if any) */
  lastError?: string
}

/**
 * Pending submissions queue stored in localStorage
 * Key: correction-ui:v1:pending
 * TTL: 7 days
 */
export interface PendingQueue {
  /** Array of pending submissions */
  submissions: PendingSubmission[]

  /** Last time queue was processed */
  lastProcessedAt: number | null
}

/**
 * User preferences stored in localStorage
 * Key: correction-ui:v1:prefs
 * TTL: Never (persistent)
 */
export interface UserPreferences {
  /** Preferred page size for table */
  pageSize?: number

  /** Preferred theme (if implemented) */
  theme?: 'light' | 'dark' | 'auto'

  /** Whether to show keyboard hints */
  showKeyboardHints?: boolean

  /** Last used filters */
  lastFilters?: {
    category?: string[]
    urgency?: string[]
    confidence?: [number, number]
    dateRange?: {
      start: string
      end: string
    }
  }
}

/**
 * Session edit state for auth redirect recovery
 * Key: correction-ui:v1:session
 * TTL: 1 hour
 */
export interface SessionEditState {
  /** Row ID that was being edited */
  editingRowId: number

  /** Draft edit data */
  editData: InlineEditData

  /** Original version */
  originalVersion: number

  /** URL to return to after auth */
  returnUrl: string

  /** When this session state was saved */
  savedAt: number

  /** Current page number */
  currentPage?: number

  /** Current filters */
  currentFilters?: UserPreferences['lastFilters']
}

/**
 * Result of localStorage cleanup operation
 */
export interface CleanupResult {
  /** Number of keys removed */
  keysRemoved: number

  /** Keys that were removed */
  removedKeys: string[]

  /** Bytes freed (approximate) */
  bytesFreed: number
}

/**
 * Submission result after processing pending queue
 */
export interface SubmissionResult {
  /** Submission ID */
  id: number

  /** Whether submission succeeded */
  success: boolean

  /** Error message if failed */
  error?: string

  /** Whether this was a conflict */
  conflict?: boolean
}

/**
 * Offline state tracking
 */
export interface OfflineState {
  /** Whether currently online */
  isOnline: boolean

  /** When last went offline (timestamp, null if currently online) */
  lastOfflineAt: number | null

  /** When last came online (timestamp) */
  lastOnlineAt: number | null

  /** Number of pending submissions */
  pendingCount: number
}
