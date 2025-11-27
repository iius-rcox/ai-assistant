/**
 * Pagination Type Definitions
 * Feature: 010-shadcn-blue-theme
 *
 * TypeScript interfaces for the shadcn-style pagination component.
 */

import type { ComputedRef, Ref } from 'vue'

// ============================================
// PAGINATION ITEM TYPES
// ============================================

/**
 * Type of pagination item for rendering
 */
export type PaginationItemType = 'page' | 'ellipsis' | 'previous' | 'next'

/**
 * Individual pagination item for rendering
 */
export interface PaginationItem {
  /** Type of item to render */
  type: PaginationItemType

  /** Page number (only for 'page' type) */
  page?: number

  /** Whether this is the current active page (only for 'page' type) */
  isActive?: boolean

  /** Whether this item is disabled (for previous/next at bounds) */
  isDisabled?: boolean
}

// ============================================
// COMPONENT PROPS
// ============================================

/**
 * Props for the root Pagination component
 */
export interface PaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number

  /** Total number of pages */
  totalPages: number

  /** Number of sibling pages to show on each side of current page */
  siblingCount?: number // default: 1

  /** Show first and last page numbers */
  showEdges?: boolean // default: true

  /** Disabled state for entire pagination */
  disabled?: boolean // default: false

  /** Size variant */
  size?: 'sm' | 'default' | 'lg' // default: 'default'
}

/**
 * Props for PaginationLink component
 */
export interface PaginationLinkProps {
  /** Page number this link navigates to */
  page: number

  /** Whether this is the current/active page */
  isActive?: boolean

  /** Disabled state */
  disabled?: boolean

  /** Size variant (inherited from parent) */
  size?: 'sm' | 'default' | 'lg'
}

/**
 * Props for PaginationPrevious/Next components
 */
export interface PaginationNavigationProps {
  /** Disabled state */
  disabled?: boolean

  /** Size variant (inherited from parent) */
  size?: 'sm' | 'default' | 'lg'
}

/**
 * Props for PaginationEllipsis component
 */
export interface PaginationEllipsisProps {
  /** Size variant (inherited from parent) */
  size?: 'sm' | 'default' | 'lg'
}

// ============================================
// COMPONENT EVENTS
// ============================================

/**
 * Events emitted by Pagination component
 */
export interface PaginationEmits {
  /** Emitted when page changes - v-model compatible */
  (e: 'update:currentPage', page: number): void

  /** Emitted when page changes - event handler style */
  (e: 'change', page: number): void
}

/**
 * Events emitted by PaginationLink component
 */
export interface PaginationLinkEmits {
  /** Emitted when link is clicked */
  (e: 'click', page: number): void
}

/**
 * Events emitted by PaginationPrevious/Next components
 */
export interface PaginationNavigationEmits {
  /** Emitted when navigation button is clicked */
  (e: 'click'): void
}

// ============================================
// COMPOSABLE TYPES
// ============================================

/**
 * Options for usePagination composable
 */
export interface UsePaginationOptions {
  /** Number of sibling pages */
  siblingCount?: number

  /** Show edge pages (first/last) */
  showEdges?: boolean

  /** Callback when page changes */
  onChange?: (page: number) => void
}

/**
 * Return type for usePagination composable
 */
export interface UsePaginationReturn {
  /** Computed array of pagination items to render */
  items: ComputedRef<PaginationItem[]>

  /** Whether there is a previous page */
  hasPrevious: ComputedRef<boolean>

  /** Whether there is a next page */
  hasNext: ComputedRef<boolean>

  /** Navigate to a specific page */
  goToPage: (page: number) => void

  /** Navigate to previous page */
  goToPrevious: () => void

  /** Navigate to next page */
  goToNext: () => void

  /** Navigate to first page */
  goToFirst: () => void

  /** Navigate to last page */
  goToLast: () => void

  /** Current page range being displayed */
  range: ComputedRef<{ start: number; end: number }>
}

// ============================================
// PROVIDE/INJECT CONTEXT
// ============================================

/**
 * Context provided by root Pagination component
 */
export interface PaginationContext {
  /** Get current page */
  currentPage: () => number

  /** Get total pages */
  totalPages: () => number

  /** Get disabled state */
  disabled: () => boolean

  /** Get size variant */
  size: () => 'sm' | 'default' | 'lg'

  /** Handler for page changes */
  onPageChange: (page: number) => void
}

/**
 * Injection key for pagination context
 */
export const PAGINATION_INJECTION_KEY = Symbol('pagination') as InjectionKey<PaginationContext>

// Import InjectionKey for the symbol type
import type { InjectionKey } from 'vue'
