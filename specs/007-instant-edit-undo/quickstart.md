# Quickstart: Instant Edit with Undo

**Feature**: 007-instant-edit-undo
**Date**: 2025-11-25
**Purpose**: Step-by-step implementation guide

## Prerequisites

- Node.js 20.19+ or 22.12+
- Existing correction-ui project setup
- Supabase project configured

## Implementation Order

### Phase 1: Core Infrastructure (MVP)

#### Step 1: Create Undo Types

```bash
# Create types file
touch correction-ui/src/types/undo.ts
```

```typescript
// src/types/undo.ts
export interface UndoChange {
  recordId: number
  field: 'category' | 'urgency' | 'action'
  previousValue: string
  newValue: string
}

export interface UndoEntry {
  id: string
  type: 'single' | 'bulk'
  timestamp: number
  changes: UndoChange[]
  description: string
}

export interface UndoResult {
  success: boolean
  error?: string
  restoredRecords?: number[]
}
```

#### Step 2: Create useUndo Composable

```bash
touch correction-ui/src/composables/useUndo.ts
```

Key implementation points:
1. Single reactive `undoEntry` ref
2. 30-second timeout timer
3. `recordChange()` to capture undo data
4. `executeUndo()` to restore previous values via Supabase
5. `clearUndo()` for manual/timeout cleanup

#### Step 3: Extend useToast with Action Support

Modify `useToast.ts`:
1. Add `action` property to toast interface
2. Add `showWithUndo()` helper method
3. Update toast duration to 30000ms for undo toasts

#### Step 4: Update Toast.vue Component

Add action button rendering:
1. Conditional button when `toast.action` exists
2. Click handler calls `toast.action.onClick()`
3. Styling for action button in toast

### Phase 2: Instant Save Integration

#### Step 5: Modify useInlineEdit

Replace explicit save with instant save:
1. Add `instantSave(recordId, field, value)` method
2. Remove `saveEdit()` method (or keep for bulk)
3. Update optimistic UI handling

#### Step 6: Update InlineEditCell.vue

Change from staged to instant:
1. Emit `instant-save` on dropdown change
2. Track `previousValue` for undo
3. Add saving indicator
4. Remove dependency on parent save button

#### Step 7: Update ClassificationList.vue

Wire everything together:
1. Handle `instant-save` event
2. Call `recordChange()` on success
3. Show toast with undo option
4. Remove Save button from UI

### Phase 3: Keyboard Shortcut

#### Step 8: Add Ctrl+Z Handler

Extend `useKeyboardShortcuts.ts`:
1. Register 'z' with ctrl/meta modifier
2. Check `canUndo` before executing
3. Skip when text input focused

### Phase 4: Testing

#### Step 9: Unit Tests

```bash
touch correction-ui/tests/unit/composables/useUndo.spec.ts
```

Test cases:
- `recordChange` stores entry correctly
- `executeUndo` restores values
- Timer clears entry after 30s
- New change replaces previous entry

#### Step 10: E2E Tests

```bash
touch correction-ui/tests/e2e/instant-edit.spec.ts
```

Test flows:
- Change dropdown → verify immediate save
- Click Undo → verify restore
- Wait 30s → verify undo unavailable
- Ctrl+Z → verify keyboard undo works

## Common Patterns

### Recording a Change

```typescript
const { recordChange } = useUndo()

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
```

### Showing Undo Toast

```typescript
const { showWithUndo } = useToast()
const { executeUndo } = useUndo()

showWithUndo(
  'Category changed to Financial',
  async () => {
    await executeUndo()
  }
)
```

### Handling Instant Save

```typescript
async function handleInstantSave(
  recordId: number,
  field: string,
  newValue: string,
  previousValue: string
) {
  // Optimistic UI update happens via v-model

  const result = await supabase
    .from('classifications')
    .update({ [field]: newValue })
    .eq('id', recordId)
    .select()
    .single()

  if (result.error) {
    // Revert UI
    revertField(recordId, field, previousValue)
    toast.error('Save failed. Please try again.')
    return
  }

  // Record undo
  recordChange({
    type: 'single',
    changes: [{ recordId, field, previousValue, newValue }],
    description: `Changed ${field}`
  })

  // Show success toast with undo
  showWithUndo('Change saved', executeUndo)
}
```

## Troubleshooting

### Undo Not Working

1. Check if `undoEntry` is populated
2. Verify timer hasn't expired (check `canUndo`)
3. Ensure Supabase update is using correct record ID

### Toast Not Showing Undo Button

1. Verify `action` property is passed to toast
2. Check Toast.vue renders action button conditionally
3. Ensure `showWithUndo()` is being called (not `success()`)

### Keyboard Shortcut Not Triggering

1. Ensure focus is not in text input
2. Check keyboard shortcut registration
3. Verify `canUndo` returns true

## Files Changed Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/types/undo.ts` | NEW | Undo type definitions |
| `src/composables/useUndo.ts` | NEW | Undo state management |
| `src/composables/useToast.ts` | MODIFY | Add action support |
| `src/composables/useInlineEdit.ts` | MODIFY | Add instant save |
| `src/composables/useKeyboardShortcuts.ts` | MODIFY | Add Ctrl+Z |
| `src/components/shared/Toast.vue` | MODIFY | Add action button |
| `src/components/InlineEditCell.vue` | MODIFY | Instant save on change |
| `src/components/ClassificationList.vue` | MODIFY | Wire instant save |
| `tests/unit/composables/useUndo.spec.ts` | NEW | Unit tests |
| `tests/e2e/instant-edit.spec.ts` | NEW | E2E tests |
