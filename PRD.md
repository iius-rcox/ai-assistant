# Email Intelligence Workflow System — MVP-First PRD

**Version 1.2 — November 2025**
**(Telegram Instead of Slack • No Todoist/Asana)**

---

## Executive Summary

This PRD restructures the original design around a focused MVP: fast classification, clean labeling, automatic archiving, and reliable high-priority notifications via SMS or Telegram. Phases 2 and 3 then layer on drafting, calendar integration, document processing, finance automation, meeting intelligence, and follow-ups—now simplified without any task manager integrations.

---

## Vision Statement

Build a personal inbox assistant that handles all routine triage automatically, surfaces what matters, and gradually grows into a full personal email intelligence system.

---

## MVP Objective (Version 1.0 Scope)

A lean, stable foundation that:

* Classifies every email
* Labels and organizes
* Archives low-value items
* Sends urgent notifications via SMS or Telegram
* Provides a full audit trail
* Eliminates nearly all manual filing

---

## MVP Functional Requirements

### FR-M1: Enhanced Classification (Critical)

* Categorize into: **KIDS, ROBYN, WORK, FINANCIAL, SHOPPING, OTHER**
* Urgency: **HIGH, MEDIUM, LOW**
* Action type: **FYI, RESPOND, TASK, PAYMENT, CALENDAR, NONE**
* Extract: names, simple dates, simple amounts
* Output confidence score
* Store structured results in Supabase
* Deferred: learning, pattern recognition, similarity lookups

### FR-M2: Automated Organization (Critical)

* Apply Gmail labels
* Mark FYI as read
* Archive low-value emails
* Keep action-required emails unread
* Deferred: dynamic folder creation

### FR-M3: High-Priority Notification System (Critical)

* Alerts for HIGH urgency or PAYMENT/CALENDAR/RESPOND
* Channels: **SMS**, **Telegram**
* Quiet hours respected
* Log notifications
* Deferred: digests, batching

### FR-M4: Audit Logging

* Log classifications, labels, notifications, archives, errors

### FR-M5: Error Handling

* Retry transient failures
* Fail gracefully
* Store error JSON

### FR-M6: Core Data Schema

* MVP tables: `emails`, `email_actions`, `notification_log`
* Deferred: `calendar_events`, `draft_responses`, `action_patterns`, `user_preferences`

---

## MVP Architecture

```
[Gmail Trigger]
    ↓
[Get Full Message]
    ↓
[AI Classification Agent]
    ↓
[Store Email in Supabase]
    ↓
[Organization Workflow]
    ↓
[High Priority Router]
    └── [SMS / Telegram Notification]
```

---

## Phase 2 — Productivity Actions Layer

### FR-2.1 Draft Response Generation

* Generate Gmail drafts
* Pull thread context
* Adjust tone
* Track usage

### FR-2.2 Google Calendar Integration

* Extract event details
* Create tentative events
* Add email reference links
* Handle updates

### FR-2.3 Expanded Notifications

* **Telegram notifications** for WORK or important categories
* Daily digest (email or Telegram)
* Medium-priority batching

### FR-2.4 Attachment Handling (Basic)

* Save attachments to Drive
* Basic folder structure
* Virus scan

**Phase 2 Acceptance Criteria**

* Drafts useful ≥ 70%
* Calendar extraction ≥ 90%
* Notifications routed correctly

---

## Phase 3 — Intelligence & Automation Layer

### FR-3.1 Document Management

* PDF text extraction
* Type detection
* Vector indexing

### FR-3.2 Financial Automation

* Detect bills & invoices
* Extract due dates & amounts
* Calendar reminders
* Monthly reports

### FR-3.3 Follow-Up Engine

* Track unanswered emails
* Schedule reminders via Telegram or email
* Auto-draft follow-ups
* Snooze support

### FR-3.4 Meeting Coordination

* Detect meeting requests
* Check availability
* Suggest times
* Generate replies

### FR-3.5 Pattern Learning

* Use corrections
* Suggest actions
* Score accuracy

**Phase 3 Acceptance Criteria**

* Pattern suggestions ≥ 80%
* Financial recognition ≥ 90%
* <5% missed follow-ups
* Meeting suggestions ≥ 90%

---

## Implementation Timeline

### Weeks 1–2: MVP

* Classification
* Labeling
* Archiving
* SMS/Telegram alerts
* Logging
* Error handling

### Weeks 3–5: Phase 2

* Draft responses
* Calendar extraction
* Telegram digests
* Basic attachments

### Weeks 6–10: Phase 3

* Document intelligence
* Financial tracking
* Follow-up engine
* Meeting coordination
* Pattern learning

---

## Risks & Mitigations

### MVP Risks

* Notification overload → limit alerts to HIGH/action-required
* Workflow complexity → modular design
* API limits → minimized integrations

### Phase 2 Risks

* Telegram fatigue → batching & digest
* Parsing errors → confidence thresholds

### Phase 3 Risks

* Incorrect patterns → require confirmation
* Financial confusion → double-confirm due dates

---

## Conclusion

This version simplifies the system by using **Telegram instead of Slack** and **removing all task manager integrations**. The result is a cleaner ecosystem centered on Gmail, Calendar, Telegram, Supabase, and follow-up intelligence. This phased approach ensures rapid early wins and a strong foundation for later automation.
