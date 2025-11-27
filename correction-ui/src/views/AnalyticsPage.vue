<!--
  Analytics Page
  Feature: 006-material-design-themes
  Task: T010

  Page displaying correction history and statistics with enhanced analytics
-->

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import AnalyticsDashboard from '@/components/AnalyticsDashboard.vue'
import { logAction } from '@/utils/logger'
import type { CorrectionPattern } from '@/types/models'

const store = useAnalyticsStore()

// Fetch all analytics on mount
onMounted(() => {
  logAction('Analytics page mounted')
  store.fetchAllAnalytics()
})

// Handle refresh
function handleRefresh() {
  logAction('Analytics refresh requested')
  store.refreshStatistics()
}

// Handle pattern click
function handlePatternClick(pattern: CorrectionPattern) {
  logAction('Pattern clicked', {
    field: pattern.field_name,
    original: pattern.original_value,
    corrected: pattern.corrected_value,
    count: pattern.occurrence_count,
  })

  // TODO: Show modal with example emails
  alert(
    `Pattern: ${pattern.original_value} → ${pattern.corrected_value}\nOccurrences: ${pattern.occurrence_count}\n\nExample emails will be shown in a modal (future enhancement)`
  )
}

// Handle export
function handleExport(type: 'trends' | 'categories' | 'patterns') {
  logAction('Export requested', { type })
  store.exportAnalytics(type)
}

// Handle drill-down
function handleDrillDown(type: string, value: string | number) {
  logAction('Drill-down requested', { type, value })
  // TODO: Implement drill-down navigation/filtering
  if (type === 'category') {
    alert(
      `Filtering by category: ${value}\n\nDrill-down navigation will be implemented in a future enhancement`
    )
  } else if (type === 'trend') {
    alert(
      `Showing details for: ${value}\n\nDrill-down navigation will be implemented in a future enhancement`
    )
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
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
}
</style>
