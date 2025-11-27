import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { cleanupStaleStorage } from './utils/storageCleanup'
import { logInfo, logAction } from './utils/logger'

// Run localStorage cleanup on app initialization (T082)
try {
  const cleanupResult = cleanupStaleStorage()
  if (cleanupResult.keysRemoved > 0) {
    logAction('Storage cleanup completed', {
      keysRemoved: cleanupResult.keysRemoved,
      bytesFreed: cleanupResult.bytesFreed,
    })
  }
} catch (error) {
  logInfo('Storage cleanup skipped', { error })
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
