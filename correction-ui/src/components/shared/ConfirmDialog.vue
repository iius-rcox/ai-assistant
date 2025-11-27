<!--
  Confirm Dialog Component
  Feature: 003-correction-ui
  Task: T018
  Requirement: FR-020 (confirm before navigating away from unsaved changes)

  Modal dialog for confirmation prompts
-->

<script setup lang="ts">
interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'warning' | 'danger' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'warning',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
  'update:isOpen': [value: boolean]
}>()

function handleConfirm() {
  emit('confirm')
  emit('update:isOpen', false)
}

function handleCancel() {
  emit('cancel')
  emit('update:isOpen', false)
}

// Keyboard support: ESC to cancel, Enter to confirm
function handleKeydown(event: KeyboardEvent) {
  if (!props.isOpen) return

  if (event.key === 'Escape') {
    event.preventDefault()
    handleCancel()
  } else if (event.key === 'Enter') {
    event.preventDefault()
    handleConfirm()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-overlay"
        @click="handleCancel"
        @keydown="handleKeydown"
        tabindex="-1"
      >
        <div
          class="modal-dialog"
          :class="`modal-${variant}`"
          @click.stop
          role="dialog"
          aria-modal="true"
        >
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
          </div>

          <div class="modal-body">
            <p>{{ message }}</p>
          </div>

          <div class="modal-footer">
            <button @click="handleCancel" class="btn btn-secondary" type="button">
              {{ cancelText }}
            </button>
            <button
              @click="handleConfirm"
              class="btn btn-primary"
              :class="`btn-${variant}`"
              type="button"
              autofocus
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--md-sys-color-scrim);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-dialog {
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--md-sys-shape-corner-large);
  box-shadow: var(--md-sys-elevation-3);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.modal-title {
  margin: 0;
  font-size: var(--md-sys-typescale-title-large-size);
  font-weight: var(--md-sys-typescale-title-large-weight);
  color: var(--md-sys-color-on-surface);
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  margin: 0;
  line-height: 1.6;
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-body-large-size);
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: var(--md-sys-shape-corner-small);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  cursor: pointer;
  transition: var(--md-sys-theme-transition);
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:active {
  transform: translateY(0);
}

.btn-secondary {
  background-color: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface);
  border: 1px solid var(--md-sys-color-outline-variant);
}

.btn-secondary:hover {
  background-color: var(--md-sys-color-surface-container-high);
}

.btn-primary {
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-warning {
  background-color: var(--md-ext-color-warning);
  color: var(--md-ext-color-on-warning);
}

.btn-warning:hover {
  opacity: 0.9;
}

.btn-danger {
  background-color: var(--md-sys-color-error);
  color: var(--md-sys-color-on-error);
}

.btn-danger:hover {
  opacity: 0.9;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-dialog,
.modal-leave-active .modal-dialog {
  transition: transform 0.2s ease;
}

.modal-enter-from .modal-dialog,
.modal-leave-to .modal-dialog {
  transform: scale(0.9);
}
</style>
