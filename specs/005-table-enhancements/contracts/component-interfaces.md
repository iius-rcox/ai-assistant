# Component Interface Contracts

**Feature**: 005-table-enhancements
**Date**: 2025-11-24

## Overview

This document defines the props, events, and slots for all new Vue components in this feature.

---

## SearchInput.vue

Debounced search input with clear button and loading state.

### Props

```typescript
interface SearchInputProps {
  /** Current search query (v-model) */
  modelValue: string
  /** Placeholder text */
  placeholder?: string
  /** Debounce delay in ms */
  debounceMs?: number
  /** Show loading indicator */
  isLoading?: boolean
  /** Disable input */
  disabled?: boolean
  /** Result count to display */
  resultCount?: number | null
}
```

### Events

```typescript
interface SearchInputEmits {
  /** Emitted on input change (debounced) */
  'update:modelValue': [value: string]
  /** Emitted when search is triggered */
  'search': [query: string]
  /** Emitted when clear button clicked */
  'clear': []
  /** Emitted when input receives focus */
  'focus': []
}
```

### Slots

```typescript
interface SearchInputSlots {
  /** Custom prefix icon */
  prefix?: () => VNode
  /** Custom suffix content */
  suffix?: () => VNode
}
```

### Usage

```vue
<SearchInput
  v-model="searchQuery"
  placeholder="Search emails..."
  :debounce-ms="300"
  :is-loading="isSearching"
  :result-count="resultCount"
  @search="handleSearch"
  @clear="handleClear"
/>
```

---

## ColumnHeader.vue

Sortable and resizable table column header.

### Props

```typescript
interface ColumnHeaderProps {
  /** Column definition */
  column: ColumnDefinition
  /** Current sort state */
  sortState: SortState | null
  /** Current column width */
  width: number
  /** Enable sorting */
  sortable?: boolean
  /** Enable resizing */
  resizable?: boolean
}
```

### Events

```typescript
interface ColumnHeaderEmits {
  /** Emitted when column is clicked for sorting */
  'sort': [columnId: string]
  /** Emitted during resize drag */
  'resize': [columnId: string, width: number]
  /** Emitted when resize completes */
  'resize-end': [columnId: string, width: number]
}
```

### Usage

```vue
<ColumnHeader
  v-for="col in columns"
  :key="col.id"
  :column="col"
  :sort-state="sortState"
  :width="columnWidths[col.id]"
  @sort="handleSort"
  @resize="handleResize"
/>
```

---

## ConfidenceBar.vue

Visual confidence indicator with accessibility support.

### Props

```typescript
interface ConfidenceBarProps {
  /** Confidence value (0-100) */
  value: number
  /** Show percentage label */
  showLabel?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Animate on mount */
  animate?: boolean
}
```

### Computed

```typescript
interface ConfidenceBarComputed {
  /** Confidence level: high (80-100), medium (50-79), low (0-49) */
  level: ConfidenceLevel
  /** CSS color for the bar */
  color: string
  /** CSS pattern class for accessibility */
  patternClass: string
}
```

### Usage

```vue
<ConfidenceBar :value="classification.confidence" show-label />
```

### Accessibility

- Uses `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Includes visually hidden text for screen readers
- Pattern overlay (stripes/dots) supplements color for color-blind users

---

## BulkActionToolbar.vue

Action bar displayed when rows are selected.

### Props

```typescript
interface BulkActionToolbarProps {
  /** Number of selected items */
  selectedCount: number
  /** Total visible items (for "select all" calculation) */
  totalCount: number
  /** Available actions */
  actions: BulkAction[]
  /** Disable all actions */
  disabled?: boolean
  /** Show loading state */
  isLoading?: boolean
}

interface BulkAction {
  id: BulkActionType
  label: string
  icon?: string
  destructive?: boolean
}
```

### Events

```typescript
interface BulkActionToolbarEmits {
  /** Emitted when action button clicked */
  'action': [actionType: BulkActionType]
  /** Emitted when "Select All" clicked */
  'select-all': []
  /** Emitted when "Clear Selection" clicked */
  'clear-selection': []
}
```

### Usage

```vue
<BulkActionToolbar
  v-if="selectedCount > 0"
  :selected-count="selectedCount"
  :total-count="totalCount"
  :actions="availableActions"
  @action="handleBulkAction"
  @select-all="selectAll"
  @clear-selection="clearSelection"
/>
```

---

## ExpandableRowDetails.vue

Expanded row content showing email preview and history.

### Props

```typescript
interface ExpandableRowDetailsProps {
  /** Classification ID */
  classificationId: number
  /** Email body preview */
  emailBody: string | null
  /** Correction history entries */
  correctionHistory: CorrectionHistoryEntry[]
  /** Loading state */
  isLoading?: boolean
  /** Error message */
  error?: string | null
}
```

### Events

```typescript
interface ExpandableRowDetailsEmits {
  /** Emitted to retry loading */
  'retry': [classificationId: number]
  /** Emitted when user clicks to view full email */
  'view-full': [classificationId: number]
}
```

### Slots

```typescript
interface ExpandableRowDetailsSlots {
  /** Custom header content */
  header?: () => VNode
  /** Custom footer actions */
  footer?: () => VNode
}
```

### Usage

```vue
<ExpandableRowDetails
  v-if="isExpanded(row.id)"
  :classification-id="row.id"
  :email-body="expandedData[row.id]?.emailBody"
  :correction-history="expandedData[row.id]?.correctionHistory"
  :is-loading="expandedData[row.id]?.isLoading"
/>
```

---

## KeyboardShortcutsModal.vue

Help modal displaying available keyboard shortcuts.

### Props

```typescript
interface KeyboardShortcutsModalProps {
  /** Modal open state (v-model) */
  modelValue: boolean
  /** List of shortcuts to display */
  shortcuts: KeyboardShortcut[]
}
```

### Events

```typescript
interface KeyboardShortcutsModalEmits {
  'update:modelValue': [value: boolean]
  'close': []
}
```

### Usage

```vue
<KeyboardShortcutsModal
  v-model="showShortcuts"
  :shortcuts="keyboardShortcuts"
/>
```

---

## ThemeToggle.vue

Dark/light mode toggle button.

### Props

```typescript
interface ThemeToggleProps {
  /** Current theme mode (v-model) */
  modelValue: ThemeMode
  /** Show label */
  showLabel?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}
```

### Events

```typescript
interface ThemeToggleEmits {
  'update:modelValue': [mode: ThemeMode]
  'change': [mode: ThemeMode]
}
```

### Usage

```vue
<ThemeToggle v-model="themeMode" />
```

---

## InfiniteScroller.vue

Virtual scrolling container with pagination fallback.

### Props

```typescript
interface InfiniteScrollerProps {
  /** Items to render */
  items: any[]
  /** Estimated item height for virtualization */
  itemHeight: number
  /** Buffer size (items to render outside viewport) */
  buffer?: number
  /** Enable infinite scroll vs pagination */
  infinite?: boolean
  /** Loading more items */
  isLoadingMore?: boolean
  /** More items available */
  hasMore?: boolean
}
```

### Events

```typescript
interface InfiniteScrollerEmits {
  /** Emitted when user scrolls near bottom */
  'load-more': []
  /** Emitted when scroll position changes */
  'scroll': [scrollTop: number]
  /** Emitted when "back to top" is clicked */
  'scroll-to-top': []
}
```

### Slots

```typescript
interface InfiniteScrollerSlots {
  /** Row renderer (receives item and index) */
  default: (props: { item: any; index: number }) => VNode
  /** Loading indicator at bottom */
  loading?: () => VNode
  /** Empty state */
  empty?: () => VNode
}
```

### Usage

```vue
<InfiniteScroller
  :items="filteredClassifications"
  :item-height="56"
  :infinite="paginationStyle === 'infinite'"
  :is-loading-more="isLoadingMore"
  :has-more="hasMore"
  @load-more="loadMoreItems"
>
  <template #default="{ item }">
    <ClassificationRow :classification="item" />
  </template>
</InfiniteScroller>
```

---

## Composable Interfaces

### useSearch

```typescript
interface UseSearchReturn {
  /** Current search query */
  query: Ref<string>
  /** Is search in progress */
  isSearching: Ref<boolean>
  /** Search result count */
  resultCount: Ref<number | null>
  /** Filtered items (if client-side) */
  filteredItems: ComputedRef<any[]>
  /** Set search query (triggers debounced search) */
  setQuery: (query: string) => void
  /** Clear search */
  clear: () => void
  /** Force immediate search */
  searchNow: () => Promise<void>
}

function useSearch(options: SearchOptions): UseSearchReturn
```

### useSort

```typescript
interface UseSortReturn {
  /** Current sort state */
  sortState: Ref<SortState>
  /** Sorted items */
  sortedItems: ComputedRef<any[]>
  /** Set sort column (toggles direction if same column) */
  setSort: (column: SortableColumn) => void
  /** Reset to default sort */
  resetSort: () => void
}

function useSort<T>(items: Ref<T[]>, options?: SortOptions): UseSortReturn
```

### useBulkActions

```typescript
interface UseBulkActionsReturn {
  /** Selected item IDs */
  selectedIds: Ref<Set<number>>
  /** Selection count */
  selectedCount: ComputedRef<number>
  /** Is all selected */
  isAllSelected: ComputedRef<boolean>
  /** Is indeterminate (some selected) */
  isIndeterminate: ComputedRef<boolean>
  /** Toggle single selection */
  toggle: (id: number) => void
  /** Select all visible */
  selectAll: () => void
  /** Clear selection */
  clearSelection: () => void
  /** Execute bulk action */
  execute: (action: BulkActionPayload) => Promise<BulkActionResult>
  /** Is action in progress */
  isExecuting: Ref<boolean>
}

function useBulkActions(visibleIds: Ref<number[]>): UseBulkActionsReturn
```

### useExpandableRows

```typescript
interface UseExpandableRowsReturn {
  /** Set of expanded row IDs */
  expandedIds: Ref<Set<number>>
  /** Expanded row data cache */
  expandedData: Ref<Map<number, ExpandedRowData>>
  /** Check if row is expanded */
  isExpanded: (id: number) => boolean
  /** Toggle expansion (fetches data if needed) */
  toggle: (id: number) => Promise<void>
  /** Collapse all expanded rows */
  collapseAll: () => void
}

function useExpandableRows(): UseExpandableRowsReturn
```

### useKeyboardNavigation

```typescript
interface UseKeyboardNavigationReturn {
  /** Currently focused row ID */
  focusedRowId: Ref<number | null>
  /** Is table container focused */
  isTableFocused: Ref<boolean>
  /** Move focus to next row */
  focusNext: () => void
  /** Move focus to previous row */
  focusPrev: () => void
  /** Focus specific row */
  focusRow: (id: number) => void
  /** Register keyboard shortcuts */
  registerShortcuts: () => void
  /** Cleanup keyboard listeners */
  cleanup: () => void
}

function useKeyboardNavigation(
  rowIds: Ref<number[]>,
  options?: KeyboardOptions
): UseKeyboardNavigationReturn
```

### useTheme

```typescript
interface UseThemeReturn {
  /** User preference (light/dark/system) */
  mode: Ref<ThemeMode>
  /** Resolved theme (light/dark) */
  resolvedTheme: ComputedRef<'light' | 'dark'>
  /** Is dark mode active */
  isDark: ComputedRef<boolean>
  /** Set theme mode */
  setTheme: (mode: ThemeMode) => void
  /** Toggle between light and dark */
  toggle: () => void
}

function useTheme(): UseThemeReturn
```

### useColumnResize

```typescript
interface UseColumnResizeReturn {
  /** Column widths */
  widths: Ref<ColumnWidths>
  /** Start resize drag */
  startResize: (columnId: string, event: MouseEvent) => void
  /** Reset to default widths */
  resetWidths: () => void
  /** Set specific column width */
  setWidth: (columnId: string, width: number) => void
}

function useColumnResize(defaultWidths: ColumnWidths): UseColumnResizeReturn
```
