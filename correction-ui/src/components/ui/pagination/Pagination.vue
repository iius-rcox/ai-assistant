<script setup lang="ts">
/**
 * Pagination Root Component
 * Feature: 010-shadcn-blue-theme
 * Task: T016
 *
 * Root container for pagination. Provides context to child components
 * via Vue's provide/inject system.
 */
import { provide, computed } from 'vue'
import type { PaginationProps, PaginationContext } from '@/types/pagination'
import { PAGINATION_INJECTION_KEY } from '@/types/pagination'

const props = withDefaults(defineProps<PaginationProps>(), {
  siblingCount: 1,
  showEdges: true,
  disabled: false,
  size: 'default',
})

const emit = defineEmits<{
  'update:currentPage': [page: number]
  change: [page: number]
}>()

// Provide context to child components
const context: PaginationContext = {
  currentPage: () => props.currentPage,
  totalPages: () => props.totalPages,
  disabled: () => props.disabled,
  size: () => props.size,
  onPageChange: (page: number) => {
    emit('update:currentPage', page)
    emit('change', page)
  },
}

provide(PAGINATION_INJECTION_KEY, context)

const ariaLabel = computed(() => 'pagination')
</script>

<template>
  <nav
    role="navigation"
    :aria-label="ariaLabel"
    class="pagination"
    :class="[`pagination--${size}`]"
  >
    <slot />
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.25rem;
}

.pagination--sm {
  gap: 0.125rem;
}

.pagination--lg {
  gap: 0.5rem;
}
</style>
