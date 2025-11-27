<script setup lang="ts">
/**
 * Pagination Ellipsis Component
 * Feature: 010-shadcn-blue-theme
 * Task: T022
 *
 * Visual indicator for truncated page ranges.
 */
import { inject, computed } from 'vue'
import type { PaginationEllipsisProps, PaginationContext } from '@/types/pagination'
import { PAGINATION_INJECTION_KEY } from '@/types/pagination'

const props = withDefaults(defineProps<PaginationEllipsisProps>(), {
  size: 'default',
})

const context = inject<PaginationContext>(PAGINATION_INJECTION_KEY)

const sizeClass = computed(() => {
  const size = props.size || context?.size() || 'default'
  return `pagination-ellipsis--${size}`
})
</script>

<template>
  <span
    class="pagination-ellipsis"
    :class="[sizeClass]"
    aria-hidden="true"
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
      class="pagination-ellipsis__icon"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
    <span class="sr-only">More pages</span>
  </span>
</template>

<style scoped>
.pagination-ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  height: 2.25rem;
  color: hsl(var(--muted-foreground));
}

.pagination-ellipsis__icon {
  width: 1rem;
  height: 1rem;
}

/* Size variants */
.pagination-ellipsis--sm {
  min-width: 1.75rem;
  height: 1.75rem;
}

.pagination-ellipsis--sm .pagination-ellipsis__icon {
  width: 0.75rem;
  height: 0.75rem;
}

.pagination-ellipsis--lg {
  min-width: 2.75rem;
  height: 2.75rem;
}

.pagination-ellipsis--lg .pagination-ellipsis__icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
