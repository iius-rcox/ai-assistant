<!--
  Confidence Slider Component
  Feature: 003-correction-ui
  Task: T044
  Requirement: FR-006 (filter by confidence score)

  Dual-range slider for filtering by confidence score (0.0-1.0)
-->

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  min?: number
  max?: number
  step?: number
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 1,
  step: 0.1,
  label: 'Confidence Score',
})

const emit = defineEmits<{
  'update:min': [value: number]
  'update:max': [value: number]
}>()

function handleMinChange(event: Event) {
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value)
  emit('update:min', value)
}

function handleMaxChange(event: Event) {
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value)
  emit('update:max', value)
}

const minPercent = computed(() => Math.round(props.min * 100))
const maxPercent = computed(() => Math.round(props.max * 100))
</script>

<template>
  <div class="confidence-slider">
    <label class="slider-label">{{ label }}</label>

    <div class="slider-container">
      <div class="slider-values">
        <span class="value-label">Min: {{ minPercent }}%</span>
        <span class="value-label">Max: {{ maxPercent }}%</span>
      </div>

      <div class="slider-inputs">
        <div class="slider-group">
          <label class="input-label">Minimum:</label>
          <input
            type="range"
            :min="0"
            :max="1"
            :step="step"
            :value="min"
            @input="handleMinChange"
            class="slider-input"
          />
          <input
            type="number"
            :min="0"
            :max="1"
            :step="step"
            :value="min"
            @input="handleMinChange"
            class="number-input"
          />
        </div>

        <div class="slider-group">
          <label class="input-label">Maximum:</label>
          <input
            type="range"
            :min="0"
            :max="1"
            :step="step"
            :value="max"
            @input="handleMaxChange"
            class="slider-input"
          />
          <input
            type="number"
            :min="0"
            :max="1"
            :step="step"
            :value="max"
            @input="handleMaxChange"
            class="number-input"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confidence-slider {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slider-label {
  font-weight: var(--md-sys-typescale-label-large-weight);
  font-size: var(--md-sys-typescale-label-large-size);
  color: var(--md-sys-color-on-surface);
}

.slider-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: var(--md-sys-color-surface-container-low);
  border-radius: var(--md-sys-shape-corner-small);
  border: 1px solid var(--md-sys-color-outline-variant);
  transition: var(--md-sys-theme-transition);
}

.slider-values {
  display: flex;
  justify-content: space-between;
  padding: 0 0.5rem;
}

.value-label {
  font-size: var(--md-sys-typescale-label-medium-size);
  color: var(--md-sys-color-on-surface-variant);
  font-weight: var(--md-sys-typescale-label-medium-weight);
}

.slider-inputs {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.slider-group {
  display: grid;
  grid-template-columns: 80px 1fr 80px;
  gap: 0.75rem;
  align-items: center;
}

.input-label {
  font-size: var(--md-sys-typescale-label-medium-size);
  color: var(--md-sys-color-on-surface-variant);
}

.slider-input {
  width: 100%;
  cursor: pointer;
  accent-color: var(--md-sys-color-primary);
}

.slider-input::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: var(--md-sys-shape-corner-full);
  background: var(--md-sys-color-primary);
  cursor: pointer;
  border: 2px solid var(--md-sys-color-surface);
  box-shadow: var(--md-sys-elevation-1);
}

.slider-input::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: var(--md-sys-shape-corner-full);
  background: var(--md-sys-color-primary);
  cursor: pointer;
  border: 2px solid var(--md-sys-color-surface);
  box-shadow: var(--md-sys-elevation-1);
}

.number-input {
  width: 100%;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-extra-small);
  font-size: var(--md-sys-typescale-body-small-size);
  text-align: center;
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  transition: var(--md-sys-theme-transition);
}

.number-input:focus {
  outline: none;
  border-color: var(--md-sys-color-primary);
  box-shadow: 0 0 0 2px var(--md-sys-color-primary-container);
}
</style>
