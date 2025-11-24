<!--
  Home Page (Classification List View)
  Feature: 003-correction-ui
  Tasks: T039, T052, T053

  Main landing page with filters and classification list
-->

<script setup lang="ts">
import { ref } from 'vue'
import { useClassificationStore } from '@/stores/classificationStore'
import Filters from '@/components/Filters.vue'
import ClassificationList from '@/components/ClassificationList.vue'

const store = useClassificationStore()
const showFilters = ref(true)

// Handle filter updates (T053 - FR-007: dynamic without page reload)
function handleFilterUpdate(newFilters: any) {
  store.setFilters(newFilters)
}

// Handle clear filters
function handleClearFilters() {
  store.clearFilters()
}

// Toggle filter panel visibility
function toggleFilters() {
  showFilters.value = !showFilters.value
}
</script>

<template>
  <div class="home-page">
    <!-- Filter toggle button -->
    <div class="filter-toggle">
      <button @click="toggleFilters" class="btn-toggle">
        {{ showFilters ? '▼' : '▶' }} {{ showFilters ? 'Hide' : 'Show' }} Filters
        <span v-if="Object.keys(store.filters).length > 0" class="filter-badge">
          {{ Object.keys(store.filters).length }}
        </span>
      </button>
    </div>

    <!-- Filters panel (T052) -->
    <Filters
      v-if="showFilters"
      :filters="store.filters"
      @update:filters="handleFilterUpdate"
      @apply="handleFilterUpdate"
      @clear="handleClearFilters"
    />

    <!-- Classification list -->
    <ClassificationList />
  </div>
</template>

<style scoped>
.home-page {
  width: 100%;
}

.filter-toggle {
  margin-bottom: 1rem;
}

.btn-toggle {
  padding: 0.6rem 1.2rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.btn-toggle:hover {
  background-color: #2980b9;
}

.filter-badge {
  background-color: rgba(255, 255, 255, 0.3);
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
}
</style>

