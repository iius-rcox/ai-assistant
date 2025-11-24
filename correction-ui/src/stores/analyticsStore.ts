/**
 * Analytics Store
 * Feature: 003-correction-ui
 * Tasks: T061, T062
 *
 * Global state management for correction analytics using Pinia
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CorrectionStatistics } from '@/types/models'
import * as analyticsService from '@/services/analyticsService'
import { logAction, logError } from '@/utils/logger'

export const useAnalyticsStore = defineStore('analytics', () => {
  // State
  const statistics = ref<CorrectionStatistics | null>(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  // Actions

  /**
   * Fetch all analytics statistics
   * Task: T062
   */
  async function fetchStatistics() {
    isLoading.value = true
    error.value = null

    try {
      logAction('Fetching analytics statistics')

      const data = await analyticsService.getCorrectionStatistics()
      statistics.value = data

      logAction('Analytics statistics fetched successfully', {
        totalCorrections: data.summary.totalCorrections,
        patternsCount: data.patterns.length,
        timelinePoints: data.timeline.length
      })
    } catch (e) {
      error.value = e as Error
      logError('Failed to fetch analytics statistics', e)
      statistics.value = null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Refresh statistics
   */
  async function refreshStatistics() {
    await fetchStatistics()
  }

  return {
    // State
    statistics,
    isLoading,
    error,
    // Actions
    fetchStatistics,
    refreshStatistics
  }
})
