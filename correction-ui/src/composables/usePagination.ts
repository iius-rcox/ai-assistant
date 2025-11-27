/**
 * Pagination Composable
 * Feature: 010-shadcn-blue-theme
 * Task: T015
 *
 * Provides pagination logic with page range calculation and ellipsis support.
 * Follows shadcn pagination patterns adapted for Vue 3.
 */

import { computed, type Ref, toValue, type MaybeRefOrGetter } from 'vue'
import type {
  PaginationItem,
  UsePaginationOptions,
  UsePaginationReturn,
} from '@/types/pagination'

/**
 * Calculate the range of page numbers to display with ellipsis support.
 *
 * Algorithm:
 * 1. Always show first page, last page, current page
 * 2. Show siblings: currentPage ± siblingCount
 * 3. Show ellipsis when gap > 1 between ranges
 *
 * @example
 * // totalPages=10, currentPage=5, siblingCount=1
 * // Returns: [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]
 *
 * @example
 * // totalPages=10, currentPage=2, siblingCount=1
 * // Returns: [1, 2, 3, 'ellipsis', 10]
 */
function calculatePageRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
  showEdges: boolean
): (number | 'ellipsis')[] {
  // For very small page counts, show all pages
  const totalPageNumbers = siblingCount * 2 + 5 // siblings + first + last + current + 2 ellipsis
  if (totalPages <= totalPageNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

  // Determine if we should show ellipsis
  const showLeftEllipsis = leftSiblingIndex > 2
  const showRightEllipsis = rightSiblingIndex < totalPages - 1

  const result: (number | 'ellipsis')[] = []

  // Always show first page if showEdges is true
  if (showEdges) {
    result.push(1)
  }

  // Left ellipsis
  if (showLeftEllipsis) {
    result.push('ellipsis')
  } else if (showEdges) {
    // Show pages between first and left sibling
    for (let i = 2; i < leftSiblingIndex; i++) {
      result.push(i)
    }
  }

  // Sibling pages and current page
  for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
    if (!showEdges || i !== 1) {
      result.push(i)
    }
  }

  // Right ellipsis
  if (showRightEllipsis) {
    result.push('ellipsis')
  } else if (showEdges) {
    // Show pages between right sibling and last
    for (let i = rightSiblingIndex + 1; i < totalPages; i++) {
      result.push(i)
    }
  }

  // Always show last page if showEdges is true and it's not already included
  if (showEdges && rightSiblingIndex < totalPages) {
    result.push(totalPages)
  }

  return result
}

/**
 * Pagination composable for Vue 3.
 *
 * Provides computed pagination items with page numbers and ellipsis,
 * along with navigation methods.
 *
 * @param currentPage - Reactive ref for the current page (1-indexed)
 * @param totalPages - Total number of pages (ref or getter or static value)
 * @param options - Configuration options
 * @returns Pagination state and navigation methods
 *
 * @example
 * ```vue
 * <script setup>
 * import { ref } from 'vue'
 * import { usePagination } from '@/composables/usePagination'
 *
 * const currentPage = ref(1)
 * const { items, goToPage, goToPrevious, goToNext } = usePagination(
 *   currentPage,
 *   computed(() => store.totalPages)
 * )
 * </script>
 * ```
 */
export function usePagination(
  currentPage: Ref<number>,
  totalPages: MaybeRefOrGetter<number>,
  options: UsePaginationOptions = {}
): UsePaginationReturn {
  const { siblingCount = 1, showEdges = true, onChange } = options

  /**
   * Computed array of pagination items to render
   */
  const items = computed<PaginationItem[]>(() => {
    const total = toValue(totalPages)
    const current = currentPage.value
    const result: PaginationItem[] = []

    // Previous button
    result.push({
      type: 'previous',
      isDisabled: current <= 1,
    })

    // Page numbers with ellipsis
    const pageRange = calculatePageRange(current, total, siblingCount, showEdges)

    for (const item of pageRange) {
      if (item === 'ellipsis') {
        result.push({ type: 'ellipsis' })
      } else {
        result.push({
          type: 'page',
          page: item,
          isActive: item === current,
        })
      }
    }

    // Next button
    result.push({
      type: 'next',
      isDisabled: current >= total,
    })

    return result
  })

  /**
   * Whether there is a previous page
   */
  const hasPrevious = computed(() => currentPage.value > 1)

  /**
   * Whether there is a next page
   */
  const hasNext = computed(() => currentPage.value < toValue(totalPages))

  /**
   * Navigate to a specific page
   */
  function goToPage(page: number): void {
    const total = toValue(totalPages)
    if (page >= 1 && page <= total && page !== currentPage.value) {
      currentPage.value = page
      onChange?.(page)
    }
  }

  /**
   * Navigate to previous page
   */
  function goToPrevious(): void {
    if (hasPrevious.value) {
      goToPage(currentPage.value - 1)
    }
  }

  /**
   * Navigate to next page
   */
  function goToNext(): void {
    if (hasNext.value) {
      goToPage(currentPage.value + 1)
    }
  }

  /**
   * Navigate to first page
   */
  function goToFirst(): void {
    goToPage(1)
  }

  /**
   * Navigate to last page
   */
  function goToLast(): void {
    goToPage(toValue(totalPages))
  }

  /**
   * Current visible page range (for "Showing X-Y of Z" display)
   */
  const range = computed(() => {
    const total = toValue(totalPages)
    if (total === 0) {
      return { start: 0, end: 0 }
    }
    return { start: 1, end: total }
  })

  return {
    items,
    hasPrevious,
    hasNext,
    goToPage,
    goToPrevious,
    goToNext,
    goToFirst,
    goToLast,
    range,
  }
}
