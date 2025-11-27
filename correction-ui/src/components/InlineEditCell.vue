<!--
  Inline Edit Cell Component
  Feature: 004-inline-edit, 007-instant-edit-undo
  Tasks: T015 (004), T012-T014 (007)
  Requirements: FR-002, FR-003, FR-014, FR-025 through FR-030

  Renders an editable dropdown cell for inline table editing.
  Supports category, urgency, and action field types with proper enum values.

  007-instant-edit-undo:
  - T012: Emits 'instant-save' event on dropdown change
  - T013: Tracks previousValue for undo support
  - T014: Removes dependency on parent save button

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
  ACTION_LABELS,
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
  /** Classification record ID for instant save (T012) */
  recordId?: number
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
  /** Enable instant save mode (007-instant-edit-undo) */
  instantSaveEnabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  recordId: undefined,
  label: '',
  disabled: false,
  autoFocus: false,
  isSaving: false,
  error: '',
  compact: true,
  instantSaveEnabled: false,
})

const emit = defineEmits<{
  /** Emitted when value changes */
  'update:modelValue': [value: string]
  /** Emitted when field gains focus */
  focus: []
  /** Emitted when field loses focus */
  blur: []
  /** Emitted when Enter key is pressed */
  save: []
  /** Emitted when Escape key is pressed */
  cancel: []
  /** T012: Emitted for instant save - includes field, new value, and previous value */
  'instant-save': [
    field: 'category' | 'urgency' | 'action',
    newValue: string,
    previousValue: string,
  ]
}>()

// Template ref for the select element
const selectRef = ref<HTMLSelectElement | null>(null)

// T013: Track previous value for undo support
const previousValue = ref(props.modelValue)

// Update previousValue when modelValue prop changes (for external updates)
watch(
  () => props.modelValue,
  newVal => {
    // Only update if not currently saving (to preserve undo value during save)
    if (!props.isSaving) {
      previousValue.value = newVal
    }
  }
)

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
 * T012: Modified to emit instant-save when enabled
 */
function handleChange(event: Event): void {
  const target = event.target as HTMLSelectElement
  const newValue = target.value

  // Always emit update:modelValue for v-model binding
  emit('update:modelValue', newValue)

  // T012: If instant save is enabled, emit instant-save event
  if (props.instantSaveEnabled && newValue !== previousValue.value) {
    emit('instant-save', props.fieldType, newValue, previousValue.value)
    // Note: previousValue will be updated after successful save via the watch above
  }
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

/**
 * T013: Revert to a specific value (for undo support)
 * Updates the previousValue tracker to the reverted value
 */
function revert(value: string): void {
  previousValue.value = value
}

// Auto-focus when mounted if requested
onMounted(() => {
  if (props.autoFocus) {
    focus()
  }
})

// Expose focus/blur/revert methods to parent
defineExpose({
  focus,
  blur,
  revert, // T013: Expose revert for undo support
  selectRef,
})
</script>

<template>
  <div
    class="inline-edit-cell"
    :class="{
      'inline-edit-cell--compact': compact,
      'inline-edit-cell--error': error,
      'inline-edit-cell--disabled': isDisabled,
      'inline-edit-cell--saving': isSaving,
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
          'inline-edit-cell__select--saving': isSaving,
        }"
        :aria-label="label || `Edit ${fieldType}`"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${fieldType}-error` : undefined"
      >
        <option v-for="option in options" :key="option" :value="option">
          {{ labels[option] || option }}
        </option>
      </select>

      <!-- Loading indicator overlay when saving -->
      <div v-if="isSaving" class="inline-edit-cell__loading">
        <span class="inline-edit-cell__spinner" aria-hidden="true"></span>
      </div>
    </div>

    <!-- Error message -->
    <span v-if="error" :id="`${fieldType}-error`" class="inline-edit-cell__error" role="alert">
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
  font-weight: var(--md-sys-typescale-label-large-weight);
  font-size: var(--md-sys-typescale-label-large-size);
  color: var(--md-sys-color-on-surface);
}

.inline-edit-cell__select-wrapper {
  position: relative;
  display: inline-flex;
}

.inline-edit-cell__select {
  width: 100%;
  min-width: 120px;
  padding: 0.375rem 1.75rem 0.375rem 0.5rem;
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: 1.25rem;
  color: var(--md-sys-color-on-surface);
  background-color: var(--md-sys-color-surface);
  border: 1px solid var(--md-sys-color-primary);
  border-radius: var(--md-sys-shape-corner-small);
  cursor: pointer;
  transition: var(--md-sys-theme-transition);

  /* Custom dropdown arrow */
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2379747e' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.25em 1.25em;
}

.inline-edit-cell__select:hover:not(:disabled) {
  border-color: var(--md-sys-color-primary);
  background-color: var(--md-sys-color-surface-container-low);
}

.inline-edit-cell__select:focus {
  outline: none;
  border-color: var(--md-sys-color-primary);
  box-shadow: 0 0 0 3px var(--md-sys-color-primary-container);
}

.inline-edit-cell__select:disabled {
  background-color: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface-variant);
  cursor: not-allowed;
  opacity: var(--md-sys-state-disabled-opacity);
}

.inline-edit-cell__select--error {
  border-color: var(--md-sys-color-error);
}

.inline-edit-cell__select--error:focus {
  box-shadow: 0 0 0 3px var(--md-sys-color-error-container);
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
  background-color: var(--md-sys-color-surface);
  opacity: 0.7;
  border-radius: var(--md-sys-shape-corner-small);
  pointer-events: none;
}

.inline-edit-cell__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--md-sys-color-outline-variant);
  border-top-color: var(--md-sys-color-primary);
  border-radius: var(--md-sys-shape-corner-full);
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error message */
.inline-edit-cell__error {
  font-size: var(--md-sys-typescale-label-small-size);
  color: var(--md-sys-color-error);
  margin-top: 0.125rem;
}

/* Compact mode adjustments */
.inline-edit-cell--compact .inline-edit-cell__select {
  padding: 0.25rem 1.5rem 0.25rem 0.375rem;
  font-size: var(--md-sys-typescale-body-small-size);
  min-width: 100px;
}

/* Touch-friendly mode (for mobile) */
@media (hover: none) and (pointer: coarse) {
  .inline-edit-cell__select {
    min-height: 44px;
    font-size: var(--md-sys-typescale-body-large-size);
    padding: 0.5rem 2rem 0.5rem 0.75rem;
  }
}

/* Focus visible for keyboard navigation */
.inline-edit-cell__select:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}
</style>
