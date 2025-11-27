<!--
  Category Multi-Select Component
  Feature: 003-correction-ui
  Task: T046
  Requirement: FR-006 (filter by category)

  Checkbox list for selecting multiple categories to filter
-->

<script setup lang="ts">
import { computed } from 'vue'
import { CATEGORIES, CATEGORY_LABELS } from '@/types/enums'
import type { Category } from '@/types/enums'

interface Props {
  modelValue: Category[]
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  label: 'Categories',
})

const emit = defineEmits<{
  'update:modelValue': [value: Category[]]
}>()

function handleToggle(category: Category) {
  const current = [...props.modelValue]
  const index = current.indexOf(category)

  if (index > -1) {
    // Remove if already selected
    current.splice(index, 1)
  } else {
    // Add if not selected
    current.push(category)
  }

  emit('update:modelValue', current)
}

function isSelected(category: Category): boolean {
  return props.modelValue.includes(category)
}

function selectAll() {
  emit('update:modelValue', [...CATEGORIES] as Category[])
}

function selectNone() {
  emit('update:modelValue', [])
}
</script>

<template>
  <div class="category-multiselect">
    <div class="multiselect-header">
      <label class="multiselect-label">{{ label }}</label>
      <div class="header-actions">
        <button @click="selectAll" type="button" class="btn-link">All</button>
        <span class="separator">|</span>
        <button @click="selectNone" type="button" class="btn-link">None</button>
      </div>
    </div>

    <div class="checkbox-grid">
      <label
        v-for="category in CATEGORIES"
        :key="category"
        class="checkbox-item"
        :class="{ 'checkbox-selected': isSelected(category) }"
      >
        <input
          type="checkbox"
          :checked="isSelected(category)"
          @change="handleToggle(category)"
          class="checkbox-input"
        />
        <span class="checkbox-label">{{ CATEGORY_LABELS[category] }}</span>
      </label>
    </div>

    <div class="selection-count">{{ modelValue.length }} of {{ CATEGORIES.length }} selected</div>
  </div>
</template>

<style scoped>
.category-multiselect {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.multiselect-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.multiselect-label {
  font-weight: var(--md-sys-typescale-label-large-weight);
  font-size: var(--md-sys-typescale-label-large-size);
  color: var(--md-sys-color-on-surface);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-link {
  background: none;
  border: none;
  color: var(--md-sys-color-primary);
  cursor: pointer;
  font-size: var(--md-sys-typescale-label-medium-size);
  padding: 0.25rem 0.5rem;
  text-decoration: underline;
  transition: var(--md-sys-theme-transition);
}

.btn-link:hover {
  color: var(--md-sys-color-tertiary);
}

.separator {
  color: var(--md-sys-color-outline-variant);
  font-size: var(--md-sys-typescale-label-medium-size);
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: var(--md-sys-color-surface-container-low);
  border-radius: var(--md-sys-shape-corner-small);
  border: 1px solid var(--md-sys-color-outline-variant);
  transition: var(--md-sys-theme-transition);
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: var(--md-sys-shape-corner-extra-small);
  cursor: pointer;
  transition: var(--md-sys-theme-transition);
  user-select: none;
}

.checkbox-item:hover {
  background-color: var(--md-sys-color-primary-container);
}

.checkbox-selected {
  background-color: var(--md-sys-color-primary-container);
}

.checkbox-input {
  cursor: pointer;
  width: 16px;
  height: 16px;
  accent-color: var(--md-sys-color-primary);
}

.checkbox-label {
  font-size: var(--md-sys-typescale-body-medium-size);
  color: var(--md-sys-color-on-surface);
}

.selection-count {
  text-align: right;
  font-size: var(--md-sys-typescale-label-medium-size);
  color: var(--md-sys-color-on-surface-variant);
  font-style: italic;
}

@media (max-width: 768px) {
  .checkbox-grid {
    grid-template-columns: 1fr;
  }
}
</style>
