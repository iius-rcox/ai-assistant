/**
 * Classification Store
 * Feature: 003-correction-ui
 * Tasks: T020, T024, T025
 *
 * Global state management for classifications using Pinia
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ClassificationWithEmail, ClassificationFilters, PaginationParams } from '@/types/models'
import * as classificationService from '@/services/classificationService'
import { logAction, logError } from '@/utils/logger'

export const useClassificationStore = defineStore('classification', () => {
  // State
  const classifications = ref<ClassificationWithEmail[]>([])
  const totalCount = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const filters = ref<ClassificationFilters>({})
  const sortBy = ref('classified_timestamp')
  const sortDir = ref<'asc' | 'desc'>('desc')
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  // Getters
  const pageCount = computed(() => Math.ceil(totalCount.value / pageSize.value))

  // Actions

  /**
   * Fetch classifications with current pagination/filters/sorting
   * Task: T024
   */
  async function fetchClassifications() {
    isLoading.value = true
    error.value = null

    try {
      logAction('Fetching classifications', {
        page: currentPage.value,
        pageSize: pageSize.value,
        filters: filters.value
      })

      const result = await classificationService.listClassifications({
        page: currentPage.value,
        pageSize: pageSize.value,
        filters: filters.value,
        sortBy: sortBy.value,
        sortDir: sortDir.value
      })

      classifications.value = result.data
      totalCount.value = result.totalCount

      logAction('Classifications fetched successfully', {
        count: result.data.length,
        total: result.totalCount,
        page: currentPage.value
      })
    } catch (e) {
      error.value = e as Error
      logError('Failed to fetch classifications', e)
      classifications.value = []
      totalCount.value = 0
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Refresh classifications (re-fetch current page)
   */
  async function refreshClassifications() {
    await fetchClassifications()
  }

  /**
   * Update classification (save correction)
   * Task: T025
   */
  async function updateClassification(id: number, updates: {
    category: string
    urgency: string
    action: string
    correction_reason?: string | null
  }) {
    try {
      logAction('Updating classification', { id, updates })

      const updated = await classificationService.updateClassification({
        id,
        updates: {
          category: updates.category as any,
          urgency: updates.urgency as any,
          action: updates.action as any,
          correction_reason: updates.correction_reason
        }
      })

      // Update local state
      const index = classifications.value.findIndex(c => c.id === id)
      if (index !== -1) {
        classifications.value[index] = { ...classifications.value[index], ...updated.classification }
      }

      logAction('Classification updated successfully', { id })

      return updated.classification
    } catch (e) {
      error.value = e as Error
      logError('Failed to update classification', e, { id })
      throw e
    }
  }

  /**
   * Set current page and fetch
   */
  function setPage(page: number) {
    currentPage.value = page
    fetchClassifications()
  }

  /**
   * Set page size and reset to page 1
   */
  function setPageSize(size: number) {
    pageSize.value = size
    currentPage.value = 1
    fetchClassifications()
  }

  /**
   * Set filters and reset to page 1
   */
  function setFilters(newFilters: ClassificationFilters) {
    filters.value = newFilters
    currentPage.value = 1
    fetchClassifications()
  }

  /**
   * Clear all filters and refresh
   */
  function clearFilters() {
    filters.value = {}
    currentPage.value = 1
    fetchClassifications()
  }

  /**
   * Set sorting and refresh
   */
  function setSorting(column: string, direction: 'asc' | 'desc') {
    sortBy.value = column
    sortDir.value = direction
    fetchClassifications()
  }

  return {
    // State
    classifications,
    totalCount,
    currentPage,
    pageSize,
    filters,
    sortBy,
    sortDir,
    isLoading,
    error,
    // Getters
    pageCount,
    // Actions
    fetchClassifications,
    refreshClassifications,
    updateClassification,
    setPage,
    setPageSize,
    setFilters,
    clearFilters,
    setSorting
  }
})
