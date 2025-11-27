<script setup lang="ts">
/**
 * SearchInput Component
 * Feature: 005-table-enhancements
 * Task: T013
 *
 * Debounced search input with clear button, loading state, and result count.
 * Supports keyboard shortcuts (/ to focus, Escape to clear).
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { SEARCH_CONFIG } from '@/constants/table'

// Props
interface Props {
  /** Current search query (v-model) */
  modelValue: string
  /** Placeholder text */
  placeholder?: string
  /** Debounce delay in ms */
  debounceMs?: number
  /** Show loading indicator */
  isLoading?: boolean
  /** Disable input */
  disabled?: boolean
  /** Result count to display */
  resultCount?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search emails...',
  debounceMs: SEARCH_CONFIG.DEBOUNCE_MS,
  isLoading: false,
  disabled: false,
  resultCount: null,
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [query: string]
  clear: []
  focus: []
}>()

// Refs
const inputRef = ref<HTMLInputElement | null>(null)
const localValue = ref(props.modelValue)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// Computed
const hasValue = computed(() => localValue.value.length > 0)
const isQueryValid = computed(
  () => localValue.value.length === 0 || localValue.value.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH
)
const showResultCount = computed(
  () => props.resultCount !== null && hasValue.value && !props.isLoading
)

// Methods
function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  localValue.value = target.value
  emit('update:modelValue', target.value)

  // Debounced search
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(() => {
    if (localValue.value.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      emit('search', localValue.value)
    }
  }, props.debounceMs)
}

function handleClear() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  localValue.value = ''
  emit('update:modelValue', '')
  emit('clear')
  inputRef.value?.focus()
}

function handleFocus() {
  emit('focus')
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

// Global keyboard shortcut handler
function handleGlobalKeydown(event: KeyboardEvent) {
  // Focus search on "/" key (when not in an input)
  if (
    event.key === '/' &&
    !['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName)
  ) {
    event.preventDefault()
    focus()
  }
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

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})

// Expose methods
defineExpose({ focus })
</script>

<template>
  <div class="search-input" :class="{ 'is-loading': isLoading, 'is-disabled': disabled }">
    <!-- Search Icon -->
    <div class="search-icon">
      <slot name="prefix">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </slot>
    </div>

    <!-- Input -->
    <input
      ref="inputRef"
      type="text"
      :value="localValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="search-field"
      role="searchbox"
      aria-label="Search emails"
      :aria-busy="isLoading"
      @input="handleInput"
      @focus="handleFocus"
      @keydown="handleKeydown"
    />

    <!-- Loading Spinner -->
    <div v-if="isLoading" class="search-spinner" aria-hidden="true">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="spinner-icon"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>

    <!-- Result Count -->
    <div v-else-if="showResultCount" class="search-result-count">
      {{ resultCount }} {{ resultCount === 1 ? 'result' : 'results' }}
    </div>

    <!-- Clear Button -->
    <button
      v-if="hasValue && !isLoading"
      type="button"
      class="search-clear"
      aria-label="Clear search"
      @click="handleClear"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
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

    <!-- Keyboard Shortcut Hint -->
    <div v-if="!hasValue && !disabled" class="search-shortcut">
      <kbd>/</kbd>
    </div>

    <!-- Suffix Slot -->
    <slot name="suffix" />

    <!-- Validation Message -->
    <div v-if="!isQueryValid && localValue.length > 0" class="search-validation" role="alert">
      Type at least {{ SEARCH_CONFIG.MIN_QUERY_LENGTH }} characters
    </div>
  </div>
</template>

<style scoped>
.search-input {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 400px;
  background: var(--md-sys-color-surface-container);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-medium);
  transition: var(--md-sys-theme-transition);
}

.search-input:focus-within {
  border-color: var(--md-sys-color-primary);
  outline: none !important;
  box-shadow: none !important;
}

.search-input.is-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.search-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 12px;
  color: var(--md-sys-color-on-surface-variant);
}

.search-field {
  flex: 1;
  padding: 10px 12px;
  border: none;
  background: transparent;
  font-size: var(--md-sys-typescale-body-medium-size);
  color: var(--md-sys-color-on-surface);
  outline: none;
  box-shadow: none;
}

.search-field:focus {
  outline: none !important;
  box-shadow: none !important;
  border: none !important;
}

.search-field::placeholder {
  color: var(--md-sys-color-on-surface-variant);
}

.search-spinner {
  display: flex;
  align-items: center;
  padding-right: 8px;
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

.search-result-count {
  padding-right: 8px;
  font-size: var(--md-sys-typescale-label-small-size);
  color: var(--md-sys-color-on-surface-variant);
  white-space: nowrap;
}

.search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  margin-right: 4px;
  border: none;
  background: transparent;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  border-radius: var(--md-sys-shape-corner-extra-small);
  transition: var(--md-sys-theme-transition);
}

.search-clear:hover {
  color: var(--md-sys-color-on-surface);
  background: var(--md-sys-color-surface-container-high);
}

.search-clear:focus {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}

.search-shortcut {
  display: flex;
  align-items: center;
  padding-right: 12px;
}

.search-shortcut kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: var(--md-sys-typescale-label-small-size);
  font-family: inherit;
  color: var(--md-sys-color-on-surface-variant);
  background: var(--md-sys-color-surface);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-extra-small);
}

.search-validation {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  padding: 4px 12px;
  font-size: var(--md-sys-typescale-label-small-size);
  color: var(--md-ext-color-warning);
  background: var(--md-sys-color-surface);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-top: none;
  border-radius: 0 0 var(--md-sys-shape-corner-medium) var(--md-sys-shape-corner-medium);
}
</style>
