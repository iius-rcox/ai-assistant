<script setup lang="ts">
/**
 * Pagination Link Component
 * Feature: 010-shadcn-blue-theme
 * Task: T019
 *
 * Clickable page number button. Supports active and disabled states.
 */
import { inject, computed } from 'vue'
import type { PaginationLinkProps, PaginationContext } from '@/types/pagination'
import { PAGINATION_INJECTION_KEY } from '@/types/pagination'

const props = withDefaults(defineProps<PaginationLinkProps>(), {
  isActive: false,
  disabled: false,
  size: 'default',
})

const emit = defineEmits<{
  click: [page: number]
}>()

const context = inject<PaginationContext>(PAGINATION_INJECTION_KEY)

const isDisabled = computed(() => props.disabled || context?.disabled())

const sizeClass = computed(() => {
  const size = props.size || context?.size() || 'default'
  return `pagination-link--${size}`
})

function handleClick() {
  if (!isDisabled.value) {
    context?.onPageChange(props.page)
    emit('click', props.page)
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
    class="pagination-link"
    :class="[
      sizeClass,
      {
        'pagination-link--active': isActive,
        'pagination-link--disabled': isDisabled,
      },
    ]"
    :aria-current="isActive ? 'page' : undefined"
    :aria-disabled="isDisabled ? 'true' : undefined"
    :aria-label="`Go to page ${page}`"
    :disabled="isDisabled"
    :tabindex="isDisabled ? -1 : 0"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <slot>{{ page }}</slot>
  </button>
</template>

<style scoped>
.pagination-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 0.5rem;
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

.pagination-link:hover:not(:disabled) {
  background-color: hsl(var(--accent));
  border-color: hsl(var(--accent));
}

.pagination-link:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

.pagination-link--active {
  background-color: hsl(var(--primary));
  border-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.pagination-link--active:hover:not(:disabled) {
  background-color: hsl(var(--primary));
  border-color: hsl(var(--primary));
  opacity: 0.9;
}

.pagination-link--disabled {
  pointer-events: none;
  opacity: 0.5;
  cursor: not-allowed;
}

/* Size variants */
.pagination-link--sm {
  min-width: 1.75rem;
  height: 1.75rem;
  padding: 0 0.375rem;
  font-size: 0.75rem;
}

.pagination-link--lg {
  min-width: 2.75rem;
  height: 2.75rem;
  padding: 0 0.75rem;
  font-size: 1rem;
}
</style>
