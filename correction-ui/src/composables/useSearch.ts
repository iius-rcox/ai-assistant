/**
 * useSearch Composable
 * Feature: 005-table-enhancements
 * Task: T012
 *
 * Provides reactive search functionality with:
 * - Debounced input handling
 * - Hybrid client/server search
 * - Result caching
 * - Loading states
 */

import { ref, computed, watch, onUnmounted } from 'vue'
import { useClassificationStore } from '@/stores/classificationStore'
import {
  hybridSearch,
  searchClientSide,
  clearSearchCache,
  highlightSearchTerms
} from '@/services/searchService'
import { logAction, logError } from '@/utils/logger'
import { SEARCH_CONFIG } from '@/constants/table'
import type { SearchState, SearchOptions } from '@/types/table-enhancements'

export interface UseSearchOptions extends SearchOptions {
  /** Callback when search completes */
  onSearchComplete?: (resultIds: number[]) => void
  /** Callback when search errors */
  onSearchError?: (error: Error) => void
}

export function useSearch(options: UseSearchOptions = {}) {
  const store = useClassificationStore()

  // State
  const query = ref('')
  const isLoading = ref(false)
  const resultIds = ref<number[] | null>(null)
  const error = ref<string | null>(null)
  const lastSearchTime = ref<number | null>(null)

  // Debounce timer
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // Computed
  const hasQuery = computed(() => query.value.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH)
  const resultCount = computed(() => resultIds.value?.length ?? null)
  const isQueryTooShort = computed(() =>
    query.value.length > 0 && query.value.length < SEARCH_CONFIG.MIN_QUERY_LENGTH
  )
  const isQueryTooLong = computed(() =>
    query.value.length > SEARCH_CONFIG.MAX_QUERY_LENGTH
  )

  // Search state object (for external consumers)
  const searchState = computed<SearchState>(() => ({
    query: query.value,
    isLoading: isLoading.value,
    resultCount: resultCount.value,
    lastSearchTime: lastSearchTime.value
  }))

  /**
   * Execute search with current query
   */
  async function executeSearch() {
    const searchQuery = query.value.trim()

    // Skip if query is too short or too long
    if (searchQuery.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      resultIds.value = null
      error.value = null
      store.searchResults = null
      store.searchQuery = ''
      return
    }

    if (searchQuery.length > SEARCH_CONFIG.MAX_QUERY_LENGTH) {
      error.value = `Search query must be less than ${SEARCH_CONFIG.MAX_QUERY_LENGTH} characters`
      return
    }

    isLoading.value = true
    error.value = null
    store.isSearching = true
    store.searchQuery = searchQuery

    const startTime = performance.now()

    try {
      logAction('Executing search', { query: searchQuery })

      const results = await hybridSearch(
        searchQuery,
        store.classifications,
        store.totalCount,
        {
          threshold: options.threshold ?? SEARCH_CONFIG.SERVER_SEARCH_THRESHOLD,
          useServerSearch: options.useServerSearch,
          debounceMs: options.debounceMs
        }
      )

      resultIds.value = results
      store.searchResults = results
      lastSearchTime.value = performance.now() - startTime

      logAction('Search completed', {
        query: searchQuery,
        resultCount: results.length,
        durationMs: lastSearchTime.value
      })

      options.onSearchComplete?.(results)
    } catch (e) {
      const err = e as Error
      error.value = err.message || 'Search failed'
      resultIds.value = null
      store.searchResults = null

      logError('Search failed', err, { query: searchQuery })
      options.onSearchError?.(err)
    } finally {
      isLoading.value = false
      store.isSearching = false
    }
  }

  /**
   * Debounced search - called on input change
   */
  function debouncedSearch() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    const debounceMs = options.debounceMs ?? SEARCH_CONFIG.DEBOUNCE_MS

    debounceTimer = setTimeout(() => {
      executeSearch()
    }, debounceMs)
  }

  /**
   * Set search query and trigger debounced search
   */
  function setQuery(newQuery: string) {
    query.value = newQuery
    debouncedSearch()
  }

  /**
   * Clear search query and results
   */
  function clearSearch() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }

    query.value = ''
    resultIds.value = null
    error.value = null
    lastSearchTime.value = null
    store.searchQuery = ''
    store.searchResults = null
    store.isSearching = false

    logAction('Search cleared')
  }

  /**
   * Highlight search terms in text
   * Returns HTML string with <mark> tags
   */
  function highlight(text: string): string {
    return highlightSearchTerms(text, query.value)
  }

  /**
   * Check if a classification ID matches the current search
   */
  function isMatch(id: number): boolean {
    if (!resultIds.value) return true // No search active, all match
    return resultIds.value.includes(id)
  }

  /**
   * Get filtered classifications based on search
   */
  const filteredClassifications = computed(() => {
    if (!resultIds.value) return store.classifications

    const resultSet = new Set(resultIds.value)
    return store.classifications.filter(c => resultSet.has(c.id))
  })

  /**
   * Quick client-side filter for immediate feedback
   * Use this for instant filtering while waiting for server results
   */
  function quickFilter() {
    if (!hasQuery.value) return

    const results = searchClientSide(store.classifications, query.value)
    resultIds.value = results
    store.searchResults = results
  }

  // Watch for query changes
  watch(query, (newQuery) => {
    if (newQuery.length === 0) {
      clearSearch()
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
  })

  return {
    // State
    query,
    isLoading,
    resultIds,
    error,
    lastSearchTime,
    searchState,

    // Computed
    hasQuery,
    resultCount,
    isQueryTooShort,
    isQueryTooLong,
    filteredClassifications,

    // Methods
    setQuery,
    executeSearch,
    clearSearch,
    highlight,
    isMatch,
    quickFilter,
    clearCache: clearSearchCache
  }
}

// Export type for external use
export type UseSearchReturn = ReturnType<typeof useSearch>
