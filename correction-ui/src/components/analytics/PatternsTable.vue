<!--
  Patterns Table Component
  Feature: 003-correction-ui
  Tasks: T064, T067
  Requirement: FR-009

  Displays correction patterns (original→corrected frequencies)
-->

<script setup lang="ts">
import type { CorrectionPattern } from '@/types/models'

interface Props {
  patterns: CorrectionPattern[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'pattern-click': [pattern: CorrectionPattern]
}>()

function handlePatternClick(pattern: CorrectionPattern) {
  emit('pattern-click', pattern)
}

function getBadgeColor(fieldName: string): string {
  switch (fieldName) {
    case 'CATEGORY': return '#3498db'
    case 'URGENCY': return '#f39c12'
    case 'ACTION': return '#9b59b6'
    default: return '#95a5a6'
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
              <span class="field-badge" :style="{ backgroundColor: getBadgeColor(pattern.field_name) }">
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
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.section-title {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #95a5a6;
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
}

.table-container {
  overflow-x: auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table thead {
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
}

.table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.table td {
  padding: 0.75rem 1rem;
  border-top: 1px solid #e0e0e0;
  font-size: 0.9rem;
}

.pattern-row.clickable {
  cursor: pointer;
  transition: background-color 0.2s;
}

.pattern-row.clickable:hover {
  background-color: #f8f9fa;
}

.field-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
}

.value-cell {
  font-weight: 500;
  color: #555;
}

.value-cell.corrected {
  color: #27ae60;
  font-weight: 600;
}

.arrow-cell {
  color: #95a5a6;
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
  background-color: #3498db;
  color: white;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.85rem;
}
</style>
