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
  resultCount: null
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'search': [query: string]
  'clear': []
  'focus': []
}>()

// Refs
const inputRef = ref<HTMLInputElement | null>(null)
const localValue = ref(props.modelValue)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// Computed
const hasValue = computed(() => localValue.value.length > 0)
const isQueryValid = computed(() =>
  localValue.value.length === 0 ||
  localValue.value.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH
)
const showResultCount = computed(() =>
  props.resultCount !== null && hasValue.value && !props.isLoading
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
  (newValue) => {
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
    <div
      v-if="!isQueryValid && localValue.length > 0"
      class="search-validation"
      role="alert"
    >
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
  background: var(--color-bg-secondary, #f8f9fa);
  border: 1px solid var(--color-border, #dee2e6);
  border-radius: 8px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus-within {
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 3px var(--color-primary-alpha, rgba(59, 130, 246, 0.1));
}

.search-input.is-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.search-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 12px;
  color: var(--color-text-muted, #6c757d);
}

.search-field {
  flex: 1;
  padding: 10px 12px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--color-text, #212529);
  outline: none;
}

.search-field::placeholder {
  color: var(--color-text-muted, #6c757d);
}

.search-spinner {
  display: flex;
  align-items: center;
  padding-right: 8px;
  color: var(--color-primary, #3b82f6);
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
  font-size: 12px;
  color: var(--color-text-muted, #6c757d);
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
  color: var(--color-text-muted, #6c757d);
  cursor: pointer;
  border-radius: 4px;
  transition: color 0.2s, background-color 0.2s;
}

.search-clear:hover {
  color: var(--color-text, #212529);
  background: var(--color-bg-hover, #e9ecef);
}

.search-clear:focus {
  outline: 2px solid var(--color-primary, #3b82f6);
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
  font-size: 11px;
  font-family: inherit;
  color: var(--color-text-muted, #6c757d);
  background: var(--color-bg, #fff);
  border: 1px solid var(--color-border, #dee2e6);
  border-radius: 4px;
}

.search-validation {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  padding: 4px 12px;
  font-size: 12px;
  color: var(--color-warning, #f59e0b);
  background: var(--color-bg, #fff);
  border: 1px solid var(--color-border, #dee2e6);
  border-top: none;
  border-radius: 0 0 8px 8px;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .search-input {
    background: var(--color-bg-secondary, #1f2937);
    border-color: var(--color-border, #374151);
  }

  .search-field {
    color: var(--color-text, #f3f4f6);
  }

  .search-shortcut kbd {
    background: var(--color-bg, #111827);
    border-color: var(--color-border, #374151);
  }
}
</style>
