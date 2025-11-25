<!--
  App Root Component
  Feature: 003-correction-ui
  Tasks: T016, T088, T089, T090

  Provides navigation shell, router-view, toast notifications, and theme support
-->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import Toast from '@/components/shared/Toast.vue'

// Dark mode support (T090)
const isDarkMode = ref(false)

onMounted(() => {
  // Check for saved preference or system preference
  const saved = localStorage.getItem('darkMode')
  if (saved !== null) {
    isDarkMode.value = saved === 'true'
  } else {
    isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyTheme()
})

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('darkMode', String(isDarkMode.value))
  applyTheme()
}

function applyTheme() {
  document.documentElement.classList.toggle('dark-mode', isDarkMode.value)
}
</script>

<template>
  <div class="app" :class="{ 'dark': isDarkMode }">
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
        @click="toggleDarkMode"
        :aria-label="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        :title="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <span v-if="isDarkMode">☀️</span>
        <span v-else>🌙</span>
      </button>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <!-- Toast notifications (T088) -->
    <Toast />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color, #f5f6fa);
  color: var(--text-color, #2c3e50);
  transition: background-color 0.3s, color 0.3s;
}

.app-header {
  background-color: var(--header-bg, #2c3e50);
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  font-size: 1.5rem;
  font-weight: 600;
}

.app-nav {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: #ecf0f1;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link.router-link-active {
  background-color: #3498db;
  color: white;
}

/* Theme toggle button (T090) */
.theme-toggle {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, transform 0.2s;
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.theme-toggle:focus {
  outline: 2px solid #3498db;
  outline-offset: 2px;
}

.app-main {
  flex: 1;
  padding: 1rem 1.5rem;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

/* Dark mode styles (T090) */
.app.dark {
  --bg-color: #1a1a2e;
  --text-color: #eaeaea;
  --header-bg: #16213e;
}

/* Responsive layout (T089) */
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
    font-size: 1.1rem;
    text-align: center;
  }

  .app-nav {
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .nav-link {
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
  }

  .theme-toggle {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .app-main {
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: 1rem;
  }

  .nav-link {
    padding: 0.35rem 0.6rem;
    font-size: 0.8rem;
  }

  .app-main {
    padding: 0.5rem;
  }
}
</style>
