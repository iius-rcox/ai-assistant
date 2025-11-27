<!--
  Analytics Dashboard Component
  Feature: 003-correction-ui, 005-table-enhancements, 006-material-design-themes
  Tasks: T066, T070, T080-T087, T060

  Combines summary stats, patterns table, timeline chart, and enhanced analytics with M3 theming
-->

<script setup lang="ts">
import { ref } from 'vue'
import SummaryStats from './analytics/SummaryStats.vue'
import PatternsTable from './analytics/PatternsTable.vue'
import TimelineChart from './analytics/TimelineChart.vue'
import CorrectionsChart from './analytics/CorrectionsChart.vue'
import CategoryPieChart from './analytics/CategoryPieChart.vue'
import type { CorrectionStatistics } from '@/types/models'

interface Props {
  statistics: CorrectionStatistics | null
  correctionTrends?: {
    dates: string[]
    corrections: number[]
    classifications: number[]
    rates: number[]
  } | null
  categoryDistribution?: {
    categories: string[]
    counts: number[]
    percentages: number[]
  } | null
  isLoading?: boolean
  error?: Error | null
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: null,
  correctionTrends: null,
  categoryDistribution: null,
})

const emit = defineEmits<{
  refresh: []
  'pattern-click': [pattern: any]
  export: [type: 'trends' | 'categories' | 'patterns']
  'drill-down': [type: string, value: string | number]
}>()

// Active tab for enhanced view
const activeTab = ref<'overview' | 'trends' | 'distribution'>('overview')

function handleRefresh() {
  emit('refresh')
}

function handlePatternClick(pattern: any) {
  emit('pattern-click', pattern)
}

function handleExport(type: 'trends' | 'categories' | 'patterns') {
  emit('export', type)
}

function handleTrendPointClick(date: string, type: string) {
  emit('drill-down', 'trend', `${date}:${type}`)
}

function handleCategorySliceClick(category: string, _count: number) {
  emit('drill-down', 'category', category)
}
</script>

<template>
  <div class="analytics-dashboard">
    <div class="dashboard-header">
      <h2>Correction History & Analytics</h2>
      <div class="header-actions">
        <div class="export-buttons" v-if="statistics">
          <button @click="handleExport('trends')" class="btn-export" title="Export trends to CSV">
            Export Trends
          </button>
          <button
            @click="handleExport('categories')"
            class="btn-export"
            title="Export categories to CSV"
          >
            Export Categories
          </button>
          <button
            @click="handleExport('patterns')"
            class="btn-export"
            title="Export patterns to CSV"
          >
            Export Patterns
          </button>
        </div>
        <button @click="handleRefresh" class="btn-refresh" :disabled="isLoading">
          <span class="refresh-icon">↻</span>
          {{ isLoading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <!-- Tab navigation -->
    <div class="tab-nav" v-if="statistics">
      <button
        :class="['tab-btn', { active: activeTab === 'overview' }]"
        @click="activeTab = 'overview'"
      >
        Overview
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'trends' }]"
        @click="activeTab = 'trends'"
      >
        Trends
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'distribution' }]"
        @click="activeTab = 'distribution'"
      >
        Distribution
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
      <button @click="handleRefresh" class="btn-retry">Try Again</button>
    </div>

    <!-- Analytics content -->
    <div v-else-if="statistics">
      <!-- Overview Tab -->
      <div v-show="activeTab === 'overview'" class="tab-content">
        <!-- Summary statistics -->
        <SummaryStats
          :totalCorrections="statistics.summary.totalCorrections"
          :correctionRate="statistics.summary.correctionRate"
          :mostCorrectedCategory="statistics.summary.mostCorrectedCategory"
        />

        <!-- Correction patterns table -->
        <PatternsTable :patterns="statistics.patterns" @pattern-click="handlePatternClick" />

        <!-- Timeline chart (original) -->
        <TimelineChart :timeline="statistics.timeline" />
      </div>

      <!-- Trends Tab -->
      <div v-show="activeTab === 'trends'" class="tab-content">
        <CorrectionsChart
          v-if="correctionTrends"
          :dates="correctionTrends.dates"
          :corrections="correctionTrends.corrections"
          :classifications="correctionTrends.classifications"
          :rates="correctionTrends.rates"
          @point-click="handleTrendPointClick"
        />
        <div v-else class="no-data-message">
          <p>Trend data is loading or not available.</p>
        </div>
      </div>

      <!-- Distribution Tab -->
      <div v-show="activeTab === 'distribution'" class="tab-content">
        <div class="charts-grid">
          <CategoryPieChart
            v-if="categoryDistribution"
            :categories="categoryDistribution.categories"
            :counts="categoryDistribution.counts"
            :percentages="categoryDistribution.percentages"
            chartType="donut"
            @slice-click="handleCategorySliceClick"
          />
          <div v-else class="no-data-message">
            <p>Category distribution data is loading or not available.</p>
          </div>
        </div>
      </div>
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
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.dashboard-header h2 {
  margin: 0;
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-headline-small-size);
  font-weight: var(--md-sys-typescale-headline-small-weight);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.export-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-export {
  padding: 0.4rem 0.8rem;
  background-color: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-small);
  cursor: pointer;
  font-size: var(--md-sys-typescale-label-medium-size);
  transition: var(--md-sys-theme-transition);
}

.btn-export:hover {
  background-color: var(--md-sys-color-surface-container-high);
  border-color: var(--md-sys-color-primary);
}

.btn-refresh {
  padding: 0.6rem 1.2rem;
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  border: none;
  border-radius: var(--md-sys-shape-corner-small);
  cursor: pointer;
  font-size: var(--md-sys-typescale-label-large-size);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: var(--md-sys-theme-transition);
}

.btn-refresh:hover:not(:disabled) {
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  transform: translateY(-1px);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 1.2rem;
  display: inline-block;
  transition: transform var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard);
}

.btn-refresh:hover .refresh-icon {
  transform: rotate(180deg);
}

/* Tab navigation */
.tab-nav {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--md-sys-color-outline-variant);
  padding-bottom: 0;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  background-color: transparent;
  color: var(--md-sys-color-on-surface-variant);
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  transition: var(--md-sys-theme-transition);
  margin-bottom: -2px;
}

.tab-btn:hover {
  color: var(--md-sys-color-on-surface);
  background-color: var(--md-sys-color-surface-container-high);
}

.tab-btn.active {
  color: var(--md-sys-color-primary);
  border-bottom-color: var(--md-sys-color-primary);
}

.tab-content {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1200px) {
  .charts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.no-data-message {
  text-align: center;
  padding: 3rem;
  background-color: var(--md-sys-color-surface);
  border-radius: var(--md-sys-shape-corner-medium);
  border: 1px solid var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-surface-variant);
}

.no-data-message p {
  margin: 0;
  font-size: var(--md-sys-typescale-body-medium-size);
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background-color: var(--md-sys-color-surface);
  border-radius: var(--md-sys-shape-corner-medium);
  box-shadow: var(--md-sys-elevation-1);
  transition: var(--md-sys-theme-transition);
}

.spinner {
  border: 4px solid var(--md-sys-color-surface-container-high);
  border-top: 4px solid var(--md-sys-color-primary);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-state p {
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-body-medium-size);
}

.error-state {
  color: var(--md-sys-color-error);
}

.error-text {
  margin-bottom: 1.5rem;
  font-size: var(--md-sys-typescale-body-large-size);
}

.btn-retry {
  padding: 0.6rem 1.5rem;
  background-color: var(--md-sys-color-error);
  color: var(--md-sys-color-on-error);
  border: none;
  border-radius: var(--md-sys-shape-corner-small);
  cursor: pointer;
  font-size: var(--md-sys-typescale-label-large-size);
  transition: var(--md-sys-theme-transition);
}

.btn-retry:hover {
  background-color: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}

.empty-state {
  color: var(--md-sys-color-on-surface-variant);
}

.empty-state p {
  font-size: var(--md-sys-typescale-body-large-size);
  margin: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .export-buttons {
    display: none;
  }

  .tab-nav {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .tab-btn {
    padding: 0.6rem 1rem;
    font-size: var(--md-sys-typescale-label-medium-size);
    white-space: nowrap;
  }
}
</style>
