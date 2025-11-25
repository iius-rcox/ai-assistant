<script setup lang="ts">
/**
 * BulkActionToolbar Component
 * Feature: 005-table-enhancements
 * Tasks: T027, T028, T029, T030
 *
 * Toolbar for bulk actions on selected items:
 * - Change Category (T028)
 * - Change Urgency (T029)
 * - Mark as Reviewed (T030)
 */

import { ref, computed } from 'vue'
import type { BulkActionType, BulkActionResult } from '@/types/table-enhancements'
import { CATEGORIES, URGENCY_LEVELS, ACTION_TYPES } from '@/constants/enums'

// Props
interface Props {
  /** Number of selected items */
  selectedCount: number
  /** Whether bulk action is in progress */
  isProcessing?: boolean
  /** Maximum selection limit */
  maxSelection?: number
}

const props = withDefaults(defineProps<Props>(), {
  isProcessing: false,
  maxSelection: 100
})

// Emits
const emit = defineEmits<{
  /** Execute a bulk action */
  'action': [type: BulkActionType, value?: string]
  /** Clear selection */
  'clear': []
}>()

// Modal state
const showCategoryModal = ref(false)
const showUrgencyModal = ref(false)
const showActionModal = ref(false)
const selectedValue = ref<string>('')

// Computed
const hasSelection = computed(() => props.selectedCount > 0)
const selectionLabel = computed(() =>
  props.selectedCount === 1
    ? '1 item selected'
    : `${props.selectedCount} items selected`
)

// Methods
function openCategoryModal() {
  selectedValue.value = ''
  showCategoryModal.value = true
}

function openUrgencyModal() {
  selectedValue.value = ''
  showUrgencyModal.value = true
}

function openActionModal() {
  selectedValue.value = ''
  showActionModal.value = true
}

function confirmCategoryChange() {
  if (selectedValue.value) {
    emit('action', 'change_category', selectedValue.value)
    showCategoryModal.value = false
  }
}

function confirmUrgencyChange() {
  if (selectedValue.value) {
    emit('action', 'change_urgency', selectedValue.value)
    showUrgencyModal.value = false
  }
}

function confirmActionChange() {
  if (selectedValue.value) {
    emit('action', 'change_action', selectedValue.value)
    showActionModal.value = false
  }
}

function markAsReviewed() {
  emit('action', 'mark_reviewed')
}

function clearSelection() {
  emit('clear')
}

function closeModals() {
  showCategoryModal.value = false
  showUrgencyModal.value = false
  showActionModal.value = false
  selectedValue.value = ''
}
</script>

<template>
  <Transition name="slide-down">
    <div v-if="hasSelection" class="bulk-action-toolbar">
      <div class="toolbar-content">
        <!-- Selection info -->
        <div class="selection-info">
          <span class="selection-count">{{ selectionLabel }}</span>
          <button
            type="button"
            class="btn-clear-selection"
            @click="clearSelection"
            :disabled="isProcessing"
          >
            Clear
          </button>
        </div>

        <!-- Divider -->
        <div class="toolbar-divider"></div>

        <!-- Action buttons -->
        <div class="action-buttons">
          <!-- Change Category (T028) -->
          <button
            type="button"
            class="btn-action"
            @click="openCategoryModal"
            :disabled="isProcessing"
            title="Change category for selected items"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>
            </svg>
            <span>Category</span>
          </button>

          <!-- Change Urgency (T029) -->
          <button
            type="button"
            class="btn-action"
            @click="openUrgencyModal"
            :disabled="isProcessing"
            title="Change urgency for selected items"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Urgency</span>
          </button>

          <!-- Change Action -->
          <button
            type="button"
            class="btn-action"
            @click="openActionModal"
            :disabled="isProcessing"
            title="Change action for selected items"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <span>Action</span>
          </button>

          <!-- Mark as Reviewed (T030) -->
          <button
            type="button"
            class="btn-action btn-action-primary"
            @click="markAsReviewed"
            :disabled="isProcessing"
            title="Mark selected items as reviewed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Mark Reviewed</span>
          </button>
        </div>

        <!-- Processing indicator -->
        <div v-if="isProcessing" class="processing-indicator">
          <div class="spinner"></div>
          <span>Processing...</span>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Category Modal (T028) -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showCategoryModal" class="modal-overlay" @click.self="closeModals">
        <div class="modal-content" role="dialog" aria-labelledby="category-modal-title">
          <h3 id="category-modal-title">Change Category</h3>
          <p class="modal-description">
            Select a new category for {{ selectionLabel }}
          </p>

          <div class="modal-options">
            <label
              v-for="category in CATEGORIES"
              :key="category"
              class="option-item"
              :class="{ selected: selectedValue === category }"
            >
              <input
                type="radio"
                :value="category"
                v-model="selectedValue"
                name="category"
              />
              <span class="option-badge" :class="`badge-${category.toLowerCase()}`">
                {{ category }}
              </span>
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeModals">
              Cancel
            </button>
            <button
              type="button"
              class="btn-confirm"
              @click="confirmCategoryChange"
              :disabled="!selectedValue"
            >
              Apply to {{ selectedCount }} items
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Urgency Modal (T029) -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showUrgencyModal" class="modal-overlay" @click.self="closeModals">
        <div class="modal-content" role="dialog" aria-labelledby="urgency-modal-title">
          <h3 id="urgency-modal-title">Change Urgency</h3>
          <p class="modal-description">
            Select a new urgency level for {{ selectionLabel }}
          </p>

          <div class="modal-options">
            <label
              v-for="urgency in URGENCY_LEVELS"
              :key="urgency"
              class="option-item"
              :class="{ selected: selectedValue === urgency }"
            >
              <input
                type="radio"
                :value="urgency"
                v-model="selectedValue"
                name="urgency"
              />
              <span class="option-badge" :class="`badge-urgency-${urgency.toLowerCase()}`">
                {{ urgency }}
              </span>
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeModals">
              Cancel
            </button>
            <button
              type="button"
              class="btn-confirm"
              @click="confirmUrgencyChange"
              :disabled="!selectedValue"
            >
              Apply to {{ selectedCount }} items
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Action Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showActionModal" class="modal-overlay" @click.self="closeModals">
        <div class="modal-content" role="dialog" aria-labelledby="action-modal-title">
          <h3 id="action-modal-title">Change Action</h3>
          <p class="modal-description">
            Select a new action for {{ selectionLabel }}
          </p>

          <div class="modal-options">
            <label
              v-for="action in ACTION_TYPES"
              :key="action"
              class="option-item"
              :class="{ selected: selectedValue === action }"
            >
              <input
                type="radio"
                :value="action"
                v-model="selectedValue"
                name="action"
              />
              <span class="option-label">{{ action }}</span>
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeModals">
              Cancel
            </button>
            <button
              type="button"
              class="btn-confirm"
              @click="confirmActionChange"
              :disabled="!selectedValue"
            >
              Apply to {{ selectedCount }} items
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bulk-action-toolbar {
  background-color: var(--color-primary, #3b82f6);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.toolbar-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.selection-count {
  font-weight: 500;
}

.btn-clear-selection {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.btn-clear-selection:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.btn-clear-selection:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.3);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.btn-action:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-action-primary {
  background: rgba(255, 255, 255, 0.3);
  font-weight: 500;
}

.btn-action-primary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.4);
}

.processing-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
  font-size: 0.85rem;
}

.spinner {
  width: 16px;
  height: 16px;
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

/* Slide transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.modal-description {
  color: #6c757d;
  margin: 0 0 1.5rem 0;
  font-size: 0.9rem;
}

.modal-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.option-item:hover {
  border-color: #3b82f6;
  background: #f8f9ff;
}

.option-item.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.option-item input[type="radio"] {
  width: 18px;
  height: 18px;
  accent-color: #3b82f6;
}

.option-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.option-label {
  font-size: 0.9rem;
  color: #2c3e50;
}

/* Category badges */
.badge-kids { background-color: #9b59b6; color: white; }
.badge-robyn { background-color: #e91e63; color: white; }
.badge-work { background-color: #3498db; color: white; }
.badge-financial { background-color: #27ae60; color: white; }
.badge-shopping { background-color: #f39c12; color: white; }
.badge-other { background-color: #95a5a6; color: white; }

/* Urgency badges */
.badge-urgency-high { background-color: #e74c3c; color: white; }
.badge-urgency-medium { background-color: #f39c12; color: white; }
.badge-urgency-low { background-color: #95a5a6; color: white; }

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  padding: 0.6rem 1.25rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel {
  background: #f1f3f5;
  border: 1px solid #dee2e6;
  color: #495057;
}

.btn-cancel:hover {
  background: #e9ecef;
}

.btn-confirm {
  background: #3b82f6;
  border: none;
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: #2563eb;
}

.btn-confirm:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .modal-content {
    background: #1f2937;
    color: #f3f4f6;
  }

  .modal-content h3 {
    color: #f3f4f6;
  }

  .modal-description {
    color: #9ca3af;
  }

  .option-item {
    border-color: #374151;
  }

  .option-item:hover {
    background: #374151;
  }

  .option-item.selected {
    background: #1e3a5f;
  }

  .option-label {
    color: #f3f4f6;
  }

  .btn-cancel {
    background: #374151;
    border-color: #4b5563;
    color: #f3f4f6;
  }

  .btn-cancel:hover {
    background: #4b5563;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .toolbar-content {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .toolbar-divider {
    width: 100%;
    height: 1px;
  }

  .action-buttons {
    justify-content: center;
  }

  .processing-indicator {
    margin-left: 0;
    justify-content: center;
  }
}
</style>
