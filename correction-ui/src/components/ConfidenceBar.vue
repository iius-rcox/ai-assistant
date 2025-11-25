<!--
  ConfidenceBar Component
  Feature: 005-table-enhancements
  Tasks: T048, T049, T050, T051
  Requirements: FR-024, FR-025, FR-026, FR-027

  Visual progress bar showing classification confidence with color thresholds
-->

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** Confidence score from 0 to 1 */
  score: number | null
  /** Show percentage text label */
  showLabel?: boolean
  /** Compact mode for table cells */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: true,
  compact: true
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

// Accessibility pattern class (FR-026)
// Different patterns for color-blind users
const patternClass = computed(() => {
  if (percentage.value >= 80) return 'pattern-solid'
  if (percentage.value >= 50) return 'pattern-stripes'
  return 'pattern-dots'
})

// Human-readable confidence level for screen readers
const ariaLabel = computed(() => {
  const level = percentage.value >= 80 ? 'High' : percentage.value >= 50 ? 'Medium' : 'Low'
  return `Confidence: ${percentage.value}% (${level})`
})

// Tooltip text (FR-027)
const tooltipText = computed(() => {
  if (props.score === null) return 'No confidence score'
  return `${percentage.value}% confidence`
})
</script>

<template>
  <div
    class="confidence-bar-container"
    :class="{ compact }"
    :title="tooltipText"
    role="progressbar"
    :aria-valuenow="percentage"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="ariaLabel"
  >
    <div class="confidence-track">
      <div
        class="confidence-fill"
        :class="[colorClass, patternClass]"
        :style="{ width: `${percentage}%` }"
      ></div>
    </div>
    <span v-if="showLabel" class="confidence-label" :class="colorClass">
      {{ percentage }}%
    </span>
  </div>
</template>

<style scoped>
.confidence-bar-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 80px;
}

.confidence-bar-container.compact {
  min-width: 60px;
  gap: 0.35rem;
}

.confidence-track {
  flex: 1;
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.compact .confidence-track {
  height: 6px;
}

.confidence-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease, background-color 0.2s ease;
  position: relative;
}

/* Color thresholds (FR-025) */
.confidence-high {
  background-color: #27ae60;
}

.confidence-medium {
  background-color: #f39c12;
}

.confidence-low {
  background-color: #e74c3c;
}

/* Accessibility patterns for color-blind users (FR-026) */
.pattern-solid {
  /* Solid fill for high confidence */
}

.pattern-stripes {
  /* Diagonal stripes for medium confidence */
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 2px,
    rgba(255, 255, 255, 0.3) 2px,
    rgba(255, 255, 255, 0.3) 4px
  );
}

.pattern-dots {
  /* Dotted pattern for low confidence */
  background-image: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.4) 1px,
    transparent 1px
  );
  background-size: 4px 4px;
}

/* Label styling */
.confidence-label {
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 32px;
  text-align: right;
}

.compact .confidence-label {
  font-size: 0.7rem;
  min-width: 28px;
}

.confidence-label.confidence-high {
  color: #27ae60;
}

.confidence-label.confidence-medium {
  color: #d68910;
}

.confidence-label.confidence-low {
  color: #e74c3c;
}

/* Hover effect to show exact percentage (FR-027) */
.confidence-bar-container:hover .confidence-track {
  transform: scaleY(1.2);
}

.confidence-bar-container:hover .confidence-fill {
  filter: brightness(1.1);
}

/* Focus styling for accessibility */
.confidence-bar-container:focus-visible {
  outline: 2px solid #3498db;
  outline-offset: 2px;
  border-radius: 4px;
}
</style>
