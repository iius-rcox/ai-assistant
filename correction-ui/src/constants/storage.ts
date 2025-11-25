/**
 * localStorage Key Constants
 * Feature: 004-inline-edit
 * Task: T005
 * Requirements: FR-024, FR-027, FR-028, FR-035, FR-036
 *
 * Defines namespaced key patterns for localStorage operations
 */

export const STORAGE_PREFIX = 'correction-ui'
export const STORAGE_VERSION = 'v1'

/**
 * localStorage key naming convention:
 * Pattern: {prefix}:{version}:{type}:{identifier}
 *
 * Examples:
 * - correction-ui:v1:draft:123
 * - correction-ui:v1:pending
 * - correction-ui:v1:prefs
 * - correction-ui:v1:session
 */
export const storageKeys = {
  /**
   * Draft edit data for a specific row
   * TTL: 24 hours
   */
  draftEdit: (rowId: number | string) => `${STORAGE_PREFIX}:${STORAGE_VERSION}:draft:${rowId}`,

  /**
   * Pending submissions queue for offline edits
   * TTL: 7 days
   */
  pendingSubmissions: () => `${STORAGE_PREFIX}:${STORAGE_VERSION}:pending`,

  /**
   * User preferences (filters, page size, etc.)
   * TTL: Never (persistent)
   */
  userPreferences: () => `${STORAGE_PREFIX}:${STORAGE_VERSION}:prefs`,

  /**
   * Session edit state for auth redirect recovery
   * TTL: 1 hour
   */
  sessionEditState: () => `${STORAGE_PREFIX}:${STORAGE_VERSION}:session`
} as const

/**
 * Time-to-live constants (milliseconds)
 */
export const STORAGE_TTL = {
  DRAFT_EDIT: 24 * 60 * 60 * 1000, // 24 hours
  PENDING_QUEUE: 7 * 24 * 60 * 60 * 1000, // 7 days
  SESSION_STATE: 60 * 60 * 1000, // 1 hour
  USER_PREFS: Infinity // Never expires
} as const

/**
 * Storage limits
 */
export const STORAGE_LIMITS = {
  MAX_PENDING_QUEUE_SIZE: 50, // Maximum number of pending submissions
  MAX_DRAFT_AGE_MS: STORAGE_TTL.DRAFT_EDIT,
  MAX_SESSION_AGE_MS: STORAGE_TTL.SESSION_STATE
} as const

/**
 * Simplified storage keys for composables using VueUse useStorage
 * These are static keys (no dynamic row IDs) for global state
 */
export const STORAGE_KEYS = {
  INLINE_EDIT_DRAFT: `${STORAGE_PREFIX}:${STORAGE_VERSION}:draft:current`,
  PENDING_QUEUE: `${STORAGE_PREFIX}:${STORAGE_VERSION}:pending:queue`,
  SESSION_STATE: `${STORAGE_PREFIX}:${STORAGE_VERSION}:session:state`
} as const

/**
 * Table enhancement storage keys
 * Feature: 005-table-enhancements
 */
export const TABLE_STORAGE_KEYS = {
  /** Sort state (column + direction) */
  SORT: `${STORAGE_PREFIX}:${STORAGE_VERSION}:table:sort`,
  /** Column widths */
  COLUMN_WIDTHS: `${STORAGE_PREFIX}:${STORAGE_VERSION}:table:columns`,
  /** Pagination style preference (infinite/pages) */
  PAGINATION_STYLE: `${STORAGE_PREFIX}:${STORAGE_VERSION}:table:pagination`,
  /** Page size preference */
  PAGE_SIZE: `${STORAGE_PREFIX}:${STORAGE_VERSION}:table:pageSize`,
  /** Theme preference (light/dark/system) */
  THEME: `${STORAGE_PREFIX}:${STORAGE_VERSION}:theme`,
  /** Search query cache */
  SEARCH_CACHE: `${STORAGE_PREFIX}:${STORAGE_VERSION}:search:cache`
} as const

/**
 * Expiry time for auto-saved drafts (24 hours)
 */
export const STORAGE_EXPIRY_MS = STORAGE_TTL.DRAFT_EDIT
