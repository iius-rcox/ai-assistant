<!--
  ThemeToggle Component
  Feature: 005-table-enhancements
  Task: T072
  Requirements: FR-032, FR-033, FR-034, FR-035

  Toggle button for switching between dark and light themes
-->

<script setup lang="ts">
import { useTheme, type Theme } from '@/composables/useTheme'

interface Props {
  /** Show label text */
  showLabel?: boolean
  /** Compact mode */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: false,
  compact: false,
})

const { isDark, themePreference, toggleTheme, cycleTheme, isSystemTheme } = useTheme()

function handleClick() {
  if (props.compact) {
    toggleTheme()
  } else {
    cycleTheme()
  }
}

// Icon based on current theme preference
const themeIcon = computed(() => {
  if (themePreference.value === 'system') return 'auto'
  return isDark.value ? 'dark' : 'light'
})

const themeLabel = computed(() => {
  if (themePreference.value === 'system') return 'Auto'
  return isDark.value ? 'Dark' : 'Light'
})

import { computed } from 'vue'
</script>

<template>
  <button
    @click="handleClick"
    class="theme-toggle"
    :class="{ compact, 'is-dark': isDark }"
    :title="`Theme: ${themeLabel} (click to change)`"
    :aria-label="`Current theme: ${themeLabel}. Click to change.`"
    type="button"
  >
    <!-- Sun icon for light mode -->
    <svg
      v-if="themeIcon === 'light'"
      class="theme-icon"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>

    <!-- Moon icon for dark mode -->
    <svg
      v-else-if="themeIcon === 'dark'"
      class="theme-icon"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>

    <!-- Auto/System icon -->
    <svg
      v-else
      class="theme-icon"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>

    <span v-if="showLabel" class="theme-label">{{ themeLabel }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--md-sys-color-surface-container);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-small);
  cursor: pointer;
  transition: var(--md-sys-theme-transition);
  color: var(--md-sys-color-on-surface);
}

.theme-toggle:hover {
  background-color: var(--md-sys-color-surface-container-high);
  border-color: var(--md-sys-color-primary);
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}

.theme-toggle.compact {
  padding: 0.4rem;
  border-radius: var(--md-sys-shape-corner-full);
}

.theme-icon {
  width: 20px;
  height: 20px;
  transition: transform var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard);
}

.theme-toggle:hover .theme-icon {
  transform: rotate(15deg);
}

.theme-toggle.is-dark .theme-icon {
  transform: rotate(-15deg);
}

.theme-toggle:hover.is-dark .theme-icon {
  transform: rotate(0deg);
}

.theme-label {
  font-size: var(--md-sys-typescale-label-medium-size);
  font-weight: var(--md-sys-typescale-label-medium-weight);
}
</style>
