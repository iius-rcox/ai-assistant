<!--
  Toast Notification Component
  Features: 003-correction-ui, 007-instant-edit-undo
  Tasks: T088 (003), T022-T024 (007)
  Requirements: SC-005, FR-003 through FR-006

  A simple, accessible toast notification system

  007-instant-edit-undo:
  - T022: Renders action button when toast.action exists
  - T023: handleAction() click handler calls toast.action.onClick()
  - T024: Styled action button per M3 design tokens
-->

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import type { ToastWithAction } from '@/types/undo'

const { toasts, remove } = useToast()

/**
 * Handle action button click (T023)
 * Calls the toast's action onClick callback
 */
async function handleAction(toast: ToastWithAction): Promise<void> {
  if (toast.action && !toast.action.disabled) {
    try {
      await toast.action.onClick()
    } catch (error) {
      console.error('Toast action failed:', error)
    }
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite" aria-atomic="true">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast', `toast-${toast.type}`, { 'toast-with-action': toast.action }]"
          role="alert"
        >
          <span class="toast-icon">
            <template v-if="toast.type === 'success'">✓</template>
            <template v-else-if="toast.type === 'error'">✕</template>
            <template v-else-if="toast.type === 'warning'">⚠</template>
            <template v-else>ℹ</template>
          </span>
          <span class="toast-message">{{ toast.message }}</span>

          <!-- T022: Action button when toast.action exists -->
          <button
            v-if="toast.action"
            class="toast-action"
            :disabled="toast.action.disabled"
            :aria-disabled="toast.action.disabled"
            @click="handleAction(toast)"
            aria-label="Undo this change"
          >
            {{ toast.action.label }}
          </button>

          <button class="toast-close" @click="remove(toast.id)" aria-label="Close notification">
            ×
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--md-sys-shape-corner-medium);
  box-shadow: var(--md-sys-elevation-3);
  background-color: var(--md-sys-color-inverse-surface);
  color: var(--md-sys-color-inverse-on-surface);
  pointer-events: auto;
  animation: toast-in 0.3s ease-out;
}

/* Toast with action gets more width */
.toast-with-action {
  min-width: 320px;
}

.toast-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: var(--md-sys-shape-corner-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.toast-message {
  flex: 1;
  font-size: var(--md-sys-typescale-body-medium-size);
  color: inherit;
}

/* T024: Action button styles per M3 design tokens */
.toast-action {
  flex-shrink: 0;
  padding: 0.375rem 0.875rem;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: var(--md-sys-shape-corner-small);
  color: inherit;
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  cursor: pointer;
  transition: var(--md-sys-theme-transition);
  opacity: 0.9;
}

.toast-action:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  opacity: 1;
}

.toast-action:focus {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.toast-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Action button colors per toast type */
.toast-success .toast-action {
  color: var(--md-ext-color-on-success-container);
  border-color: var(--md-ext-color-on-success-container);
}

.toast-success .toast-action:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.1);
}

.toast-error .toast-action {
  color: var(--md-sys-color-on-error-container);
  border-color: var(--md-sys-color-on-error-container);
}

.toast-error .toast-action:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.1);
}

.toast-warning .toast-action {
  color: var(--md-ext-color-on-warning-container);
  border-color: var(--md-ext-color-on-warning-container);
}

.toast-warning .toast-action:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.1);
}

.toast-info .toast-action {
  color: var(--md-sys-color-on-tertiary-container);
  border-color: var(--md-sys-color-on-tertiary-container);
}

.toast-info .toast-action:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.1);
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--md-sys-color-inverse-on-surface);
  opacity: 0.7;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: var(--md-sys-theme-transition);
}

.toast-close:hover {
  opacity: 1;
}

/* Toast types */
.toast-success {
  background-color: var(--md-ext-color-success-container);
  color: var(--md-ext-color-on-success-container);
  border-left: 4px solid var(--md-ext-color-success);
}

.toast-success .toast-icon {
  background-color: var(--md-ext-color-success);
  color: var(--md-ext-color-on-success);
}

.toast-success .toast-close {
  color: var(--md-ext-color-on-success-container);
}

.toast-error {
  background-color: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
  border-left: 4px solid var(--md-sys-color-error);
}

.toast-error .toast-icon {
  background-color: var(--md-sys-color-error);
  color: var(--md-sys-color-on-error);
}

.toast-error .toast-close {
  color: var(--md-sys-color-on-error-container);
}

.toast-warning {
  background-color: var(--md-ext-color-warning-container);
  color: var(--md-ext-color-on-warning-container);
  border-left: 4px solid var(--md-ext-color-warning);
}

.toast-warning .toast-icon {
  background-color: var(--md-ext-color-warning);
  color: var(--md-ext-color-on-warning);
}

.toast-warning .toast-close {
  color: var(--md-ext-color-on-warning-container);
}

.toast-info {
  background-color: var(--md-sys-color-tertiary-container);
  color: var(--md-sys-color-on-tertiary-container);
  border-left: 4px solid var(--md-sys-color-tertiary);
}

.toast-info .toast-icon {
  background-color: var(--md-sys-color-tertiary);
  color: var(--md-sys-color-on-tertiary);
}

.toast-info .toast-close {
  color: var(--md-sys-color-on-tertiary-container);
}

/* Transitions */
.toast-enter-active {
  animation: toast-in 0.3s ease-out;
}

.toast-leave-active {
  animation: toast-out 0.2s ease-in forwards;
}

.toast-move {
  transition: transform 0.3s ease;
}

@keyframes toast-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes toast-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Mobile responsive */
@media (max-width: 480px) {
  .toast-container {
    left: 1rem;
    right: 1rem;
    max-width: none;
  }

  .toast {
    width: 100%;
  }

  .toast-with-action {
    min-width: auto;
  }
}
</style>
