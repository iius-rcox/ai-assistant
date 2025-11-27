<script setup lang="ts">
/**
 * Pagination Item Component
 * Feature: 010-shadcn-blue-theme
 * Task: T018
 *
 * List item wrapper for pagination elements.
 */
</script>

<template>
  <li class="pagination-item">
    <slot />
  </li>
</template>

<style scoped>
.pagination-item {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
