<!--
  Summary Stats Component
  Feature: 003-correction-ui / 006-material-design-themes
  Task: T063, T059

  Displays correction summary statistics (total, rate %, most corrected category) with M3 theming
-->

<script setup lang="ts">
interface Props {
  totalCorrections: number
  correctionRate: number
  mostCorrectedCategory: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="summary-stats">
    <h3 class="section-title">Correction Summary</h3>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ totalCorrections }}</div>
        <div class="stat-label">Total Corrections</div>
      </div>

      <div class="stat-card">
        <div class="stat-value">{{ correctionRate.toFixed(1) }}%</div>
        <div class="stat-label">Correction Rate</div>
      </div>

      <div class="stat-card">
        <div class="stat-value">{{ mostCorrectedCategory }}</div>
        <div class="stat-label">Most Corrected Category</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.summary-stats {
  background-color: var(--md-sys-color-surface);
  padding: 1.5rem;
  border-radius: var(--md-sys-shape-corner-medium);
  box-shadow: var(--md-sys-elevation-1);
  margin-bottom: 1.5rem;
  border: 1px solid var(--md-sys-color-outline-variant);
  transition: var(--md-sys-theme-transition);
}

.section-title {
  margin: 0 0 1.5rem 0;
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-title-medium-size);
  font-weight: var(--md-sys-typescale-title-medium-weight);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background-color: var(--md-sys-color-surface-container-low);
  padding: 1.5rem;
  border-radius: var(--md-sys-shape-corner-small);
  border: 1px solid var(--md-sys-color-outline-variant);
  text-align: center;
  transition: var(--md-sys-theme-transition);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--md-sys-elevation-2);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--md-sys-color-primary);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: var(--md-sys-typescale-label-medium-size);
  color: var(--md-sys-color-on-surface-variant);
  font-weight: var(--md-sys-typescale-label-medium-weight);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
