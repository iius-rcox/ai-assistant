# Quickstart: Column Search Filters

**Feature**: 008-column-search-filters
**Date**: 2025-11-25

## Overview

This guide provides step-by-step instructions for implementing column search filters in the email classifications table.

## Prerequisites

- Existing `correction-ui` Vue 3 application
- Familiarity with Vue 3 Composition API
- Understanding of existing `useSearch` composable pattern

## Implementation Steps

### Step 1: Update Constants (5 min)

**File**: `src/constants/table.ts`

Add column filter configuration:

```typescript
// Add near existing SEARCH_CONFIG
export const COLUMN_FILTER_CONFIG = {
  DEBOUNCE_MS: 300,
  MIN_FILTER_LENGTH: 1,
  MAX_FILTER_LENGTH: 100
} as const

// Update PAGINATION_CONFIG.DEFAULT_PAGE_SIZE from 25 to 50
```

### Step 2: Add Types (5 min)

**File**: `src/types/table-enhancements.ts`

Add column filter types:

```typescript
export interface ColumnFilterState {
  subject: string
  sender: string
  category: string
  urgency: string
  action: string
}

export type FilterableColumn = keyof ColumnFilterState
```

### Step 3: Create useColumnFilters Composable (30 min)

**File**: `src/composables/useColumnFilters.ts`

Key functionality:
- Reactive filter state for 5 columns
- Debounced setFilter method
- applyFilters function for client-side filtering
- activeFilterCount computed

See [contracts/useColumnFilters.ts](./contracts/useColumnFilters.ts) for full interface.

### Step 4: Create ColumnSearchInput Component (45 min)

**File**: `src/components/ColumnSearchInput.vue`

Compact search input with:
- v-model for filter value
- Clear button when active
- Active state visual indicator
- Proper ARIA labels

See [contracts/ColumnSearchInput.vue.ts](./contracts/ColumnSearchInput.vue.ts) for full specification.

### Step 5: Update ClassificationList.vue (60 min)

**File**: `src/components/ClassificationList.vue`

Changes needed:

1. **Import composable**:
```typescript
import { useColumnFilters } from '@/composables/useColumnFilters'
```

2. **Initialize composable**:
```typescript
const {
  filters: columnFilters,
  hasActiveFilters: hasColumnFilters,
  activeFilterCount,
  setFilter: setColumnFilter,
  clearAllFilters: clearColumnFilters,
  applyFilters: applyColumnFilters
} = useColumnFilters()
```

3. **Add filter row to table header**:
```vue
<thead>
  <!-- Existing header row -->
  <tr>...</tr>

  <!-- NEW: Filter row -->
  <tr class="filter-row" v-if="!isMobile">
    <th></th> <!-- Checkbox column - no filter -->
    <th>
      <ColumnSearchInput
        v-model="columnFilters.subject"
        column-label="Subject"
        placeholder="Filter subject..."
        :is-active="columnFilters.subject.length > 0"
      />
    </th>
    <!-- Repeat for sender, category, urgency, action -->
    <th></th> <!-- Confidence - no filter -->
    <th></th> <!-- Date - no filter -->
    <th></th> <!-- Status - no filter -->
  </tr>
</thead>
```

4. **Update filtered data computation**:
```typescript
const displayedClassifications = computed(() => {
  // Start with global search results
  let result = hasSearchQuery.value
    ? filteredClassifications.value
    : store.classifications

  // Apply column filters
  if (hasColumnFilters.value) {
    result = applyColumnFilters(result)
  }

  return result
})
```

5. **Add clear column filters button** (in empty state):
```vue
<button
  v-if="hasColumnFilters"
  @click="clearColumnFilters"
  class="btn-clear-filters"
>
  Clear Column Filters
</button>
```

### Step 6: Update Default Page Size (5 min)

**File**: `src/stores/classificationStore.ts`

Change:
```typescript
const pageSize = ref(20)  // OLD
const pageSize = ref(50)  // NEW
```

**File**: `src/components/ClassificationList.vue`

Update options:
```typescript
const pageSizeOptions = [25, 50, 100]  // Matches PAGINATION_CONFIG
```

### Step 7: Add Styles (20 min)

Add to `ClassificationList.vue`:

```css
/* Filter row styles */
.filter-row th {
  padding: 4px 8px;
  background-color: var(--md-sys-color-surface-container-low);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

/* Active filter indicator in header */
.filter-active-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--md-sys-shape-corner-small);
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  font-size: var(--md-sys-typescale-label-small-size);
}
```

### Step 8: Mobile Handling (30 min)

For mobile (<768px), column filters are hidden. Add a filter toggle button:

```vue
<button
  v-if="isMobile"
  @click="showMobileFilters = true"
  class="btn-mobile-filter"
>
  <FilterIcon />
  <span v-if="activeFilterCount > 0">({{ activeFilterCount }})</span>
</button>
```

Create mobile filter modal/sheet with all 5 filter inputs stacked vertically.

## Testing

### Unit Tests

**File**: `tests/unit/composables/useColumnFilters.spec.ts`

```typescript
describe('useColumnFilters', () => {
  it('initializes with empty filters', () => {
    const { filters } = useColumnFilters()
    expect(filters.value.subject).toBe('')
  })

  it('applies single column filter', () => {
    const { setFilter, applyFilters } = useColumnFilters()
    setFilter('category', 'WORK')

    const rows = [
      { category: 'WORK', ... },
      { category: 'KIDS', ... }
    ]

    expect(applyFilters(rows)).toHaveLength(1)
  })

  it('applies multiple column filters with AND logic', () => {
    const { setFilter, applyFilters } = useColumnFilters()
    setFilter('category', 'WORK')
    setFilter('urgency', 'HIGH')

    // Test combined filtering
  })
})
```

### E2E Tests

**File**: `tests/e2e/column-filters.spec.ts`

```typescript
test('filters by subject column', async ({ page }) => {
  await page.goto('/classifications')
  await page.fill('[data-testid="filter-subject"]', 'meeting')
  await expect(page.locator('.table-row')).toHaveCount(/* expected */)
})
```

## Verification Checklist

- [ ] Column filter inputs appear below headers (desktop)
- [ ] Typing in filter narrows table results
- [ ] Multiple filters combine with AND logic
- [ ] Clear button removes individual filter
- [ ] "Clear Column Filters" removes all
- [ ] Default page size is 50 rows
- [ ] Filters work with existing global search
- [ ] Mobile shows filter toggle button
- [ ] Accessibility: inputs have proper labels

## Common Issues

### Filters Not Applying
- Check `displayedClassifications` computed is using `applyColumnFilters`
- Verify filter values are reactive (`ref` not raw object)

### Performance Issues
- Ensure debouncing is working (300ms delay)
- Check for unnecessary re-renders

### Mobile Layout Broken
- Verify filter row is hidden on mobile
- Check media query breakpoint matches
