# Feature Specification: Email Actions V2

**Feature Branch**: `011-email-actions-v2`
**Created**: 2025-11-27
**Status**: Draft
**Input**: User description: "Introduce a refined action model for email processing across the classification UI and n8n workflow with six constrained actions: IGNORE, SHIPMENT, DRAFT_REPLY, JUNK, NOTIFY, and CALENDAR"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and Select Actions for Classified Emails (Priority: P1)

As a user reviewing classified emails in the correction UI, I want to see clear action options with explanatory context so I can understand what each action does and select the appropriate one for each email.

**Why this priority**: Core user interaction - the action system is only useful if users can understand and select actions. This enables all other action functionality.

**Independent Test**: Can be fully tested by loading the classification list, clicking an action dropdown, and verifying all six actions appear with descriptions. Delivers immediate value by replacing the old action system with the new constrained options.

**Acceptance Scenarios**:

1. **Given** I am viewing an email in the classification list, **When** I click the Action dropdown, **Then** I see six options (IGNORE, SHIPMENT, DRAFT_REPLY, JUNK, NOTIFY, CALENDAR) grouped by risk level
2. **Given** I hover over an action option, **When** I wait briefly, **Then** I see a tooltip explaining what that action does
3. **Given** I am viewing a non-shipment email, **When** I open the Action dropdown, **Then** the SHIPMENT option is visually disabled or unavailable
4. **Given** I select a new action for an email, **When** the selection completes, **Then** the action is saved and the row displays appropriate status indicators (bell icon for NOTIFY, calendar icon for CALENDAR, draft icon for DRAFT_REPLY)

---

### User Story 2 - Automated IGNORE Action for Low-Value Emails (Priority: P1)

As a user, I want the system to automatically mark low-value promotional emails as IGNORE so they are marked as read without cluttering my attention, reducing manual review effort.

**Why this priority**: Primary automation use case - reduces cognitive load by handling bulk promotional email automatically while maintaining safety (no deletion, just mark-as-read).

**Independent Test**: Send or inject a promotional email, verify the n8n workflow classifies it with confidence >85%, assigns IGNORE action, and marks the email as read without archiving or notifying.

**Acceptance Scenarios**:

1. **Given** a promotional email arrives, **When** the system classifies it with >85% confidence as low-value, **Then** the system automatically assigns IGNORE action
2. **Given** IGNORE action is assigned, **When** the workflow processes it, **Then** the email is marked as read but NOT archived and NO notification is sent
3. **Given** the system is uncertain about an email (confidence <85%), **When** selecting a default action, **Then** the system assigns IGNORE as the safe fallback action

---

### User Story 3 - NOTIFY Action for Important Emails (Priority: P1)

As a user, I want to receive Telegram notifications for important emails so I can be alerted to time-sensitive messages without constantly checking my inbox.

**Why this priority**: Critical for personal email management - ensures urgent items from family, kids' schools, and financial institutions are not missed.

**Independent Test**: Inject a HIGH urgency email from a KIDS category sender, verify Telegram notification is delivered with summary and action recommendation.

**Acceptance Scenarios**:

1. **Given** an email arrives with HIGH urgency, **When** confidence is >=85%, **Then** the system assigns NOTIFY action
2. **Given** an email is categorized as KIDS, ROBYN, or FINANCIAL, **When** confidence is >=85%, **Then** the system assigns NOTIFY action
3. **Given** NOTIFY action is assigned, **When** the workflow processes it, **Then** a Telegram message is sent containing the summary, urgency level, category, and recommended next action
4. **Given** an email is categorized as SHOPPING or promotional, **When** any action is assigned, **Then** NOTIFY is NOT automatically triggered

---

### User Story 4 - SHIPMENT Action for Package Tracking (Priority: P2)

As a user, I want shipment emails to be automatically parsed and tracked so I can see all my packages in one place without manually entering tracking information.

**Why this priority**: High-value enrichment feature that extracts actionable data from common email type, but not critical for basic functionality.

**Independent Test**: Inject an Amazon shipment notification email, verify tracking number, carrier, item names, and ETA are extracted and stored in the shipments table.

**Acceptance Scenarios**:

1. **Given** an email contains shipping/tracking information, **When** the system identifies it with >90% confidence, **Then** the system assigns SHIPMENT action
2. **Given** SHIPMENT action is assigned, **When** the workflow processes it, **Then** tracking number, carrier, item names, and estimated delivery date are extracted and saved
3. **Given** the system cannot extract shipment data reliably, **When** extraction fails, **Then** the system falls back to IGNORE action (never forces incomplete data)
4. **Given** I am viewing an email without detectable tracking information, **When** I open the Action dropdown, **Then** SHIPMENT option is unavailable/disabled

---

### User Story 5 - DRAFT_REPLY Action for Response Suggestions (Priority: P2)

As a user, I want the system to suggest reply drafts for emails requiring responses so I can review and send them quickly while maintaining control over outgoing communications.

**Why this priority**: Productivity enhancement that speeds up response time, but requires human review so not as critical as notification/ignore automation.

**Independent Test**: Inject an email containing a direct question from a human sender, verify a draft reply is generated and saved for review without being sent.

**Acceptance Scenarios**:

1. **Given** an email contains a direct question or request from a human sender, **When** confidence is >75%, **Then** the system may assign DRAFT_REPLY action
2. **Given** DRAFT_REPLY action is assigned, **When** the workflow processes it, **Then** a draft response is created and sent to the user via Telegram with three options: Send, Re-write, or Discard
3. **Given** the user selects "Send" on a draft in Telegram, **When** confirmed, **Then** the reply is sent via Gmail on the user's behalf
4. **Given** the user selects "Re-write" on a draft in Telegram, **When** they provide natural language instructions, **Then** the agent revises the draft and re-presents it for approval
5. **Given** the user selects "Discard" on a draft in Telegram, **When** confirmed, **Then** the draft is deleted and no reply is sent
6. **Given** DRAFT_REPLY action is selected in the UI, **When** a draft exists, **Then** a "View Draft" button/link is displayed for the user
7. **Given** confidence is <=75% for a potential reply scenario, **When** selecting action, **Then** DRAFT_REPLY requires manual user selection

---

### User Story 6 - CALENDAR Action for Event Extraction (Priority: P2)

As a user, I want emails containing dates or events to propose calendar entries so I never miss important appointments while maintaining control over my calendar.

**Why this priority**: Prevents missed events and appointments, but requires human confirmation so complexity is higher than basic automation.

**Independent Test**: Inject an email from a school (KIDS category) containing a date and event title, verify a tentative calendar event is created requiring confirmation.

**Acceptance Scenarios**:

1. **Given** an email contains an explicit date or deadline, **When** the category is KIDS, WORK, or FINANCIAL and confidence >=85%, **Then** the system may assign CALENDAR action
2. **Given** CALENDAR action is assigned, **When** the workflow processes it, **Then** a calendar event is created in Google Calendar with "Tentative" status
3. **Given** a tentative calendar event exists, **When** the user views it in Google Calendar, **Then** they can confirm, edit, or delete it using native calendar controls
4. **Given** CALENDAR action is selected in the UI, **When** a tentative event was created, **Then** a calendar badge indicates an event is pending user confirmation in Google Calendar

---

### User Story 7 - JUNK Action for Spam Management (Priority: P3)

As a user, I want obvious spam emails to be junked automatically while maintaining safeguards that prevent legitimate emails from being misclassified.

**Why this priority**: Lowest priority due to destructive nature - requires highest confidence thresholds and safelist matching. IGNORE handles most low-value emails safely.

**Independent Test**: Configure a sender domain on the blacklist, inject a spam email from that domain, verify it is marked read and archived with 99%+ confidence.

**Acceptance Scenarios**:

1. **Given** an email arrives from a blacklisted domain, **When** confidence is >=99%, **Then** the system may assign JUNK action
2. **Given** JUNK action is assigned, **When** the workflow processes it, **Then** the email is marked as read AND archived to junk folder
3. **Given** an email is from a financial, school, medical, or family sender, **When** any action is evaluated, **Then** JUNK action is NEVER automatically assigned
4. **Given** confidence is <99% for a potential junk email, **When** the system is uncertain, **Then** IGNORE is assigned as fallback (never JUNK)
5. **Given** JUNK action is displayed in the UI, **When** viewing the dropdown, **Then** it is visually styled as a destructive/high-risk action

---

### User Story 8 - Manage Junk SafeList and BlackList (Priority: P3)

As a user, I want to manage which senders and domains are trusted or blocked so I can fine-tune the JUNK action behavior without editing configuration files.

**Why this priority**: Supporting feature for JUNK action - provides user control but JUNK itself is P3, so this follows.

**Independent Test**: Open list management UI, add a domain to blacklist, verify future emails from that domain are eligible for JUNK action. Use row context menu to add sender to junk list.

**Acceptance Scenarios**:

1. **Given** I am viewing the correction-ui, **When** I navigate to list management, **Then** I see separate SafeList and BlackList sections with current entries
2. **Given** I am in list management, **When** I add a sender address or domain, **Then** it appears in the appropriate list immediately
3. **Given** I am viewing an email row, **When** I click the 3-dot menu, **Then** I see options: "Add sender to junk", "Add sender domain to junk", "Mark as not junk"
4. **Given** I select "Add sender to junk" from the row menu, **When** confirmed, **Then** the sender's email address is added to the blacklist
5. **Given** I select "Add sender domain to junk" from the row menu, **When** confirmed, **Then** the sender's domain is added to the blacklist
6. **Given** I select "Mark as not junk" for a junked email, **When** confirmed, **Then** the sender is added to the safelist and the email action is changed to IGNORE

---

### Edge Cases

- What happens when an email matches multiple action triggers (e.g., KIDS category with tracking info)? System uses priority: NOTIFY > CALENDAR > SHIPMENT > DRAFT_REPLY > IGNORE > JUNK
- How does the system handle emails from unknown senders not on any list? Default to IGNORE action
- What happens when the n8n workflow fails mid-processing? All state changes are logged for reversibility; email remains in original state
- How does the system prevent infinite loops between Supabase updates and n8n triggers? Supabase updates from n8n do not re-trigger ingestion workflows
- What happens when a user manually overrides an automated action? The manual selection takes precedence and is logged as a correction

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support exactly six action types: IGNORE, SHIPMENT, DRAFT_REPLY, JUNK, NOTIFY, CALENDAR
- **FR-002**: System MUST display actions in the UI grouped by risk level: Low-Risk (IGNORE), Enrichment (SHIPMENT, CALENDAR), Human Review Required (DRAFT_REPLY, NOTIFY), Destructive (JUNK)
- **FR-003**: System MUST show hover tooltips explaining each action's behavior in the dropdown
- **FR-004**: System MUST display status indicators on rows: bell icon for NOTIFY, calendar icon for CALENDAR pending events, draft icon for DRAFT_REPLY
- **FR-005**: System MUST enforce confidence thresholds before auto-assigning actions: IGNORE (>85%), SHIPMENT (>90%), DRAFT_REPLY (>75%), NOTIFY (>=85%), CALENDAR (>=85%), JUNK (>=99%)
- **FR-006**: System MUST use IGNORE as the fallback action when confidence is insufficient for other actions
- **FR-007**: System MUST disable/hide SHIPMENT action for emails without detected tracking information
- **FR-008**: System MUST prevent automatic JUNK assignment for emails from financial, school, medical, or family senders
- **FR-009**: System MUST NEVER send emails without explicit user approval via Telegram (DRAFT_REPLY presents Send/Re-write/Discard options)
- **FR-010**: System MUST create calendar events with "Tentative" status in Google Calendar; user confirms via native calendar app
- **FR-011**: System MUST log all actions, confidence scores, extracted fields, and final decisions
- **FR-012**: System MUST support action reversibility by retaining previous state in logs
- **FR-013**: System MUST prevent recursive triggers between Supabase updates and n8n workflow ingestion
- **FR-014**: NOTIFY action MUST send Telegram messages containing: summary, urgency, category, and recommended action
- **FR-015**: SHIPMENT action MUST extract and store: tracking number, carrier, item names, and ETA when available
- **FR-016**: CALENDAR action MUST extract: date/time, event title, and description from email content
- **FR-017**: DRAFT_REPLY action MUST send draft to Telegram with inline buttons for Send, Re-write, and Discard
- **FR-018**: DRAFT_REPLY Re-write option MUST accept natural language instructions and regenerate the draft using AI agent
- **FR-019**: System MUST provide a list management UI in correction-ui to view/add/remove SafeList and BlackList entries
- **FR-020**: Each email row MUST have a 3-dot context menu with options: "Add sender to junk", "Add sender domain to junk", "Mark as not junk"
- **FR-021**: "Mark as not junk" action MUST add sender to SafeList AND change the email's action to IGNORE

### Key Entities

- **Action**: The action type assigned to a classified email (one of six constrained values) with associated confidence threshold, triggers, and processing behavior
- **ActionLog**: Record of all action assignments and changes including timestamp, confidence score, extracted fields, previous state, and whether assignment was automatic or manual
- **Shipment**: Structured record containing tracking number, carrier name, item descriptions, estimated delivery date, and link to source email
- **Draft**: Generated reply draft awaiting human review, linked to source email with creation timestamp and approval status
- **CalendarEvent**: Proposed calendar entry created in Google Calendar with Tentative status, containing extracted date/time, title, description, Google Calendar event ID, and link to source email
- **SafeList/BlackList**: User-maintained lists of trusted and blocked sender domains/addresses used for JUNK action qualification

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify and select the appropriate action for an email within 5 seconds using the grouped dropdown and tooltips
- **SC-002**: 90% of promotional/low-value emails are automatically handled by IGNORE action without user intervention
- **SC-003**: 100% of NOTIFY actions result in Telegram delivery within 60 seconds of email arrival
- **SC-004**: Shipment tracking data extraction accuracy exceeds 95% for major carriers (USPS, UPS, FedEx, Amazon)
- **SC-005**: Zero emails are automatically deleted or sent without human confirmation
- **SC-006**: Zero calendar events become Active without explicit user approval
- **SC-007**: False positive rate for JUNK action is less than 0.1% (fewer than 1 in 1000 legitimate emails junked)
- **SC-008**: All action assignments are reversible by retrieving previous state from logs
- **SC-009**: Users report 50% reduction in time spent reviewing and acting on emails within 30 days of adoption

## Clarifications

### Session 2025-11-27

- Q: How should the system handle draft reply send workflow? → A: Draft is sent via Telegram with buttons to: send as-is, re-write (natural language instruction to agent), or discard
- Q: How should calendar event approval be handled? → A: Calendar event synced to Google Calendar as "Tentative" status; user confirms directly in calendar app
- Q: How should users manage safelist/blacklist? → A: Simple UI in correction-ui plus contextual row actions (3-dot menu) with: "Add sender to junk", "Add sender domain to junk", "Mark as not junk"

## Assumptions

- Existing n8n Classification-Workflow and correction-ui infrastructure are functional and can be extended
- Telegram bot integration is already configured and working for notifications
- Google Calendar API access is available for calendar event creation
- Users have a single primary email account being monitored
- Safelist/blacklist management will use a simple list stored in Supabase (no complex rule engine)
- Draft replies will be stored in Supabase initially (Gmail Drafts folder integration is future enhancement)
