<!--
  ConfidenceBar Component (Simplified)
  Feature: 005-table-enhancements
  Tasks: T048, T049, T050, T051
  Requirements: FR-024, FR-025, FR-026, FR-027

  Simple percentage tag with subtle color-coded background
  Green: 80%+, Yellow/Amber: 50-79%, Red: <50%
-->

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** Confidence score from 0 to 1 */
  score: number | null
  /** Compact mode for table cells */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: true,
})

// Convert 0-1 score to percentage
const percentage = computed(() => {
  if (props.score === null || props.score === undefined) return 0
  return Math.round(props.score * 100)
})

// Color threshold classes (FR-025)
// Green: 80%+, Amber: 50-79%, Red: <50%
const colorClass = computed(() => {
  if (percentage.value >= 80) return 'confidence-high'
  if (percentage.value >= 50) return 'confidence-medium'
  return 'confidence-low'
})

// Human-readable confidence level for screen readers
const ariaLabel = computed(() => {
  const level = percentage.value >= 80 ? 'High' : percentage.value >= 50 ? 'Medium' : 'Low'
  return `Confidence: ${percentage.value}% (${level})`
})

// Tooltip text
const tooltipText = computed(() => {
  if (props.score === null) return 'No confidence score'
  const level = percentage.value >= 80 ? 'High' : percentage.value >= 50 ? 'Medium' : 'Low'
  return `${percentage.value}% confidence (${level})`
})
</script>

<template>
  <span
    class="confidence-tag"
    :class="[colorClass, { compact }]"
    :title="tooltipText"
    :aria-label="ariaLabel"
    role="status"
  >
    {{ percentage }}%
  </span>
</template>

<style scoped>
.confidence-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.5rem;
  border-radius: var(--md-sys-shape-corner-small);
  font-size: var(--md-sys-typescale-label-medium-size);
  font-weight: var(--md-sys-typescale-label-medium-weight);
  font-variant-numeric: tabular-nums;
  min-width: 42px;
  transition: var(--md-sys-theme-transition);
}

.confidence-tag.compact {
  padding: 0.2rem 0.4rem;
  font-size: var(--md-sys-typescale-label-small-size);
  min-width: 38px;
}

/* High confidence: subtle green */
.confidence-high {
  background-color: color-mix(in srgb, var(--md-ext-color-success) 15%, transparent);
  color: var(--md-ext-color-success);
}

/* Medium confidence: subtle amber/yellow */
.confidence-medium {
  background-color: color-mix(in srgb, var(--md-ext-color-warning) 15%, transparent);
  color: var(--md-ext-color-warning);
}

/* Low confidence: subtle red */
.confidence-low {
  background-color: color-mix(in srgb, var(--md-sys-color-error) 15%, transparent);
  color: var(--md-sys-color-error);
}

/* Hover effect */
.confidence-tag:hover {
  transform: scale(1.05);
}

/* Focus styling for accessibility */
.confidence-tag:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}
</style>
