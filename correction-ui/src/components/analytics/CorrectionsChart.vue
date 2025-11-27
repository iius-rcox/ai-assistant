<!--
  Corrections Chart Component
  Feature: 005-table-enhancements / 006-material-design-themes
  Task: T083, T056
  Requirements: FR-040, FR-041

  ApexCharts multi-line chart showing corrections vs classifications trends with M3 theming
-->

<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { useChartTheme } from '@/composables/useChartTheme'

interface Props {
  dates: string[]
  corrections: number[]
  classifications: number[]
  rates: number[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'point-click': [date: string, type: 'corrections' | 'classifications' | 'rate']
}>()

const { lineChartOptions, getTrendColors, chartColors, isDark } = useChartTheme()

// Chart options with M3 theming
const chartOptions = computed(() => ({
  ...lineChartOptions.value,
  chart: {
    ...lineChartOptions.value.chart,
    id: 'corrections-trends',
    type: 'line' as const,
    toolbar: {
      show: true,
      tools: {
        download: true,
        selection: false,
        zoom: true,
        zoomin: true,
        zoomout: true,
        pan: false,
        reset: true,
      },
    },
    events: {
      dataPointSelection: (_event: any, _chartContext: any, config: any) => {
        const date = props.dates[config.dataPointIndex] ?? ''
        const seriesName =
          config.seriesIndex === 0
            ? 'corrections'
            : config.seriesIndex === 1
              ? 'classifications'
              : 'rate'
        emit('point-click', date, seriesName as 'corrections' | 'classifications' | 'rate')
      },
    },
  },
  stroke: {
    curve: 'smooth' as const,
    width: [3, 3, 2],
  },
  colors: getTrendColors(),
  xaxis: {
    ...lineChartOptions.value.xaxis,
    type: 'datetime' as const,
    categories: props.dates.map(d => new Date(d).getTime()),
    title: {
      text: 'Date',
      style: lineChartOptions.value.xaxis?.title?.style,
    },
    labels: {
      format: 'MMM dd',
      style: lineChartOptions.value.xaxis?.labels?.style,
    },
  },
  yaxis: [
    {
      title: {
        text: 'Count',
        style: lineChartOptions.value.yaxis?.title?.style,
      },
      labels: {
        formatter: (value: number) => Math.floor(value).toString(),
        style: lineChartOptions.value.yaxis?.labels?.style,
      },
    },
    {
      opposite: true,
      title: {
        text: 'Correction Rate %',
        style: lineChartOptions.value.yaxis?.title?.style,
      },
      labels: {
        formatter: (value: number) => `${value.toFixed(0)}%`,
        style: lineChartOptions.value.yaxis?.labels?.style,
      },
      min: 0,
      max: 100,
    },
  ],
  title: {
    text: 'Correction Trends (Last 30 Days)',
    align: 'left' as const,
    style: lineChartOptions.value.title?.style,
  },
  legend: {
    position: 'top' as const,
    horizontalAlign: 'right' as const,
    labels: lineChartOptions.value.legend?.labels,
  },
  tooltip: {
    shared: true,
    intersect: false,
    theme: isDark.value ? 'dark' : 'light',
    x: {
      format: 'MMM dd, yyyy',
    },
  },
  grid: lineChartOptions.value.grid,
  markers: {
    ...lineChartOptions.value.markers,
    strokeColors: chartColors.value.surface,
  },
}))

// Chart series
const chartSeries = computed(() => [
  {
    name: 'Corrections',
    type: 'line',
    data: props.corrections,
  },
  {
    name: 'Classifications',
    type: 'line',
    data: props.classifications,
  },
  {
    name: 'Correction Rate',
    type: 'line',
    data: props.rates,
  },
])

const hasData = computed(() => props.dates.length > 0)
</script>

<template>
  <div class="corrections-chart">
    <div v-if="!hasData" class="empty-state">
      <p>No trend data available yet. Start classifying and correcting emails to see trends.</p>
    </div>

    <VueApexCharts v-else type="line" :options="chartOptions" :series="chartSeries" height="350" />
  </div>
</template>

<style scoped>
.corrections-chart {
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
