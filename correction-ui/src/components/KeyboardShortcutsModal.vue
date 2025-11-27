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
    general: [],
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
  general: 'General',
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
            <h2 id="shortcuts-modal-title" class="modal-title">Keyboard Shortcuts</h2>
            <button @click="handleClose" class="close-btn" aria-label="Close" type="button">
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
                <li v-for="shortcut in shortcuts" :key="shortcut.key" class="shortcut-item">
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
  background-color: var(--md-sys-color-scrim);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-content {
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--md-sys-shape-corner-large);
  box-shadow: var(--md-sys-elevation-3);
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
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--md-sys-color-surface-container);
}

.modal-title {
  margin: 0;
  font-size: var(--md-sys-typescale-title-large-size);
  font-weight: var(--md-sys-typescale-title-large-weight);
  color: var(--md-sys-color-on-surface);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--md-sys-color-on-surface-variant);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--md-sys-shape-corner-extra-small);
  transition: var(--md-sys-theme-transition);
}

.close-btn:hover {
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-surface);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  background-color: var(--md-sys-color-surface-container-high);
}

.shortcut-category {
  margin-bottom: 1.5rem;
}

.shortcut-category:last-child {
  margin-bottom: 0;
}

.category-title {
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--md-sys-color-on-surface-variant);
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
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
  background-color: var(--md-sys-color-surface-container);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-small);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: var(--md-sys-typescale-label-medium-size);
  color: var(--md-sys-color-on-surface);
  box-shadow: var(--md-sys-elevation-1);
}

.modifier {
  color: var(--md-sys-color-on-surface-variant);
}

.shortcut-description {
  font-size: var(--md-sys-typescale-body-medium-size);
  color: var(--md-sys-color-on-surface);
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--md-sys-color-surface-container);
  text-align: center;
}

.hint {
  margin: 0;
  font-size: var(--md-sys-typescale-body-small-size);
  color: var(--md-sys-color-on-surface-variant);
}

.hint kbd {
  display: inline-block;
  padding: 0.15rem 0.4rem;
  background-color: var(--md-sys-color-surface-container-highest);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-extra-small);
  font-family: inherit;
  font-size: var(--md-sys-typescale-label-small-size);
  color: var(--md-sys-color-on-surface);
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
