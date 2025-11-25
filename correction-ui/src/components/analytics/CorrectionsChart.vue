<!--
  Corrections Chart Component
  Feature: 005-table-enhancements
  Task: T083
  Requirements: FR-040, FR-041

  ApexCharts multi-line chart showing corrections vs classifications trends
-->

<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

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

// Chart options
const chartOptions = computed(() => ({
  chart: {
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
        reset: true
      }
    },
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 400
    },
    events: {
      dataPointSelection: (_event: any, _chartContext: any, config: any) => {
        const date = props.dates[config.dataPointIndex] ?? ''
        const seriesName = config.seriesIndex === 0 ? 'corrections'
          : config.seriesIndex === 1 ? 'classifications' : 'rate'
        emit('point-click', date, seriesName as 'corrections' | 'classifications' | 'rate')
      }
    }
  },
  stroke: {
    curve: 'smooth' as const,
    width: [3, 3, 2]
  },
  colors: ['var(--color-danger, #e74c3c)', 'var(--color-primary, #3498db)', 'var(--color-success, #27ae60)'],
  xaxis: {
    type: 'datetime' as const,
    categories: props.dates.map(d => new Date(d).getTime()),
    title: {
      text: 'Date',
      style: {
        color: 'var(--text-secondary, #495057)'
      }
    },
    labels: {
      format: 'MMM dd',
      style: {
        colors: 'var(--text-secondary, #495057)'
      }
    },
    axisBorder: {
      color: 'var(--border-primary, #dee2e6)'
    },
    axisTicks: {
      color: 'var(--border-primary, #dee2e6)'
    }
  },
  yaxis: [
    {
      title: {
        text: 'Count',
        style: {
          color: 'var(--text-secondary, #495057)'
        }
      },
      labels: {
        formatter: (value: number) => Math.floor(value).toString(),
        style: {
          colors: 'var(--text-secondary, #495057)'
        }
      }
    },
    {
      opposite: true,
      title: {
        text: 'Correction Rate %',
        style: {
          color: 'var(--text-secondary, #495057)'
        }
      },
      labels: {
        formatter: (value: number) => `${value.toFixed(0)}%`,
        style: {
          colors: 'var(--text-secondary, #495057)'
        }
      },
      min: 0,
      max: 100
    }
  ],
  title: {
    text: 'Correction Trends (Last 30 Days)',
    align: 'left' as const,
    style: {
      fontSize: '16px',
      fontWeight: 600,
      color: 'var(--text-primary, #2c3e50)'
    }
  },
  legend: {
    position: 'top' as const,
    horizontalAlign: 'right' as const,
    labels: {
      colors: 'var(--text-primary, #2c3e50)'
    }
  },
  tooltip: {
    shared: true,
    intersect: false,
    theme: document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light',
    x: {
      format: 'MMM dd, yyyy'
    }
  },
  grid: {
    borderColor: 'var(--border-primary, #e0e0e0)',
    strokeDashArray: 4
  },
  markers: {
    size: 4,
    strokeWidth: 2,
    strokeColors: 'var(--bg-primary, #fff)',
    hover: {
      size: 6
    }
  }
}))

// Chart series
const chartSeries = computed(() => [
  {
    name: 'Corrections',
    type: 'line',
    data: props.corrections
  },
  {
    name: 'Classifications',
    type: 'line',
    data: props.classifications
  },
  {
    name: 'Correction Rate',
    type: 'line',
    data: props.rates
  }
])

const hasData = computed(() => props.dates.length > 0)
</script>

<template>
  <div class="corrections-chart">
    <div v-if="!hasData" class="empty-state">
      <p>No trend data available yet. Start classifying and correcting emails to see trends.</p>
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
.corrections-chart {
  background-color: var(--bg-primary, white);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: var(--shadow-sm, 0 2px 4px rgba(0, 0, 0, 0.05));
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-primary, #e0e0e0);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted, #95a5a6);
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
}
</style>
