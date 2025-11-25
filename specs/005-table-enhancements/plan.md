# Implementation Plan: Email Classifications Table Enhancements

**Branch**: `005-table-enhancements` | **Date**: 2025-11-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-table-enhancements/spec.md`

## Summary

Comprehensive table enhancements for the Email Classifications page including real-time search (client-side <1,000 rows, Supabase full-text for ≥1,000), sortable/resizable columns, bulk actions with multi-select, expandable row details with correction history, keyboard shortcuts, visual confidence indicators (progress bars with accessibility patterns), infinite scrolling with pagination toggle, dark/light mode toggle, responsive card-based mobile layout, and analytics dashboard enhancements. Target scale: 36,500 rows maximum.

## Technical Context

**Language/Version**: TypeScript 5.6+ with Vue 3.5+ (ES2022 target)
**Primary Dependencies**: Vue 3.5+, Pinia 2.2+, Supabase JS 2.45+, VueUse 11+, ApexCharts 3.54+, Vite 5.4+
**Storage**: Supabase PostgreSQL (project: xmziovusqlmgygcrgyqt) with localStorage for user preferences
**Testing**: Vitest (unit), Vue Test Utils (component), Playwright (e2e)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge) with mobile support (320px+)
**Project Type**: Web application (Vue 3 SPA frontend with Supabase backend)
**Performance Goals**: Page load <2s, search <300ms, drill-down <1s
**Constraints**: WCAG AA accessibility, offline-capable drafts (existing from 004), max 36,500 rows
**Scale/Scope**: 36,500 classifications, single user (no role restrictions), 11 feature areas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **User-First Design**: Feature delivers measurable user value with clear acceptance criteria
  - 11 user stories with prioritized acceptance scenarios
  - 12 measurable success criteria (SC-001 to SC-012)
  - Clear "why this priority" justifications for each story

- [x] **Test-Driven Development**: Test strategy defined with test-first approach planned
  - Each user story has "Independent Test" section
  - Acceptance scenarios provide Given/When/Then test cases
  - Vitest + Vue Test Utils + Playwright testing stack defined

- [x] **Modular Architecture**: Components properly separated with clear interfaces
  - Extends existing 003-correction-ui and 004-inline-edit architecture
  - Feature-specific composables (useSearch, useSort, useBulkActions, etc.)
  - Reusable components (ConfidenceBar, ExpandableRow, BulkActionToolbar)

- [x] **Progressive Enhancement**: MVP defined with incremental delivery path
  - P1 (Must Have): Search, Sorting - foundational features
  - P2 (Should Have): Bulk actions, Expandable rows, Keyboard, Confidence indicators
  - P3 (Nice to Have): Infinite scroll, Resize, Theme, Responsive, Analytics

- [x] **Observable Systems**: Logging and monitoring strategy defined
  - Extends existing logger utility from 004-inline-edit
  - Search/filter analytics tracking for performance metrics
  - Error logging for bulk action failures

- [x] **Security by Design**: Security considerations identified and addressed
  - No role restrictions needed (single-user personal system)
  - Supabase RLS policies from existing implementation
  - No new credential requirements

- [x] **Documentation as Code**: Documentation plan included in implementation
  - Keyboard shortcut help modal (FR-022)
  - Component documentation in code comments
  - Spec-kit artifacts maintained

## Project Structure

### Documentation (this feature)

```text
specs/005-table-enhancements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
correction-ui/
├── src/
│   ├── components/
│   │   ├── ClassificationList.vue      # Enhanced with search, sort, bulk, expand
│   │   ├── ConfidenceBar.vue           # NEW: Visual confidence indicator
│   │   ├── ExpandableRowDetails.vue    # NEW: Email preview + correction history
│   │   ├── BulkActionToolbar.vue       # NEW: Multi-select action bar
│   │   ├── SearchInput.vue             # NEW: Debounced search with clear
│   │   ├── ColumnHeader.vue            # NEW: Sortable, resizable header
│   │   ├── KeyboardShortcutsModal.vue  # NEW: Help modal for shortcuts
│   │   ├── ThemeToggle.vue             # NEW: Dark/light mode switch
│   │   ├── InfiniteScroller.vue        # NEW: Virtual scrolling container
│   │   └── shared/
│   │       └── CategoryDropdown.vue    # Existing, extended for bulk
│   ├── composables/
│   │   ├── useSearch.ts                # NEW: Search logic + caching
│   │   ├── useSort.ts                  # NEW: Column sorting + persistence
│   │   ├── useBulkActions.ts           # NEW: Multi-select + batch operations
│   │   ├── useExpandableRows.ts        # NEW: Expand/collapse state
│   │   ├── useKeyboardNavigation.ts    # NEW: Table keyboard shortcuts
│   │   ├── useColumnResize.ts          # NEW: Drag resize + persistence
│   │   ├── useTheme.ts                 # NEW: Dark/light mode + system pref
│   │   ├── useInfiniteScroll.ts        # NEW: Pagination/scroll toggle
│   │   └── useAutoSave.ts              # Existing from 004
│   ├── services/
│   │   ├── classificationService.ts    # Extended for bulk operations
│   │   ├── searchService.ts            # NEW: Client/server search logic
│   │   └── analyticsService.ts         # Extended for new charts
│   ├── stores/
│   │   └── classificationStore.ts      # Extended for search/sort/bulk state
│   ├── types/
│   │   ├── database.types.ts           # Existing
│   │   └── table-enhancements.ts       # NEW: Search, sort, bulk types
│   ├── constants/
│   │   └── table.ts                    # NEW: Column definitions, shortcuts
│   └── assets/
│       └── themes/                     # NEW: Dark/light CSS variables
└── tests/
    ├── unit/
    │   ├── composables/                # Composable unit tests
    │   └── services/                   # Service unit tests
    ├── component/
    │   └── table/                      # Component tests
    └── e2e/
        └── table-enhancements.spec.ts  # E2E tests for all features
```

**Structure Decision**: Extends existing `correction-ui` Vue 3 application structure. New components follow established patterns from 003-correction-ui and 004-inline-edit. Feature-specific composables encapsulate logic for each enhancement area.

## Complexity Tracking

> No Constitution violations requiring justification. All features use approved technologies:
> - Vue 3 + TypeScript (approved frontend stack)
> - Supabase (approved storage)
> - VueUse (approved composables library)
> - ApexCharts (existing analytics implementation)
> - No n8n workflow changes required (frontend-only feature)
