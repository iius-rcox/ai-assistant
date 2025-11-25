<!--
  Date Range Dropdown Component
  Feature: 003-correction-ui
  Requirement: FR-006 (filter by date range)

  Preset date range dropdown with common time periods
-->

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 'all',
  label: 'Date Range'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const dateRanges = [
  { value: 'all', label: 'All Time' },
  { value: 'last-week', label: 'Last Week' },
  { value: 'last-15', label: 'Last 15 Days' },
  { value: 'last-30', label: 'Last 30 Days' },
  { value: 'last-45', label: 'Last 45 Days' }
]

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="date-range-dropdown">
    <label class="dropdown-label">{{ label }}</label>
    <select
      :value="modelValue"
      @change="handleChange"
      class="dropdown-select"
    >
      <option
        v-for="range in dateRanges"
        :key="range.value"
        :value="range.value"
      >
        {{ range.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.date-range-dropdown {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dropdown-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #2c3e50;
}

.dropdown-select {
  padding: 0.6rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.dropdown-select:hover {
  border-color: #3498db;
}

.dropdown-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}
</style>
