# Tasks: Instant Edit with Undo

**Input**: Design documents from `/specs/007-instant-edit-undo/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Test tasks included as part of validation in Polish phase (not TDD approach).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths are relative to `correction-ui/` directory:
- **Types**: `src/types/`
- **Composables**: `src/composables/`
- **Components**: `src/components/`
- **Tests**: `tests/unit/`, `tests/e2e/`

---

## Phase 1: Setup (Type Definitions)

**Purpose**: Create TypeScript types needed by all user stories

- [x] T001 Create undo type definitions in correction-ui/src/types/undo.ts per data-model.md (UndoChange, UndoEntry, UndoState, UndoResult)
- [x] T002 [P] Add ToastAction and ToastWithAction types to correction-ui/src/types/undo.ts per data-model.md

---

## Phase 2: Foundational (Undo Infrastructure)

**Purpose**: Core undo composable that MUST be complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create useUndo composable skeleton in correction-ui/src/composables/useUndo.ts with interface per contracts/composable-api.md
- [x] T004 Implement recordChange() function in useUndo.ts to store single UndoEntry with 30-second timer
- [x] T005 Implement executeUndo() function in useUndo.ts to restore previous values via Supabase
- [x] T006 Implement clearUndo() function in useUndo.ts for manual cleanup and timeout expiration
- [x] T007 Add canUndo computed property and timeRemaining ref to useUndo.ts
- [x] T008 Add route navigation cleanup via onUnmounted in useUndo.ts (FR-012)

**Checkpoint**: Undo infrastructure ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Instant Save on Selection (Priority: P1) 🎯 MVP

**Goal**: Changes save immediately when dropdown value selected, no confirmation dialog

**Independent Test**: Select a new value from any classification dropdown and verify the database updates immediately without additional user action

### Implementation for User Story 1

- [x] T009 [US1] Add instantSave() method to correction-ui/src/composables/useInlineEdit.ts per contracts/composable-api.md
- [x] T010 [US1] Implement optimistic UI update in instantSave() - update local state before Supabase call
- [x] T011 [US1] Implement revert logic in instantSave() for failed saves - restore previous value on error
- [x] T012 [US1] Modify correction-ui/src/components/InlineEditCell.vue to emit 'instant-save' event on dropdown change
- [x] T013 [US1] Add previousValue tracking to InlineEditCell.vue for undo support
- [x] T014 [US1] Remove 'update:value' emit and save button dependency from InlineEditCell.vue
- [x] T015 [US1] Update correction-ui/src/components/ClassificationList.vue to handle 'instant-save' event
- [x] T016 [US1] Wire handleInstantSave() in ClassificationList.vue to call useInlineEdit.instantSave()
- [x] T017 [US1] Remove Save button and unsaved changes warning from ClassificationList.vue inline edit row
- [x] T018 [US1] Remove confirmation dialog trigger from save flow in ClassificationList.vue
- [x] T019 [US1] Verify instant save works with existing optimistic locking (FR-011)

**Checkpoint**: Instant save works - changes persist immediately on dropdown selection

---

## Phase 4: User Story 2 - Undo Recent Changes (Priority: P1) 🎯 MVP

**Goal**: Users can undo changes via toast button within 30-second window

**Independent Test**: Make a change, click Undo button in toast, verify original value restored in UI and database

### Implementation for User Story 2

- [x] T020 [US2] Extend correction-ui/src/composables/useToast.ts to support action property per contracts/composable-api.md
- [x] T021 [US2] Add showWithUndo() method to useToast.ts that creates toast with Undo button (30s duration)
- [x] T022 [US2] Update correction-ui/src/components/shared/Toast.vue to render action button when toast.action exists
- [x] T023 [US2] Add handleAction() click handler in Toast.vue that calls toast.action.onClick()
- [x] T024 [US2] Style toast action button per M3 design tokens in Toast.vue (transparent bg, border, hover state)
- [x] T025 [US2] Integrate useUndo with ClassificationList.vue - call recordChange() after successful instantSave()
- [x] T026 [US2] Call showWithUndo() in ClassificationList.vue after recording change with executeUndo as callback
- [x] T027 [US2] Add undo success toast ("Change undone") after successful executeUndo() in ClassificationList.vue
- [x] T028 [US2] Add undo error handling - show error toast with retry if undo fails
- [x] T029 [US2] Verify undo clears after 30 seconds (timer expiration in useUndo.ts)

**Checkpoint**: Undo via toast works - users can revert changes within 30-second window

---

## Phase 5: User Story 3 - Visual Feedback During Save (Priority: P2)

**Goal**: Users see saving indicator, success indicator, and error messages

**Independent Test**: Make changes and observe visual feedback states (saving spinner, success checkmark, error message)

### Implementation for User Story 3

- [x] T030 [US3] Add saving state prop to InlineEditCell.vue for loading indicator
- [x] T031 [US3] Implement saving spinner in InlineEditCell.vue (small spinner next to dropdown)
- [x] T032 [US3] Add CSS animation for spinner in InlineEditCell.vue using M3 tokens
- [x] T033 [US3] Track savingField state in ClassificationList.vue to show which field is saving
- [x] T034 [US3] Pass savingField to InlineEditCell.vue to trigger spinner
- [x] T035 [US3] Add brief success highlight after save completes (green flash or checkmark)
- [x] T036 [US3] Implement error toast with retry button for failed saves in ClassificationList.vue
- [x] T037 [US3] Add retry logic that re-attempts instantSave() on retry button click

**Checkpoint**: Visual feedback works - users see saving, success, and error states

---

## Phase 6: User Story 4 - Keyboard Shortcuts for Undo (Priority: P3)

**Goal**: Power users can undo with Ctrl+Z / Cmd+Z keyboard shortcuts

**Independent Test**: Make a change, press Ctrl+Z (Windows) or Cmd+Z (Mac), verify undo occurs

### Implementation for User Story 4

- [x] T038 [US4] Add isTextInputFocused() helper function in correction-ui/src/composables/useKeyboardShortcuts.ts
- [x] T039 [US4] Register undo shortcut in useKeyboardShortcuts.ts with key='z', ctrl=true, meta=true
- [x] T040 [US4] Add 'when' condition to undo shortcut to skip when text input focused
- [x] T041 [US4] Wire undo shortcut handler to call useUndo.executeUndo() if canUndo is true
- [x] T042 [US4] Verify Ctrl+Z works on Windows/Linux and Cmd+Z works on macOS

**Checkpoint**: Keyboard undo works - power users can undo with standard shortcuts

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Testing, validation, and cleanup

### Validation

- [x] T043 Verify single-level undo: new change replaces previous undo entry
- [ ] T044 Verify bulk operation undo: multiple rows changed at once can be undone as one action
- [ ] T045 Test edge case: network unavailable during save (retry behavior)
- [ ] T046 Test edge case: rapid changes queue correctly
- [x] T047 Test edge case: navigate away clears undo state
- [x] T048 Run type-check to verify no TypeScript errors
- [x] T049 Run linter and fix any issues
- [ ] T050 Manual test: complete workflow (change → undo → change → let expire)

### Testing (if time permits)

- [ ] T051 [P] Create unit tests for useUndo composable in correction-ui/tests/unit/composables/useUndo.spec.ts
- [ ] T052 [P] Create E2E test for instant edit flow in correction-ui/tests/e2e/instant-edit.spec.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 - US1 should complete first (US2 depends on instant save working)
  - US3 (P2) and US4 (P3) can start after US1+US2
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US1 (Instant Save) | Phase 2 | Phase 2 complete |
| US2 (Undo Button) | Phase 2, partially US1 | US1 T019 complete |
| US3 (Visual Feedback) | US1 | US1 complete |
| US4 (Keyboard Undo) | US2 | US2 complete |

### Parallel Opportunities

Within each phase, tasks marked [P] can run in parallel:
- Phase 1: T001, T002 in parallel
- Phase 7: T051, T052 in parallel

---

## Parallel Example: User Story 1

```bash
# After T008 (useUndo complete), launch US1 tasks:
# T009-T011 must be sequential (building instantSave)
# Then:
Task: "Modify InlineEditCell.vue to emit 'instant-save'"  # T012
Task: "Add previousValue tracking to InlineEditCell"      # T013
# Can run in parallel since same file, but different sections
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T008)
3. Complete Phase 3: User Story 1 - Instant Save (T009-T019)
4. Complete Phase 4: User Story 2 - Undo Button (T020-T029)
5. **STOP and VALIDATE**: Both core features should work
6. Deploy/demo if ready - MVP complete!

### Incremental Delivery

1. Setup + Foundational → Undo infrastructure ready
2. Add US1 (Instant Save) → Test → Deploy (partial MVP)
3. Add US2 (Undo Button) → Test → Deploy (full MVP!)
4. Add US3 (Visual Feedback) → Test → Deploy
5. Add US4 (Keyboard Undo) → Test → Deploy
6. Complete Polish → Final release

### Single Developer Strategy

1. Complete Setup + Foundational (T001-T008)
2. Complete US1 (T009-T019) → Validate instant save works
3. Complete US2 (T020-T029) → Validate undo works → MVP done!
4. Complete US3 (T030-T037) → Enhanced UX
5. Complete US4 (T038-T042) → Power user feature
6. Complete Polish (T043-T052) → Production ready

---

## Summary

| Phase | Task Range | Count | Description |
|-------|------------|-------|-------------|
| Setup | T001-T002 | 2 | Type definitions |
| Foundational | T003-T008 | 6 | Undo composable |
| US1 (P1) | T009-T019 | 11 | Instant save |
| US2 (P1) | T020-T029 | 10 | Undo button |
| US3 (P2) | T030-T037 | 8 | Visual feedback |
| US4 (P3) | T038-T042 | 5 | Keyboard shortcut |
| Polish | T043-T052 | 10 | Validation & tests |
| **Total** | | **52** | |

### MVP Scope (Recommended)

- **Minimum**: Phase 1 + Phase 2 + Phase 3 (US1) = 19 tasks
- **Recommended MVP**: Phase 1-4 (US1 + US2) = 29 tasks
- **Full Feature**: All 52 tasks

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Use migration mapping from data-model.md when modifying components
- Reference quickstart.md for common patterns when implementing
