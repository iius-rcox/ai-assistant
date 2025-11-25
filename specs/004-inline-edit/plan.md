# Implementation Plan: Inline Table Editing for Corrections

**Branch**: `004-inline-edit` | **Date**: 2025-11-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-inline-edit/spec.md`

## Summary

Transform the correction UI table from navigation-based editing (click → navigate to detail page → edit → save → back) to inline editing where users can edit classification fields directly within the table row. This reduces correction time from 15+ seconds to under 5 seconds by eliminating page navigations and providing immediate visual feedback.

**Key Technical Approach**:
- Pinia store with composable-based edit state management
- Optimistic locking using database version column for conflict detection
- VueUse-powered offline resilience with localStorage auto-save
- Responsive design: inline editing on desktop (≥768px), modal on mobile (<768px)
- ARIA grid pattern for keyboard accessibility

## Technical Context

**Language/Version**: TypeScript 5.6+ with Vue 3.4+ (ES2022 target)
**Primary Dependencies**: Vue 3.5+, Pinia 2.2+, Supabase JS 2.45+, VueUse 11+, Vite 5.4+
**Storage**: Supabase PostgreSQL (project: xmziovusqlmgygcrgyqt) with localStorage for offline drafts
**Testing**: Vitest for unit tests, Playwright for E2E, manual testing for offline/conflict scenarios
**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Single-page web application (Vue 3 SPA)
**Performance Goals**: <5 seconds end-to-end correction time, <2 seconds save operation, 60fps UI updates
**Constraints**: Offline-capable (localStorage), <768px mobile responsive, WCAG 2.1 AA keyboard accessibility
**Scale/Scope**: ~10 Vue components, 6 composables, 1 database migration, ~2000 LOC TypeScript/Vue

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **User-First Design**: Feature delivers measurable user value (90% click reduction, 3x faster corrections) with clear acceptance criteria in spec
- [x] **Test-Driven Development**: Test strategy defined in quickstart.md - unit tests for composables/components, E2E for user workflows, manual for offline/conflicts
- [x] **Modular Architecture**: Components properly separated (Pinia store for global state, composables for reusable logic, components for UI)
- [x] **Progressive Enhancement**: MVP defined as P1 (basic inline editing), with P2 (visual feedback) and P3 (keyboard nav, mobile modal) as incremental enhancements
- [x] **Observable Systems**: Console logging for edit state transitions, localStorage for offline persistence, browser devtools for debugging
- [x] **Security by Design**: Optimistic locking prevents data loss from concurrent edits, beforeunload prevents accidental navigation, session recovery for auth expiration
- [x] **Documentation as Code**: Complete documentation in specs/004-inline-edit/ including research.md, data-model.md, contracts/, quickstart.md

**Note**: This is a frontend-only feature for the correction UI. The n8n-native architecture principle from the constitution applies to workflow features, not UI components.

## Project Structure

### Documentation (this feature)

```text
specs/004-inline-edit/
├── plan.md                    # This file (/speckit.plan output)
├── spec.md                    # Feature specification (user requirements)
├── research.md                # Phase 0: Technical research on patterns
├── data-model.md              # Phase 1: Data structures and state model
├── quickstart.md              # Phase 1: Developer setup guide
├── contracts/
│   └── supabase-rpc.md        # Phase 1: Supabase query patterns
└── checklists/
    └── requirements.md        # Specification quality validation
```

### Source Code (correction-ui/)

```text
correction-ui/
├── src/
│   ├── components/
│   │   ├── ClassificationList.vue          # MODIFY: Add inline edit mode
│   │   ├── InlineEditCell.vue              # NEW: Editable table cell component
│   │   ├── ConflictResolutionDialog.vue    # NEW: Version conflict resolution UI
│   │   ├── MobileEditModal.vue             # NEW: Mobile edit modal (<768px)
│   │   └── shared/
│   │       ├── Dropdown.vue                # EXISTS: Reuse for inline dropdowns
│   │       └── ConfirmDialog.vue           # EXISTS: Reuse for unsaved changes
│   ├── composables/
│   │   ├── useInlineEdit.ts                # NEW: Inline edit state management
│   │   ├── useDirtyTracking.ts             # NEW: Dirty field detection
│   │   ├── useAutoSave.ts                  # NEW: localStorage auto-save
│   │   ├── useUnsavedChangesGuard.ts       # NEW: beforeunload + router guard
│   │   └── useGridNavigation.ts            # NEW: ARIA grid keyboard nav
│   ├── stores/
│   │   └── classificationStore.ts          # MODIFY: Add inline edit state
│   ├── types/
│   │   ├── models.ts                       # MODIFY: Add version to Classification
│   │   ├── inline-edit.ts                  # NEW: Inline edit types
│   │   └── storage.ts                      # NEW: localStorage schemas
│   ├── utils/
│   │   ├── mergeChanges.ts                 # NEW: 3-way merge for conflicts
│   │   ├── storageCleanup.ts               # NEW: Stale draft cleanup
│   │   └── validation.ts                   # MODIFY: Add inline edit validation
│   └── constants/
│       └── storage.ts                      # NEW: localStorage key naming
├── tests/
│   ├── unit/
│   │   ├── composables/                    # NEW: Composable unit tests
│   │   └── components/                     # NEW: Component unit tests
│   └── e2e/
│       └── inline-edit.spec.ts             # NEW: E2E test suite
└── supabase/
    └── migrations/
        └── 20251123_add_version_column.sql # NEW: Database migration
```

**Structure Decision**: Single-page web application structure (Option 2 from template) with frontend-only changes. The correction-ui is an existing Vue 3 + Vite application located in the `correction-ui/` directory. No backend changes are required; all modifications are client-side with Supabase as the database backend.

## Complexity Tracking

> **No Constitution violations** - This feature uses standard Vue 3 patterns with Pinia for state management, composables for reusable logic, and VueUse for utilities. The approach follows Vue ecosystem best practices and requires no custom framework abstractions.

## Phase 0: Research ✅

**Completed**: 2025-11-23

**Artifacts Created**:
- `research.md` - Technical research on 6 key patterns for inline table editing

**Key Decisions**:

1. **State Management**: Pinia store + composables (store for global data, composables for transient edit state)
2. **Optimistic Locking**: Version column with trigger-based auto-increment (prevents concurrent edit conflicts)
3. **Offline Resilience**: VueUse useLocalStorage with namespaced keys and 24-hour TTL (auto-save during network loss)
4. **beforeunload Warning**: Dual guard pattern (both `beforeunload` event and Vue Router guard)
5. **Responsive Design**: Stacked cards <768px with modal for edits, inline editing ≥768px
6. **Keyboard Navigation**: ARIA grid pattern with two modes (navigation mode for arrows, edit mode for input)

## Phase 1: Design & Contracts ✅

**Completed**: 2025-11-23

**Artifacts Created**:

1. **data-model.md** - Complete data model including:
   - Database schema changes (version column migration)
   - Pinia store structure with inline edit state
   - localStorage schemas (draft edits, pending queue, preferences, session state)
   - TypeScript type definitions (17 types covering all aspects)
   - State transition diagram (idle → editing → saving → success/error/conflict)
   - Validation rules for editable fields

2. **contracts/supabase-rpc.md** - Supabase query patterns including:
   - Optimistic update with version check
   - Conflict detection and resolution
   - Batch operations for offline queue processing
   - Complete TypeScript service implementation
   - Vue composable integration examples

3. **quickstart.md** - Developer guide with:
   - Prerequisites and dependency versions
   - Database migration SQL script
   - Development setup instructions
   - 11 new files and 4 files to modify
   - Testing guide (unit, manual, E2E)
   - 6 common code patterns as quick reference

## Phase 2: Task Generation

**Status**: Ready for `/speckit.tasks`

The implementation plan is complete with all technical decisions documented. The next step is to run `/speckit.tasks` to generate the dependency-ordered task list for implementation.

**Suggested Task Breakdown** (will be formalized in tasks.md):

1. **Database Layer** (T001-T003):
   - Add version column migration
   - Create database trigger for auto-increment
   - Regenerate TypeScript types

2. **Type Definitions** (T004-T006):
   - Add version to Classification type
   - Create inline edit types
   - Create storage types

3. **Pinia Store** (T007-T009):
   - Add inline edit state to store
   - Implement edit actions
   - Add conflict resolution state

4. **Core Composables** (T010-T015):
   - useInlineEdit with save/cancel/conflict handling
   - useDirtyTracking for change detection
   - useAutoSave with VueUse localStorage
   - useUnsavedChangesGuard with dual pattern
   - useGridNavigation for keyboard
   - usePendingQueue for offline submissions

5. **UI Components** (T016-T022):
   - InlineEditCell for editable fields
   - ConflictResolutionDialog for version conflicts
   - MobileEditModal for mobile edits
   - Modify ClassificationList for inline mode
   - Update ClassificationDetail (deprecate or repurpose)
   - Add keyboard navigation bindings
   - Add responsive breakpoints

6. **Utilities** (T023-T025):
   - mergeChanges for conflict resolution
   - storageCleanup for stale draft removal
   - Update validation for inline edits

7. **Testing** (T026-T030):
   - Unit tests for all composables
   - Unit tests for new components
   - E2E tests for happy path
   - E2E tests for offline scenario
   - E2E tests for conflict resolution

8. **Integration** (T031-T033):
   - Wire up all components
   - Test responsive breakpoints
   - Final QA against success criteria

## Technical Debt & Future Enhancements

**Known Limitations**:
- beforeunload custom messages are ignored by modern browsers (shows generic browser dialog)
- localStorage has 5MB limit (sufficient for correction UI but should monitor usage)
- No server-sent events for real-time conflict notification (conflicts detected on save only)

**Future Enhancements** (out of scope for MVP):
- WebSocket-based real-time conflict notifications
- IndexedDB for larger offline queue capacity
- Optimistic UI updates (show success before server confirms)
- Undo/redo for inline edits
- Bulk inline editing (multi-select + batch edit)

## Success Metrics

The feature will be considered successful when:

- **SC-001**: Users complete corrections in <5 seconds (measured via analytics)
- **SC-002**: 90% reduction in clicks (1 enter + 1 save vs 3+ with navigation)
- **SC-003**: Zero page navigations for single correction (no router.push calls)
- **SC-004**: 10 classifications corrected in <2 minutes (manual test)
- **SC-005**: Save operations <2 seconds with visual feedback (network waterfall)
- **SC-006**: Zero data loss from navigation (beforeunload prevents, localStorage recovers)
- **SC-007**: 100% table context preserved (filters, sort, page maintained after save)
- **SC-008**: Keyboard-only workflow complete (manual accessibility test)
- **SC-009**: Zero concurrent edit data loss (version conflict detected, user resolves)
- **SC-010**: Zero network interruption data loss (localStorage persists, auto-retry works)
- **SC-011**: Zero session expiration data loss (localStorage preserves, restores after auth)
- **SC-012**: Mobile users complete corrections (modal provides touch-friendly experience)

## References

- [Feature Specification](spec.md)
- [Technical Research](research.md)
- [Data Model](data-model.md)
- [API Contracts](contracts/supabase-rpc.md)
- [Quickstart Guide](quickstart.md)
- [Project Constitution](../../.specify/memory/constitution.md)
