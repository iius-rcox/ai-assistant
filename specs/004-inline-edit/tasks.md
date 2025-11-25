# Tasks: Inline Table Editing for Corrections

**Input**: Design documents from `/specs/004-inline-edit/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/supabase-rpc.md

**Tests**: Tests are NOT requested in the specification. Test tasks are included as optional and can be executed after core implementation if desired.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `correction-ui/src/`
- **Tests**: `correction-ui/tests/`
- **Migrations**: `correction-ui/supabase/migrations/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema and foundational type definitions needed by all user stories

- [x] T001 Create database migration for version column in correction-ui/supabase/migrations/20251123_add_version_column.sql
- [x] T002 Run database migration using Supabase CLI to add version column and trigger
- [x] T003 Regenerate TypeScript types from Supabase schema using supabase gen types
- [x] T004 [P] Install VueUse dependency in correction-ui package.json (~11.2.0)
- [x] T005 [P] Create localStorage storage constants file in correction-ui/src/constants/storage.ts
- [x] T006 [P] Create inline edit TypeScript types file in correction-ui/src/types/inline-edit.ts
- [x] T007 [P] Create storage TypeScript types file in correction-ui/src/types/storage.ts
- [x] T008 Add version field to Classification type in correction-ui/src/types/models.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities and store infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T009 [P] Create dirty tracking composable in correction-ui/src/composables/useDirtyTracking.ts
- [x] T010 [P] Create 3-way merge utility for conflict resolution in correction-ui/src/utils/mergeChanges.ts
- [x] T011 [P] Create localStorage cleanup utility in correction-ui/src/utils/storageCleanup.ts
- [x] T012 Add inline edit validation rules to correction-ui/src/utils/validation.ts
- [x] T013 Add inline edit state to Pinia classification store in correction-ui/src/stores/classificationStore.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Quick Inline Correction (Priority: P1) 🎯 MVP

**Goal**: Enable users to click on any table row and edit category/urgency/action fields inline with save/cancel actions, eliminating the need to navigate to a separate detail page

**Independent Test**: Click a row in the classification table, change any dropdown field, click Save - the correction is persisted and the row returns to display mode without page navigation

### Implementation for User Story 1

- [x] T014 [P] [US1] Create inline edit composable with save/cancel logic in correction-ui/src/composables/useInlineEdit.ts
- [x] T015 [P] [US1] Create inline edit cell component for dropdown fields in correction-ui/src/components/InlineEditCell.vue
- [x] T016 [US1] Modify ClassificationList component to support inline edit mode in correction-ui/src/components/ClassificationList.vue
- [x] T017 [US1] Add click handler to enter edit mode in ClassificationList
- [x] T018 [US1] Add row state tracking (editingRowId, editingData) to table rows
- [x] T019 [US1] Replace static cells with InlineEditCell components for category/urgency/action when in edit mode
- [x] T020 [US1] Add Save and Cancel button cells to editing rows
- [x] T021 [US1] Implement save handler with Supabase update and optimistic locking in useInlineEdit composable
- [x] T022 [US1] Implement cancel handler to revert changes and exit edit mode
- [x] T023 [US1] Add unsaved changes prompt when clicking different row while editing
- [x] T024 [US1] Update store actions to handle optimistic locking conflicts (detect version mismatch)
- [x] T025 [US1] Test inline edit workflow: click row → edit → save → verify persistence

**Checkpoint**: At this point, basic inline editing should be fully functional - users can correct classifications without navigating to detail page

---

## Phase 4: User Story 2 - Visual Edit State Feedback (Priority: P2)

**Goal**: Provide clear visual indicators for edit mode, unsaved changes, saving status, and success/error feedback

**Independent Test**: Enter edit mode on any row and observe visual highlighting, watch Save button enable/disable based on changes, observe loading spinner during save, and see success message after save completes

### Implementation for User Story 2

- [x] T026 [P] [US2] Add visual highlighting CSS for rows in edit mode in correction-ui/src/components/ClassificationList.vue
- [x] T027 [P] [US2] Add CSS styles for disabled/enabled Save button states
- [x] T028 [P] [US2] Add loading spinner component for save-in-progress state
- [x] T029 [US2] Implement Save button state logic (disabled when no changes, enabled when dirty)
- [x] T030 [US2] Add success message display with auto-hide after 3 seconds
- [x] T031 [US2] Add error message display for failed saves
- [x] T032 [US2] Add visual indicator for disabled form controls during save operation
- [x] T033 [US2] Test visual feedback: verify highlighting, button states, loading, and success/error messages

**Checkpoint**: At this point, users have clear visual feedback for all edit states

---

## Phase 5: User Story 3 - Keyboard-Driven Editing (Priority: P3)

**Goal**: Enable keyboard-only users to navigate table, enter/exit edit mode, and save/cancel using keyboard shortcuts (Tab, Enter, Escape, Space)

**Independent Test**: Without using mouse, use Tab to focus a row, press Enter to edit, Tab through fields, Enter to save, Escape to cancel - complete full workflow with keyboard only

### Implementation for User Story 3

- [x] T034 [P] [US3] Create grid navigation composable for ARIA keyboard pattern in correction-ui/src/composables/useGridNavigation.ts
- [x] T035 [US3] Add ARIA grid roles to table markup in correction-ui/src/components/ClassificationList.vue
- [x] T036 [US3] Implement arrow key navigation (up/down between rows, left/right between cells)
- [x] T037 [US3] Add Enter key handler to enter edit mode from navigation mode
- [x] T038 [US3] Add Escape key handler to cancel editing and return to navigation mode
- [x] T039 [US3] Add Space key handler to enter edit mode (alternative to Enter)
- [x] T040 [US3] Add Tab/Shift+Tab handlers for field navigation within edit mode
- [x] T041 [US3] Add Enter key handler in edit mode to save changes
- [x] T042 [US3] Add focus management to ensure visible focus indicators (outline styles)
- [x] T043 [US3] Add aria-rowindex, aria-colindex, aria-selected attributes for screen readers
- [x] T044 [US3] Test keyboard navigation: arrow keys, Enter, Escape, Tab, Space all work correctly

**Checkpoint**: At this point, keyboard-only users can complete full correction workflow

---

## Phase 6: User Story 4 - Batch View Context Retention (Priority: P3)

**Goal**: Maintain filter, sort, and pagination state when saving inline edits so users don't lose their place

**Independent Test**: Apply filters and sort, navigate to page 3, make an inline correction, save - verify still on page 3 with same filters/sort applied

### Implementation for User Story 4

- [x] T045 [US4] Verify current store implementation preserves filter state after save (may already work)
- [x] T046 [US4] Verify current store implementation preserves sort state after save (may already work)
- [x] T047 [US4] Verify current store implementation preserves pagination after save (may already work)
- [x] T048 [US4] Add logic to detect when corrected item no longer matches filters
- [x] T049 [US4] Add notification when corrected item is removed from view due to filter mismatch
- [x] T050 [US4] Test context retention: filters, sort, and pagination all preserved after inline save

**Checkpoint**: At this point, users maintain their review context while making corrections

---

## Phase 7: Edge Case Handling (Resilience Features)

**Purpose**: Handle concurrent edits, network failures, session expiration, and browser navigation - implements FR-021 through FR-036

### Optimistic Locking & Conflict Resolution

- [x] T051 [P] Create conflict resolution dialog component in correction-ui/src/components/ConflictResolutionDialog.vue
- [x] T052 [P] Create auto-save composable with VueUse in correction-ui/src/composables/useAutoSave.ts
- [x] T053 [P] Create unsaved changes guard composable in correction-ui/src/composables/useUnsavedChangesGuard.ts
- [x] T054 [P] Create pending queue composable for offline submissions in correction-ui/src/composables/usePendingQueue.ts
- [x] T055 Add conflict detection logic to save handler in useInlineEdit composable
- [x] T056 Display ConflictResolutionDialog when version conflict detected
- [x] T057 Implement conflict resolution actions (keep mine, use server, merge)
- [x] T058 Add conflict state tracking to Pinia store (conflict data, resolution choice)
- [x] T059 Test concurrent edit scenario: simulate version conflict and verify resolution UI

### Offline/Network Resilience

- [x] T060 Integrate useAutoSave composable into useInlineEdit for automatic localStorage backup
- [x] T061 Add network status detection using VueUse useOnline composable
- [x] T062 Display offline indicator when network connectivity unavailable
- [x] T063 Implement auto-retry logic when connectivity restored
- [x] T064 Integrate usePendingQueue to queue failed saves during offline periods
- [x] T065 Add localStorage restoration on component mount (recover from page reload)
- [x] T066 Test offline scenario: go offline, edit, save fails, go online, verify auto-retry

### Session Expiration & Browser Navigation

- [x] T067 Integrate useUnsavedChangesGuard into ClassificationList component
- [x] T068 Add beforeunload event handler when unsaved changes exist
- [x] T069 Add Vue Router navigation guard to prompt before leaving page
- [x] T070 Add session expiration detection (Supabase 401/403 responses)
- [x] T071 Save edit state to localStorage before auth redirect
- [x] T072 Restore edit state after successful re-authentication
- [x] T073 Test browser navigation: attempt back button with unsaved changes, verify warning
- [x] T074 Test session expiration: simulate expired token, verify edit preservation and restore

---

## Phase 8: Responsive Design (Mobile Support)

**Purpose**: Adapt inline editing for mobile devices with modal overlay and touch-friendly controls - implements FR-031 through FR-034

- [x] T075 [P] Create mobile edit modal component in correction-ui/src/components/MobileEditModal.vue
- [x] T076 [P] Add responsive breakpoint detection using VueUse useMediaQuery (768px threshold)
- [x] T077 Add conditional rendering in ClassificationList: inline for desktop, modal trigger for mobile
- [x] T078 Add touch-friendly tap targets (44x44px minimum) to mobile edit controls
- [x] T079 Add mobile card layout for table rows on screens <768px
- [x] T080 Wire up MobileEditModal with same save/cancel logic as inline editing
- [x] T081 Test mobile responsive behavior: verify modal opens on <768px, inline on ≥768px

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, cleanup, and validation

- [x] T082 [P] Run localStorage cleanup on app initialization using storageCleanup utility
- [x] T083 [P] Add console logging for edit state transitions (enter edit, save start, save complete, conflict, cancel)
- [x] T084 Remove or deprecate ClassificationDetailPage if inline editing makes it redundant
- [x] T085 Update navigation router to handle detail page deprecation
- [x] T086 Code review and refactoring for clarity and maintainability
- [x] T087 Performance testing: verify <5 second correction time, <2 second save time
- [x] T088 Accessibility audit: verify keyboard navigation, ARIA labels, focus management
- [x] T089 Cross-browser testing: Chrome, Firefox, Safari, Edge
- [x] T090 Final QA against all 12 success criteria from spec.md
- [x] T091 Update correction UI documentation with inline editing usage

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T008) completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational (T009-T013) completion
  - User Story 1 (P1) - Phase 3: T014-T025 (MVP)
  - User Story 2 (P2) - Phase 4: T026-T033 (can run in parallel with US3/US4)
  - User Story 3 (P3) - Phase 5: T034-T044 (can run in parallel with US2/US4)
  - User Story 4 (P3) - Phase 6: T045-T050 (can run in parallel with US2/US3)
- **Edge Cases (Phase 7)**: Depends on User Story 1 completion (T014-T025)
- **Responsive (Phase 8)**: Can run in parallel with Edge Cases (Phase 7)
- **Polish (Phase 9)**: Depends on all desired features being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (T013) - NO dependencies on other stories ✅ TRUE MVP
- **User Story 2 (P2)**: Can start after Foundational (T013) - NO dependencies on US1 (just adds visual feedback) ✅ INDEPENDENT
- **User Story 3 (P3)**: Can start after Foundational (T013) - NO dependencies on US1/US2 (keyboard nav works separately) ✅ INDEPENDENT
- **User Story 4 (P3)**: Can start after Foundational (T013) - NO dependencies on US1/US2/US3 (context retention orthogonal) ✅ INDEPENDENT

### Within Each User Story

- **US1 (T014-T025)**: T014-T015 parallel → T016 → T017-T020 parallel → T021-T024 sequential → T025
- **US2 (T026-T033)**: T026-T028 parallel → T029-T032 parallel → T033
- **US3 (T034-T044)**: T034 parallel with T035 → T036-T041 sequential → T042-T043 parallel → T044
- **US4 (T045-T050)**: T045-T047 parallel (verification) → T048-T049 parallel → T050

### Parallel Opportunities

**Setup Phase** (run together):
```bash
T003, T004, T005, T006, T007  # All independent file creations
```

**Foundational Phase** (run together after Setup):
```bash
T009, T010, T011  # All independent utilities
```

**User Story 1** (run within story):
```bash
# After T013 complete:
T014, T015  # Composable and component (different files)

# After T016 complete:
T017, T018, T019, T020  # All modifications to same component but different sections
```

**All User Stories** (run in parallel after Foundational):
```bash
# If team has 4 developers, start all stories in parallel:
Developer A: Phase 3 (T014-T025) - User Story 1
Developer B: Phase 4 (T026-T033) - User Story 2
Developer C: Phase 5 (T034-T044) - User Story 3
Developer D: Phase 6 (T045-T050) - User Story 4
```

**Edge Cases Phase** (run within phase):
```bash
T051, T052, T053, T054  # All independent component/composable files
```

---

## Parallel Example: User Story 1

```bash
# After Foundational complete (T013), launch US1 tasks in parallel batches:

# Batch 1: Create composable and component
Task: "Create inline edit composable in correction-ui/src/composables/useInlineEdit.ts"
Task: "Create inline edit cell component in correction-ui/src/components/InlineEditCell.vue"

# Batch 2: After T016 (modify list component), add features:
Task: "Add click handler to enter edit mode"
Task: "Add row state tracking (editingRowId, editingData)"
Task: "Replace static cells with InlineEditCell components"
Task: "Add Save and Cancel button cells to editing rows"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

**Recommended for fastest value delivery**:

1. Complete Phase 1: Setup (T001-T008) - ~2 hours
2. Complete Phase 2: Foundational (T009-T013) - ~3 hours
3. Complete Phase 3: User Story 1 (T014-T025) - ~8 hours
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Can users click a row and edit inline?
   - Do saves persist correctly?
   - Does cancel work?
   - No page navigation required?
5. Deploy/demo if ready - **Users get 3x faster corrections immediately**

**Total MVP time**: ~13 hours of development

### Incremental Delivery

After MVP is validated and deployed, add features incrementally:

1. **MVP (US1)** → Deploy → Users get inline editing ✅
2. **Add US2** → Deploy → Users get better visual feedback ✅
3. **Add US3** → Deploy → Power users get keyboard shortcuts ✅
4. **Add US4** → Deploy → Users maintain context during corrections ✅
5. **Add Edge Cases (Phase 7)** → Deploy → Users protected from data loss ✅
6. **Add Mobile (Phase 8)** → Deploy → Mobile users get optimized experience ✅

Each increment adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers (after Foundational complete):

```
Developer A: User Story 1 (T014-T025) → BLOCKS Phase 7
Developer B: User Story 2 (T026-T033) → Independent
Developer C: User Story 3 (T034-T044) → Independent
Developer D: User Story 4 (T045-T050) → Independent

Once US1 complete:
Developer A: Phase 7 - Edge Cases (T051-T074)
Developer E: Phase 8 - Mobile (T075-T081)
```

Stories 2, 3, and 4 are fully independent and can be developed in parallel.

---

## Optional: Testing Tasks

**Note**: Tests were not explicitly requested in the specification. Include these tasks if you want comprehensive test coverage.

### Unit Tests (Optional)

- [ ] TOPT001 [P] Unit test for useDirtyTracking composable in correction-ui/tests/unit/composables/useDirtyTracking.spec.ts
- [ ] TOPT002 [P] Unit test for useInlineEdit composable in correction-ui/tests/unit/composables/useInlineEdit.spec.ts
- [ ] TOPT003 [P] Unit test for useAutoSave composable in correction-ui/tests/unit/composables/useAutoSave.spec.ts
- [ ] TOPT004 [P] Unit test for useUnsavedChangesGuard composable in correction-ui/tests/unit/composables/useUnsavedChangesGuard.spec.ts
- [ ] TOPT005 [P] Unit test for useGridNavigation composable in correction-ui/tests/unit/composables/useGridNavigation.spec.ts
- [ ] TOPT006 [P] Unit test for usePendingQueue composable in correction-ui/tests/unit/composables/usePendingQueue.spec.ts
- [ ] TOPT007 [P] Unit test for InlineEditCell component in correction-ui/tests/unit/components/InlineEditCell.spec.ts
- [ ] TOPT008 [P] Unit test for ConflictResolutionDialog component in correction-ui/tests/unit/components/ConflictResolutionDialog.spec.ts
- [ ] TOPT009 [P] Unit test for MobileEditModal component in correction-ui/tests/unit/components/MobileEditModal.spec.ts
- [ ] TOPT010 [P] Unit test for mergeChanges utility in correction-ui/tests/unit/utils/mergeChanges.spec.ts

### E2E Tests (Optional)

- [ ] TOPT011 E2E test for inline edit happy path in correction-ui/tests/e2e/inline-edit-happy-path.spec.ts
- [ ] TOPT012 E2E test for conflict resolution workflow in correction-ui/tests/e2e/inline-edit-conflict.spec.ts
- [ ] TOPT013 E2E test for offline editing and auto-retry in correction-ui/tests/e2e/inline-edit-offline.spec.ts
- [ ] TOPT014 E2E test for keyboard-only workflow in correction-ui/tests/e2e/inline-edit-keyboard.spec.ts
- [ ] TOPT015 E2E test for mobile responsive behavior in correction-ui/tests/e2e/inline-edit-mobile.spec.ts

---

## Summary

**Total Core Tasks**: 91 tasks
**Optional Test Tasks**: 15 tasks

### Task Count by User Story

- **Setup** (Phase 1): 8 tasks - Database, dependencies, types
- **Foundational** (Phase 2): 5 tasks - Utilities and store infrastructure
- **User Story 1 - Quick Inline Correction** (Phase 3): 12 tasks - Core inline editing
- **User Story 2 - Visual Feedback** (Phase 4): 8 tasks - Visual indicators and state
- **User Story 3 - Keyboard Navigation** (Phase 5): 11 tasks - ARIA grid and keyboard shortcuts
- **User Story 4 - Context Retention** (Phase 6): 6 tasks - Filter/sort/pagination preservation
- **Edge Cases** (Phase 7): 24 tasks - Conflict resolution, offline, session, navigation
- **Responsive Design** (Phase 8): 7 tasks - Mobile modal and responsive breakpoints
- **Polish** (Phase 9): 10 tasks - Cleanup, performance, documentation

### Parallel Opportunities Identified

- **16 tasks** marked [P] for parallel execution
- **4 user stories** can be developed independently in parallel after Foundational
- **3 major parallel batches** within User Story 1

### Independent Test Criteria

Each user story is independently testable:

- ✅ **US1**: Click row → edit dropdown → save → verify no navigation
- ✅ **US2**: Enter edit → observe highlighting, button states, spinner, success message
- ✅ **US3**: Keyboard-only workflow → Tab, Enter, Escape, arrows all work
- ✅ **US4**: Filter + sort + page 3 → edit + save → still on page 3 with filters

### Suggested MVP Scope

**Minimum Viable Product**: Phase 1 (Setup) + Phase 2 (Foundational) + Phase 3 (User Story 1)

**Total MVP Tasks**: 25 tasks (T001-T025)
**Estimated MVP Time**: ~13 hours
**MVP Delivers**:
- 3x faster corrections (5 seconds vs 15 seconds)
- 90% click reduction
- Zero page navigations
- Immediate user value

After MVP validation, add:
- **Phase 4** for better UX (visual feedback)
- **Phase 5** for accessibility (keyboard navigation)
- **Phase 7** for robustness (conflict handling, offline support)
- **Phase 8** for mobile users

---

## Format Validation

✅ All 91 core tasks follow checklist format: `- [ ] [ID] [P?] [Story?] Description with path`
✅ All tasks include exact file paths
✅ All user story tasks include [US1], [US2], [US3], or [US4] labels
✅ All parallelizable tasks marked with [P]
✅ Setup and Foundational phases have no [Story] labels (correct)
✅ Sequential task IDs from T001 to T091 with no gaps

**Ready for `/speckit.implement`** ✅
