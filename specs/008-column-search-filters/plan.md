# Implementation Plan: Column Search Filters

**Branch**: `008-column-search-filters` | **Date**: 2025-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-column-search-filters/spec.md`

## Summary

Add column-level text search filters to the email classifications table, enabling users to filter by Subject, Sender, Category, Urgency, and Action columns individually or in combination. Also increase the default pagination from 20 to 50 rows per page. This enhances the existing table with inline filtering capabilities using client-side filtering consistent with the existing global search implementation.

## Technical Context

**Language/Version**: TypeScript 5.9+ with Vue 3.5+ (ES2022 target)
**Primary Dependencies**: Vue 3.5, Pinia 3.0, VueUse 11.3, Vite 7.1
**Storage**: localStorage for filter persistence (optional), Supabase PostgreSQL for data
**Testing**: Vitest for unit tests, Playwright for e2e tests
**Target Platform**: Web (modern browsers), responsive 320px-2560px
**Project Type**: Web application (Vue SPA)
**Performance Goals**: <500ms filter response time, smooth filtering on 1000+ rows
**Constraints**: Client-side filtering only, debounce 300ms, mobile touch targets 44x44px
**Scale/Scope**: 5 filterable columns, existing ~50 classifications, designed for 1000+

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **User-First Design**: Feature delivers measurable user value with clear acceptance criteria
  - Enables quick column-level filtering for improved data discovery
  - Acceptance criteria defined in spec user stories 1-4
- [x] **Test-Driven Development**: Test strategy defined with test-first approach planned
  - Unit tests for useColumnFilters composable
  - Component tests for ColumnSearchInput
  - E2e tests for multi-column filtering
- [x] **Modular Architecture**: Components properly separated with clear interfaces
  - New ColumnSearchInput component (reusable)
  - New useColumnFilters composable (separation of concerns)
  - Integration with existing useSearch composable
- [x] **Progressive Enhancement**: MVP defined with incremental delivery path
  - MVP: Single column filtering + 50-row default
  - Enhancement: Multi-column filtering
  - Enhancement: Visual indicators
  - Enhancement: Filter persistence
- [x] **Observable Systems**: Logging and monitoring strategy defined
  - Existing logAction/logInfo utilities will be used
  - Filter changes logged for debugging
- [x] **Security by Design**: Security considerations identified and addressed
  - Input sanitization (escape special characters)
  - No server-side queries exposed (client-side only)
- [x] **Documentation as Code**: Documentation plan included in implementation
  - JSDoc comments on composable and component
  - Feature comment headers per project convention

## Project Structure

### Documentation (this feature)

```text
specs/008-column-search-filters/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
correction-ui/
├── src/
│   ├── components/
│   │   ├── ClassificationList.vue     # MODIFY: Add column filter row to table
│   │   ├── ColumnSearchInput.vue      # NEW: Compact search input for columns
│   │   └── SearchInput.vue            # REFERENCE: Existing global search
│   ├── composables/
│   │   ├── useColumnFilters.ts        # NEW: Column filter state management
│   │   └── useSearch.ts               # REFERENCE: Existing search composable
│   ├── constants/
│   │   └── table.ts                   # MODIFY: Add column filter config, update DEFAULT_PAGE_SIZE
│   ├── stores/
│   │   └── classificationStore.ts     # MODIFY: Update default pageSize to 50
│   └── types/
│       └── table-enhancements.ts      # MODIFY: Add ColumnFilterState type
└── tests/
    ├── unit/
    │   └── composables/
    │       └── useColumnFilters.spec.ts  # NEW: Composable unit tests
    └── e2e/
        └── column-filters.spec.ts     # NEW: E2e filter tests
```

**Structure Decision**: Web application using existing Vue SPA structure. New components follow existing patterns in `src/components/`, composables in `src/composables/`. This feature extends the existing table enhancement architecture from 005-table-enhancements.

## Complexity Tracking

> No Constitution violations. All requirements achievable with standard Vue patterns.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | No violations | N/A |
