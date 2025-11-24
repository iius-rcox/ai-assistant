<!--
  Dropdown Component
  Feature: 003-correction-ui
  Task: T017

  Reusable dropdown for category/urgency/action selection
  Requirements: FR-003, FR-014 (prevent invalid enum values)
-->

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string
  options: readonly string[]
  label?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  labels?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  placeholder: 'Select...',
  disabled: false,
  error: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const displayLabel = computed(() => {
  if (!props.modelValue) return props.placeholder
  return props.labels?.[props.modelValue] || props.modelValue
})

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="dropdown-wrapper">
    <label v-if="label" class="dropdown-label">
      {{ label }}
    </label>
    <select
      :value="modelValue"
      @change="handleChange"
      :disabled="disabled"
      class="dropdown-select"
      :class="{ 'dropdown-error': error }"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option v-for="option in options" :key="option" :value="option">
        {{ labels?.[option] || option }}
      </option>
    </select>
    <span v-if="error" class="error-message">{{ error }}</span>
  </div>
</template>

<style scoped>
.dropdown-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dropdown-label {
  font-weight: 500;
  font-size: 0.9rem;
  color: #2c3e50;
}

.dropdown-select {
  padding: 0.6rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.dropdown-select:hover:not(:disabled) {
  border-color: #3498db;
}

.dropdown-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.dropdown-select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
}

.dropdown-error {
  border-color: #e74c3c;
}

.dropdown-error:focus {
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.error-message {
  color: #e74c3c;
  font-size: 0.85rem;
}
</style>
