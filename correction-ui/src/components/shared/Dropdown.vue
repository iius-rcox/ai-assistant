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
  error: '',
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
  font-weight: var(--md-sys-typescale-label-large-weight);
  font-size: var(--md-sys-typescale-label-large-size);
  color: var(--md-sys-color-on-surface);
}

.dropdown-select {
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-small);
  font-size: var(--md-sys-typescale-body-large-size);
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
  transition: var(--md-sys-theme-transition);
}

.dropdown-select:hover:not(:disabled) {
  border-color: var(--md-sys-color-primary);
}

.dropdown-select:focus {
  outline: none;
  border-color: var(--md-sys-color-primary);
  box-shadow: 0 0 0 3px var(--md-sys-color-primary-container);
}

.dropdown-select:disabled {
  background-color: var(--md-sys-color-surface-container);
  cursor: not-allowed;
  opacity: 0.5;
}

.dropdown-error {
  border-color: var(--md-sys-color-error);
}

.dropdown-error:focus {
  box-shadow: 0 0 0 3px var(--md-sys-color-error-container);
}

.error-message {
  color: var(--md-sys-color-error);
  font-size: var(--md-sys-typescale-body-small-size);
}
</style>
