<!--
  Category Pie Chart Component
  Feature: 005-table-enhancements / 006-material-design-themes
  Task: T084, T055
  Requirements: FR-040, FR-042

  ApexCharts pie/donut chart showing category distribution with M3 theming
-->

<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { useChartTheme } from '@/composables/useChartTheme'

interface Props {
  categories: string[]
  counts: number[]
  percentages: number[]
  chartType?: 'pie' | 'donut'
}

const props = withDefaults(defineProps<Props>(), {
  chartType: 'donut',
})

const emit = defineEmits<{
  'slice-click': [category: string, count: number]
}>()

const { pieChartOptions, getCategoryColors, chartColors, isDark } = useChartTheme()

const colors = computed(() => getCategoryColors(props.categories))

// Chart options with M3 theming
const chartOptions = computed(() => ({
  ...pieChartOptions.value,
  chart: {
    ...pieChartOptions.value.chart,
    id: 'category-distribution',
    type: props.chartType,
    toolbar: {
      show: true,
    },
    events: {
      dataPointSelection: (_event: any, _chartContext: any, config: any) => {
        const category = props.categories[config.dataPointIndex] ?? ''
        const count = props.counts[config.dataPointIndex] ?? 0
        emit('slice-click', category, count)
      },
    },
  },
  labels: props.categories,
  colors: colors.value,
  title: {
    text: 'Category Distribution',
    align: 'left' as const,
    style: pieChartOptions.value.title?.style,
  },
  legend: {
    position: 'bottom' as const,
    horizontalAlign: 'center' as const,
    labels: pieChartOptions.value.legend?.labels,
    markers: {
      size: 12,
      strokeWidth: 0,
    },
  },
  plotOptions: {
    pie: {
      donut: {
        size: props.chartType === 'donut' ? '55%' : '0%',
        labels: {
          show: props.chartType === 'donut',
          name: pieChartOptions.value.plotOptions?.pie?.donut?.labels?.name,
          value: {
            ...pieChartOptions.value.plotOptions?.pie?.donut?.labels?.value,
            formatter: (val: string) => val,
          },
          total: {
            ...pieChartOptions.value.plotOptions?.pie?.donut?.labels?.total,
            label: 'Total',
            formatter: () => props.counts.reduce((a, b) => a + b, 0).toString(),
          },
        },
      },
      expandOnClick: true,
    },
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => `${val.toFixed(1)}%`,
    style: pieChartOptions.value.dataLabels?.style,
    dropShadow: {
      enabled: false,
    },
  },
  tooltip: {
    enabled: true,
    theme: isDark.value ? 'dark' : 'light',
    y: {
      formatter: (val: number, opts: any) => {
        const idx = opts.seriesIndex
        return `${val} emails (${props.percentages[idx]?.toFixed(1) || 0}%)`
      },
    },
  },
  stroke: pieChartOptions.value.stroke,
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: {
          height: 300,
        },
        legend: {
          position: 'bottom',
        },
      },
    },
  ],
}))

const hasData = computed(() => props.categories.length > 0 && props.counts.some(c => c > 0))
</script>

<template>
  <div class="category-chart">
    <div v-if="!hasData" class="empty-state">
      <p>No category data available yet. Classifications will appear here.</p>
    </div>

    <VueApexCharts v-else :type="chartType" :options="chartOptions" :series="counts" height="350" />

    <!-- Category legend with counts -->
    <div v-if="hasData" class="category-legend">
      <div
        v-for="(category, idx) in categories"
        :key="category"
        class="legend-item"
        @click="emit('slice-click', category, counts[idx] ?? 0)"
      >
        <span class="legend-color" :style="{ backgroundColor: colors[idx] }"></span>
        <span class="legend-label">{{ category }}</span>
        <span class="legend-count">{{ counts[idx] }}</span>
        <span class="legend-percent">({{ percentages[idx]?.toFixed(1) || 0 }}%)</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-chart {
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

.category-legend {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--md-sys-color-outline-variant);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: var(--md-sys-shape-corner-small);
  cursor: pointer;
  transition: var(--md-sys-theme-transition);
}

.legend-item:hover {
  background-color: var(--md-sys-color-surface-container-high);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: var(--md-sys-shape-corner-extra-small);
  flex-shrink: 0;
}

.legend-label {
  font-weight: var(--md-sys-typescale-label-large-weight);
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-label-medium-size);
}

.legend-count {
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
  margin-left: auto;
}

.legend-percent {
  font-size: var(--md-sys-typescale-label-small-size);
  color: var(--md-sys-color-on-surface-variant);
}
</style>
