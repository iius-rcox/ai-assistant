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
  action: ''
})

// Sync local data with props
watch(() => props.editData, (newData) => {
  if (newData) {
    localData.value = { ...newData }
  }
}, { immediate: true })

watch(() => props.classification, (classification) => {
  if (classification && !props.editData) {
    localData.value = {
      category: classification.category,
      urgency: classification.urgency,
      action: classification.action
    }
  }
}, { immediate: true })

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
        <div class="mobile-edit-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
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
                  :class="['urgency-btn', `urgency-${level.toLowerCase()}`, { active: localData.urgency === level }]"
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
            <button
              class="btn btn-cancel"
              @click="handleCancel"
              :disabled="isSaving"
            >
              Cancel
            </button>
            <button
              class="btn btn-save"
              @click="handleSave"
              :disabled="!isDirty || isSaving"
            >
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
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  display: flex;
  align-items: flex-end;
}

.mobile-edit-modal {
  background-color: white;
  width: 100%;
  max-height: 90vh;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f8f9fa;
}

.modal-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
}

.modal-close {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  transition: background-color 0.2s;
}

.modal-close:hover {
  background-color: #e9ecef;
}

.close-icon {
  font-size: 1.75rem;
  color: #6c757d;
  line-height: 1;
}

.email-preview {
  padding: 1rem 1.25rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.preview-subject {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-sender {
  font-size: 0.85rem;
  color: #6c757d;
}

.modal-body {
  padding: 1.5rem 1.25rem;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
}

.form-select {
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  border: 1px solid #ced4da;
  border-radius: 8px;
  background-color: white;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236c757d' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  min-height: 44px; /* Touch target */
}

.form-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.form-select:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}

/* Urgency Button Group */
.button-group {
  display: flex;
  gap: 0.5rem;
}

.urgency-btn {
  flex: 1;
  padding: 0.875rem 0.5rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  background-color: white;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px; /* Touch target */
}

.urgency-btn.active {
  color: white;
}

.urgency-btn.urgency-high {
  border-color: #e74c3c;
  color: #e74c3c;
}

.urgency-btn.urgency-high.active {
  background-color: #e74c3c;
  color: white;
}

.urgency-btn.urgency-medium {
  border-color: #f39c12;
  color: #f39c12;
}

.urgency-btn.urgency-medium.active {
  background-color: #f39c12;
  color: white;
}

.urgency-btn.urgency-low {
  border-color: #95a5a6;
  color: #95a5a6;
}

.urgency-btn.urgency-low.active {
  background-color: #95a5a6;
  color: white;
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
  border-top: 1px solid #e0e0e0;
  background-color: #f8f9fa;
  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px)); /* iOS safe area */
}

.btn {
  flex: 1;
  padding: 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 52px; /* Large touch target */
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-cancel {
  background-color: white;
  color: #6c757d;
  border: 1px solid #ced4da;
}

.btn-cancel:hover:not(:disabled) {
  background-color: #f8f9fa;
}

.btn-save {
  background-color: #27ae60;
  color: white;
  border: none;
}

.btn-save:hover:not(:disabled) {
  background-color: #219a52;
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
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
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
    border-radius: 16px;
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
