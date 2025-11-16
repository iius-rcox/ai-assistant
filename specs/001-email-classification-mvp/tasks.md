# Tasks: Email Classification MVP

**Input**: Design documents from `/specs/001-email-classification-mvp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Implementation Approach**: n8n MCP-based programmatic workflow generation (not manual UI creation)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is an n8n workflow-based system with NO traditional source code structure. Workflows are generated programmatically using n8n MCP tools and exported to `contracts/` directory as JSON.

---

## Phase 1: Setup (Infrastructure & Prerequisites)

**Purpose**: Set up external services, credentials, and prerequisites before workflow creation

**Note**: Supabase project already exists at https://supabase.com/dashboard/project/xmziovusqlmgygcrgyqt

- [ ] T001 Execute SQL schema from specs/001-email-classification-mvp/data-model.md in Supabase SQL Editor (project: xmziovusqlmgygcrgyqt)
- [ ] T002 Verify all 7 Supabase tables created: emails, classifications, email_actions, notifications, correction_logs, email_embeddings, system_config
- [ ] T003 Verify pgvector extension enabled in Supabase project xmziovusqlmgygcrgyqt
- [ ] T004 Enable Gmail API in Google Cloud Console and create OAuth2 credentials
- [ ] T005 Create Gmail labels: KIDS, ROBYN, WORK, FINANCIAL, SHOPPING, OTHER
- [ ] T006 Create OpenAI API key and verify GPT-4 and text-embedding-ada-002 access
- [ ] T007 Create Telegram bot via BotFather and obtain bot token
- [ ] T008 Get Telegram chat ID by messaging bot and calling getUpdates API
- [ ] T009 [P] Configure n8n instance (cloud or self-hosted) and obtain API credentials
- [ ] T010 [P] Configure n8n credential: Gmail OAuth2 API with OAuth flow completion
- [ ] T011 [P] Configure n8n credential: OpenAI API with API key
- [ ] T012 [P] Configure n8n credential: Supabase API for project xmziovusqlmgygcrgyqt using existing service_role key from .env
- [ ] T013 [P] Configure n8n credential: Telegram API with bot token
- [ ] T014 Create test email dataset in specs/001-email-classification-mvp/test-data/test-emails-100.json with labeled examples
- [ ] T015 Verify .env file contains Supabase credentials (SUPABASE_URL, SUPABASE_SERVICE_KEY) and n8n configuration

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Set up n8n MCP connection and discover required nodes before workflow creation

- [ ] T016 Configure environment variables for n8n MCP access (N8N_API_BASE_URL, N8N_API_KEY)
- [ ] T017 Test n8n MCP connection using mcp__n8n-mcp__n8n_health_check
- [ ] T018 Discover Gmail nodes using mcp__n8n-mcp__search_nodes with query="gmail" and includeExamples=true
- [ ] T019 Get AI Agent node documentation using mcp__n8n-mcp__get_node_documentation with nodeType="nodes-langchain.agent"
- [ ] T020 Get Supabase Vector Store essentials using mcp__n8n-mcp__get_node_essentials with nodeType="nodes-langchain.vectorStoreSupabase" and includeExamples=true
- [ ] T021 Get OpenAI Chat Model essentials using mcp__n8n-mcp__get_node_essentials with nodeType="nodes-langchain.lmChatOpenAi"
- [ ] T022 Get Embeddings OpenAI node info using mcp__n8n-mcp__get_node_info with nodeType="nodes-langchain.embeddingsOpenAi"
- [ ] T023 Get Telegram node documentation using mcp__n8n-mcp__get_node_documentation with nodeType="nodes-base.telegram"
- [ ] T024 Validate OpenAI Chat Model config using mcp__n8n-mcp__validate_node_operation with temperature=0.4, maxTokens=500
- [ ] T025 Search n8n templates for similar workflows using mcp__n8n-mcp__search_templates with query="gmail classification"

---

## Phase 3: User Story 1 - Automatic Email Classification (Priority P1)

**User Story Goal**: Automatically classify incoming emails into 6 categories with urgency and action types

**Independent Test**: Send test emails across different categories and verify classification accuracy reaches 80%+ threshold

**Dependencies**: Phase 1 (Setup), Phase 2 (Foundational) must complete first

### Classification Workflow Creation

- [x] T026 [US1] Create Classification-Workflow using mcp__n8n-mcp__n8n_create_workflow (ID: MVkAVroogGQA6ePC)
- [x] T027 [US1] Configure Start node "When called by another workflow" (executeWorkflowTrigger)
- [x] T028 [US1] Configure Code node "Extract Text" to get subject + first 500 words from email body
- [x] T029 [US1] Configure Embeddings OpenAI node with text-embedding-ada-002 model
- [x] T030 [US1] Configure AI Agent node with OpenAI Chat Model (GPT-4, temp=0.4, maxTokens=500)
- [x] T031 [US1] Add classification system prompt to AI Agent with category definitions and JSON schema
- [x] T032 [US1] Connect Supabase Vector Store "Similar Emails Tool" to AI Agent (retrieve-as-tool mode, top 5, similarity 0.7)
- [x] T033 [US1] Configure Structured Output Parser node with classification JSON schema
- [x] T034 [US1] Configure Code node "Validate Classification" to format classification output
- [x] T035 [US1] Configure Supabase node "Insert Classification" to create row in classifications table
- [x] T036 [US1] Skipped: Default Data Loader not needed (embeddings handled by Vector Store)
- [x] T037 [US1] Skipped: Vector Store insert not needed in this workflow (will add to main workflow)
- [x] T038 [US1] Set up all node connections per workflow architecture
- [x] T039 [US1] Validate Classification-Workflow using mcp__n8n-mcp__validate_workflow
- [ ] T040 [US1] Auto-fix any workflow issues using mcp__n8n-mcp__n8n_autofix_workflow with confidenceThreshold="medium"
- [ ] T041 [US1] Export Classification-Workflow JSON to specs/001-email-classification-mvp/contracts/classification-workflow.json
- [ ] T042 [US1] Test Classification-Workflow with sample email: school teacher message (expected: KIDS, MEDIUM, FYI)
- [ ] T043 [US1] Test Classification-Workflow with sample email: utility bill (expected: FINANCIAL, MEDIUM, PAYMENT)
- [ ] T044 [US1] Test Classification-Workflow with sample email: urgent work email (expected: WORK, HIGH, RESPOND)
- [ ] T045 [US1] Test Classification-Workflow with sample email: shopping promotion (expected: SHOPPING, LOW, NONE)
- [ ] T046 [US1] Verify classification results stored in Supabase classifications table
- [ ] T047 [US1] Verify email embeddings stored in Supabase email_embeddings table
- [ ] T048 [US1] Run classification accuracy test with 100-email labeled dataset from test-data/
- [ ] T049 [US1] Verify classification accuracy >= 80% threshold per success criteria SC-001
- [ ] T050 [US1] Document Classification-Workflow node count (must be <50 per constitution)

**US1 Acceptance**: Classification workflow operational, 80%+ accuracy on test set, all nodes n8n-native

---

## Phase 4: User Story 2 - Automated Email Organization (Priority P2)

**User Story Goal**: Apply Gmail labels, mark emails read/unread, and archive based on classification

**Independent Test**: Verify Gmail label application, read/unread status changes, and archive actions match classification results

**Dependencies**: US1 (Classification must work first)

### Organization Workflow Creation

- [ ] T051 [US2] Create Organization-Workflow using mcp__n8n-mcp__n8n_create_workflow with nodes per contracts/workflow-structure.md section 3
- [ ] T052 [US2] Configure Start node to receive email_id and classification from main workflow
- [ ] T053 [US2] Configure Gmail "Add Label" node to apply category label (KIDS, ROBYN, WORK, FINANCIAL, SHOPPING, OTHER)
- [ ] T054 [US2] Configure Supabase node to log LABEL_APPLIED action to email_actions table
- [ ] T055 [US2] Configure Switch node "Check Action Type" to branch based on classification.action field
- [ ] T056 [US2] Configure Gmail "Mark as Read" node for action=FYI branch
- [ ] T057 [US2] Configure Supabase node to log MARKED_READ action
- [ ] T058 [US2] Configure Gmail "Archive Message" node for urgency=LOW AND action=NONE branch
- [ ] T059 [US2] Configure Supabase node to log ARCHIVED action
- [ ] T060 [US2] Configure no-op path for action in (RESPOND, TASK, PAYMENT, CALENDAR) to keep unread
- [ ] T061 [US2] Configure Merge node to combine all Switch branches
- [ ] T062 [US2] Configure error handling nodes with 3 retries and exponential backoff
- [ ] T063 [US2] Set up node connections in Organization-Workflow per workflow-structure.md
- [ ] T064 [US2] Validate Organization-Workflow using mcp__n8n-mcp__validate_workflow
- [ ] T065 [US2] Auto-fix any issues using mcp__n8n-mcp__n8n_autofix_workflow
- [ ] T066 [US2] Export Organization-Workflow JSON to specs/001-email-classification-mvp/contracts/organization-workflow.json
- [ ] T067 [US2] Test Organization-Workflow: KIDS + LOW + FYI → label applied, marked read, inbox
- [ ] T068 [US2] Test Organization-Workflow: SHOPPING + LOW + NONE → label applied, marked read, archived
- [ ] T069 [US2] Test Organization-Workflow: WORK + HIGH + RESPOND → label applied, unread, inbox
- [ ] T070 [US2] Test Organization-Workflow: FINANCIAL + MEDIUM + PAYMENT → label applied, unread, inbox
- [ ] T071 [US2] Verify email_actions table logs all Gmail operations
- [ ] T072 [US2] Test Gmail API rate limit handling with exponential backoff
- [ ] T073 [US2] Verify inbox clutter reduction target (60%+) with 50-email test batch
- [ ] T074 [US2] Document Organization-Workflow node count (must be <50 per constitution)

**US2 Acceptance**: Organization workflow operational, Gmail actions match classification, 60%+ clutter reduction

---

## Phase 5: User Story 3 - High-Priority Notifications (Priority P3)

**User Story Goal**: Send Telegram notifications for high-urgency and action-required emails with quiet hours support

**Independent Test**: Send high-priority test emails and verify notifications delivered within 2 minutes

**Dependencies**: US1 (needs classification data)

### Notification Workflow Creation

- [ ] T075 [US3] Create Notification-Workflow using mcp__n8n-mcp__n8n_create_workflow with nodes per contracts/workflow-structure.md section 4
- [ ] T076 [US3] Configure Start node to receive email_id and classification
- [ ] T077 [US3] Configure Switch node "Check Priority" to filter urgency=HIGH OR action in (PAYMENT, CALENDAR, RESPOND)
- [ ] T078 [US3] Configure Code node "Check Quiet Hours" with logic from workflow-structure.md to detect 10pm-7am window
- [ ] T079 [US3] Configure Supabase node "Insert Notification (QUEUED)" for quiet hours with scheduled_for=7am
- [ ] T080 [US3] Configure Telegram "Get Chat" node to verify bot access
- [ ] T081 [US3] Configure Code node "Format Message" to build notification text with emoji, subject, sender, action, Gmail link
- [ ] T082 [US3] Configure Telegram "Send Message" node with chat_id and formatted message
- [ ] T083 [US3] Configure Supabase node "Insert Notification (SENT)" to log successful delivery
- [ ] T084 [US3] Configure error handler to retry Telegram failures 3 times then log FAILED status
- [ ] T085 [US3] Set up node connections in Notification-Workflow per workflow-structure.md
- [ ] T086 [US3] Validate Notification-Workflow using mcp__n8n-mcp__validate_workflow
- [ ] T087 [US3] Auto-fix any issues using mcp__n8n-mcp__n8n_autofix_workflow
- [ ] T088 [US3] Export Notification-Workflow JSON to specs/001-email-classification-mvp/contracts/notification-workflow.json
- [ ] T089 [US3] Test Notification-Workflow: urgency=HIGH at 2pm → Telegram message within 2 minutes
- [ ] T090 [US3] Test Notification-Workflow: action=PAYMENT at 10am → Telegram message with amount and due date
- [ ] T091 [US3] Test Notification-Workflow: urgency=HIGH at 11pm → notification queued, not sent
- [ ] T092 [US3] Test quiet hours: verify notification QUEUED in Supabase with scheduled_for=7am
- [ ] T093 [US3] Verify notification delivery time <2 minutes for 95% of test cases (SC-002)
- [ ] T094 [US3] Test Telegram Bot API failure handling with retry logic
- [ ] T095 [US3] Verify notifications table logs all delivery attempts
- [ ] T096 [US3] Document Notification-Workflow node count (must be <50 per constitution)

### Scheduled Notification Workflow

- [ ] T097 [US3] Create Send-Queued-Notifications workflow using mcp__n8n-mcp__n8n_create_workflow
- [ ] T098 [US3] Configure Schedule Trigger with cron: "0 7 * * *" (7:00 AM daily)
- [ ] T099 [US3] Configure Supabase query for notifications WHERE delivery_status='QUEUED' AND scheduled_for <= NOW()
- [ ] T100 [US3] Configure Loop node to process each queued notification
- [ ] T101 [US3] Configure Telegram "Send Message" node inside loop
- [ ] T102 [US3] Configure Supabase update to set delivery_status='SENT' after success
- [ ] T103 [US3] Configure error handler to set delivery_status='FAILED' and log error
- [ ] T104 [US3] Validate Send-Queued-Notifications workflow using mcp__n8n-mcp__validate_workflow
- [ ] T105 [US3] Export Send-Queued-Notifications JSON to specs/001-email-classification-mvp/contracts/send-queued-notifications.json
- [ ] T106 [US3] Test scheduled workflow: queue notification at 11pm, verify sent at 7am next day

**US3 Acceptance**: Notification workflow operational, <2 min delivery, quiet hours respected

---

## Phase 6: User Story 4 - Manual Classification Correction (Priority P4)

**User Story Goal**: Enable manual correction of misclassifications via Supabase with automatic logging

**Independent Test**: Manually update classification fields in Supabase and verify corrections logged

**Dependencies**: US1 (needs classification data to correct)

### Correction Logging Setup

- [ ] T107 [US4] Verify Supabase database trigger "log_classification_correction" is active from data-model.md schema
- [ ] T108 [US4] Test database trigger: Update classifications.category and verify correction_logs entry created
- [ ] T109 [US4] Test database trigger: Verify original_category field populated on first correction
- [ ] T110 [US4] Test database trigger: Verify corrected_timestamp and corrected_by fields populated
- [ ] T111 [US4] Create Supabase view for aggregated corrections query from data-model.md
- [ ] T112 [US4] Test correction workflow: Incorrectly classified SHOPPING → correct to WORK in Supabase
- [ ] T113 [US4] Verify correction logged in correction_logs with field_name=CATEGORY, original_value=SHOPPING, corrected_value=WORK
- [ ] T114 [US4] Test urgency correction: LOW → HIGH, verify logged
- [ ] T115 [US4] Test action correction: FYI → RESPOND, verify logged
- [ ] T116 [US4] Query correction_logs for common misclassification patterns
- [ ] T117 [US4] Verify 100% correction logging success rate (SC-009)
- [ ] T118 [US4] Document correction procedure in quickstart.md operational section

**US4 Acceptance**: Database triggers log all corrections, queries provide learning insights

---

## Phase 7: User Story 5 - Audit Logging and Error Handling (Priority P5)

**User Story Goal**: Comprehensive audit trail for all email processing activities with retry logic

**Independent Test**: Process emails and verify all actions logged, simulate failures and verify retry

**Dependencies**: US1, US2, US3 (logs their activities)

### Main Email Processing Workflow

- [ ] T119 [US5] Create Email-Processing-Main workflow using mcp__n8n-mcp__n8n_create_workflow with nodes per contracts/workflow-structure.md section 1
- [ ] T120 [US5] Configure Gmail Trigger node with poll interval=5 minutes, filter="is:unread in:inbox"
- [ ] T121 [US5] Configure Gmail "Get Message" node to retrieve full email content
- [ ] T122 [US5] Configure Code node "Check Duplicate" to query Supabase for existing message_id
- [ ] T123 [US5] Configure Supabase "Insert Email" node to store email record in emails table
- [ ] T124 [US5] Configure Execute Workflow node to call Classification-Workflow
- [ ] T125 [US5] Configure Execute Workflow node to call Organization-Workflow (conditional on classification success)
- [ ] T126 [US5] Configure Execute Workflow node to call Notification-Workflow (conditional on high priority)
- [ ] T127 [US5] Configure Supabase "Update Email Status" node to mark processing complete
- [ ] T128 [US5] Configure Code node "Log Completion" to calculate and log processing duration
- [ ] T129 [US5] Configure error handling: Continue on failure, log errors to Supabase
- [ ] T130 [US5] Configure retry logic: 3 attempts with exponential backoff for transient failures
- [ ] T131 [US5] Set up node connections in Email-Processing-Main per workflow-structure.md
- [ ] T132 [US5] Validate Email-Processing-Main using mcp__n8n-mcp__validate_workflow
- [ ] T133 [US5] Auto-fix any issues using mcp__n8n-mcp__n8n_autofix_workflow
- [ ] T134 [US5] Export Email-Processing-Main JSON to specs/001-email-classification-mvp/contracts/email-processing-main.json
- [ ] T135 [US5] Test end-to-end: Send test email, verify full pipeline executes (trigger → classify → organize → notify)
- [ ] T136 [US5] Verify processing time <10 seconds per email (SC-003)
- [ ] T137 [US5] Test Gmail API network error: Verify 3 retries with exponential backoff
- [ ] T138 [US5] Test malformed email: Verify error logged with email_id, error_message, error JSON
- [ ] T139 [US5] Test classification failure: Verify subsequent emails continue processing
- [ ] T140 [US5] Test notification failure: Verify logged in notifications table with error details
- [ ] T141 [US5] Verify 100% audit trail coverage: All classifications, actions, notifications, errors logged (SC-007)
- [ ] T142 [US5] Test duplicate email handling: Verify message_id check skips reprocessing within 24 hours
- [ ] T143 [US5] Test throughput: Verify 500 emails/day capacity without degradation (SC-004)
- [ ] T144 [US5] Verify 99% uptime during business hours (7am-10pm) with graceful error handling (SC-008)
- [ ] T145 [US5] Document Email-Processing-Main node count (must be <50 per constitution)

### Monitoring & Observability

- [ ] T146 [US5] Create Supabase saved queries from data-model.md monitoring section
- [ ] T147 [US5] Query: Classification accuracy by category (original vs corrected)
- [ ] T148 [US5] Query: Daily processing stats (total emails, avg confidence, low confidence count, corrections)
- [ ] T149 [US5] Query: Notification delivery performance (status, count, avg delivery seconds)
- [ ] T150 [US5] Set up weekly accuracy review dashboard query
- [ ] T151 [US5] Document monitoring queries in quickstart.md operational procedures section

**US5 Acceptance**: End-to-end pipeline operational, 100% audit trail, error handling tested

---

## Phase 8: Polish & Production Readiness

**Purpose**: Final testing, documentation, and deployment preparation

- [ ] T152 Configure all 5 workflows to use n8n credential vault (no hardcoded API keys)
- [ ] T153 Enable Supabase RLS policies for all tables per data-model.md
- [ ] T154 Test OAuth2 token refresh for Gmail API (simulate expired token)
- [ ] T155 Configure n8n error workflow for global error notifications
- [ ] T156 Set up Supabase daily automatic backups (7-day retention)
- [ ] T157 Create weekly manual backup procedure for critical tables
- [ ] T158 Configure Supabase alerts for error rate thresholds
- [ ] T159 Insert default system_config values in Supabase per data-model.md
- [ ] T160 Activate all 5 workflows in n8n instance
- [ ] T161 Verify Gmail Trigger polling starts successfully
- [ ] T162 Send final end-to-end test email and verify complete pipeline
- [ ] T163 Verify all success criteria met: 80%+ accuracy, <2 min delivery, <10s processing, 60%+ clutter reduction
- [ ] T164 Update quickstart.md with actual workflow IDs and deployment timestamps
- [ ] T165 Document operational procedures: daily ops, weekly review, manual corrections, troubleshooting
- [ ] T166 Tag Git repository with version: v1.0.0-mvp
- [ ] T167 Create rollback procedure documentation in quickstart.md
- [ ] T168 Schedule first weekly accuracy review meeting

---

## Dependencies & Execution Order

### Story Dependency Graph

```
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1 Classification)
                                              ↓
                                          Phase 4 (US2 Organization) [depends on US1]
                                              ↓
                                          Phase 5 (US3 Notifications) [depends on US1]
                                              ↓
                                          Phase 6 (US4 Corrections) [depends on US1]
                                              ↓
                                          Phase 7 (US5 Audit/Main) [depends on US1, US2, US3]
                                              ↓
                                          Phase 8 (Polish)
```

**Critical Path**: Setup → Foundational → US1 → US5 (main workflow integrates everything)

**Parallel Opportunities**:
- Within Setup (T009-T013): All credential configuration tasks
- US2, US3, US4 can be developed in parallel after US1 completes
- Test tasks within each user story can run in parallel

### MVP Scope Recommendation

**Minimum MVP** (Week 1):
- Phase 1: Setup
- Phase 2: Foundational
- Phase 3: US1 (Classification only)
- Phase 8: T152-T168 (Polish, subset for US1 only)

**Delivers**: Basic email classification with 80%+ accuracy, stores results in Supabase

**Full MVP** (Week 2):
- Add Phase 4: US2 (Organization)
- Add Phase 5: US3 (Notifications)
- Add Phase 7: US5 (Main workflow integration)

**Delivers**: Complete automation pipeline per PRD MVP scope

**Post-MVP** (Week 3+):
- Add Phase 6: US4 (Manual corrections for learning)
- Iterate on accuracy based on correction logs

---

## Parallel Execution Examples

### Phase 1 (Setup) Parallelization

Can run in parallel after T001-T003 (Supabase schema setup) completes:
- T004-T008 (External API setup)
- T009-T013 (n8n credential configuration)
- T014 (Test data creation)

### Phase 3 (US1) Parallelization

Cannot parallelize (sequential workflow creation), but testing can be parallel:
- T042-T045 (Classification tests) can run simultaneously
- T046-T047 (Verification) can run simultaneously after tests

### Cross-Story Parallelization

After US1 (Classification) completes, these can run in parallel:
- Phase 4: US2 (Organization workflow)
- Phase 5: US3 (Notification workflow)
- Phase 6: US4 (Correction setup)

---

## Implementation Strategy

**Approach**: Progressive enhancement with independent user stories

**Week 1** (Minimum MVP):
1. Complete Setup (Phase 1)
2. Complete Foundational (Phase 2)
3. Complete US1 Classification (Phase 3)
4. Test classification accuracy >= 80%
5. **Deliverable**: Working email classification system

**Week 2** (Full MVP):
6. Complete US2 Organization (Phase 4)
7. Complete US3 Notifications (Phase 5)
8. Complete US5 Main Workflow (Phase 7)
9. Test end-to-end pipeline
10. **Deliverable**: Complete automation per PRD MVP

**Week 3** (Learning & Iteration):
11. Complete US4 Corrections (Phase 6)
12. Collect correction data
13. Iterate on accuracy
14. **Deliverable**: Continuous improvement system

**Validation Gates**:
- After US1: 80%+ classification accuracy or block US2/US3
- After US2: 60%+ inbox clutter reduction or iterate
- After US3: <2 min notification delivery or investigate
- After US5: All success criteria met or fix before production

**Total Task Count**: 167 tasks
- Setup: 14 tasks (Supabase project pre-configured)
- Foundational: 10 tasks
- US1 (Classification): 25 tasks
- US2 (Organization): 24 tasks
- US3 (Notifications): 32 tasks
- US4 (Corrections): 12 tasks
- US5 (Audit/Main): 33 tasks
- Polish: 17 tasks

**Estimated Timeline**: 2-3 weeks for Full MVP (based on PRD timeline)
