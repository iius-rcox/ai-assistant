<!--
  Summary Stats Component
  Feature: 003-correction-ui
  Task: T063

  Displays correction summary statistics (total, rate %, most corrected category)
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
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.section-title {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #3498db;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
