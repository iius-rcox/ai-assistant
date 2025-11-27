<script setup lang="ts">
/**
 * Pagination Next Component
 * Feature: 010-shadcn-blue-theme
 * Task: T021
 *
 * Next page navigation button with chevron icon.
 */
import { inject, computed } from 'vue'
import type { PaginationNavigationProps, PaginationContext } from '@/types/pagination'
import { PAGINATION_INJECTION_KEY } from '@/types/pagination'

const props = withDefaults(defineProps<PaginationNavigationProps>(), {
  disabled: false,
  size: 'default',
})

const emit = defineEmits<{
  click: []
}>()

const context = inject<PaginationContext>(PAGINATION_INJECTION_KEY)

const isDisabled = computed(() => {
  if (props.disabled) return true
  if (context?.disabled()) return true
  const currentPage = context?.currentPage() ?? 1
  const totalPages = context?.totalPages() ?? 1
  return currentPage >= totalPages
})

const sizeClass = computed(() => {
  const size = props.size || context?.size() || 'default'
  return `pagination-nav--${size}`
})

function handleClick() {
  if (!isDisabled.value && context) {
    const currentPage = context.currentPage()
    const totalPages = context.totalPages()
    if (currentPage < totalPages) {
      context.onPageChange(currentPage + 1)
      emit('click')
    }
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleClick()
  }
}
</script>

<template>
  <button
    type="button"
    class="pagination-nav pagination-nav--next"
    :class="[sizeClass, { 'pagination-nav--disabled': isDisabled }]"
    :aria-disabled="isDisabled ? 'true' : undefined"
    aria-label="Go to next page"
    :disabled="isDisabled"
    :tabindex="isDisabled ? -1 : 0"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <span class="pagination-nav__text">Next</span>
    <svg
      class="pagination-nav__icon"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  </button>
</template>

<style scoped>
.pagination-nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  height: 2.25rem;
  padding: 0 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius, 0.5rem);
  background-color: transparent;
  color: hsl(var(--foreground));
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    color 150ms ease;
  user-select: none;
}

.pagination-nav:hover:not(:disabled) {
  background-color: hsl(var(--accent));
  border-color: hsl(var(--accent));
}

.pagination-nav:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

.pagination-nav--disabled {
  pointer-events: none;
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-nav__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.pagination-nav__text {
  display: inline;
}

/* Size variants */
.pagination-nav--sm {
  height: 1.75rem;
  padding: 0 0.5rem;
  font-size: 0.75rem;
}

.pagination-nav--sm .pagination-nav__icon {
  width: 0.75rem;
  height: 0.75rem;
}

.pagination-nav--sm .pagination-nav__text {
  display: none;
}

.pagination-nav--lg {
  height: 2.75rem;
  padding: 0 1rem;
  font-size: 1rem;
}

.pagination-nav--lg .pagination-nav__icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Hide text on small screens */
@media (max-width: 640px) {
  .pagination-nav__text {
    display: none;
  }

  .pagination-nav {
    padding: 0 0.5rem;
  }
}
</style>
