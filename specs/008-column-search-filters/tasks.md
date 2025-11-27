# Tasks: Column Search Filters

**Input**: Design documents from `/specs/008-column-search-filters/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `correction-ui/src/` for source, `correction-ui/tests/` for tests
- All paths relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Types, constants, and configuration shared across all user stories

- [x] T001 [P] Add ColumnFilterState and FilterableColumn types in correction-ui/src/types/table-enhancements.ts
- [x] T002 [P] Add COLUMN_FILTER_CONFIG constant in correction-ui/src/constants/table.ts
- [x] T003 [P] Add FILTERABLE_COLUMNS configuration array in correction-ui/src/constants/table.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core composable that MUST be complete before column filter UI can be implemented

**⚠️ CRITICAL**: User Story 1 and 2 implementation depends on this phase

- [x] T004 Create useColumnFilters composable skeleton in correction-ui/src/composables/useColumnFilters.ts
- [x] T005 Implement filters reactive state and initial values in correction-ui/src/composables/useColumnFilters.ts
- [x] T006 Implement setFilter method with debouncing in correction-ui/src/composables/useColumnFilters.ts
- [x] T007 Implement applyFilters method for client-side filtering in correction-ui/src/composables/useColumnFilters.ts
- [x] T008 Implement computed properties (activeFilterCount, hasActiveFilters, activeColumns) in correction-ui/src/composables/useColumnFilters.ts
- [x] T009 Implement clearFilter and clearAllFilters methods in correction-ui/src/composables/useColumnFilters.ts
- [x] T010 Add logging integration using existing logAction utility in correction-ui/src/composables/useColumnFilters.ts

**Checkpoint**: useColumnFilters composable ready - UI implementation can now begin

---

## Phase 3: User Story 1 - Quick Column Filtering (Priority: P1) 🎯 MVP

**Goal**: Enable users to filter table rows by typing in column search fields

**Independent Test**: Type text in any column filter input → only matching rows display

### Implementation for User Story 1

- [x] T011 [US1] Create ColumnSearchInput.vue component skeleton in correction-ui/src/components/ColumnSearchInput.vue
- [x] T012 [US1] Implement props and emits per contract in correction-ui/src/components/ColumnSearchInput.vue
- [x] T013 [US1] Implement template with input, clear button, and accessibility attributes in correction-ui/src/components/ColumnSearchInput.vue
- [x] T014 [US1] Implement scoped styles with M3 design tokens in correction-ui/src/components/ColumnSearchInput.vue
- [x] T015 [US1] Add filter row to table header section in correction-ui/src/components/ClassificationList.vue
- [x] T016 [US1] Import and initialize useColumnFilters composable in correction-ui/src/components/ClassificationList.vue
- [x] T017 [US1] Add ColumnSearchInput components for each filterable column (Subject, Sender, Category, Urgency, Action) in correction-ui/src/components/ClassificationList.vue
- [x] T018 [US1] Update displayedClassifications computed to apply column filters in correction-ui/src/components/ClassificationList.vue
- [x] T019 [US1] Add responsive styles for filter row on tablet/desktop in correction-ui/src/components/ClassificationList.vue

**Checkpoint**: Single column filtering works - user can filter by any individual column

---

## Phase 4: User Story 2 - Multi-Column Filtering (Priority: P1)

**Goal**: Enable users to filter by multiple columns simultaneously with AND logic

**Independent Test**: Enter text in two column filters → only rows matching BOTH criteria display

### Implementation for User Story 2

- [x] T020 [US2] Verify AND logic works correctly when multiple filters active in correction-ui/src/composables/useColumnFilters.ts
- [x] T021 [US2] Add empty state message when no rows match combined filters in correction-ui/src/components/ClassificationList.vue
- [x] T022 [US2] Add "Clear Column Filters" button in empty state in correction-ui/src/components/ClassificationList.vue
- [x] T023 [US2] Ensure column filters compound with existing global search in correction-ui/src/components/ClassificationList.vue
- [x] T024 [US2] Test integration with existing sidebar filters (AND logic) in correction-ui/src/components/ClassificationList.vue

**Checkpoint**: Multi-column filtering with AND logic works correctly

---

## Phase 5: User Story 3 - Increased Default Pagination (Priority: P2)

**Goal**: Display 50 rows by default instead of 20 for improved data visibility

**Independent Test**: Load classifications page fresh → 50 rows displayed (if data exists)

### Implementation for User Story 3

- [x] T025 [P] [US3] Update PAGINATION_CONFIG.DEFAULT_PAGE_SIZE from 25 to 50 in correction-ui/src/constants/table.ts
- [x] T026 [P] [US3] Update pageSize ref default from 20 to 50 in correction-ui/src/stores/classificationStore.ts
- [x] T027 [US3] Update pageSizeOptions to [25, 50, 100] in correction-ui/src/components/ClassificationList.vue
- [x] T028 [US3] Verify localStorage preference preservation still works in correction-ui/src/components/ClassificationList.vue

**Checkpoint**: Default pagination shows 50 rows, user preferences preserved

---

## Phase 6: User Story 4 - Visual Filter Feedback (Priority: P2)

**Goal**: Provide clear visual indicators for active column filters

**Independent Test**: Enter text in filter → visual indicator appears; clear filter → indicator disappears

### Implementation for User Story 4

- [x] T029 [US4] Add isActive prop handling with highlighted border style in correction-ui/src/components/ColumnSearchInput.vue
- [x] T030 [US4] Add active filter count badge/indicator near table header in correction-ui/src/components/ClassificationList.vue
- [x] T031 [US4] Style active state with primary border and primary-container background in correction-ui/src/components/ColumnSearchInput.vue
- [x] T032 [US4] Ensure clear button only shows when filter has text in correction-ui/src/components/ColumnSearchInput.vue

**Checkpoint**: Active filters visually distinct, filter count displayed

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Mobile handling, accessibility, and cleanup

- [x] T033 [P] Add mobile responsive handling - hide filter row below 768px in correction-ui/src/components/ClassificationList.vue
- [x] T034 [P] Add mobile filter toggle button for accessing filters on small screens in correction-ui/src/components/ClassificationList.vue
- [x] T035 [P] Create MobileColumnFilters modal/sheet component for mobile filter UI in correction-ui/src/components/MobileColumnFilters.vue
- [x] T036 Verify keyboard navigation (Tab) through filter inputs in correction-ui/src/components/ClassificationList.vue
- [x] T037 Add aria-controls attribute linking filter inputs to table tbody in correction-ui/src/components/ClassificationList.vue
- [x] T038 Add JSDoc comments to useColumnFilters composable in correction-ui/src/composables/useColumnFilters.ts
- [x] T039 Run type-check and fix any TypeScript errors
- [x] T040 Run lint and format commands, fix any issues

---

## Phase 8: Testing (Deferred - Future Sprint)

**Purpose**: Unit and E2E tests for column filter functionality

- [ ] T041 [P] Create useColumnFilters.spec.ts unit tests in correction-ui/tests/unit/composables/
- [ ] T042 [P] Create ColumnSearchInput.spec.ts component tests in correction-ui/tests/unit/components/
- [ ] T043 Create column-filters.spec.ts E2E tests in correction-ui/tests/e2e/
- [ ] T044 Add test coverage for multi-column AND logic
- [ ] T045 Add test coverage for mobile filter modal interactions

**Note**: Tests deferred from initial implementation. To be addressed in dedicated testing sprint.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS User Stories 1, 2, 4
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2)
- **User Story 2 (Phase 4)**: Depends on User Story 1 (extends filtering logic)
- **User Story 3 (Phase 5)**: Can start after Setup - NO dependencies on other stories
- **User Story 4 (Phase 6)**: Depends on User Story 1 (needs filter component to style)
- **Polish (Phase 7)**: Depends on User Stories 1-4 completion

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2) - Core filtering
- **User Story 2 (P1)**: Depends on User Story 1 - Multi-column is extension of single column
- **User Story 3 (P2)**: Independent - can run in parallel with US1/US2 after Setup
- **User Story 4 (P2)**: Depends on User Story 1 - Visual feedback for existing filters

### Within Each User Story

- Component skeleton before implementation
- Core functionality before styling
- Integration before edge cases

### Parallel Opportunities

**Phase 1 - All tasks can run in parallel:**
```
T001 || T002 || T003 (different files)
```

**Phase 2 - Sequential (same file):**
```
T004 → T005 → T006 → T007 → T008 → T009 → T010
```

**Phase 3 - Partial parallel:**
```
T011 → T012 → T013 → T014 (ColumnSearchInput.vue - sequential)
T015 → T016 → T017 → T018 → T019 (ClassificationList.vue - sequential)
Both streams can run in parallel after T014 completes
```

**Phase 5 - Parallel possible:**
```
T025 || T026 (different files)
Then T027 → T028
```

**Phase 7 - Multiple parallel streams:**
```
T033 || T035 || T038 (different files)
```

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all setup tasks together (different files):
Task: "Add ColumnFilterState types in correction-ui/src/types/table-enhancements.ts"
Task: "Add COLUMN_FILTER_CONFIG constant in correction-ui/src/constants/table.ts"
Task: "Add FILTERABLE_COLUMNS array in correction-ui/src/constants/table.ts"
```

## Parallel Example: US3 Independent

```bash
# US3 can run in parallel with US1/US2 (after Phase 1):
Task: "Update DEFAULT_PAGE_SIZE in correction-ui/src/constants/table.ts"
Task: "Update pageSize default in correction-ui/src/stores/classificationStore.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 3)

1. Complete Phase 1: Setup (types, constants)
2. Complete Phase 2: Foundational (useColumnFilters composable)
3. Complete Phase 3: User Story 1 (single column filtering)
4. Complete Phase 5: User Story 3 (50 rows default) - can be done in parallel with Phase 3
5. **STOP and VALIDATE**: Test single column filtering + pagination change
6. Deploy/demo if ready

### Full Feature Delivery

1. MVP (US1 + US3) → Test independently → Deploy
2. Add User Story 2 (multi-column) → Test AND logic → Deploy
3. Add User Story 4 (visual feedback) → Test indicators → Deploy
4. Complete Polish phase → Final testing → Release

### Incremental Delivery Checkpoints

| Checkpoint | Stories Complete | Value Delivered |
|------------|------------------|-----------------|
| After Phase 3 | US1 | Single column filtering works |
| After Phase 4 | US1 + US2 | Multi-column AND filtering works |
| After Phase 5 | US1 + US2 + US3 | + 50 rows default pagination |
| After Phase 6 | US1-4 | + Visual filter indicators |
| After Phase 7 | All | + Mobile support, polish |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- User Story 3 (pagination) is fully independent and can be done anytime after Setup
- Mobile filter UI (T033-T035) is enhancement, not core functionality
- All filter operations are client-side on already-loaded data
- No database changes required
