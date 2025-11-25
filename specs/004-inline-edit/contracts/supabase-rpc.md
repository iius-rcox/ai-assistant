# Supabase RPC Contract: Inline Edit Operations

**Feature Branch**: `004-inline-edit`
**Date**: 2025-11-23
**Database**: Supabase PostgreSQL (project: xmziovusqlmgygcrgyqt)
**Supabase JS Version**: 2.45+

---

## Purpose

This document defines the Supabase query patterns and RPC contracts for implementing inline table editing with optimistic locking, conflict detection, and offline queue processing. These patterns extend the existing data model from `003-correction-ui`.

---

## Table of Contents

1. [Classification Update with Version Check](#1-classification-update-with-version-check)
2. [Conflict Detection and Resolution](#2-conflict-detection-and-resolution)
3. [Batch Operations for Offline Queue](#3-batch-operations-for-offline-queue)
4. [Query Pattern Reference](#4-query-pattern-reference)
5. [TypeScript Service Implementation](#5-typescript-service-implementation)
6. [Database Migration: Version Column](#6-database-migration-version-column)

---

## 1. Classification Update with Version Check

### Overview

Optimistic locking ensures data integrity when multiple users or processes may edit the same classification. The pattern uses a `version` column that increments on each update.

### Database Schema Requirement

```sql
-- Migration: add_version_column_to_classifications
-- Required for optimistic locking support

ALTER TABLE classifications
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Trigger to auto-increment version on update
CREATE OR REPLACE FUNCTION increment_classification_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS classifications_version_trigger ON classifications;
CREATE TRIGGER classifications_version_trigger
BEFORE UPDATE ON classifications
FOR EACH ROW EXECUTE FUNCTION increment_classification_version();

-- Index for efficient version lookups
CREATE INDEX IF NOT EXISTS idx_classifications_id_version
ON classifications(id, version);
```

### TypeScript Interface

```typescript
// types/inline-edit.ts

/**
 * Update request with optimistic locking
 */
export interface OptimisticUpdateRequest {
  /** Classification ID to update */
  id: number
  /** Expected version (from when row was loaded) */
  expectedVersion: number
  /** Field updates to apply */
  updates: {
    category?: 'KIDS' | 'ROBYN' | 'WORK' | 'FINANCIAL' | 'SHOPPING' | 'OTHER'
    urgency?: 'HIGH' | 'MEDIUM' | 'LOW'
    action?: 'FYI' | 'RESPOND' | 'TASK' | 'PAYMENT' | 'CALENDAR' | 'NONE'
    correction_reason?: string | null
  }
  /** User identifier for audit trail */
  correctedBy?: string
}

/**
 * Update result with conflict information
 */
export interface OptimisticUpdateResult {
  /** Whether update succeeded */
  success: boolean
  /** Updated classification (if success) */
  data?: Classification
  /** New version number (if success) */
  newVersion?: number
  /** Conflict details (if failed due to version mismatch) */
  conflict?: ConflictInfo
  /** Error message (if failed for other reasons) */
  error?: string
}

/**
 * Conflict information for user resolution
 */
export interface ConflictInfo {
  /** Current server state */
  serverVersion: Classification
  /** Client's attempted changes */
  clientChanges: Partial<Classification>
  /** Original values when client started editing */
  originalValues: Partial<Classification>
  /** Fields that differ between client and server */
  conflictingFields: string[]
}
```

### Supabase Query Pattern

```typescript
// services/optimisticUpdateService.ts
import { supabase } from '@/lib/supabase'
import type {
  OptimisticUpdateRequest,
  OptimisticUpdateResult,
  Classification
} from '@/types/inline-edit'

/**
 * Update classification with optimistic locking
 *
 * Pattern:
 * 1. Attempt UPDATE with WHERE id = ? AND version = ?
 * 2. If no rows affected, fetch current state for conflict resolution
 * 3. Return success with new data, or conflict info for user decision
 *
 * @param request - Update request with expected version
 * @returns Update result with success/conflict status
 */
export async function updateClassificationOptimistic(
  request: OptimisticUpdateRequest
): Promise<OptimisticUpdateResult> {
  const { id, expectedVersion, updates, correctedBy } = request

  try {
    // Step 1: Attempt update with version check
    // The version trigger auto-increments, so we only check the expected version
    const { data, error, count } = await supabase
      .from('classifications')
      .update({
        ...updates,
        corrected_by: correctedBy || 'inline-edit',
        corrected_timestamp: new Date().toISOString()
      })
      .eq('id', id)
      .eq('version', expectedVersion)
      .select('*')
      .single()

    // Handle Supabase errors
    if (error) {
      // PGRST116 = no rows returned (version mismatch or not found)
      if (error.code === 'PGRST116') {
        return await handlePotentialConflict(id, expectedVersion, updates)
      }

      return {
        success: false,
        error: `Database error: ${error.message}`
      }
    }

    // Step 2: Success - return updated data
    return {
      success: true,
      data: data as Classification,
      newVersion: data.version
    }

  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred'
    }
  }
}

/**
 * Handle potential version conflict
 * Fetches current server state and determines conflict type
 */
async function handlePotentialConflict(
  id: number,
  expectedVersion: number,
  clientChanges: Partial<Classification>
): Promise<OptimisticUpdateResult> {
  // Fetch current server state
  const { data: serverData, error } = await supabase
    .from('classifications')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !serverData) {
    return {
      success: false,
      error: 'Classification not found'
    }
  }

  // Classification exists but version changed - conflict
  return {
    success: false,
    conflict: {
      serverVersion: serverData as Classification,
      clientChanges,
      originalValues: {}, // Caller should provide from edit state
      conflictingFields: detectConflictingFields(clientChanges, serverData)
    }
  }
}

/**
 * Detect which fields conflict between client changes and server state
 */
function detectConflictingFields(
  clientChanges: Partial<Classification>,
  serverState: Classification
): string[] {
  const conflicts: string[] = []

  for (const [key, clientValue] of Object.entries(clientChanges)) {
    if (key in serverState) {
      const serverValue = serverState[key as keyof Classification]
      if (JSON.stringify(clientValue) !== JSON.stringify(serverValue)) {
        conflicts.push(key)
      }
    }
  }

  return conflicts
}
```

---

## 2. Conflict Detection and Resolution

### Conflict Detection Flow

```
Client loads row (version: 5)
       |
       v
Client edits locally
       |
       v
Another user saves (version: 6)
       |
       v
Client attempts save with version: 5
       |
       v
UPDATE ... WHERE version = 5 --> 0 rows affected
       |
       v
Fetch current state (version: 6)
       |
       v
Show conflict resolution UI
       |
       v
User chooses: Overwrite / Discard / Merge
```

### TypeScript Implementation

```typescript
// services/conflictResolutionService.ts
import { supabase } from '@/lib/supabase'
import type { Classification, ConflictInfo } from '@/types/inline-edit'

/**
 * Fetch current server state for conflict comparison
 *
 * @param id - Classification ID
 * @returns Current server state or null if not found
 */
export async function fetchCurrentState(id: number): Promise<Classification | null> {
  const { data, error } = await supabase
    .from('classifications')
    .select(`
      *,
      email:emails (
        id,
        subject,
        sender
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Failed to fetch current state:', error)
    return null
  }

  return data as Classification
}

/**
 * Force overwrite server state with client changes
 * Used when user chooses "Keep My Changes" in conflict resolution
 *
 * IMPORTANT: This bypasses version check - use only after user confirmation
 *
 * @param id - Classification ID
 * @param updates - Client changes to force-apply
 * @param correctedBy - User identifier
 * @returns Updated classification
 */
export async function forceOverwrite(
  id: number,
  updates: Partial<Classification>,
  correctedBy: string
): Promise<{ success: boolean; data?: Classification; error?: string }> {
  // Fetch current version first
  const { data: current, error: fetchError } = await supabase
    .from('classifications')
    .select('version')
    .eq('id', id)
    .single()

  if (fetchError || !current) {
    return { success: false, error: 'Failed to fetch current version' }
  }

  // Update without version check (force overwrite)
  const { data, error } = await supabase
    .from('classifications')
    .update({
      ...updates,
      corrected_by: correctedBy,
      corrected_timestamp: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data as Classification }
}

/**
 * Merge non-conflicting changes automatically
 *
 * Strategy:
 * - If only client changed field -> use client value
 * - If only server changed field -> keep server value
 * - If both changed same field -> conflict (must be resolved manually)
 *
 * @param original - State when client started editing
 * @param clientChanges - Client's modifications
 * @param serverCurrent - Current server state
 * @returns Merged changes and remaining conflicts
 */
export function calculateMerge(
  original: Partial<Classification>,
  clientChanges: Partial<Classification>,
  serverCurrent: Classification
): {
  merged: Partial<Classification>
  conflicts: string[]
  autoResolved: string[]
} {
  const merged: Partial<Classification> = {}
  const conflicts: string[] = []
  const autoResolved: string[] = []

  const editableFields = ['category', 'urgency', 'action', 'correction_reason']

  for (const field of editableFields) {
    const originalValue = original[field as keyof Classification]
    const clientValue = clientChanges[field as keyof Classification]
    const serverValue = serverCurrent[field as keyof Classification]

    const clientChanged = clientValue !== undefined &&
      JSON.stringify(clientValue) !== JSON.stringify(originalValue)
    const serverChanged = JSON.stringify(serverValue) !== JSON.stringify(originalValue)

    if (clientChanged && serverChanged) {
      // Both changed - true conflict
      if (JSON.stringify(clientValue) === JSON.stringify(serverValue)) {
        // Same change - no conflict
        merged[field as keyof Classification] = clientValue as any
        autoResolved.push(field)
      } else {
        conflicts.push(field)
      }
    } else if (clientChanged) {
      // Only client changed - use client value
      merged[field as keyof Classification] = clientValue as any
      autoResolved.push(field)
    } else if (serverChanged) {
      // Only server changed - keep server value (no merge needed)
      autoResolved.push(field)
    }
  }

  return { merged, conflicts, autoResolved }
}

/**
 * Apply merged changes after conflict resolution
 *
 * @param id - Classification ID
 * @param mergedChanges - Resolved changes to apply
 * @param currentVersion - Current server version (from conflict fetch)
 * @param correctedBy - User identifier
 */
export async function applyMerge(
  id: number,
  mergedChanges: Partial<Classification>,
  currentVersion: number,
  correctedBy: string
): Promise<{ success: boolean; data?: Classification; error?: string }> {
  // Use current version for optimistic lock (should succeed if no further changes)
  const { data, error } = await supabase
    .from('classifications')
    .update({
      ...mergedChanges,
      corrected_by: correctedBy,
      corrected_timestamp: new Date().toISOString()
    })
    .eq('id', id)
    .eq('version', currentVersion)
    .select('*')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return {
        success: false,
        error: 'Another change occurred. Please refresh and try again.'
      }
    }
    return { success: false, error: error.message }
  }

  return { success: true, data: data as Classification }
}
```

---

## 3. Batch Operations for Offline Queue

### Overview

When the user is offline, edits are queued in localStorage. When connectivity returns, the queue is processed in order with conflict handling.

### TypeScript Interface

```typescript
// types/offline-queue.ts

/**
 * Queued edit operation for offline processing
 */
export interface QueuedEdit {
  /** Unique queue entry ID */
  queueId: string
  /** Classification ID to update */
  classificationId: number
  /** Expected version when edit was created */
  expectedVersion: number
  /** Changes to apply */
  updates: Partial<Classification>
  /** When edit was queued */
  queuedAt: number
  /** Number of processing attempts */
  attempts: number
  /** Last error message (if failed) */
  lastError?: string
  /** Processing status */
  status: 'pending' | 'processing' | 'success' | 'conflict' | 'failed'
}

/**
 * Batch processing result
 */
export interface BatchProcessResult {
  /** Total items processed */
  total: number
  /** Successfully saved */
  succeeded: number
  /** Failed due to conflicts */
  conflicts: QueuedEdit[]
  /** Failed due to errors */
  errors: QueuedEdit[]
}
```

### Batch Processing Implementation

```typescript
// services/offlineQueueService.ts
import { supabase } from '@/lib/supabase'
import type { QueuedEdit, BatchProcessResult, Classification } from '@/types/offline-queue'
import { updateClassificationOptimistic } from './optimisticUpdateService'

/**
 * Process all pending edits from offline queue
 *
 * Strategy:
 * 1. Process in FIFO order (oldest first)
 * 2. Stop on first conflict for same classification (user must resolve)
 * 3. Continue with other classifications on conflict
 * 4. Retry failed items up to 3 times
 *
 * @param queue - Array of queued edits
 * @param correctedBy - User identifier
 * @returns Processing results
 */
export async function processBatchQueue(
  queue: QueuedEdit[],
  correctedBy: string
): Promise<BatchProcessResult> {
  const result: BatchProcessResult = {
    total: queue.length,
    succeeded: 0,
    conflicts: [],
    errors: []
  }

  // Group by classification ID to handle per-item conflicts
  const byClassification = groupByClassificationId(queue)

  for (const [classificationId, edits] of Object.entries(byClassification)) {
    // Process edits for this classification in order
    for (const edit of edits) {
      edit.status = 'processing'
      edit.attempts++

      try {
        const updateResult = await updateClassificationOptimistic({
          id: edit.classificationId,
          expectedVersion: edit.expectedVersion,
          updates: edit.updates,
          correctedBy
        })

        if (updateResult.success) {
          edit.status = 'success'
          result.succeeded++
          // Update expected version for subsequent edits to same classification
          updateSubsequentVersions(edits, edit, updateResult.newVersion!)
        } else if (updateResult.conflict) {
          edit.status = 'conflict'
          edit.lastError = 'Version conflict - server has newer data'
          result.conflicts.push(edit)
          // Stop processing this classification - user must resolve
          break
        } else {
          throw new Error(updateResult.error || 'Unknown error')
        }

      } catch (err) {
        edit.status = 'failed'
        edit.lastError = err instanceof Error ? err.message : 'Unknown error'

        if (edit.attempts >= 3) {
          result.errors.push(edit)
        }
        // Continue with next edit (don't block queue on transient errors)
      }
    }
  }

  return result
}

/**
 * Group queued edits by classification ID
 */
function groupByClassificationId(
  queue: QueuedEdit[]
): Record<string, QueuedEdit[]> {
  return queue.reduce((acc, edit) => {
    const key = String(edit.classificationId)
    if (!acc[key]) acc[key] = []
    acc[key].push(edit)
    return acc
  }, {} as Record<string, QueuedEdit[]>)
}

/**
 * Update expected versions for edits queued after a successful save
 * This handles the case where user made multiple offline edits to same row
 */
function updateSubsequentVersions(
  edits: QueuedEdit[],
  completed: QueuedEdit,
  newVersion: number
): void {
  const completedIndex = edits.indexOf(completed)
  for (let i = completedIndex + 1; i < edits.length; i++) {
    if (edits[i].status === 'pending') {
      edits[i].expectedVersion = newVersion
    }
  }
}

/**
 * Batch fetch current states for conflict resolution
 * More efficient than fetching one at a time
 *
 * @param ids - Classification IDs to fetch
 * @returns Map of ID to current state
 */
export async function batchFetchCurrentStates(
  ids: number[]
): Promise<Map<number, Classification>> {
  const { data, error } = await supabase
    .from('classifications')
    .select(`
      *,
      email:emails (
        id,
        subject,
        sender
      )
    `)
    .in('id', ids)

  if (error) {
    console.error('Batch fetch failed:', error)
    return new Map()
  }

  return new Map(
    (data as Classification[]).map(c => [c.id, c])
  )
}

/**
 * Batch update multiple classifications in a single transaction
 * Used for bulk operations (not typical for inline edit, but available)
 *
 * NOTE: Supabase JS doesn't support true transactions, so this is
 * implemented as sequential updates with rollback on failure
 *
 * @param updates - Array of update requests
 * @param correctedBy - User identifier
 */
export async function batchUpdateClassifications(
  updates: Array<{ id: number; version: number; changes: Partial<Classification> }>,
  correctedBy: string
): Promise<{
  success: boolean
  results: Array<{ id: number; success: boolean; error?: string }>
}> {
  const results: Array<{ id: number; success: boolean; error?: string }> = []

  for (const update of updates) {
    const result = await updateClassificationOptimistic({
      id: update.id,
      expectedVersion: update.version,
      updates: update.changes,
      correctedBy
    })

    results.push({
      id: update.id,
      success: result.success,
      error: result.error || (result.conflict ? 'Version conflict' : undefined)
    })
  }

  return {
    success: results.every(r => r.success),
    results
  }
}
```

---

## 4. Query Pattern Reference

### Supabase JS Query Methods

| Method | Description | Example |
|--------|-------------|---------|
| `select()` | Fetch columns | `.select('id, category, version')` |
| `select('*')` | Fetch all columns | `.select('*')` |
| `select('*, relation()')` | Join related table | `.select('*, email:emails(id, subject)')` |
| `update()` | Update records | `.update({ category: 'WORK' })` |
| `eq()` | Equals filter | `.eq('id', 123)` |
| `in()` | In array filter | `.in('id', [1, 2, 3])` |
| `single()` | Expect exactly one row | `.single()` (throws if 0 or 2+) |
| `maybeSingle()` | Expect 0 or 1 row | `.maybeSingle()` (null if 0) |

### Common Query Patterns

#### Select with Version

```typescript
// Fetch classification with current version for editing
const { data, error } = await supabase
  .from('classifications')
  .select('id, category, urgency, action, version, email:emails(id, subject, sender)')
  .eq('id', classificationId)
  .single()
```

#### Conditional Update (Optimistic Lock)

```typescript
// Update only if version matches
const { data, error, count } = await supabase
  .from('classifications')
  .update({
    category: 'WORK',
    corrected_timestamp: new Date().toISOString(),
    corrected_by: 'user@example.com'
  })
  .eq('id', classificationId)
  .eq('version', expectedVersion)
  .select()
  .single()

// Check if update succeeded
if (error?.code === 'PGRST116') {
  // No rows returned - version mismatch (conflict)
}
```

#### Batch Select

```typescript
// Fetch multiple classifications by ID
const { data, error } = await supabase
  .from('classifications')
  .select('*')
  .in('id', [1, 2, 3, 4, 5])
  .order('id', { ascending: true })
```

#### Count Query

```typescript
// Check if record exists with specific version
const { count, error } = await supabase
  .from('classifications')
  .select('*', { count: 'exact', head: true })
  .eq('id', classificationId)
  .eq('version', expectedVersion)

const exists = (count ?? 0) > 0
```

### Error Code Reference

| Code | Description | Handling |
|------|-------------|----------|
| `PGRST116` | No rows returned | Version conflict or not found |
| `23505` | Unique constraint violation | Duplicate key |
| `23503` | Foreign key violation | Referenced row doesn't exist |
| `22P02` | Invalid text representation | Invalid enum value |
| `42501` | Insufficient privilege | RLS policy violation |

```typescript
// Error handling pattern
function handleSupabaseError(error: any): string {
  switch (error.code) {
    case 'PGRST116':
      return 'Record not found or has been modified'
    case '23505':
      return 'This record already exists'
    case '23503':
      return 'Related record not found'
    case '22P02':
      return 'Invalid value provided'
    case '42501':
      return 'You do not have permission for this action'
    default:
      return error.message || 'An unexpected error occurred'
  }
}
```

---

## 5. TypeScript Service Implementation

### Complete Service Module

```typescript
// services/inlineEditService.ts

import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type Classification = Database['public']['Tables']['classifications']['Row']
type ClassificationUpdate = Database['public']['Tables']['classifications']['Update']

/**
 * Inline Edit Service
 *
 * Handles all Supabase operations for inline table editing with
 * optimistic locking and conflict resolution.
 */
export const InlineEditService = {
  /**
   * Load classification with version for editing
   */
  async loadForEdit(id: number): Promise<{
    classification: Classification & { email: { id: number; subject: string; sender: string } }
    version: number
  } | null> {
    const { data, error } = await supabase
      .from('classifications')
      .select(`
        *,
        email:emails (
          id,
          subject,
          sender
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) return null

    return {
      classification: data as any,
      version: data.version
    }
  },

  /**
   * Save edit with optimistic locking
   */
  async saveEdit(
    id: number,
    expectedVersion: number,
    updates: Partial<ClassificationUpdate>,
    correctedBy: string
  ): Promise<{
    success: boolean
    data?: Classification
    conflict?: { serverVersion: Classification }
    error?: string
  }> {
    const { data, error } = await supabase
      .from('classifications')
      .update({
        ...updates,
        corrected_by: correctedBy,
        corrected_timestamp: new Date().toISOString()
      })
      .eq('id', id)
      .eq('version', expectedVersion)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Fetch current for conflict resolution
        const { data: current } = await supabase
          .from('classifications')
          .select('*')
          .eq('id', id)
          .single()

        if (current) {
          return { success: false, conflict: { serverVersion: current as Classification } }
        }
        return { success: false, error: 'Record not found' }
      }
      return { success: false, error: error.message }
    }

    return { success: true, data: data as Classification }
  },

  /**
   * Force save (bypass version check)
   */
  async forceSave(
    id: number,
    updates: Partial<ClassificationUpdate>,
    correctedBy: string
  ): Promise<{ success: boolean; data?: Classification; error?: string }> {
    const { data, error } = await supabase
      .from('classifications')
      .update({
        ...updates,
        corrected_by: correctedBy,
        corrected_timestamp: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data as Classification }
  },

  /**
   * Refresh current state (for conflict comparison)
   */
  async refreshState(id: number): Promise<Classification | null> {
    const { data, error } = await supabase
      .from('classifications')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as Classification
  },

  /**
   * Batch refresh states
   */
  async batchRefreshStates(ids: number[]): Promise<Map<number, Classification>> {
    const { data, error } = await supabase
      .from('classifications')
      .select('*')
      .in('id', ids)

    if (error || !data) return new Map()

    return new Map(
      (data as Classification[]).map(c => [c.id, c])
    )
  }
}
```

### Vue Composable Integration

```typescript
// composables/useInlineEdit.ts

import { ref, computed } from 'vue'
import { InlineEditService } from '@/services/inlineEditService'
import type { Classification } from '@/types/database.types'

export function useInlineEdit() {
  const editingRowId = ref<number | null>(null)
  const originalData = ref<Classification | null>(null)
  const originalVersion = ref<number>(0)
  const editedData = ref<Partial<Classification>>({})
  const saveStatus = ref<'idle' | 'saving' | 'success' | 'conflict' | 'error'>('idle')
  const conflictData = ref<Classification | null>(null)
  const errorMessage = ref<string | null>(null)

  const isDirty = computed(() => {
    if (!originalData.value) return false
    return JSON.stringify(editedData.value) !== JSON.stringify({
      category: originalData.value.category,
      urgency: originalData.value.urgency,
      action: originalData.value.action
    })
  })

  async function startEditing(id: number) {
    const result = await InlineEditService.loadForEdit(id)
    if (result) {
      editingRowId.value = id
      originalData.value = result.classification
      originalVersion.value = result.version
      editedData.value = {
        category: result.classification.category,
        urgency: result.classification.urgency,
        action: result.classification.action
      }
      saveStatus.value = 'idle'
      conflictData.value = null
      errorMessage.value = null
    }
  }

  async function saveEdit(correctedBy: string) {
    if (!editingRowId.value || !isDirty.value) return

    saveStatus.value = 'saving'

    const result = await InlineEditService.saveEdit(
      editingRowId.value,
      originalVersion.value,
      editedData.value,
      correctedBy
    )

    if (result.success) {
      saveStatus.value = 'success'
      originalData.value = result.data!
      originalVersion.value = result.data!.version
      // Reset edit state after brief success indicator
      setTimeout(() => cancelEditing(), 1500)
    } else if (result.conflict) {
      saveStatus.value = 'conflict'
      conflictData.value = result.conflict.serverVersion
    } else {
      saveStatus.value = 'error'
      errorMessage.value = result.error || 'Save failed'
    }
  }

  async function forceOverwrite(correctedBy: string) {
    if (!editingRowId.value) return

    saveStatus.value = 'saving'

    const result = await InlineEditService.forceSave(
      editingRowId.value,
      editedData.value,
      correctedBy
    )

    if (result.success) {
      saveStatus.value = 'success'
      originalData.value = result.data!
      originalVersion.value = result.data!.version
      conflictData.value = null
      setTimeout(() => cancelEditing(), 1500)
    } else {
      saveStatus.value = 'error'
      errorMessage.value = result.error || 'Force save failed'
    }
  }

  function acceptServerVersion() {
    if (conflictData.value) {
      editedData.value = {
        category: conflictData.value.category,
        urgency: conflictData.value.urgency,
        action: conflictData.value.action
      }
      originalData.value = conflictData.value
      originalVersion.value = conflictData.value.version
      conflictData.value = null
      saveStatus.value = 'idle'
    }
  }

  function cancelEditing() {
    editingRowId.value = null
    originalData.value = null
    originalVersion.value = 0
    editedData.value = {}
    saveStatus.value = 'idle'
    conflictData.value = null
    errorMessage.value = null
  }

  return {
    editingRowId,
    originalData,
    editedData,
    isDirty,
    saveStatus,
    conflictData,
    errorMessage,
    startEditing,
    saveEdit,
    forceOverwrite,
    acceptServerVersion,
    cancelEditing
  }
}
```

---

## 6. Database Migration: Version Column

### Migration SQL

```sql
-- File: supabase/migrations/20251123000000_add_version_column.sql
-- Description: Add version column for optimistic locking in inline editing

-- Add version column with default value
ALTER TABLE classifications
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Create or replace version increment trigger
CREATE OR REPLACE FUNCTION increment_classification_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment version on any update
  NEW.version = COALESCE(OLD.version, 0) + 1;
  -- Also update timestamp
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if present, then create
DROP TRIGGER IF EXISTS classifications_version_trigger ON classifications;

CREATE TRIGGER classifications_version_trigger
BEFORE UPDATE ON classifications
FOR EACH ROW
EXECUTE FUNCTION increment_classification_version();

-- Add index for efficient version lookups
CREATE INDEX IF NOT EXISTS idx_classifications_id_version
ON classifications(id, version);

-- Grant necessary permissions (if using RLS)
-- Ensure the anon and authenticated roles can read version
GRANT SELECT (version) ON classifications TO anon, authenticated;
GRANT UPDATE ON classifications TO authenticated;

-- Comment for documentation
COMMENT ON COLUMN classifications.version IS
  'Optimistic locking version counter. Auto-incremented on each update via trigger.';
```

### Applying the Migration

```bash
# Using Supabase CLI
supabase migration new add_version_column
# Then paste the SQL above into the created file

# Apply to local development
supabase db reset

# Apply to production
supabase db push
```

---

## Summary

This contract defines:

1. **Optimistic Locking**: Version-based update pattern that detects concurrent modifications
2. **Conflict Resolution**: Three strategies (overwrite, discard, merge) with TypeScript implementations
3. **Offline Queue**: Batch processing with FIFO ordering and per-classification conflict handling
4. **Query Patterns**: Reference for common Supabase JS operations and error handling
5. **Service Implementation**: Complete TypeScript service with Vue composable integration
6. **Database Migration**: SQL for adding version column and auto-increment trigger

**Key Integration Points**:
- Uses existing `classifications` table from `001-email-classification-mvp`
- Extends `003-correction-ui` service contracts with optimistic locking
- Compatible with existing correction_logs trigger for audit trail
- TypeScript types generated from Supabase schema
