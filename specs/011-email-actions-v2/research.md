# Research: Email Actions V2

**Feature**: 011-email-actions-v2
**Date**: 2025-11-27
**Status**: Complete

## Executive Summary

This document consolidates research findings for implementing the Email Actions V2 feature. The new action model replaces the existing six-action system (FYI, RESPOND, TASK, PAYMENT, CALENDAR, NONE) with a refined set (IGNORE, SHIPMENT, DRAFT_REPLY, JUNK, NOTIFY, CALENDAR) that emphasizes automation with safety guardrails.

---

## 1. Action Type Migration Strategy

### Decision: Enum Value Replacement with Backward Compatibility

**Rationale**: The new action types have different semantics than the old ones. A clean migration with mapping rules preserves historical data while enabling the new model.

**Migration Mapping**:
| Old Action | New Action | Confidence | Notes |
|------------|------------|------------|-------|
| FYI | IGNORE | 100% | Mark as read, no notification |
| RESPOND | DRAFT_REPLY | 85% | Requires human review |
| TASK | NOTIFY | 85% | Alert user for action |
| PAYMENT | NOTIFY | 85% | Financial alert |
| CALENDAR | CALENDAR | 85% | Event extraction |
| NONE | IGNORE | 100% | Safe fallback |

**Alternatives Considered**:
1. **Add new column, deprecate old**: Rejected - Creates confusion with two action columns
2. **In-place enum modification**: Rejected - PostgreSQL enum changes are complex
3. **New TEXT column with CHECK constraint**: Selected - Flexible, supports migration

---

## 2. n8n Workflow Architecture

### Decision: Extend Existing Workflows + New Action-Processor Sub-Workflow

**Rationale**: The existing workflow architecture (Email-Processing-Main → Classification → Organization → Notification) is proven and stable. Adding action-specific processing as a new sub-workflow maintains separation of concerns.

**Architecture Pattern**:
```
Email-Processing-Main (existing)
  ↓ Get Message
  ↓ Store Email
  ↓ Execute Classification-Workflow (MODIFIED)
      └─ AI Agent assigns action + confidence
      └─ Code node applies threshold rules
  ↓ Execute Action-Processor-Workflow (NEW)
      ├─ SHIPMENT → Extract tracking → Supabase shipments
      ├─ DRAFT_REPLY → AI generate draft → Telegram buttons
      ├─ CALENDAR → Extract event → Google Calendar (Tentative)
      └─ NOTIFY/IGNORE/JUNK → Organization-Workflow
  ↓ Execute Organization-Workflow (existing, minor updates)
  ↓ Execute Notification-Workflow (MODIFIED for NOTIFY action)
```

**Alternatives Considered**:
1. **Single monolithic workflow**: Rejected - Exceeds 50-node limit, hard to maintain
2. **Action-specific workflows per type**: Rejected - Too many workflows to manage
3. **Centralized Action-Processor**: Selected - Single point for action-specific logic

### n8n Nodes Required

| Node Type | Purpose | Native? |
|-----------|---------|---------|
| AI Agent | Classification + action selection | ✅ Yes |
| OpenAI Chat Model | Language model for AI Agent | ✅ Yes |
| Structured Output Parser | JSON schema enforcement | ✅ Yes |
| Supabase Vector Store | Similarity search | ✅ Yes |
| Embeddings OpenAI | Vector generation | ✅ Yes |
| Gmail (Get Message) | Email retrieval | ✅ Yes |
| Gmail (Send Message) | Draft reply sending | ✅ Yes |
| Telegram (Send Message) | Notifications + draft approval | ✅ Yes |
| Google Calendar (Create Event) | Tentative event creation | ✅ Yes |
| Code | Data transformation, threshold logic | ✅ Yes (minimal) |
| Execute Workflow | Sub-workflow orchestration | ✅ Yes |

**Constitution Compliance**: 100% native n8n nodes, zero Execute Command nodes.

---

## 3. Confidence Threshold Implementation

### Decision: Code Node with Configurable Thresholds

**Rationale**: Confidence thresholds need to be adjustable without workflow modification. A Code node reads thresholds from system_config table and applies decision logic.

**Threshold Rules** (from FR-005):
| Action | Minimum Confidence | Additional Conditions |
|--------|-------------------|----------------------|
| IGNORE | >85% | Default fallback when uncertain |
| SHIPMENT | >90% | Tracking info detected |
| DRAFT_REPLY | >75% | Human sender, direct question |
| NOTIFY | >=85% | HIGH urgency OR priority category |
| CALENDAR | >=85% | Date detected, priority category |
| JUNK | >=99% | Blacklisted domain, NOT protected category |

**Priority Resolution** (from Edge Cases):
```
NOTIFY > CALENDAR > SHIPMENT > DRAFT_REPLY > IGNORE > JUNK
```

**Implementation**:
```javascript
// Code node: Apply action thresholds
const confidence = $json.confidence_score;
const category = $json.category;
const urgency = $json.urgency;
const hasTracking = $json.has_tracking_info;
const hasDate = $json.has_date;
const senderDomain = $json.sender_domain;

// Protected categories (never auto-JUNK)
const protectedCategories = ['KIDS', 'ROBYN', 'FINANCIAL', 'WORK'];

// Priority-based action selection
if (urgency === 'HIGH' && confidence >= 0.85) {
  return { action: 'NOTIFY', auto_assigned: true };
}
if (protectedCategories.includes(category) && confidence >= 0.85) {
  return { action: 'NOTIFY', auto_assigned: true };
}
if (hasDate && protectedCategories.includes(category) && confidence >= 0.85) {
  return { action: 'CALENDAR', auto_assigned: true };
}
if (hasTracking && confidence >= 0.90) {
  return { action: 'SHIPMENT', auto_assigned: true };
}
// ... more rules
return { action: 'IGNORE', auto_assigned: true }; // Fallback
```

**Alternatives Considered**:
1. **Hardcoded thresholds in workflow**: Rejected - Requires workflow edit to change
2. **AI Agent decides action directly**: Rejected - Less predictable, harder to debug
3. **Code node with system_config**: Selected - Configurable, auditable

---

## 4. Telegram Integration for DRAFT_REPLY

### Decision: Inline Keyboard Buttons with Callback Handler Workflow

**Rationale**: Telegram's inline keyboard buttons provide the best UX for Send/Re-write/Discard approval flow. A separate callback handler workflow processes button clicks.

**Message Format**:
```
📝 DRAFT REPLY READY

From: {sender}
Subject: {subject}

---
Suggested Reply:
{draft_content}
---

Category: {category} | Urgency: {urgency}

[Send] [Re-write] [Discard]
```

**Callback Flow**:
1. DRAFT_REPLY action triggers → Generate draft via AI → Send Telegram with buttons
2. User clicks button → Telegram sends callback to webhook
3. Draft-Reply-Handler-Workflow receives callback:
   - **Send**: Gmail Send Message → Update draft status → Confirm to user
   - **Re-write**: Ask for instructions → Regenerate draft → Resend with buttons
   - **Discard**: Update draft status → Confirm to user

**n8n Implementation**:
```
Draft-Reply-Handler-Workflow (NEW)
├── Webhook Trigger (Telegram callback)
├── Code: Parse callback_data (action + draft_id)
├── Switch: Based on action
│   ├── send:
│   │   ├── Supabase: Get draft content
│   │   ├── Gmail: Send Message
│   │   ├── Supabase: Update draft.status = 'sent'
│   │   └── Telegram: Send confirmation
│   ├── rewrite:
│   │   ├── Telegram: Ask for instructions
│   │   └── (Wait for next message with instructions)
│   └── discard:
│       ├── Supabase: Update draft.status = 'discarded'
│       └── Telegram: Send confirmation
```

**Alternatives Considered**:
1. **Reply-based commands (e.g., "SEND", "DISCARD")**: Rejected - Poor UX, error-prone
2. **Web link to correction-ui**: Rejected - Extra step, loses mobile convenience
3. **Inline buttons with callback workflow**: Selected - Best UX, Telegram-native

---

## 5. Google Calendar Integration

### Decision: Native Google Calendar Node with Tentative Status

**Rationale**: n8n's native Google Calendar node supports event creation with all required fields. Setting event status to "tentative" allows user confirmation via native calendar app.

**Event Creation Parameters**:
| Field | Source | Notes |
|-------|--------|-------|
| summary | Extracted from email | Event title |
| description | Email body excerpt + link | Context |
| start/end | Extracted date/time | All-day if no time |
| status | "tentative" | Awaiting user confirmation |
| source.url | Gmail link | Reference to original email |

**n8n Google Calendar Node Configuration**:
```
Resource: Event
Operation: Create
Calendar: Primary
Event Title: {{ $json.event_title }}
Start: {{ $json.event_start }}
End: {{ $json.event_end }}
Description: "From email: {{ $json.subject }}\n\n{{ $json.event_description }}\n\nOriginal: {{ $json.gmail_link }}"
Status: tentative
```

**Alternatives Considered**:
1. **Create as "confirmed" + Telegram approval**: Rejected - Adds complexity, calendar already has approval UX
2. **Store in Supabase only, no Google sync**: Rejected - User must manually create event
3. **Tentative status in Google Calendar**: Selected - Native approval UX, no extra workflow

---

## 6. SafeList/BlackList Architecture

### Decision: Single Table with Type Column

**Rationale**: SafeList and BlackList have identical structure (sender address or domain). A single table with a `list_type` column simplifies queries and management.

**Table Design**:
```sql
CREATE TABLE sender_lists (
  id BIGSERIAL PRIMARY KEY,
  list_type TEXT NOT NULL CHECK (list_type IN ('safelist', 'blacklist')),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('email', 'domain')),
  entry_value TEXT NOT NULL, -- email@example.com or example.com
  added_by TEXT DEFAULT 'user',
  added_reason TEXT, -- e.g., "Added via row menu"
  source_email_id BIGINT REFERENCES emails(id), -- Which email triggered this
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_type, entry_value)
);
```

**Query Patterns**:
```sql
-- Check if sender is blacklisted
SELECT EXISTS (
  SELECT 1 FROM sender_lists
  WHERE list_type = 'blacklist'
  AND (
    (entry_type = 'email' AND entry_value = $sender_email)
    OR (entry_type = 'domain' AND entry_value = $sender_domain)
  )
);

-- Check if sender is safelisted (blocks JUNK)
SELECT EXISTS (
  SELECT 1 FROM sender_lists
  WHERE list_type = 'safelist'
  AND (
    (entry_type = 'email' AND entry_value = $sender_email)
    OR (entry_type = 'domain' AND entry_value = $sender_domain)
  )
);
```

**Alternatives Considered**:
1. **Separate safelist/blacklist tables**: Rejected - Duplicate structure, harder to maintain
2. **JSON array in system_config**: Rejected - Poor query performance, no history
3. **Single table with type column**: Selected - Clean, queryable, auditable

---

## 7. UI Action Dropdown Design

### Decision: Grouped Options with Risk Indicators and Tooltips

**Rationale**: Grouping actions by risk level helps users understand the impact of their selection. Tooltips provide context without cluttering the UI.

**Dropdown Structure**:
```
┌─────────────────────────────────────┐
│ Low Risk                            │
│   ○ IGNORE - Mark as read           │
├─────────────────────────────────────┤
│ Enrichment                          │
│   ○ SHIPMENT - Track package        │
│   ○ CALENDAR - Create event         │
├─────────────────────────────────────┤
│ Human Review Required               │
│   ○ DRAFT_REPLY - Suggest reply     │
│   ○ NOTIFY - Send alert             │
├─────────────────────────────────────┤
│ Destructive                         │
│   ○ JUNK - Archive to junk    ⚠️    │
└─────────────────────────────────────┘
```

**Tooltip Content**:
| Action | Tooltip |
|--------|---------|
| IGNORE | "Email will be marked as read. No notification sent." |
| SHIPMENT | "Extract tracking number and delivery date. View in Shipments." |
| CALENDAR | "Create tentative calendar event. Confirm in Google Calendar." |
| DRAFT_REPLY | "AI suggests a reply. Approve via Telegram before sending." |
| NOTIFY | "Send Telegram alert with summary and recommended action." |
| JUNK | "Mark as read and archive to junk folder. Cannot be undone." |

**SHIPMENT Availability**:
- Enabled: Email has detected tracking information (`has_tracking_info: true`)
- Disabled: No tracking info detected (greyed out with tooltip: "No tracking information detected")

**Alternatives Considered**:
1. **Flat list with icons**: Rejected - Doesn't convey risk hierarchy
2. **Separate dropdowns per risk level**: Rejected - Too many clicks
3. **Grouped dropdown with tooltips**: Selected - Clear, informative, single interaction

---

## 8. Status Indicators Design

### Decision: Row-Level Icons with Badges

**Rationale**: Visual indicators help users quickly scan the table to identify emails with pending actions (drafts awaiting review, calendar events pending confirmation, notifications sent).

**Indicator System**:
| Action | Indicator | Location | Condition |
|--------|-----------|----------|-----------|
| NOTIFY | 🔔 Bell icon | Action column | Notification sent |
| CALENDAR | 📅 Calendar icon | Action column | Tentative event exists |
| DRAFT_REPLY | 📝 Draft icon | Action column | Draft awaiting review |
| JUNK | ⚠️ Warning badge | Action column | Destructive action |
| SHIPMENT | 📦 Package icon | Action column | Shipment tracked |

**Implementation**:
```vue
<!-- ActionStatusIndicator.vue -->
<template>
  <span class="action-indicator">
    <span v-if="action === 'NOTIFY'" class="icon bell" title="Notification sent">🔔</span>
    <span v-else-if="action === 'CALENDAR' && hasPendingEvent" class="icon calendar" title="Event pending">📅</span>
    <span v-else-if="action === 'DRAFT_REPLY' && hasPendingDraft" class="icon draft" title="Draft awaiting review">📝</span>
    <span v-else-if="action === 'SHIPMENT'" class="icon package" title="Shipment tracked">📦</span>
    <span v-else-if="action === 'JUNK'" class="icon warning" title="Marked as junk">⚠️</span>
  </span>
</template>
```

**Alternatives Considered**:
1. **Text labels only**: Rejected - Takes too much space, slow to scan
2. **Color-coded rows**: Rejected - Accessibility concerns, conflicts with correction highlighting
3. **Icons with tooltips**: Selected - Compact, accessible, informative

---

## 9. Row Context Menu (3-Dot Menu)

### Decision: Native HTML Context Menu with Action Options

**Rationale**: The 3-dot menu pattern is familiar to users and provides quick access to sender management without leaving the table view.

**Menu Structure**:
```
┌─────────────────────────────────┐
│ Add sender to junk              │
│ Add sender domain to junk       │
│ ─────────────────────────────── │
│ Mark as not junk                │  (only if action=JUNK)
└─────────────────────────────────┘
```

**Behavior**:
| Action | Effect |
|--------|--------|
| Add sender to junk | Insert sender email into blacklist |
| Add sender domain to junk | Insert sender domain into blacklist |
| Mark as not junk | Add sender to safelist + change action to IGNORE |

**Implementation**:
```vue
<!-- RowContextMenu.vue -->
<template>
  <div class="context-menu-wrapper">
    <button @click="toggleMenu" class="menu-trigger">⋮</button>
    <div v-if="isOpen" class="menu-dropdown">
      <button @click="addSenderToJunk">Add sender to junk</button>
      <button @click="addDomainToJunk">Add sender domain to junk</button>
      <hr v-if="classification.action === 'JUNK'" />
      <button v-if="classification.action === 'JUNK'" @click="markAsNotJunk">
        Mark as not junk
      </button>
    </div>
  </div>
</template>
```

**Alternatives Considered**:
1. **Right-click context menu**: Rejected - Not discoverable on mobile
2. **Swipe actions (mobile)**: Rejected - Desktop users can't access
3. **3-dot menu button**: Selected - Universal, discoverable, familiar pattern

---

## 10. Data Extraction Patterns

### Shipment Extraction

**Fields to Extract**:
- Tracking number (regex patterns for major carriers)
- Carrier name (USPS, UPS, FedEx, Amazon, DHL)
- Item descriptions (line items)
- Estimated delivery date

**AI Agent Prompt Addition**:
```
For SHIPMENT emails, extract:
- tracking_number: The shipment tracking number (e.g., "1Z999AA10123456784")
- carrier: The shipping carrier (USPS, UPS, FedEx, Amazon, DHL, Other)
- items: Array of item descriptions
- estimated_delivery: ISO 8601 date of expected delivery
```

### Calendar Event Extraction

**Fields to Extract**:
- Event title
- Start date/time
- End date/time (or duration)
- Location (if mentioned)
- Description/context

**AI Agent Prompt Addition**:
```
For CALENDAR emails, extract:
- event_title: Brief title for the calendar event
- event_start: ISO 8601 datetime of event start
- event_end: ISO 8601 datetime of event end (or same as start for all-day)
- event_location: Physical or virtual location if mentioned
- event_description: Brief context from the email
```

---

## Summary of Decisions

| Topic | Decision | Key Rationale |
|-------|----------|---------------|
| Migration | New TEXT column with CHECK | Flexible, supports gradual migration |
| Workflow Architecture | Action-Processor sub-workflow | Separation of concerns, maintainable |
| Confidence Thresholds | Code node with system_config | Configurable without workflow edit |
| DRAFT_REPLY Approval | Telegram inline buttons | Best mobile UX, Telegram-native |
| Calendar Events | Google Calendar tentative status | Native approval UX, no extra workflow |
| SafeList/BlackList | Single table with type column | Simple, queryable, auditable |
| UI Dropdown | Risk-grouped with tooltips | Clear hierarchy, informative |
| Status Indicators | Row-level icons | Compact, scannable |
| Row Context Menu | 3-dot menu button | Universal, discoverable |
| Data Extraction | AI Agent with structured prompts | Flexible, accurate |

---

## Open Questions (Resolved)

All NEEDS CLARIFICATION items have been resolved:

1. ✅ Draft Reply Workflow → Telegram buttons (Send/Re-write/Discard)
2. ✅ Calendar Event Approval → Google Calendar Tentative status
3. ✅ SafeList/BlackList Management → UI + 3-dot row context menu
