# Tasks: Email Classification Correction UI

**Input**: Design documents from `/specs/003-correction-ui/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not explicitly requested in spec - focusing on implementation tasks with acceptance scenario validation

**Organization**: Tasks are grouped by user story (P1, P2, P3) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md: Web application structure with `correction-ui/` as new top-level directory in repository root.

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create Vue 3 + TypeScript project with Supabase integration

- [x] T001 Create Vue 3 project with TypeScript using npm create vue@latest in correction-ui/ directory
- [x] T002 [P] Install production dependencies (@supabase/supabase-js, apexcharts, vue3-apexcharts, pinia) in correction-ui/
- [x] T003 [P] Install dev dependencies (vitest, @vue/test-utils, @testing-library/vue, msw, @playwright/test) in correction-ui/
- [x] T004 [P] Create .env.template file in correction-ui/ with VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY placeholders
- [x] T005 [P] Update .gitignore to exclude .env, node_modules, dist in correction-ui/
- [x] T006 Generate TypeScript types from Supabase schema to correction-ui/src/types/database.types.ts
- [x] T007 [P] Create directory structure: src/{components/shared,services,types,utils,stores} in correction-ui/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create Supabase client singleton in correction-ui/src/services/supabase.ts
- [x] T009 [P] Create enum constants (CATEGORIES, URGENCY_LEVELS, ACTION_TYPES) in correction-ui/src/types/enums.ts
- [x] T010 [P] Create TypeScript type definitions (Classification, Email, CorrectionLog, CorrectionPattern) in correction-ui/src/types/models.ts
- [x] T011 [P] Implement logger service with console logging in correction-ui/src/utils/logger.ts (FR-021)
- [x] T012 [P] Implement formatter utilities (formatTimestamp, formatConfidence, truncateText, formatEmailBody) in correction-ui/src/utils/formatters.ts (FR-018)
- [x] T013 Create validation service (validateClassificationEdit) in correction-ui/src/utils/validation.ts (FR-014)
- [x] T014 Implement error handler utility (handleSupabaseError) in correction-ui/src/utils/errorHandler.ts (FR-012)
- [x] T015 Configure Vue Router with 3 routes (/, /classification/:id, /analytics) in correction-ui/src/router/index.ts
- [x] T016 [P] Create base App.vue shell with router-view and navigation in correction-ui/src/App.vue
- [x] T017 [P] Create shared Dropdown component in correction-ui/src/components/shared/Dropdown.vue
- [x] T018 [P] Create shared ConfirmDialog component in correction-ui/src/components/shared/ConfirmDialog.vue (FR-020)
- [x] T019 [P] Create shared CorrectionBadge component in correction-ui/src/components/shared/CorrectionBadge.vue (FR-015)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Review and Correct Classifications (Priority: P1) 🎯 MVP

**Goal**: Provide a simple web interface where users can view recent classifications, click to see details with email content, inline edit category/urgency/action fields, and save corrections immediately to the database.

**Independent Test**: Launch UI, view list of 20 recent classifications, click an entry, edit category from SHOPPING to WORK, click Save, verify database updated and correction_logs entry created, return to list and see "corrected" badge.

### Implementation for User Story 1

- [x] T020 Create Pinia classification store with state (classifications, totalCount, currentPage, pageSize, isLoading, error) in correction-ui/src/stores/classificationStore.ts
- [x] T021 [US1] Implement listClassifications service method in correction-ui/src/services/classificationService.ts (pagination, sorting)
- [x] T022 [US1] Implement getClassification service method in correction-ui/src/services/classificationService.ts (single record with email join)
- [x] T023 [US1] Implement updateClassification service method in correction-ui/src/services/classificationService.ts (save correction, FR-004)
- [x] T024 [US1] Add fetchClassifications action to classification store in correction-ui/src/stores/classificationStore.ts
- [x] T025 [US1] Add updateClassification action to classification store in correction-ui/src/stores/classificationStore.ts
- [x] T026 [US1] Create ClassificationList component (table with columns: subject, sender, category, urgency, action, confidence, timestamp) in correction-ui/src/components/ClassificationList.vue (FR-001)
- [x] T027 [US1] Add pagination controls to ClassificationList (page size selector 20/50/100, prev/next buttons, page jump) in correction-ui/src/components/ClassificationList.vue (FR-016)
- [x] T028 [US1] Add sortable column headers to ClassificationList (click to sort asc/desc) in correction-ui/src/components/ClassificationList.vue (FR-017)
- [x] T029 [US1] Add click handler to ClassificationList rows to navigate to detail view in correction-ui/src/components/ClassificationList.vue
- [x] T030 [US1] Display CorrectionBadge for corrected classifications in ClassificationList in correction-ui/src/components/ClassificationList.vue (FR-015)
- [x] T031 [US1] Create ClassificationDetail component (email content display + edit form) in correction-ui/src/components/ClassificationDetail.vue (FR-002)
- [x] T032 [US1] Add email preview section (subject, sender, body with 2000-char truncation and Show More) to ClassificationDetail in correction-ui/src/components/ClassificationDetail.vue (FR-013)
- [x] T033 [US1] Add inline edit form with dropdowns for category, urgency, action using shared Dropdown component in correction-ui/src/components/ClassificationDetail.vue (FR-003)
- [x] T034 [US1] Add optional correction_reason text field to edit form in correction-ui/src/components/ClassificationDetail.vue (FR-019)
- [x] T035 [US1] Implement Save button handler (calls updateClassification, shows success message) in correction-ui/src/components/ClassificationDetail.vue (FR-004, FR-005)
- [x] T036 [US1] Implement Cancel button handler (navigates back to list) in correction-ui/src/components/ClassificationDetail.vue
- [x] T037 [US1] Add unsaved changes detection with ConfirmDialog before navigation in correction-ui/src/components/ClassificationDetail.vue (FR-020)
- [x] T038 [US1] Add keyboard navigation (Tab, Enter to save, Escape to cancel) to ClassificationDetail form in correction-ui/src/components/ClassificationDetail.vue (FR-022)
- [x] T039 [US1] Create list view page component connecting ClassificationList to store in correction-ui/src/views/HomePage.vue
- [x] T040 [US1] Create detail view page component connecting ClassificationDetail to store in correction-ui/src/views/ClassificationDetailPage.vue
- [x] T041 [US1] Add error display for database connection failures with retry button in correction-ui/src/components/ClassificationList.vue (FR-012)
- [x] T042 [US1] Add loading state display for ClassificationList and ClassificationDetail in respective components
- [x] T043 [US1] Add console logging for all user actions (list loaded, classification clicked, correction saved) using logger service in correction-ui/src/components/ (FR-021)

**Checkpoint**: At this point, User Story 1 (core correction workflow) should be fully functional and testable independently

**Validation (Acceptance Scenarios)**:
1. Open UI → See paginated list with 20 classifications
2. Click entry → See email content and inline edit controls
3. Change category SHOPPING→WORK → Click Save → Database updated, correction logged
4. Return to list → See "corrected" badge and updated values

---

## Phase 4: User Story 2 - Filter and Search Classifications (Priority: P2)

**Goal**: Add filtering controls to enable targeted correction sessions - filter by confidence score, date range, category, and correction status to focus on low-confidence or specific subsets.

**Independent Test**: Apply filter "confidence < 0.7" → See only low-confidence classifications. Apply filter "category = OTHER" → See only OTHER category. Apply filter "corrected = false" → See only uncorrected. Clear filters → See all.

### Implementation for User Story 2

- [x] T044 [P] [US2] Create ConfidenceSlider component (min/max range slider 0.0-1.0) in correction-ui/src/components/shared/ConfidenceSlider.vue
- [x] T045 [P] [US2] Create DateRangePicker component (from/to date pickers) in correction-ui/src/components/shared/DateRangePicker.vue
- [x] T046 [P] [US2] Create CategoryMultiSelect component (checkbox list for 6 categories) in correction-ui/src/components/shared/CategoryMultiSelect.vue
- [x] T047 [US2] Create Filters component combining all filter controls (confidence, date, category, corrected checkbox) in correction-ui/src/components/Filters.vue (FR-006)
- [x] T048 [US2] Add filters state to classification store in correction-ui/src/stores/classificationStore.ts
- [x] T049 [US2] Implement setFilters and clearFilters actions in classification store in correction-ui/src/stores/classificationStore.ts
- [x] T050 [US2] Update listClassifications service to support filter parameters (confidence, date, category, corrected) in correction-ui/src/services/classificationService.ts
- [x] T051 [US2] Update fetchClassifications action to pass filters from store to service in correction-ui/src/stores/classificationStore.ts
- [x] T052 [US2] Add Filters component to HomePage above ClassificationList in correction-ui/src/views/HomePage.vue
- [x] T053 [US2] Wire filter change events to store.setFilters with automatic re-fetch in correction-ui/src/views/HomePage.vue (FR-007)
- [x] T054 [US2] Add "Clear Filters" button that calls store.clearFilters in correction-ui/src/components/Filters.vue
- [x] T055 [US2] Update pagination to respect active filters (counts reflect filtered results) in correction-ui/src/components/ClassificationList.vue
- [x] T056 [US2] Add keyboard navigation (Tab through filters, Enter to apply) to Filters component in correction-ui/src/components/Filters.vue (FR-022)
- [x] T057 [US2] Add console logging for filter applications in correction-ui/src/components/Filters.vue (FR-021)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

**Validation (Acceptance Scenarios)**:
1. Filter by confidence < 0.7 → See only low-confidence, sorted ascending
2. Filter by category = OTHER → See only OTHER category
3. Filter by corrected = false → See only uncorrected
4. Clear filters → See all classifications

---

## Phase 5: User Story 3 - View Correction History (Priority: P3)

**Goal**: Display correction analytics including summary statistics (total corrections, correction rate %, most corrected category), correction patterns table (original→corrected frequencies), and correction timeline chart (corrections per week).

**Independent Test**: Navigate to /analytics page → See summary stats, patterns table with "SHOPPING → WORK (15 occurrences)", and line chart showing corrections over last 8 weeks. Click pattern → See example emails.

### Implementation for User Story 3

- [x] T058 [US3] Implement getCorrectionRate service method in correction-ui/src/services/analyticsService.ts
- [x] T059 [US3] Implement getCorrectionPatterns service method (aggregate correction_logs by original→corrected) in correction-ui/src/services/analyticsService.ts (FR-009)
- [x] T060 [US3] Implement getCorrectionTimeline service method (group by week/day) in correction-ui/src/services/analyticsService.ts
- [x] T061 [US3] Create Pinia analytics store with state (summary, patterns, timeline, isLoading, error) in correction-ui/src/stores/analyticsStore.ts
- [x] T062 [US3] Add fetchStatistics action to analytics store in correction-ui/src/stores/analyticsStore.ts
- [x] T063 [P] [US3] Create SummaryStats component (total corrections, correction rate %, most corrected category) in correction-ui/src/components/analytics/SummaryStats.vue
- [x] T064 [P] [US3] Create PatternsTable component (table showing original→corrected with occurrence counts) in correction-ui/src/components/analytics/PatternsTable.vue
- [x] T065 [P] [US3] Create TimelineChart component (ApexCharts line chart, corrections per week) in correction-ui/src/components/analytics/TimelineChart.vue (FR-008)
- [x] T066 [US3] Create AnalyticsDashboard component combining SummaryStats, PatternsTable, and TimelineChart in correction-ui/src/components/AnalyticsDashboard.vue
- [x] T067 [US3] Implement pattern click handler to show example emails (modal or expansion) in correction-ui/src/components/analytics/PatternsTable.vue
- [x] T068 [US3] Create analytics page component connecting AnalyticsDashboard to store in correction-ui/src/views/AnalyticsPage.vue
- [x] T069 [US3] Add navigation link to Analytics page in App.vue header/menu in correction-ui/src/App.vue
- [x] T070 [US3] Add refresh button to AnalyticsDashboard in correction-ui/src/components/AnalyticsDashboard.vue
- [x] T071 [US3] Add console logging for analytics page views and refreshes in correction-ui/src/views/AnalyticsPage.vue (FR-021)

**Checkpoint**: All user stories (P1, P2, P3) should now be independently functional

**Validation (Acceptance Scenarios)**:
1. Navigate to /analytics → See summary statistics with correction rate %
2. View patterns table → See "SHOPPING → WORK (15 occurrences)" sorted by frequency
3. View timeline chart → See corrections per week for last 8 weeks
4. Click pattern → See list of example emails with sender and subject

---

## Phase 6: User Story 4 - Package and Deploy to Unraid Server (Priority: P4)

**Goal**: Package the correction UI as a Docker container and deploy to Unraid server for always-on access from any device on the local network.

**Independent Test**: Build Docker image, deploy to Unraid with environment variables, access UI from laptop browser via http://unraid-ip:3000, verify all workflows function, restart Unraid server and verify container auto-starts.

### Implementation for User Story 4

- [ ] T072 [P] [US4] Create multi-stage Dockerfile with build stage (node:18-alpine) and serve stage (nginx:alpine) in correction-ui/Dockerfile (FR-023)
- [ ] T073 [P] [US4] Create nginx.conf for serving static files with proper MIME types and SPA routing in correction-ui/nginx.conf
- [ ] T074 [P] [US4] Create docker-compose.yml with environment variables, port mapping (3000:80), and restart policy (unless-stopped) in correction-ui/docker-compose.yml (FR-027)
- [ ] T075 [P] [US4] Create .dockerignore file excluding node_modules, .env, dist, tests in correction-ui/.dockerignore
- [ ] T076 [US4] Add Docker build script to package.json (docker:build command) in correction-ui/package.json
- [ ] T077 [US4] Test Docker image build locally (docker build -t correction-ui .) and verify build completes in under 5 minutes (SC-011)
- [ ] T078 [US4] Test Docker container run locally (docker run -p 3000:80 with env vars) and verify container starts in under 60 seconds (SC-012)
- [ ] T079 [US4] Verify production build size is under 200KB gzipped in dist/ directory after npm run build (FR-028)
- [ ] T080 [US4] Test accessing UI from localhost:3000 in browser and verify all user stories (P1-P3) function correctly
- [ ] T081 [US4] Create Unraid deployment guide in correction-ui/DEPLOYMENT.md (steps: build image, push to registry or import, configure container, set env vars)
- [ ] T082 [US4] Add health check endpoint or container health check configuration in Dockerfile (HEALTHCHECK instruction)
- [ ] T083 [US4] Test container restart (docker restart correction-ui) and verify UI comes back online within 60 seconds (SC-013)
- [ ] T084 [US4] Document Unraid-specific configuration (Community Applications, custom port mapping, environment variables) in correction-ui/DEPLOYMENT.md
- [ ] T085 [US4] Test accessing UI from mobile device on local network and verify responsive layout works (SC-014)

**Checkpoint**: Application successfully packaged as Docker container and deployable to Unraid server

**Validation (Acceptance Scenarios)**:
1. Build Docker image → Completes successfully, image size <500MB
2. Deploy to Unraid with env vars → Container starts and exposes port
3. Access from browser → UI loads and all workflows function
4. Restart Unraid → Container auto-starts and UI remains accessible

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final production readiness

- [ ] T086 [P] Add loading skeletons for list view while data fetches in correction-ui/src/components/ClassificationList.vue (SC-008 - improve first-use experience)
- [ ] T087 [P] Add empty state message when no classifications match filters in correction-ui/src/components/ClassificationList.vue
- [ ] T088 [P] Add toast notifications for success/error messages instead of inline text in correction-ui/src/components/ (SC-005 - better UX)
- [ ] T089 [P] Implement responsive layout for mobile/tablet viewing in correction-ui/src/App.vue and all page components (mobile access via Unraid, SC-014)
- [ ] T090 [P] Add dark mode toggle (optional, nice-to-have) in correction-ui/src/App.vue
- [ ] T091 Optimize initial bundle size (code-split routes, lazy load AnalyticsDashboard) in correction-ui/vite.config.ts (SC-007 - <30s startup)
- [ ] T092 Add performance monitoring console logs (page load times, query durations) in correction-ui/src/utils/logger.ts (SC-005 - validate <2s load)
- [ ] T093 [P] Create README.md with setup instructions, usage guide, and troubleshooting in correction-ui/README.md
- [ ] T094 [P] Update .env.template with comments explaining each variable and Docker usage notes in correction-ui/.env.template
- [ ] T095 Validate all 14 success criteria met (SC-001 through SC-014) with manual testing
- [ ] T096 Run quickstart.md validation end-to-end to verify setup instructions work
- [ ] T097 Add ESLint and Prettier configuration for code quality in correction-ui/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Stories (Phases 3-5)**: All depend on Foundational (Phase 2) completion
  - User stories can then proceed in parallel (if multiple developers)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 (adds filters to existing list view) but US1 must exist first
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent analytics page, no dependencies on US1/US2
- **User Story 4 (P4)**: Can start after User Stories 1-3 are complete - Packages all features for deployment

### Within Each User Story

- **User Story 1**: Store → Services → List Component → Detail Component → Pages → Integration
- **User Story 2**: Shared filter components [P] → Filters component → Store updates → Service updates → Integration with US1
- **User Story 3**: Analytics service [P] → Analytics store → Analytics components [P] → Dashboard → Page → Navigation

### Parallel Opportunities

**Phase 1 (Setup)**: T002, T003, T004, T005, T007 can all run in parallel after T001

**Phase 2 (Foundational)**: After T008, these can run in parallel:
- T009, T010, T011, T012 (types and utilities - different files)
- T016, T017, T018, T019 (shared components - different files)

**Phase 3 (US1)**: After T020-T025 (store and services), these can run in parallel:
- T026-T030 (ClassificationList - single file)
- T031-T038 (ClassificationDetail - single file)
- T039, T040 (page components - different files)

**Phase 5 (US3)**: After T061-T062 (store), these can run in parallel:
- T063, T064, T065 (analytics sub-components - different files)

**Phase 6 (Polish)**: T072, T073, T074, T075, T076, T079, T080, T083 can all run in parallel (different files)

---

## Parallel Example: User Story 1 Core Components

After foundation (T008-T019) is complete and store/services (T020-T025) are done:

```bash
# Launch list and detail components in parallel (different files):
Task: "Create ClassificationList component in correction-ui/src/components/ClassificationList.vue"
Task: "Create ClassificationDetail component in correction-ui/src/components/ClassificationDetail.vue"

# Then launch page components in parallel (different files):
Task: "Create HomePage in correction-ui/src/views/HomePage.vue"
Task: "Create ClassificationDetailPage in correction-ui/src/views/ClassificationDetailPage.vue"
```

---

## Parallel Example: User Story 3 Analytics Sub-Components

After analytics store (T061-T062) is complete:

```bash
# Launch all analytics sub-components in parallel (different files):
Task: "Create SummaryStats component in correction-ui/src/components/analytics/SummaryStats.vue"
Task: "Create PatternsTable component in correction-ui/src/components/analytics/PatternsTable.vue"
Task: "Create TimelineChart component in correction-ui/src/components/analytics/TimelineChart.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

**Recommended for initial deployment**:

1. Complete Phase 1: Setup (T001-T007) - 15 minutes
2. Complete Phase 2: Foundational (T008-T019) - 45-60 minutes
3. Complete Phase 3: User Story 1 (T020-T043) - 2-3 hours
4. **STOP and VALIDATE**: Test core correction workflow independently
   - View list of classifications ✓
   - Click entry and see email content ✓
   - Edit category/urgency/action ✓
   - Save and verify database updated ✓
   - See corrected badge on list ✓
5. Deploy locally and use for daily corrections (MVP operational!)

**Total MVP Time**: 3-4 hours

**Value Delivered**: Replaces Supabase dashboard workflow, 3-5x faster corrections

### Incremental Delivery

**After MVP is validated and operational**:

1. **Phase 1+2+3 (MVP)** → Foundation + Core correction workflow → Test locally
   - Verify: Can review, edit, and save corrections
   - Verify: Database updates and corrections logged
2. **Add Phase 4 (User Story 2)** → Filters for targeted reviews → Test independently
   - Verify: Filter by confidence < 0.7 works
   - Verify: Filter by category works
   - Verify: Clear filters works
3. **Add Phase 5 (User Story 3)** → Analytics dashboard → Test independently
   - Verify: Summary stats display
   - Verify: Patterns table shows frequencies
   - Verify: Timeline chart renders
4. **Add Phase 6 (User Story 4)** → Docker deployment to Unraid → Test from network devices
   - Verify: Docker image builds successfully
   - Verify: Container deploys to Unraid
   - Verify: Accessible from laptop, phone, tablet
   - Verify: Auto-restarts after server reboot
5. **Add Phase 7 (Polish)** → Final touches → Full system validation

**Each phase adds value without breaking previous phases**

### Parallel Team Strategy

With 2-3 developers (after Foundation complete):

1. **Team completes Setup + Foundational together** (Phases 1-2)
2. **Once Phase 2 done, split**:
   - Developer A: User Story 1 (T020-T043) - Core workflow
   - Developer B: User Story 2 (T044-T057) - Filters (depends on US1 existing, wait for T026-T030)
   - Developer C: User Story 3 (T058-T071) - Analytics (independent, can start immediately)
3. **Merge and integrate** once stories are individually tested

---

## Task Summary

**Total Tasks**: 97

**By Phase**:
- Phase 1 (Setup): 7 tasks (15 min)
- Phase 2 (Foundational): 12 tasks (45-60 min)
- Phase 3 (User Story 1 - P1): 24 tasks (2-3 hours) 🎯 MVP
- Phase 4 (User Story 2 - P2): 14 tasks (1-2 hours)
- Phase 5 (User Story 3 - P3): 14 tasks (1-2 hours)
- Phase 6 (User Story 4 - P4): 14 tasks (1-2 hours) 🐳 Docker Deployment
- Phase 7 (Polish): 12 tasks (1-2 hours)

**Parallel Opportunities**: 43 tasks marked [P] (44% can run in parallel)

**MVP Scope**: Phases 1-3 only (43 tasks, 3-4 hours)

**Full Feature with Unraid Deployment**: Phases 1-6 (71 tasks, 7-10 hours estimated)

**Complete with Polish**: All phases (97 tasks, 8-12 hours estimated)

---

## Success Criteria Validation

After implementation, verify each success criterion:

**P1-P3 Success Criteria (Core Features)**:
- **SC-001**: Time a correction - should be <30 seconds (vs 60-90 with Supabase)
- **SC-002**: Time reviewing 20 classifications - should be 10-15 minutes (vs 20-30)
- **SC-003**: Track filter usage - should be 90% of sessions
- **SC-004**: Time finding top 3 patterns - should be <2 minutes (vs 10+ with SQL)
- **SC-005**: Load list with 1,000 classifications - should be <2 seconds
- **SC-006**: Make 10 corrections - verify 100% logged in correction_logs
- **SC-007**: Start server - should be accessible in <30 seconds
- **SC-008**: Give UI to new user - 95% should complete workflow on first try
- **SC-009**: Make 100 corrections - verify zero database integrity violations
- **SC-010**: Complete workflow with keyboard only - no mouse needed

**P4 Success Criteria (Docker Deployment)**:
- **SC-011**: Build Docker image - completes in <5 minutes, image size <500MB
- **SC-012**: Deploy container to Unraid - accessible in <60 seconds
- **SC-013**: Restart Unraid server - container auto-starts and UI remains accessible
- **SC-014**: Access from phone/tablet on local network - all workflows function correctly

---

## Notes

- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story?] Description with path`
- 22 functional requirements mapped to 83 implementation tasks
- Each user story is independently completable and testable
- Foundation (Phases 1-2) must complete before any user story work begins
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Use logger service for all console logging (FR-021)
- All credentials via .env file (FR-010)

---

**Tasks ready for implementation!** Run `/speckit.implement` to execute.
