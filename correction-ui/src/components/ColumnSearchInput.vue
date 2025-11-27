<script setup lang="ts">
/**
 * ColumnSearchInput Component
 * Feature: 008-column-search-filters
 * Tasks: T011-T014, T029, T031, T032
 *
 * A compact search input designed for column header filtering.
 * Provides debounced input, clear button, and active state indicator.
 */

import { ref, computed, watch } from 'vue'

// Props
interface Props {
  /** Current filter value (v-model) */
  modelValue: string
  /** Placeholder text when empty */
  placeholder?: string
  /** Column label for accessibility */
  columnLabel: string
  /** Disable the input */
  disabled?: boolean
  /** Show loading spinner */
  isLoading?: boolean
  /** Visual indicator that filter is active */
  isActive?: boolean
  /** Compact mode (smaller padding/height) */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Filter...',
  disabled: false,
  isLoading: false,
  isActive: false,
  compact: true,
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
  clear: []
  focus: []
  blur: []
}>()

// Refs
const inputRef = ref<HTMLInputElement | null>(null)
const localValue = ref(props.modelValue)

// Computed
const hasValue = computed(() => localValue.value.length > 0)
const ariaLabel = computed(() => `Filter by ${props.columnLabel}`)

// Methods
function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  localValue.value = target.value
  emit('update:modelValue', target.value)
}

function handleClear() {
  localValue.value = ''
  emit('update:modelValue', '')
  emit('clear')
  inputRef.value?.focus()
}

function handleFocus() {
  emit('focus')
}

function handleBlur() {
  emit('blur')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && hasValue.value) {
    event.preventDefault()
    handleClear()
  }
}

function focus() {
  inputRef.value?.focus()
}

function blur() {
  inputRef.value?.blur()
}

function clear() {
  handleClear()
}

// Watch for external modelValue changes
watch(
  () => props.modelValue,
  newValue => {
    if (newValue !== localValue.value) {
      localValue.value = newValue
    }
  }
)

// Expose methods
defineExpose({ focus, blur, clear })
</script>

<template>
  <div
    class="column-search-input"
    :class="{
      'is-active': isActive || hasValue,
      'is-disabled': disabled,
      'is-loading': isLoading,
      'is-compact': compact,
    }"
  >
    <!-- Input -->
    <input
      ref="inputRef"
      type="text"
      :value="localValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="column-filter-field"
      role="searchbox"
      :aria-label="ariaLabel"
      :aria-busy="isLoading"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown="handleKeydown"
    />

    <!-- Loading Spinner -->
    <div v-if="isLoading" class="column-filter-spinner" aria-hidden="true">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="spinner-icon"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>

    <!-- Clear Button -->
    <button
      v-else-if="hasValue && !disabled"
      type="button"
      class="column-filter-clear"
      aria-label="Clear filter"
      @click="handleClear"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.column-search-input {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  background: var(--md-sys-color-surface-container);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-small);
  transition: var(--md-sys-theme-transition);
}

.column-search-input.is-compact {
  height: 32px;
}

.column-search-input:focus-within {
  border-color: var(--md-sys-color-primary);
}

.column-search-input.is-active {
  border-color: var(--md-sys-color-primary);
  background-color: var(--md-sys-color-primary-container);
}

.column-search-input.is-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.column-filter-field {
  flex: 1;
  width: 100%;
  min-width: 0;
  padding: 4px 8px;
  border: none !important;
  background: transparent !important;
  font-size: var(--md-sys-typescale-body-small-size);
  color: var(--md-sys-color-on-surface);
  outline: none !important;
  box-shadow: none !important;
}

.column-filter-field::placeholder {
  color: var(--md-sys-color-on-surface-variant);
}

.column-filter-field:focus {
  outline: none !important;
  border: none !important;
  box-shadow: none !important;
}

.column-filter-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: 6px;
  color: var(--md-sys-color-primary);
}

.spinner-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.column-filter-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  margin-right: 2px;
  border: none;
  background: transparent;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  border-radius: var(--md-sys-shape-corner-extra-small);
  transition: var(--md-sys-theme-transition);
  min-width: 24px;
  min-height: 24px;
}

.column-filter-clear:hover {
  color: var(--md-sys-color-on-surface);
  background: var(--md-sys-color-surface-container-high);
}

.column-filter-clear:focus {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 1px;
}

/* Responsive - ensure touch targets on mobile */
@media (max-width: 768px) {
  .column-filter-clear {
    min-width: 44px;
    min-height: 44px;
    padding: 10px;
  }

  .column-search-input.is-compact {
    height: 44px;
  }

  .column-filter-field {
    padding: 10px 8px;
    font-size: var(--md-sys-typescale-body-medium-size);
  }
}
</style>
