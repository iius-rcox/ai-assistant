# Research: Column Search Filters

**Feature**: 008-column-search-filters
**Date**: 2025-11-25
**Status**: Complete

## Executive Summary

Research confirms that column-level filtering should use client-side filtering with debounced input, consistent with the existing global search implementation. The approach leverages Vue 3 composables for state management and follows established patterns from 005-table-enhancements.

## Research Areas

### 1. Column Filter UI Patterns

**Decision**: Inline text inputs below column headers

**Rationale**:
- Industry standard approach (DataTables, AG-Grid, Material-UI DataGrid)
- Provides immediate visual association between filter and column
- Allows simultaneous visibility of all filter states
- Users can type and see results without modal/dropdown interaction

**Alternatives Considered**:
- **Dropdown filters**: Rejected - better for categorical data with limited options, but Subject and Sender need free-text search
- **Filter popover per column**: Rejected - adds extra clicks, hides filter state
- **Separate filter panel**: Rejected - disconnects filters from columns, requires horizontal scrolling coordination

### 2. Filtering Strategy

**Decision**: Client-side filtering with AND logic across columns

**Rationale**:
- Existing global search uses client-side filtering via `useSearch` composable
- Classifications are already paginated/loaded from server
- Instant feedback without server round-trips
- Consistent with existing architecture

**Implementation Approach**:
```typescript
// Pseudo-code for multi-column filter logic
function applyColumnFilters(rows, filters) {
  return rows.filter(row => {
    return Object.entries(filters).every(([column, query]) => {
      if (!query) return true // No filter = pass
      const value = getColumnValue(row, column)
      return value.toLowerCase().includes(query.toLowerCase())
    })
  })
}
```

**Alternatives Considered**:
- **Server-side filtering**: Rejected - adds latency, current dataset size doesn't warrant it
- **OR logic between columns**: Rejected - users expect AND logic (narrowing results)

### 3. Debounce Strategy

**Decision**: 300ms debounce per column input

**Rationale**:
- Matches existing `SEARCH_CONFIG.DEBOUNCE_MS` constant
- Prevents excessive filtering during rapid typing
- Provides responsive feedback while avoiding flicker

**Implementation**:
- Each column input has independent debounce
- Use `useDebounceFn` from VueUse (already a dependency)
- Clear previous timeout on each keystroke

### 4. Interaction with Existing Search

**Decision**: Column filters compound with global search (both apply)

**Rationale**:
- Spec requirement FR-012: "System MUST compound column filters with existing global search"
- Provides maximum filtering power
- Clear mental model: "global search narrows, then column filters narrow further"

**Implementation**:
```typescript
// Apply global search first, then column filters
const globalFiltered = useSearch().filteredClassifications
const columnFiltered = applyColumnFilters(globalFiltered, columnFilters)
```

### 5. Column Filter State Management

**Decision**: New `useColumnFilters` composable

**Rationale**:
- Separation of concerns from existing `useSearch`
- Reusable across different table implementations
- Follows established composable patterns in codebase

**Interface Design**:
```typescript
interface ColumnFilters {
  subject: string
  sender: string
  category: string
  urgency: string
  action: string
}

interface UseColumnFiltersReturn {
  filters: Ref<ColumnFilters>
  activeFilterCount: ComputedRef<number>
  hasActiveFilters: ComputedRef<boolean>
  setFilter: (column: keyof ColumnFilters, value: string) => void
  clearFilter: (column: keyof ColumnFilters) => void
  clearAllFilters: () => void
  applyFilters: <T>(rows: T[]) => T[]
}
```

### 6. Default Page Size Change

**Decision**: Update default from 20 to 50 rows

**Rationale**:
- Spec requirement FR-007
- Simple configuration change in two locations
- localStorage preference respected (FR-008)

**Implementation**:
1. Update `PAGINATION_CONFIG.DEFAULT_PAGE_SIZE` in `constants/table.ts` (currently 25)
2. Update `pageSize` ref default in `classificationStore.ts` (currently 20)
3. Keep `pageSizeOptions` including 50 (already present: [20, 50, 100])

**Note**: There's an inconsistency between:
- `constants/table.ts`: DEFAULT_PAGE_SIZE = 25, PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
- `classificationStore.ts`: pageSize = ref(20)
- `ClassificationList.vue`: pageSizeOptions = [20, 50, 100]

This should be unified to use constants.

### 7. Component Design

**Decision**: New `ColumnSearchInput.vue` component

**Rationale**:
- More compact than existing `SearchInput.vue`
- Specific to column header context
- No keyboard shortcut hint (already has global "/" shortcut)
- Smaller visual footprint

**Key Differences from SearchInput**:
| Feature | SearchInput | ColumnSearchInput |
|---------|-------------|-------------------|
| Width | max-width: 400px | Fill column width |
| Keyboard hint | Shows "/" | No hint |
| Result count | Shows results | Not shown |
| Icon | Search icon | Optional small icon |
| Clear button | X button | X button (same) |
| Active indicator | None | Highlighted border |

### 8. Mobile Considerations

**Decision**: Show column filters on tablet+, hide on mobile with filter toggle button

**Rationale**:
- Mobile table already uses card layout (see ClassificationList.vue @media max-width: 768px)
- Inline column filters don't work in card layout
- Add filter toggle button for mobile users to access filters via modal/sheet

**Implementation**:
- Desktop/Tablet (>768px): Inline column filters below headers
- Mobile (≤768px): "Filter" button that opens filter sheet/modal
- Use existing `useMediaQuery` from VueUse (already in use)

### 9. Accessibility Requirements

**Decision**: Standard form input accessibility

**Rationale**:
- Spec requirement SC-006: "meet accessibility standards"
- Follow ARIA patterns for searchbox

**Implementation**:
- `role="searchbox"` on inputs
- `aria-label="Filter by [Column]"` for each input
- `aria-controls` pointing to table tbody
- Proper focus styles (already themed in codebase)
- Tab order flows left-to-right through filter row

### 10. Visual Active State

**Decision**: Highlighted border and clear button for active filters

**Rationale**:
- Spec requirement FR-009: "visual indicator when column filter is active"
- Consistent with SearchInput pattern

**Implementation**:
```css
.column-filter.is-active {
  border-color: var(--md-sys-color-primary);
  background-color: var(--md-sys-color-primary-container);
}
```

## Resolved Unknowns

All technical context items have been resolved:

| Unknown | Resolution |
|---------|------------|
| Filter UI pattern | Inline text inputs below headers |
| Filter logic | Client-side, AND between columns |
| Debounce timing | 300ms (matches existing) |
| Global search interaction | Compound (both apply) |
| State management | New useColumnFilters composable |
| Mobile handling | Hide filters, show toggle button |

## Dependencies

- No new npm dependencies required
- Uses existing: Vue 3.5, VueUse 11.3, existing theme variables

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Performance with large datasets | Low | Medium | Client-side filtering is O(n), acceptable for 1000 rows |
| Mobile UX complexity | Low | Low | Graceful degradation to filter button |
| Filter state sync | Low | Low | Single source of truth in composable |

## References

- Existing `useSearch.ts` composable
- Existing `SearchInput.vue` component
- `constants/table.ts` SEARCH_CONFIG
- 005-table-enhancements spec for context
