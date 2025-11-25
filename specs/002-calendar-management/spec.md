# Feature Specification: Enhanced Calendar Management

**Feature Branch**: `002-calendar-management`
**Created**: 2025-11-16
**Status**: Draft
**Input**: User description: "Update AI for better calendar handling and add calendar creation and modification capabilities"

## Clarifications

### Session 2025-11-16

- Q: What confidence score threshold should trigger manual review for ambiguous calendar operations (FR-012)? → A: 70% - Standard AI confidence threshold (industry best practice)
- Q: When the AI extracts a date but no specific time from an email (e.g., "meeting on Friday"), what default event duration should be created? → A: All-day event - Mark as all-day when time is missing
- Q: When an email contains multiple distinct appointment requests in the same message (e.g., "Dentist appointment Monday at 2pm and also haircut Wednesday 10am"), how should the system handle this? → A: Create all events - Extract and create calendar events for all detected appointments
- Q: When a Google Calendar event is deleted (either by the system due to cancellation or manually by the user), what should happen to the corresponding calendar_events record in Supabase? → A: Mark deleted, retain record - Update status to 'deleted' and keep record for audit trail (respects 90-day retention)
- Q: When email processing is delayed (e.g., system downtime) and a relative date like "tomorrow" becomes stale (the email was received 2 days ago but is being processed now), how should the system handle this? → A: Flag for manual review - When processing delay >24 hours, flag relative dates for user confirmation

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Calendar Event Creation from Emails (Priority: P1)

When I receive an email marked with action=CALENDAR, the system automatically extracts event details (title, date, time, location, attendees) from the email content and creates a Google Calendar event without requiring manual intervention.

**Why this priority**: This is the core feature that delivers immediate time savings by eliminating manual calendar event creation. It builds directly on the existing CALENDAR action classification from the MVP.

**Independent Test**: Can be fully tested by sending a test email with meeting details (e.g., "Team meeting tomorrow at 2pm in Conference Room A"), verifying the email gets classified with action=CALENDAR, and confirming a corresponding Google Calendar event is created with the correct details.

**Acceptance Scenarios**:

1. **Given** an email arrives with meeting details in body, **When** AI classifies it with action=CALENDAR, **Then** system creates Google Calendar event with extracted title, date, time, and location
2. **Given** an email contains multiple attendee email addresses, **When** calendar event is created, **Then** all attendees are added to the event invite
3. **Given** calendar event creation succeeds, **When** processing completes, **Then** email is marked as processed and user receives confirmation notification
4. **Given** event details are ambiguous or incomplete, **When** AI attempts extraction, **Then** system flags event for manual review and notifies user

---

### User Story 2 - Enhanced AI Context for Calendar Events (Priority: P1)

The AI classification agent has improved understanding of calendar-related content, including meeting invitations, schedule changes, event confirmations, and cancellations, enabling more accurate CALENDAR action detection and better event detail extraction.

**Why this priority**: Accurate classification is the foundation for automatic event creation. Without precise calendar event detection, the system may miss events or create incorrect entries.

**Independent Test**: Can be tested by sending 20 diverse calendar-related emails (meeting requests, reschedules, cancellations, confirmations from different platforms like Zoom, Google Meet, Microsoft Teams) and verifying the AI correctly identifies all as action=CALENDAR with 95%+ accuracy.

**Acceptance Scenarios**:

1. **Given** email contains meeting invitation language ("join us", "scheduled for", "meeting at"), **When** AI analyzes content, **Then** email is classified with action=CALENDAR
2. **Given** email is a calendar event update or reschedule, **When** AI analyzes content, **Then** system identifies it as calendar-related and extracts both old and new event details
3. **Given** email is a cancellation notice, **When** AI processes it, **Then** system marks action=CALENDAR and flags event for deletion or update
4. **Given** email contains event confirmation link (Zoom, Google Meet, Teams), **When** AI extracts details, **Then** meeting URL is included in calendar event description

---

### User Story 3 - Calendar Event Modification and Updates (Priority: P2)

When I receive an email about rescheduling or updating an existing calendar event, the system identifies the original event in Google Calendar and automatically applies the changes (new time, location, or attendee list).

**Why this priority**: This completes the calendar automation workflow by handling updates and changes, reducing manual calendar maintenance. It's P2 because event creation (P1) delivers value independently.

**Independent Test**: Can be tested by creating a calendar event via email, then sending a follow-up email with schedule changes, and verifying the original event is updated with new details rather than creating a duplicate.

**Acceptance Scenarios**:

1. **Given** existing calendar event created from previous email, **When** update email arrives with new time, **Then** system finds original event and updates time without creating duplicate
2. **Given** reschedule email references original meeting (by subject or thread), **When** AI processes update, **Then** system correctly identifies event to modify
3. **Given** event modification involves adding/removing attendees, **When** update is processed, **Then** attendee list is updated and notifications sent to affected parties
4. **Given** system cannot confidently match update to existing event, **When** ambiguity detected, **Then** user is notified for manual confirmation before applying changes

---

### User Story 4 - Calendar Event Deletion and Cancellations (Priority: P3)

When I receive a cancellation notice for a scheduled event, the system identifies the corresponding Google Calendar event and either deletes it or marks it as cancelled, updating my calendar to reflect the cancellation.

**Why this priority**: This is important for calendar accuracy but is P3 because most users can manually handle occasional cancellations, whereas automated event creation (P1) and updates (P2) deliver more frequent value.

**Independent Test**: Can be tested by creating a calendar event via email, then sending a cancellation email, and verifying the calendar event is either deleted or marked as cancelled with appropriate notification.

**Acceptance Scenarios**:

1. **Given** existing calendar event, **When** cancellation email arrives, **Then** system finds event and deletes it from Google Calendar
2. **Given** cancellation notice, **When** event has multiple attendees, **Then** system marks event as cancelled rather than deleting (to preserve record)
3. **Given** cancellation email is ambiguous, **When** system cannot confidently identify event, **Then** user receives notification requesting manual confirmation
4. **Given** event deletion succeeds, **When** processing completes, **Then** user receives notification confirming calendar event was removed

---

### Edge Cases

- What happens when email contains multiple distinct appointment requests in the same message? System extracts and creates separate calendar events for all detected appointments.
- How does system handle timezone differences when sender and recipient are in different zones?
- What occurs when AI extracts conflicting date/time information from email content?
- How does system detect and prevent duplicate event creation when multiple emails reference the same meeting?
- What happens when calendar event creation fails due to API errors or quota limits?
- How does system handle recurring event patterns detected in email (e.g., "every Monday at 10am")?
- What occurs when event date is relative (e.g., "tomorrow", "next week") and email processing is delayed? When processing delay exceeds 24 hours, system flags relative dates for manual review to prevent incorrect date calculations.
- How does system manage partial event information (e.g., date and time provided but no location)? When date is provided without time, system creates all-day event and flags missing time information for user review.
- What happens when calendar modification conflicts with user's manual edits to the original event?
- When a calendar event is deleted, the calendar_events record is soft-deleted (status='deleted') to maintain audit trail and enable rollback capabilities.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST extract event details (title, date, time, location, attendees, meeting URL) from email content using AI Agent
- **FR-002**: System MUST create Google Calendar events using native Google Calendar node when email has action=CALENDAR
- **FR-003**: System MUST detect and extract timezone information from email content or default to user's configured timezone
- **FR-004**: AI Agent MUST be enhanced with calendar-specific context and examples to improve action=CALENDAR classification accuracy to 95%+
- **FR-005**: System MUST identify existing calendar events when processing update or cancellation emails using event matching logic
- **FR-006**: System MUST update existing Google Calendar events when reschedule or modification emails are detected
- **FR-007**: System MUST delete or mark as cancelled Google Calendar events when cancellation notices are received; corresponding calendar_events record MUST be updated to status='deleted' for audit trail (soft delete, not hard delete)
- **FR-008**: System MUST handle meeting invitations from common platforms (Google Meet, Zoom, Microsoft Teams) and extract platform-specific details
- **FR-009**: System MUST store calendar event metadata (event_id, creation_source, original_email_id) in Supabase for event tracking and matching
- **FR-010**: System MUST prevent duplicate event creation by checking for existing events with same title and datetime within 1-hour window
- **FR-011**: System MUST notify user via Telegram when calendar event is created, modified, or deleted
- **FR-012**: System MUST flag ambiguous calendar operations for manual review when AI extraction confidence score is below 70%
- **FR-013**: System MUST log all calendar operations (create, update, delete) with success/failure status and error details
- **FR-014**: System MUST handle partial event information by creating event with available details and flagging missing information; when date is extracted but time is missing, system MUST create an all-day event
- **FR-015**: System MUST respect user's quiet hours when sending calendar operation notifications
- **FR-016**: System MUST extract and preserve event description/agenda from email body when creating calendar events
- **FR-017**: System MUST handle relative date references ("tomorrow", "next Monday") by calculating absolute dates based on email received timestamp; when processing delay exceeds 24 hours, system MUST flag relative dates for manual review to prevent incorrect date calculations
- **FR-018**: AI Agent MUST differentiate between event invitations, confirmations, updates, and cancellations in classification
- **FR-019**: System MUST detect and extract multiple appointment requests from a single email and create separate calendar events for each

### Key Entities *(include if feature involves data)*

- **Calendar Event Record**: Represents a Google Calendar event created or managed by the system, containing event_id (Google Calendar unique identifier), email_id (reference to source email), title, start_datetime, end_datetime, location, attendees (array of email addresses), meeting_url, timezone, description, created_at, updated_at, status (active/cancelled/deleted), confidence_score (AI extraction confidence). Records are soft-deleted (status='deleted') rather than removed to maintain audit trail and support rollback capabilities.

- **Calendar Operation Log**: Tracks all calendar operations performed by the system, containing operation_id, operation_type (create/update/delete), event_id (reference to calendar event), email_id (source email), status (success/failure/pending_review), error_message (if failed), confidence_score, performed_at, notified_user (boolean)

- **Event Matching Metadata**: Stores information for identifying and matching events across emails, containing email_subject_hash, event_title_normalized, datetime_range, attendee_fingerprint (hash of attendee list), conversation_thread_id (email thread reference)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of emails with meeting details are correctly classified with action=CALENDAR
- **SC-002**: Calendar events are created within 30 seconds of email arrival
- **SC-003**: 90% of automatically created calendar events have accurate date, time, and title extracted
- **SC-004**: Event updates and modifications are applied within 30 seconds with 85%+ accuracy in matching original events
- **SC-005**: Zero duplicate calendar events created for the same meeting (duplicate detection rate of 100%)
- **SC-006**: Users receive calendar operation notifications within 60 seconds of event creation/modification/deletion
- **SC-007**: System maintains audit log of all calendar operations with 100% logging coverage
- **SC-008**: Ambiguous calendar operations with confidence below 70% are flagged for review with false positive rate below 10%
- **SC-009**: Timezone detection and handling achieves 95%+ accuracy for events across different timezones
- **SC-010**: Calendar event extraction handles meeting invitations from Google Meet, Zoom, and Microsoft Teams with 90%+ success rate

## Assumptions *(mandatory)*

1. **Email Access**: System has existing Gmail API access configured in MVP (001-email-classification-mvp)
2. **Calendar Permissions**: Google Calendar API credentials have sufficient permissions for event creation, modification, and deletion
3. **Classification Foundation**: The MVP's AI classification accurately detects emails requiring calendar action (action=CALENDAR)
4. **User Timezone**: User's default timezone is configured in system environment (TZ variable in .env)
5. **Single Calendar**: All events are created in the user's primary Google Calendar (multi-calendar support is out of scope)
6. **Native n8n Nodes**: Google Calendar native node provides all required operations (create event, update event, delete event, search events)
7. **Event Uniqueness**: Event matching for updates/cancellations can be achieved using combination of title, datetime, and email thread
8. **AI Capabilities**: OpenAI GPT-4-mini (current model) has sufficient capability to extract structured event details from email text
9. **Notification Channel**: Telegram notifications (existing from MVP) are sufficient for calendar operation alerts
10. **English Language**: Email content is primarily in English (multi-language support is out of scope for MVP)

## Dependencies *(mandatory)*

1. **MVP Feature (001-email-classification-mvp)**: This feature builds on the existing email classification system, particularly the action=CALENDAR classification capability
2. **Google Calendar API**: Requires native n8n Google Calendar node with appropriate OAuth2 credentials configured
3. **OpenAI API**: Enhanced AI prompts require continued access to OpenAI GPT-4-mini for event detail extraction
4. **Supabase Database**: Requires new tables for calendar_events and calendar_operations in existing Supabase instance
5. **Telegram Bot**: Uses existing Telegram notification infrastructure for calendar operation alerts
6. **Email Thread Access**: Requires Gmail API thread information to match event updates/cancellations to original invitations

## Out of Scope *(mandatory)*

1. **Multi-Calendar Support**: Creating events in calendars other than the primary calendar
2. **Recurring Events**: Automatic creation of recurring calendar events (e.g., "every Monday at 10am") - only single events supported
3. **Calendar Conflict Detection**: Checking for scheduling conflicts before creating events
4. **Attendee Availability**: Integration with Google Calendar free/busy API to check attendee availability
5. **Event Reminders**: Custom reminder configuration (will use Google Calendar defaults)
6. **Multi-Language Support**: Event extraction from non-English emails
7. **Calendar Synchronization**: Two-way sync between email and calendar (manual calendar edits won't update email records)
8. **ICS File Parsing**: Direct parsing of .ics calendar file attachments (will extract from email body text instead)
9. **Event Categories/Colors**: Automatic categorization or color-coding of calendar events
10. **Working Hours Awareness**: Flagging events scheduled outside typical working hours
11. **Travel Time Calculation**: Adding buffer time for travel between back-to-back events
12. **Video Conference Creation**: Automatically creating new Zoom/Meet links (will only extract existing links from emails)

## Constraints *(mandatory)*

### Technical Constraints

1. **n8n-Native Architecture**: MUST use native Google Calendar node for all calendar operations (no custom API calls)
2. **AI Agent Pattern**: MUST follow Swim Dad Assistant reference architecture for AI-powered event extraction
3. **Processing Time**: Calendar operations must complete within 30 seconds per email to meet user expectations
4. **Node Limit**: Calendar workflow must stay within 50 nodes per workflow (constitution limit)
5. **API Rate Limits**: Google Calendar API has 1,000,000 queries per day quota (sufficient for personal use but must handle rate limit errors)
6. **Event Title Length**: Google Calendar limits event titles to 1024 characters
7. **Attendee Limit**: Google Calendar supports maximum 200 attendees per event

### Business Constraints

1. **Single User System**: Designed for personal email management, not multi-user or shared calendar scenarios
2. **Manual Review Required**: Ambiguous calendar operations must be flagged for user confirmation (no silent failures)
3. **Data Retention**: Calendar event records in Supabase must be retained for minimum 90 days for audit purposes
4. **Notification Timing**: Calendar notifications must respect existing quiet hours configuration from MVP

### Operational Constraints

1. **Credential Management**: Google Calendar OAuth2 tokens must be stored in n8n credential vault
2. **Error Handling**: Calendar API failures must be logged and user notified without stopping email processing workflow
3. **Rollback Capability**: System must maintain enough metadata to manually undo incorrect calendar operations
4. **Monitoring**: All calendar operations must be observable through n8n execution logs and Supabase audit tables

## Success Validation Plan *(mandatory)*

### Test Scenarios

1. **Basic Event Creation**:
   - Send test email with clear meeting details ("Team meeting tomorrow at 2pm in Conference Room A")
   - Verify email classified with action=CALENDAR
   - Confirm Google Calendar event created with correct title, date, time, location
   - Validate Telegram notification received within 60 seconds

2. **Multi-Attendee Events**:
   - Send email with meeting invitation including 3+ attendee email addresses
   - Verify all attendees added to calendar event
   - Confirm event appears on attendees' calendars with invite status

3. **Meeting Platform Integration**:
   - Send emails with Zoom meeting links, Google Meet links, and Microsoft Teams links
   - Verify meeting URLs extracted and included in calendar event description
   - Confirm links are clickable and correctly formatted

4. **Event Updates and Rescheduling**:
   - Create event via email, then send reschedule email in same thread
   - Verify system identifies original event and updates time (no duplicate created)
   - Confirm update notification sent to user and attendees

5. **Event Cancellations**:
   - Create event via email, then send cancellation notice
   - Verify calendar event is deleted or marked cancelled
   - Confirm cancellation notification sent

6. **Ambiguous Content Handling**:
   - Send email with vague meeting details ("let's meet sometime next week")
   - Verify system flags for manual review
   - Confirm user receives notification requesting clarification

7. **Duplicate Prevention**:
   - Send two emails with identical meeting details within 1 hour
   - Verify only one calendar event is created
   - Confirm system logs duplicate detection

8. **Timezone Handling**:
   - Send email with explicit timezone ("3pm EST")
   - Verify event created with correct timezone conversion
   - Confirm event displays at correct local time in Google Calendar

9. **Partial Information Handling**:
   - Send email with only date and title, no time or location
   - Verify all-day event created with available details (date and title)
   - Confirm missing time information flagged in notification

10. **API Failure Recovery**:
    - Simulate Google Calendar API error (via rate limiting or invalid credentials)
    - Verify error logged in calendar_operations table
    - Confirm user notified of failure
    - Validate email processing continues (calendar failure doesn't block workflow)

11. **Multiple Appointments in Single Email**:
    - Send email containing multiple distinct appointments ("Dentist Monday 2pm and haircut Wednesday 10am")
    - Verify system extracts both appointments correctly
    - Confirm two separate calendar events are created
    - Validate both events have accurate titles, dates, and times

12. **Stale Relative Date Handling**:
    - Simulate email received 48 hours ago with relative date ("appointment tomorrow at 3pm")
    - Process the delayed email
    - Verify system detects processing delay >24 hours
    - Confirm relative date is flagged for manual review rather than creating event with incorrect date

### Acceptance Criteria Validation

- **AC-001**: Run 100 test emails with calendar content, achieve 95%+ classification accuracy
- **AC-002**: Measure event creation time from email arrival to calendar entry, confirm <30 seconds average
- **AC-003**: Validate event detail extraction accuracy on 50 diverse emails, achieve 90%+ correctness
- **AC-004**: Test event update matching on 20 reschedule scenarios, achieve 85%+ correct matches
- **AC-005**: Run duplicate detection tests with 30 duplicate pairs, confirm 100% prevention rate
- **AC-006**: Measure notification delivery time on 50 events, confirm <60 seconds average
- **AC-007**: Verify audit logging by reviewing calendar_operations table for 100% coverage
- **AC-008**: Test ambiguous email handling on 20 edge cases, measure false positive rate <10%
- **AC-009**: Test timezone scenarios across 5 different zones, achieve 95%+ accuracy
- **AC-010**: Test platform-specific invites (Google Meet, Zoom, Teams) with 30 examples, achieve 90%+ extraction success

### User Acceptance Testing

1. **Production Pilot**: Deploy to production and monitor for 7 days
2. **Real Email Processing**: Process actual incoming emails with calendar content
3. **User Validation**: Manually verify 20 automatically created events for accuracy
4. **Error Review**: Review all flagged ambiguous cases and manual review requests
5. **Performance Metrics**: Confirm all success criteria met in production environment
6. **User Satisfaction**: Collect feedback on time saved and calendar accuracy

## Notes

This specification focuses on automating calendar management by leveraging the existing email classification system (MVP). The feature prioritizes event creation (P1) as the highest value capability, with updates/modifications (P2) and cancellations (P3) as progressive enhancements. The design follows the n8n-native architecture principle by using Google Calendar native nodes exclusively, avoiding custom API integrations.

**Key Design Decisions**:

1. **Single Calendar Scope**: Limiting to primary calendar reduces complexity and covers 90%+ of personal use cases
2. **Event Matching Strategy**: Using combination of title normalization, datetime proximity, and email thread linking to identify events for updates
3. **Ambiguity Handling**: Flagging uncertain operations for manual review prevents incorrect calendar modifications
4. **Native Node Requirement**: Google Calendar node must provide create, update, delete, and search operations - if insufficient, this becomes a blocker requiring n8n feature request

**Constitution Compliance**:

- ✅ User-First Design: Clear user value in time savings and reduced manual calendar entry
- ✅ Test-Driven Development: Comprehensive test scenarios and validation plan defined
- ✅ n8n-Native Architecture: Exclusively uses native Google Calendar and AI Agent nodes
- ✅ Progressive Enhancement: P1 (create) → P2 (update) → P3 (delete) delivery path
- ✅ Observable Systems: Audit logging and operation tracking defined
- ✅ Security by Design: OAuth2 credentials in n8n vault, no credential exposure
- ✅ Documentation as Code: Specification versioned in repository
- ✅ Memory-Driven Learning: Event metadata stored in Supabase for pattern recognition

**Next Steps**: Run `/speckit.plan` to generate implementation plan with workflow design and calendar integration architecture.
