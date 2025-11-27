<!--
  Classification Detail Component
  Feature: 003-correction-ui / 006-material-design-themes
  Tasks: T031-T038, T043, T061
  Requirements: FR-002, FR-003, FR-004, FR-005, FR-013, FR-019, FR-020, FR-021, FR-022

  Displays email content with inline editing form for corrections with M3 theming
-->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { ClassificationWithEmail } from '@/types/models'
import Dropdown from './shared/Dropdown.vue'
import ConfirmDialog from './shared/ConfirmDialog.vue'
import {
  CATEGORIES,
  URGENCY_LEVELS,
  ACTION_TYPES,
  CATEGORY_LABELS,
  URGENCY_LABELS,
  ACTION_LABELS,
} from '@/types/enums'
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
  action: props.classification.action,
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
      fullLength: formatted.fullLength,
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
  save: [updates: typeof formData.value]
  saved: []
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
      changes: formData.value,
    })

    emit('save', formData.value)

    // Success feedback (FR-005)
    saveSuccess.value = true
    originalData.value = { ...formData.value }

    logAction('Classification correction saved successfully', {
      id: props.classification.id,
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
watch(
  () => props.classification.id,
  () => {
    document.removeEventListener('keydown', handleKeydown)
  }
)
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
          <button v-if="showFullBody" @click="showFullBody = false" class="btn-show-more">
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
      <div v-if="saveSuccess" class="success-message">✓ Correction saved successfully!</div>

      <div v-if="saveError" class="error-message">
        {{ saveError }}
      </div>

      <!-- Action buttons (T035-T036) -->
      <div class="form-actions">
        <button @click="handleCancel" type="button" class="btn btn-secondary" :disabled="isSaving">
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
      <p class="keyboard-hint">Press <kbd>Enter</kbd> to save, <kbd>Esc</kbd> to cancel</p>
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
  background-color: var(--md-sys-color-surface);
  padding: 1.5rem;
  border-radius: var(--md-sys-shape-corner-medium);
  box-shadow: var(--md-sys-elevation-1);
  margin-bottom: 1.5rem;
  border: 1px solid var(--md-sys-color-outline-variant);
  transition: var(--md-sys-theme-transition);
}

.email-preview h3,
.classification-form h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-title-medium-size);
  font-weight: var(--md-sys-typescale-title-medium-weight);
}

.email-field {
  margin-bottom: 1rem;
}

.email-field label {
  display: block;
  font-weight: var(--md-sys-typescale-label-large-weight);
  color: var(--md-sys-color-on-surface-variant);
  margin-bottom: 0.25rem;
  font-size: var(--md-sys-typescale-label-medium-size);
}

.email-field p {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.email-subject {
  font-weight: 500;
  font-size: var(--md-sys-typescale-body-large-size);
}

.email-body {
  background-color: var(--md-sys-color-surface-container-low);
  padding: 1rem;
  border-radius: var(--md-sys-shape-corner-small);
  border: 1px solid var(--md-sys-color-outline-variant);
}

.body-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0 0 0.5rem 0;
  line-height: 1.6;
  color: var(--md-sys-color-on-surface);
}

.btn-show-more {
  padding: 0.4rem 0.8rem;
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  border: none;
  border-radius: var(--md-sys-shape-corner-small);
  cursor: pointer;
  font-size: var(--md-sys-typescale-label-medium-size);
  transition: var(--md-sys-theme-transition);
}

.btn-show-more:hover {
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}

.section-divider {
  border: none;
  border-top: 2px solid var(--md-sys-color-outline-variant);
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
  font-weight: var(--md-sys-typescale-label-large-weight);
  color: var(--md-sys-color-on-surface-variant);
  margin-bottom: 0.5rem;
  font-size: var(--md-sys-typescale-label-medium-size);
}

.confidence-bar {
  height: 8px;
  background-color: var(--md-sys-color-surface-container-highest);
  border-radius: var(--md-sys-shape-corner-full);
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background-color: var(--md-ext-color-success);
  transition: width var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard);
}

.textarea-field {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-small);
  font-family: inherit;
  font-size: var(--md-sys-typescale-body-medium-size);
  resize: vertical;
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  transition: var(--md-sys-theme-transition);
}

.textarea-field:focus {
  outline: none;
  border-color: var(--md-sys-color-primary);
  box-shadow: 0 0 0 3px var(--md-sys-color-primary-container);
}

.char-count {
  display: block;
  text-align: right;
  font-size: var(--md-sys-typescale-label-small-size);
  color: var(--md-sys-color-on-surface-variant);
  margin-top: 0.25rem;
}

.success-message {
  background-color: var(--md-ext-color-success-container);
  border: 1px solid var(--md-ext-color-success);
  color: var(--md-ext-color-on-success-container);
  padding: 0.75rem 1rem;
  border-radius: var(--md-sys-shape-corner-small);
  margin-bottom: 1rem;
}

.error-message {
  background-color: var(--md-sys-color-error-container);
  border: 1px solid var(--md-sys-color-error);
  color: var(--md-sys-color-on-error-container);
  padding: 0.75rem 1rem;
  border-radius: var(--md-sys-shape-corner-small);
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
  border-radius: var(--md-sys-shape-corner-small);
  font-size: var(--md-sys-typescale-label-large-size);
  cursor: pointer;
  transition: var(--md-sys-theme-transition);
  font-weight: var(--md-sys-typescale-label-large-weight);
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
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  border: 1px solid var(--md-sys-color-outline);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--md-sys-color-surface-container-highest);
}

.btn-primary {
  background-color: var(--md-ext-color-success);
  color: var(--md-ext-color-on-success);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--md-ext-color-success-container);
  color: var(--md-ext-color-on-success-container);
}

.keyboard-hint {
  margin-top: 1rem;
  text-align: center;
  font-size: var(--md-sys-typescale-label-medium-size);
  color: var(--md-sys-color-on-surface-variant);
}

.keyboard-hint kbd {
  padding: 0.2rem 0.4rem;
  background-color: var(--md-sys-color-surface-container);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-extra-small);
  font-family: monospace;
  font-size: 0.9em;
  color: var(--md-sys-color-on-surface);
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
