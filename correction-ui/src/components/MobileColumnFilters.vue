<script setup lang="ts">
/**
 * MobileColumnFilters Component
 * Feature: 008-column-search-filters
 * Task: T035
 *
 * Modal/sheet component for column filtering on mobile devices.
 * Shows all 5 filterable columns in a stacked vertical layout.
 */

import { computed } from 'vue'
import type { ColumnFilterState, FilterableColumn } from '@/types/table-enhancements'
import ColumnSearchInput from './ColumnSearchInput.vue'

// Props
interface Props {
  /** Whether the modal is open */
  isOpen: boolean
  /** Current filter values */
  filters: ColumnFilterState
  /** Number of active filters */
  activeCount: number
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  'update:filter': [column: FilterableColumn, value: string]
  'clear-all': []
}>()

// Config for filter inputs
const filterConfigs = [
  { key: 'subject' as FilterableColumn, label: 'Subject', placeholder: 'Filter by subject...' },
  { key: 'sender' as FilterableColumn, label: 'Sender', placeholder: 'Filter by sender...' },
  { key: 'category' as FilterableColumn, label: 'Category', placeholder: 'Filter by category...' },
  { key: 'urgency' as FilterableColumn, label: 'Urgency', placeholder: 'Filter by urgency...' },
  { key: 'action' as FilterableColumn, label: 'Action', placeholder: 'Filter by action...' },
]

// Computed
const hasFilters = computed(() => props.activeCount > 0)

// Methods
function handleFilterUpdate(column: FilterableColumn, value: string) {
  emit('update:filter', column, value)
}

function handleClearAll() {
  emit('clear-all')
}

function handleClose() {
  emit('close')
}

function isColumnActive(column: FilterableColumn): boolean {
  return props.filters[column].trim().length > 0
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="mobile-filters-overlay" @click.self="handleClose">
        <div class="mobile-filters-sheet" role="dialog" aria-labelledby="mobile-filters-title">
          <!-- Header -->
          <div class="sheet-header">
            <h3 id="mobile-filters-title">Column Filters</h3>
            <button
              type="button"
              class="sheet-close"
              aria-label="Close filters"
              @click="handleClose"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
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

          <!-- Filter Inputs -->
          <div class="sheet-body">
            <div v-for="config in filterConfigs" :key="config.key" class="filter-field">
              <label :for="`mobile-filter-${config.key}`" class="filter-label">
                {{ config.label }}
                <span
                  v-if="isColumnActive(config.key)"
                  class="filter-active-dot"
                  aria-label="Filter active"
                ></span>
              </label>
              <ColumnSearchInput
                :id="`mobile-filter-${config.key}`"
                :model-value="filters[config.key]"
                @update:model-value="v => handleFilterUpdate(config.key, v)"
                :column-label="config.label"
                :placeholder="config.placeholder"
                :is-active="isColumnActive(config.key)"
                :compact="false"
              />
            </div>
          </div>

          <!-- Footer -->
          <div class="sheet-footer">
            <button v-if="hasFilters" type="button" class="btn-clear-all" @click="handleClearAll">
              Clear All Filters ({{ activeCount }})
            </button>
            <button type="button" class="btn-apply" @click="handleClose">Apply Filters</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mobile-filters-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.mobile-filters-sheet {
  width: 100%;
  max-height: 85vh;
  background-color: var(--md-sys-color-surface);
  border-radius: var(--md-sys-shape-corner-large) var(--md-sys-shape-corner-large) 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--md-sys-color-surface-container);
}

.sheet-header h3 {
  margin: 0;
  font-size: var(--md-sys-typescale-title-medium-size);
  font-weight: var(--md-sys-typescale-title-medium-weight);
  color: var(--md-sys-color-on-surface);
}

.sheet-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  color: var(--md-sys-color-on-surface-variant);
  border-radius: var(--md-sys-shape-corner-full);
  cursor: pointer;
  transition: var(--md-sys-theme-transition);
}

.sheet-close:hover {
  background-color: var(--md-sys-color-surface-container-high);
}

.sheet-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  color: var(--md-sys-color-on-surface);
}

.filter-active-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-primary);
}

.sheet-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--md-sys-color-surface-container);
}

.btn-clear-all,
.btn-apply {
  flex: 1;
  padding: 0.875rem 1rem;
  border-radius: var(--md-sys-shape-corner-medium);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  cursor: pointer;
  transition: var(--md-sys-theme-transition);
  min-height: 48px;
}

.btn-clear-all {
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  border: 1px solid var(--md-sys-color-outline);
}

.btn-clear-all:hover {
  background-color: var(--md-sys-color-surface-container-highest);
}

.btn-apply {
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  border: none;
}

.btn-apply:hover {
  opacity: 0.9;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .mobile-filters-sheet,
.modal-leave-active .mobile-filters-sheet {
  transition: transform 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .mobile-filters-sheet {
  transform: translateY(100%);
}

.modal-leave-to .mobile-filters-sheet {
  transform: translateY(100%);
}
</style>
