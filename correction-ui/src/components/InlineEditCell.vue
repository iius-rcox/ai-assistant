<!--
  Inline Edit Cell Component
  Feature: 004-inline-edit
  Task: T015
  Requirements: FR-002, FR-003, FR-014, FR-025 through FR-030

  Renders an editable dropdown cell for inline table editing.
  Supports category, urgency, and action field types with proper enum values.

  Reference: research.md Section 5 - Responsive Table Editing
-->

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import {
  CATEGORIES,
  URGENCY_LEVELS,
  ACTION_TYPES,
  CATEGORY_LABELS,
  URGENCY_LABELS,
  ACTION_LABELS
} from '@/types/enums'
import type { Category, UrgencyLevel, ActionType } from '@/types/enums'

/**
 * Props interface for InlineEditCell component
 */
interface Props {
  /** Current value of the field */
  modelValue: string
  /** Type of field being edited (determines available options) */
  fieldType: 'category' | 'urgency' | 'action'
  /** Optional label for the field */
  label?: string
  /** Whether the dropdown is disabled */
  disabled?: boolean
  /** Whether to auto-focus when mounted */
  autoFocus?: boolean
  /** Whether the field is currently being saved */
  isSaving?: boolean
  /** Error message to display */
  error?: string
  /** Compact mode for table cells */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  disabled: false,
  autoFocus: false,
  isSaving: false,
  error: '',
  compact: true
})

const emit = defineEmits<{
  /** Emitted when value changes */
  'update:modelValue': [value: string]
  /** Emitted when field gains focus */
  'focus': []
  /** Emitted when field loses focus */
  'blur': []
  /** Emitted when Enter key is pressed */
  'save': []
  /** Emitted when Escape key is pressed */
  'cancel': []
}>()

// Template ref for the select element
const selectRef = ref<HTMLSelectElement | null>(null)

/**
 * Get options based on field type
 */
const options = computed<readonly string[]>(() => {
  switch (props.fieldType) {
    case 'category':
      return CATEGORIES
    case 'urgency':
      return URGENCY_LEVELS
    case 'action':
      return ACTION_TYPES
    default:
      return []
  }
})

/**
 * Get display labels based on field type
 */
const labels = computed<Record<string, string>>(() => {
  switch (props.fieldType) {
    case 'category':
      return CATEGORY_LABELS
    case 'urgency':
      return URGENCY_LABELS
    case 'action':
      return ACTION_LABELS
    default:
      return {}
  }
})

/**
 * Get the display label for the current value
 */
const displayValue = computed(() => {
  if (!props.modelValue) return ''
  return labels.value[props.modelValue] || props.modelValue
})

/**
 * Whether the component is in a disabled state
 */
const isDisabled = computed(() => {
  return props.disabled || props.isSaving
})

/**
 * Handle change event from select
 */
function handleChange(event: Event): void {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}

/**
 * Handle focus event
 */
function handleFocus(): void {
  emit('focus')
}

/**
 * Handle blur event
 */
function handleBlur(): void {
  emit('blur')
}

/**
 * Handle keydown events for keyboard navigation
 */
function handleKeyDown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'Enter':
      // Prevent form submission, emit save event
      event.preventDefault()
      emit('save')
      break
    case 'Escape':
      // Emit cancel event
      event.preventDefault()
      emit('cancel')
      break
    case 'Tab':
      // Allow natural tab behavior for field navigation
      break
    default:
      // Let other keys work normally (arrow keys for dropdown navigation)
      break
  }
}

/**
 * Focus the select element programmatically
 */
function focus(): void {
  nextTick(() => {
    selectRef.value?.focus()
  })
}

/**
 * Blur the select element programmatically
 */
function blur(): void {
  selectRef.value?.blur()
}

// Auto-focus when mounted if requested
onMounted(() => {
  if (props.autoFocus) {
    focus()
  }
})

// Expose focus/blur methods to parent
defineExpose({
  focus,
  blur,
  selectRef
})
</script>

<template>
  <div
    class="inline-edit-cell"
    :class="{
      'inline-edit-cell--compact': compact,
      'inline-edit-cell--error': error,
      'inline-edit-cell--disabled': isDisabled,
      'inline-edit-cell--saving': isSaving
    }"
  >
    <!-- Optional label (hidden in compact mode) -->
    <label
      v-if="label && !compact"
      class="inline-edit-cell__label"
      :for="`inline-edit-${fieldType}`"
    >
      {{ label }}
    </label>

    <!-- Select dropdown -->
    <div class="inline-edit-cell__select-wrapper">
      <select
        :id="`inline-edit-${fieldType}`"
        ref="selectRef"
        :value="modelValue"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeyDown"
        :disabled="isDisabled"
        class="inline-edit-cell__select"
        :class="{
          'inline-edit-cell__select--error': error,
          'inline-edit-cell__select--saving': isSaving
        }"
        :aria-label="label || `Edit ${fieldType}`"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${fieldType}-error` : undefined"
      >
        <option
          v-for="option in options"
          :key="option"
          :value="option"
        >
          {{ labels[option] || option }}
        </option>
      </select>

      <!-- Loading indicator overlay when saving -->
      <div v-if="isSaving" class="inline-edit-cell__loading">
        <span class="inline-edit-cell__spinner" aria-hidden="true"></span>
      </div>
    </div>

    <!-- Error message -->
    <span
      v-if="error"
      :id="`${fieldType}-error`"
      class="inline-edit-cell__error"
      role="alert"
    >
      {{ error }}
    </span>
  </div>
</template>

<style scoped>
.inline-edit-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  position: relative;
}

.inline-edit-cell--compact {
  gap: 0;
}

.inline-edit-cell__label {
  font-weight: 500;
  font-size: 0.875rem;
  color: #374151;
}

.inline-edit-cell__select-wrapper {
  position: relative;
  display: inline-flex;
}

.inline-edit-cell__select {
  width: 100%;
  min-width: 120px;
  padding: 0.375rem 1.75rem 0.375rem 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: #1f2937;
  background-color: #ffffff;
  border: 1px solid #3b82f6;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

  /* Custom dropdown arrow */
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.25em 1.25em;
}

.inline-edit-cell__select:hover:not(:disabled) {
  border-color: #2563eb;
}

.inline-edit-cell__select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
}

.inline-edit-cell__select:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.7;
}

.inline-edit-cell__select--error {
  border-color: #dc2626;
}

.inline-edit-cell__select--error:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.25);
}

.inline-edit-cell__select--saving {
  color: transparent;
}

/* Loading indicator */
.inline-edit-cell__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 0.375rem;
  pointer-events: none;
}

.inline-edit-cell__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error message */
.inline-edit-cell__error {
  font-size: 0.75rem;
  color: #dc2626;
  margin-top: 0.125rem;
}

/* Compact mode adjustments */
.inline-edit-cell--compact .inline-edit-cell__select {
  padding: 0.25rem 1.5rem 0.25rem 0.375rem;
  font-size: 0.8125rem;
  min-width: 100px;
}

/* Touch-friendly mode (for mobile) */
@media (hover: none) and (pointer: coarse) {
  .inline-edit-cell__select {
    min-height: 44px;
    font-size: 1rem;
    padding: 0.5rem 2rem 0.5rem 0.75rem;
  }
}

/* Focus visible for keyboard navigation */
.inline-edit-cell__select:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* Dark mode support (optional, follows system preference) */
@media (prefers-color-scheme: dark) {
  .inline-edit-cell__label {
    color: #e5e7eb;
  }

  .inline-edit-cell__select {
    background-color: #1f2937;
    color: #f9fafb;
    border-color: #4b5563;
  }

  .inline-edit-cell__select:hover:not(:disabled) {
    border-color: #6b7280;
  }

  .inline-edit-cell__select:disabled {
    background-color: #374151;
  }
}
</style>
