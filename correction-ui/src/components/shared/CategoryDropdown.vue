<!--
  Category Dropdown Component
  Feature: 003-correction-ui
  Requirement: FR-006 (filter by category)

  Dynamic dropdown that fetches distinct categories from Supabase
-->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import type { Category } from '@/types/enums'

interface Props {
  modelValue: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 'all',
  label: 'Category',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const categories = ref<string[]>([])
const isLoading = ref(true)

// Fetch distinct categories from database
onMounted(async () => {
  try {
    const { data, error } = await supabase
      .from('classifications')
      .select('category')
      .not('category', 'is', null)

    if (error) throw error

    // Get unique categories
    const uniqueCategories = [
      ...new Set((data as any[]).map(item => item.category).filter((c): c is string => c !== null)),
    ]
    categories.value = uniqueCategories.sort()
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    // Fallback to empty list - "All" option still available
    categories.value = []
  } finally {
    isLoading.value = false
  }
})

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="category-dropdown">
    <label class="dropdown-label">{{ label }}</label>
    <select
      :value="modelValue"
      @change="handleChange"
      :disabled="isLoading"
      class="dropdown-select"
    >
      <option value="all">All Categories</option>
      <option v-for="category in categories" :key="category" :value="category">
        {{ category }}
      </option>
    </select>
    <span v-if="isLoading" class="loading-text">Loading categories...</span>
  </div>
</template>

<style scoped>
.category-dropdown {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dropdown-label {
  font-weight: var(--md-sys-typescale-label-large-weight);
  font-size: var(--md-sys-typescale-label-large-size);
  color: var(--md-sys-color-on-surface);
}

.dropdown-select {
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-small);
  font-size: var(--md-sys-typescale-body-medium-size);
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
  transition: var(--md-sys-theme-transition);
}

.dropdown-select:hover:not(:disabled) {
  border-color: var(--md-sys-color-primary);
}

.dropdown-select:focus {
  outline: none;
  border-color: var(--md-sys-color-primary);
  box-shadow: 0 0 0 3px var(--md-sys-color-primary-container);
}

.dropdown-select:disabled {
  background-color: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface-variant);
  cursor: not-allowed;
  opacity: 0.6;
}

.loading-text {
  font-size: var(--md-sys-typescale-body-small-size);
  color: var(--md-sys-color-on-surface-variant);
  font-style: italic;
}
</style>
