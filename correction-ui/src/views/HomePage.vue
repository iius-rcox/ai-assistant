<!--
  Home Page (Classification List View)
  Feature: 006-material-design-themes
  Task: T009

  Main landing page with filters and classification list
-->

<script setup lang="ts">
import { ref } from 'vue'
import { useClassificationStore } from '@/stores/classificationStore'
import Filters from '@/components/Filters.vue'
import ClassificationList from '@/components/ClassificationList.vue'

const store = useClassificationStore()
const showFilters = ref(true)

// Handle filter updates (dynamic without page reload)
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

    <!-- Filters panel -->
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
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  border: none;
  border-radius: var(--md-sys-shape-corner-small);
  cursor: pointer;
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: var(--md-sys-theme-transition);
}

.btn-toggle:hover {
  background-color: var(--md-sys-color-primary);
  opacity: 0.9;
}

.btn-toggle:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}

.filter-badge {
  background-color: var(--md-sys-color-on-primary);
  color: var(--md-sys-color-primary);
  padding: 0.15rem 0.5rem;
  border-radius: var(--md-sys-shape-corner-full);
  font-size: var(--md-sys-typescale-label-small-size);
  font-weight: 600;
}
</style>
