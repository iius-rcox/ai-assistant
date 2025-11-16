# n8n Workflow Structure Documentation

**Implementation Approach**: Workflows will be generated **programmatically using n8n MCP tools** (not manually via UI). This document serves as the design specification that will guide MCP-based workflow creation.

**Note**: This document describes the logical node structure and connections. During implementation (`/speckit.implement`), these designs will be converted to n8n workflow JSON using MCP tools like `mcp__n8n-mcp__n8n_create_workflow` and validated with `mcp__n8n-mcp__validate_workflow`.

**See**: `plan.md` section "n8n MCP Workflow Generation Strategy" for complete MCP implementation workflow.

## 1. Email-Processing-Main Workflow

**Purpose**: Orchestrate email processing pipeline
**Trigger**: Gmail Trigger (5-minute polling)
**Node Count**: ~15 nodes

### Node Flow

```
[Gmail Trigger] → Poll for unread emails every 5 minutes
  ↓
[Gmail: Get Message] → Retrieve full email content
  ↓
[Code: Check Duplicate] → Query Supabase for existing message_id
  ↓ (if not duplicate)
[Supabase: Insert Email] → Store email record
  ↓
[Execute Workflow: Classification] → Call classification workflow
  ↓ (returns classification JSON)
[Execute Workflow: Organization] → Call organization workflow (parallel)
[Execute Workflow: Notification] → Call notification workflow (parallel)
  ↓
[Supabase: Update Email Status] → Mark processing complete
  ↓
[Code: Log Completion] → Log success metrics
```

**Key Configurations**:
- Gmail Trigger: Poll interval 5 minutes, filter "is:unread in:inbox"
- Error handling: Continue on failure, log to Supabase error table
- Execution mode: Sequential (not parallel) to avoid race conditions

---

## 2. Classification-Workflow

**Purpose**: AI-powered email classification with vector similarity
**Trigger**: Execute Workflow call from main workflow
**Node Count**: ~20 nodes (within 50-node limit)

### Node Flow

```
[Start] → Receive email data from main workflow
  ↓
[Code: Extract Text] → Get subject + first 500 words of body
  ↓
[Embeddings OpenAI] → Generate 1536-dim vector (text-embedding-ada-002)
  ↓
[AI Agent] → Classify email
  │
  ├─[OpenAI Chat Model] → GPT-4 with classification system prompt
  │
  └─[Supabase Vector Store (retrieve)] → Tool: Get 5 similar emails
      └─[Embeddings OpenAI] → Shared embedding model
  ↓
[Structured Output Parser] → Parse AI response to JSON
  ↓
[Code: Validate Classification] → Ensure valid enum values
  ↓
[Supabase: Insert Classification] → Store classification record
  ↓
[Default Data Loader] → Prepare email for vector storage
  ↓
[Supabase Vector Store (insert)] → Store email embedding
  ↓
[Return Classification] → Pass classification JSON back to main workflow
```

**AI Agent System Prompt Template**:
```
You are an email classification assistant for a personal email account.

CATEGORIES:
- KIDS: School, extracurricular, parent-teacher communication
- ROBYN: Personal emails to/from Robyn (spouse)
- WORK: Professional emails, meetings, projects
- FINANCIAL: Bills, invoices, bank statements, payment requests
- SHOPPING: Order confirmations, shipping updates, promotions
- OTHER: Everything else

URGENCY LEVELS:
- HIGH: Requires immediate attention (deadlines, emergencies, time-sensitive)
- MEDIUM: Important but not urgent (this week)
- LOW: Informational, low priority

ACTION TYPES:
- RESPOND: Requires email response
- TASK: Action item or to-do
- PAYMENT: Bill or payment due
- CALENDAR: Meeting invite or event
- FYI: Information only, no action needed
- NONE: No action required

OUTPUT FORMAT (JSON):
{
  "category": "string",  // One of: KIDS, ROBYN, WORK, FINANCIAL, SHOPPING, OTHER
  "urgency": "string",  // One of: HIGH, MEDIUM, LOW
  "action": "string",  // One of: FYI, RESPOND, TASK, PAYMENT, CALENDAR, NONE
  "confidence": number,  // 0.0 to 1.0
  "extracted_names": ["string"],  // Person names mentioned
  "extracted_dates": ["string"],  // Dates or deadlines
  "extracted_amounts": ["string"]  // Money amounts
}

EXAMPLES:
[Include 5-10 few-shot examples per category]

Email to classify:
Subject: {subject}
From: {sender}
Body: {body_preview}
```

**Key Configurations**:
- OpenAI Chat Model: GPT-4, temperature 0.4, max tokens 500
- Vector Store retrieve: Top 5 results, similarity threshold 0.7
- Confidence threshold: Log low-confidence (<0.6) for manual review

---

## 3. Organization-Workflow

**Purpose**: Apply Gmail labels, mark read, archive based on classification
**Trigger**: Execute Workflow call from main workflow
**Node Count**: ~12 nodes

### Node Flow

```
[Start] → Receive email_id and classification from main workflow
  ↓
[Gmail: Add Label] → Apply category label (e.g., "KIDS")
  ↓
[Supabase: Log Action] → Log LABEL_APPLIED
  ↓
[Switch: Check Action Type] → Branch based on action field
  │
  ├─[If action=FYI] → [Gmail: Mark Read] → [Supabase: Log MARKED_READ]
  │
  ├─[If urgency=LOW AND action=NONE] → [Gmail: Archive] → [Supabase: Log ARCHIVED]
  │
  └─[If action in (RESPOND, TASK, PAYMENT, CALENDAR)] → Keep unread (no-op)
  ↓
[Merge] → Combine all branches
  ↓
[Return Success] → Pass success status back to main workflow
```

**Error Handling**:
- Gmail API failures: Retry 3 times with exponential backoff
- Rate limit (429): Wait and retry (n8n native handling)
- Log all failures to email_actions table with success_status=false

---

## 4. Notification-Workflow

**Purpose**: Send Telegram notifications for high-priority emails
**Trigger**: Execute Workflow call from main workflow
**Node Count**: ~10 nodes

### Node Flow

```
[Start] → Receive email_id and classification from main workflow
  ↓
[Switch: Check Priority] → High priority if urgency=HIGH OR action in (PAYMENT, CALENDAR, RESPOND)
  │
  ├─[If NOT high priority] → Exit (no notification)
  │
  └─[If high priority] → Continue
      ↓
      [Code: Check Quiet Hours] → Check current time against 10pm-7am window
        │
        ├─[If quiet hours] → [Supabase: Insert Notification (QUEUED)] → Schedule for 7am
        │
        └─[If not quiet hours] → Continue
            ↓
            [Telegram: Get Chat] → Verify bot access
            ↓
            [Code: Format Message] → Build notification text with emoji, subject, action
            ↓
            [Telegram: Send Message] → Deliver notification
            ↓
            [Supabase: Insert Notification (SENT)] → Log delivery
            ↓
            [Error Handler] → If Telegram fails, retry 3x then log FAILED status
```

**Telegram Message Template**:
```
🔴 HIGH URGENCY EMAIL

From: {sender}
Subject: {subject}

Action Required: {action}
Category: {category}

[View in Gmail](https://mail.google.com/mail/u/0/#inbox/{message_id})
```

**Quiet Hours Logic** (Code node):
```javascript
const quietStart = 22;  // 10pm
const quietEnd = 7;     // 7am
const now = new Date();
const hour = now.getHours();

const isQuietHours = hour >= quietStart || hour < quietEnd;

if (isQuietHours) {
  const scheduledFor = new Date(now);
  scheduledFor.setHours(7, 0, 0, 0);
  if (scheduledFor <= now) {
    scheduledFor.setDate(scheduledFor.getDate() + 1);  // Next day at 7am
  }
  return { isQuietHours: true, scheduledFor: scheduledFor.toISOString() };
} else {
  return { isQuietHours: false };
}
```

---

## 5. Correction-Logging-Workflow

**Purpose**: Automatically log manual corrections made in Supabase
**Trigger**: Supabase Database Trigger (on UPDATE of classifications table)
**Node Count**: ~5 nodes

**Note**: Most logic handled by database trigger (see data-model.md). This workflow is optional for additional processing.

### Node Flow

```
[Supabase Trigger] → Fires on UPDATE of classifications table
  ↓
[Code: Parse Change Event] → Extract old and new values
  ↓
[If: Changes Detected] → Check if category, urgency, or action changed
  ↓
[Supabase: Insert Correction Log] → Already handled by DB trigger (redundant check)
  ↓
[Code: Calculate Accuracy] → Update running accuracy metrics
  ↓
[Supabase: Update System Metrics] → Store accuracy stats for monitoring
```

**Alternative Approach**: Rely entirely on database trigger (preferred for MVP simplicity)

---

## Scheduled Workflows

### Send-Queued-Notifications (Scheduled Trigger)

**Purpose**: Send notifications queued during quiet hours
**Trigger**: Schedule Trigger (daily at 7:00am)
**Node Count**: ~6 nodes

```
[Schedule Trigger: 7:00am Daily]
  ↓
[Supabase: Query Queued Notifications] → WHERE delivery_status='QUEUED' AND scheduled_for <= NOW()
  ↓
[Loop: For Each Notification]
    ↓
    [Telegram: Send Message]
    ↓
    [Supabase: Update Status to SENT]
    ↓
    [Error Handler] → If failed, update to FAILED and log error
```

---

## Workflow Dependencies

```
Email-Processing-Main (entry point)
  ├── Classification-Workflow (required)
  ├── Organization-Workflow (required)
  └── Notification-Workflow (optional, only for high-priority)

Send-Queued-Notifications (independent, scheduled)

Correction-Logging-Workflow (database-triggered, independent)
```

---

## Testing Strategy

### Unit Testing (per workflow)

1. **Classification-Workflow**: Feed test emails, validate JSON output
2. **Organization-Workflow**: Mock Gmail API, verify label/archive calls
3. **Notification-Workflow**: Mock Telegram API, test quiet hours logic

### Integration Testing

1. **End-to-end**: Send real test email, verify full pipeline
2. **Error scenarios**: Simulate API failures, verify retry logic
3. **Edge cases**: Test low-confidence classification, malformed emails

### Test Data

Create `test-emails-100.json` with labeled examples:
```json
[
  {
    "message_id": "test-001",
    "subject": "PTA Meeting Tomorrow",
    "sender": "school@example.com",
    "body": "Don't forget the PTA meeting...",
    "expected": {
      "category": "KIDS",
      "urgency": "HIGH",
      "action": "CALENDAR"
    }
  },
  ...
]
```

---

## Performance Targets

| Workflow | Max Duration | Target Duration |
|----------|--------------|-----------------|
| Email-Processing-Main | 30s | 10s |
| Classification-Workflow | 15s | 5s |
| Organization-Workflow | 10s | 3s |
| Notification-Workflow | 5s | 2s |

**Total Pipeline**: <10 seconds per email (constitution requirement)

---

## Deployment Checklist

- [ ] All credentials configured in n8n vault
- [ ] Supabase tables created (data-model.md SQL)
- [ ] Gmail labels created (KIDS, ROBYN, WORK, FINANCIAL, SHOPPING, OTHER)
- [ ] Telegram bot created and chat ID obtained
- [ ] Test emails validated (100-email test set)
- [ ] All workflows imported and activated
- [ ] Error notification workflow configured
- [ ] Monitoring queries set up in Supabase

---

**Workflow Contracts Complete**: Ready for n8n implementation phase.
