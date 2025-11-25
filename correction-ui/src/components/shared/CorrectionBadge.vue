<!--
  Correction Badge Component
  Feature: 003-correction-ui
  Task: T019
  Requirement: FR-015 (visual indicator for corrected classifications)

  Displays badge indicating manual correction with timestamp
-->

<script setup lang="ts">
import { computed } from 'vue'
import { formatRelativeTime } from '@/utils/formatters'

interface Props {
  correctedTimestamp?: string | null
  correctedBy?: string | null
  variant?: 'small' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  correctedTimestamp: null,
  correctedBy: null,
  variant: 'small'
})

const isCorrected = computed(() => !!props.correctedTimestamp)

const tooltipText = computed(() => {
  if (!props.correctedTimestamp) return ''

  const time = formatRelativeTime(props.correctedTimestamp)
  const by = props.correctedBy || 'unknown'

  return `Corrected ${time} by ${by}`
})
</script>

<template>
  <span
    v-if="isCorrected"
    class="badge"
    :class="[`badge-${variant}`, 'badge-corrected']"
    :title="tooltipText"
  >
    <svg
      v-if="variant === 'large'"
      class="badge-icon"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <span class="badge-text">Corrected</span>
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.badge-corrected {
  background-color: #27ae60;
  color: white;
}

.badge-small {
  padding: 0.2rem 0.5rem;
  font-size: 0.7rem;
}

.badge-large {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

.badge-icon {
  width: 1rem;
  height: 1rem;
}

.badge-small .badge-icon {
  width: 0.85rem;
  height: 0.85rem;
}

.badge-text {
  line-height: 1;
}

/* Tooltip on hover */
.badge {
  cursor: help;
  position: relative;
}
</style>
