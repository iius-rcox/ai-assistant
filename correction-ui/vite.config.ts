import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    // Bundle optimization (T091)
    rollupOptions: {
      output: {
        // Split vendor libraries into separate chunks
        manualChunks: {
          // Core Vue framework
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // Supabase client (large dependency)
          'supabase': ['@supabase/supabase-js'],
          // ApexCharts (very large, only needed for analytics page)
          'apexcharts': ['apexcharts', 'vue3-apexcharts'],
        },
      },
    },
    // Increase warning threshold since ApexCharts is inherently large
    chunkSizeWarningLimit: 200,
  },
})
