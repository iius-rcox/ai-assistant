<!--
  Conflict Resolution Dialog Component
  Feature: 004-inline-edit
  Task: T051
  Requirements: FR-021, FR-022 (Optimistic locking conflict resolution)

  Displays when a version conflict is detected during save
-->

<script setup lang="ts">
import { computed } from 'vue'
import type { ConflictData, InlineEditData } from '@/types/inline-edit'
import { logAction } from '@/utils/logger'

const props = defineProps<{
  isOpen: boolean
  conflict: ConflictData | null
  myChanges: InlineEditData | null
}>()

const emit = defineEmits<{
  (e: 'resolve', resolution: 'keep-mine' | 'use-server' | 'merge'): void
  (e: 'close'): void
}>()

// Format field name for display
function formatFieldName(field: string): string {
  return field.charAt(0).toUpperCase() + field.slice(1)
}

// Get fields that differ between my changes and server
const changedFields = computed(() => {
  if (!props.conflict || !props.myChanges) return []

  const fields: Array<{
    name: string
    mine: string
    server: string
    original: string
  }> = []

  // serverVersion is a Classification (full object), baseVersion is InlineEditData
  const serverData = props.conflict.serverVersion
  const originalData = props.conflict.baseVersion

  for (const key of ['category', 'urgency', 'action'] as const) {
    const serverValue = serverData[key] ?? ''
    const originalValue = originalData[key] ?? ''
    if (props.myChanges[key] !== serverValue || props.myChanges[key] !== originalValue) {
      fields.push({
        name: key,
        mine: props.myChanges[key],
        server: serverValue,
        original: originalValue,
      })
    }
  }

  return fields
})

function handleKeepMine() {
  logAction('Conflict resolution: keep mine')
  emit('resolve', 'keep-mine')
}

function handleUseServer() {
  logAction('Conflict resolution: use server')
  emit('resolve', 'use-server')
}

function handleMerge() {
  logAction('Conflict resolution: merge')
  emit('resolve', 'merge')
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
        <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="conflict-title">
          <div class="modal-header">
            <h2 id="conflict-title" class="modal-title">
              <span class="conflict-icon">⚠️</span>
              Conflict Detected
            </h2>
            <button class="modal-close" @click="handleClose" aria-label="Close">×</button>
          </div>

          <div class="modal-body">
            <p class="conflict-description">
              This record was modified by another user while you were editing. Please choose how to
              resolve the conflict:
            </p>

            <div v-if="changedFields.length > 0" class="conflict-details">
              <table class="conflict-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Original</th>
                    <th>Your Changes</th>
                    <th>Server Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="field in changedFields" :key="field.name">
                    <td class="field-name">{{ formatFieldName(field.name) }}</td>
                    <td class="field-original">{{ field.original }}</td>
                    <td class="field-mine">{{ field.mine }}</td>
                    <td class="field-server">{{ field.server }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-primary" @click="handleKeepMine">Keep My Changes</button>
            <button class="btn btn-secondary" @click="handleUseServer">Use Server Values</button>
            <button class="btn btn-outline" @click="handleMerge">Merge (Review Each)</button>
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
  right: 0;
  bottom: 0;
  background-color: var(--md-sys-color-scrim);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--md-sys-shape-corner-large);
  box-shadow: var(--md-sys-elevation-3);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--md-ext-color-warning-container);
}

.modal-title {
  margin: 0;
  font-size: var(--md-sys-typescale-title-large-size);
  font-weight: var(--md-sys-typescale-title-large-weight);
  color: var(--md-ext-color-on-warning-container);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.conflict-icon {
  font-size: 1.5rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--md-ext-color-on-warning-container);
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: var(--md-sys-theme-transition);
}

.modal-close:hover {
  opacity: 0.7;
}

.modal-body {
  padding: 1.5rem;
  background-color: var(--md-sys-color-surface-container-high);
}

.conflict-description {
  margin: 0 0 1.5rem;
  color: var(--md-sys-color-on-surface-variant);
  line-height: 1.5;
  font-size: var(--md-sys-typescale-body-large-size);
}

.conflict-details {
  margin-bottom: 1rem;
}

.conflict-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--md-sys-typescale-body-medium-size);
}

.conflict-table th,
.conflict-table td {
  padding: 0.75rem;
  text-align: left;
  border: 1px solid var(--md-sys-color-outline-variant);
}

.conflict-table th {
  background-color: var(--md-sys-color-surface-container);
  font-weight: var(--md-sys-typescale-label-large-weight);
  color: var(--md-sys-color-on-surface);
}

.field-name {
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
}

.field-original {
  color: var(--md-sys-color-on-surface-variant);
}

.field-mine {
  background-color: var(--md-ext-color-success-container);
  color: var(--md-ext-color-on-success-container);
  font-weight: 500;
}

.field-server {
  background-color: var(--md-sys-color-tertiary-container);
  color: var(--md-sys-color-on-tertiary-container);
  font-weight: 500;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--md-sys-color-surface-container);
  flex-wrap: wrap;
}

.btn {
  padding: 0.6rem 1.2rem;
  border-radius: var(--md-sys-shape-corner-small);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  cursor: pointer;
  transition: var(--md-sys-theme-transition);
  flex: 1;
  min-width: 120px;
}

.btn-primary {
  background-color: var(--md-ext-color-success);
  color: var(--md-ext-color-on-success);
  border: none;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  border: none;
}

.btn-secondary:hover {
  opacity: 0.9;
}

.btn-outline {
  background-color: transparent;
  color: var(--md-sys-color-on-surface-variant);
  border: 1px solid var(--md-sys-color-outline);
}

.btn-outline:hover {
  background-color: var(--md-sys-color-surface-container-highest);
}

/* Transitions */
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
  transform: scale(0.95);
}

@media (max-width: 480px) {
  .modal-footer {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
