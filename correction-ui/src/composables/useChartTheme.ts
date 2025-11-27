/**
 * Chart Theme Composable
 * Feature: 010-shadcn-blue-theme (updated from 006-material-design-themes)
 * Task: T054 (006), T033-T035 (010)
 *
 * Provides shadcn/M3 compatible ApexCharts configuration
 * with reactive theme support and CSS variable integration.
 * Now reads from shadcn chart color tokens (--chart-1 through --chart-5).
 */

import { computed, ref, onMounted, onUnmounted } from 'vue'

/**
 * Get computed style value for a CSS variable
 */
function getCSSVar(varName: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  return value || fallback
}

/**
 * Get HSL CSS variable as a usable color string
 * Shadcn tokens are stored as "H S% L%" without hsl() wrapper
 */
function getHSLVar(varName: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  if (!value) return fallback
  // Return as hsl() if it's not already wrapped
  if (value.startsWith('hsl') || value.startsWith('rgb') || value.startsWith('#')) {
    return value
  }
  return `hsl(${value})`
}

/**
 * Chart theme composable providing M3-compatible ApexCharts configuration
 */
export function useChartTheme() {
  const isDark = ref(false)

  // Observe theme changes
  let observer: MutationObserver | null = null

  function updateTheme() {
    isDark.value = document.documentElement.classList.contains('dark')
  }

  onMounted(() => {
    updateTheme()

    // Watch for theme class changes on documentElement
    observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateTheme()
        }
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  // Shadcn chart color tokens (T033-T035)
  const chartTokenColors = computed(() => ({
    chart1: getHSLVar('--chart-1', isDark.value ? 'hsl(220 70% 50%)' : 'hsl(12 76% 61%)'),
    chart2: getHSLVar('--chart-2', isDark.value ? 'hsl(160 60% 45%)' : 'hsl(173 58% 39%)'),
    chart3: getHSLVar('--chart-3', isDark.value ? 'hsl(30 80% 55%)' : 'hsl(197 37% 24%)'),
    chart4: getHSLVar('--chart-4', isDark.value ? 'hsl(280 65% 60%)' : 'hsl(43 74% 66%)'),
    chart5: getHSLVar('--chart-5', isDark.value ? 'hsl(340 75% 55%)' : 'hsl(27 87% 67%)'),
  }))

  // Semantic color palette for charts (using shadcn blue theme)
  const chartColors = computed(() => ({
    primary: getCSSVar('--md-sys-color-primary', isDark.value ? '#60A5FA' : '#3B82F6'),
    secondary: getCSSVar('--md-sys-color-secondary', isDark.value ? '#F8FAFC' : '#1E293B'),
    tertiary: getCSSVar('--md-sys-color-tertiary', isDark.value ? '#F8FAFC' : '#1E293B'),
    error: getCSSVar('--md-sys-color-error', isDark.value ? '#EF4444' : '#EF4444'),
    success: getCSSVar('--md-ext-color-success', isDark.value ? '#4ADE80' : '#16A34A'),
    warning: getCSSVar('--md-ext-color-warning', isDark.value ? '#FB923C' : '#EA580C'),
    surface: getCSSVar('--md-sys-color-surface', isDark.value ? '#030712' : '#FFFFFF'),
    surfaceContainer: getCSSVar(
      '--md-sys-color-surface-container',
      isDark.value ? '#1F2937' : '#F1F5F9'
    ),
    onSurface: getCSSVar('--md-sys-color-on-surface', isDark.value ? '#F8FAFC' : '#020617'),
    onSurfaceVariant: getCSSVar(
      '--md-sys-color-on-surface-variant',
      isDark.value ? '#94A3B8' : '#64748B'
    ),
    outline: getCSSVar('--md-sys-color-outline', isDark.value ? '#94A3B8' : '#64748B'),
    outlineVariant: getCSSVar(
      '--md-sys-color-outline-variant',
      isDark.value ? '#334155' : '#E2E8F0'
    ),
  }))

  // Category badge colors for pie charts
  const categoryColors = computed(() => ({
    KIDS: getCSSVar('--md-ext-color-badge-kids', isDark.value ? '#B39DDB' : '#5E35B1'),
    ROBYN: getCSSVar('--md-ext-color-badge-robyn', isDark.value ? '#F48FB1' : '#C2185B'),
    WORK: getCSSVar('--md-ext-color-badge-work', isDark.value ? '#64B5F6' : '#1565C0'),
    FINANCIAL: getCSSVar('--md-ext-color-badge-financial', isDark.value ? '#81C784' : '#2E7D32'),
    SHOPPING: getCSSVar('--md-ext-color-badge-shopping', isDark.value ? '#FFB74D' : '#E65100'),
    CHURCH: getCSSVar('--md-ext-color-badge-church', isDark.value ? '#CE93D8' : '#7B1FA2'),
    OTHER: getCSSVar('--md-ext-color-badge-other', isDark.value ? '#B0BEC5' : '#546E7A'),
  }))

  // Base chart options with M3 styling
  const baseChartOptions = computed(() => ({
    chart: {
      background: 'transparent',
      foreColor: chartColors.value.onSurface,
      fontFamily: 'inherit',
      toolbar: {
        theme: isDark.value ? 'dark' : 'light',
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 300,
      },
    },
    theme: {
      mode: isDark.value ? ('dark' as const) : ('light' as const),
    },
    tooltip: {
      theme: isDark.value ? 'dark' : 'light',
      style: {
        fontSize: '12px',
        fontFamily: 'inherit',
      },
    },
    title: {
      style: {
        fontSize: '16px',
        fontWeight: 600,
        color: chartColors.value.onSurface,
      },
    },
    subtitle: {
      style: {
        fontSize: '14px',
        color: chartColors.value.onSurfaceVariant,
      },
    },
    legend: {
      labels: {
        colors: chartColors.value.onSurface,
      },
      markers: {
        strokeWidth: 0,
      },
    },
    grid: {
      borderColor: chartColors.value.outlineVariant,
      strokeDashArray: 4,
    },
    xaxis: {
      labels: {
        style: {
          colors: chartColors.value.onSurfaceVariant,
          fontSize: '12px',
        },
      },
      axisBorder: {
        color: chartColors.value.outlineVariant,
      },
      axisTicks: {
        color: chartColors.value.outlineVariant,
      },
      title: {
        style: {
          color: chartColors.value.onSurfaceVariant,
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: chartColors.value.onSurfaceVariant,
          fontSize: '12px',
        },
      },
      title: {
        style: {
          color: chartColors.value.onSurfaceVariant,
        },
      },
    },
    dataLabels: {
      style: {
        fontSize: '12px',
        fontWeight: 500,
      },
      dropShadow: {
        enabled: false,
      },
    },
    states: {
      hover: {
        filter: {
          type: 'darken',
          value: isDark.value ? 0.85 : 0.9,
        },
      },
      active: {
        filter: {
          type: 'darken',
          value: isDark.value ? 0.8 : 0.85,
        },
      },
    },
  }))

  // Line chart specific options
  const lineChartOptions = computed(() => ({
    ...baseChartOptions.value,
    stroke: {
      curve: 'smooth' as const,
      width: 3,
    },
    markers: {
      size: 4,
      strokeWidth: 2,
      strokeColors: chartColors.value.surface,
      hover: {
        size: 6,
      },
    },
  }))

  // Pie/Donut chart specific options
  const pieChartOptions = computed(() => ({
    ...baseChartOptions.value,
    stroke: {
      width: 2,
      colors: [chartColors.value.surface],
    },
    plotOptions: {
      pie: {
        expandOnClick: true,
        donut: {
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              color: chartColors.value.onSurface,
            },
            value: {
              show: true,
              fontSize: '22px',
              fontWeight: 600,
              color: chartColors.value.onSurface,
            },
            total: {
              show: true,
              fontSize: '12px',
              color: chartColors.value.onSurfaceVariant,
            },
          },
        },
      },
    },
  }))

  // Bar chart specific options
  const barChartOptions = computed(() => ({
    ...baseChartOptions.value,
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '60%',
      },
    },
  }))

  /**
   * Get category color by name
   */
  function getCategoryColor(category: string): string {
    return (
      categoryColors.value[category as keyof typeof categoryColors.value] ||
      chartColors.value.onSurfaceVariant
    )
  }

  /**
   * Get array of category colors for a list of categories
   */
  function getCategoryColors(categories: string[]): string[] {
    return categories.map(getCategoryColor)
  }

  /**
   * Get semantic color for chart series
   * Uses shadcn chart tokens (--chart-1 through --chart-5) as primary data colors
   */
  function getSemanticColors(): string[] {
    return [
      chartTokenColors.value.chart1,
      chartTokenColors.value.chart2,
      chartTokenColors.value.chart3,
      chartTokenColors.value.chart4,
      chartTokenColors.value.chart5,
    ]
  }

  /**
   * Get trend chart colors (for corrections/classifications/rate)
   * Uses shadcn chart tokens optimized for trend visualization
   */
  function getTrendColors(): string[] {
    return [
      chartColors.value.error, // Corrections (red - destructive)
      chartColors.value.primary, // Classifications (blue - primary)
      chartColors.value.success, // Rate (green - success)
    ]
  }

  /**
   * Get chart token colors array for multi-series charts
   */
  function getChartTokenColors(): string[] {
    return [
      chartTokenColors.value.chart1,
      chartTokenColors.value.chart2,
      chartTokenColors.value.chart3,
      chartTokenColors.value.chart4,
      chartTokenColors.value.chart5,
    ]
  }

  return {
    isDark,
    chartColors,
    chartTokenColors,
    categoryColors,
    baseChartOptions,
    lineChartOptions,
    pieChartOptions,
    barChartOptions,
    getCategoryColor,
    getCategoryColors,
    getSemanticColors,
    getTrendColors,
    getChartTokenColors,
  }
}

export type UseChartThemeReturn = ReturnType<typeof useChartTheme>
