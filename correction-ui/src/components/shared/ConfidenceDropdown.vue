<!--
  Confidence Dropdown Component
  Feature: 003-correction-ui
  Requirement: FR-006 (filter by confidence score)

  Single dropdown for confidence range selection
-->

<script setup lang="ts">
interface Props {
  modelValue: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 'all',
  label: 'Confidence Score',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const confidenceRanges = [
  { value: 'all', label: 'All Confidence Levels' },
  { value: '0-50', label: '0–50%' },
  { value: '51-70', label: '51–70%' },
  { value: '71-90', label: '71–90%' },
  { value: '91-100', label: '91%+' },
]

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="confidence-dropdown">
    <label class="dropdown-label">{{ label }}</label>
    <select :value="modelValue" @change="handleChange" class="dropdown-select">
      <option v-for="range in confidenceRanges" :key="range.value" :value="range.value">
        {{ range.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.confidence-dropdown {
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
