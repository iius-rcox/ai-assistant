<script setup lang="ts">
/**
 * ColumnHeader Component
 * Feature: 005-table-enhancements
 * Tasks: T018, T019, T020
 *
 * Sortable and resizable table column header with:
 * - Sort indicator (asc/desc)
 * - Click to toggle sort
 * - Resize handle (optional)
 * - ARIA accessibility
 */

import { ref, computed } from 'vue'
import type { ColumnDefinition, SortState, SortDirection } from '@/types/table-enhancements'

// Props
interface Props {
  /** Column definition */
  column: ColumnDefinition
  /** Current sort state */
  sortState: SortState | null
  /** Current column width */
  width?: number
  /** Enable sorting (default: based on column.sortable) */
  sortable?: boolean
  /** Enable resizing (default: based on column.resizable) */
  resizable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  sortable: undefined,
  resizable: undefined
})

// Emits
const emit = defineEmits<{
  /** Emitted when column is clicked for sorting */
  'sort': [columnId: string]
  /** Emitted during resize drag */
  'resize': [columnId: string, width: number]
  /** Emitted when resize completes */
  'resize-end': [columnId: string, width: number]
}>()

// Computed
const isSortable = computed(() =>
  props.sortable !== undefined ? props.sortable : props.column.sortable
)

const isResizable = computed(() =>
  props.resizable !== undefined ? props.resizable : props.column.resizable
)

const isSorted = computed(() =>
  props.sortState?.column === props.column.id
)

const sortDirection = computed((): SortDirection | null => {
  if (!isSorted.value || !props.sortState) return null
  return props.sortState.direction
})

const sortAriaSort = computed(() => {
  if (!isSorted.value) return 'none'
  return sortDirection.value === 'asc' ? 'ascending' : 'descending'
})

// Resize state
const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(0)

// Methods
function handleClick() {
  if (isSortable.value) {
    emit('sort', props.column.id)
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (isSortable.value && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault()
    emit('sort', props.column.id)
  }
}

// Resize handlers
function startResize(event: MouseEvent) {
  if (!isResizable.value) return

  event.preventDefault()
  event.stopPropagation()

  isResizing.value = true
  startX.value = event.clientX
  startWidth.value = props.width ?? props.column.defaultWidth

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function handleResize(event: MouseEvent) {
  if (!isResizing.value) return

  const diff = event.clientX - startX.value
  const newWidth = Math.max(
    props.column.minWidth,
    Math.min(800, startWidth.value + diff)
  )

  emit('resize', props.column.id, newWidth)
}

function stopResize() {
  if (!isResizing.value) return

  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''

  const finalWidth = props.width ?? props.column.defaultWidth
  emit('resize-end', props.column.id, finalWidth)
}
</script>

<template>
  <th
    :class="[
      'column-header',
      {
        'sortable': isSortable,
        'sorted': isSorted,
        'resizable': isResizable,
        'resizing': isResizing
      }
    ]"
    :style="width ? { width: `${width}px` } : undefined"
    :aria-sort="isSortable ? sortAriaSort : undefined"
    :tabindex="isSortable ? 0 : undefined"
    :role="isSortable ? 'columnheader button' : 'columnheader'"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <div class="header-content">
      <!-- Label -->
      <span class="header-label">{{ column.label }}</span>

      <!-- Sort Indicator (T019) -->
      <span v-if="isSortable" class="sort-indicator" :class="{ 'is-active': isSorted }">
        <svg
          v-if="sortDirection === 'asc'"
          class="sort-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
        <svg
          v-else-if="sortDirection === 'desc'"
          class="sort-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <svg
          v-else
          class="sort-icon sort-icon-inactive"
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 4 18 9" />
          <polyline points="6 15 12 20 18 15" />
        </svg>
      </span>
    </div>

    <!-- Resize Handle -->
    <div
      v-if="isResizable"
      class="resize-handle"
      @mousedown="startResize"
      @click.stop
    />
  </th>
</template>

<style scoped>
.column-header {
  position: relative;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--color-text, #2c3e50);
  background-color: var(--color-bg-secondary, #f8f9fa);
  border-bottom: 2px solid var(--color-border, #dee2e6);
  white-space: nowrap;
  user-select: none;
}

/* Sortable styling (T020) */
.column-header.sortable {
  cursor: pointer;
  transition: background-color 0.15s;
}

.column-header.sortable:hover {
  background-color: var(--color-bg-hover, #e9ecef);
}

.column-header.sortable:focus {
  outline: 2px solid var(--color-primary, #3b82f6);
  outline-offset: -2px;
}

.column-header.sorted {
  background-color: var(--color-bg-active, #e8f4fc);
}

/* Header content layout */
.header-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-label {
  flex: 1;
}

/* Sort indicator */
.sort-indicator {
  display: flex;
  align-items: center;
  color: var(--color-text-muted, #6c757d);
  opacity: 0;
  transition: opacity 0.15s;
}

.column-header.sortable:hover .sort-indicator,
.sort-indicator.is-active {
  opacity: 1;
}

.sort-icon {
  transition: transform 0.15s;
}

.sort-icon-inactive {
  opacity: 0.4;
}

.sort-indicator.is-active .sort-icon {
  color: var(--color-primary, #3b82f6);
}

/* Resize handle */
.column-header.resizable {
  padding-right: 1.5rem;
}

.resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  background: transparent;
  transition: background-color 0.15s;
}

.resize-handle:hover,
.column-header.resizing .resize-handle {
  background-color: var(--color-primary, #3b82f6);
}

/* Resizing state */
.column-header.resizing {
  background-color: var(--color-bg-active, #e8f4fc);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .column-header {
    color: var(--color-text, #f3f4f6);
    background-color: var(--color-bg-secondary, #1f2937);
    border-color: var(--color-border, #374151);
  }

  .column-header.sortable:hover {
    background-color: var(--color-bg-hover, #374151);
  }

  .column-header.sorted {
    background-color: var(--color-bg-active, #1e3a5f);
  }
}
</style>
