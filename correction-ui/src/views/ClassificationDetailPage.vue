<!--
  Classification Detail Page
  Feature: 003-correction-ui
  Task: T040

  Page for viewing and editing individual classification
-->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClassificationStore } from '@/stores/classificationStore'
import ClassificationDetail from '@/components/ClassificationDetail.vue'
import { getClassification } from '@/services/classificationService'
import type { ClassificationWithEmail } from '@/types/models'
import { handleSupabaseError } from '@/utils/errorHandler'
import { logError } from '@/utils/logger'

const route = useRoute()
const router = useRouter()
const store = useClassificationStore()

const classification = ref<ClassificationWithEmail | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

// Load classification on mount
onMounted(async () => {
  const id = parseInt(route.params.id as string)

  if (isNaN(id)) {
    error.value = 'Invalid classification ID'
    isLoading.value = false
    return
  }

  try {
    classification.value = await getClassification(id)
  } catch (e) {
    error.value = handleSupabaseError(e)
    logError('Failed to load classification', e, { id })
  } finally {
    isLoading.value = false
  }
})

// Save handler
async function handleSave(updates: any) {
  if (!classification.value) return

  const updated = await store.updateClassification(classification.value.id, updates)

  // Update local classification with new values
  classification.value = {
    ...classification.value,
    ...updated
  }
}

// After save, navigate back to list
function handleSaved() {
  setTimeout(() => {
    router.push({ name: 'home' })
  }, 1500)
}
</script>

<template>
  <div class="detail-page">
    <div class="page-header">
      <button @click="router.push({ name: 'home' })" class="btn-back">
        ← Back to List
      </button>
      <h2>Edit Classification</h2>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading classification...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <p class="error-text">{{ error }}</p>
      <button @click="router.push({ name: 'home' })" class="btn-back-home">
        Return to List
      </button>
    </div>

    <!-- Classification detail -->
    <ClassificationDetail
      v-else-if="classification"
      :classification="classification"
      @save="handleSave"
      @saved="handleSaved"
    />
  </div>
</template>

<style scoped>
.detail-page {
  width: 100%;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h2 {
  margin: 0.5rem 0 0 0;
  color: #2c3e50;
}

.btn-back,
.btn-back-home {
  padding: 0.5rem 1rem;
  background-color: #95a5a6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-back:hover,
.btn-back-home:hover {
  background-color: #7f8c8d;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  color: #e74c3c;
}

.error-text {
  margin-bottom: 1rem;
  font-size: 1.1rem;
}
</style>
