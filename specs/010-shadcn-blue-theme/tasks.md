# Tasks: Shadcn Blue Theme and Pagination Refactor

**Input**: Design documents from `/specs/010-shadcn-blue-theme/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No tests explicitly requested in specification. Test tasks not included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project root**: `correction-ui/`
- **Source**: `correction-ui/src/`
- **Assets**: `correction-ui/src/assets/`
- **Components**: `correction-ui/src/components/`
- **Composables**: `correction-ui/src/composables/`
- **Types**: `correction-ui/src/types/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create new directories and foundational type definitions

- [ ] T001 Create pagination component directory at `correction-ui/src/components/ui/pagination/`
- [ ] T002 [P] Create pagination type definitions in `correction-ui/src/types/pagination.ts` per contracts/pagination-component.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core CSS token infrastructure that MUST be complete before theme-specific user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Add shadcn CSS token declarations to `correction-ui/src/assets/themes/tokens.css` (--background, --foreground, --primary, --secondary, --muted, --accent, --destructive, --border, --input, --ring, --chart-1 through --chart-5)
- [ ] T004 Create M3-to-shadcn token alias mapping in `correction-ui/src/assets/themes/tokens.css` (map --md-sys-color-* to hsl(var(--shadcn-token)))

**Checkpoint**: Token infrastructure ready - theme-specific implementation can now begin

---

## Phase 3: User Story 1 - View Application in Light Mode (Priority: P1) 🎯 MVP

**Goal**: Users see the application with shadcn blue theme colors in light mode (primary blue hsl(221.2, 83.2%, 53.3%), white background)

**Independent Test**: Load application in light mode, verify primary buttons are blue (#3B82F6 equivalent), background is white, text is dark

### Implementation for User Story 1

- [ ] T005 [US1] Update light theme values in `correction-ui/src/assets/themes/light.css` with shadcn blue palette:
  - --background: 0 0% 100%
  - --foreground: 222.2 84% 4.9%
  - --primary: 221.2 83.2% 53.3%
  - --primary-foreground: 210 40% 98%
  - --secondary: 210 40% 96.1%
  - --secondary-foreground: 222.2 47.4% 11.2%
  - --muted: 210 40% 96.1%
  - --muted-foreground: 215.4 16.3% 46.9%
  - --accent: 210 40% 96.1%
  - --accent-foreground: 222.2 47.4% 11.2%
  - --destructive: 0 84.2% 60.2%
  - --destructive-foreground: 210 40% 98%
  - --border: 214.3 31.8% 91.4%
  - --input: 214.3 31.8% 91.4%
  - --ring: 221.2 83.2% 53.3%
- [ ] T006 [US1] Update M3 legacy token aliases in `correction-ui/src/assets/themes/light.css` to reference new shadcn tokens
- [ ] T007 [US1] Update category badge colors in `correction-ui/src/assets/themes/light.css` to harmonize with blue palette (adjust KIDS from purple to indigo #4F46E5)
- [ ] T008 [US1] Update urgency badge colors in `correction-ui/src/assets/themes/light.css` to maintain contrast with blue theme
- [ ] T009 [US1] Update meta theme-color value for light mode in `correction-ui/src/composables/useTheme.ts` (change #FEF7FF to #FFFFFF)

**Checkpoint**: Light mode fully functional with blue theme - can be tested independently

---

## Phase 4: User Story 2 - View Application in Dark Mode (Priority: P1)

**Goal**: Users see the application with shadcn blue theme colors in dark mode (primary blue hsl(217.2, 91.2%, 59.8%), dark background hsl(222.2, 84%, 4.9%))

**Independent Test**: Toggle to dark mode, verify background is dark blue (#030712 equivalent), text is light, primary buttons are lighter blue

### Implementation for User Story 2

- [ ] T010 [US2] Update dark theme values in `correction-ui/src/assets/themes/dark.css` with shadcn blue palette:
  - --background: 222.2 84% 4.9%
  - --foreground: 210 40% 98%
  - --primary: 217.2 91.2% 59.8%
  - --primary-foreground: 222.2 47.4% 11.2%
  - --secondary: 217.2 32.6% 17.5%
  - --secondary-foreground: 210 40% 98%
  - --muted: 217.2 32.6% 17.5%
  - --muted-foreground: 215 20.2% 65.1%
  - --accent: 217.2 32.6% 17.5%
  - --accent-foreground: 210 40% 98%
  - --destructive: 0 62.8% 30.6%
  - --destructive-foreground: 210 40% 98%
  - --border: 217.2 32.6% 17.5%
  - --input: 217.2 32.6% 17.5%
  - --ring: 224.3 76.3% 48%
- [ ] T011 [US2] Update M3 legacy token aliases in `correction-ui/src/assets/themes/dark.css` to reference new shadcn tokens
- [ ] T012 [US2] Update category badge colors in `correction-ui/src/assets/themes/dark.css` to maintain contrast in dark mode
- [ ] T013 [US2] Update urgency badge colors in `correction-ui/src/assets/themes/dark.css` to maintain contrast in dark mode
- [ ] T014 [US2] Update meta theme-color value for dark mode in `correction-ui/src/composables/useTheme.ts` (change #141218 to match new --background)

**Checkpoint**: Dark mode fully functional with blue theme - can be tested independently

---

## Phase 5: User Story 3 - Navigate Email Classifications with Pagination (Priority: P1)

**Goal**: Users can navigate large email lists using a shadcn-style pagination component with Previous/Next, page links, and ellipsis for large page counts

**Independent Test**: Load data with 10+ pages, verify Previous/Next navigation works, page number links work, ellipsis appears when needed, current page is highlighted

### Implementation for User Story 3

- [ ] T015 [US3] Implement usePagination composable in `correction-ui/src/composables/usePagination.ts` with page range calculation and ellipsis logic per research.md algorithm
- [ ] T016 [P] [US3] Create Pagination.vue root component in `correction-ui/src/components/ui/pagination/Pagination.vue` with nav element and provide/inject context
- [ ] T017 [P] [US3] Create PaginationContent.vue component in `correction-ui/src/components/ui/pagination/PaginationContent.vue` with ul wrapper
- [ ] T018 [P] [US3] Create PaginationItem.vue component in `correction-ui/src/components/ui/pagination/PaginationItem.vue` with li wrapper
- [ ] T019 [P] [US3] Create PaginationLink.vue component in `correction-ui/src/components/ui/pagination/PaginationLink.vue` with button for page numbers
- [ ] T020 [P] [US3] Create PaginationPrevious.vue component in `correction-ui/src/components/ui/pagination/PaginationPrevious.vue` with chevron icon and disabled state
- [ ] T021 [P] [US3] Create PaginationNext.vue component in `correction-ui/src/components/ui/pagination/PaginationNext.vue` with chevron icon and disabled state
- [ ] T022 [P] [US3] Create PaginationEllipsis.vue component in `correction-ui/src/components/ui/pagination/PaginationEllipsis.vue` with "..." indicator
- [ ] T023 [US3] Create barrel export in `correction-ui/src/components/ui/pagination/index.ts`
- [ ] T024 [US3] Add keyboard navigation support (Tab, Enter, Space, Arrow keys) to pagination components
- [ ] T025 [US3] Add ARIA attributes for accessibility (aria-label, aria-current, aria-disabled) per contracts/pagination-component.ts
- [ ] T026 [US3] Replace inline pagination in `correction-ui/src/components/ClassificationList.vue` with new Pagination component (lines 1404-1431, 2105-2154)
- [ ] T027 [US3] Add "Showing X-Y of Z" info display to pagination integration in ClassificationList.vue

**Checkpoint**: Pagination fully functional - can be tested independently with any multi-page dataset

---

## Phase 6: User Story 4 - Smooth Theme Transition (Priority: P2)

**Goal**: Theme switches animate smoothly over 300ms, respecting prefers-reduced-motion

**Independent Test**: Toggle theme and observe smooth color transition, enable reduced-motion and verify instant switch

### Implementation for User Story 4

- [ ] T028 [US4] Verify theme transition CSS in `correction-ui/src/assets/themes/tokens.css` works with new shadcn tokens (--md-sys-theme-transition property)
- [ ] T029 [US4] Update any hardcoded transition colors in `correction-ui/src/assets/base.css` to use new token values
- [ ] T030 [US4] Ensure reduced-motion media query disables transitions in `correction-ui/src/assets/themes/tokens.css`

**Checkpoint**: Theme transitions work smoothly - visual polish complete

---

## Phase 7: User Story 5 - View Charts with Theme-Appropriate Colors (Priority: P2)

**Goal**: Analytics charts use the new shadcn chart colors (chart-1 through chart-5) and update when theme changes

**Independent Test**: Navigate to analytics page, verify chart colors match specification, toggle theme and verify charts update

### Implementation for User Story 5

- [ ] T031 [US5] Add chart color tokens to `correction-ui/src/assets/themes/light.css`:
  - --chart-1: 12 76% 61%
  - --chart-2: 173 58% 39%
  - --chart-3: 197 37% 24%
  - --chart-4: 43 74% 66%
  - --chart-5: 27 87% 67%
- [ ] T032 [US5] Add chart color tokens to `correction-ui/src/assets/themes/dark.css`:
  - --chart-1: 220 70% 50%
  - --chart-2: 160 60% 45%
  - --chart-3: 30 80% 55%
  - --chart-4: 280 65% 60%
  - --chart-5: 340 75% 55%
- [ ] T033 [US5] Update `correction-ui/src/composables/useChartTheme.ts` to read chart colors from new CSS variables (--chart-1 through --chart-5)
- [ ] T034 [US5] Update chartColors computed property in useChartTheme.ts to use hsl() function with new token values
- [ ] T035 [US5] Update getSemanticColors() and getTrendColors() in useChartTheme.ts to use new color tokens

**Checkpoint**: Charts display correctly in both themes - analytics feature complete

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and verification

- [ ] T036 [P] Verify WCAG AA contrast ratios (4.5:1) for all text/background combinations using browser dev tools
- [ ] T037 [P] Remove any unused M3 color variables from theme files (cleanup)
- [ ] T038 [P] Add JSDoc comments to usePagination.ts and pagination components
- [ ] T039 Run full application test: verify all pages render correctly in both themes
- [ ] T040 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational (Phase 2)
  - US1 and US2 are theme-related and can run in parallel
  - US3 (pagination) is independent of theme stories
  - US4 (transitions) depends on US1 and US2 completion
  - US5 (charts) depends on US1 and US2 completion
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational - tokens.css)
    │
    ├───────────┬───────────┬───────────┐
    ▼           ▼           ▼           │
US1 (Light)  US2 (Dark)  US3 (Pagination) │
    │           │                       │
    └─────┬─────┘                       │
          │                             │
          ├────────────────────────────►│
          │                             │
    ┌─────┴─────┐                       │
    ▼           ▼                       ▼
US4 (Trans.) US5 (Charts)          Phase 8 (Polish)
```

### Within Each User Story

- CSS token updates before component updates
- Composable before components (for US3)
- Core implementation before integration
- Accessibility last (builds on functional implementation)

### Parallel Opportunities

**Phase 1**:
- T001 and T002 can run in parallel

**Phase 3 (US3 - Pagination)**:
- T016, T017, T018, T019, T020, T021, T022 can ALL run in parallel (different files)

**Phase 8 (Polish)**:
- T036, T037, T038 can run in parallel

---

## Parallel Example: User Story 3 (Pagination)

```bash
# After T015 (usePagination composable) completes, launch all component creation in parallel:
Task: "T016 [P] [US3] Create Pagination.vue in correction-ui/src/components/ui/pagination/Pagination.vue"
Task: "T017 [P] [US3] Create PaginationContent.vue in correction-ui/src/components/ui/pagination/PaginationContent.vue"
Task: "T018 [P] [US3] Create PaginationItem.vue in correction-ui/src/components/ui/pagination/PaginationItem.vue"
Task: "T019 [P] [US3] Create PaginationLink.vue in correction-ui/src/components/ui/pagination/PaginationLink.vue"
Task: "T020 [P] [US3] Create PaginationPrevious.vue in correction-ui/src/components/ui/pagination/PaginationPrevious.vue"
Task: "T021 [P] [US3] Create PaginationNext.vue in correction-ui/src/components/ui/pagination/PaginationNext.vue"
Task: "T022 [P] [US3] Create PaginationEllipsis.vue in correction-ui/src/components/ui/pagination/PaginationEllipsis.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T004)
3. Complete Phase 3: User Story 1 - Light Mode (T005-T009)
4. **STOP and VALIDATE**: Load app in light mode, verify blue theme
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Token infrastructure ready
2. US1 (Light Mode) → Test independently → Demo MVP
3. US2 (Dark Mode) → Test independently → Full theme support
4. US3 (Pagination) → Test independently → Enhanced navigation
5. US4 (Transitions) → Test with theme toggle → Polish
6. US5 (Charts) → Test on analytics page → Complete

### Suggested Execution Order

For a single developer working sequentially:

1. **T001-T004**: Setup + Foundational (infrastructure)
2. **T005-T009**: US1 Light Mode (first visual validation)
3. **T010-T014**: US2 Dark Mode (complete theme)
4. **T015-T027**: US3 Pagination (new functionality)
5. **T028-T030**: US4 Transitions (polish)
6. **T031-T035**: US5 Charts (complete feature)
7. **T036-T040**: Polish (final validation)

---

## Summary

| Phase | Tasks | Parallel Tasks | Story |
|-------|-------|----------------|-------|
| Setup | 2 | 1 | - |
| Foundational | 2 | 0 | - |
| US1 Light Mode | 5 | 0 | P1 |
| US2 Dark Mode | 5 | 0 | P1 |
| US3 Pagination | 13 | 7 | P1 |
| US4 Transitions | 3 | 0 | P2 |
| US5 Charts | 5 | 0 | P2 |
| Polish | 5 | 3 | - |
| **Total** | **40** | **11** | - |

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable once complete
- Theme stories (US1, US2) should be done together for consistent experience
- Pagination (US3) is completely independent of theme work
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
