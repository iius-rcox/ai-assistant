<!--
  Timeline Chart Component
  Feature: 003-correction-ui
  Task: T065
  Requirement: FR-008

  ApexCharts line chart showing corrections over time
-->

<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { CorrectionTimepoint } from '@/types/models'

interface Props {
  timeline: CorrectionTimepoint[]
}

const props = defineProps<Props>()

// Chart options
const chartOptions = computed(() => ({
  chart: {
    id: 'correction-timeline',
    type: 'line' as const,
    toolbar: {
      show: true,
      tools: {
        download: true,
        zoom: false,
        zoomin: false,
        zoomout: false,
        pan: false,
        reset: false
      }
    },
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 400
    }
  },
  stroke: {
    curve: 'smooth' as const,
    width: 3
  },
  colors: ['#3498db'],
  xaxis: {
    type: 'datetime' as const,
    title: {
      text: 'Date'
    },
    labels: {
      format: 'MMM dd'
    }
  },
  yaxis: {
    title: {
      text: 'Corrections'
    },
    labels: {
      formatter: (value: number) => Math.floor(value).toString()
    }
  },
  title: {
    text: 'Corrections Over Time',
    align: 'left' as const,
    style: {
      fontSize: '16px',
      fontWeight: 600,
      color: '#2c3e50'
    }
  },
  tooltip: {
    x: {
      format: 'MMM dd, yyyy'
    },
    y: {
      formatter: (value: number) => `${value} correction${value !== 1 ? 's' : ''}`
    }
  },
  grid: {
    borderColor: '#e0e0e0',
    strokeDashArray: 4
  },
  markers: {
    size: 4,
    colors: ['#3498db'],
    strokeWidth: 2,
    strokeColors: '#fff'
  }
}))

// Chart series
const chartSeries = computed(() => [
  {
    name: 'Corrections',
    data: props.timeline.map(point => ({
      x: new Date(point.date).getTime(),
      y: point.count
    }))
  }
])

const hasData = computed(() => props.timeline.length > 0)
</script>

<template>
  <div class="timeline-chart">
    <div v-if="!hasData" class="empty-state">
      <p>No correction timeline data available yet.</p>
    </div>

    <VueApexCharts
      v-else
      type="line"
      :options="chartOptions"
      :series="chartSeries"
      height="350"
    />
  </div>
</template>

<style scoped>
.timeline-chart {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #95a5a6;
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
}
</style>
