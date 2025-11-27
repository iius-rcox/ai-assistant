<!--
  Timeline Chart Component
  Feature: 003-correction-ui / 006-material-design-themes
  Task: T065, T057
  Requirement: FR-008

  ApexCharts line chart showing corrections over time with M3 theming
-->

<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { useChartTheme } from '@/composables/useChartTheme'
import type { CorrectionTimepoint } from '@/types/models'

interface Props {
  timeline: CorrectionTimepoint[]
}

const props = defineProps<Props>()

const { lineChartOptions, chartColors, isDark } = useChartTheme()

// Chart options with M3 theming
const chartOptions = computed(() => ({
  ...lineChartOptions.value,
  chart: {
    ...lineChartOptions.value.chart,
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
        reset: false,
      },
    },
  },
  stroke: lineChartOptions.value.stroke,
  colors: [chartColors.value.primary],
  xaxis: {
    ...lineChartOptions.value.xaxis,
    type: 'datetime' as const,
    title: {
      text: 'Date',
      style: lineChartOptions.value.xaxis?.title?.style,
    },
    labels: {
      format: 'MMM dd',
      style: lineChartOptions.value.xaxis?.labels?.style,
    },
  },
  yaxis: {
    ...lineChartOptions.value.yaxis,
    title: {
      text: 'Corrections',
      style: lineChartOptions.value.yaxis?.title?.style,
    },
    labels: {
      formatter: (value: number) => Math.floor(value).toString(),
      style: lineChartOptions.value.yaxis?.labels?.style,
    },
  },
  title: {
    text: 'Corrections Over Time',
    align: 'left' as const,
    style: lineChartOptions.value.title?.style,
  },
  tooltip: {
    theme: isDark.value ? 'dark' : 'light',
    x: {
      format: 'MMM dd, yyyy',
    },
    y: {
      formatter: (value: number) => `${value} correction${value !== 1 ? 's' : ''}`,
    },
  },
  grid: lineChartOptions.value.grid,
  markers: {
    ...lineChartOptions.value.markers,
    colors: [chartColors.value.primary],
    strokeColors: chartColors.value.surface,
  },
}))

// Chart series
const chartSeries = computed(() => [
  {
    name: 'Corrections',
    data: props.timeline.map(point => ({
      x: new Date(point.date).getTime(),
      y: point.count,
    })),
  },
])

const hasData = computed(() => props.timeline.length > 0)
</script>

<template>
  <div class="timeline-chart">
    <div v-if="!hasData" class="empty-state">
      <p>No correction timeline data available yet.</p>
    </div>

    <VueApexCharts v-else type="line" :options="chartOptions" :series="chartSeries" height="350" />
  </div>
</template>

<style scoped>
.timeline-chart {
  background-color: var(--md-sys-color-surface);
  padding: 1.5rem;
  border-radius: var(--md-sys-shape-corner-medium);
  box-shadow: var(--md-sys-elevation-1);
  margin-bottom: 1.5rem;
  border: 1px solid var(--md-sys-color-outline-variant);
  transition: var(--md-sys-theme-transition);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--md-sys-color-on-surface-variant);
}

.empty-state p {
  margin: 0;
  font-size: var(--md-sys-typescale-body-medium-size);
}
</style>
