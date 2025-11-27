<!--
  Patterns Table Component
  Feature: 003-correction-ui / 006-material-design-themes
  Tasks: T064, T067, T058
  Requirement: FR-009

  Displays correction patterns (original→corrected frequencies) with M3 theming
-->

<script setup lang="ts">
import { useChartTheme } from '@/composables/useChartTheme'
import type { CorrectionPattern } from '@/types/models'

interface Props {
  patterns: CorrectionPattern[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'pattern-click': [pattern: CorrectionPattern]
}>()

const { chartColors } = useChartTheme()

function handlePatternClick(pattern: CorrectionPattern) {
  emit('pattern-click', pattern)
}

function getBadgeColor(fieldName: string): string {
  switch (fieldName) {
    case 'CATEGORY':
      return chartColors.value.primary
    case 'URGENCY':
      return chartColors.value.warning
    case 'ACTION':
      return chartColors.value.tertiary
    default:
      return chartColors.value.onSurfaceVariant
  }
}
</script>

<template>
  <div class="patterns-table">
    <h3 class="section-title">Correction Patterns</h3>

    <div v-if="patterns.length === 0" class="empty-state">
      <p>No corrections yet. Make some corrections to see patterns!</p>
    </div>

    <div v-else class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Original Value</th>
            <th>→</th>
            <th>Corrected Value</th>
            <th>Occurrences</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(pattern, index) in patterns"
            :key="index"
            @click="handlePatternClick(pattern)"
            class="pattern-row clickable"
          >
            <td>
              <span
                class="field-badge"
                :style="{ backgroundColor: getBadgeColor(pattern.field_name) }"
              >
                {{ pattern.field_name }}
              </span>
            </td>
            <td class="value-cell">{{ pattern.original_value }}</td>
            <td class="arrow-cell">→</td>
            <td class="value-cell corrected">{{ pattern.corrected_value }}</td>
            <td class="count-cell">
              <span class="count-badge">{{ pattern.occurrence_count }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.patterns-table {
  background-color: var(--md-sys-color-surface);
  padding: 1.5rem;
  border-radius: var(--md-sys-shape-corner-medium);
  box-shadow: var(--md-sys-elevation-1);
  margin-bottom: 1.5rem;
  border: 1px solid var(--md-sys-color-outline-variant);
  transition: var(--md-sys-theme-transition);
}

.section-title {
  margin: 0 0 1.5rem 0;
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-title-medium-size);
  font-weight: var(--md-sys-typescale-title-medium-weight);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--md-sys-color-on-surface-variant);
}

.empty-state p {
  margin: 0;
  font-size: var(--md-sys-typescale-body-medium-size);
}

.table-container {
  overflow-x: auto;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-small);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table thead {
  background-color: var(--md-sys-color-surface-container);
  border-bottom: 2px solid var(--md-sys-color-outline-variant);
}

.table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: var(--md-sys-typescale-label-large-weight);
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-label-medium-size);
}

.table td {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  font-size: var(--md-sys-typescale-body-medium-size);
  color: var(--md-sys-color-on-surface);
}

.pattern-row.clickable {
  cursor: pointer;
  transition: var(--md-sys-theme-transition);
}

.pattern-row.clickable:hover {
  background-color: var(--md-sys-color-surface-container-high);
}

.field-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: var(--md-sys-shape-corner-full);
  font-size: var(--md-sys-typescale-label-small-size);
  font-weight: 600;
  color: white;
  text-transform: uppercase;
}

.value-cell {
  font-weight: var(--md-sys-typescale-body-medium-weight);
  color: var(--md-sys-color-on-surface-variant);
}

.value-cell.corrected {
  color: var(--md-ext-color-success);
  font-weight: 600;
}

.arrow-cell {
  color: var(--md-sys-color-outline);
  font-weight: bold;
  text-align: center;
  width: 40px;
}

.count-cell {
  text-align: right;
}

.count-badge {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  border-radius: var(--md-sys-shape-corner-full);
  font-weight: 600;
  font-size: var(--md-sys-typescale-label-medium-size);
}
</style>
