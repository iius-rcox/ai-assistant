# Quickstart Guide: Inline Table Editing

**Feature**: 004-inline-edit
**Date**: 2025-11-23
**Prerequisites**: 003-correction-ui feature complete with working Vue application

---

## Overview

This guide walks you through implementing inline table editing for the Email Classification Correction UI. Users will be able to edit classifications directly in the table without navigating to a separate detail screen.

**Estimated Implementation Time**: 4-6 hours

---

## Prerequisites

Before starting, ensure you have:

1. **Correction UI Running Locally**
   ```bash
   cd /Users/rogercox/ai-assistant/correction-ui
   npm run dev
   # Should be running at http://localhost:5173
   ```

2. **Supabase Connection Working**
   - Database accessible via existing `.env` configuration
   - `classifications` table with data from 001-email-classification-mvp

3. **Required Versions**
   - Node.js ^20.19.0 or >=22.12.0
   - Vue 3.5+
   - TypeScript 5.9+
   - Pinia 3.0+

4. **Install VueUse** (required for offline resilience)
   ```bash
   cd /Users/rogercox/ai-assistant/correction-ui
   npm install @vueuse/core
   ```

---

## Step 1: Database Migration - Add Version Column

The version column enables optimistic locking to detect concurrent edits.

### 1.1 Apply Migration via Supabase MCP

```sql
-- Migration: add_version_column_to_classifications
-- Purpose: Enable optimistic locking for inline editing

-- Add version column with default
ALTER TABLE classifications
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Create trigger function to auto-increment version on update
CREATE OR REPLACE FUNCTION increment_classification_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists for idempotency)
DROP TRIGGER IF EXISTS classifications_version_trigger ON classifications;

CREATE TRIGGER classifications_version_trigger
BEFORE UPDATE ON classifications
FOR EACH ROW EXECUTE FUNCTION increment_classification_version();

-- Verify migration
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'classifications' AND column_name = 'version';
```

### 1.2 Regenerate TypeScript Types

After migration, regenerate types to include the new `version` field:

```bash
cd /Users/rogercox/ai-assistant/correction-ui

# Regenerate Supabase types
npx supabase gen types typescript --linked > src/types/database.types.ts

# Restart TypeScript server in IDE
# VSCode: Cmd+Shift+P -> "TypeScript: Restart TS Server"
```

---

## Step 2: Development Setup

### 2.1 Verify Local Environment

```bash
# Navigate to project
cd /Users/rogercox/ai-assistant/correction-ui

# Check environment variables are set
grep VITE_SUPABASE .env

# Install any new dependencies (VueUse for offline support)
npm install @vueuse/core

# Start development server
npm run dev
```

### 2.2 Run Existing Tests

```bash
# Ensure existing tests still pass
npm run test:unit

# Type check
npm run type-check
```

---

## Step 3: Key Files to Create/Modify

### New Files to Create

| File Path | Purpose |
|-----------|---------|
| `src/composables/useInlineEdit.ts` | Edit state management composable |
| `src/composables/useDirtyTracking.ts` | Tracks unsaved changes |
| `src/composables/useAutoSave.ts` | localStorage auto-save for offline |
| `src/composables/useUnsavedChangesGuard.ts` | beforeunload + router guard |
| `src/composables/useGridNavigation.ts` | ARIA grid keyboard navigation |
| `src/components/InlineEditCell.vue` | Editable cell component (dropdowns) |
| `src/components/ConflictResolutionDialog.vue` | Handles version conflicts |
| `src/components/MobileEditModal.vue` | Modal for mobile editing |
| `src/constants/storage.ts` | localStorage key constants |
| `src/utils/mergeChanges.ts` | Non-conflicting field merge logic |
| `src/services/classificationService.ts` | Update with version-aware save |

### Existing Files to Modify

| File Path | Changes Required |
|-----------|------------------|
| `src/stores/classificationStore.ts` | Add `editingRows`, `dirtyRows` state |
| `src/types/models.ts` | Add `ClassificationEditState` interface |
| `src/views/ClassificationList.vue` | Add inline edit mode to table rows |
| `src/components/ClassificationTable.vue` | Convert to support inline editing |

---

## Step 4: Implementation Order

Follow this order for incremental, testable implementation:

### Phase 1: Core Edit State (P1 - MVP)

1. **Create `useInlineEdit.ts` composable**
   - Manages which row is being edited
   - Tracks original vs modified values
   - Provides `startEditing`, `cancelEditing`, `saveEdit` functions

2. **Update `classificationStore.ts`**
   ```typescript
   // Add to existing store
   const editingRowId = ref<string | null>(null)
   const editState = ref<Map<string, Partial<Classification>>>(new Map())
   const dirtyRows = ref<Set<string>>(new Set())
   ```

3. **Create `InlineEditCell.vue` component**
   - Renders dropdown for category/urgency/action
   - Emits `update` event on change
   - Touch-friendly with 44px minimum tap target

4. **Modify table row to support edit mode**
   - Click row -> enters edit mode
   - Display dropdowns instead of text
   - Show Save/Cancel buttons

### Phase 2: Visual Feedback (P2)

5. **Add edit state styling**
   - Highlighted background for editing row
   - Dirty indicator for unsaved changes
   - Loading spinner during save

6. **Add success/error feedback**
   - Brief success toast after save
   - Error message display on failure

### Phase 3: Conflict Resolution & Offline (P2-P3)

7. **Update `classificationService.ts` with version check**
   ```typescript
   // Version-aware update
   const { data, error } = await supabase
     .from('classifications')
     .update(updates)
     .eq('id', id)
     .eq('version', expectedVersion)  // Optimistic lock
     .select()
     .single()
   ```

8. **Create `ConflictResolutionDialog.vue`**
   - Shows when version mismatch detected
   - Displays "Your Changes" vs "Server Version"
   - Options: Overwrite, Discard, Merge

9. **Create `useAutoSave.ts` for offline resilience**
   - Auto-saves drafts to localStorage
   - Restores on page reload
   - TTL cleanup for stale drafts

10. **Create `useUnsavedChangesGuard.ts`**
    - beforeunload event handler
    - Vue Router navigation guard

### Phase 4: Keyboard & Mobile (P3)

11. **Create `useGridNavigation.ts`**
    - Arrow key navigation between cells
    - Enter to edit, Escape to cancel
    - Tab navigation within edit mode

12. **Create `MobileEditModal.vue`**
    - Full edit form in modal
    - Triggered on screens < 768px
    - Touch-optimized controls

---

## Step 5: Testing Guide

### Unit Testing

Create test files in `src/components/__tests__/`:

```bash
# Create test files
touch src/composables/__tests__/useInlineEdit.spec.ts
touch src/composables/__tests__/useAutoSave.spec.ts
touch src/components/__tests__/InlineEditCell.spec.ts
touch src/components/__tests__/ConflictResolutionDialog.spec.ts
```

**Test useInlineEdit composable:**
```typescript
// src/composables/__tests__/useInlineEdit.spec.ts
import { describe, it, expect } from 'vitest'
import { useInlineEdit } from '../useInlineEdit'

describe('useInlineEdit', () => {
  it('tracks editing state for a row', () => {
    const { startEditing, isEditing, editingRowId } = useInlineEdit()

    expect(editingRowId.value).toBeNull()

    startEditing('row-123', { category: 'WORK', urgency: 'HIGH', action: 'FYI' })

    expect(editingRowId.value).toBe('row-123')
    expect(isEditing('row-123')).toBe(true)
  })

  it('cancels editing and reverts changes', () => {
    const { startEditing, cancelEditing, editingRowId } = useInlineEdit()

    startEditing('row-123', { category: 'WORK' })
    cancelEditing()

    expect(editingRowId.value).toBeNull()
  })
})
```

**Test InlineEditCell component:**
```typescript
// src/components/__tests__/InlineEditCell.spec.ts
import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/vue'
import InlineEditCell from '../InlineEditCell.vue'

describe('InlineEditCell', () => {
  it('renders dropdown with current value selected', () => {
    const { getByRole } = render(InlineEditCell, {
      props: {
        value: 'WORK',
        type: 'select',
        options: [
          { value: 'KIDS', label: 'Kids' },
          { value: 'WORK', label: 'Work' }
        ]
      }
    })

    const select = getByRole('combobox')
    expect(select).toHaveValue('WORK')
  })

  it('emits update event when value changes', async () => {
    const { getByRole, emitted } = render(InlineEditCell, {
      props: {
        value: 'WORK',
        type: 'select',
        options: [
          { value: 'KIDS', label: 'Kids' },
          { value: 'WORK', label: 'Work' }
        ]
      }
    })

    await fireEvent.change(getByRole('combobox'), { target: { value: 'KIDS' } })

    expect(emitted().update[0]).toEqual(['KIDS'])
  })
})
```

### Testing Offline Mode

1. **Simulate offline:**
   - Chrome DevTools -> Network tab -> Select "Offline"
   - Make an edit in the UI
   - Verify edit is saved to localStorage

2. **Verify recovery:**
   - Go back online
   - Refresh the page
   - Verify edit is restored and can be saved

3. **Test localStorage directly:**
   ```javascript
   // In browser console
   localStorage.setItem('correction-ui:v1:draft:test-123', JSON.stringify({
     data: { category: 'KIDS' },
     savedAt: Date.now(),
     version: 1
   }))
   // Refresh page, should offer to restore
   ```

### Testing Conflict Resolution

1. **Setup two browser tabs** with the same classification list

2. **Tab 1:** Click row to edit, change category to "KIDS"

3. **Tab 2:** Edit same row, change category to "WORK", save

4. **Tab 1:** Click Save

5. **Expected:** Conflict dialog appears showing:
   - Your change: KIDS
   - Server version: WORK
   - Options to overwrite, discard, or merge

### E2E Testing

```typescript
// e2e/inline-edit.spec.ts
import { test, expect } from '@playwright/test'

test('inline edit saves classification', async ({ page }) => {
  await page.goto('/classifications')

  // Click first row to enter edit mode
  await page.click('table tbody tr:first-child')

  // Change category dropdown
  await page.selectOption('[data-testid="category-select"]', 'KIDS')

  // Click save
  await page.click('[data-testid="save-button"]')

  // Verify success feedback
  await expect(page.locator('.success-toast')).toBeVisible()

  // Verify row exits edit mode
  await expect(page.locator('table tbody tr:first-child')).not.toHaveClass(/editing/)
})

test('beforeunload warning for unsaved changes', async ({ page }) => {
  await page.goto('/classifications')

  // Enter edit mode and make a change
  await page.click('table tbody tr:first-child')
  await page.selectOption('[data-testid="category-select"]', 'KIDS')

  // Try to navigate away
  page.on('dialog', async dialog => {
    expect(dialog.type()).toBe('beforeunload')
    await dialog.dismiss()
  })

  await page.goto('/about')
})
```

Run E2E tests:
```bash
npm run test:e2e
```

---

## Step 6: Common Patterns Quick Reference

### Pattern 1: Version-Aware Update

```typescript
// services/classificationService.ts
export async function updateClassificationWithVersion(
  id: string,
  updates: Partial<Classification>,
  expectedVersion: number
): Promise<UpdateResult> {
  const { data, error } = await supabase
    .from('classifications')
    .update(updates)
    .eq('id', id)
    .eq('version', expectedVersion)
    .select()
    .single()

  if (!data && !error) {
    // No rows matched = version conflict
    const { data: serverData } = await supabase
      .from('classifications')
      .select('*')
      .eq('id', id)
      .single()

    return {
      success: false,
      conflict: { serverVersion: serverData, clientVersion: updates }
    }
  }

  if (error) throw error
  return { success: true, data }
}
```

### Pattern 2: Auto-Save to localStorage

```typescript
// composables/useAutoSave.ts
import { useLocalStorage, watchDebounced, useOnline } from '@vueuse/core'

export function useAutoSave<T>(rowId: string, data: Ref<T>) {
  const storageKey = `correction-ui:v1:draft:${rowId}`
  const isOnline = useOnline()

  const draft = useLocalStorage<{ data: T; savedAt: number } | null>(
    storageKey,
    null
  )

  // Auto-save on change (debounced)
  watchDebounced(
    data,
    (newData) => {
      draft.value = { data: newData, savedAt: Date.now() }
    },
    { debounce: 500, deep: true }
  )

  function clearDraft() {
    draft.value = null
  }

  function restoreDraft(): T | null {
    return draft.value?.data ?? null
  }

  return { isOnline, clearDraft, restoreDraft }
}
```

### Pattern 3: Unsaved Changes Guard

```typescript
// composables/useUnsavedChangesGuard.ts
import { onBeforeRouteLeave } from 'vue-router'
import { useEventListener } from '@vueuse/core'

export function useUnsavedChangesGuard(isDirty: Ref<boolean>) {
  // Browser close/refresh
  useEventListener(window, 'beforeunload', (e: BeforeUnloadEvent) => {
    if (isDirty.value) {
      e.preventDefault()
      e.returnValue = ''
    }
  })

  // Vue Router navigation
  onBeforeRouteLeave(() => {
    if (isDirty.value) {
      return window.confirm('You have unsaved changes. Leave anyway?')
    }
    return true
  })
}
```

### Pattern 4: Responsive Edit Mode

```typescript
// In component
import { useMediaQuery } from '@vueuse/core'

const isMobile = useMediaQuery('(max-width: 767px)')

// Template
// <InlineEditCell v-if="!isMobile && isEditing(row.id)" ... />
// <button v-if="isMobile" @click="openMobileModal(row)">Edit</button>
```

### Pattern 5: Keyboard Navigation

```typescript
// Handle Enter to save, Escape to cancel
function handleKeyDown(event: KeyboardEvent, rowId: string) {
  if (event.key === 'Enter') {
    event.preventDefault()
    saveEdit(rowId)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelEditing()
  }
}
```

### Pattern 6: Dirty State Tracking

```typescript
// composables/useDirtyTracking.ts
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
      key => original.value![key] !== current.value![key]
    )
  })

  return { isDirty, dirtyFields }
}
```

---

## Common Issues & Solutions

### Issue 1: Version column not found

**Cause**: Migration not applied

**Solution**:
```sql
-- Check if column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'classifications' AND column_name = 'version';

-- If empty, run migration from Step 1
```

### Issue 2: TypeScript error for `version` field

**Cause**: Types not regenerated after migration

**Solution**:
```bash
npx supabase gen types typescript --linked > src/types/database.types.ts
# Restart TS server in IDE
```

### Issue 3: Conflict dialog not appearing

**Cause**: Version check not in update query

**Solution**: Ensure `.eq('version', expectedVersion)` is in the update chain

### Issue 4: localStorage not persisting

**Cause**: Private browsing mode or storage quota exceeded

**Solution**:
```typescript
// Add error handling
try {
  localStorage.setItem(key, value)
} catch (e) {
  console.warn('localStorage unavailable:', e)
  // Fall back to in-memory only
}
```

### Issue 5: beforeunload not firing

**Cause**: User hasn't interacted with page yet (browser security)

**Solution**: This is expected behavior. The guard only works after user interaction.

---

## Performance Checklist

- [ ] Edit state changes don't trigger full table re-render
- [ ] localStorage writes are debounced (500ms)
- [ ] Conflict detection fetches single row, not full list
- [ ] Mobile modal lazy-loads (v-if not v-show)
- [ ] Keyboard handlers use event delegation on table

---

## Security Checklist

- [ ] Version field cannot be set by client (trigger handles it)
- [ ] No sensitive data in localStorage keys
- [ ] localStorage cleanup removes stale drafts (7-day TTL)
- [ ] Conflict resolution doesn't expose other users' data

---

## Next Steps After Implementation

1. Run full test suite: `npm run test:unit && npm run test:e2e`
2. Manual testing with two browser tabs for conflict scenarios
3. Test on mobile device or Chrome DevTools mobile emulation
4. Verify localStorage cleanup by setting clock forward 8 days
5. Document any deviations from spec in `plan.md` Complexity Tracking section

---

## Quick Reference Commands

```bash
# Start development
cd /Users/rogercox/ai-assistant/correction-ui && npm run dev

# Run unit tests (watch mode)
npm run test:unit

# Run E2E tests
npm run test:e2e

# Type check
npm run type-check

# Regenerate Supabase types
npx supabase gen types typescript --linked > src/types/database.types.ts

# Build for production
npm run build
```

**Supabase Dashboard**: https://supabase.com/dashboard/project/xmziovusqlmgygcrgyqt
**Database Editor**: https://supabase.com/dashboard/project/xmziovusqlmgygcrgyqt/editor

---

**Implementation ready!** Follow the phases in order for incremental delivery.
