# Feature Specification: Email Classification MVP

**Feature Branch**: `001-email-classification-mvp`
**Created**: 2025-11-15
**Status**: Draft
**Input**: User description: "create a basic MVP"

## Clarifications

### Session 2025-11-15

- Q: How long should classified email data and extracted information (names, amounts) be retained? → A: Retain all email data indefinitely for continuous learning and historical analysis
- Q: How should the system decide whether to send notifications via SMS or Telegram for high-priority emails? → A: Send all notifications only via Telegram to minimize SMS costs
- Q: Should the MVP include a mechanism for users to correct misclassifications and improve future accuracy? → A: Use fields in supabase to provide manual correction (supabase is the UI for the MVP)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Email Classification (Priority: P1)

As a busy email user, I receive new emails throughout the day that need to be categorized by subject (KIDS, ROBYN, WORK, FINANCIAL, SHOPPING, OTHER), urgency level (HIGH, MEDIUM, LOW), and required action type (FYI, RESPOND, TASK, PAYMENT, CALENDAR, NONE). The system automatically classifies each incoming email and stores the classification results so I can quickly understand what requires attention.

**Why this priority**: This is the foundation of the entire system. Without classification, no other automation can function. This delivers immediate value by eliminating manual email sorting.

**Independent Test**: Can be fully tested by sending test emails across different categories and verifying classification accuracy reaches 80%+ threshold. Delivers value by providing structured classification data even without subsequent automation.

**Acceptance Scenarios**:

1. **Given** a new email arrives from a school teacher, **When** the system processes it, **Then** it classifies as category=KIDS, urgency=MEDIUM, action=FYI, and stores results with confidence score
2. **Given** a new bill arrives from a utility company, **When** the system processes it, **Then** it classifies as category=FINANCIAL, urgency=MEDIUM, action=PAYMENT, and extracts amount and due date
3. **Given** a work email marked urgent arrives, **When** the system processes it, **Then** it classifies as category=WORK, urgency=HIGH, action=RESPOND, and stores with timestamp
4. **Given** a promotional shopping email arrives, **When** the system processes it, **Then** it classifies as category=SHOPPING, urgency=LOW, action=NONE, with high confidence

---

### User Story 2 - Automated Email Organization (Priority: P2)

As an email user, after my emails are classified, the system automatically applies appropriate Gmail labels to organize them, marks low-value FYI emails as read to reduce clutter, archives emails that don't need action, and keeps action-required emails unread so I know what needs my attention.

**Why this priority**: Builds on classification to deliver tangible inbox organization. Users immediately see a cleaner, more organized inbox without manual filing.

**Independent Test**: Can be tested by verifying Gmail label application, read/unread status changes, and archive actions match classification results. Delivers value by reducing inbox clutter by 60%+.

**Acceptance Scenarios**:

1. **Given** an email classified as category=KIDS, urgency=LOW, action=FYI, **When** organization runs, **Then** Gmail label "KIDS" is applied, email is marked read, and remains in inbox
2. **Given** an email classified as category=SHOPPING, urgency=LOW, action=NONE, **When** organization runs, **Then** Gmail label "SHOPPING" is applied, email is marked read, and email is archived
3. **Given** an email classified as category=WORK, urgency=HIGH, action=RESPOND, **When** organization runs, **Then** Gmail label "WORK" is applied, email remains unread, and stays in inbox
4. **Given** an email classified as category=FINANCIAL, urgency=MEDIUM, action=PAYMENT, **When** organization runs, **Then** Gmail label "FINANCIAL" is applied, email remains unread, and stays in inbox

---

### User Story 3 - High-Priority Notifications (Priority: P3)

As an email user, when high-urgency emails or action-required emails (PAYMENT, CALENDAR, RESPOND) arrive, I receive immediate notifications via Telegram so I can respond promptly to time-sensitive matters. The system respects quiet hours and logs all notifications sent.

**Why this priority**: Ensures critical emails don't get missed even when not actively checking inbox. Provides peace of mind that urgent matters will be surfaced immediately.

**Independent Test**: Can be tested by sending high-priority test emails and verifying notifications are delivered within 2 minutes via configured channels. Delivers value by eliminating missed urgent emails.

**Acceptance Scenarios**:

1. **Given** an email classified as urgency=HIGH arrives at 2pm, **When** notification system processes it, **Then** Telegram notification is sent within 2 minutes with email subject and sender
2. **Given** an email with action=PAYMENT arrives at 10am, **When** notification system processes it, **Then** Telegram notification is sent with payment amount and due date
3. **Given** an email with urgency=HIGH arrives at 11pm during quiet hours (10pm-7am), **When** notification system processes it, **Then** Telegram notification is queued and sent at 7am
4. **Given** any notification is sent, **When** notification completes, **Then** entry is logged in notification_log with timestamp, channel, email_id, and delivery status

---

### User Story 4 - Manual Classification Correction (Priority: P4)

As a system operator reviewing classifications in Supabase, I can manually correct misclassified emails by updating category, urgency, and action fields directly in the database so the system can learn from these corrections and improve future accuracy.

**Why this priority**: Enables continuous improvement of classification accuracy over time. Using Supabase as the UI keeps MVP simple without requiring custom correction interface.

**Independent Test**: Can be tested by manually updating classification fields in Supabase and verifying corrections are logged and can be queried for learning analysis. Delivers value by creating correction dataset for future model improvements.

**Acceptance Scenarios**:

1. **Given** an email was incorrectly classified as category=SHOPPING, **When** operator updates category to WORK in Supabase, **Then** correction is logged with timestamp and original values preserved
2. **Given** an email urgency was misclassified as LOW, **When** operator updates urgency to HIGH in Supabase, **Then** system logs the correction for future learning analysis
3. **Given** multiple corrections exist for similar email patterns, **When** operator queries correction logs, **Then** system provides aggregated view of common misclassification patterns

---

### User Story 5 - Audit Logging and Error Handling (Priority: P5)

As a system operator, all email processing activities including classifications, label applications, notifications, archives, errors, and manual corrections are logged to an audit trail so I can troubleshoot issues, track system performance, and ensure no emails are lost. The system retries transient failures and fails gracefully when errors occur.

**Why this priority**: Essential for system reliability and debugging, but doesn't directly impact user experience. Critical for long-term maintainability.

**Independent Test**: Can be tested by processing emails and verifying all actions are logged, then simulating failures and verifying retry logic and error storage. Delivers value by ensuring system reliability.

**Acceptance Scenarios**:

1. **Given** an email is successfully classified, **When** processing completes, **Then** audit log contains classification results, timestamp, confidence score, and processing duration
2. **Given** Gmail API returns temporary network error, **When** label application fails, **Then** system retries 3 times with exponential backoff before logging error
3. **Given** classification fails due to malformed email content, **When** error occurs, **Then** system logs error with email_id, error message, error JSON, and continues processing next email
4. **Given** notification delivery fails, **When** error occurs, **Then** system logs failure in notification_log with error details and queues for retry

---

### Edge Cases

- What happens when an email cannot be classified with sufficient confidence (score < 0.6)? System should classify as category=OTHER, urgency=MEDIUM, action=FYI with low confidence flag for manual review.
- How does the system handle emails with multiple categories (e.g., work email about kids)? System selects primary category based on dominant content and logs secondary categories in metadata.
- What happens when Gmail API rate limits are reached? System implements exponential backoff and queues operations for retry within rate limit windows.
- How does the system handle very long emails (>10,000 characters)? System processes first 5,000 characters for classification and logs truncation flag.
- What happens when Telegram notification fails repeatedly? System logs failure after 3 retry attempts and falls back to email notification.
- How does the system handle duplicate emails? System checks email message_id and skips processing if already classified within 24 hours.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST classify every incoming email into one of six categories: KIDS, ROBYN, WORK, FINANCIAL, SHOPPING, OTHER
- **FR-002**: System MUST assign urgency level (HIGH, MEDIUM, LOW) to every classified email
- **FR-003**: System MUST assign action type (FYI, RESPOND, TASK, PAYMENT, CALENDAR, NONE) to every classified email
- **FR-004**: System MUST extract names, dates, and monetary amounts from email content when present
- **FR-005**: System MUST output confidence score (0.0 to 1.0) for every classification
- **FR-006**: System MUST store classification results in structured format with email metadata (message_id, sender, subject, timestamp)
- **FR-007**: System MUST apply Gmail labels matching the classified category to each email
- **FR-008**: System MUST mark emails with action=FYI as read in Gmail
- **FR-009**: System MUST archive emails with urgency=LOW and action=NONE in Gmail
- **FR-010**: System MUST keep emails with action in [RESPOND, TASK, PAYMENT, CALENDAR] as unread in Gmail
- **FR-011**: System MUST send notification via Telegram when email has urgency=HIGH
- **FR-012**: System MUST send notification via Telegram when email has action in [PAYMENT, CALENDAR, RESPOND]
- **FR-013**: System MUST respect quiet hours (10pm-7am) and queue notifications for delivery at 7am
- **FR-014**: System MUST log all notifications sent with timestamp, channel, email_id, and delivery status
- **FR-015**: System MUST log all classification decisions with email_id, category, urgency, action, confidence, and timestamp
- **FR-016**: System MUST log all label applications, archive actions, and read status changes with email_id and timestamp
- **FR-017**: System MUST retry transient failures (network errors, temporary API errors) up to 3 times with exponential backoff
- **FR-018**: System MUST log all errors with email_id, error message, error details in JSON format, and timestamp
- **FR-019**: System MUST continue processing subsequent emails when individual email processing fails
- **FR-020**: System MUST process emails within 10 seconds per email on average
- **FR-021**: System MUST handle up to 500 emails per day without degradation
- **FR-022**: System MUST retain all email data (metadata, body content, classifications, extracted information) indefinitely to support continuous learning and historical analysis
- **FR-023**: System MUST support manual correction of classification fields (category, urgency, action) via direct Supabase database updates
- **FR-024**: System MUST log all manual corrections with timestamp, original values, corrected values, and operator identifier for learning analysis
- **FR-025**: System MUST preserve original classification values when corrections are made to enable comparison and model improvement

### Key Entities

- **Email**: Represents an email message with attributes: message_id (unique identifier), sender, recipient, subject, body, received_timestamp, thread_id, labels
- **Classification**: Represents classification results with attributes: email_id (foreign key), category (enum: KIDS/ROBYN/WORK/FINANCIAL/SHOPPING/OTHER), urgency (enum: HIGH/MEDIUM/LOW), action (enum: FYI/RESPOND/TASK/PAYMENT/CALENDAR/NONE), confidence_score (float 0-1), extracted_names (array), extracted_dates (array), extracted_amounts (array), classified_timestamp, original_category (nullable, set when manually corrected), original_urgency (nullable), original_action (nullable), corrected_timestamp (nullable), corrected_by (nullable)
- **EmailAction**: Represents actions taken with attributes: email_id (foreign key), action_type (enum: LABEL_APPLIED/MARKED_READ/ARCHIVED), action_details (JSON), action_timestamp, success_status
- **Notification**: Represents sent notifications with attributes: email_id (foreign key), channel (TELEGRAM), recipient, message_content, sent_timestamp, delivery_status, retry_count, error_message
- **CorrectionLog**: Represents manual classification corrections with attributes: email_id (foreign key), field_name (enum: CATEGORY/URGENCY/ACTION), original_value, corrected_value, correction_timestamp, corrected_by, correction_reason (optional text)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Email classification accuracy reaches 80% or higher when measured against manual review of 100 test emails
- **SC-002**: High-priority notifications are delivered within 2 minutes of email arrival 95% of the time
- **SC-003**: System processes each email in under 10 seconds on average
- **SC-004**: System successfully handles 500 emails per day without errors or performance degradation
- **SC-005**: Inbox clutter reduces by 60% or more as measured by number of unread emails after one week of operation
- **SC-006**: Zero time-sensitive emails (urgency=HIGH or action=PAYMENT/CALENDAR) are missed or misclassified
- **SC-007**: All email processing activities are logged with 100% audit trail coverage for debugging and analysis
- **SC-008**: System achieves 99% uptime during business hours (7am-10pm) with graceful error handling
- **SC-009**: Manual corrections are successfully logged and queryable within Supabase for 100% of correction events

### Assumptions

- Gmail API access is available with sufficient quota for 500 emails/day
- Telegram Bot API is configured and operational (SMS provider not required for MVP)
- User's email patterns are relatively consistent (similar categories, volumes, and formats over time)
- Email content is primarily in English for classification accuracy targets
- Quiet hours preference is 10pm-7am in user's local timezone
- Confidence threshold of 0.6 is acceptable for classification decisions (below this, manual review recommended)
- Storage capacity in Supabase is sufficient for indefinite retention with growth planning for multi-year email archives
- User has created Gmail labels for all six categories (KIDS, ROBYN, WORK, FINANCIAL, SHOPPING, OTHER) or system has permission to create them
- Data retention complies with user's privacy requirements and email provider terms of service
- Operators have direct access to Supabase database for manual corrections (no custom correction UI required for MVP)
- Correction workflows use Supabase native UI and database triggers for logging
