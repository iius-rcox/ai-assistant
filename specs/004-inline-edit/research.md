# Technical Research: Inline Table Editing Patterns

**Date**: 2025-11-23
**Feature Branch**: `003-correction-ui`
**Parent Research**: [research.md](research.md)

---

## Purpose

This research document provides best practices and implementation patterns for inline table editing in Vue 3 applications with TypeScript and Supabase. It covers state management, optimistic locking, offline resilience, user experience, and accessibility.

---

## Table of Contents

1. [State Management Patterns](#1-state-management-patterns)
2. [Optimistic Locking](#2-optimistic-locking)
3. [Offline/Network Resilience](#3-offlinenetwork-resilience)
4. [beforeunload Warning](#4-beforeunload-warning)
5. [Responsive Table Editing](#5-responsive-table-editing)
6. [Keyboard Navigation](#6-keyboard-navigation)

---

## 1. State Management Patterns

### Decision: Pinia Store with Composable Edit State

Use a dedicated Pinia store for classification data combined with a composable for row-level edit state management.

### Rationale

- **Pinia is the official Vue 3 state management library**, offering zero boilerplate with direct state mutation in actions
- **Composables encapsulate stateful logic** that can be reused across components
- **Separation of concerns**: Global data in Pinia, transient edit state in composables
- **Excellent TypeScript support** with full type inference

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Local component state only | Difficult to share edit state across list/detail views, no persistence |
| Vuex | Legacy, requires mutations separate from actions, verbose boilerplate |
| Provide/Inject | Less discoverable, harder to debug, no devtools integration |

### Implementation Notes

**Pinia Store Structure:**

```typescript
// stores/corrections.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Classification } from '@/types/database'

export const useCorrectionsStore = defineStore('corrections', () => {
  // Data state
  const classifications = ref<Classification[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Edit state - map of row ID to edit data
  const editingRows = ref<Map<string, Partial<Classification>>>(new Map())
  const dirtyRows = ref<Set<string>>(new Set())

  // Computed
  const hasDirtyChanges = computed(() => dirtyRows.value.size > 0)

  // Actions
  function startEditing(id: string) {
    const row = classifications.value.find(c => c.id === id)
    if (row) {
      editingRows.value.set(id, { ...row })
    }
  }

  function updateEditField(id: string, field: keyof Classification, value: unknown) {
    const edit = editingRows.value.get(id)
    if (edit) {
      edit[field] = value
      dirtyRows.value.add(id)
    }
  }

  function cancelEditing(id: string) {
    editingRows.value.delete(id)
    dirtyRows.value.delete(id)
  }

  function isRowDirty(id: string): boolean {
    return dirtyRows.value.has(id)
  }

  return {
    classifications,
    loading,
    error,
    editingRows,
    dirtyRows,
    hasDirtyChanges,
    startEditing,
    updateEditField,
    cancelEditing,
    isRowDirty
  }
})
```

**Dirty Tracking Composable:**

```typescript
// composables/useDirtyTracking.ts
import { ref, watch, computed } from 'vue'
import type { Ref } from 'vue'

export function useDirtyTracking<T extends Record<string, unknown>>(
  original: Ref<T | null>,
  current: Ref<T | null>
) {
  const isDirty = computed(() => {
    if (!original.value || !current.value) return false
    return JSON.stringify(original.value) !== JSON.stringify(current.value)
  })

  const dirtyFields = computed(() => {
    if (!original.value || !current.value) return []
    return Object.keys(current.value).filter(
      key => JSON.stringify(original.value![key]) !== JSON.stringify(current.value![key])
    )
  })

  function reset() {
    if (original.value && current.value) {
      Object.assign(current.value, original.value)
    }
  }

  return { isDirty, dirtyFields, reset }
}
```

**Validation State Pattern (with Vuelidate):**

```typescript
// composables/useRowValidation.ts
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'

export function useRowValidation(editData: Ref<Partial<Classification>>) {
  const rules = {
    category: { required },
    urgency: { required },
    action_type: { required }
  }

  const v$ = useVuelidate(rules, editData)

  return {
    v$,
    isValid: computed(() => !v$.value.$invalid),
    validate: () => v$.value.$validate()
  }
}
```

### References

- [Pinia Introduction](https://pinia.vuejs.org/introduction.html)
- [Vue 3 Composables Guide](https://vuejs.org/guide/reusability/composables.html)
- [Dirty Form Composable Pattern - Medium](https://medium.com/@aryanmajid97/dirty-form-composable-with-vue3-and-typescript-a52358998294)
- [State Management in Vue 3 - Java Code Geeks](https://www.javacodegeeks.com/2024/10/mastering-state-management-in-vue-3-with-composition-api-and-pinia.html)

---

## 2. Optimistic Locking

### Decision: Version Column with Client-Side Conflict Detection

Implement optimistic concurrency control using a `version` integer column that increments on each update, with client-side conflict detection and user-friendly resolution UI.

### Rationale

- **Optimistic locking is ideal for low-conflict, high-read scenarios** like correction workflows
- **Version columns are simpler than timestamp-based approaches** (no clock drift issues)
- **HTTP/REST pattern alignment**: Matches ETag/If-Match semantics
- **Supabase PostgreSQL natively supports** conditional updates with WHERE clauses

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Pessimistic locking (SELECT FOR UPDATE) | Blocks other users, doesn't work well with stateless HTTP |
| Timestamp-based (updated_at) | Clock drift issues, millisecond precision problems |
| No locking | Data loss from concurrent edits (unacceptable) |
| ETag headers only | Requires custom API layer, Supabase client doesn't expose ETags |

### Implementation Notes

**Database Schema Addition:**

```sql
-- Migration: add_version_column
ALTER TABLE email_classifications
ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- Create trigger to auto-increment on update
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_classifications_version_trigger
BEFORE UPDATE ON email_classifications
FOR EACH ROW EXECUTE FUNCTION increment_version();
```

**Client-Side Update with Conflict Detection:**

```typescript
// services/classificationService.ts
import { supabase } from '@/lib/supabase'
import type { Classification } from '@/types/database'

export interface UpdateResult {
  success: boolean
  data?: Classification
  conflict?: {
    serverVersion: Classification
    clientVersion: Partial<Classification>
  }
}

export async function updateClassification(
  id: string,
  updates: Partial<Classification>,
  expectedVersion: number
): Promise<UpdateResult> {
  // Attempt update with version check
  const { data, error, count } = await supabase
    .from('email_classifications')
    .update(updates)
    .eq('id', id)
    .eq('version', expectedVersion)
    .select()
    .single()

  if (error) {
    throw new Error(`Update failed: ${error.message}`)
  }

  // If no rows affected, version conflict occurred
  if (!data) {
    // Fetch current server state
    const { data: serverData } = await supabase
      .from('email_classifications')
      .select('*')
      .eq('id', id)
      .single()

    return {
      success: false,
      conflict: {
        serverVersion: serverData!,
        clientVersion: updates
      }
    }
  }

  return { success: true, data }
}
```

**Conflict Resolution UI Component:**

```vue
<!-- components/ConflictResolutionDialog.vue -->
<template>
  <dialog :open="conflict !== null" class="conflict-dialog">
    <h3>Version Conflict Detected</h3>
    <p>Another user has modified this record. Please choose how to proceed:</p>

    <div class="comparison">
      <div class="column">
        <h4>Your Changes</h4>
        <dl v-for="field in changedFields" :key="field">
          <dt>{{ formatFieldName(field) }}</dt>
          <dd class="yours">{{ conflict.clientVersion[field] }}</dd>
        </dl>
      </div>
      <div class="column">
        <h4>Server Version</h4>
        <dl v-for="field in changedFields" :key="field">
          <dt>{{ formatFieldName(field) }}</dt>
          <dd class="server">{{ conflict.serverVersion[field] }}</dd>
        </dl>
      </div>
    </div>

    <div class="actions">
      <button @click="$emit('keep-mine')">
        Overwrite with My Changes
      </button>
      <button @click="$emit('use-server')">
        Discard My Changes
      </button>
      <button @click="$emit('merge')" v-if="canMerge">
        Merge Changes
      </button>
    </div>
  </dialog>
</template>
```

**Merge Strategy for Non-Conflicting Fields:**

```typescript
// utils/mergeChanges.ts
export function mergeNonConflicting(
  original: Classification,
  clientChanges: Partial<Classification>,
  serverVersion: Classification
): { merged: Partial<Classification>; conflicts: string[] } {
  const merged: Partial<Classification> = {}
  const conflicts: string[] = []

  for (const [key, clientValue] of Object.entries(clientChanges)) {
    const originalValue = original[key as keyof Classification]
    const serverValue = serverVersion[key as keyof Classification]

    // If server hasn't changed this field, use client value
    if (JSON.stringify(originalValue) === JSON.stringify(serverValue)) {
      merged[key as keyof Classification] = clientValue
    }
    // If client and server made same change, use it
    else if (JSON.stringify(clientValue) === JSON.stringify(serverValue)) {
      merged[key as keyof Classification] = clientValue
    }
    // True conflict - both changed to different values
    else {
      conflicts.push(key)
    }
  }

  return { merged, conflicts }
}
```

### References

- [Optimistic Locking in REST API - Kevin Sookocheff](https://sookocheff.com/post/api/optimistic-locking-in-a-rest-api/)
- [Optimistic Locking with Version Column - Medium](https://medium.com/@sumit-s/optimistic-locking-concurrency-control-with-a-version-column-2e3db2a8120d)
- [How to Handle Concurrent Writes in Supabase - Bootstrapped](https://bootstrapped.app/guide/how-to-handle-concurrent-writes-in-supabase)
- [Martin Fowler - Optimistic Offline Lock](https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html)

---

## 3. Offline/Network Resilience

### Decision: VueUse useLocalStorage with Namespaced Keys and TTL Cleanup

Use VueUse's `useLocalStorage` composable for auto-saving draft edits during network interruptions, with structured key naming and automatic cleanup policies.

### Rationale

- **VueUse provides reactive localStorage** that syncs automatically with Vue refs
- **5MB localStorage limit** is sufficient for draft correction data
- **Synchronous API** avoids complexity of IndexedDB for small data
- **Namespaced keys** prevent collisions and enable bulk cleanup

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| IndexedDB | Overkill for small draft data, async API adds complexity |
| SessionStorage | Lost on tab close, defeats offline resilience purpose |
| Service Worker Cache | Complex setup, meant for assets not application state |
| Custom localStorage wrapper | Reinvents VueUse functionality |

### Implementation Notes

**Key Naming Convention:**

```typescript
// constants/storage.ts
export const STORAGE_PREFIX = 'correction-ui'
export const STORAGE_VERSION = 'v1'

export const storageKeys = {
  // Pattern: {prefix}:{version}:{type}:{identifier}
  draftEdit: (rowId: string) =>
    `${STORAGE_PREFIX}:${STORAGE_VERSION}:draft:${rowId}`,
  pendingSubmissions: () =>
    `${STORAGE_PREFIX}:${STORAGE_VERSION}:pending`,
  userPreferences: () =>
    `${STORAGE_PREFIX}:${STORAGE_VERSION}:prefs`,
}
```

**Auto-Save Composable with TTL:**

```typescript
// composables/useAutoSave.ts
import { useLocalStorage, useOnline, watchDebounced } from '@vueuse/core'
import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import { storageKeys } from '@/constants/storage'

interface DraftData<T> {
  data: T
  savedAt: number
  version: number
}

const DRAFT_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export function useAutoSave<T>(
  rowId: string,
  currentData: Ref<T | null>,
  originalVersion: number
) {
  const isOnline = useOnline()
  const storageKey = storageKeys.draftEdit(rowId)

  const draft = useLocalStorage<DraftData<T> | null>(storageKey, null, {
    serializer: {
      read: (v) => v ? JSON.parse(v) : null,
      write: (v) => JSON.stringify(v)
    }
  })

  // Auto-save when offline or debounced while editing
  watchDebounced(
    currentData,
    (newData) => {
      if (newData && (!isOnline.value || true)) { // Always save drafts
        draft.value = {
          data: newData,
          savedAt: Date.now(),
          version: originalVersion
        }
      }
    },
    { debounce: 500, deep: true }
  )

  // Check if draft exists and is valid
  const hasDraft = computed(() => {
    if (!draft.value) return false
    const age = Date.now() - draft.value.savedAt
    return age < DRAFT_TTL_MS
  })

  // Restore draft
  function restoreDraft(): T | null {
    if (hasDraft.value && draft.value) {
      return draft.value.data
    }
    return null
  }

  // Clear draft after successful save
  function clearDraft() {
    draft.value = null
  }

  return {
    isOnline,
    hasDraft,
    restoreDraft,
    clearDraft,
    draftAge: computed(() =>
      draft.value ? Date.now() - draft.value.savedAt : null
    )
  }
}
```

**Pending Submissions Queue for Offline Edits:**

```typescript
// composables/usePendingQueue.ts
import { useLocalStorage, useOnline } from '@vueuse/core'
import { watch } from 'vue'
import { storageKeys } from '@/constants/storage'

interface PendingSubmission {
  id: string
  updates: Record<string, unknown>
  expectedVersion: number
  queuedAt: number
  attempts: number
}

export function usePendingQueue() {
  const isOnline = useOnline()
  const pending = useLocalStorage<PendingSubmission[]>(
    storageKeys.pendingSubmissions(),
    []
  )

  function queueSubmission(submission: Omit<PendingSubmission, 'queuedAt' | 'attempts'>) {
    pending.value.push({
      ...submission,
      queuedAt: Date.now(),
      attempts: 0
    })
  }

  // Process queue when coming online
  watch(isOnline, async (online) => {
    if (online && pending.value.length > 0) {
      await processQueue()
    }
  })

  async function processQueue() {
    const toProcess = [...pending.value]
    for (const submission of toProcess) {
      try {
        // Attempt to submit
        await submitCorrection(submission)
        // Remove from queue on success
        pending.value = pending.value.filter(p => p.id !== submission.id)
      } catch (error) {
        // Increment attempts, remove after 3 failures
        const index = pending.value.findIndex(p => p.id === submission.id)
        if (index >= 0) {
          pending.value[index].attempts++
          if (pending.value[index].attempts >= 3) {
            pending.value.splice(index, 1)
            // Notify user of permanent failure
          }
        }
      }
    }
  }

  return { pending, queueSubmission, processQueue }
}
```

**Cleanup Policy:**

```typescript
// utils/storageCleanup.ts
import { STORAGE_PREFIX, STORAGE_VERSION } from '@/constants/storage'

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function cleanupStaleStorage() {
  const keysToRemove: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(STORAGE_PREFIX)) continue

    // Remove old versions
    if (!key.includes(STORAGE_VERSION)) {
      keysToRemove.push(key)
      continue
    }

    // Check TTL for drafts
    if (key.includes(':draft:')) {
      try {
        const value = JSON.parse(localStorage.getItem(key) || '{}')
        if (value.savedAt && Date.now() - value.savedAt > MAX_AGE_MS) {
          keysToRemove.push(key)
        }
      } catch {
        keysToRemove.push(key) // Remove corrupted data
      }
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key))
  return keysToRemove.length
}

// Run on app startup
cleanupStaleStorage()
```

### References

- [VueUse useLocalStorage](https://vueuse.org/core/uselocalstorage/)
- [VueUse useStorage](https://vueuse.org/core/usestorage/)
- [localStorage Complete Guide - LogRocket](https://blog.logrocket.com/localstorage-javascript-complete-guide/)
- [Client-Side Storage - MDN](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Client-side_storage)

---

## 4. beforeunload Warning

### Decision: Dual Guard Pattern (beforeunload + Vue Router Guard)

Implement both browser `beforeunload` event and Vue Router navigation guard to cover all exit scenarios in SPAs.

### Rationale

- **beforeunload handles browser close/refresh** - the only way to intercept tab closure
- **Vue Router guard handles SPA navigation** - beforeunload doesn't fire for client-side routing
- **VueUse's useEventListener** handles automatic cleanup on component unmount
- **Must handle both** to prevent accidental data loss

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| beforeunload only | Doesn't catch Vue Router navigation |
| Router guard only | Doesn't catch browser close/refresh |
| Global navigation guard | Too broad, should be scoped to editing components |

### Implementation Notes

**Composable for Unsaved Changes Warning:**

```typescript
// composables/useUnsavedChangesGuard.ts
import { onBeforeRouteLeave } from 'vue-router'
import { useEventListener } from '@vueuse/core'
import { watch, type Ref } from 'vue'

export function useUnsavedChangesGuard(
  isDirty: Ref<boolean>,
  customMessage = 'You have unsaved changes. Are you sure you want to leave?'
) {
  // Handle browser close/refresh
  useEventListener(window, 'beforeunload', (event: BeforeUnloadEvent) => {
    if (isDirty.value) {
      // Modern browsers ignore custom messages, but setting returnValue is required
      event.preventDefault()
      event.returnValue = ''
      return ''
    }
  })

  // Handle Vue Router navigation
  onBeforeRouteLeave((to, from) => {
    if (isDirty.value) {
      const answer = window.confirm(customMessage)
      if (!answer) {
        return false // Cancel navigation
      }
    }
    return true
  })
}
```

**Usage in Component:**

```vue
<!-- views/ClassificationDetail.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useCorrectionsStore } from '@/stores/corrections'
import { useUnsavedChangesGuard } from '@/composables/useUnsavedChangesGuard'

const store = useCorrectionsStore()

// Guard triggers when any row has unsaved changes
useUnsavedChangesGuard(
  computed(() => store.hasDirtyChanges),
  'You have unsaved corrections. Leave anyway?'
)
</script>
```

**Handling Form Submission:**

```typescript
// Temporarily disable guard during save
const isSaving = ref(false)

async function handleSave() {
  isSaving.value = true
  try {
    await saveChanges()
    store.clearDirty()
  } finally {
    isSaving.value = false
  }
}

// Modified guard that respects saving state
useEventListener(window, 'beforeunload', (event: BeforeUnloadEvent) => {
  if (isDirty.value && !isSaving.value) {
    event.preventDefault()
    event.returnValue = ''
  }
})
```

**Important Browser Limitations:**

```typescript
// Note: Browsers have restrictions on beforeunload:
// 1. Custom messages are ignored - browser shows generic message
// 2. Only fires if user has interacted with page
// 3. Cannot perform async operations
// 4. Cannot show custom UI - only browser's native dialog

// Good: Set returnValue
event.returnValue = ''

// Bad: Try to make HTTP request (will be cancelled)
// await fetch('/api/save') // Don't do this
```

### References

- [Prevent Browser Refresh in Vue - Austin Gil](https://austingil.com/prevent-browser-refresh-url-changes-route-navigation-vue/)
- [Vue Quick Shot - Warn Before Leaving Form - Raymond Camden](https://www.raymondcamden.com/2020/10/15/vue-quick-shot-warn-before-leaving-a-form)
- [How to Warn User of Unsaved Changes - Stack Overflow](https://stackoverflow.com/questions/45293861/how-do-i-warn-a-user-of-unsaved-changes-before-leaving-a-page-in-vue)

---

## 5. Responsive Table Editing

### Decision: Stacked Cards Below 768px, Modal for Complex Edits

Transform table rows into stacked cards on mobile, with inline editing for simple fields and modal dialogs for complex multi-field edits.

### Rationale

- **Tables don't translate well to mobile** - too wide and dense for small screens
- **768px is the standard tablet breakpoint** - phones below, tablets and up above
- **Inline editing works for 1-2 field changes** - keeps user in context
- **Modals work for complex edits** - provides focus and prevents accidental dismissal

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Horizontal scroll | Poor UX, requires two-dimensional navigation |
| Hide columns | Loses important information |
| Always use modals | Slower for quick single-field corrections |
| Flip/transpose table | Confusing for users |

### Implementation Notes

**CSS Breakpoint Strategy:**

```scss
// styles/variables.scss
$breakpoints: (
  'mobile': 320px,
  'tablet': 768px,
  'desktop': 1024px,
  'wide': 1200px
);

// Mixins
@mixin mobile-only {
  @media (max-width: #{map-get($breakpoints, 'tablet') - 1px}) {
    @content;
  }
}

@mixin tablet-up {
  @media (min-width: #{map-get($breakpoints, 'tablet')}) {
    @content;
  }
}
```

**Responsive Table Component:**

```vue
<!-- components/ResponsiveTable.vue -->
<template>
  <!-- Desktop: Traditional table -->
  <table v-if="!isMobile" class="data-table">
    <thead>
      <tr>
        <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.id" :class="{ editing: isEditing(row.id) }">
        <td v-for="col in columns" :key="col.key">
          <InlineEditCell
            v-if="isEditing(row.id) && col.editable"
            :value="getEditValue(row.id, col.key)"
            :type="col.inputType"
            :options="col.options"
            @update="updateField(row.id, col.key, $event)"
          />
          <span v-else>{{ formatValue(row[col.key], col.format) }}</span>
        </td>
        <td>
          <RowActions :row="row" :editing="isEditing(row.id)" />
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Mobile: Stacked cards -->
  <div v-else class="card-list">
    <article v-for="row in rows" :key="row.id" class="card">
      <header class="card-header">
        <span class="card-title">{{ row[primaryColumn] }}</span>
        <button @click="openMobileEdit(row)" aria-label="Edit">
          <EditIcon />
        </button>
      </header>
      <dl class="card-fields">
        <template v-for="col in visibleMobileColumns" :key="col.key">
          <dt>{{ col.label }}</dt>
          <dd>{{ formatValue(row[col.key], col.format) }}</dd>
        </template>
      </dl>
    </article>
  </div>

  <!-- Mobile Edit Modal -->
  <MobileEditModal
    v-if="mobileEditRow"
    :row="mobileEditRow"
    :columns="editableColumns"
    @save="saveMobileEdit"
    @cancel="closeMobileEdit"
  />
</template>

<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'

const isMobile = useMediaQuery('(max-width: 767px)')

const visibleMobileColumns = computed(() =>
  props.columns.filter(c => c.showOnMobile !== false).slice(0, 4)
)
</script>

<style scoped>
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
}

.card-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.card-fields dt {
  font-weight: 600;
  color: var(--text-muted);
}
</style>
```

**Touch-Friendly Inline Edit:**

```vue
<!-- components/InlineEditCell.vue -->
<template>
  <div class="inline-edit" :class="{ 'touch-target': isTouchDevice }">
    <select
      v-if="type === 'select'"
      :value="value"
      @change="$emit('update', ($event.target as HTMLSelectElement).value)"
      class="inline-select"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <input
      v-else
      :type="type"
      :value="value"
      @input="$emit('update', ($event.target as HTMLInputElement).value)"
      class="inline-input"
    />
  </div>
</template>

<style scoped>
.inline-edit {
  width: 100%;
}

.touch-target .inline-select,
.touch-target .inline-input {
  min-height: 44px; /* iOS touch target minimum */
  font-size: 16px; /* Prevents iOS zoom on focus */
  padding: 0.5rem;
}

.inline-select,
.inline-input {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--input-bg);
}
</style>
```

### When to Use Modal vs Inline

| Scenario | Approach |
|----------|----------|
| Change category dropdown | Inline |
| Change urgency level | Inline |
| Edit confidence score | Inline |
| Add detailed correction notes | Modal |
| Multi-field correction with validation | Modal |
| Mobile any edit | Modal (better focus) |

### References

- [Responsive Design Breakpoints 2024 - Hoverify](https://tryhoverify.com/blog/responsive-design-breakpoints-2024-guide/)
- [Table Design UX Guide - Eleken](https://www.eleken.co/blog-posts/table-design-ux)
- [Responsive Data Tables for Better UX - Tenscope](https://www.tenscope.com/post/responsive-table-design-ux-faster)
- [Enterprise Table UX Design - Denovers](https://www.denovers.com/blog/enterprise-table-ux-design)

---

## 6. Keyboard Navigation

### Decision: ARIA Grid Pattern with Mode-Based Focus Management

Implement W3C ARIA grid pattern with two interaction modes: navigation mode (arrow keys move between cells) and edit mode (standard input behavior).

### Rationale

- **ARIA grid is the W3C standard** for accessible interactive tables
- **Two-mode approach** resolves conflict between navigation and editing
- **Tab for component-to-component**, Arrow keys for within-component navigation
- **Enter/Escape as universal toggles** matches user expectations from spreadsheets

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Tab through all cells | Too many tab stops, tedious for keyboard users |
| No grid role, just table | Loses keyboard navigation benefits |
| Roving tabindex only | Doesn't handle edit mode transitions |

### Implementation Notes

**Keyboard Pattern Summary:**

| Key | Navigation Mode | Edit Mode |
|-----|----------------|-----------|
| Arrow Up/Down | Move to row above/below | N/A (native input) |
| Arrow Left/Right | Move to cell left/right | N/A (native input) |
| Enter | Enter edit mode on cell | Confirm edit, move to next row |
| Escape | Exit table focus | Cancel edit, return to navigation |
| Tab | Exit table, move to next component | Move to next input in row |
| Space | Toggle selection (if applicable) | N/A (native input) |

**Grid Navigation Composable:**

```typescript
// composables/useGridNavigation.ts
import { ref, onMounted, onUnmounted } from 'vue'

interface GridPosition {
  row: number
  col: number
}

export function useGridNavigation(
  gridRef: Ref<HTMLElement | null>,
  rowCount: Ref<number>,
  colCount: Ref<number>
) {
  const position = ref<GridPosition>({ row: 0, col: 0 })
  const isEditMode = ref(false)

  function handleKeyDown(event: KeyboardEvent) {
    if (isEditMode.value) {
      handleEditModeKey(event)
    } else {
      handleNavigationKey(event)
    }
  }

  function handleNavigationKey(event: KeyboardEvent) {
    const { row, col } = position.value

    switch (event.key) {
      case 'ArrowUp':
        if (row > 0) {
          event.preventDefault()
          position.value = { row: row - 1, col }
          focusCell(row - 1, col)
        }
        break
      case 'ArrowDown':
        if (row < rowCount.value - 1) {
          event.preventDefault()
          position.value = { row: row + 1, col }
          focusCell(row + 1, col)
        }
        break
      case 'ArrowLeft':
        if (col > 0) {
          event.preventDefault()
          position.value = { row, col: col - 1 }
          focusCell(row, col - 1)
        }
        break
      case 'ArrowRight':
        if (col < colCount.value - 1) {
          event.preventDefault()
          position.value = { row, col: col + 1 }
          focusCell(row, col + 1)
        }
        break
      case 'Enter':
        event.preventDefault()
        enterEditMode()
        break
      case 'Escape':
        event.preventDefault()
        gridRef.value?.blur()
        break
    }
  }

  function handleEditModeKey(event: KeyboardEvent) {
    switch (event.key) {
      case 'Enter':
        event.preventDefault()
        confirmEdit()
        // Move to next row, same column
        if (position.value.row < rowCount.value - 1) {
          position.value = {
            row: position.value.row + 1,
            col: position.value.col
          }
        }
        exitEditMode()
        break
      case 'Escape':
        event.preventDefault()
        cancelEdit()
        exitEditMode()
        break
      case 'Tab':
        // Let Tab work naturally within edit mode
        // or implement custom tab-to-next-editable-cell
        break
    }
  }

  function focusCell(row: number, col: number) {
    const cell = gridRef.value?.querySelector(
      `[data-row="${row}"][data-col="${col}"]`
    ) as HTMLElement
    cell?.focus()
  }

  function enterEditMode() {
    isEditMode.value = true
    // Focus the input within current cell
    const cell = gridRef.value?.querySelector(
      `[data-row="${position.value.row}"][data-col="${position.value.col}"]`
    )
    const input = cell?.querySelector('input, select, textarea') as HTMLElement
    input?.focus()
  }

  function exitEditMode() {
    isEditMode.value = false
    focusCell(position.value.row, position.value.col)
  }

  onMounted(() => {
    gridRef.value?.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    gridRef.value?.removeEventListener('keydown', handleKeyDown)
  })

  return {
    position,
    isEditMode,
    focusCell,
    enterEditMode,
    exitEditMode
  }
}
```

**ARIA Grid Markup:**

```vue
<!-- components/AccessibleGrid.vue -->
<template>
  <div
    ref="gridRef"
    role="grid"
    :aria-rowcount="rows.length + 1"
    :aria-colcount="columns.length"
    tabindex="0"
    @focus="onGridFocus"
  >
    <!-- Header row -->
    <div role="row" aria-rowindex="1">
      <div
        v-for="(col, colIndex) in columns"
        :key="col.key"
        role="columnheader"
        :aria-colindex="colIndex + 1"
        :aria-sort="getSortDirection(col.key)"
      >
        {{ col.label }}
      </div>
    </div>

    <!-- Data rows -->
    <div
      v-for="(row, rowIndex) in rows"
      :key="row.id"
      role="row"
      :aria-rowindex="rowIndex + 2"
    >
      <div
        v-for="(col, colIndex) in columns"
        :key="col.key"
        role="gridcell"
        :aria-colindex="colIndex + 1"
        :data-row="rowIndex"
        :data-col="colIndex"
        :tabindex="isFocused(rowIndex, colIndex) ? 0 : -1"
        :aria-selected="isSelected(row.id)"
        @click="selectCell(rowIndex, colIndex)"
        @dblclick="enterEditMode"
      >
        <template v-if="isEditing(rowIndex, colIndex)">
          <input
            :value="getEditValue(row.id, col.key)"
            @input="updateValue($event, row.id, col.key)"
            :aria-label="`Edit ${col.label} for ${row[primaryKey]}`"
          />
        </template>
        <template v-else>
          {{ formatValue(row[col.key], col.format) }}
        </template>
      </div>
    </div>
  </div>
</template>
```

**Focus Visible Styles:**

```css
/* Ensure keyboard focus is visible */
[role="gridcell"]:focus {
  outline: 2px solid var(--focus-color);
  outline-offset: -2px;
}

[role="gridcell"]:focus:not(:focus-visible) {
  outline: none; /* Hide outline for mouse clicks */
}

[role="gridcell"]:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: -2px;
}

/* Edit mode indicator */
[role="gridcell"].editing {
  background-color: var(--edit-bg);
  box-shadow: inset 0 0 0 2px var(--primary-color);
}
```

### References

- [W3C ARIA Grid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)
- [Developing a Keyboard Interface - W3C APG](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
- [WebAIM Keyboard Accessibility](https://webaim.org/techniques/keyboard/)
- [ARIA Grid Role - MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/grid_role)
- [Material React Table Accessibility Guide](https://www.material-react-table.com/docs/guides/accessibility)

---

## Summary of Decisions

| Topic | Decision | Key Pattern |
|-------|----------|-------------|
| State Management | Pinia + Composables | Store for global data, composables for edit state |
| Optimistic Locking | Version column | Conditional UPDATE with version check |
| Offline Resilience | VueUse useLocalStorage | Namespaced keys with TTL cleanup |
| beforeunload | Dual guard pattern | Both beforeunload + router guard |
| Responsive Tables | Cards < 768px | Stacked cards on mobile, modal for complex edits |
| Keyboard Navigation | ARIA grid pattern | Two-mode: navigation vs edit |

---

## Next Steps

1. Add `version` column to `email_classifications` table via migration
2. Create Pinia store structure following patterns above
3. Implement auto-save composable with VueUse
4. Build responsive table component with mobile card view
5. Add keyboard navigation following ARIA grid pattern
6. Implement conflict resolution dialog component
