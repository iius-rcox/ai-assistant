# Implementation Plan: Email Classification Correction UI

**Branch**: `003-correction-ui` | **Date**: 2025-11-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-correction-ui/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a locally hosted web UI that enables system operators to review and correct email classifications 3-5x faster than the current Supabase dashboard workflow. The UI connects to the existing Supabase PostgreSQL database to display paginated classification lists, provide inline editing with dropdown controls, apply dynamic filters, and visualize correction patterns with analytics charts. All corrections are immediately saved to the database and logged via existing database triggers for AI learning.

## Technical Context

**Language/Version**: TypeScript 5.6+ with Vue 3.4+ (ES2022 target)
**Primary Dependencies**: Vue 3, Vite 5.4, Supabase JS 2.45, ApexCharts 3.54, Pinia 2.2
**Storage**: Supabase PostgreSQL (existing database project: xmziovusqlmgygcrgyqt)
**Testing**: Vitest 2.1 + Vue Testing Library + Mock Service Worker (Supabase mocking) + Playwright 1.48 (E2E)
**Target Platform**: Modern web browsers (Chrome/Firefox/Safari), localhost development server
**Project Type**: Web application (single-page Vue 3 application, Supabase client connects directly - no backend needed)
**Performance Goals**: List page load <2 seconds with 1,000+ classifications, 30-second server startup
**Constraints**: Runs locally (no cloud deployment), single-user (no authentication), credentials via .env file, bundle size ~150KB gzipped
**Scale/Scope**: ~10-15 Vue components, 3 main views (list/detail/analytics), handles up to 10,000 classifications with server-side pagination

See [research.md](research.md) for detailed technology decision rationale.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **User-First Design**: Feature delivers measurable user value with clear acceptance criteria
  - 10 success criteria defined (SC-001 through SC-010) with specific metrics
  - 30-second correction time vs 60-90 seconds with Supabase (50% improvement)
  - 3 prioritized user stories with independent test criteria

- [x] **Test-Driven Development**: Test strategy defined with test-first approach planned
  - Acceptance scenarios defined for all 3 user stories (4 scenarios each)
  - 6 edge cases identified with expected behaviors
  - Testing approach: component tests, integration tests, end-to-end smoke tests

- [x] **Modular Architecture**: Components properly separated with clear interfaces
  - Frontend UI components (list view, detail view, filters, analytics)
  - Database access layer (Supabase client wrapper)
  - Clear separation: presentation → business logic → data access

- [x] **Progressive Enhancement**: MVP defined with incremental delivery path
  - P1 (MVP): Review and correct classifications (core workflow)
  - P2: Filter and search (efficiency improvement)
  - P3: Correction history analytics (learning insights)

- [x] **Observable Systems**: Logging and monitoring strategy defined
  - FR-021: Browser console logging for errors, warnings, and key user actions
  - Database audit trail via existing correction_logs table
  - No external monitoring required for localhost tool

- [x] **Security by Design**: Security considerations identified and addressed
  - FR-010: Credentials via .env file (excluded from version control)
  - Single-user assumption (no authentication needed)
  - Supabase service role key for database access (RLS policies already in place)

- [x] **Documentation as Code**: Documentation plan included in implementation
  - README with setup instructions (.env configuration, dependencies, start command)
  - Inline code comments for complex logic
  - This plan.md, quickstart.md, and data-model.md serve as living documentation

**NOTE**: This feature does NOT involve n8n workflows - it's a standalone web UI tool for the operator. The n8n-Native Architecture principle from the constitution does not apply to this feature since it's not an n8n workflow. The UI connects to existing database infrastructure created by 001-email-classification-mvp (which IS n8n-native).

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
correction-ui/                    # New directory for standalone UI application
├── public/                       # Static assets
│   └── index.html
├── src/
│   ├── components/              # React/Vue/Svelte components
│   │   ├── ClassificationList.* # Main list view with pagination
│   │   ├── ClassificationDetail.* # Detail view with inline editing
│   │   ├── Filters.*            # Filter controls (confidence, date, category)
│   │   ├── AnalyticsDashboard.* # P3: Correction history and charts
│   │   └── shared/              # Reusable UI components (dropdown, button, etc.)
│   ├── services/                # Business logic and API clients
│   │   ├── supabase.ts          # Supabase client wrapper
│   │   ├── classificationService.ts # CRUD operations for classifications
│   │   └── analyticsService.ts  # Correction pattern queries
│   ├── types/                   # TypeScript type definitions
│   │   └── models.ts            # Classification, Email, CorrectionLog types
│   ├── utils/                   # Utilities
│   │   ├── logger.ts            # Console logging utility (FR-021)
│   │   └── formatters.ts        # Date/time formatting
│   ├── App.*                    # Root component with routing
│   └── main.*                   # Entry point
├── tests/
│   ├── components/              # Component unit tests
│   ├── services/                # Service layer tests
│   └── e2e/                     # End-to-end smoke tests
├── .env.template                # Template for required environment variables
├── .gitignore                   # Excludes .env, node_modules, dist
├── package.json                 # Dependencies and scripts
├── vite.config.ts (or similar)  # Build configuration
└── README.md                    # Setup and usage instructions
```

**Structure Decision**: Web application (Option 2) selected. This is a standalone single-page application that runs locally and connects to the existing Supabase database. No backend/API layer needed since Supabase client handles database operations directly from the frontend. The `correction-ui/` directory will be a new top-level directory in the repository alongside `specs/` and `docs/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations. This feature is a standalone UI tool, not an n8n workflow, so the n8n-Native Architecture principle does not apply.
