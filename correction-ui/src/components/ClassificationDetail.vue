<!--
  Classification Detail Component
  Feature: 003-correction-ui
  Tasks: T031-T038, T043
  Requirements: FR-002, FR-003, FR-004, FR-005, FR-013, FR-019, FR-020, FR-021, FR-022

  Displays email content with inline editing form for corrections
-->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { ClassificationWithEmail } from '@/types/models'
import Dropdown from './shared/Dropdown.vue'
import ConfirmDialog from './shared/ConfirmDialog.vue'
import { CATEGORIES, URGENCY_LEVELS, ACTION_TYPES, CATEGORY_LABELS, URGENCY_LABELS, ACTION_LABELS } from '@/types/enums'
import { formatTimestamp, formatEmailBody } from '@/utils/formatters'
import { validateClassificationEdit } from '@/utils/validation'
import { logAction } from '@/utils/logger'

interface Props {
  classification: ClassificationWithEmail
}

const props = defineProps<Props>()
const router = useRouter()

// Form state
const formData = ref({
  category: props.classification.category,
  urgency: props.classification.urgency,
  action: props.classification.action
})

// Track if form has changed (for unsaved changes warning - T037)
const originalData = ref({ ...formData.value })
const hasUnsavedChanges = computed(() => {
  return (
    formData.value.category !== originalData.value.category ||
    formData.value.urgency !== originalData.value.urgency ||
    formData.value.action !== originalData.value.action
  )
})

// Email body display (T032 - truncate to 2000 chars with Show More)
const showFullBody = ref(false)
const emailBodyFormatted = computed(() => {
  const formatted = formatEmailBody(props.classification.email.body, 2000)

  if (showFullBody.value) {
    return {
      preview: props.classification.email.body || '',
      isTruncated: false,
      fullLength: formatted.fullLength
    }
  }

  return formatted
})

// UI state
const isSaving = ref(false)
const saveSuccess = ref(false)
const saveError = ref<string | null>(null)
const showConfirmDialog = ref(false)
const pendingNavigation = ref<(() => void) | null>(null)

// Validation
const validationErrors = computed(() => {
  return validateClassificationEdit(formData.value)
})

const isValid = computed(() => validationErrors.value.length === 0)

// Emit events
const emit = defineEmits<{
  'save': [updates: typeof formData.value]
  'saved': []
}>()

// Save handler (T035)
async function handleSave() {
  if (!isValid.value) {
    saveError.value = 'Please fix validation errors before saving'
    return
  }

  isSaving.value = true
  saveSuccess.value = false
  saveError.value = null

  try {
    logAction('Saving classification correction', {
      id: props.classification.id,
      changes: formData.value
    })

    emit('save', formData.value)

    // Success feedback (FR-005)
    saveSuccess.value = true
    originalData.value = { ...formData.value }

    logAction('Classification correction saved successfully', {
      id: props.classification.id
    })

    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      saveSuccess.value = false
    }, 3000)

    emit('saved')
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Failed to save correction'
    logAction('Failed to save classification correction', { error })
  } finally {
    isSaving.value = false
  }
}

// Cancel handler (T036)
function handleCancel() {
  if (hasUnsavedChanges.value) {
    showConfirmDialog.value = true
    pendingNavigation.value = () => router.push({ name: 'home' })
  } else {
    router.push({ name: 'home' })
  }
}

// Confirm unsaved changes dialog handlers (T037)
function handleConfirmNavigation() {
  if (pendingNavigation.value) {
    logAction('User confirmed navigation with unsaved changes')
    pendingNavigation.value()
    pendingNavigation.value = null
  }
  showConfirmDialog.value = false
}

function handleCancelNavigation() {
  logAction('User cancelled navigation, keeping unsaved changes')
  pendingNavigation.value = null
  showConfirmDialog.value = false
}

// Keyboard navigation (T038 - FR-022)
function handleKeydown(event: KeyboardEvent) {
  // Enter to save (when not in textarea)
  if (event.key === 'Enter' && event.target instanceof HTMLSelectElement) {
    event.preventDefault()
    if (isValid.value && !isSaving.value) {
      handleSave()
    }
  }

  // Escape to cancel
  if (event.key === 'Escape') {
    event.preventDefault()
    handleCancel()
  }
}

onMounted(() => {
  logAction('Classification detail mounted', { id: props.classification.id })
  document.addEventListener('keydown', handleKeydown)
})

// Cleanup
watch(() => props.classification.id, () => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="classification-detail">
    <!-- Email preview section (T032) -->
    <section class="email-preview">
      <h3>Email Content</h3>

      <div class="email-field">
        <label>Subject:</label>
        <p class="email-subject">{{ classification.email.subject || 'N/A' }}</p>
      </div>

      <div class="email-field">
        <label>From:</label>
        <p>{{ classification.email.sender || 'N/A' }}</p>
      </div>

      <div class="email-field">
        <label>Received:</label>
        <p>{{ formatTimestamp(classification.email.received_timestamp) }}</p>
      </div>

      <div class="email-field">
        <label>Body:</label>
        <div class="email-body">
          <p class="body-text">{{ emailBodyFormatted.preview }}</p>
          <button
            v-if="emailBodyFormatted.isTruncated && !showFullBody"
            @click="showFullBody = true"
            class="btn-show-more"
          >
            Show More ({{ emailBodyFormatted.fullLength }} characters total)
          </button>
          <button
            v-if="showFullBody"
            @click="showFullBody = false"
            class="btn-show-more"
          >
            Show Less
          </button>
        </div>
      </div>
    </section>

    <hr class="section-divider" />

    <!-- Classification edit form (T033-T034) -->
    <section class="classification-form">
      <h3>Classification</h3>

      <div class="form-grid">
        <!-- Category dropdown (T033) -->
        <Dropdown
          v-model="formData.category"
          :options="CATEGORIES"
          :labels="CATEGORY_LABELS"
          label="Category"
          :error="validationErrors.find(e => e.field === 'category')?.message"
        />

        <!-- Urgency dropdown (T033) -->
        <Dropdown
          v-model="formData.urgency"
          :options="URGENCY_LEVELS"
          :labels="URGENCY_LABELS"
          label="Urgency"
          :error="validationErrors.find(e => e.field === 'urgency')?.message"
        />

        <!-- Action dropdown (T033) -->
        <Dropdown
          v-model="formData.action"
          :options="ACTION_TYPES"
          :labels="ACTION_LABELS"
          label="Action"
          :error="validationErrors.find(e => e.field === 'action')?.message"
        />
      </div>

      <div class="form-field">
        <label>AI Confidence: {{ (classification.confidence_score * 100).toFixed(0) }}%</label>
        <div class="confidence-bar">
          <div
            class="confidence-fill"
            :style="{ width: `${classification.confidence_score * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Correction reason (T034 - FR-019) -->
      <!-- Note: correction_reason field will be added in future phase when database schema is updated -->

      <!-- Success/Error messages -->
      <div v-if="saveSuccess" class="success-message">
        ✓ Correction saved successfully!
      </div>

      <div v-if="saveError" class="error-message">
        {{ saveError }}
      </div>

      <!-- Action buttons (T035-T036) -->
      <div class="form-actions">
        <button
          @click="handleCancel"
          type="button"
          class="btn btn-secondary"
          :disabled="isSaving"
        >
          Cancel
        </button>
        <button
          @click="handleSave"
          type="button"
          class="btn btn-primary"
          :disabled="!hasUnsavedChanges || !isValid || isSaving"
        >
          {{ isSaving ? 'Saving...' : 'Save Correction' }}
        </button>
      </div>

      <!-- Keyboard hints -->
      <p class="keyboard-hint">
        Press <kbd>Enter</kbd> to save, <kbd>Esc</kbd> to cancel
      </p>
    </section>

    <!-- Unsaved changes confirmation dialog (T037 - FR-020) -->
    <ConfirmDialog
      v-model:isOpen="showConfirmDialog"
      title="Unsaved Changes"
      message="You have unsaved changes. Are you sure you want to leave without saving?"
      confirmText="Leave Without Saving"
      cancelText="Stay and Continue Editing"
      variant="warning"
      @confirm="handleConfirmNavigation"
      @cancel="handleCancelNavigation"
    />
  </div>
</template>

<style scoped>
.classification-detail {
  max-width: 900px;
}

.email-preview,
.classification-form {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.email-preview h3,
.classification-form h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.email-field {
  margin-bottom: 1rem;
}

.email-field label {
  display: block;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.email-field p {
  margin: 0;
  color: #2c3e50;
}

.email-subject {
  font-weight: 500;
  font-size: 1.1rem;
}

.email-body {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.body-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0 0 0.5rem 0;
  line-height: 1.6;
}

.btn-show-more {
  padding: 0.4rem 0.8rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-show-more:hover {
  background-color: #2980b9;
}

.section-divider {
  border: none;
  border-top: 2px solid #e0e0e0;
  margin: 2rem 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-field {
  margin-bottom: 1.5rem;
}

.form-field label {
  display: block;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.confidence-bar {
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background-color: #27ae60;
  transition: width 0.3s ease;
}

.textarea-field {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical;
}

.textarea-field:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.char-count {
  display: block;
  text-align: right;
  font-size: 0.8rem;
  color: #95a5a6;
  margin-top: 0.25rem;
}

.success-message {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.error-message {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.6rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  font-weight: 500;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #7f8c8d;
}

.btn-primary {
  background-color: #27ae60;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #229954;
}

.keyboard-hint {
  margin-top: 1rem;
  text-align: center;
  font-size: 0.85rem;
  color: #95a5a6;
}

.keyboard-hint kbd {
  padding: 0.2rem 0.4rem;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}
</style>
