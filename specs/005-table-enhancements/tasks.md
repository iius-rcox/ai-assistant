# Tasks: Email Classifications Table Enhancements

**Feature**: 005-table-enhancements
**Branch**: `005-table-enhancements`
**Generated**: 2025-11-24
**Total Tasks**: 89

## Overview

This task list implements 11 user stories for Email Classifications table enhancements, organized for independent testing and incremental delivery.

### User Story Summary

| ID | Story | Priority | Tasks | Independent Test |
|----|-------|----------|-------|------------------|
| US1 | Real-Time Search | P1 | 8 | Type in search, verify filter |
| US2 | Column Sorting | P1 | 7 | Click headers, verify sort |
| US3 | Bulk Actions & Multi-Select | P2 | 10 | Select rows, apply bulk action |
| US4 | Expandable Row Details | P2 | 7 | Click expand, view details |
| US5 | Keyboard Shortcuts | P2 | 7 | Press shortcuts, verify actions |
| US6 | Visual Confidence Indicators | P2 | 5 | View confidence bars |
| US7 | Infinite Scroll / Pagination | P3 | 8 | Scroll to bottom, verify load |
| US8 | Resizable Columns | P3 | 6 | Drag column borders |
| US9 | Dark/Light Mode | P3 | 7 | Toggle theme |
| US10 | Responsive Design | P3 | 6 | Resize browser, verify layout |
| US11 | Analytics Dashboard | P3 | 8 | View charts, drill-down |

---

## Phase 1: Setup

**Goal**: Initialize project structure and shared types

- [x] T001 Install vue-virtual-scroller dependency in correction-ui/package.json
- [x] T002 Create types file in correction-ui/src/types/table-enhancements.ts with all type definitions from data-model.md
- [x] T003 Create constants file in correction-ui/src/constants/table.ts with column definitions and keyboard shortcuts
- [x] T004 [P] Create Supabase full-text search index via SQL migration (see data-model.md)
- [x] T005 [P] Create search_emails RPC function in Supabase (see contracts/supabase-api.md)

---

## Phase 2: Foundational

**Goal**: Create shared utilities used by multiple user stories

- [x] T006 Create storage constants in correction-ui/src/constants/storage.ts with TABLE_STORAGE_KEYS
- [x] T007 Extend classificationStore.ts with search/sort/bulk state interfaces in correction-ui/src/stores/classificationStore.ts
- [x] T008 Add getClassificationWithDetails method to correction-ui/src/services/classificationService.ts

---

## Phase 3: User Story 1 - Real-Time Search (P1)

**Goal**: Users can instantly filter the table by typing keywords

**Independent Test**: Type "invoice" in search box, verify table filters within 300ms

**Requirements**: FR-001, FR-002, FR-003, FR-004

### Implementation

- [x] T009 [US1] Create searchService.ts in correction-ui/src/services/searchService.ts with hybrid client/server search logic
- [x] T010 [US1] Implement client-side filtering function in searchService.ts for datasets <1,000 rows
- [x] T011 [US1] Implement Supabase full-text search function in searchService.ts for datasets ≥1,000 rows
- [x] T012 [US1] Create useSearch composable in correction-ui/src/composables/useSearch.ts with debounce and caching
- [x] T013 [P] [US1] Create SearchInput.vue component in correction-ui/src/components/SearchInput.vue
- [x] T014 [US1] Add loading skeleton rows to ClassificationList.vue for search loading state
- [x] T015 [US1] Add empty state component to ClassificationList.vue for no search results
- [x] T016 [US1] Integrate SearchInput and useSearch into ClassificationList.vue

---

## Phase 4: User Story 2 - Column Sorting (P1)

**Goal**: Users can sort the table by clicking column headers

**Independent Test**: Click "Confidence" header, verify rows sort ascending, click again for descending

**Requirements**: FR-005, FR-006, FR-007, FR-009

### Implementation

- [x] T017 [US2] Create useSort composable in correction-ui/src/composables/useSort.ts with localStorage persistence
- [x] T018 [P] [US2] Create ColumnHeader.vue component in correction-ui/src/components/ColumnHeader.vue with sort indicator
- [x] T019 [US2] Add sort toggle logic to ColumnHeader.vue (asc → desc → asc cycle)
- [x] T020 [US2] Add hover cursor styling to ColumnHeader.vue indicating clickable
- [x] T021 [US2] Implement sort comparison functions for all column types in useSort.ts
- [x] T022 [US2] Integrate useSort and ColumnHeader into ClassificationList.vue table
- [x] T023 [US2] Verify sort preference persists across page refresh

---

## Phase 5: User Story 3 - Bulk Actions & Multi-Select (P2)

**Goal**: Users can select multiple rows and apply actions in bulk

**Independent Test**: Select 3 rows, click "Change Category", verify all 3 updated

**Requirements**: FR-010, FR-011, FR-012, FR-013, FR-014

### Implementation

- [x] T024 [US3] Create useBulkActions composable in correction-ui/src/composables/useBulkActions.ts
- [x] T025 [US3] Implement toggle, selectAll, clearSelection methods in useBulkActions.ts
- [x] T026 [US3] Add bulkUpdateClassifications method to classificationService.ts with per-item error handling
- [x] T027 [P] [US3] Create BulkActionToolbar.vue component in correction-ui/src/components/BulkActionToolbar.vue
- [x] T028 [US3] Add "Change Category" action to BulkActionToolbar with modal
- [x] T029 [US3] Add "Change Urgency" action to BulkActionToolbar with modal
- [x] T030 [US3] Add "Mark as Reviewed" action to BulkActionToolbar
- [x] T031 [US3] Add row selection checkboxes to ClassificationList.vue table rows
- [x] T032 [US3] Add "Select All" checkbox to ClassificationList.vue table header
- [x] T033 [US3] Integrate BulkActionToolbar and useBulkActions into ClassificationList.vue

---

## Phase 6: User Story 4 - Expandable Row Details (P2)

**Goal**: Users can expand rows to see email preview and correction history

**Independent Test**: Click expand icon, verify email body and history appear

**Requirements**: FR-015, FR-016, FR-017, FR-018

### Implementation

- [x] T034 [US4] Create useExpandableRows composable in correction-ui/src/composables/useExpandableRows.ts
- [x] T035 [US4] Implement lazy-load email body fetch in useExpandableRows.ts
- [x] T036 [US4] Implement correction history fetch in useExpandableRows.ts
- [x] T037 [P] [US4] Create ExpandableRowDetails.vue component in correction-ui/src/components/ExpandableRowDetails.vue
- [x] T038 [US4] Add email body preview (500 chars) display to ExpandableRowDetails.vue
- [x] T039 [US4] Add correction history timeline to ExpandableRowDetails.vue
- [x] T040 [US4] Integrate expand/collapse toggle and ExpandableRowDetails into ClassificationList.vue

---

## Phase 7: User Story 5 - Keyboard Shortcuts (P2)

**Goal**: Power users can navigate and interact with keyboard only

**Independent Test**: Press "/" to focus search, "?" for help modal, arrows to navigate

**Requirements**: FR-019, FR-020, FR-021, FR-022, FR-023

### Implementation

- [x] T041 [US5] Create useKeyboardNavigation composable in correction-ui/src/composables/useKeyboardNavigation.ts
- [x] T042 [US5] Implement row focus management with Up/Down arrows in useKeyboardNavigation.ts
- [x] T043 [US5] Implement Enter key expand/collapse in useKeyboardNavigation.ts
- [x] T044 [US5] Implement "/" key to focus search input (global shortcut)
- [x] T045 [P] [US5] Create KeyboardShortcutsModal.vue in correction-ui/src/components/KeyboardShortcutsModal.vue
- [x] T046 [US5] Implement "?" key to show shortcuts modal (global shortcut)
- [x] T047 [US5] Integrate useKeyboardNavigation into ClassificationList.vue with focus styling

---

## Phase 8: User Story 6 - Visual Confidence Indicators (P2)

**Goal**: Users can quickly identify low-confidence items via visual progress bars

**Independent Test**: View confidence column, verify colored bars match percentages

**Requirements**: FR-024, FR-025, FR-026, FR-027

### Implementation

- [x] T048 [P] [US6] Create ConfidenceBar.vue component in correction-ui/src/components/ConfidenceBar.vue
- [x] T049 [US6] Implement color thresholds (green 80+, amber 50-79, red <50) in ConfidenceBar.vue
- [x] T050 [US6] Add accessibility patterns (stripes/dots) for color-blind users in ConfidenceBar.vue
- [x] T051 [US6] Add tooltip showing exact percentage on hover in ConfidenceBar.vue
- [x] T052 [US6] Replace numeric confidence display with ConfidenceBar in ClassificationList.vue

---

## Phase 9: User Story 7 - Infinite Scroll / Pagination (P3)

**Goal**: Users can choose between infinite scroll and traditional pagination

**Independent Test**: Scroll to bottom, verify more rows load; toggle to pagination mode

**Requirements**: FR-028, FR-029, FR-030, FR-031

### Implementation

- [x] T053 [US7] Create useInfiniteScroll composable in correction-ui/src/composables/useInfiniteScroll.ts
- [x] T054 [US7] Implement scroll position detection and preload trigger in useInfiniteScroll.ts
- [x] T055 [US7] Add pagination style preference to localStorage in useInfiniteScroll.ts
- [x] T056 [P] [US7] Create InfiniteScroller.vue component in correction-ui/src/components/InfiniteScroller.vue
- [x] T057 [US7] Integrate vue-virtual-scroller for virtualization in InfiniteScroller.vue
- [x] T058 [US7] Add loading indicator at bottom during load-more in InfiniteScroller.vue
- [x] T059 [US7] Add "Back to Top" button to InfiniteScroller.vue
- [ ] T060 [US7] Add pagination/infinite scroll toggle and integrate InfiniteScroller into ClassificationList.vue

---

## Phase 10: User Story 8 - Resizable Columns (P3)

**Goal**: Users can drag column borders to resize and widths persist

**Independent Test**: Drag column border, verify width changes and persists after refresh

**Requirements**: FR-008, FR-009

### Implementation

- [x] T061 [US8] Create useColumnResize composable in correction-ui/src/composables/useColumnResize.ts
- [x] T062 [US8] Implement drag handle event listeners in useColumnResize.ts
- [x] T063 [US8] Add minimum width (50px) constraint in useColumnResize.ts
- [x] T064 [US8] Add localStorage persistence for column widths in useColumnResize.ts
- [ ] T065 [US8] Add resize handle styling to ColumnHeader.vue
- [ ] T066 [US8] Integrate useColumnResize into ClassificationList.vue table

---

## Phase 11: User Story 9 - Dark/Light Mode (P3)

**Goal**: Users can toggle between dark and light themes

**Independent Test**: Click theme toggle, verify colors change; refresh to verify persistence

**Requirements**: FR-032, FR-033, FR-034, FR-035

### Implementation

- [x] T067 [US9] Create useTheme composable in correction-ui/src/composables/useTheme.ts
- [x] T068 [US9] Implement system preference detection in useTheme.ts via prefers-color-scheme
- [x] T069 [US9] Add localStorage persistence for theme preference in useTheme.ts
- [x] T070 [P] [US9] Create light theme CSS variables in correction-ui/src/assets/themes/light.css
- [x] T071 [P] [US9] Create dark theme CSS variables in correction-ui/src/assets/themes/dark.css
- [x] T072 [P] [US9] Create ThemeToggle.vue component in correction-ui/src/components/ThemeToggle.vue
- [ ] T073 [US9] Integrate ThemeToggle into App.vue header and apply theme to document

---

## Phase 12: User Story 10 - Responsive Design (P3)

**Goal**: Mobile users can review emails on screens 320px and wider

**Independent Test**: Resize browser <768px, verify card layout; check 44px touch targets

**Requirements**: FR-036, FR-037, FR-038, FR-039

### Implementation

- [x] T074 [US10] Create MobileCardView.vue component in correction-ui/src/components/MobileCardView.vue
- [x] T075 [US10] Create SlideOutFilters.vue component in correction-ui/src/components/SlideOutFilters.vue
- [x] T076 [US10] Add responsive breakpoint detection to ClassificationList.vue using useMediaQuery
- [x] T077 [US10] Add conditional rendering for card vs table layout in ClassificationList.vue
- [x] T078 [US10] Ensure all interactive elements have 44px minimum touch targets
- [x] T079 [US10] Add horizontal scroll container for tablet portrait orientation

---

## Phase 13: User Story 11 - Analytics Dashboard (P3)

**Goal**: Administrators can view correction trends and accuracy metrics

**Independent Test**: View Analytics tab, verify charts display; click data point for drill-down

**Requirements**: FR-040, FR-041, FR-042, FR-043, FR-044

### Implementation

- [ ] T080 [US11] Extend analyticsService.ts with getCorrectionTrends method in correction-ui/src/services/analyticsService.ts
- [ ] T081 [US11] Extend analyticsService.ts with getCategoryDistribution method
- [ ] T082 [US11] Extend analyticsService.ts with getAccuracyTrends method
- [ ] T083 [P] [US11] Create CorrectionsChart.vue with ApexCharts line chart in correction-ui/src/components/analytics/CorrectionsChart.vue
- [ ] T084 [P] [US11] Create CategoryPieChart.vue with ApexCharts pie chart in correction-ui/src/components/analytics/CategoryPieChart.vue
- [ ] T085 [US11] Add drill-down click handlers to charts
- [ ] T086 [US11] Add CSV/PDF export functionality to analyticsService.ts
- [ ] T087 [US11] Integrate new charts into Analytics tab view

---

## Phase 14: Polish & Cross-Cutting

**Goal**: Final integration, edge cases, and performance optimization

- [ ] T088 Collapse all expanded rows when sort changes in ClassificationList.vue
- [ ] T089 Reset scroll position when filters change in ClassificationList.vue

---

## Dependencies

### Story Completion Order

```
Phase 1 (Setup) ─────┬─► Phase 2 (Foundational)
                     │
                     ▼
              ┌──────┴──────┐
              │             │
              ▼             ▼
          US1 (Search)  US2 (Sort)     [P1 - Can be parallel]
              │             │
              └──────┬──────┘
                     │
                     ▼
              US3 (Bulk)               [P2 - After P1 complete]
                     │
              ┌──────┼──────┐
              │      │      │
              ▼      ▼      ▼
          US4    US5    US6            [P2 - Can be parallel]
         (Expand)(Keys)(Confidence)
                     │
              ┌──────┴──────┐
              │      │      │
              ▼      ▼      ▼
          US7    US8    US9            [P3 - Can be parallel]
         (Scroll)(Resize)(Theme)
                     │
              ┌──────┴──────┐
              │             │
              ▼             ▼
          US10          US11           [P3 - Can be parallel]
        (Responsive)  (Analytics)
                     │
                     ▼
              Phase 14 (Polish)
```

### Inter-Story Dependencies

| Story | Depends On | Reason |
|-------|------------|--------|
| US1 | Setup | Needs types, Supabase search |
| US2 | Setup | Needs types, column constants |
| US3 | US1, US2 | Selection interacts with filtered/sorted list |
| US4 | US1, US2 | Expand state affected by sort |
| US5 | US1, US4 | Keyboard nav needs search focus, expand |
| US6 | Setup | Standalone component |
| US7 | US1, US2 | Scroll interacts with filter/sort |
| US8 | US2 | Extends ColumnHeader |
| US9 | Setup | Standalone, affects all components |
| US10 | US1-US6 | Must adapt all existing features |
| US11 | Setup | Extends existing analytics |

---

## Parallel Execution Examples

### Phase 3-4 (P1 Features)

```
┌─────────────────────────────────────────────────────────────┐
│ Agent 1                    │ Agent 2                        │
├────────────────────────────┼────────────────────────────────┤
│ T009-T016 (US1 Search)     │ T017-T023 (US2 Sort)          │
│ searchService.ts           │ useSort.ts                     │
│ useSearch.ts               │ ColumnHeader.vue               │
│ SearchInput.vue            │ Sort integration               │
└────────────────────────────┴────────────────────────────────┘
```

### Phase 6-8 (P2 Features after US3)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Agent 1              │ Agent 2              │ Agent 3                   │
├──────────────────────┼──────────────────────┼───────────────────────────┤
│ T034-T040 (US4)      │ T041-T047 (US5)      │ T048-T052 (US6)           │
│ Expandable Rows      │ Keyboard Nav         │ Confidence Bars           │
│ ExpandableRowDetails │ useKeyboardNavigation│ ConfidenceBar.vue         │
└──────────────────────┴──────────────────────┴───────────────────────────┘
```

### Phase 9-11 (P3 Features)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ Agent 1              │ Agent 2              │ Agent 3                         │
├──────────────────────┼──────────────────────┼─────────────────────────────────┤
│ T053-T060 (US7)      │ T061-T066 (US8)      │ T067-T073 (US9)                 │
│ Infinite Scroll      │ Resizable Columns    │ Theme Toggle                    │
│ InfiniteScroller.vue │ useColumnResize.ts   │ useTheme.ts, ThemeToggle.vue    │
└──────────────────────┴──────────────────────┴─────────────────────────────────┘
```

---

## Implementation Strategy

### MVP Scope (Recommended First Delivery)

**Phase 1 + Phase 2 + US1 + US2 + US6**

This delivers:
- Real-time search (most requested feature)
- Column sorting (enables prioritized review)
- Visual confidence indicators (quick identification)

Estimated effort: ~8-10 tasks, provides immediate user value

### Incremental Delivery Path

1. **MVP**: Search + Sort + Confidence (US1, US2, US6)
2. **Efficiency**: Bulk Actions + Keyboard (US3, US5)
3. **Context**: Expandable Details (US4)
4. **Polish**: Infinite Scroll + Resize (US7, US8)
5. **Comfort**: Theme + Responsive (US9, US10)
6. **Insights**: Analytics (US11)

---

## Validation Checklist

- [x] All 89 tasks follow checklist format (checkbox, ID, labels, file paths)
- [x] Tasks organized by user story for independent testing
- [x] Parallel tasks marked with [P]
- [x] Story labels [US1]-[US11] on all user story tasks
- [x] File paths specified for all implementation tasks
- [x] Dependencies documented
- [x] MVP scope identified (US1, US2, US6)
