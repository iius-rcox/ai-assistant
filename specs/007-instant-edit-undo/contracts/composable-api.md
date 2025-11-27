# Composable API Contracts

**Feature**: 007-instant-edit-undo
**Date**: 2025-11-25

## useUndo Composable

### Interface

```typescript
interface UseUndoReturn {
  // State (readonly)
  undoEntry: Readonly<Ref<UndoEntry | null>>
  isUndoing: Readonly<Ref<boolean>>
  canUndo: ComputedRef<boolean>
  undoDescription: ComputedRef<string | null>
  timeRemaining: Ref<number> // seconds remaining in undo window

  // Actions
  recordChange: (entry: Omit<UndoEntry, 'id' | 'timestamp'>) => void
  executeUndo: () => Promise<UndoResult>
  clearUndo: () => void
}

function useUndo(): UseUndoReturn
```

### Usage Example

```typescript
const { canUndo, undoDescription, recordChange, executeUndo } = useUndo()

// After successful save
recordChange({
  type: 'single',
  changes: [{
    recordId: 123,
    field: 'category',
    previousValue: 'WORK',
    newValue: 'FINANCIAL'
  }],
  description: 'Changed category to Financial'
})

// On undo trigger
if (canUndo.value) {
  const result = await executeUndo()
  if (result.success) {
    toast.success('Change undone')
  }
}
```

---

## useToast Composable (Extended)

### Extended Interface

```typescript
interface ToastAction {
  label: string
  onClick: () => void | Promise<void>
  disabled?: boolean
}

interface ExtendedToastOptions {
  duration?: number
  action?: ToastAction
}

interface UseToastReturn {
  // Existing
  toasts: Readonly<Ref<ToastWithAction[]>>
  show: (message: string, type?: ToastType, duration?: number) => number
  success: (message: string, options?: ExtendedToastOptions) => number
  error: (message: string, options?: ExtendedToastOptions) => number
  warning: (message: string, options?: ExtendedToastOptions) => number
  info: (message: string, options?: ExtendedToastOptions) => number
  remove: (id: number) => void

  // New
  showWithUndo: (
    message: string,
    onUndo: () => Promise<void>,
    options?: { duration?: number }
  ) => number
}
```

### Usage Example

```typescript
const toast = useToast()

// Show toast with undo action
toast.showWithUndo(
  'Category changed to Financial',
  async () => {
    await executeUndo()
  },
  { duration: 30000 }
)
```

---

## useInlineEdit Composable (Modified)

### Interface Changes

```typescript
interface UseInlineEditReturn {
  // Existing (unchanged)
  editingRowId: Ref<number | null>
  currentData: Ref<InlineEditData | null>
  saveStatus: Ref<SaveStatus>
  // ... other existing properties

  // Modified
  // REMOVED: saveEdit() - no longer needed for explicit save
  // REMOVED: canSave - no longer needed

  // New
  instantSave: (
    recordId: number,
    field: keyof InlineEditData,
    newValue: string
  ) => Promise<SaveResult>

  // Still available for conflict resolution
  forceOverwrite: () => Promise<SaveResult>
  acceptServerVersion: () => void
}
```

### Usage Example

```typescript
const { instantSave } = useInlineEdit()

// In dropdown change handler
async function handleDropdownChange(field: string, value: string) {
  const result = await instantSave(recordId, field, value)

  if (result.success) {
    // Toast with undo is shown automatically
  } else if (result.conflict) {
    // Show conflict resolution dialog
  } else {
    // Error toast shown automatically
  }
}
```

---

## useKeyboardShortcuts Composable (Extended)

### New Shortcut Registration

```typescript
// Added to existing shortcuts
{
  id: 'undo',
  key: 'z',
  ctrl: true,     // Windows/Linux
  meta: true,     // macOS
  description: 'Undo last change',
  handler: () => {
    if (undoState.canUndo.value) {
      undoState.executeUndo()
    }
  },
  // Only active when not in text input
  when: () => !isTextInputFocused()
}
```

---

## Component Props/Events

### Toast.vue (Extended)

```typescript
// No new props - action is part of toast data
// Component renders action button when toast.action exists

// Template addition:
<button
  v-if="toast.action"
  class="toast-action"
  :disabled="toast.action.disabled"
  @click="toast.action.onClick"
>
  {{ toast.action.label }}
</button>
```

### InlineEditCell.vue (Modified)

```typescript
// Props (unchanged)
interface Props {
  value: string
  field: 'category' | 'urgency' | 'action'
  recordId: number
  options: string[]
  labels: Record<string, string>
  disabled?: boolean
}

// Events (modified)
interface Emits {
  // REMOVED: 'update:value' - no longer emits for staging
  // REMOVED: 'save' - no longer needed

  // NEW: Instant save on change
  'instant-save': [field: string, value: string]
}
```

### ClassificationList.vue (Modified)

```typescript
// Changes:
// 1. Remove "Save" button from inline edit row
// 2. Wire instant-save event to useInlineEdit.instantSave()
// 3. Remove unsaved changes warning on row switch
```
