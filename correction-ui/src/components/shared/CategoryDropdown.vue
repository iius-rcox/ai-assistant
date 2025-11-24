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
  label: 'Category'
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
    const uniqueCategories = [...new Set(data.map(item => item.category))]
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
      <option
        v-for="category in categories"
        :key="category"
        :value="category"
      >
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
  font-weight: 600;
  font-size: 0.9rem;
  color: #2c3e50;
}

.dropdown-select {
  padding: 0.6rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.dropdown-select:hover:not(:disabled) {
  border-color: #3498db;
}

.dropdown-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.dropdown-select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
}

.loading-text {
  font-size: 0.85rem;
  color: #95a5a6;
  font-style: italic;
}
</style>
