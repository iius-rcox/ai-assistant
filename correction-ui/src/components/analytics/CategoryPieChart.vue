<!--
  Category Pie Chart Component
  Feature: 005-table-enhancements
  Task: T084
  Requirements: FR-040, FR-042

  ApexCharts pie/donut chart showing category distribution
-->

<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

interface Props {
  categories: string[]
  counts: number[]
  percentages: number[]
  chartType?: 'pie' | 'donut'
}

const props = withDefaults(defineProps<Props>(), {
  chartType: 'donut'
})

const emit = defineEmits<{
  'slice-click': [category: string, count: number]
}>()

// Category colors matching theme
const categoryColors: Record<string, string> = {
  KIDS: 'var(--badge-kids, #9b59b6)',
  ROBYN: 'var(--badge-robyn, #e91e63)',
  WORK: 'var(--badge-work, #3498db)',
  FINANCIAL: 'var(--badge-financial, #27ae60)',
  SHOPPING: 'var(--badge-shopping, #f39c12)',
  OTHER: 'var(--badge-other, #95a5a6)'
}

const colors = computed(() =>
  props.categories.map(cat => categoryColors[cat] || 'var(--badge-other, #95a5a6)')
)

// Chart options
const chartOptions = computed(() => ({
  chart: {
    id: 'category-distribution',
    type: props.chartType,
    toolbar: {
      show: true
    },
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 400
    },
    events: {
      dataPointSelection: (_event: any, _chartContext: any, config: any) => {
        const category = props.categories[config.dataPointIndex] ?? ''
        const count = props.counts[config.dataPointIndex] ?? 0
        emit('slice-click', category, count)
      }
    }
  },
  labels: props.categories,
  colors: colors.value,
  title: {
    text: 'Category Distribution',
    align: 'left' as const,
    style: {
      fontSize: '16px',
      fontWeight: 600,
      color: 'var(--text-primary, #2c3e50)'
    }
  },
  legend: {
    position: 'bottom' as const,
    horizontalAlign: 'center' as const,
    labels: {
      colors: 'var(--text-primary, #2c3e50)'
    },
    markers: {
      size: 12,
      strokeWidth: 0
    }
  },
  plotOptions: {
    pie: {
      donut: {
        size: props.chartType === 'donut' ? '55%' : '0%',
        labels: {
          show: props.chartType === 'donut',
          name: {
            show: true,
            fontSize: '14px',
            color: 'var(--text-primary, #2c3e50)'
          },
          value: {
            show: true,
            fontSize: '22px',
            fontWeight: 600,
            color: 'var(--text-primary, #2c3e50)',
            formatter: (val: string) => val
          },
          total: {
            show: true,
            label: 'Total',
            fontSize: '12px',
            color: 'var(--text-muted, #6c757d)',
            formatter: () => props.counts.reduce((a, b) => a + b, 0).toString()
          }
        }
      },
      expandOnClick: true
    }
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => `${val.toFixed(1)}%`,
    style: {
      fontSize: '12px',
      fontWeight: 500
    },
    dropShadow: {
      enabled: false
    }
  },
  tooltip: {
    enabled: true,
    theme: document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light',
    y: {
      formatter: (val: number, opts: any) => {
        const idx = opts.seriesIndex
        return `${val} emails (${props.percentages[idx]?.toFixed(1) || 0}%)`
      }
    }
  },
  stroke: {
    width: 2,
    colors: ['var(--bg-primary, #fff)']
  },
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: {
          height: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }
  ]
}))

const hasData = computed(() => props.categories.length > 0 && props.counts.some(c => c > 0))
</script>

<template>
  <div class="category-chart">
    <div v-if="!hasData" class="empty-state">
      <p>No category data available yet. Classifications will appear here.</p>
    </div>

    <VueApexCharts
      v-else
      :type="chartType"
      :options="chartOptions"
      :series="counts"
      height="350"
    />

    <!-- Category legend with counts -->
    <div v-if="hasData" class="category-legend">
      <div
        v-for="(category, idx) in categories"
        :key="category"
        class="legend-item"
        @click="emit('slice-click', category, counts[idx] ?? 0)"
      >
        <span
          class="legend-color"
          :style="{ backgroundColor: colors[idx] }"
        ></span>
        <span class="legend-label">{{ category }}</span>
        <span class="legend-count">{{ counts[idx] }}</span>
        <span class="legend-percent">({{ percentages[idx]?.toFixed(1) || 0 }}%)</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-chart {
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

.category-legend {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-primary, #e0e0e0);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.legend-item:hover {
  background-color: var(--bg-hover, #f8f9fa);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-label {
  font-weight: 500;
  color: var(--text-primary, #2c3e50);
  font-size: 0.85rem;
}

.legend-count {
  font-weight: 600;
  color: var(--text-primary, #2c3e50);
  margin-left: auto;
}

.legend-percent {
  font-size: 0.8rem;
  color: var(--text-muted, #6c757d);
}
</style>
