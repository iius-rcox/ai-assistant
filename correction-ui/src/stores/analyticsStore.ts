/**
 * Analytics Store
 * Feature: 003-correction-ui, 005-table-enhancements
 * Tasks: T061, T062, T080-T087
 *
 * Global state management for correction analytics using Pinia
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CorrectionStatistics } from '@/types/models'
import * as analyticsService from '@/services/analyticsService'
import { logAction, logError } from '@/utils/logger'

// Extended types for new analytics
interface CorrectionTrends {
  dates: string[]
  corrections: number[]
  classifications: number[]
  rates: number[]
}

interface CategoryDistribution {
  categories: string[]
  counts: number[]
  percentages: number[]
}

interface AccuracyTrends {
  dates: string[]
  accuracy: number[]
  totalPerDay: number[]
}

export const useAnalyticsStore = defineStore('analytics', () => {
  // State
  const statistics = ref<CorrectionStatistics | null>(null)
  const correctionTrends = ref<CorrectionTrends | null>(null)
  const categoryDistribution = ref<CategoryDistribution | null>(null)
  const accuracyTrends = ref<AccuracyTrends | null>(null)
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
        timelinePoints: data.timeline.length,
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
   * Fetch correction trends data
   * Task: T080
   */
  async function fetchCorrectionTrends(days: number = 30) {
    try {
      logAction('Fetching correction trends', { days })
      const data = await analyticsService.getCorrectionTrends(days)
      correctionTrends.value = data
      logAction('Correction trends fetched', { dataPoints: data.dates.length })
    } catch (e) {
      logError('Failed to fetch correction trends', e)
    }
  }

  /**
   * Fetch category distribution
   * Task: T081
   */
  async function fetchCategoryDistribution() {
    try {
      logAction('Fetching category distribution')
      const data = await analyticsService.getCategoryDistribution()
      categoryDistribution.value = data
      logAction('Category distribution fetched', { categories: data.categories.length })
    } catch (e) {
      logError('Failed to fetch category distribution', e)
    }
  }

  /**
   * Fetch accuracy trends
   * Task: T082
   */
  async function fetchAccuracyTrends(days: number = 30) {
    try {
      logAction('Fetching accuracy trends', { days })
      const data = await analyticsService.getAccuracyTrends(days)
      accuracyTrends.value = data
      logAction('Accuracy trends fetched', { dataPoints: data.dates.length })
    } catch (e) {
      logError('Failed to fetch accuracy trends', e)
    }
  }

  /**
   * Fetch all enhanced analytics
   * Task: T087
   */
  async function fetchAllAnalytics() {
    isLoading.value = true
    error.value = null

    try {
      await Promise.all([
        fetchStatistics(),
        fetchCorrectionTrends(),
        fetchCategoryDistribution(),
        fetchAccuracyTrends(),
      ])
    } catch (e) {
      error.value = e as Error
      logError('Failed to fetch all analytics', e)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Refresh statistics
   */
  async function refreshStatistics() {
    await fetchAllAnalytics()
  }

  /**
   * Export analytics data
   * Task: T086
   */
  function exportAnalytics(type: 'trends' | 'categories' | 'patterns') {
    if (type === 'trends' && correctionTrends.value) {
      const trends = correctionTrends.value
      analyticsService.exportAnalyticsCSV(
        {
          headers: ['Date', 'Corrections', 'Classifications', 'Rate %'],
          rows: trends.dates.map((date, i) => [
            date,
            trends.corrections[i] ?? 0,
            trends.classifications[i] ?? 0,
            (trends.rates[i] ?? 0).toFixed(2),
          ]),
        },
        'correction-trends.csv'
      )
    } else if (type === 'categories' && categoryDistribution.value) {
      const dist = categoryDistribution.value
      analyticsService.exportAnalyticsCSV(
        {
          headers: ['Category', 'Count', 'Percentage'],
          rows: dist.categories.map((cat, i) => [
            cat,
            dist.counts[i] ?? 0,
            (dist.percentages[i] ?? 0).toFixed(2),
          ]),
        },
        'category-distribution.csv'
      )
    } else if (type === 'patterns' && statistics.value) {
      analyticsService.exportAnalyticsCSV(
        {
          headers: ['Field', 'Original', 'Corrected', 'Occurrences'],
          rows: statistics.value.patterns.map(p => [
            p.field_name,
            p.original_value,
            p.corrected_value,
            p.occurrence_count,
          ]),
        },
        'correction-patterns.csv'
      )
    }
  }

  return {
    // State
    statistics,
    correctionTrends,
    categoryDistribution,
    accuracyTrends,
    isLoading,
    error,
    // Actions
    fetchStatistics,
    fetchCorrectionTrends,
    fetchCategoryDistribution,
    fetchAccuracyTrends,
    fetchAllAnalytics,
    refreshStatistics,
    exportAnalytics,
  }
})
