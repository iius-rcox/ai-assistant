<!--
  App Root Component
  Feature: 006-material-design-themes
  Task: T008

  Provides navigation shell, router-view, toast notifications, and M3 theme support
-->

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import Toast from '@/components/shared/Toast.vue'
import { useTheme } from '@/composables/useTheme'

// Use the theme composable for M3 theme management
const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">Email Classification Corrections</h1>
        <nav class="app-nav">
          <RouterLink to="/" class="nav-link">Classifications</RouterLink>
          <RouterLink to="/analytics" class="nav-link">Analytics</RouterLink>
        </nav>
      </div>
      <button
        class="theme-toggle"
        @click="toggleTheme"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        data-testid="theme-toggle"
      >
        <span v-if="isDark">☀️</span>
        <span v-else>🌙</span>
      </button>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <!-- Toast notifications -->
    <Toast />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  transition: var(--md-sys-theme-transition);
}

.app-header {
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px var(--md-sys-color-shadow);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.app-title {
  margin: 0;
  font-size: var(--md-sys-typescale-title-large-size);
  line-height: var(--md-sys-typescale-title-large-line-height);
  font-weight: 600;
  color: inherit;
}

.app-nav {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: var(--md-sys-color-on-primary);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: var(--md-sys-shape-corner-small);
  transition: var(--md-sys-theme-transition);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  opacity: 0.9;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  opacity: 1;
  text-decoration: none;
}

.nav-link.router-link-active {
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  opacity: 1;
}

/* Theme toggle button */
.theme-toggle {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: var(--md-sys-shape-corner-full);
  width: 44px;
  height: 44px;
  cursor: pointer;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--md-sys-theme-transition);
  color: var(--md-sys-color-on-primary);
  padding: 0;
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--md-sys-color-on-primary);
  outline-offset: 2px;
}

.app-main {
  flex: 1;
  padding: 1.5rem;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  background-color: var(--md-sys-color-surface);
}

/* Responsive layout */
@media (max-width: 768px) {
  .app-header {
    padding: 0.75rem 1rem;
    flex-direction: column;
    gap: 0.75rem;
  }

  .header-content {
    width: 100%;
    align-items: center;
  }

  .app-title {
    font-size: var(--md-sys-typescale-title-medium-size);
    text-align: center;
  }

  .app-nav {
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .nav-link {
    padding: 0.4rem 0.75rem;
    font-size: var(--md-sys-typescale-label-medium-size);
  }

  .theme-toggle {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }

  .app-main {
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: var(--md-sys-typescale-title-small-size);
  }

  .nav-link {
    padding: 0.35rem 0.6rem;
    font-size: var(--md-sys-typescale-label-small-size);
  }

  .app-main {
    padding: 0.5rem;
  }
}
</style>
