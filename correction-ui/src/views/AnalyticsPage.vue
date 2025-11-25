<!--
  Analytics Page
  Feature: 003-correction-ui, 005-table-enhancements
  Tasks: T068, T071, T080-T087

  Page displaying correction history and statistics with enhanced analytics
-->

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import AnalyticsDashboard from '@/components/AnalyticsDashboard.vue'
import { logAction } from '@/utils/logger'
import type { CorrectionPattern } from '@/types/models'

const store = useAnalyticsStore()

// Fetch all analytics on mount (T087)
onMounted(() => {
  logAction('Analytics page mounted')
  store.fetchAllAnalytics()
})

// Handle refresh
function handleRefresh() {
  logAction('Analytics refresh requested')
  store.refreshStatistics()
}

// Handle pattern click (T067)
function handlePatternClick(pattern: CorrectionPattern) {
  logAction('Pattern clicked', {
    field: pattern.field_name,
    original: pattern.original_value,
    corrected: pattern.corrected_value,
    count: pattern.occurrence_count
  })

  // TODO: Show modal with example emails
  alert(`Pattern: ${pattern.original_value} → ${pattern.corrected_value}\nOccurrences: ${pattern.occurrence_count}\n\nExample emails will be shown in a modal (future enhancement)`)
}

// Handle export (T086)
function handleExport(type: 'trends' | 'categories' | 'patterns') {
  logAction('Export requested', { type })
  store.exportAnalytics(type)
}

// Handle drill-down (T085)
function handleDrillDown(type: string, value: string | number) {
  logAction('Drill-down requested', { type, value })
  // TODO: Implement drill-down navigation/filtering
  if (type === 'category') {
    alert(`Filtering by category: ${value}\n\nDrill-down navigation will be implemented in a future enhancement`)
  } else if (type === 'trend') {
    alert(`Showing details for: ${value}\n\nDrill-down navigation will be implemented in a future enhancement`)
  }
}
</script>

<template>
  <div class="analytics-page">
    <AnalyticsDashboard
      :statistics="store.statistics"
      :correctionTrends="store.correctionTrends"
      :categoryDistribution="store.categoryDistribution"
      :isLoading="store.isLoading"
      :error="store.error"
      @refresh="handleRefresh"
      @pattern-click="handlePatternClick"
      @export="handleExport"
      @drill-down="handleDrillDown"
    />
  </div>
</template>

<style scoped>
.analytics-page {
  width: 100%;
}
</style>
