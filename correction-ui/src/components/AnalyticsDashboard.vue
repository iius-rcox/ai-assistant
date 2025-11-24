<!--
  Analytics Dashboard Component
  Feature: 003-correction-ui
  Tasks: T066, T070

  Combines summary stats, patterns table, and timeline chart
-->

<script setup lang="ts">
import SummaryStats from './analytics/SummaryStats.vue'
import PatternsTable from './analytics/PatternsTable.vue'
import TimelineChart from './analytics/TimelineChart.vue'
import type { CorrectionStatistics } from '@/types/models'

interface Props {
  statistics: CorrectionStatistics | null
  isLoading?: boolean
  error?: Error | null
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: null
})

const emit = defineEmits<{
  'refresh': []
  'pattern-click': [pattern: any]
}>()

function handleRefresh() {
  emit('refresh')
}

function handlePatternClick(pattern: any) {
  emit('pattern-click', pattern)
}
</script>

<template>
  <div class="analytics-dashboard">
    <div class="dashboard-header">
      <h2>Correction History & Analytics</h2>
      <button @click="handleRefresh" class="btn-refresh" :disabled="isLoading">
        <span class="refresh-icon">↻</span>
        {{ isLoading ? 'Refreshing...' : 'Refresh' }}
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading && !statistics" class="loading-state">
      <div class="spinner"></div>
      <p>Loading analytics...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <p class="error-text">{{ error.message }}</p>
      <button @click="handleRefresh" class="btn-retry">
        Try Again
      </button>
    </div>

    <!-- Analytics content -->
    <div v-else-if="statistics">
      <!-- Summary statistics -->
      <SummaryStats
        :totalCorrections="statistics.summary.totalCorrections"
        :correctionRate="statistics.summary.correctionRate"
        :mostCorrectedCategory="statistics.summary.mostCorrectedCategory"
      />

      <!-- Correction patterns table -->
      <PatternsTable
        :patterns="statistics.patterns"
        @pattern-click="handlePatternClick"
      />

      <!-- Timeline chart -->
      <TimelineChart
        :timeline="statistics.timeline"
      />
    </div>

    <!-- No data state -->
    <div v-else class="empty-state">
      <p>No analytics data available. Click "Refresh" to load statistics.</p>
    </div>
  </div>
</template>

<style scoped>
.analytics-dashboard {
  width: 100%;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.dashboard-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.btn-refresh {
  padding: 0.6rem 1.2rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s, transform 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background-color: #2980b9;
  transform: translateY(-1px);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 1.2rem;
  display: inline-block;
  transition: transform 0.3s;
}

.btn-refresh:hover .refresh-icon {
  transform: rotate(180deg);
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p {
  color: #7f8c8d;
  font-size: 1rem;
}

.error-state {
  color: #e74c3c;
}

.error-text {
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.btn-retry {
  padding: 0.6rem 1.5rem;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-retry:hover {
  background-color: #c0392b;
}

.empty-state {
  color: #95a5a6;
}

.empty-state p {
  font-size: 1.1rem;
  margin: 0;
}
</style>
