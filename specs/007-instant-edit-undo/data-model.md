# Data Model: Instant Edit with Undo

**Feature**: 007-instant-edit-undo
**Date**: 2025-11-25
**Purpose**: Define TypeScript types and state structures for undo functionality

## Type Definitions

### Core Undo Types

```typescript
// src/types/undo.ts

/**
 * Represents a single field change that can be undone
 */
export interface UndoChange {
  /** Classification record ID */
  recordId: number
  /** Field that was changed (category, urgency, action) */
  field: 'category' | 'urgency' | 'action'
  /** Value before the change */
  previousValue: string
  /** Value after the change */
  newValue: string
}

/**
 * Represents an undoable action (single or bulk)
 */
export interface UndoEntry {
  /** Unique identifier for this undo entry */
  id: string
  /** Type of operation */
  type: 'single' | 'bulk'
  /** When the change was made */
  timestamp: number
  /** Array of changes (single item for 'single' type, multiple for 'bulk') */
  changes: UndoChange[]
  /** Human-readable description for toast message */
  description: string
}

/**
 * State managed by useUndo composable
 */
export interface UndoState {
  /** Current undo entry (null if nothing to undo) */
  entry: UndoEntry | null
  /** Whether undo operation is in progress */
  isUndoing: boolean
  /** Error message if undo failed */
  error: string | null
}

/**
 * Result of executing an undo operation
 */
export interface UndoResult {
  success: boolean
  error?: string
  /** Records that were restored */
  restoredRecords?: number[]
}
```

### Extended Toast Types

```typescript
// Extension to existing useToast types

/**
 * Action button configuration for toast
 */
export interface ToastAction {
  /** Button label (e.g., "Undo") */
  label: string
  /** Callback when button is clicked */
  onClick: () => void | Promise<void>
  /** Whether button is currently disabled */
  disabled?: boolean
}

/**
 * Extended toast with optional action
 */
export interface ToastWithAction {
  id: number
  message: string
  type: ToastType
  duration: number
  /** Optional action button */
  action?: ToastAction
}
```

## State Transitions

### Undo State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────┐    recordChange()    ┌─────────────┐         │
│  │  EMPTY   │ ─────────────────────▶│   PENDING   │         │
│  │          │                       │             │         │
│  └──────────┘                       └─────────────┘         │
│       ▲                                   │                 │
│       │                                   │                 │
│       │ clearUndo()                       │ executeUndo()   │
│       │ timeout (30s)                     │                 │
│       │ navigation                        ▼                 │
│       │                             ┌─────────────┐         │
│       │                             │   UNDOING   │         │
│       │                             │             │         │
│       │                             └─────────────┘         │
│       │                                   │                 │
│       │               ┌───────────────────┼───────────────┐ │
│       │               │                   │               │ │
│       │               ▼                   ▼               │ │
│       │         ┌──────────┐       ┌──────────┐          │ │
│       └─────────│ SUCCESS  │       │  ERROR   │──────────┘ │
│                 │          │       │ (retry)  │            │
│                 └──────────┘       └──────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Save State Machine (Modified)

```
Current Flow (with confirmation):
  VIEWING → EDITING → (user clicks Save) → SAVING → SUCCESS/ERROR

New Flow (instant save):
  VIEWING → (user changes dropdown) → SAVING → SUCCESS (with undo) / ERROR (with retry)
```

## Entity Relationships

```
┌────────────────────┐
│  Classification    │
│  (Supabase)        │
├────────────────────┤
│  id: number        │
│  category: string  │◄───────────────────┐
│  urgency: string   │                    │
│  action: string    │                    │
│  version: number   │                    │ references
└────────────────────┘                    │
         ▲                                │
         │ saves to                       │
         │ restores from                  │
         │                                │
┌────────────────────┐           ┌────────────────────┐
│  UndoEntry         │           │  UndoChange        │
│  (Client-side)     │           │  (Client-side)     │
├────────────────────┤           ├────────────────────┤
│  id: string        │           │  recordId: number  │
│  type: enum        │ contains  │  field: string     │
│  timestamp: number │──────────▶│  previousValue     │
│  changes: array    │           │  newValue          │
│  description: str  │           └────────────────────┘
└────────────────────┘
         │
         │ managed by
         ▼
┌────────────────────┐
│  UndoState         │
│  (Composable)      │
├────────────────────┤
│  entry: UndoEntry? │
│  isUndoing: bool   │
│  error: string?    │
└────────────────────┘
```

## Validation Rules

### UndoEntry Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| id | Required, non-empty string | "Undo entry must have an ID" |
| type | Must be 'single' or 'bulk' | "Invalid undo type" |
| timestamp | Must be positive number | "Invalid timestamp" |
| changes | Non-empty array | "Undo entry must have at least one change" |
| changes[].recordId | Must be positive integer | "Invalid record ID" |
| changes[].field | Must be valid field name | "Invalid field name" |

### Undo Execution Validation

| Condition | Behavior |
|-----------|----------|
| No undo entry | No-op, return early |
| Undo already in progress | No-op, prevent double-submit |
| Entry expired (>30s) | Clear entry, show "Undo expired" toast |
| Record not found | Show error, clear entry |
| Version conflict | Show conflict resolution options |

## Data Flow

### Instant Save Flow

```
1. User selects new dropdown value
   │
2. InlineEditCell emits 'instant-save' event
   │
3. useInlineEdit.instantSave(recordId, field, newValue)
   │
   ├──▶ 4a. Optimistic UI update (immediate)
   │
   └──▶ 4b. Supabase update request
              │
              ├──▶ 5a. Success:
              │         - Record undo entry
              │         - Show toast with Undo button
              │         - Start 30s timer
              │
              └──▶ 5b. Failure:
                        - Revert UI to previous value
                        - Show error toast with Retry
```

### Undo Flow

```
1. User clicks Undo (toast button or Ctrl+Z)
   │
2. useUndo.executeUndo()
   │
   ├──▶ 3a. Set isUndoing = true
   │
   └──▶ 3b. For each change in entry:
              │
              └──▶ Supabase update (restore previousValue)
                     │
                     ├──▶ 4a. Success:
                     │         - Update UI
                     │         - Clear undo entry
                     │         - Dismiss toast
                     │         - Show "Change undone" toast
                     │
                     └──▶ 4b. Failure:
                               - Keep undo entry
                               - Show error toast with Retry
```

## Migration Notes

### Breaking Changes

1. **Remove confirmation dialog**: The "Are you sure?" dialog before save is removed
2. **Remove Save button**: No longer needed for inline edits
3. **Change dropdown behavior**: Now triggers immediate save instead of staging change

### Backward Compatibility

1. **Existing data**: No database schema changes required
2. **Existing tests**: Some tests may need updates to reflect new save behavior
3. **Keyboard shortcuts**: Ctrl+Z now has application-specific behavior (may conflict with browser undo in text inputs)
