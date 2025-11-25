<!--
  KeyboardShortcutsModal Component
  Feature: 005-table-enhancements
  Task: T045
  Requirements: FR-022 (Keyboard shortcuts help)

  Displays a modal with all available keyboard shortcuts
-->

<script setup lang="ts">
import { computed } from 'vue'
import { KEYBOARD_SHORTCUTS, type KeyboardShortcut } from '@/composables/useKeyboardShortcuts'

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

// Group shortcuts by category
const shortcutsByCategory = computed(() => {
  const grouped: Record<string, KeyboardShortcut[]> = {
    navigation: [],
    actions: [],
    general: []
  }

  KEYBOARD_SHORTCUTS.forEach(shortcut => {
    const category = grouped[shortcut.category]
    if (category) {
      category.push(shortcut)
    }
  })

  return grouped
})

const categoryLabels: Record<string, string> = {
  navigation: 'Navigation',
  actions: 'Actions',
  general: 'General'
}

function handleClose() {
  emit('close')
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    handleClose()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-backdrop"
        @click="handleBackdropClick"
        @keydown.escape="handleClose"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-modal-title"
      >
        <div class="modal-content" role="document">
          <div class="modal-header">
            <h2 id="shortcuts-modal-title" class="modal-title">
              Keyboard Shortcuts
            </h2>
            <button
              @click="handleClose"
              class="close-btn"
              aria-label="Close"
              type="button"
            >
              &times;
            </button>
          </div>

          <div class="modal-body">
            <div
              v-for="(shortcuts, category) in shortcutsByCategory"
              :key="category"
              class="shortcut-category"
            >
              <h3 class="category-title">{{ categoryLabels[category] }}</h3>
              <ul class="shortcut-list">
                <li
                  v-for="shortcut in shortcuts"
                  :key="shortcut.key"
                  class="shortcut-item"
                >
                  <kbd class="shortcut-key">
                    <span v-if="shortcut.modifier" class="modifier">
                      {{ shortcut.modifier === 'ctrl' ? 'Ctrl' : shortcut.modifier }}+
                    </span>
                    {{ shortcut.key }}
                  </kbd>
                  <span class="shortcut-description">{{ shortcut.description }}</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="modal-footer">
            <p class="hint">Press <kbd>?</kbd> anytime to show this help</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f8f9fa;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.15s;
}

.close-btn:hover {
  background-color: #e9ecef;
  color: #2c3e50;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.shortcut-category {
  margin-bottom: 1.5rem;
}

.shortcut-category:last-child {
  margin-bottom: 0;
}

.category-title {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6c757d;
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.shortcut-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
}

.shortcut-key {
  display: inline-flex;
  align-items: center;
  min-width: 100px;
  padding: 0.35rem 0.6rem;
  background-color: #f1f3f5;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.8rem;
  color: #495057;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.modifier {
  color: #6c757d;
}

.shortcut-description {
  font-size: 0.9rem;
  color: #495057;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e0e0;
  background-color: #f8f9fa;
  text-align: center;
}

.hint {
  margin: 0;
  font-size: 0.85rem;
  color: #6c757d;
}

.hint kbd {
  display: inline-block;
  padding: 0.15rem 0.4rem;
  background-color: #e9ecef;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.8rem;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95) translateY(-10px);
}

/* Responsive */
@media (max-width: 480px) {
  .modal-content {
    max-height: 90vh;
    margin: 0.5rem;
  }

  .shortcut-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .shortcut-key {
    min-width: auto;
  }
}
</style>
