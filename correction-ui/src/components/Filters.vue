<!--
  Filters Component
  Feature: 003-correction-ui
  Tasks: T047, T054, T056, T057
  Requirement: FR-006, FR-007 (auto-applying filters)

  Combined filter panel with auto-apply on change
-->

<script setup lang="ts">
import { ref, watch } from 'vue'
import ConfidenceDropdown from './shared/ConfidenceDropdown.vue'
import DateRangeDropdown from './shared/DateRangeDropdown.vue'
import CategoryDropdown from './shared/CategoryDropdown.vue'
import type { ClassificationFilters } from '@/types/models'
import { logAction } from '@/utils/logger'

interface Props {
  filters: ClassificationFilters
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:filters': [filters: ClassificationFilters]
  clear: []
}>()

// Local filter state
const confidenceRange = ref('all')
const dateRange = ref('all')
const selectedCategory = ref('all')
const showOnlyUncorrected = ref(props.filters.corrected === false)

// Confidence range mapping
const confidenceRanges: Record<string, { min?: number; max?: number }> = {
  all: {},
  '0-50': { min: 0, max: 0.5 },
  '51-70': { min: 0.51, max: 0.7 },
  '71-90': { min: 0.71, max: 0.9 },
  '91-100': { min: 0.91, max: 1 },
}

// Calculate date range based on preset
function getDateRange(preset: string): { dateFrom?: string; dateTo?: string } {
  if (preset === 'all') return {}

  const now = new Date()
  const dateTo = now.toISOString()

  let daysAgo = 0
  switch (preset) {
    case 'last-week':
      daysAgo = 7
      break
    case 'last-15':
      daysAgo = 15
      break
    case 'last-30':
      daysAgo = 30
      break
    case 'last-45':
      daysAgo = 45
      break
  }

  const dateFrom = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString()

  return { dateFrom, dateTo }
}

// Auto-apply filters whenever any value changes
function applyFilters() {
  const filters: ClassificationFilters = {}

  // Confidence range
  const range = confidenceRanges[confidenceRange.value]
  if (range && range.min !== undefined) filters.confidenceMin = range.min
  if (range && range.max !== undefined) filters.confidenceMax = range.max

  // Date range (preset-based)
  const dateRangeValues = getDateRange(dateRange.value)
  if (dateRangeValues.dateFrom) filters.dateFrom = dateRangeValues.dateFrom
  if (dateRangeValues.dateTo) filters.dateTo = dateRangeValues.dateTo

  // Category
  if (selectedCategory.value !== 'all') {
    filters.category = [selectedCategory.value as any]
  }

  // Correction status
  if (showOnlyUncorrected.value) {
    filters.corrected = false
  }

  logAction('Filters auto-applied', { filters })

  emit('update:filters', filters)
}

// Watch all filter values for changes - auto-apply
// Note: immediate: false prevents auto-apply on component mount
watch([confidenceRange, dateRange, selectedCategory, showOnlyUncorrected], () => {
  applyFilters()
})

// Clear all filters (T054)
function clearAllFilters() {
  confidenceRange.value = 'all'
  dateRange.value = 'all'
  selectedCategory.value = 'all'
  showOnlyUncorrected.value = false

  logAction('Filters cleared')

  emit('update:filters', {})
  emit('clear')
}

// Check if any filters are active
const hasActiveFilters = ref(false)
watch([confidenceRange, dateRange, selectedCategory, showOnlyUncorrected], () => {
  hasActiveFilters.value =
    confidenceRange.value !== 'all' ||
    dateRange.value !== 'all' ||
    selectedCategory.value !== 'all' ||
    showOnlyUncorrected.value
})
</script>

<template>
  <div class="filters">
    <div class="filters-header">
      <h3>Filters</h3>
      <span v-if="hasActiveFilters" class="active-indicator"> Active </span>
    </div>

    <div class="filters-grid">
      <!-- Confidence filter (new dropdown) -->
      <div class="filter-section">
        <ConfidenceDropdown v-model="confidenceRange" />
      </div>

      <!-- Category filter (new dynamic dropdown) -->
      <div class="filter-section">
        <CategoryDropdown v-model="selectedCategory" />
      </div>

      <!-- Date range filter -->
      <div class="filter-section">
        <DateRangeDropdown v-model="dateRange" />
      </div>

      <!-- Correction status filter -->
      <div class="filter-section">
        <div class="checkbox-wrapper">
          <label class="checkbox-filter">
            <input type="checkbox" v-model="showOnlyUncorrected" class="checkbox-input" />
            <span class="checkbox-label">Show only uncorrected</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Clear button only (Apply removed - auto-applies on change) -->
    <div class="filters-actions">
      <button
        @click="clearAllFilters"
        type="button"
        class="btn btn-secondary"
        :disabled="!hasActiveFilters"
      >
        Clear Filters
      </button>
    </div>

    <p class="auto-apply-hint">Filters apply automatically when changed</p>
  </div>
</template>

<style scoped>
.filters {
  background-color: var(--md-sys-color-surface-container-low);
  padding: 1.5rem;
  border-radius: var(--md-sys-shape-corner-medium);
  box-shadow: var(--md-sys-elevation-1);
  margin-bottom: 1.5rem;
  width: 100%;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filters-header h3 {
  margin: 0;
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-title-medium-size);
  font-weight: var(--md-sys-typescale-title-medium-weight);
}

.active-indicator {
  font-size: var(--md-sys-typescale-label-small-size);
  color: var(--md-ext-color-on-success);
  font-weight: var(--md-sys-typescale-label-small-weight);
  padding: 0.25rem 0.75rem;
  background-color: var(--md-ext-color-success);
  border-radius: var(--md-sys-shape-corner-full);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 1200px) {
  .filters-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.filter-section {
  display: flex;
  flex-direction: column;
}

.filter-section.full-width {
  grid-column: 1 / -1;
}

.checkbox-wrapper {
  padding-top: 1.75rem;
}

.checkbox-filter {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background-color: var(--md-sys-color-surface-container);
  border-radius: var(--md-sys-shape-corner-small);
  border: 1px solid var(--md-sys-color-outline-variant);
  cursor: pointer;
  user-select: none;
  transition: var(--md-sys-theme-transition);
}

.checkbox-filter:hover {
  background-color: var(--md-sys-color-surface-container-high);
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  margin: 0;
  flex-shrink: 0;
  accent-color: var(--md-sys-color-primary);
}

.checkbox-label {
  font-size: var(--md-sys-typescale-body-medium-size);
  color: var(--md-sys-color-on-surface);
  font-weight: 500;
  line-height: 1.4;
}

.filters-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.6rem 1.5rem;
  border: none;
  border-radius: var(--md-sys-shape-corner-small);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  cursor: pointer;
  transition: var(--md-sys-theme-transition);
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background-color: var(--md-sys-color-secondary);
  color: var(--md-sys-color-on-secondary);
}

.btn-secondary:hover:not(:disabled) {
  opacity: 0.9;
}

.auto-apply-hint {
  margin-top: 1rem;
  margin-bottom: 0;
  text-align: center;
  font-size: var(--md-sys-typescale-body-small-size);
  color: var(--md-sys-color-on-surface-variant);
  font-style: italic;
}

@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }

  .filters-actions {
    justify-content: stretch;
  }

  .btn {
    width: 100%;
  }
}
</style>
