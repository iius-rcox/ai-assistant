# Implementation Plan: Email Actions V2

**Branch**: `011-email-actions-v2` | **Date**: 2025-11-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-email-actions-v2/spec.md`

## Summary

Introduce a refined action model for email processing with six constrained actions (IGNORE, SHIPMENT, DRAFT_REPLY, JUNK, NOTIFY, CALENDAR) to replace the existing six-action system (FYI, RESPOND, TASK, PAYMENT, CALENDAR, NONE). The new model emphasizes automation with safety guardrails: confidence-based auto-assignment, Telegram-based draft approval workflow, Google Calendar tentative events, and SafeList/BlackList management for JUNK action qualification.

**Technical Approach**:
- **n8n Workflows**: Extend Classification-Workflow with new action logic and confidence thresholds; create Action-Processor sub-workflow for action-specific behaviors
- **Supabase**: Add new tables (shipments, drafts, calendar_events, sender_lists) and migrate action enum values
- **correction-ui**: Update action dropdown with risk grouping, tooltips, status indicators; add list management UI and row context menu
- **Telegram**: Enhance notification workflow with inline buttons for DRAFT_REPLY approval (Send/Re-write/Discard)
- **Google Calendar**: Integrate native Google Calendar n8n node for Tentative event creation

## Technical Context

**Language/Version**: TypeScript 5.9+ (correction-ui), JavaScript (n8n Code nodes)
**Primary Dependencies**: Vue 3.5+, Pinia 3.0, Supabase JS 2.84+, n8n native nodes (AI Agent, Gmail, Telegram, Google Calendar)
**Storage**: Supabase PostgreSQL (project: xmziovusqlmgygcrgyqt) with pgvector extension
**Testing**: Manual e2e testing via n8n workflow execution + correction-ui functional testing
**Target Platform**: Web (correction-ui on Vite), n8n server (self-hosted at n8n.coxserver.com)
**Project Type**: Web application (frontend) + n8n workflow orchestration (backend)
**Performance Goals**: <10 seconds email processing, <60 seconds Telegram notification delivery, 95%+ extraction accuracy
**Constraints**: Maximum 50 nodes per workflow, maximum 5 AI Agent tools, 1536-dimension embeddings
**Scale/Scope**: Single user system, ~50 emails/day, 6 action types, 4 new database tables

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **User-First Design**: Feature delivers measurable user value with clear acceptance criteria
  - 8 user stories with 31 acceptance scenarios covering all action types
  - Success criteria include: 90% IGNORE automation, 100% NOTIFY delivery <60s, 95% shipment extraction accuracy
- [x] **Test-Driven Development**: Test strategy defined with test-first approach planned
  - Each user story has independent test documented
  - Edge cases identified with expected behaviors
- [x] **n8n-Native Architecture**: Use native n8n nodes over custom code
  - Gmail Trigger, AI Agent, Telegram, Google Calendar nodes (all native)
  - Code nodes only for data transformation and confidence threshold logic
  - Zero Execute Command nodes planned
- [x] **Progressive Enhancement**: MVP defined with incremental delivery path
  - P1 (MVP): IGNORE, NOTIFY + UI action dropdown (User Stories 1-3)
  - P2: SHIPMENT, DRAFT_REPLY, CALENDAR (User Stories 4-6)
  - P3: JUNK + SafeList/BlackList management (User Stories 7-8)
- [x] **Observable Systems**: Logging and monitoring strategy defined
  - ActionLog entity captures all action assignments with confidence scores
  - FR-011: Log all actions, confidence scores, extracted fields, final decisions
  - FR-012: Support action reversibility by retaining previous state
- [x] **Security by Design**: Security considerations identified and addressed
  - FR-009: NEVER send emails without explicit user approval
  - FR-008: Prevent automatic JUNK for protected categories
  - 99% confidence threshold for JUNK action
  - SafeList prevents false positive junking
- [x] **Documentation as Code**: Documentation plan included in implementation
  - spec.md, plan.md, data-model.md, contracts/ versioned in specs/011-email-actions-v2/
  - Action tooltips provide in-app documentation

## Project Structure

### Documentation (this feature)

```text
specs/011-email-actions-v2/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── action-types.ts          # Action enum and threshold definitions
│   ├── workflow-structure.md    # n8n workflow node diagrams
│   ├── telegram-messages.md     # Telegram message templates
│   └── api-endpoints.ts         # Supabase service contracts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
# n8n Workflows (at n8n.coxserver.com)
workflows/
├── Email-Processing-Main (W42UBwlIGyfZx1M2)     # Orchestrator - triggers sub-workflows
├── Classification-Workflow (MVkAVroogGQA6ePC)   # MODIFIED: Add action selection logic
├── Organization-Workflow (00U9iowWuwQofzlQ)     # MODIFIED: Handle new action types
├── Notification-Workflow (VADceJJa6WJuwCKG)     # MODIFIED: NOTIFY + DRAFT_REPLY Telegram
├── Action-Processor-Workflow (NEW)              # NEW: Process SHIPMENT, CALENDAR, DRAFT_REPLY
└── Draft-Reply-Handler-Workflow (NEW)           # NEW: Handle Telegram callback for drafts

# correction-ui Frontend (Vue 3.5+)
correction-ui/
├── src/
│   ├── components/
│   │   ├── ClassificationList.vue          # MODIFIED: New action dropdown, row context menu
│   │   ├── ActionDropdown.vue              # NEW: Risk-grouped action selector with tooltips
│   │   ├── ActionStatusIndicator.vue       # NEW: Bell/calendar/draft icons
│   │   ├── RowContextMenu.vue              # NEW: 3-dot menu with junk actions
│   │   ├── ListManagement.vue              # NEW: SafeList/BlackList management page
│   │   └── shared/
│   │       └── ActionTooltip.vue           # NEW: Action explanation tooltips
│   ├── composables/
│   │   └── useActionStatus.ts              # NEW: Action status indicator logic
│   ├── services/
│   │   ├── classificationService.ts        # MODIFIED: New action types
│   │   ├── senderListService.ts            # NEW: SafeList/BlackList CRUD
│   │   ├── shipmentService.ts              # NEW: Shipment data queries
│   │   └── draftService.ts                 # NEW: Draft reply queries
│   ├── types/
│   │   ├── enums.ts                        # MODIFIED: New ACTION_TYPES enum
│   │   ├── models.ts                       # MODIFIED: New entity types
│   │   └── actions.ts                      # NEW: Action-specific type definitions
│   └── views/
│       └── ListManagementPage.vue          # NEW: SafeList/BlackList page
└── supabase/
    └── migrations/
        ├── 20251127_action_enum_migration.sql    # Migrate action values
        ├── 20251127_shipments_table.sql          # Shipment tracking table
        ├── 20251127_drafts_table.sql             # Draft replies table
        ├── 20251127_calendar_events_table.sql    # Calendar events table
        └── 20251127_sender_lists_table.sql       # SafeList/BlackList table
```

**Structure Decision**: Web application with n8n workflow backend. Frontend follows existing correction-ui conventions (Vue 3.5, Pinia, Supabase JS). Backend logic implemented as n8n native workflows with Supabase for persistence.

## Complexity Tracking

> **No Constitution violations identified.** All implementation uses n8n-native nodes and follows established patterns.

| Aspect | Compliance | Notes |
|--------|------------|-------|
| n8n Native Nodes | ✅ 100% | Gmail, Telegram, Google Calendar, AI Agent, Supabase Vector Store |
| Code Nodes | ✅ Minimal | Data transformation only (confidence threshold logic, message formatting) |
| Execute Command | ✅ None | No Python/shell scripts |
| Workflow Complexity | ✅ Within limits | Max 15 nodes per workflow planned |
| AI Agent Tools | ✅ Within limits | 2 tools (Vector Store, Draft Generator) |

---

## Constitution Check (Post-Design Re-evaluation)

*Re-evaluated after Phase 1 design completion.*

### Principle Compliance Summary

| Principle | Status | Evidence |
|-----------|--------|----------|
| User-First Design | ✅ Pass | 8 user stories, 31 acceptance scenarios, 9 measurable success criteria |
| Test-Driven Development | ✅ Pass | Independent tests per story in quickstart.md, validation SQL queries |
| n8n-Native Architecture | ✅ Pass | 100% native nodes (Gmail, Telegram, Calendar, AI Agent), zero Execute Command |
| Progressive Enhancement | ✅ Pass | P1 MVP (IGNORE, NOTIFY, UI), P2 enrichment, P3 JUNK |
| Observable Systems | ✅ Pass | action_logs table, extraction_confidence tracking, assignment_reason audit |
| Security by Design | ✅ Pass | 99% JUNK threshold, protected categories, SafeList/Telegram approval |
| Documentation as Code | ✅ Pass | 5 spec artifacts versioned, inline tooltips |
| Memory-Driven Learning | ✅ Pass | Vector Store for similarity search, correction tracking |

### Design Artifacts Generated

| Artifact | Path | Status |
|----------|------|--------|
| research.md | specs/011-email-actions-v2/research.md | ✅ Complete |
| data-model.md | specs/011-email-actions-v2/data-model.md | ✅ Complete |
| quickstart.md | specs/011-email-actions-v2/quickstart.md | ✅ Complete |
| action-types.ts | specs/011-email-actions-v2/contracts/action-types.ts | ✅ Complete |
| workflow-structure.md | specs/011-email-actions-v2/contracts/workflow-structure.md | ✅ Complete |
| telegram-messages.md | specs/011-email-actions-v2/contracts/telegram-messages.md | ✅ Complete |
| api-endpoints.ts | specs/011-email-actions-v2/contracts/api-endpoints.ts | ✅ Complete |

### Complexity Analysis

| Metric | Limit | Planned | Status |
|--------|-------|---------|--------|
| Nodes per workflow | 50 | 15 max | ✅ Within |
| Parallel branches | 3 | 2 | ✅ Within |
| AI Agent tools | 5 | 2 | ✅ Within |
| New database tables | - | 5 | ✅ Appropriate |
| Classification categories | 6 | 7 (+ CHURCH) | ✅ Within |

### Gate Result: ✅ PASSED

The design phase is complete and all Constitution principles are satisfied. The implementation may proceed to task generation via `/speckit.tasks`.
