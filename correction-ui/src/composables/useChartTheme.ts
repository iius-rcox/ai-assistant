/**
 * Chart Theme Composable
 * Feature: 006-material-design-themes
 * Task: T054
 *
 * Provides Material Design 3 compatible ApexCharts configuration
 * with reactive theme support and CSS variable integration
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

  // M3 color palette for charts
  const chartColors = computed(() => ({
    primary: getCSSVar('--md-sys-color-primary', isDark.value ? '#D0BCFF' : '#6750A4'),
    secondary: getCSSVar('--md-sys-color-secondary', isDark.value ? '#CCC2DC' : '#625B71'),
    tertiary: getCSSVar('--md-sys-color-tertiary', isDark.value ? '#EFB8C8' : '#7D5260'),
    error: getCSSVar('--md-sys-color-error', isDark.value ? '#F2B8B5' : '#B3261E'),
    success: getCSSVar('--md-ext-color-success', isDark.value ? '#81C784' : '#388E3C'),
    warning: getCSSVar('--md-ext-color-warning', isDark.value ? '#FFB74D' : '#F57C00'),
    surface: getCSSVar('--md-sys-color-surface', isDark.value ? '#141218' : '#FEF7FF'),
    surfaceContainer: getCSSVar(
      '--md-sys-color-surface-container',
      isDark.value ? '#211F26' : '#F3EDF7'
    ),
    onSurface: getCSSVar('--md-sys-color-on-surface', isDark.value ? '#E6E0E9' : '#1D1B20'),
    onSurfaceVariant: getCSSVar(
      '--md-sys-color-on-surface-variant',
      isDark.value ? '#CAC4D0' : '#49454F'
    ),
    outline: getCSSVar('--md-sys-color-outline', isDark.value ? '#938F99' : '#79747E'),
    outlineVariant: getCSSVar(
      '--md-sys-color-outline-variant',
      isDark.value ? '#49454F' : '#CAC4D0'
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
   */
  function getSemanticColors(): string[] {
    return [
      chartColors.value.primary,
      chartColors.value.secondary,
      chartColors.value.tertiary,
      chartColors.value.success,
      chartColors.value.warning,
      chartColors.value.error,
    ]
  }

  /**
   * Get trend chart colors (for corrections/classifications/rate)
   */
  function getTrendColors(): string[] {
    return [
      chartColors.value.error, // Corrections (red)
      chartColors.value.primary, // Classifications (primary)
      chartColors.value.success, // Rate (green)
    ]
  }

  return {
    isDark,
    chartColors,
    categoryColors,
    baseChartOptions,
    lineChartOptions,
    pieChartOptions,
    barChartOptions,
    getCategoryColor,
    getCategoryColors,
    getSemanticColors,
    getTrendColors,
  }
}

export type UseChartThemeReturn = ReturnType<typeof useChartTheme>
