# Implementation Plan: Shadcn Blue Theme and Pagination Refactor

**Branch**: `010-shadcn-blue-theme` | **Date**: 2025-11-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-shadcn-blue-theme/spec.md`

## Summary

Refactor the correction-ui frontend to use the shadcn blue theme color palette, replacing the current Material Design 3 purple palette. Additionally, implement a reusable shadcn-style Pagination component with Vue 3 to replace the existing inline pagination in ClassificationList.vue.

**Technical Approach**:
1. Layer shadcn HSL-based CSS tokens over existing M3 token system with backward-compatible aliases
2. Create compound Vue 3 Pagination component following shadcn patterns (PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis)
3. Implement usePagination composable for page range calculation with ellipsis support

## Technical Context

**Language/Version**: TypeScript 5.9+ with Vue 3.5+ (ES2022 target)
**Primary Dependencies**: Vue 3.5.22, Pinia 3.0.3, @vueuse/core 11.3.0, ApexCharts 5.3.6, Vite 7.1.11
**Storage**: localStorage (theme preference persistence), no database changes
**Testing**: Vitest for unit tests, Playwright for E2E tests
**Target Platform**: Modern browsers (Chrome 90+, Firefox 90+, Safari 14+, Edge 90+)
**Project Type**: Web application (frontend only for this feature)
**Performance Goals**: Theme transitions complete within 300ms, no layout shift during theme change
**Constraints**: WCAG AA color contrast compliance (4.5:1 for normal text), keyboard accessible pagination
**Scale/Scope**: Single frontend application, approximately 70 Vue components affected by theme

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **User-First Design**: Feature delivers measurable user value with clear acceptance criteria
  - Blue theme provides modern, professional appearance
  - Pagination improves navigation efficiency (2 clicks to any page)
- [x] **Test-Driven Development**: Test strategy defined with test-first approach planned
  - Vitest unit tests for usePagination composable
  - Playwright E2E tests for theme switching and pagination navigation
- [x] **Modular Architecture**: Components properly separated with clear interfaces
  - Compound Pagination component with clear prop/event interfaces
  - CSS tokens isolated in dedicated files
- [x] **Progressive Enhancement**: MVP defined with incremental delivery path
  - MVP: Theme colors + basic pagination
  - Enhancement: Keyboard navigation, ellipsis, accessibility
- [x] **Observable Systems**: Logging and monitoring strategy defined
  - Theme changes logged via existing logAction utility
  - Pagination events tracked for analytics
- [x] **Security by Design**: Security considerations identified and addressed
  - No user data involved; purely presentational
  - Theme preference stored in localStorage (non-sensitive)
- [x] **Documentation as Code**: Documentation plan included in implementation
  - research.md, data-model.md, quickstart.md generated
  - Component JSDoc comments for API documentation

**N/A for this feature:**
- n8n-Native Architecture: This is a frontend-only feature, no n8n workflows involved
- Memory-Driven Learning: No AI/vector store components

## Project Structure

### Documentation (this feature)

```text
specs/010-shadcn-blue-theme/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Research findings
├── data-model.md        # Phase 1: Data model and interfaces
├── quickstart.md        # Phase 1: Implementation guide
├── contracts/           # Phase 1: API contracts
│   ├── pagination-component.ts
│   └── css-tokens.css
├── checklists/          # Validation checklists
│   └── requirements.md
└── tasks.md             # Phase 2: Implementation tasks (created by /speckit.tasks)
```

### Source Code (repository root)

```text
correction-ui/
├── src/
│   ├── assets/
│   │   ├── main.css                    # Import orchestration (no changes)
│   │   ├── base.css                    # Base styles (update color references)
│   │   └── themes/
│   │       ├── tokens.css              # UPDATE: Add shadcn token declarations
│   │       ├── light.css               # UPDATE: Shadcn blue light theme values
│   │       └── dark.css                # UPDATE: Shadcn blue dark theme values
│   ├── components/
│   │   ├── ui/
│   │   │   └── pagination/             # NEW: Pagination component suite
│   │   │       ├── Pagination.vue
│   │   │       ├── PaginationContent.vue
│   │   │       ├── PaginationItem.vue
│   │   │       ├── PaginationLink.vue
│   │   │       ├── PaginationPrevious.vue
│   │   │       ├── PaginationNext.vue
│   │   │       ├── PaginationEllipsis.vue
│   │   │       └── index.ts
│   │   ├── ClassificationList.vue      # UPDATE: Replace inline pagination
│   │   └── shared/                     # Existing shared components (no changes)
│   ├── composables/
│   │   ├── usePagination.ts            # NEW: Page range calculation
│   │   ├── useTheme.ts                 # UPDATE: Meta theme-color values
│   │   └── useChartTheme.ts            # UPDATE: New chart color variables
│   └── types/
│       └── pagination.ts               # NEW: Pagination type definitions
└── tests/
    ├── unit/
    │   └── composables/
    │       └── usePagination.spec.ts   # NEW: Pagination composable tests
    └── e2e/
        ├── theme.spec.ts               # NEW: Theme switching E2E tests
        └── pagination.spec.ts          # NEW: Pagination navigation E2E tests
```

**Structure Decision**: Frontend-only modification within existing correction-ui project. New components placed in `components/ui/pagination/` following shadcn organizational patterns. CSS theme files updated in-place to maintain backward compatibility.

## Complexity Tracking

> No Constitution violations. All principles satisfied.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

## Implementation Summary

### Phase 0 Artifacts
- **research.md**: Completed - covers shadcn token architecture, color values, pagination patterns, accessibility requirements

### Phase 1 Artifacts
- **data-model.md**: Completed - defines CSS token structure, pagination props/emits, composable types
- **contracts/pagination-component.ts**: Completed - TypeScript interfaces for pagination component API
- **contracts/css-tokens.css**: Completed - CSS custom property contract for themes
- **quickstart.md**: Completed - step-by-step implementation guide

### Next Steps
Run `/speckit.tasks` to generate dependency-ordered implementation tasks.

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Color contrast violations | Verify WCAG ratios using contrast checker before deployment |
| Breaking existing components | Preserve M3 token aliases for backward compatibility |
| Chart colors not updating | Test theme switching with charts visible on analytics page |
| Pagination accessibility | Test with VoiceOver/NVDA before deployment |

## Dependencies

No new npm packages required. Existing dependencies sufficient:
- Vue 3.5.22 (reactive components)
- @vueuse/core 11.3.0 (composable utilities)
- ApexCharts 5.3.6 (chart theming)
