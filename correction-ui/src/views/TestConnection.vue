<!--
  Connection Test Page
  Diagnostic tool to verify Supabase connection
-->

<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

const result = ref('')
const loading = ref(false)

async function testConnection() {
  loading.value = true
  result.value = ''

  try {
    // Test 1: Basic connection
    const { data: countData, error: countError } = await supabase
      .from('classifications')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      result.value = `❌ Error: ${countError.message}\n\nDetails: ${JSON.stringify(countError, null, 2)}`
      return
    }

    result.value = `✅ Connected! Found ${countData?.length || 0} classifications\n\n`

    // Test 2: Fetch actual data
    const { data, error } = await supabase
      .from('classifications')
      .select(`
        *,
        email:emails (
          id,
          subject,
          sender
        )
      `)
      .limit(3)

    if (error) {
      result.value += `❌ Fetch error: ${error.message}\n\n${JSON.stringify(error, null, 2)}`
      return
    }

    result.value += `✅ Fetched ${data?.length || 0} records:\n\n${JSON.stringify(data, null, 2)}`
  } catch (e: any) {
    result.value = `❌ Exception: ${e.message}\n\n${JSON.stringify(e, null, 2)}`
  } finally {
    loading.value = false
  }
}

async function testEnvVars() {
  result.value = `Environment Variables:\n\n`
  result.value += `VITE_SUPABASE_URL: ${import.meta.env.VITE_SUPABASE_URL || '❌ NOT SET'}\n`
  result.value += `VITE_SUPABASE_SERVICE_KEY: ${import.meta.env.VITE_SUPABASE_SERVICE_KEY ? '✅ SET (length: ' + import.meta.env.VITE_SUPABASE_SERVICE_KEY.length + ')' : '❌ NOT SET'}\n`
}
</script>

<template>
  <div class="test-page">
    <h2>Supabase Connection Test</h2>

    <div class="button-group">
      <button @click="testEnvVars" class="btn">Check Environment Variables</button>
      <button @click="testConnection" :disabled="loading" class="btn btn-primary">
        {{ loading ? 'Testing...' : 'Test Supabase Connection' }}
      </button>
    </div>

    <pre v-if="result" class="result-box">{{ result }}</pre>
  </div>
</template>

<style scoped>
.test-page {
  padding: 2rem;
  max-width: 800px;
}

.test-page h2 {
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.btn {
  padding: 0.8rem 1.5rem;
  background-color: #95a5a6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn:hover:not(:disabled) {
  background-color: #7f8c8d;
}

.btn-primary {
  background-color: #3498db;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.result-box {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  padding: 1.5rem;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 0.9rem;
  line-height: 1.6;
}
</style>
