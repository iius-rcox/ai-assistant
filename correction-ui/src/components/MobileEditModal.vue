<!--
  Mobile Edit Modal Component
  Feature: 004-inline-edit
  Task: T075
  Requirements: FR-031 through FR-034 (Mobile responsive editing)

  Full-screen modal for editing on mobile devices (<768px)
-->

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { InlineEditData } from '@/types/inline-edit'
import { logAction } from '@/utils/logger'

// Classification with email relation from store
interface ClassificationWithEmail {
  id: number
  category: string
  urgency: string
  action: string
  email?: {
    subject?: string
    sender?: string
  }
}

const props = defineProps<{
  isOpen: boolean
  classification: ClassificationWithEmail | null
  editData: InlineEditData | null
  saveStatus: string
  isDirty: boolean
}>()

const emit = defineEmits<{
  (e: 'update:field', field: keyof InlineEditData, value: string): void
  (e: 'save'): void
  (e: 'cancel'): void
  (e: 'close'): void
}>()

// Local state for form fields
const localData = ref<InlineEditData>({
  category: '',
  urgency: '',
  action: '',
})

// Sync local data with props
watch(
  () => props.editData,
  newData => {
    if (newData) {
      localData.value = { ...newData }
    }
  },
  { immediate: true }
)

watch(
  () => props.classification,
  classification => {
    if (classification && !props.editData) {
      localData.value = {
        category: classification.category,
        urgency: classification.urgency,
        action: classification.action,
      }
    }
  },
  { immediate: true }
)

const isSaving = computed(() => props.saveStatus === 'saving')

function handleFieldChange(field: keyof InlineEditData, value: string) {
  localData.value[field] = value
  emit('update:field', field, value)
  logAction('Mobile edit field changed', { field, value })
}

function handleSave() {
  emit('save')
}

function handleCancel() {
  emit('cancel')
}

function handleClose() {
  if (props.isDirty) {
    const confirmed = confirm('You have unsaved changes. Are you sure you want to close?')
    if (!confirmed) return
  }
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-slide">
      <div v-if="isOpen" class="mobile-edit-overlay" @click.self="handleClose">
        <div
          class="mobile-edit-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <!-- Header -->
          <div class="modal-header">
            <h2 id="modal-title" class="modal-title">Edit Classification</h2>
            <button class="modal-close" @click="handleClose" aria-label="Close">
              <span class="close-icon">×</span>
            </button>
          </div>

          <!-- Email Preview -->
          <div v-if="classification" class="email-preview">
            <div class="preview-subject">{{ classification.email?.subject || 'No subject' }}</div>
            <div class="preview-sender">From: {{ classification.email?.sender || 'Unknown' }}</div>
          </div>

          <!-- Edit Form -->
          <div class="modal-body">
            <!-- Category Field -->
            <div class="form-group">
              <label for="mobile-category" class="form-label">Category</label>
              <select
                id="mobile-category"
                :value="localData.category"
                @change="handleFieldChange('category', ($event.target as HTMLSelectElement).value)"
                class="form-select"
                :disabled="isSaving"
              >
                <option value="KIDS">KIDS</option>
                <option value="ROBYN">ROBYN</option>
                <option value="WORK">WORK</option>
                <option value="FINANCIAL">FINANCIAL</option>
                <option value="SHOPPING">SHOPPING</option>
                <option value="CHURCH">CHURCH</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <!-- Urgency Field -->
            <div class="form-group">
              <label for="mobile-urgency" class="form-label">Urgency</label>
              <div class="button-group">
                <button
                  v-for="level in ['HIGH', 'MEDIUM', 'LOW']"
                  :key="level"
                  type="button"
                  :class="[
                    'urgency-btn',
                    `urgency-${level.toLowerCase()}`,
                    { active: localData.urgency === level },
                  ]"
                  @click="handleFieldChange('urgency', level)"
                  :disabled="isSaving"
                >
                  {{ level }}
                </button>
              </div>
            </div>

            <!-- Action Field -->
            <div class="form-group">
              <label for="mobile-action" class="form-label">Action</label>
              <select
                id="mobile-action"
                :value="localData.action"
                @change="handleFieldChange('action', ($event.target as HTMLSelectElement).value)"
                class="form-select"
                :disabled="isSaving"
              >
                <option value="FYI">FYI</option>
                <option value="RESPOND">RESPOND</option>
                <option value="TASK">TASK</option>
                <option value="PAYMENT">PAYMENT</option>
                <option value="CALENDAR">CALENDAR</option>
                <option value="NONE">NONE</option>
              </select>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="modal-footer">
            <button class="btn btn-cancel" @click="handleCancel" :disabled="isSaving">
              Cancel
            </button>
            <button class="btn btn-save" @click="handleSave" :disabled="!isDirty || isSaving">
              <span v-if="isSaving" class="btn-spinner"></span>
              <span v-else>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mobile-edit-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--md-sys-color-scrim);
  z-index: 10000;
  display: flex;
  align-items: flex-end;
}

.mobile-edit-modal {
  background-color: var(--md-sys-color-surface-container-high);
  width: 100%;
  max-height: 90vh;
  border-radius: var(--md-sys-shape-corner-extra-large) var(--md-sys-shape-corner-extra-large) 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--md-sys-elevation-3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--md-sys-color-surface-container);
}

.modal-title {
  margin: 0;
  font-size: var(--md-sys-typescale-title-large-size);
  font-weight: var(--md-sys-typescale-title-large-weight);
  color: var(--md-sys-color-on-surface);
}

.modal-close {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--md-sys-shape-corner-full);
  width: 44px;
  height: 44px;
  transition: var(--md-sys-theme-transition);
}

.modal-close:hover {
  background-color: var(--md-sys-color-surface-container-highest);
}

.close-icon {
  font-size: 1.75rem;
  color: var(--md-sys-color-on-surface-variant);
  line-height: 1;
}

.email-preview {
  padding: 1rem 1.25rem;
  background-color: var(--md-sys-color-surface-container);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.preview-subject {
  font-weight: var(--md-sys-typescale-title-medium-weight);
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-body-large-size);
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-sender {
  font-size: var(--md-sys-typescale-body-medium-size);
  color: var(--md-sys-color-on-surface-variant);
}

.modal-body {
  padding: 1.5rem 1.25rem;
  overflow-y: auto;
  flex: 1;
  background-color: var(--md-sys-color-surface-container-high);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  color: var(--md-sys-color-on-surface);
  margin-bottom: 0.5rem;
}

.form-select {
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: var(--md-sys-typescale-body-large-size);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-small);
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2379747e' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  min-height: 44px; /* Touch target */
  transition: var(--md-sys-theme-transition);
}

.form-select:focus {
  outline: none;
  border-color: var(--md-sys-color-primary);
  box-shadow: 0 0 0 3px var(--md-sys-color-primary-container);
}

.form-select:disabled {
  background-color: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface-variant);
  cursor: not-allowed;
  opacity: 0.6;
}

/* Urgency Button Group */
.button-group {
  display: flex;
  gap: 0.5rem;
}

.urgency-btn {
  flex: 1;
  padding: 0.875rem 0.5rem;
  border: 2px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-small);
  background-color: var(--md-sys-color-surface);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
  transition: var(--md-sys-theme-transition);
  min-height: 44px; /* Touch target */
}

.urgency-btn.active {
  color: white;
}

.urgency-btn.urgency-high {
  border-color: var(--md-ext-color-urgency-high);
  color: var(--md-ext-color-urgency-high);
}

.urgency-btn.urgency-high.active {
  background-color: var(--md-ext-color-urgency-high);
  color: var(--md-ext-color-urgency-high-text);
}

.urgency-btn.urgency-medium {
  border-color: var(--md-ext-color-urgency-medium);
  color: var(--md-ext-color-urgency-medium);
}

.urgency-btn.urgency-medium.active {
  background-color: var(--md-ext-color-urgency-medium);
  color: var(--md-ext-color-urgency-medium-text);
}

.urgency-btn.urgency-low {
  border-color: var(--md-ext-color-urgency-low);
  color: var(--md-ext-color-urgency-low);
}

.urgency-btn.urgency-low.active {
  background-color: var(--md-ext-color-urgency-low);
  color: var(--md-ext-color-urgency-low-text);
}

.urgency-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Footer */
.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--md-sys-color-surface-container);
  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px)); /* iOS safe area */
}

.btn {
  flex: 1;
  padding: 1rem;
  border-radius: var(--md-sys-shape-corner-small);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  cursor: pointer;
  transition: var(--md-sys-theme-transition);
  min-height: 52px; /* Large touch target */
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-cancel {
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  border: 1px solid var(--md-sys-color-outline);
}

.btn-cancel:hover:not(:disabled) {
  background-color: var(--md-sys-color-surface-container-high);
}

.btn-save {
  background-color: var(--md-ext-color-success);
  color: var(--md-ext-color-on-success);
  border: none;
}

.btn-save:hover:not(:disabled) {
  opacity: 0.9;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Spinner */
.btn-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid var(--md-ext-color-on-success);
  border-top-color: transparent;
  border-radius: var(--md-sys-shape-corner-full);
  animation: spin 0.8s linear infinite;
  opacity: 0.7;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Slide up animation */
.modal-slide-enter-active,
.modal-slide-leave-active {
  transition: opacity 0.3s ease;
}

.modal-slide-enter-active .mobile-edit-modal,
.modal-slide-leave-active .mobile-edit-modal {
  transition: transform 0.3s ease;
}

.modal-slide-enter-from,
.modal-slide-leave-to {
  opacity: 0;
}

.modal-slide-enter-from .mobile-edit-modal,
.modal-slide-leave-to .mobile-edit-modal {
  transform: translateY(100%);
}

/* Tablet adjustments */
@media (min-width: 480px) {
  .mobile-edit-modal {
    max-width: 480px;
    margin: 0 auto;
    max-height: 80vh;
    border-radius: var(--md-sys-shape-corner-extra-large);
  }

  .mobile-edit-overlay {
    align-items: center;
    padding: 1rem;
  }

  .modal-footer {
    padding-bottom: 1rem;
  }
}
</style>
