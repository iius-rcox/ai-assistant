# Implementation Tasks: Enhanced Calendar Management

**Feature**: 002-calendar-management
**Branch**: `002-calendar-management`
**Status**: Ready for Implementation
**Generated**: 2025-11-16

## Overview

This document contains dependency-ordered implementation tasks for the Enhanced Calendar Management feature. Tasks are organized by user story priority (P1 → P2 → P3) to enable incremental delivery and independent testing.

**Implementation Strategy**: Progressive enhancement with MVP-first approach
- **MVP Scope**: User Story 1 + User Story 2 (P1) - Automatic event creation with enhanced AI classification
- **Phase 2**: User Story 3 (P2) - Event updates and modifications
- **Phase 3**: User Story 4 (P3) - Event deletions and cancellations

## Task Format

```
- [ ] [TaskID] [P?] [Story?] Description with file path
```

- **TaskID**: Sequential number (T001, T002, T003...)
- **[P]**: Parallelizable task (can be done concurrently with other [P] tasks)
- **[Story]**: User story label ([US1], [US2], [US3], [US4]) - only for user story phases
- **File path**: Exact location for implementation (n8n workflow name, Supabase table, etc.)

## Dependencies

### User Story Completion Order

```
Phase 1 (Setup) → Phase 2 (Foundational)
                         ↓
                    Phase 3 (US1+US2) ← MVP DELIVERY
                         ↓
                    Phase 4 (US3) ← Optional
                         ↓
                    Phase 5 (US4) ← Optional
                         ↓
                    Phase 6 (Polish)
```

### Story Dependencies

- **US1 (Event Creation)**: No dependencies - can implement independently
- **US2 (Enhanced AI)**: No dependencies - can implement independently
- **US3 (Event Updates)**: Depends on US1 (requires event creation to work first)
- **US4 (Event Deletions)**: Depends on US1 (requires event creation to work first)

**Recommended Approach**: Implement US1+US2 together as MVP, then US3, then US4.

## Parallel Execution Opportunities

### Within Setup Phase
- T002 [P] and T003 [P] can run in parallel (different credentials)

### Within US1+US2 Phase
- T009 [P] (Extraction workflow) and T010 [P] (Operation workflow) and T011 [P] (Matching workflow) can be created in parallel
- T016 [P] through T022 [P] (all test scenarios) can run in parallel

### Within US3 Phase
- T026 [P] and T027 [P] can run in parallel (different workflows)

### Within US4 Phase
- T030 [P] and T031 [P] can run in parallel (different workflows)

---

## Phase 1: Setup & Infrastructure

**Objective**: Prepare database schema and API credentials required for all user stories

### Database Setup

- [X] T001 Create calendar_events table in Supabase (execute data-model.md SQL for calendar_events table)
- [X] T002 [P] Create calendar_operations table in Supabase (execute data-model.md SQL for calendar_operations table)
- [X] T003 [P] Create indexes for calendar_events table (execute data-model.md index creation SQL)
- [X] T004 Create updated_at trigger for calendar_events table (execute data-model.md trigger creation SQL)

### API Credentials

- [X] T005 Verify Google Calendar OAuth2 credential in n8n at https://n8n.coxserver.com (Settings → Credentials → Google Calendar OAuth2)
- [X] T006 Test Google Calendar credential by listing calendars (create temporary test workflow with Google Calendar "Get Many" operation)
- [X] T007 Get primary calendar ID from Google Calendar API (note calendar ID for use in workflows, typically user's email address)

### Backup Existing Workflows

- [X] T008 Backup Email-Processing-Main workflow (export workflow JSON before modifications)

---

## Phase 2: Foundational Components

**Objective**: Components required for multiple user stories (blocking prerequisites)

**Note**: These tasks are foundational because they serve both US1 (event creation) and US2 (enhanced AI classification). Complete before moving to user story phases.

**No tasks in this phase** - all foundational work is story-specific and included in Phase 3.

---

## Phase 3: US1+US2 - Automatic Event Creation with Enhanced AI (P1 - MVP)

**User Story 1**: Automatic Calendar Event Creation from Emails
**User Story 2**: Enhanced AI Context for Calendar Events

**Why Together**: Both stories are P1 and work synergistically - US2 improves the classification that feeds US1. Implementing together delivers complete MVP value.

**Story Goal**: When an email is classified with action=CALENDAR, the system automatically extracts event details using AI and creates a Google Calendar event.

**Independent Test**: Send test email with meeting details → verify action=CALENDAR classification → confirm calendar event created with correct details → verify Telegram notification received.

### Workflow Creation

- [X] T009 [P] [US1] Create Calendar-Event-Extraction-Workflow in n8n using contracts/calendar-event-extraction-workflow.json (7 nodes: AI Agent, OpenAI Chat Model, Structured Output Parser, Code nodes)
- [X] T010 [P] [US1] Create Calendar-Operation-Workflow in n8n using contracts/calendar-operation-workflow.json (12 nodes: Google Calendar, Supabase, Switch, Code, Error Trigger)
- [X] T011 [P] [US1] Create Event-Matching-Workflow in n8n using contracts/event-matching-workflow.json (7 nodes: Supabase query, Code for fuzzy matching, Switch routing)

### AI Enhancement for Classification

- [ ] T012 [US2] Enhance Classification-Workflow AI Agent system prompt with calendar-specific context (add meeting invitation language patterns, appointment keywords, event confirmation detection per quickstart.md)
- [ ] T013 [US2] Add calendar platform detection to AI Agent prompt (add Zoom, Google Meet, Microsoft Teams link detection examples)

### Main Workflow Integration

- [ ] T014 [US1] Update Email-Processing-Main workflow to trigger calendar workflows (add conditional branch for action=CALENDAR that calls Execute Workflow nodes for Calendar-Event-Extraction → Event-Matching → Calendar-Operation)
- [ ] T015 [US1] Add error handling to calendar workflow triggers in Email-Processing-Main (ensure calendar failures don't block email processing, log errors to calendar_operations)

### Testing & Validation (MVP)

- [ ] T016 [P] [US1] Test basic event creation scenario (send email "Team meeting tomorrow at 2pm in Conference Room A" → verify classification → verify calendar event → verify notification)
- [ ] T017 [P] [US1] Test multi-attendee events (send email with 3+ attendee addresses → verify all attendees added to calendar event)
- [ ] T018 [P] [US1] Test meeting platform integration (send emails with Zoom/Meet/Teams links → verify URLs extracted to event description)
- [ ] T019 [P] [US1] Test partial information handling (send email with date only, no time → verify all-day event created → verify missing info flagged)
- [ ] T020 [P] [US1] Test multiple appointments in single email (send "Dentist Monday 2pm and haircut Wednesday 10am" → verify 2 separate events created)
- [ ] T021 [P] [US1] Test stale relative date handling (simulate 48-hour delayed email with "tomorrow" → verify flagged for manual review)
- [ ] T022 [P] [US1] Test low confidence handling (send ambiguous email "let's meet sometime next week" → verify confidence <70% → verify pending_review status → verify Telegram notification)

### AI Classification Validation

- [ ] T023 [US2] Test enhanced calendar classification accuracy (send 20 diverse calendar emails from different platforms → verify 95%+ classified as action=CALENDAR)
- [ ] T024 [US2] Test event type differentiation (send invitation, confirmation, update, cancellation emails → verify AI correctly identifies each type)

### Database Verification

- [ ] T025 [US1] Verify calendar_events and calendar_operations data integrity (run Supabase queries from quickstart.md to check event creation, operation logging, confidence scores)

---

## Phase 4: US3 - Event Updates and Modifications (P2)

**User Story 3**: Calendar Event Modification and Updates

**Story Goal**: When receiving an email about rescheduling/updating an event, identify the original event and apply changes without creating duplicates.

**Independent Test**: Create event via email → send reschedule email in same thread → verify original event updated (not duplicated) → verify update notification sent.

**Depends On**: US1 (requires event creation capability to work)

### Workflow Enhancements

- [ ] T026 [P] [US3] Enhance Event-Matching-Workflow to support update detection (add update operation type handling, improve matching confidence for reschedule scenarios)
- [ ] T027 [P] [US3] Update Calendar-Operation-Workflow to handle update operations (add update branch with Google Calendar "Update" operation, handle attendee changes, preserve event history)

### Main Workflow Updates

- [ ] T028 [US3] Add update operation routing to Email-Processing-Main (when Event-Matching finds existing event and email indicates update, route to update branch)

### Testing & Validation (P2)

- [ ] T029 [US3] Test event update and rescheduling (create event via email → send reschedule email in same thread → verify original event updated with new time → verify no duplicate created → verify update notification)

---

## Phase 5: US4 - Event Deletions and Cancellations (P3)

**User Story 4**: Calendar Event Deletion and Cancellations

**Story Goal**: When receiving a cancellation notice, identify the corresponding event and delete/cancel it.

**Independent Test**: Create event via email → send cancellation email → verify event deleted or marked cancelled → verify cancellation notification sent.

**Depends On**: US1 (requires event creation capability to work)

### Workflow Enhancements

- [ ] T030 [P] [US4] Enhance Event-Matching-Workflow to support cancellation detection (add cancellation keyword detection, cancellation operation type handling)
- [ ] T031 [P] [US4] Update Calendar-Operation-Workflow to handle delete operations (add delete branch with Google Calendar "Delete" operation, implement soft-delete in calendar_events table with status='deleted')

### Main Workflow Updates

- [ ] T032 [US4] Add delete operation routing to Email-Processing-Main (when Event-Matching finds existing event and email indicates cancellation, route to delete branch)

### Testing & Validation (P3)

- [ ] T033 [US4] Test event cancellation (create event via email → send cancellation notice → verify event deleted from Google Calendar → verify calendar_events status='deleted' → verify cancellation notification)

---

## Phase 6: Polish & Cross-Cutting Concerns

**Objective**: Performance optimization, monitoring, and production readiness

### Production Deployment

- [ ] T034 Activate all calendar workflows in n8n (Calendar-Event-Extraction, Calendar-Operation, Event-Matching)
- [ ] T035 Re-activate Email-Processing-Main workflow with calendar integration
- [ ] T036 Monitor first 10 email executions (check n8n execution logs for errors, verify processing times <30s)

### Monitoring & Observability

- [ ] T037 Create monitoring dashboard queries in Supabase (save quickstart.md monitoring queries as Supabase saved queries: daily operation summary, success rate, confidence distribution)
- [ ] T038 Set up daily monitoring routine (run daily monitoring query to check operation success rate, confidence scores, identify errors)

### Performance Validation

- [ ] T039 Measure end-to-end processing time for 10 test emails (verify SC-002: <30 seconds from email arrival to calendar event creation)
- [ ] T040 Validate extraction accuracy on 50 diverse emails (verify SC-003: 90%+ accurate date, time, title extraction)
- [ ] T041 Test duplicate detection with 30 duplicate email pairs (verify SC-005: 100% duplicate prevention rate)

### Documentation

- [ ] T042 Document production calendar workflow IDs in specs/002-calendar-management/IMPLEMENTATION-SUMMARY.md (record workflow names and IDs from n8n for future reference)
- [ ] T043 Update CLAUDE.md with calendar management feature (add calendar workflows to Active Technologies section)

---

## Task Summary

**Total Tasks**: 43
**Setup Phase**: 8 tasks
**Foundational Phase**: 0 tasks
**US1+US2 (P1 - MVP)**: 17 tasks
**US3 (P2)**: 4 tasks
**US4 (P3)**: 4 tasks
**Polish Phase**: 10 tasks

### MVP Delivery (US1+US2)

**Minimum Viable Product**: Complete T001-T025 (33 tasks total)
**Delivers**: Automatic calendar event creation from emails with enhanced AI classification
**Independent Value**: Users can send emails with meeting details and get calendar events automatically created
**Success Metrics**:
- SC-001: 95%+ calendar email classification accuracy
- SC-002: Event creation <30 seconds
- SC-003: 90%+ extraction accuracy
- SC-005: 100% duplicate prevention
- SC-006: Notifications <60 seconds

### Incremental Delivery Path

1. **MVP (T001-T025)**: Event creation + Enhanced AI = Core value delivery
2. **P2 Enhancement (T026-T029)**: Add event updates = Reduce manual maintenance
3. **P3 Enhancement (T030-T033)**: Add event cancellations = Complete automation
4. **Production Polish (T034-T043)**: Monitoring, performance validation, documentation

### Parallel Execution Optimization

**Maximum Parallel Tasks**: 7 tasks can run concurrently
- Setup Phase: T002, T003 (2 parallel)
- US1+US2 Phase: T009, T010, T011 (3 parallel), then T016-T022 (7 parallel)
- US3 Phase: T026, T027 (2 parallel)
- US4 Phase: T030, T031 (2 parallel)

### Testing Strategy

**Unit Tests**: Not applicable (n8n workflow-based implementation, no traditional code)
**Integration Tests**: T016-T024 (9 test scenarios covering MVP functionality)
**Performance Tests**: T039-T041 (3 validation tasks for success criteria)
**User Acceptance Test**: Run all test scenarios T016-T024 in production for 7 days

---

## Implementation Notes

### n8n Workflow Implementation

**All tasks referencing workflow creation** (T009, T010, T011) should be implemented using n8n MCP tools:

```javascript
// Example for T009: Create Calendar-Event-Extraction-Workflow
const contract = require('./specs/002-calendar-management/contracts/calendar-event-extraction-workflow.json');

await mcp__n8n_mcp__n8n_create_workflow({
  name: "Calendar-Event-Extraction-Workflow",
  nodes: contract.nodes,
  connections: contract.connections
});
```

Alternatively, workflows can be created manually in n8n UI following the contract specifications.

### Database Implementation

**All database tasks** (T001-T004) should execute SQL from `data-model.md`:
- Connect to Supabase SQL Editor
- Execute CREATE TABLE statements
- Execute CREATE INDEX statements
- Execute CREATE TRIGGER statements
- Verify with SELECT queries

### Testing Implementation

**All test tasks** (T016-T024, T029, T033) should:
1. Send test email to Gmail inbox (use actual Gmail account configured in MVP)
2. Wait for Email-Processing-Main to poll (5-minute interval)
3. Verify classification in Supabase `classifications` table
4. Verify calendar event in Google Calendar
5. Verify database records in `calendar_events` and `calendar_operations`
6. Verify Telegram notification received

### Success Criteria Validation

**After MVP completion (T001-T025)**, validate against spec.md success criteria:

| Criteria | Target | Validation Task |
|----------|--------|-----------------|
| SC-001 | 95% classification accuracy | T023 |
| SC-002 | Event creation <30s | T039 |
| SC-003 | 90% extraction accuracy | T040 |
| SC-005 | 0 duplicates | T041 |
| SC-006 | Notifications <60s | T016 |
| SC-007 | 100% audit logging | T025 |
| SC-008 | <10% false positives | T022 |

---

## Next Steps

1. **Start with MVP**: Execute T001-T025 to deliver core value
2. **Validate MVP**: Run tests T016-T024 to ensure functionality
3. **Deploy MVP**: Execute T034-T036 to activate in production
4. **Monitor 7 days**: Use T037-T038 monitoring queries daily
5. **Decide on P2/P3**: Based on MVP success and user feedback, implement US3 and/or US4

---

## Risk Mitigation

**Risk**: Google Calendar API quota exceeded
**Mitigation**: Monitor daily API usage via Supabase calendar_operations count, implement rate limiting if approaching 1M/day limit

**Risk**: AI extraction accuracy below 90%
**Mitigation**: T012-T013 enhance AI prompts, T023 validates accuracy, adjust prompts based on failure patterns

**Risk**: Event matching false positives
**Mitigation**: T011 implements fuzzy matching with confidence thresholds, T029 validates update matching accuracy

**Risk**: Processing time exceeds 30 seconds
**Mitigation**: T039 validates performance, workflows designed with 6-12s target (50% buffer), optimize AI prompts if needed

---

## Rollback Plan

If critical issues arise during implementation:

1. **Database**: Do NOT drop calendar_events or calendar_operations tables (preserve data for analysis)
2. **Workflows**: Deactivate Calendar-Event-Extraction, Calendar-Operation, Event-Matching workflows
3. **Email-Processing-Main**: Restore from backup (T008) to remove calendar integration
4. **Document**: Create GitHub issue with error logs and reproduction steps
5. **Investigate**: Fix issues, re-test T016-T024, re-deploy

---

**Generated by**: `/speckit.tasks` command
**Constitution Compliance**: ✅ 100% n8n-native architecture, zero custom Python code
**Ready for**: `/speckit.implement` or manual execution of tasks
