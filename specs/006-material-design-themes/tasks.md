# Tasks: Material Design 3 Theme Update

**Input**: Design documents from `/specs/006-material-design-themes/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Visual regression and accessibility tests included as part of validation phases.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths are relative to `correction-ui/` directory:
- **Theme files**: `src/assets/themes/`
- **Components**: `src/components/`
- **Views**: `src/views/`
- **Composables**: `src/composables/`
- **Tests**: `tests/e2e/`

---

## Phase 1: Setup (Token Infrastructure)

**Purpose**: Establish M3 token system and base theme files

- [x] T001 Copy tokens contract from specs/006-material-design-themes/contracts/tokens.css to correction-ui/src/assets/themes/tokens.css
- [x] T002 [P] Update correction-ui/src/assets/main.css to import tokens.css before theme files
- [x] T003 [P] Add FOUC prevention script to correction-ui/index.html inline before body

---

## Phase 2: Foundational (Light & Dark Theme Values)

**Purpose**: Core M3 color values that MUST be complete before component migration

**⚠️ CRITICAL**: No component work can begin until this phase is complete

- [x] T004 Rewrite correction-ui/src/assets/themes/light.css with M3 baseline light theme values per research.md
- [x] T005 Rewrite correction-ui/src/assets/themes/dark.css with M3 baseline dark theme values per research.md
- [x] T006 Update correction-ui/src/composables/useTheme.ts to apply 'light'/'dark' class to document.documentElement
- [x] T007 Update correction-ui/src/assets/base.css to use M3 token references for base styles

**Checkpoint**: Token system ready - theme switching works with new M3 colors

---

## Phase 3: User Story 1 - Consistent Light Mode Experience (Priority: P1) 🎯 MVP

**Goal**: Light theme follows M3 guidelines with proper surface hierarchy, text colors, and elevation patterns

**Independent Test**: View application in light mode across all pages and verify M3 color relationships and contrast

### Implementation for User Story 1

- [x] T008 [US1] Update correction-ui/src/App.vue styles to use M3 surface tokens
- [x] T009 [P] [US1] Update correction-ui/src/views/HomePage.vue styles to use M3 tokens
- [x] T010 [P] [US1] Update correction-ui/src/views/AnalyticsPage.vue styles to use M3 tokens
- [x] T011 [P] [US1] Update correction-ui/src/views/ClassificationDetailPage.vue styles to use M3 tokens
- [x] T012 [US1] Update correction-ui/src/components/ClassificationList.vue with M3 surface-container hierarchy
- [x] T013 [P] [US1] Update correction-ui/src/components/Filters.vue with M3 tokens
- [x] T014 [P] [US1] Update correction-ui/src/components/SearchInput.vue with M3 input styling
- [x] T015 [P] [US1] Update correction-ui/src/components/ColumnHeader.vue with M3 surface tokens
- [x] T016 [P] [US1] Update correction-ui/src/components/BulkActionToolbar.vue with M3 surface tokens
- [x] T017 [US1] Update correction-ui/src/components/shared/Dropdown.vue with M3 surface-container-high for elevated menus
- [x] T018 [P] [US1] Update correction-ui/src/components/shared/Toast.vue with M3 inverse surface tokens
- [x] T019 [P] [US1] Update correction-ui/src/components/shared/ConfirmDialog.vue with M3 surface-container-high
- [x] T020 [US1] Verify light mode displays correctly on HomePage, ClassificationList, and AnalyticsPage

**Checkpoint**: Light mode displays M3-compliant colors across all pages

---

## Phase 4: User Story 2 - Comfortable Dark Mode Experience (Priority: P1)

**Goal**: Dark theme uses M3 dark surface hierarchy with tonal elevation instead of shadows

**Independent Test**: Enable dark mode and verify surface colors, text contrast (WCAG AA), and tonal elevation

### Implementation for User Story 2

- [x] T021 [US2] Add .dark class-specific tonal elevation overrides to correction-ui/src/assets/themes/dark.css
- [x] T022 [P] [US2] Update correction-ui/src/components/ConflictResolutionDialog.vue for dark mode tonal elevation
- [x] T023 [P] [US2] Update correction-ui/src/components/KeyboardShortcutsModal.vue for dark mode tonal elevation
- [x] T024 [P] [US2] Update correction-ui/src/components/MobileEditModal.vue for dark mode tonal elevation
- [x] T025 [US2] Update category badge tokens in dark.css with adjusted hues per data-model.md
- [x] T026 [P] [US2] Update urgency badge tokens in dark.css with M3 semantic colors per data-model.md
- [x] T027 [US2] Update correction-ui/src/components/shared/CategoryDropdown.vue with dark-mode-aware badge colors
- [x] T028 [P] [US2] Update correction-ui/src/components/shared/CorrectionBadge.vue with dark-mode-aware badge colors
- [x] T029 [US2] Verify dark mode displays correctly with tonal elevation and proper badge contrast

**Checkpoint**: Dark mode displays M3-compliant tonal surfaces and accessible badge colors

---

## Phase 5: User Story 3 - Smooth Theme Transitions (Priority: P2)

**Goal**: Theme transitions are smooth (300ms), no FOUC, respects reduced-motion

**Independent Test**: Toggle themes and verify smooth color transitions without jarring flashes

### Implementation for User Story 3

- [x] T030 [US3] Add transition: var(--md-sys-theme-transition) to all themed elements in correction-ui/src/assets/base.css
- [x] T031 [US3] Verify FOUC prevention script in index.html applies theme class before first paint
- [x] T032 [US3] Test theme toggle button smooth transition in correction-ui/src/components/ThemeToggle.vue
- [x] T033 [US3] Verify system theme preference changes trigger smooth transitions via useTheme composable
- [x] T034 [US3] Test reduced-motion media query disables transitions per tokens.css @media rule

**Checkpoint**: Theme transitions complete in 300ms without FOUC, respecting reduced-motion

---

## Phase 6: User Story 4 - Consistent Component Styling (Priority: P2)

**Goal**: All interactive components display M3 state layers (hover, focus, pressed)

**Independent Test**: Interact with all buttons, dropdowns, inputs and verify visible state changes

### Implementation for User Story 4

- [x] T035 [US4] Add M3 state layer mixin usage to correction-ui/src/assets/base.css button styles
- [x] T036 [P] [US4] Update correction-ui/src/components/InlineEditCell.vue with M3 state layers and focus styles
- [x] T037 [P] [US4] Update correction-ui/src/components/ExpandableRowDetails.vue with M3 state layers
- [x] T038 [P] [US4] Update correction-ui/src/components/ConfidenceBar.vue with M3 styling
- [x] T039 [US4] Update correction-ui/src/components/shared/ConfidenceDropdown.vue with M3 state layers
- [x] T040 [P] [US4] Update correction-ui/src/components/shared/ConfidenceSlider.vue with M3 state layers
- [x] T041 [P] [US4] Update correction-ui/src/components/shared/DateRangePicker.vue with M3 state layers
- [x] T042 [P] [US4] Update correction-ui/src/components/shared/DateRangeDropdown.vue with M3 state layers
- [x] T043 [P] [US4] Update correction-ui/src/components/shared/CategoryMultiSelect.vue with M3 state layers
- [x] T044 [US4] Add M3 focus-visible outline styles (3dp, primary color) to all interactive elements in base.css
- [x] T045 [US4] Apply M3 shape tokens (corner-small for buttons, corner-medium for cards) throughout components
- [x] T046 [US4] Verify all interactive elements show visible hover, focus, and active states

**Checkpoint**: All interactive elements display consistent M3 state layers and focus indicators

---

## Phase 7: User Story 5 - Accessible Color Palette (Priority: P3)

**Goal**: All color combinations meet WCAG AA contrast requirements

**Independent Test**: Run Lighthouse accessibility audit to verify contrast scores

### Implementation for User Story 5

- [x] T047 [US5] Run Lighthouse accessibility audit on HomePage in light mode
- [x] T048 [P] [US5] Run Lighthouse accessibility audit on HomePage in dark mode
- [x] T049 [US5] Fix any contrast violations found in light theme tokens
- [x] T050 [P] [US5] Fix any contrast violations found in dark theme tokens
- [x] T051 [US5] Verify all 6 category badge text/background combinations meet 4.5:1 contrast ratio
- [x] T052 [US5] Verify all 3 urgency badge text/background combinations meet 4.5:1 contrast ratio
- [x] T053 [US5] Document final Lighthouse accessibility score in PR description

**Checkpoint**: Lighthouse accessibility audit scores 100 for color contrast

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Chart integration, remaining components, documentation

### Chart Integration

- [x] T054 Create correction-ui/src/composables/useChartTheme.ts for ApexCharts M3 integration
- [x] T055 [P] Update correction-ui/src/components/analytics/CategoryPieChart.vue to use M3 chart colors
- [x] T056 [P] Update correction-ui/src/components/analytics/CorrectionsChart.vue to use M3 chart colors
- [x] T057 [P] Update correction-ui/src/components/analytics/TimelineChart.vue to use M3 chart colors
- [x] T058 [P] Update correction-ui/src/components/analytics/PatternsTable.vue to use M3 tokens
- [x] T059 [P] Update correction-ui/src/components/analytics/SummaryStats.vue to use M3 tokens
- [x] T060 Update correction-ui/src/components/AnalyticsDashboard.vue to use M3 tokens

### Remaining Components

- [x] T061 [P] Update correction-ui/src/components/ClassificationDetail.vue with M3 tokens
- [x] T062 [P] Update correction-ui/src/components/InfiniteScroller.vue with M3 tokens (if styled)

### Validation

- [x] T063 Run full visual comparison: light mode before/after screenshots
- [x] T064 Run full visual comparison: dark mode before/after screenshots
- [x] T065 Verify theme persistence works correctly (localStorage)
- [x] T066 Test on Chrome, Firefox, Safari browsers
- [x] T067 Run final Lighthouse accessibility audit and document scores

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 and US2 can proceed in parallel (both P1)
  - US3 can start after US1/US2 (needs theme toggle working)
  - US4 can start after US1 (needs base styles)
  - US5 can start after US1 and US2 (needs both themes)
- **Polish (Phase 8)**: Depends on US1-US4 being complete

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US1 (Light Mode) | Phase 2 | Phase 2 complete |
| US2 (Dark Mode) | Phase 2 | Phase 2 complete |
| US3 (Transitions) | US1, US2 | US1 and US2 complete |
| US4 (Components) | US1 | US1 complete |
| US5 (Accessibility) | US1, US2 | US1 and US2 complete |

### Parallel Opportunities

Within each phase, tasks marked [P] can run in parallel:
- Phase 1: T002, T003 in parallel
- Phase 3 (US1): T009-T011, T013-T016, T018-T019 in parallel
- Phase 4 (US2): T022-T024, T026, T028 in parallel
- Phase 6 (US4): T036-T043 in parallel
- Phase 7 (US5): T048, T050 in parallel
- Phase 8: T055-T059, T061-T062 in parallel

---

## Parallel Example: User Story 1

```bash
# After T008 (App.vue) is complete, launch these in parallel:
Task: "Update correction-ui/src/views/HomePage.vue styles to use M3 tokens"
Task: "Update correction-ui/src/views/AnalyticsPage.vue styles to use M3 tokens"
Task: "Update correction-ui/src/views/ClassificationDetailPage.vue styles to use M3 tokens"

# In parallel with view updates:
Task: "Update correction-ui/src/components/Filters.vue with M3 tokens"
Task: "Update correction-ui/src/components/SearchInput.vue with M3 input styling"
Task: "Update correction-ui/src/components/ColumnHeader.vue with M3 surface tokens"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T007)
3. Complete Phase 3: User Story 1 - Light Mode (T008-T020)
4. Complete Phase 4: User Story 2 - Dark Mode (T021-T029)
5. **STOP and VALIDATE**: Both themes should now display M3 colors
6. Deploy/demo if ready - MVP complete!

### Incremental Delivery

1. Setup + Foundational → Token system ready
2. Add US1 (Light Mode) → Test light mode → Deploy (MVP milestone 1)
3. Add US2 (Dark Mode) → Test dark mode → Deploy (MVP milestone 2)
4. Add US3 (Transitions) → Test toggle → Deploy
5. Add US4 (Components) → Test interactions → Deploy
6. Add US5 (Accessibility) → Run Lighthouse → Deploy
7. Complete Polish → Final release

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Light Mode)
   - Developer B: User Story 2 (Dark Mode)
3. After US1/US2:
   - Developer A: User Story 4 (Components)
   - Developer B: User Story 3 (Transitions)
4. Either developer: User Story 5 (Accessibility audit)
5. Team: Polish phase

---

## Summary

| Phase | Task Range | Count | Description |
|-------|------------|-------|-------------|
| Setup | T001-T003 | 3 | Token infrastructure |
| Foundational | T004-T007 | 4 | Light/Dark theme values |
| US1 (P1) | T008-T020 | 13 | Light mode experience |
| US2 (P1) | T021-T029 | 9 | Dark mode experience |
| US3 (P2) | T030-T034 | 5 | Smooth transitions |
| US4 (P2) | T035-T046 | 12 | Component styling |
| US5 (P3) | T047-T053 | 7 | Accessibility |
| Polish | T054-T067 | 14 | Charts, validation |
| **Total** | | **67** | |

### MVP Scope (Recommended)

- **Minimum**: Phase 1 + Phase 2 + Phase 3 (US1) = 20 tasks
- **Recommended MVP**: Phase 1-4 (US1 + US2) = 29 tasks
- **Full Feature**: All 67 tasks

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Use migration mapping from data-model.md when updating CSS variables
- Reference quickstart.md for common patterns when implementing
