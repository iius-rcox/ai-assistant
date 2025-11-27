/**
 * Theme Composable
 * Feature: 006-material-design-themes
 * Tasks: T006
 *
 * Provides dark/light theme functionality with:
 * - System preference detection via prefers-color-scheme
 * - localStorage persistence for user preference
 * - Toggle between dark and light modes
 * - M3 class application ('light'/'dark' on documentElement)
 */

import { ref, computed, watch, onMounted } from 'vue'
import { logAction } from '@/utils/logger'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'app-theme-preference'

export interface UseThemeOptions {
  /** Default theme if no preference saved */
  defaultTheme?: Theme
  /** Callback when theme changes */
  onThemeChange?: (theme: Theme, resolvedTheme: 'light' | 'dark') => void
}

export function useTheme(options: UseThemeOptions = {}) {
  const { defaultTheme = 'system', onThemeChange } = options

  // State
  const themePreference = ref<Theme>(defaultTheme)
  const systemPrefersDark = ref(false)

  // Computed
  const resolvedTheme = computed<'light' | 'dark'>(() => {
    if (themePreference.value === 'system') {
      return systemPrefersDark.value ? 'dark' : 'light'
    }
    return themePreference.value
  })

  const isDark = computed(() => resolvedTheme.value === 'dark')
  const isLight = computed(() => resolvedTheme.value === 'light')
  const isSystemTheme = computed(() => themePreference.value === 'system')

  /**
   * Load saved preference from localStorage
   */
  function loadSavedPreference() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        themePreference.value = saved
        logAction('Theme preference loaded', { theme: saved })
      }
    } catch (e) {
      // localStorage not available
    }
  }

  /**
   * Save preference to localStorage
   */
  function savePreference(theme: Theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch (e) {
      // localStorage not available
    }
  }

  /**
   * Detect system color scheme preference
   */
  function detectSystemPreference() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      systemPrefersDark.value = mediaQuery.matches

      // Listen for changes
      mediaQuery.addEventListener('change', e => {
        systemPrefersDark.value = e.matches
        if (themePreference.value === 'system') {
          applyTheme()
        }
      })
    }
  }

  /**
   * Apply theme to document
   * Uses M3 class names: 'light' and 'dark' directly on documentElement
   */
  function applyTheme() {
    const theme = resolvedTheme.value
    const root = document.documentElement

    // Remove existing theme classes (both legacy and M3)
    root.classList.remove('theme-light', 'theme-dark', 'light', 'dark')

    // Add M3 theme class directly
    root.classList.add(theme)

    // Set color-scheme for native elements
    root.style.colorScheme = theme

    // Update meta theme-color for mobile browsers with M3 surface colors
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      // M3 surface colors: light #FEF7FF, dark #141218
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#141218' : '#FEF7FF')
    }

    logAction('Theme applied', { theme, preference: themePreference.value })
    onThemeChange?.(themePreference.value, theme)
  }

  /**
   * Set theme preference
   */
  function setTheme(theme: Theme) {
    themePreference.value = theme
    savePreference(theme)
    applyTheme()
  }

  /**
   * Toggle between light and dark (ignores system)
   */
  function toggleTheme() {
    const newTheme: Theme = resolvedTheme.value === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  /**
   * Cycle through themes: light -> dark -> system -> light
   */
  function cycleTheme() {
    const order: Theme[] = ['light', 'dark', 'system']
    const currentIndex = order.indexOf(themePreference.value)
    const nextIndex = (currentIndex + 1) % order.length
    setTheme(order[nextIndex] ?? 'system')
  }

  /**
   * Reset to system preference
   */
  function resetToSystem() {
    setTheme('system')
  }

  // Watch for preference changes
  watch(themePreference, () => {
    applyTheme()
  })

  // Initialize on mount
  onMounted(() => {
    detectSystemPreference()
    loadSavedPreference()
    applyTheme()
  })

  return {
    // State
    themePreference,
    systemPrefersDark,

    // Computed
    resolvedTheme,
    isDark,
    isLight,
    isSystemTheme,

    // Methods
    setTheme,
    toggleTheme,
    cycleTheme,
    resetToSystem,
  }
}

export type UseThemeReturn = ReturnType<typeof useTheme>
