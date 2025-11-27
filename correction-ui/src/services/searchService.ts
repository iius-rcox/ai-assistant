/**
 * Search Service
 * Feature: 005-table-enhancements
 * Tasks: T009, T010, T011
 *
 * Provides hybrid search functionality:
 * - Client-side filtering for datasets < 1,000 rows
 * - Supabase full-text search for datasets >= 1,000 rows
 */

import { supabase } from './supabase'
import { perfStart, perfEnd, logInfo, logError } from '@/utils/logger'
import type { ClassificationWithEmail } from '@/types/models'
import type { SearchCacheEntry, SearchOptions } from '@/types/table-enhancements'
import { SEARCH_CONFIG } from '@/constants/table'

// =============================================================================
// Cache Management
// =============================================================================

const searchCache = new Map<string, SearchCacheEntry>()

/**
 * Get cached search results if valid
 */
function getCachedResults(query: string): number[] | null {
  const entry = searchCache.get(query.toLowerCase())
  if (!entry) return null

  const now = Date.now()
  if (now - entry.timestamp > entry.ttl) {
    searchCache.delete(query.toLowerCase())
    return null
  }

  return entry.results
}

/**
 * Cache search results
 */
function cacheResults(
  query: string,
  results: number[],
  ttl: number = SEARCH_CONFIG.CACHE_TTL_MS
): void {
  searchCache.set(query.toLowerCase(), {
    query: query.toLowerCase(),
    results,
    timestamp: Date.now(),
    ttl,
  })
}

/**
 * Clear all search cache entries
 */
export function clearSearchCache(): void {
  searchCache.clear()
  logInfo('Search cache cleared')
}

/**
 * Clear expired cache entries
 */
export function pruneSearchCache(): void {
  const now = Date.now()
  let pruned = 0

  searchCache.forEach((entry, key) => {
    if (now - entry.timestamp > entry.ttl) {
      searchCache.delete(key)
      pruned++
    }
  })

  if (pruned > 0) {
    logInfo('Search cache pruned', { prunedEntries: pruned })
  }
}

// =============================================================================
// Client-Side Search (T010)
// =============================================================================

/**
 * Client-side search for datasets < 1,000 rows
 * Task: T010
 *
 * Searches across:
 * - Email subject
 * - Email sender
 * - Category
 * - Urgency
 * - Action
 *
 * @param classifications - Array of classifications to search
 * @param query - Search query (minimum 2 characters)
 * @returns Array of matching classification IDs
 */
export function searchClientSide(
  classifications: ClassificationWithEmail[],
  query: string
): number[] {
  perfStart('searchClientSide')

  if (!query || query.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
    perfEnd('searchClientSide', { skipped: true, reason: 'query too short' })
    return classifications.map(c => c.id)
  }

  const normalizedQuery = query.toLowerCase().trim()
  const queryTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 0)

  const results = classifications.filter(classification => {
    const email = classification.email

    // Build searchable text from all relevant fields
    const searchableText = [
      email?.subject || '',
      email?.sender || '',
      classification.category || '',
      classification.urgency || '',
      classification.action || '',
    ]
      .join(' ')
      .toLowerCase()

    // Match if ALL query terms are found (AND search)
    return queryTerms.every(term => searchableText.includes(term))
  })

  const resultIds = results.map(c => c.id)

  perfEnd('searchClientSide', {
    query,
    totalRecords: classifications.length,
    matchCount: resultIds.length,
  })

  return resultIds
}

/**
 * Score-based client-side search for better ranking
 * Returns results sorted by relevance
 */
export function searchClientSideWithScore(
  classifications: ClassificationWithEmail[],
  query: string
): Array<{ id: number; score: number }> {
  perfStart('searchClientSideWithScore')

  if (!query || query.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
    perfEnd('searchClientSideWithScore', { skipped: true })
    return classifications.map(c => ({ id: c.id, score: 0 }))
  }

  const normalizedQuery = query.toLowerCase().trim()
  const queryTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 0)

  const scoredResults = classifications
    .map(classification => {
      const email = classification.email
      let score = 0

      // Subject match (highest weight)
      const subject = (email?.subject || '').toLowerCase()
      queryTerms.forEach(term => {
        if (subject.includes(term)) score += 10
        if (subject.startsWith(term)) score += 5
      })

      // Sender match (high weight)
      const sender = (email?.sender || '').toLowerCase()
      queryTerms.forEach(term => {
        if (sender.includes(term)) score += 8
      })

      // Category/urgency/action match (medium weight)
      const category = (classification.category || '').toLowerCase()
      const urgency = (classification.urgency || '').toLowerCase()
      const action = (classification.action || '').toLowerCase()

      queryTerms.forEach(term => {
        if (category.includes(term)) score += 5
        if (urgency.includes(term)) score += 3
        if (action.includes(term)) score += 3
      })

      return { id: classification.id, score }
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)

  perfEnd('searchClientSideWithScore', {
    query,
    totalRecords: classifications.length,
    matchCount: scoredResults.length,
  })

  return scoredResults
}

// =============================================================================
// Server-Side Search (T011)
// =============================================================================

/**
 * Server-side full-text search using Supabase RPC
 * Task: T011
 *
 * Uses PostgreSQL's ts_vector for full-text search with ranking.
 * Recommended for datasets >= 1,000 rows.
 *
 * @param query - Search query (minimum 2 characters)
 * @returns Array of matching email IDs
 */
export async function searchServerSide(query: string): Promise<number[]> {
  perfStart('searchServerSide')

  if (!query || query.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
    perfEnd('searchServerSide', { skipped: true, reason: 'query too short' })
    return []
  }

  // Check cache first
  const cached = getCachedResults(query)
  if (cached) {
    perfEnd('searchServerSide', { cached: true, resultCount: cached.length })
    return cached
  }

  try {
    // Call the search_emails RPC function
    const { data, error } = await (supabase.rpc as any)('search_emails', {
      search_query: query,
    })

    if (error) {
      logError('Server-side search failed', error, { query })
      throw error
    }

    // Extract email IDs from results
    const emailIds = (data || []).map((email: any) => email.id as number)

    // Now get classification IDs for these email IDs
    const { data: classifications, error: classError } = await supabase
      .from('classifications')
      .select('id')
      .in('email_id', emailIds)

    if (classError) {
      logError('Failed to map email IDs to classifications', classError)
      throw classError
    }

    const classificationIds = (classifications || []).map((c: any) => c.id as number)

    // Cache the results
    cacheResults(query, classificationIds)

    perfEnd('searchServerSide', {
      query,
      emailMatches: emailIds.length,
      classificationMatches: classificationIds.length,
    })

    return classificationIds
  } catch (error) {
    perfEnd('searchServerSide', { error: true })
    throw error
  }
}

/**
 * Search classifications with email data using ILIKE (fallback)
 * Used when full-text search RPC is not available
 */
export async function searchClassificationsWithEmails(
  query: string,
  options: {
    sortColumn?: string
    sortAsc?: boolean
    offset?: number
    limit?: number
  } = {}
): Promise<ClassificationWithEmail[]> {
  perfStart('searchClassificationsWithEmails')

  const { sortColumn = 'created_at', sortAsc = false, offset = 0, limit = 100 } = options

  if (!query || query.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
    perfEnd('searchClassificationsWithEmails', { skipped: true })
    return []
  }

  try {
    // Use ILIKE for pattern matching on subject and sender
    const searchPattern = `%${query}%`

    const { data, error } = await supabase
      .from('classifications')
      .select(
        `
        id,
        category,
        urgency,
        action,
        confidence_score,
        corrected_category,
        corrected_urgency,
        corrected_action,
        version,
        created_at,
        updated_at,
        email:emails!inner(
          id,
          subject,
          sender,
          body,
          received_timestamp
        )
      `
      )
      .or(`email.subject.ilike.${searchPattern},email.sender.ilike.${searchPattern}`)
      .order(sortColumn, { ascending: sortAsc })
      .range(offset, offset + limit - 1)

    if (error) {
      logError('searchClassificationsWithEmails failed', error, { query })
      throw error
    }

    perfEnd('searchClassificationsWithEmails', {
      query,
      resultCount: data?.length || 0,
    })

    return (data || []) as ClassificationWithEmail[]
  } catch (error) {
    perfEnd('searchClassificationsWithEmails', { error: true })
    throw error
  }
}

// =============================================================================
// Hybrid Search (T009)
// =============================================================================

/**
 * Hybrid search that automatically chooses client or server search
 * Task: T009
 *
 * Decision logic:
 * - If totalCount < SERVER_SEARCH_THRESHOLD: Use client-side search
 * - If totalCount >= SERVER_SEARCH_THRESHOLD: Use server-side full-text search
 *
 * @param query - Search query
 * @param classifications - Current loaded classifications (for client search)
 * @param totalCount - Total number of classifications in database
 * @param options - Search options
 * @returns Array of matching classification IDs
 */
export async function hybridSearch(
  query: string,
  classifications: ClassificationWithEmail[],
  totalCount: number,
  options: SearchOptions = {}
): Promise<number[]> {
  perfStart('hybridSearch')

  const threshold = options.threshold ?? SEARCH_CONFIG.SERVER_SEARCH_THRESHOLD
  const forceServerSearch = options.useServerSearch

  // Validate query
  if (!query || query.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
    perfEnd('hybridSearch', { skipped: true, reason: 'query too short' })
    return []
  }

  if (query.length > SEARCH_CONFIG.MAX_QUERY_LENGTH) {
    perfEnd('hybridSearch', { skipped: true, reason: 'query too long' })
    return []
  }

  try {
    let results: number[]
    let searchType: 'client' | 'server'

    if (forceServerSearch || totalCount >= threshold) {
      // Use server-side full-text search
      searchType = 'server'
      results = await searchServerSide(query)
    } else {
      // Use client-side search
      searchType = 'client'
      results = searchClientSide(classifications, query)
    }

    perfEnd('hybridSearch', {
      query,
      searchType,
      threshold,
      totalCount,
      resultCount: results.length,
    })

    logInfo('Hybrid search completed', {
      searchType,
      query: query.substring(0, 50),
      resultCount: results.length,
    })

    return results
  } catch (error) {
    perfEnd('hybridSearch', { error: true })
    logError('Hybrid search failed', error, { query })
    throw error
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Highlight search terms in text
 * Returns HTML string with <mark> tags around matches
 */
export function highlightSearchTerms(text: string, query: string): string {
  if (!text || !query || query.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
    return text
  }

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 0)
  let result = text

  terms.forEach(term => {
    const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi')
    result = result.replace(regex, '<mark>$1</mark>')
  })

  return result
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}
