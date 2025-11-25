# Data Model: Inline Table Editing for Corrections

**Feature Branch**: `004-inline-edit`
**Date**: 2025-11-23
**Database**: Supabase PostgreSQL (project: xmziovusqlmgygcrgyqt)
**Parent Feature**: `003-correction-ui`

---

## Purpose

This document defines the data structures for implementing inline table editing in the corrections UI. It covers database schema changes for optimistic locking, client-side state management, local storage for offline resilience, and TypeScript type definitions.

---

## 1. Database Schema Changes

### Version Column for Optimistic Locking

Add a `version` column to the `classifications` table to enable optimistic concurrency control.

```sql
-- Migration: 004_add_version_column_to_classifications
-- Description: Add version column for optimistic locking during inline edits

ALTER TABLE classifications
ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- Create trigger to auto-increment version on update
CREATE OR REPLACE FUNCTION increment_classification_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER classifications_version_trigger
BEFORE UPDATE ON classifications
FOR EACH ROW EXECUTE FUNCTION increment_classification_version();

-- Index for version lookups (used in conditional updates)
CREATE INDEX idx_classifications_id_version ON classifications(id, version);
```

**Updated Table Schema**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigserial | PRIMARY KEY | Unique identifier |
| `email_id` | bigint | FOREIGN KEY, UNIQUE | Reference to emails table |
| `category` | text | CHECK constraint | KIDS, ROBYN, WORK, FINANCIAL, SHOPPING, OTHER |
| `urgency` | text | CHECK constraint | HIGH, MEDIUM, LOW |
| `action` | text | CHECK constraint | FYI, RESPOND, TASK, PAYMENT, CALENDAR, NONE |
| `confidence_score` | numeric | CHECK (0-1) | AI confidence score |
| `version` | integer | NOT NULL, DEFAULT 1 | **NEW**: Optimistic lock version |
| `corrected_timestamp` | timestamptz | NULLABLE | When correction was made |
| `corrected_by` | text | NULLABLE | Who made the correction |
| `updated_at` | timestamptz | DEFAULT now() | Last modification timestamp |

**Behavior**:
- Every UPDATE automatically increments `version` via trigger
- Client must include current `version` in WHERE clause for updates
- If `version` mismatch, update affects 0 rows (conflict detected)

---

## 2. Client-Side State Model

### Pinia Store Structure

The corrections store manages global classification data and inline edit state.

```typescript
// stores/corrections.ts
interface CorrectionsStoreState {
  // Data state
  classifications: ClassificationWithEmail[]
  loading: boolean
  error: string | null

  // Pagination state
  pagination: PaginationState

  // Inline edit state
  editingRowId: number | null
  editingData: InlineEditData | null
  dirtyFields: Set<EditableField>
  saveStatus: SaveStatus

  // Conflict resolution
  conflictData: ConflictData | null

  // Offline state
  isOnline: boolean
  pendingSubmissions: PendingSubmission[]
}

interface PaginationState {
  currentPage: number
  pageSize: number
  totalCount: number
  sortBy: string
  sortDir: 'asc' | 'desc'
}
```

### Store Getters

```typescript
interface CorrectionsStoreGetters {
  // Computed properties
  pageCount: number
  hasDirtyChanges: boolean
  isEditing: boolean
  canSave: boolean
  hasConflict: boolean
  hasPendingSubmissions: boolean
  currentEditingRow: ClassificationWithEmail | null
}
```

### Store Actions

```typescript
interface CorrectionsStoreActions {
  // Data operations
  fetchClassifications(filters?: ClassificationFilters): Promise<void>
  refreshCurrentPage(): Promise<void>

  // Edit operations
  startEditing(id: number): void
  updateEditField<K extends EditableField>(field: K, value: EditableFieldValue[K]): void
  cancelEditing(): void
  saveEditing(): Promise<SaveResult>

  // Conflict resolution
  resolveConflict(resolution: ConflictResolution): Promise<void>

  // Offline operations
  queueSubmission(submission: PendingSubmission): void
  processQueue(): Promise<void>

  // Navigation guards
  confirmDiscardChanges(): boolean
}
```

---

## 3. Local Storage Schema

### Key Naming Convention

All localStorage keys follow a namespaced pattern for collision avoidance and versioning.

```typescript
// constants/storage.ts
const STORAGE_PREFIX = 'correction-ui'
const STORAGE_VERSION = 'v1'

const storageKeys = {
  // Draft edits (per row)
  draftEdit: (rowId: number) =>
    `${STORAGE_PREFIX}:${STORAGE_VERSION}:draft:${rowId}`,

  // Pending submissions queue
  pendingSubmissions: () =>
    `${STORAGE_PREFIX}:${STORAGE_VERSION}:pending`,

  // User preferences
  userPreferences: () =>
    `${STORAGE_PREFIX}:${STORAGE_VERSION}:prefs`,

  // Session edit state (for auth redirect recovery)
  sessionEditState: () =>
    `${STORAGE_PREFIX}:${STORAGE_VERSION}:session-edit`,
}
```

### Draft Edit Schema

Saved when user is editing a row (for offline resilience and session recovery).

```typescript
interface DraftEditData {
  // Identification
  rowId: number
  originalVersion: number

  // Edit values
  data: InlineEditData

  // Metadata
  savedAt: number        // Unix timestamp (ms)
  originalValues: {      // For dirty comparison
    category: Category
    urgency: UrgencyLevel
    action: ActionType
  }
}

// localStorage key: correction-ui:v1:draft:{rowId}
// TTL: 24 hours (cleaned on app startup)
```

### Pending Submissions Schema

Queue for edits made while offline.

```typescript
interface PendingSubmissionRecord {
  // Identification
  id: string             // UUID for deduplication
  classificationId: number
  expectedVersion: number

  // Update data
  updates: ClassificationUpdate

  // Queue metadata
  queuedAt: number       // Unix timestamp (ms)
  attempts: number       // Retry count
  lastAttemptAt: number | null
  lastError: string | null
}

// localStorage key: correction-ui:v1:pending
// Value: PendingSubmissionRecord[]
// Max items: 50 (oldest removed if exceeded)
// Max age: 7 days
```

### User Preferences Schema

Persistent user settings.

```typescript
interface UserPreferences {
  // Display preferences
  pageSize: number       // Default: 20
  defaultSortBy: string  // Default: 'classified_timestamp'
  defaultSortDir: 'asc' | 'desc'  // Default: 'desc'

  // Edit behavior
  autoSaveEnabled: boolean  // Default: true
  confirmOnNavigate: boolean  // Default: true
}

// localStorage key: correction-ui:v1:prefs
// No TTL (persists indefinitely)
```

### Session Edit State Schema

Saved before auth redirect for recovery after login.

```typescript
interface SessionEditState {
  // Active edit (if any)
  editingRowId: number | null
  editData: InlineEditData | null
  dirtyFields: EditableField[]

  // Navigation context
  returnUrl: string

  // Timestamp
  savedAt: number
}

// localStorage key: correction-ui:v1:session-edit
// TTL: 1 hour (cleared after successful restore)
```

### Cleanup Policy

```typescript
interface StorageCleanupPolicy {
  // Run on app initialization
  draftMaxAge: 24 * 60 * 60 * 1000    // 24 hours
  pendingMaxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
  sessionMaxAge: 60 * 60 * 1000       // 1 hour

  // Remove old version keys (migration)
  removeOldVersions: true
}
```

---

## 4. TypeScript Type Definitions

### Core Classification Types

```typescript
// types/classification.ts

import type { Category, UrgencyLevel, ActionType } from './enums'

/**
 * Classification record from database
 * Extended with version column for optimistic locking
 */
export interface Classification {
  id: number
  email_id: number
  category: Category
  urgency: UrgencyLevel
  action: ActionType
  confidence_score: number
  extracted_names: string[] | null
  extracted_dates: string[] | null
  extracted_amounts: string[] | null
  classified_timestamp: string
  original_category: Category | null
  original_urgency: UrgencyLevel | null
  original_action: ActionType | null
  corrected_timestamp: string | null
  corrected_by: string | null
  version: number  // NEW: Optimistic lock version
  created_at: string
  updated_at: string
}

/**
 * Classification with joined email data
 */
export interface ClassificationWithEmail extends Classification {
  email: {
    id: number
    message_id: string
    subject: string | null
    sender: string | null
    body: string | null
    received_timestamp: string | null
  }
}

/**
 * Fields that can be edited inline
 */
export type EditableField = 'category' | 'urgency' | 'action'

/**
 * Value types for editable fields
 */
export interface EditableFieldValue {
  category: Category
  urgency: UrgencyLevel
  action: ActionType
}

/**
 * Update payload for classification corrections
 */
export interface ClassificationUpdate {
  category?: Category
  urgency?: UrgencyLevel
  action?: ActionType
}
```

### Inline Edit State Types

```typescript
// types/inline-edit.ts

import type { Category, UrgencyLevel, ActionType } from './enums'
import type { EditableField, ClassificationWithEmail } from './classification'

/**
 * Current inline edit data
 */
export interface InlineEditData {
  category: Category
  urgency: UrgencyLevel
  action: ActionType
}

/**
 * Complete inline edit state
 */
export interface InlineEditState {
  // Which row is being edited
  rowId: number | null

  // Original values (for revert and dirty checking)
  originalValues: InlineEditData | null

  // Original version (for optimistic locking)
  originalVersion: number | null

  // Current edit values
  currentValues: InlineEditData | null

  // Which fields have been modified
  dirtyFields: Set<EditableField>

  // Current save operation status
  saveStatus: SaveStatus

  // Display mode (responsive)
  displayMode: DisplayMode

  // Validation state
  validationErrors: ValidationError[]

  // beforeunload handler attached
  guardAttached: boolean
}

/**
 * Save operation status
 */
export type SaveStatus =
  | 'idle'
  | 'saving'
  | 'success'
  | 'error'
  | 'conflict'
  | 'offline'

/**
 * Display mode for responsive editing
 */
export type DisplayMode = 'inline' | 'modal'

/**
 * Validation error for a specific field
 */
export interface ValidationError {
  field: EditableField
  message: string
}
```

### Conflict Resolution Types

```typescript
// types/conflict.ts

import type { Classification, InlineEditData, EditableField } from './classification'

/**
 * Conflict data when version mismatch occurs
 */
export interface ConflictData {
  // The row that has a conflict
  classificationId: number

  // What the client tried to save
  clientValues: InlineEditData
  clientVersion: number

  // Current state on server
  serverValues: InlineEditData
  serverVersion: number

  // Which fields actually conflict
  conflictingFields: EditableField[]

  // Which fields can be auto-merged (changed on one side only)
  mergeableFields: EditableField[]

  // Full server record for reference
  serverRecord: Classification
}

/**
 * User's resolution choice
 */
export type ConflictResolution =
  | { type: 'keep-mine' }           // Force overwrite with client values
  | { type: 'use-server' }          // Discard client changes
  | { type: 'merge'; merged: InlineEditData }  // Custom merge

/**
 * Result of attempting to merge changes
 */
export interface MergeResult {
  // Fields that can be automatically merged
  autoMerged: Partial<InlineEditData>

  // Fields with true conflicts requiring user decision
  conflicts: ConflictField[]

  // Whether auto-merge is possible (no true conflicts)
  canAutoMerge: boolean
}

/**
 * A single field conflict
 */
export interface ConflictField {
  field: EditableField
  originalValue: string
  clientValue: string
  serverValue: string
}
```

### Offline/Pending Submission Types

```typescript
// types/offline.ts

import type { ClassificationUpdate } from './classification'

/**
 * A submission waiting to be sent
 */
export interface PendingSubmission {
  // Unique identifier
  id: string

  // Target classification
  classificationId: number
  expectedVersion: number

  // What to update
  updates: ClassificationUpdate

  // Queue metadata
  queuedAt: number
  attempts: number
  lastAttemptAt: number | null
  lastError: string | null
}

/**
 * Result of processing a pending submission
 */
export type SubmissionResult =
  | { status: 'success'; newVersion: number }
  | { status: 'conflict'; conflictData: ConflictData }
  | { status: 'error'; error: string; retryable: boolean }

/**
 * Offline state tracking
 */
export interface OfflineState {
  isOnline: boolean
  lastOnlineAt: number | null
  pendingCount: number
}
```

### Save Operation Types

```typescript
// types/save.ts

import type { Classification } from './classification'
import type { ConflictData } from './conflict'

/**
 * Result of a save operation
 */
export type SaveResult =
  | { success: true; data: Classification }
  | { success: false; error: SaveError }

/**
 * Types of save errors
 */
export type SaveError =
  | { type: 'conflict'; conflictData: ConflictData }
  | { type: 'offline'; message: string }
  | { type: 'validation'; errors: ValidationError[] }
  | { type: 'network'; message: string; retryable: boolean }
  | { type: 'unknown'; message: string }

/**
 * Validation error
 */
export interface ValidationError {
  field: string
  message: string
}
```

### Draft Data Types

```typescript
// types/draft.ts

import type { InlineEditData, EditableField } from './classification'

/**
 * Draft edit saved to localStorage
 */
export interface DraftData {
  // Target row
  rowId: number
  originalVersion: number

  // Edit state
  data: InlineEditData
  dirtyFields: EditableField[]

  // Original values for dirty comparison
  originalValues: InlineEditData

  // Metadata
  savedAt: number
}

/**
 * Session state saved before auth redirect
 */
export interface SessionState {
  editingRowId: number | null
  editData: InlineEditData | null
  dirtyFields: EditableField[]
  returnUrl: string
  savedAt: number
}
```

---

## 5. State Transitions

### Edit Mode State Machine

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    v                                         │
┌──────────┐   startEdit()   ┌──────────┐                    │
│   IDLE   │ ───────────────>│ EDITING  │                    │
└──────────┘                 └──────────┘                    │
     ^                            │                          │
     │                            │ save()                   │
     │                            v                          │
     │                       ┌──────────┐                    │
     │                       │  SAVING  │                    │
     │                       └──────────┘                    │
     │                            │                          │
     │         ┌──────────────────┼──────────────────┐       │
     │         │                  │                  │       │
     │         v                  v                  v       │
     │    ┌─────────┐       ┌──────────┐      ┌──────────┐   │
     │    │ SUCCESS │       │  ERROR   │      │ CONFLICT │   │
     │    └─────────┘       └──────────┘      └──────────┘   │
     │         │                  │                  │       │
     │         │ (auto 2s)        │ retry()          │ resolve()
     │         v                  v                  v       │
     │    ┌─────────────────────────────────────────────┐    │
     └────│              Return to IDLE                 │────┘
          │      or EDITING (on retry/resolve)          │
          └─────────────────────────────────────────────┘
```

### State Transitions Table

| Current State | Event | Next State | Side Effects |
|---------------|-------|------------|--------------|
| `idle` | `startEditing(rowId)` | `editing` | Copy row values to edit state, attach beforeunload guard |
| `editing` | `updateField(field, value)` | `editing` | Update dirty fields set, auto-save draft to localStorage |
| `editing` | `cancelEditing()` | `idle` | Clear edit state, remove draft from localStorage, detach guard |
| `editing` | `save()` | `saving` | Disable inputs, show loading indicator |
| `saving` | API success | `success` | Update row in store, clear draft |
| `saving` | API conflict (version mismatch) | `conflict` | Populate conflict data, show resolution UI |
| `saving` | API error | `error` | Show error message, keep edit state |
| `saving` | Network offline | `offline` | Queue submission, show offline indicator |
| `success` | timeout (2s) | `idle` | Clear success indicator, detach guard |
| `error` | `retry()` | `saving` | Retry API call |
| `error` | `cancel()` | `editing` | Return to edit mode |
| `conflict` | `resolve('keep-mine')` | `saving` | Force update with new version |
| `conflict` | `resolve('use-server')` | `idle` | Discard changes, update local row |
| `conflict` | `resolve('merge', merged)` | `saving` | Save merged values |
| `offline` | `online` event | `saving` | Auto-retry pending submissions |

### Display Mode Transitions

```
┌───────────────────────────────────────────────────────┐
│                  Screen Resize                        │
├───────────────────────────────────────────────────────┤
│                                                       │
│   width < 768px          width >= 768px               │
│        │                       │                      │
│        v                       v                      │
│   ┌─────────┐             ┌─────────┐                │
│   │  MODAL  │ <────────── │ INLINE  │                │
│   └─────────┘ ──────────> └─────────┘                │
│                                                       │
└───────────────────────────────────────────────────────┘
```

---

## 6. Validation Rules

### Field Validation

| Field | Type | Required | Valid Values | Error Message |
|-------|------|----------|--------------|---------------|
| `category` | enum | Yes | KIDS, ROBYN, WORK, FINANCIAL, SHOPPING, OTHER | "Category is required" |
| `urgency` | enum | Yes | HIGH, MEDIUM, LOW | "Urgency level is required" |
| `action` | enum | Yes | FYI, RESPOND, TASK, PAYMENT, CALENDAR, NONE | "Action type is required" |

### Validation Logic

```typescript
// validation/classification.ts

import { CATEGORIES, URGENCY_LEVELS, ACTION_TYPES } from '@/types/enums'
import type { InlineEditData, ValidationError, EditableField } from '@/types'

/**
 * Validate inline edit data
 */
export function validateInlineEdit(data: InlineEditData): ValidationError[] {
  const errors: ValidationError[] = []

  // Category validation
  if (!data.category) {
    errors.push({ field: 'category', message: 'Category is required' })
  } else if (!CATEGORIES.includes(data.category)) {
    errors.push({ field: 'category', message: `Invalid category: ${data.category}` })
  }

  // Urgency validation
  if (!data.urgency) {
    errors.push({ field: 'urgency', message: 'Urgency level is required' })
  } else if (!URGENCY_LEVELS.includes(data.urgency)) {
    errors.push({ field: 'urgency', message: `Invalid urgency: ${data.urgency}` })
  }

  // Action validation
  if (!data.action) {
    errors.push({ field: 'action', message: 'Action type is required' })
  } else if (!ACTION_TYPES.includes(data.action)) {
    errors.push({ field: 'action', message: `Invalid action: ${data.action}` })
  }

  return errors
}

/**
 * Check if edit data is valid
 */
export function isValidEdit(data: InlineEditData): boolean {
  return validateInlineEdit(data).length === 0
}

/**
 * Check if any changes were made (dirty check)
 */
export function hasChanges(
  original: InlineEditData,
  current: InlineEditData
): boolean {
  return (
    original.category !== current.category ||
    original.urgency !== current.urgency ||
    original.action !== current.action
  )
}

/**
 * Get list of changed fields
 */
export function getChangedFields(
  original: InlineEditData,
  current: InlineEditData
): EditableField[] {
  const changed: EditableField[] = []

  if (original.category !== current.category) changed.push('category')
  if (original.urgency !== current.urgency) changed.push('urgency')
  if (original.action !== current.action) changed.push('action')

  return changed
}
```

### Pre-Save Validation

Before saving, the following checks are performed:

1. **Required fields**: All three editable fields must have values
2. **Enum membership**: Values must be valid enum members
3. **Dirty state**: At least one field must have changed (no-op saves blocked)
4. **Version present**: Original version must be tracked for optimistic lock

### Database-Level Constraints

The database enforces additional constraints:

```sql
-- Category constraint
CHECK (category IN ('KIDS', 'ROBYN', 'WORK', 'FINANCIAL', 'SHOPPING', 'OTHER'))

-- Urgency constraint
CHECK (urgency IN ('HIGH', 'MEDIUM', 'LOW'))

-- Action constraint
CHECK (action IN ('FYI', 'RESPOND', 'TASK', 'PAYMENT', 'CALENDAR', 'NONE'))
```

---

## 7. API Contract

### Update Classification Endpoint

**Supabase Query with Optimistic Locking**:

```typescript
// services/classificationService.ts

export async function updateClassificationWithVersion(
  id: number,
  updates: ClassificationUpdate,
  expectedVersion: number
): Promise<SaveResult> {
  // Attempt update with version check
  const { data, error } = await supabase
    .from('classifications')
    .update({
      ...updates,
      // version auto-incremented by trigger
      // updated_at auto-set by trigger
    })
    .eq('id', id)
    .eq('version', expectedVersion)  // Optimistic lock check
    .select()
    .single()

  // Check for version conflict (no rows matched)
  if (error?.code === 'PGRST116' || !data) {
    // Fetch current server state for conflict resolution
    const { data: serverData } = await supabase
      .from('classifications')
      .select('*')
      .eq('id', id)
      .single()

    if (serverData) {
      return {
        success: false,
        error: {
          type: 'conflict',
          conflictData: buildConflictData(id, updates, expectedVersion, serverData)
        }
      }
    }
  }

  if (error) {
    return {
      success: false,
      error: { type: 'network', message: error.message, retryable: true }
    }
  }

  return { success: true, data }
}
```

---

## Summary

This data model provides:

1. **Database Schema**: Version column with auto-increment trigger for optimistic locking
2. **Pinia Store**: Centralized state for classifications and inline edit state
3. **Local Storage**: Namespaced keys for drafts, pending submissions, and preferences
4. **Type Definitions**: Comprehensive TypeScript interfaces for all data structures
5. **State Machine**: Clear transitions for edit mode lifecycle
6. **Validation**: Client-side validation rules matching database constraints

**Migration Required**: One database migration to add `version` column to `classifications` table.
