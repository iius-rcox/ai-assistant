<script setup lang="ts">
/**
 * Pagination Content Component
 * Feature: 010-shadcn-blue-theme
 * Task: T017
 *
 * Container for pagination items. Renders as an unordered list.
 */
</script>

<template>
  <ul class="pagination-content">
    <slot />
  </ul>
</template>

<style scoped>
.pagination-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.25rem;
  list-style: none;
  padding: 0;
  margin: 0;
}
</style>
