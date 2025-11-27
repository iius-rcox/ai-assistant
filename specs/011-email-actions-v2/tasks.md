# Tasks: Email Actions V2

**Input**: Design documents from `/specs/011-email-actions-v2/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No automated tests explicitly requested. Manual e2e testing via n8n workflow execution + correction-ui functional testing per quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **correction-ui**: `correction-ui/src/`
- **Supabase migrations**: `correction-ui/supabase/migrations/`
- **n8n workflows**: Created via n8n MCP tools at https://n8n.coxserver.com
- **Types**: `correction-ui/src/types/`
- **Components**: `correction-ui/src/components/`
- **Services**: `correction-ui/src/services/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create new type definitions and foundational files

- [ ] T001 Create action type definitions file at `correction-ui/src/types/actions.ts` per contracts/action-types.ts
- [ ] T002 [P] Update ACTION_TYPES enum in `correction-ui/src/types/enums.ts` to include ACTION_TYPES_V2 with backward compatibility
- [ ] T003 [P] Add Shipment, Draft, CalendarEvent, SenderListEntry, ActionLog interfaces to `correction-ui/src/types/models.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database migrations and core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create migration `correction-ui/supabase/migrations/20251127_action_enum_migration.sql` to add action_v2 columns to classifications table per data-model.md
- [ ] T005 Create migration `correction-ui/supabase/migrations/20251127_sender_lists_table.sql` for SafeList/BlackList per data-model.md
- [ ] T006 [P] Create migration `correction-ui/supabase/migrations/20251127_action_logs_table.sql` for action audit trail per data-model.md
- [ ] T007 Run all migrations via Supabase CLI and verify tables created
- [ ] T008 Update `correction-ui/src/types/database.types.ts` with new table types (regenerate via Supabase CLI)
- [ ] T009 Create base `correction-ui/src/services/actionLogService.ts` with listActionLogs and getEmailActionHistory functions per contracts/api-endpoints.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View and Select Actions for Classified Emails (Priority: P1) MVP

**Goal**: Users can view and select from 6 action types grouped by risk level with tooltips

**Independent Test**: Load classification list, click action dropdown, verify 6 options appear in 4 groups with tooltips

### Implementation for User Story 1

- [ ] T010 [US1] Create `correction-ui/src/components/shared/ActionTooltip.vue` with tooltip content per ACTION_DESCRIPTIONS from contracts/action-types.ts
- [ ] T011 [US1] Create `correction-ui/src/components/ActionDropdown.vue` with risk-grouped options (Low Risk, Enrichment, Human Review, Destructive) per FR-002
- [ ] T012 [US1] Add conditional SHIPMENT disable logic in ActionDropdown.vue based on has_tracking_info per FR-007
- [ ] T013 [US1] Add destructive styling (red/warning) for JUNK option in ActionDropdown.vue per US7 acceptance scenario 5
- [ ] T014 [US1] Create `correction-ui/src/components/ActionStatusIndicator.vue` with icons per FR-004 (bell, calendar, draft, package, warning)
- [ ] T015 [US1] Create `correction-ui/src/composables/useActionStatus.ts` with hasPendingDraft, hasPendingEvent computed properties
- [ ] T016 [US1] Update `correction-ui/src/services/classificationService.ts` to use action_v2 field instead of action
- [ ] T017 [US1] Update updateClassification function in classificationService.ts to log to action_logs table
- [ ] T018 [US1] Replace action dropdown in `correction-ui/src/components/ClassificationList.vue` with new ActionDropdown component
- [ ] T019 [US1] Add ActionStatusIndicator to action column in ClassificationList.vue
- [ ] T020 [US1] Wire instant-save for action changes in ClassificationList.vue with toast feedback

**Checkpoint**: User Story 1 complete - action dropdown with grouped options, tooltips, and status indicators working

---

## Phase 4: User Story 2 - Automated IGNORE Action for Low-Value Emails (Priority: P1)

**Goal**: System automatically assigns IGNORE action to promotional emails with >85% confidence

**Independent Test**: Inject promotional email, verify IGNORE action assigned and email marked as read

### Implementation for User Story 2

- [ ] T021 [US2] Update AI Agent system prompt in Classification-Workflow (MVkAVroogGQA6ePC) with new action types per contracts/workflow-structure.md
- [ ] T022 [US2] Add Structured Output Parser schema for action_v2, has_tracking_info, has_date_info fields in Classification-Workflow
- [ ] T023 [US2] Create "Apply Action Thresholds" Code node in Classification-Workflow per contracts/workflow-structure.md threshold logic
- [ ] T024 [US2] Update Supabase insert node in Classification-Workflow to include action_v2, action_confidence, action_auto_assigned columns
- [ ] T025 [US2] Add action_logs insert node in Classification-Workflow to log automatic assignments
- [ ] T026 [US2] Update Organization-Workflow (00U9iowWuwQofzlQ) to handle IGNORE action (mark as read only)
- [ ] T027 [US2] Verify IGNORE fallback logic: if confidence < 85%, assign IGNORE per FR-006

**Checkpoint**: User Story 2 complete - IGNORE automation working with threshold enforcement

---

## Phase 5: User Story 3 - NOTIFY Action for Important Emails (Priority: P1)

**Goal**: System sends Telegram notifications for HIGH urgency or priority category emails

**Independent Test**: Inject HIGH urgency KIDS email, verify Telegram notification received with summary

### Implementation for User Story 3

- [ ] T028 [US3] Create Action-Processor-Workflow (NEW) via n8n MCP with Switch node for action_v2 routing per contracts/workflow-structure.md
- [ ] T029 [US3] Add NOTIFY branch in Action-Processor-Workflow to trigger Notification-Workflow
- [ ] T030 [US3] Update trigger condition in Notification-Workflow (VADceJJa6WJuwCKG) to check action_v2='NOTIFY'
- [ ] T031 [US3] Update Telegram message format in Notification-Workflow per contracts/telegram-messages.md NOTIFY template
- [ ] T032 [US3] Add Email-Processing-Main (W42UBwlIGyfZx1M2) call to Action-Processor-Workflow after Classification-Workflow
- [ ] T033 [US3] Add priority category check (KIDS, ROBYN, FINANCIAL) in threshold logic to assign NOTIFY per FR-014

**Checkpoint**: User Story 3 complete - NOTIFY action triggering Telegram notifications

---

## Phase 6: User Story 4 - SHIPMENT Action for Package Tracking (Priority: P2)

**Goal**: Extract and store tracking information from shipping emails

**Independent Test**: Inject Amazon shipping email, verify shipments table has tracking_number, carrier, ETA

### Implementation for User Story 4

- [ ] T034 [US4] Create migration `correction-ui/supabase/migrations/20251127_shipments_table.sql` per data-model.md
- [ ] T035 [US4] Run shipments migration and verify table created
- [ ] T036 [US4] Create `correction-ui/src/services/shipmentService.ts` with listShipments, getShipmentByEmail, getPendingShipments per contracts/api-endpoints.ts
- [ ] T037 [US4] Add shipment extraction to AI Agent prompt in Classification-Workflow (tracking_number, carrier, items, estimated_delivery)
- [ ] T038 [US4] Add SHIPMENT branch in Action-Processor-Workflow with extraction Code node per contracts/workflow-structure.md
- [ ] T039 [US4] Add carrier tracking URL generation in SHIPMENT branch Code node (USPS, UPS, FedEx, Amazon, DHL patterns)
- [ ] T040 [US4] Add Supabase insert node for shipments table in SHIPMENT branch
- [ ] T041 [US4] Add Telegram notification in SHIPMENT branch per contracts/telegram-messages.md SHIPMENT template
- [ ] T042 [US4] Update has_tracking_info detection in Classification-Workflow threshold logic

**Checkpoint**: User Story 4 complete - SHIPMENT extraction and storage working

---

## Phase 7: User Story 5 - DRAFT_REPLY Action for Response Suggestions (Priority: P2)

**Goal**: Generate AI draft replies and send to Telegram for user approval

**Independent Test**: Inject question email, verify draft generated and Telegram message has Send/Re-write/Discard buttons

### Implementation for User Story 5

- [ ] T043 [US5] Create migration `correction-ui/supabase/migrations/20251127_drafts_table.sql` per data-model.md
- [ ] T044 [US5] Run drafts migration and verify table created
- [ ] T045 [US5] Create `correction-ui/src/services/draftService.ts` with listDrafts, getDraftByEmail, getPendingDrafts per contracts/api-endpoints.ts
- [ ] T046 [US5] Add DRAFT_REPLY branch in Action-Processor-Workflow with AI Agent draft generation node
- [ ] T047 [US5] Add Supabase insert node for drafts table with status='pending' in DRAFT_REPLY branch
- [ ] T048 [US5] Add Telegram Send Message node with inline keyboard buttons (Send, Re-write, Discard) per contracts/telegram-messages.md
- [ ] T049 [US5] Create Draft-Reply-Handler-Workflow (NEW) via n8n MCP with Webhook trigger for Telegram callbacks
- [ ] T050 [US5] Add SEND branch in Draft-Reply-Handler-Workflow: Gmail Send Message → Update draft status → Telegram confirmation
- [ ] T051 [US5] Add REWRITE branch in Draft-Reply-Handler-Workflow: Update status → Telegram ask for instructions
- [ ] T052 [US5] Add DISCARD branch in Draft-Reply-Handler-Workflow: Update draft status='discarded' → Telegram confirmation
- [ ] T053 [US5] Add draft re-generation logic in Draft-Reply-Handler-Workflow after receiving rewrite instructions
- [ ] T054 [US5] Configure Telegram webhook to route callback_query to Draft-Reply-Handler-Workflow

**Checkpoint**: User Story 5 complete - DRAFT_REPLY generation and Telegram approval flow working

---

## Phase 8: User Story 6 - CALENDAR Action for Event Extraction (Priority: P2)

**Goal**: Extract event details and create tentative Google Calendar events

**Independent Test**: Inject school email with date, verify tentative event in Google Calendar

### Implementation for User Story 6

- [ ] T055 [US6] Create migration `correction-ui/supabase/migrations/20251127_calendar_events_table.sql` per data-model.md
- [ ] T056 [US6] Run calendar_events migration and verify table created
- [ ] T057 [US6] Create `correction-ui/src/services/calendarEventService.ts` with listCalendarEvents, getTentativeEvents per contracts/api-endpoints.ts
- [ ] T058 [US6] Add calendar event extraction to AI Agent prompt in Classification-Workflow (event_title, event_start, event_end, event_location)
- [ ] T059 [US6] Add CALENDAR branch in Action-Processor-Workflow with event preparation Code node
- [ ] T060 [US6] Add Google Calendar Create Event node in CALENDAR branch with status='tentative' per FR-010
- [ ] T061 [US6] Add Supabase insert node for calendar_events table with google_event_id in CALENDAR branch
- [ ] T062 [US6] Add Telegram notification in CALENDAR branch per contracts/telegram-messages.md CALENDAR template
- [ ] T063 [US6] Update has_date_info detection in Classification-Workflow threshold logic

**Checkpoint**: User Story 6 complete - CALENDAR extraction and Google Calendar sync working

---

## Phase 9: User Story 7 - JUNK Action for Spam Management (Priority: P3)

**Goal**: Archive obvious spam from blacklisted domains with 99% confidence threshold

**Independent Test**: Add domain to blacklist, inject email from that domain, verify archived to junk

### Implementation for User Story 7

- [ ] T064 [US7] Create `correction-ui/src/services/senderListService.ts` with getList, addEntry, checkSender per contracts/api-endpoints.ts
- [ ] T065 [US7] Add is_sender_blacklisted function call in Classification-Workflow threshold logic
- [ ] T066 [US7] Add is_sender_safelisted check to block JUNK for safelisted senders per FR-008
- [ ] T067 [US7] Add protected category check (KIDS, ROBYN, FINANCIAL, WORK) to prevent auto-JUNK per FR-008
- [ ] T068 [US7] Add JUNK branch in Action-Processor-Workflow to pass to Organization-Workflow
- [ ] T069 [US7] Update Organization-Workflow JUNK handling: mark as read + archive to junk folder
- [ ] T070 [US7] Add 99% confidence threshold enforcement for JUNK in threshold logic per FR-005

**Checkpoint**: User Story 7 complete - JUNK action with safeguards working

---

## Phase 10: User Story 8 - Manage Junk SafeList and BlackList (Priority: P3)

**Goal**: UI for managing trusted/blocked senders and row context menu actions

**Independent Test**: Navigate to list management, add entry, use row context menu

### Implementation for User Story 8

- [ ] T071 [US8] Add addSenderToJunk, addDomainToJunk, markAsNotJunk functions to senderListService.ts per contracts/api-endpoints.ts
- [ ] T072 [US8] Create `correction-ui/src/views/ListManagementPage.vue` with SafeList and BlackList sections per FR-019
- [ ] T073 [US8] Add add entry form to ListManagementPage.vue (email or domain selector + value input)
- [ ] T074 [US8] Add remove entry (soft delete) functionality to ListManagementPage.vue
- [ ] T075 [US8] Add route for /lists in `correction-ui/src/router/index.ts`
- [ ] T076 [US8] Create `correction-ui/src/components/RowContextMenu.vue` with 3-dot button and dropdown per FR-020
- [ ] T077 [US8] Add "Add sender to junk" option in RowContextMenu.vue calling senderListService.addSenderToJunk
- [ ] T078 [US8] Add "Add sender domain to junk" option in RowContextMenu.vue calling senderListService.addDomainToJunk
- [ ] T079 [US8] Add conditional "Mark as not junk" option in RowContextMenu.vue (only when action=JUNK) per FR-021
- [ ] T080 [US8] Integrate RowContextMenu.vue into ClassificationList.vue rows

**Checkpoint**: User Story 8 complete - List management UI and row context menu working

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, verification, and cleanup

- [ ] T081 [P] Add navigation link to List Management page in app header/sidebar
- [ ] T082 [P] Add JSDoc comments to all new service files
- [ ] T083 [P] Verify all action_logs are being created for workflow and UI actions
- [ ] T084 [P] Test action priority resolution when email matches multiple triggers (NOTIFY > CALENDAR > SHIPMENT)
- [ ] T085 Run full e2e validation per quickstart.md Phase-by-Phase testing checklist
- [ ] T086 Verify success criteria per quickstart.md Success Metrics Validation section

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational (Phase 2)
  - US1 (UI): Can proceed immediately after Foundational
  - US2 (IGNORE): Depends on US1 (uses action_v2 field)
  - US3 (NOTIFY): Depends on US2 (extends workflow)
  - US4 (SHIPMENT): Independent, can parallel with US3
  - US5 (DRAFT_REPLY): Independent, can parallel with US4
  - US6 (CALENDAR): Independent, can parallel with US5
  - US7 (JUNK): Depends on US8 (needs sender_lists)
  - US8 (Lists): Independent, can parallel with US4-6
- **Polish (Phase 11)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational - migrations)
    │
    ├───────────────────────────────────────────┐
    ▼                                           │
US1 (P1 - UI dropdown)                          │
    │                                           │
    ▼                                           │
US2 (P1 - IGNORE workflow)                      │
    │                                           │
    ▼                                           │
US3 (P1 - NOTIFY workflow)                      │
    │                                           │
    ├───────────┬───────────┬───────────┐       │
    ▼           ▼           ▼           ▼       │
US4         US5         US6         US8 ◄───────┘
(SHIPMENT)  (DRAFT)     (CALENDAR)  (Lists)
    │           │           │           │
    └───────────┴───────────┴───────────┤
                                        ▼
                                    US7 (JUNK)
                                        │
                                        ▼
                                Phase 11 (Polish)
```

### Within Each User Story

- Migrations before services
- Services before components
- Components before integration
- Workflow nodes in dependency order

### Parallel Opportunities

**Phase 1 (Setup)**:
- T002 and T003 can run in parallel (different files)

**Phase 2 (Foundational)**:
- T005 and T006 can run in parallel (different tables)

**Phase 4-8 (P2 User Stories)**:
- US4, US5, US6 can ALL run in parallel after US3 completes
- Each has independent migrations, services, and workflow branches

**Phase 11 (Polish)**:
- T081, T082, T083, T084 can ALL run in parallel

---

## Parallel Example: P2 User Stories

```bash
# After US3 (NOTIFY) completes, launch US4, US5, US6 in parallel:

# Developer A (or parallel agent):
Task: "T034 [US4] Create shipments migration"
Task: "T036 [US4] Create shipmentService.ts"
...

# Developer B (or parallel agent):
Task: "T043 [US5] Create drafts migration"
Task: "T045 [US5] Create draftService.ts"
...

# Developer C (or parallel agent):
Task: "T055 [US6] Create calendar_events migration"
Task: "T057 [US6] Create calendarEventService.ts"
...
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T009)
3. Complete Phase 3: User Story 1 - Action Dropdown (T010-T020)
4. Complete Phase 4: User Story 2 - IGNORE Automation (T021-T027)
5. Complete Phase 5: User Story 3 - NOTIFY Alerts (T028-T033)
6. **STOP and VALIDATE**: Test all P1 stories independently
7. Deploy/demo MVP

### Incremental Delivery (P2)

1. MVP complete → Foundation + P1 stories working
2. Add User Story 4 (SHIPMENT) → Test independently → Merge
3. Add User Story 5 (DRAFT_REPLY) → Test independently → Merge
4. Add User Story 6 (CALENDAR) → Test independently → Merge

### P3 Delivery

1. Add User Story 8 (Lists) → Test independently → Merge
2. Add User Story 7 (JUNK) → Test independently → Merge
3. Complete Phase 11: Polish → Final validation

---

## Summary

| Phase | User Story | Tasks | Parallel | Priority |
|-------|------------|-------|----------|----------|
| 1 | Setup | 3 | 2 | - |
| 2 | Foundational | 6 | 2 | - |
| 3 | US1 - Action Dropdown | 11 | 0 | P1 |
| 4 | US2 - IGNORE Automation | 7 | 0 | P1 |
| 5 | US3 - NOTIFY Alerts | 6 | 0 | P1 |
| 6 | US4 - SHIPMENT Tracking | 9 | 0 | P2 |
| 7 | US5 - DRAFT_REPLY | 12 | 0 | P2 |
| 8 | US6 - CALENDAR Events | 9 | 0 | P2 |
| 9 | US7 - JUNK Action | 7 | 0 | P3 |
| 10 | US8 - List Management | 10 | 0 | P3 |
| 11 | Polish | 6 | 4 | - |
| **Total** | | **86** | **8** | |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable once complete
- P1 stories (US1-3) form the MVP and should be completed first
- P2 stories (US4-6) can run in parallel after MVP
- P3 stories (US7-8) require sender_lists from Foundational phase
- n8n workflows created via MCP tools, not file edits
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
