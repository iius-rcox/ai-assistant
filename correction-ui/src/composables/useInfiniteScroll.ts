/**
 * Infinite Scroll Composable
 * Feature: 005-table-enhancements
 * Tasks: T053, T054, T055
 * Requirements: FR-028, FR-029, FR-030, FR-031
 *
 * Provides infinite scroll functionality with:
 * - Scroll position detection and preload trigger
 * - Pagination style preference (infinite vs traditional)
 * - localStorage persistence of preference
 * - Back to top functionality
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { logAction } from '@/utils/logger'

export type PaginationStyle = 'infinite' | 'traditional'

const STORAGE_KEY = 'table-pagination-style'
const DEFAULT_PRELOAD_THRESHOLD = 200 // pixels from bottom

export interface UseInfiniteScrollOptions {
  /** Container element ref */
  containerRef?: HTMLElement | null
  /** Callback to load more items */
  onLoadMore: () => Promise<void>
  /** Check if more items are available */
  hasMore: () => boolean
  /** Pixels from bottom to trigger preload */
  preloadThreshold?: number
  /** Default pagination style */
  defaultStyle?: PaginationStyle
  /** Callback when style changes */
  onStyleChange?: (style: PaginationStyle) => void
}

export function useInfiniteScroll(options: UseInfiniteScrollOptions) {
  const {
    onLoadMore,
    hasMore,
    preloadThreshold = DEFAULT_PRELOAD_THRESHOLD,
    defaultStyle = 'traditional',
    onStyleChange
  } = options

  // State
  const isLoading = ref(false)
  const paginationStyle = ref<PaginationStyle>(defaultStyle)
  const scrollPosition = ref(0)
  const containerElement = ref<HTMLElement | null>(null)

  // Load saved preference from localStorage
  function loadSavedPreference() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'infinite' || saved === 'traditional') {
        paginationStyle.value = saved
        logAction('Pagination style loaded', { style: saved })
      }
    } catch (e) {
      // localStorage not available
    }
  }

  // Save preference to localStorage
  function savePreference(style: PaginationStyle) {
    try {
      localStorage.setItem(STORAGE_KEY, style)
    } catch (e) {
      // localStorage not available
    }
  }

  // Computed
  const isInfiniteScroll = computed(() => paginationStyle.value === 'infinite')
  const isTraditionalPagination = computed(() => paginationStyle.value === 'traditional')
  const showBackToTop = computed(() => scrollPosition.value > 400)

  /**
   * Toggle between infinite scroll and traditional pagination
   */
  function toggleStyle() {
    const newStyle: PaginationStyle = paginationStyle.value === 'infinite' ? 'traditional' : 'infinite'
    setPaginationStyle(newStyle)
  }

  /**
   * Set pagination style
   */
  function setPaginationStyle(style: PaginationStyle) {
    paginationStyle.value = style
    savePreference(style)
    logAction('Pagination style changed', { style })
    onStyleChange?.(style)
  }

  /**
   * Handle scroll event for infinite scroll mode
   */
  async function handleScroll(event: Event) {
    const target = event.target as HTMLElement
    if (!target) return

    scrollPosition.value = target.scrollTop

    // Only trigger in infinite scroll mode
    if (!isInfiniteScroll.value) return
    if (isLoading.value) return
    if (!hasMore()) return

    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight

    // Trigger load more when near bottom
    if (scrollBottom < preloadThreshold) {
      await loadMore()
    }
  }

  /**
   * Load more items
   */
  async function loadMore() {
    if (isLoading.value || !hasMore()) return

    isLoading.value = true
    logAction('Loading more items')

    try {
      await onLoadMore()
    } catch (error) {
      console.error('Failed to load more items:', error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Scroll to top of container
   */
  function scrollToTop() {
    if (containerElement.value) {
      containerElement.value.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
      logAction('Scrolled to top')
    } else {
      // Fallback to window scroll
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }

  /**
   * Set the container element for scroll detection
   */
  function setContainer(element: HTMLElement | null) {
    // Remove listener from old container
    if (containerElement.value) {
      containerElement.value.removeEventListener('scroll', handleScroll)
    }

    containerElement.value = element

    // Add listener to new container
    if (element) {
      element.addEventListener('scroll', handleScroll, { passive: true })
    }
  }

  /**
   * Reset scroll position (useful when filters change)
   */
  function resetScroll() {
    scrollPosition.value = 0
    if (containerElement.value) {
      containerElement.value.scrollTop = 0
    }
  }

  // Setup and cleanup
  onMounted(() => {
    loadSavedPreference()
  })

  onUnmounted(() => {
    if (containerElement.value) {
      containerElement.value.removeEventListener('scroll', handleScroll)
    }
  })

  return {
    // State
    isLoading,
    paginationStyle,
    scrollPosition,

    // Computed
    isInfiniteScroll,
    isTraditionalPagination,
    showBackToTop,

    // Methods
    toggleStyle,
    setPaginationStyle,
    loadMore,
    scrollToTop,
    setContainer,
    resetScroll,
    handleScroll
  }
}

export type UseInfiniteScrollReturn = ReturnType<typeof useInfiniteScroll>
