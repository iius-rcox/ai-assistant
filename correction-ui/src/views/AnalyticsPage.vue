<!--
  Analytics Page
  Feature: 003-correction-ui
  Tasks: T068, T071

  Page displaying correction history and statistics
-->

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import AnalyticsDashboard from '@/components/AnalyticsDashboard.vue'
import { logAction } from '@/utils/logger'
import type { CorrectionPattern } from '@/types/models'

const store = useAnalyticsStore()

// Fetch on mount (T071)
onMounted(() => {
  logAction('Analytics page mounted')
  store.fetchStatistics()
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
</script>

<template>
  <div class="analytics-page">
    <AnalyticsDashboard
      :statistics="store.statistics"
      :isLoading="store.isLoading"
      :error="store.error"
      @refresh="handleRefresh"
      @pattern-click="handlePatternClick"
    />
  </div>
</template>

<style scoped>
.analytics-page {
  width: 100%;
}
</style>
