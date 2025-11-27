# Implementation Plan: Instant Edit with Undo

**Branch**: `007-instant-edit-undo` | **Date**: 2025-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-instant-edit-undo/spec.md`

## Summary

Refactor the correction-ui front-end to implement instant-save behavior when dropdown values are selected, eliminating confirmation dialogs. Provide a single-level undo capability via toast notifications with a 30-second window. This improves UX by reducing friction (5+ seconds to <2 seconds per change) while maintaining data safety through the undo mechanism.

## Technical Context

**Language/Version**: TypeScript 5.9+ with Vue 3.5+ (ES2022 target)
**Primary Dependencies**: Vue 3.5, Pinia 2.2+, Supabase JS 2.84+, VueUse 11+
**Storage**: Supabase PostgreSQL (existing project: xmziovusqlmgygcrgyqt) with localStorage for undo state backup
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (Vue SPA)
**Performance Goals**: <100ms visual feedback, <500ms save completion, smooth interactions
**Constraints**: Single-level undo only, 30-second undo window, toast-based UI
**Scale/Scope**: Single-user application, existing correction-ui codebase refactor

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **User-First Design**: Feature delivers measurable user value (2s vs 5s+ per change) with clear acceptance criteria defined per user story
- [x] **Test-Driven Development**: Test strategy defined - Vitest for composables, Playwright for user flows
- [x] **Modular Architecture**: New `useUndo` composable, extended toast system, modified `useInlineEdit` - clear separation
- [x] **Progressive Enhancement**: MVP = instant save + toast undo (US1+US2); incremental = visual feedback (US3), keyboard (US4)
- [x] **Observable Systems**: Existing logging via `logAction`/`logError` utilities will track save/undo operations
- [x] **Security by Design**: No new security concerns - uses existing Supabase auth and optimistic locking
- [x] **Documentation as Code**: Plan includes data-model.md, contracts/, quickstart.md artifacts

## Project Structure

### Documentation (this feature)

```text
specs/007-instant-edit-undo/
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
│   ├── composables/
│   │   ├── useInlineEdit.ts      # MODIFY: Add instant-save on change
│   │   ├── useUndo.ts            # NEW: Undo state management
│   │   ├── useToast.ts           # MODIFY: Add action button support
│   │   └── useKeyboardShortcuts.ts # MODIFY: Add Ctrl+Z handler
│   ├── components/
│   │   ├── shared/
│   │   │   └── Toast.vue         # MODIFY: Add action button slot
│   │   ├── ClassificationList.vue # MODIFY: Wire instant-save
│   │   └── InlineEditCell.vue    # MODIFY: Trigger save on change
│   ├── stores/
│   │   └── classificationStore.ts # MODIFY: Add undo support
│   └── types/
│       └── undo.ts               # NEW: Undo type definitions
└── tests/
    ├── unit/
    │   └── composables/
    │       └── useUndo.spec.ts   # NEW: Undo composable tests
    └── e2e/
        └── instant-edit.spec.ts  # NEW: E2E instant edit tests
```

**Structure Decision**: Extends existing correction-ui Vue SPA structure. New composable `useUndo.ts` handles undo state; existing `useInlineEdit.ts` and `useToast.ts` are extended rather than replaced.

## Complexity Tracking

> No Constitution Check violations identified. All changes use existing Vue/Pinia patterns.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
