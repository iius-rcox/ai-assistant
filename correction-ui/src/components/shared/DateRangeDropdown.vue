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
  label: 'Date Range',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const dateRanges = [
  { value: 'all', label: 'All Time' },
  { value: 'last-week', label: 'Last Week' },
  { value: 'last-15', label: 'Last 15 Days' },
  { value: 'last-30', label: 'Last 30 Days' },
  { value: 'last-45', label: 'Last 45 Days' },
]

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="date-range-dropdown">
    <label class="dropdown-label">{{ label }}</label>
    <select :value="modelValue" @change="handleChange" class="dropdown-select">
      <option v-for="range in dateRanges" :key="range.value" :value="range.value">
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
  font-weight: var(--md-sys-typescale-label-large-weight);
  font-size: var(--md-sys-typescale-label-large-size);
  color: var(--md-sys-color-on-surface);
}

.dropdown-select {
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-small);
  font-size: var(--md-sys-typescale-body-medium-size);
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
  transition: var(--md-sys-theme-transition);
}

.dropdown-select:hover {
  border-color: var(--md-sys-color-primary);
}

.dropdown-select:focus {
  outline: none;
  border-color: var(--md-sys-color-primary);
  box-shadow: 0 0 0 3px var(--md-sys-color-primary-container);
}
</style>
