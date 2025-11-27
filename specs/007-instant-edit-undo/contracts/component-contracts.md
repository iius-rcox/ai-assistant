# Component Contracts

**Feature**: 007-instant-edit-undo
**Date**: 2025-11-25

## Toast.vue Component Contract

### Before (Current)

```vue
<template>
  <div class="toast">
    <span class="toast-icon">...</span>
    <span class="toast-message">{{ toast.message }}</span>
    <button class="toast-close" @click="remove(toast.id)">×</button>
  </div>
</template>
```

### After (Extended)

```vue
<template>
  <div class="toast">
    <span class="toast-icon">...</span>
    <span class="toast-message">{{ toast.message }}</span>

    <!-- NEW: Action button -->
    <button
      v-if="toast.action"
      class="toast-action"
      :disabled="toast.action.disabled"
      @click="handleAction(toast)"
    >
      {{ toast.action.label }}
    </button>

    <button class="toast-close" @click="remove(toast.id)">×</button>
  </div>
</template>

<script setup lang="ts">
// NEW: Handle action click
async function handleAction(toast: ToastWithAction) {
  if (toast.action && !toast.action.disabled) {
    try {
      await toast.action.onClick()
    } catch (error) {
      console.error('Toast action failed:', error)
    }
  }
}
</script>

<style scoped>
/* NEW: Action button styles */
.toast-action {
  padding: 0.25rem 0.75rem;
  margin-left: 0.5rem;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: var(--md-sys-shape-corner-small);
  color: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: var(--md-sys-theme-transition);
}

.toast-action:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.toast-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

---

## InlineEditCell.vue Component Contract

### Before (Current)

```vue
<script setup lang="ts">
const emit = defineEmits<{
  'update:value': [value: string]
}>()

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:value', target.value)
  // Change is staged, user must click "Save" button
}
</script>

<template>
  <select :value="value" @change="handleChange">
    <option v-for="opt in options" :key="opt" :value="opt">
      {{ labels[opt] || opt }}
    </option>
  </select>
</template>
```

### After (Modified)

```vue
<script setup lang="ts">
interface Props {
  value: string
  field: 'category' | 'urgency' | 'action'
  recordId: number
  options: string[]
  labels: Record<string, string>
  disabled?: boolean
  saving?: boolean  // NEW: Show loading state
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'instant-save': [field: string, value: string, previousValue: string]
}>()

// NEW: Track previous value for undo
const previousValue = ref(props.value)

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const newValue = target.value

  if (newValue !== previousValue.value) {
    emit('instant-save', props.field, newValue, previousValue.value)
    previousValue.value = newValue
  }
}

// NEW: Revert to previous value (for undo)
function revert(value: string) {
  previousValue.value = value
}

defineExpose({ revert })
</script>

<template>
  <div class="inline-edit-cell" :class="{ saving: saving }">
    <select
      :value="value"
      :disabled="disabled || saving"
      @change="handleChange"
    >
      <option v-for="opt in options" :key="opt" :value="opt">
        {{ labels[opt] || opt }}
      </option>
    </select>

    <!-- NEW: Saving indicator -->
    <span v-if="saving" class="saving-indicator" aria-label="Saving...">
      <span class="spinner"></span>
    </span>
  </div>
</template>

<style scoped>
.inline-edit-cell {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.inline-edit-cell.saving select {
  opacity: 0.7;
}

.saving-indicator {
  position: absolute;
  right: 0.5rem;
  pointer-events: none;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--md-sys-color-outline);
  border-top-color: var(--md-sys-color-primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
```

---

## ClassificationList.vue Changes

### Removed Elements

```vue
<!-- REMOVED: Save button in inline edit row -->
<button @click="handleSave" :disabled="!canSave">
  Save
</button>

<!-- REMOVED: Unsaved changes indicator -->
<span v-if="hasUnsavedChanges" class="unsaved-indicator">
  Unsaved changes
</span>
```

### Added Elements

```vue
<script setup>
import { useUndo } from '@/composables/useUndo'

const { canUndo, executeUndo, recordChange } = useUndo()

// NEW: Handle instant save from cell
async function handleInstantSave(
  recordId: number,
  field: string,
  newValue: string,
  previousValue: string
) {
  const result = await inlineEdit.instantSave(recordId, field, newValue)

  if (result.success) {
    // Record for undo
    recordChange({
      type: 'single',
      changes: [{ recordId, field, previousValue, newValue }],
      description: `Changed ${field} to ${getLabel(field, newValue)}`
    })

    // Show toast with undo
    toast.showWithUndo(
      `${getLabel(field, newValue)} saved`,
      async () => {
        await executeUndo()
      }
    )
  }
}
</script>

<template>
  <!-- Wire instant-save to handler -->
  <InlineEditCell
    v-for="field in editableFields"
    :key="field"
    :field="field"
    :value="classification[field]"
    :record-id="classification.id"
    :saving="savingField === field"
    @instant-save="handleInstantSave(classification.id, $event[0], $event[1], $event[2])"
  />
</template>
```

---

## Accessibility Requirements

### Toast with Action

```html
<!-- ARIA attributes for action button -->
<button
  class="toast-action"
  role="button"
  aria-label="Undo this change"
  :aria-disabled="toast.action.disabled"
>
  Undo
</button>
```

### Keyboard Navigation

- Toast action button must be focusable with Tab
- Enter/Space activates the action button
- Ctrl+Z / Cmd+Z triggers undo globally (when not in text input)

### Screen Reader Announcements

```typescript
// After successful save
announceToScreenReader('Category changed to Financial. Press Undo or Ctrl+Z to revert.')

// After successful undo
announceToScreenReader('Change undone. Category restored to Work.')
```
