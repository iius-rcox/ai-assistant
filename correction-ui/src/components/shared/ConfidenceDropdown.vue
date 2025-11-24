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
  label: 'Confidence Score'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const confidenceRanges = [
  { value: 'all', label: 'All Confidence Levels' },
  { value: '0-50', label: '0–50%' },
  { value: '51-70', label: '51–70%' },
  { value: '71-90', label: '71–90%' },
  { value: '91-100', label: '91%+' }
]

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="confidence-dropdown">
    <label class="dropdown-label">{{ label }}</label>
    <select
      :value="modelValue"
      @change="handleChange"
      class="dropdown-select"
    >
      <option
        v-for="range in confidenceRanges"
        :key="range.value"
        :value="range.value"
      >
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
