# Research: Instant Edit with Undo

**Feature**: 007-instant-edit-undo
**Date**: 2025-11-25
**Purpose**: Resolve technical unknowns and document design decisions

## Research Topics

### 1. Vue Composable Pattern for Undo State Management

**Decision**: Create a dedicated `useUndo` composable using Vue's Composition API with reactive state.

**Rationale**:
- Separation of concerns: undo logic isolated from inline edit logic
- Reusable: can be used across different components (list view, detail view)
- Testable: pure composable can be unit tested in isolation
- Follows existing codebase patterns (useInlineEdit, useToast, etc.)

**Alternatives Considered**:
1. **Pinia store for undo** - Rejected: overkill for single-level undo, adds unnecessary complexity
2. **Component-local state** - Rejected: not shareable across components, harder to test
3. **Event bus pattern** - Rejected: harder to trace, deprecated pattern in Vue 3

**Implementation Pattern**:
```typescript
// useUndo.ts
export function useUndo() {
  const undoEntry = ref<UndoEntry | null>(null)
  const timeoutId = ref<number | null>(null)

  function recordChange(entry: UndoEntry) { ... }
  function executeUndo(): Promise<boolean> { ... }
  function clearUndo() { ... }

  return { undoEntry, canUndo, recordChange, executeUndo, clearUndo }
}
```

---

### 2. Toast with Action Button Pattern

**Decision**: Extend existing toast system to support an optional action callback and button text.

**Rationale**:
- Minimal change to existing working toast system
- Follows Gmail/Google Docs undo toast pattern (industry standard)
- Toast already handles timing, animations, and accessibility

**Alternatives Considered**:
1. **Separate undo notification component** - Rejected: duplicates toast functionality
2. **Inline undo button in table row** - Rejected: clutters UI, harder to implement for bulk actions
3. **Floating action button** - Rejected: inconsistent with existing UI patterns

**Implementation Pattern**:
```typescript
// Extended toast interface
interface ToastWithAction {
  id: number
  message: string
  type: ToastType
  duration: number
  action?: {
    label: string
    callback: () => void
  }
}
```

---

### 3. Instant Save Trigger Point

**Decision**: Trigger save on dropdown `@change` event, replacing the current "Save" button flow.

**Rationale**:
- Most direct user intent signal - selecting a value means "I want this"
- Aligns with modern auto-save patterns (Notion, Google Docs, Figma)
- Eliminates extra click, reducing time from 5+ seconds to <2 seconds

**Alternatives Considered**:
1. **Debounced save on any change** - Rejected: adds latency, confusing for dropdowns
2. **Save on blur/focus-out** - Rejected: inconsistent behavior, may miss changes
3. **Save button with auto-submit timer** - Rejected: still requires confirmation step

**Implementation Pattern**:
- InlineEditCell dropdown: `@change="handleInstantSave(field, value)"`
- CategoryDropdown: emit change event immediately
- Remove "Save" button from inline edit UI
- Keep "Cancel" as "Revert" for consistency (or remove if undo covers it)

---

### 4. Keyboard Shortcut Integration (Ctrl+Z)

**Decision**: Extend existing `useKeyboardShortcuts` composable with undo handler.

**Rationale**:
- Existing keyboard shortcut infrastructure in place
- Standard keyboard pattern familiar to all users
- Can check `canUndo` state before executing

**Alternatives Considered**:
1. **Dedicated undo keyboard listener** - Rejected: duplicates existing shortcut handling
2. **Browser native undo interception** - Rejected: conflicts with text input undo

**Implementation Pattern**:
```typescript
// In useKeyboardShortcuts.ts
{
  key: 'z',
  ctrl: true,
  meta: true, // For Mac Cmd+Z
  handler: () => {
    if (undoState.canUndo) {
      undoState.executeUndo()
    }
  }
}
```

---

### 5. Optimistic UI Update Strategy

**Decision**: Apply UI change immediately, revert on failure or undo.

**Rationale**:
- Provides instant feedback (<100ms) per SC-003
- Existing optimistic locking handles conflicts
- Undo naturally fits this pattern (restore previous state)

**Alternatives Considered**:
1. **Wait for server confirmation** - Rejected: adds perceived latency, worse UX
2. **Optimistic with background sync** - Considered but unnecessary for single-level undo

**Implementation Pattern**:
1. User selects new value → UI updates immediately
2. Save request sent to Supabase
3. On success: show toast with undo option, record undo entry
4. On failure: revert UI, show error toast with retry
5. On undo: restore previous value in UI and database

---

### 6. Undo Window Timer Management

**Decision**: Use `setTimeout` with cleanup on component unmount and page navigation.

**Rationale**:
- Simple, reliable timer mechanism
- Vue's `onUnmounted` lifecycle hook handles cleanup
- Router navigation guard can clear undo state

**Alternatives Considered**:
1. **Web Worker timer** - Rejected: overkill for simple timeout
2. **requestAnimationFrame loop** - Rejected: inappropriate for long timeouts
3. **Server-side undo tracking** - Rejected: adds complexity, not needed for 30s window

**Implementation Pattern**:
```typescript
function recordChange(entry: UndoEntry) {
  // Clear any existing timer
  if (timeoutId.value) clearTimeout(timeoutId.value)

  undoEntry.value = entry

  // Set new 30-second expiration
  timeoutId.value = window.setTimeout(() => {
    clearUndo()
  }, 30000)
}
```

---

### 7. Bulk Operation Undo Strategy

**Decision**: Treat bulk operation as single undo entry containing all affected records.

**Rationale**:
- Consistent with single-level undo constraint
- User expects "undo bulk action" to undo all changes, not just one
- Simpler mental model

**Alternatives Considered**:
1. **Individual undo per record** - Rejected: violates single-level constraint, confusing
2. **Undo stack for bulk** - Rejected: adds complexity beyond MVP scope

**Implementation Pattern**:
```typescript
interface UndoEntry {
  type: 'single' | 'bulk'
  timestamp: number
  changes: Array<{
    recordId: number
    field: string
    previousValue: unknown
    newValue: unknown
  }>
}
```

---

## Summary of Decisions

| Topic | Decision | Key Reason |
|-------|----------|------------|
| Undo State | New `useUndo` composable | Separation of concerns, testability |
| Undo UI | Extended toast with action button | Industry standard pattern |
| Save Trigger | Dropdown `@change` event | Most direct user intent |
| Keyboard | Extend `useKeyboardShortcuts` | Reuse existing infrastructure |
| UI Updates | Optimistic with revert | Instant feedback |
| Timer | `setTimeout` with cleanup | Simple, reliable |
| Bulk Undo | Single entry for all changes | Consistent mental model |

## Dependencies Identified

1. **Existing Composables**: useInlineEdit, useToast, useKeyboardShortcuts
2. **Existing Components**: Toast.vue, InlineEditCell.vue, ClassificationList.vue
3. **Existing Store**: classificationStore (for optimistic updates)
4. **Supabase Client**: Already configured for classifications table

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Race condition on rapid changes | Queue changes, only record latest for undo |
| Toast dismissed before user sees undo | 30-second duration is generous; close button doesn't remove undo capability |
| User navigates away mid-undo | Router guard warns if undo pending; undo cleared on navigation |
| Conflict during undo operation | Existing optimistic locking handles; show error toast with retry |
