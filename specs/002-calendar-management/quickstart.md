# Quickstart Guide: Enhanced Calendar Management

**Feature**: 002-calendar-management
**Branch**: `002-calendar-management`
**Prerequisites**: Email Classification MVP (001-email-classification-mvp) must be operational

## Overview

This guide will walk you through setting up the Enhanced Calendar Management feature, which automatically creates, updates, and deletes Google Calendar events based on emails classified with `action=CALENDAR`.

**Implementation Time**: 2-3 hours
**Technical Skill Required**: n8n workflow configuration, basic SQL

## Prerequisites Checklist

Before starting, ensure you have:

- [x] Email Classification MVP (001) operational and running
- [ ] Google Calendar API credentials configured in n8n
- [ ] Google Calendar OAuth2 scopes: `calendar` and `calendar.events`
- [ ] Access to Supabase dashboard (project: xmziovusqlmgygcrgyqt)
- [ ] n8n access (https://n8n.coxserver.com)
- [ ] n8n MCP tools configured and accessible
- [ ] Existing workflows backed up

## Setup Steps

### Step 1: Database Setup (15 minutes)

#### 1.1 Create Calendar Events Table

Connect to Supabase SQL Editor and execute:

```sql
-- Table: calendar_events
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  location TEXT,
  attendees JSONB DEFAULT '[]'::jsonb,
  meeting_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'deleted')),
  confidence_score NUMERIC(5,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_datetime_range CHECK (end_datetime > start_datetime)
);

-- Indexes
CREATE INDEX idx_calendar_events_event_id ON calendar_events(event_id);
CREATE INDEX idx_calendar_events_email_id ON calendar_events(email_id);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);
CREATE INDEX idx_calendar_events_start_datetime ON calendar_events(start_datetime);
CREATE INDEX idx_calendar_events_title ON calendar_events USING gin(to_tsvector('english', title));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_events_updated_at();
```

**Verification**:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'calendar_events';
-- Should return 1 row
```

#### 1.2 Create Calendar Operations Table

```sql
-- Table: calendar_operations
CREATE TABLE calendar_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('create', 'update', 'delete')),
  event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'pending_review')),
  error_message TEXT,
  confidence_score NUMERIC(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notified_user BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_calendar_operations_operation_type ON calendar_operations(operation_type);
CREATE INDEX idx_calendar_operations_status ON calendar_operations(status);
CREATE INDEX idx_calendar_operations_email_id ON calendar_operations(email_id);
CREATE INDEX idx_calendar_operations_performed_at ON calendar_operations(performed_at DESC);
```

**Verification**:
```sql
SELECT COUNT(*) as table_count
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('calendar_events', 'calendar_operations');
-- Should return 2
```

### Step 2: Google Calendar API Configuration (10 minutes)

#### 2.1 Verify Google Calendar Credential in n8n

1. Navigate to n8n: https://n8n.coxserver.com
2. Go to **Settings** → **Credentials**
3. Search for **Google Calendar OAuth2**
4. If exists, verify scopes include:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
5. If not exists, create new credential:
   - **Name**: Google Calendar (Calendar Management)
   - **Client ID**: [Your Google OAuth2 Client ID]
   - **Client Secret**: [Your Google OAuth2 Client Secret]
   - **Scopes**: Select "Full Calendar Access"
   - Click **Connect my account** and authorize

**Verification**:
- Test credential by creating a test workflow with Google Calendar → "Get Many" operation
- Should list your calendars without error

#### 2.2 Get Primary Calendar ID

Run this test workflow or use Google Calendar API Explorer:

```
GET https://www.googleapis.com/calendar/v3/users/me/calendarList
```

Find the calendar with `"primary": true` and note the `id` field (usually your email address).

**Save this calendar ID** - you'll need it for workflow configuration.

### Step 3: Create n8n Workflows (60-90 minutes)

Use the n8n MCP tools to create workflows from the contract specifications.

#### 3.1 Create Calendar Event Extraction Workflow

```javascript
// Read contract
const contract = await readFile('/Users/rogercox/ai-assistant/specs/002-calendar-management/contracts/calendar-event-extraction-workflow.json');

// Use n8n MCP to create workflow
await mcp__n8n_mcp__n8n_create_workflow({
  name: "Calendar-Event-Extraction-Workflow",
  nodes: contract.nodes,  // From JSON contract
  connections: contract.connections
});
```

**Manual Steps if MCP not available**:
1. Open n8n → Create new workflow
2. Name: "Calendar-Event-Extraction-Workflow"
3. Add nodes following `contracts/calendar-event-extraction-workflow.json`:
   - AI Agent (connected to OpenAI Chat Model)
   - Structured Output Parser
   - Code nodes for data transformation
4. Configure AI Agent system prompt (see contract for full prompt)
5. Save workflow (inactive)

#### 3.2 Create Event Matching Workflow

```javascript
await mcp__n8n_mcp__n8n_create_workflow({
  name: "Event-Matching-Workflow",
  nodes: contract.nodes,  // From event-matching-workflow.json
  connections: contract.connections
});
```

**Key Configuration**:
- Supabase node: Use existing Supabase credential
- Code node: Fuzzy matching logic (see contract)

#### 3.3 Create Calendar Operation Workflow

```javascript
await mcp__n8n_mcp__n8n_create_workflow({
  name: "Calendar-Operation-Workflow",
  nodes: contract.nodes,  // From calendar-operation-workflow.json
  connections: contract.connections
});
```

**Key Configuration**:
- Google Calendar nodes: Use Google Calendar credential from Step 2
- Replace `{{$parameter["calendar"]}}` with your primary calendar ID
- Supabase nodes: Use existing Supabase credential

#### 3.4 Update Email Processing Main Workflow

Add calendar workflow trigger to existing Email-Processing-Main:

1. Open **Email-Processing-Main** workflow
2. Find the node that checks `classifications.action`
3. Add new branch:
   ```
   IF action = 'CALENDAR':
     → Execute Workflow: Calendar-Event-Extraction-Workflow
     → Execute Workflow: Event-Matching-Workflow
     → Execute Workflow: Calendar-Operation-Workflow
   ```
4. Save workflow

#### 3.5 Enhance Classification Workflow (Optional but Recommended)

Update the AI Agent prompt in **Classification-Workflow** to improve CALENDAR detection:

Add to system prompt:
```
When classifying emails, pay special attention to calendar-related content:
- Meeting invitations ("join us", "scheduled for", "meeting at")
- Appointment confirmations (dentist, doctor, haircut, etc.)
- Event updates or rescheduling ("moved to", "rescheduled", "new time")
- Cancellation notices ("cancelled", "no longer meeting")
- Video conference links (Zoom, Google Meet, Microsoft Teams)

Classify as action=CALENDAR when email contains:
- Explicit date/time references for future events
- Meeting invitation language
- Appointment confirmation or reminder
- Event update/cancellation language
```

### Step 4: Testing & Validation (30 minutes)

#### 4.1 Unit Test: Event Extraction

Send test email to Gmail inbox:

```
Subject: Dentist Appointment Next Monday
Body: Your dentist appointment is confirmed for Monday, November 18th at 2:00 PM at 123 Main Street.
```

**Expected Results**:
1. Email classified with `action=CALENDAR` (check classifications table)
2. Calendar-Event-Extraction-Workflow executes successfully
3. Event data extracted with confidence >70%
4. Google Calendar event created
5. calendar_events record inserted
6. calendar_operations record shows status='success'
7. Telegram notification sent

**Verification Query**:
```sql
SELECT ce.title, ce.start_datetime, co.status, co.confidence_score
FROM calendar_events ce
JOIN calendar_operations co ON co.event_id = ce.id
ORDER BY ce.created_at DESC
LIMIT 5;
```

#### 4.2 Test: Multiple Appointments

Send test email:

```
Subject: Appointments This Week
Body: Dentist Monday 2pm and haircut Wednesday 10am.
```

**Expected Results**:
- 2 separate calendar events created
- Both events have correct dates/times
- Both have confidence scores
- Both operations logged in calendar_operations

#### 4.3 Test: All-Day Event

Send test email:

```
Subject: Conference Friday
Body: Annual team conference on Friday.
```

**Expected Results**:
- All-day event created (no specific time)
- start_datetime and end_datetime cover full day
- Notification flags missing time information

#### 4.4 Test: Event Update

1. Create event via email (use test from 4.1)
2. Send reschedule email in same thread:
   ```
   Subject: Re: Dentist Appointment Next Monday
   Body: Your appointment has been rescheduled to Tuesday at 3pm.
   ```

**Expected Results**:
- Event-Matching-Workflow finds original event
- Google Calendar event updated (not duplicated)
- calendar_events.updated_at timestamp updated
- calendar_operations shows operation_type='update'

#### 4.5 Test: Low Confidence Handling

Send ambiguous email:

```
Subject: Meeting Sometime
Body: Let's meet sometime next week to discuss the project.
```

**Expected Results**:
- Confidence score <70%
- calendar_operations status='pending_review'
- Telegram notification requests manual confirmation
- No calendar event created automatically

### Step 5: Production Deployment (15 minutes)

#### 5.1 Activate Workflows

In n8n, activate these workflows in order:
1. ✅ Calendar-Event-Extraction-Workflow
2. ✅ Event-Matching-Workflow
3. ✅ Calendar-Operation-Workflow
4. ✅ Email-Processing-Main (re-save to apply calendar integration)

#### 5.2 Monitor Initial Processing

Watch n8n execution logs for first 10-20 emails:

1. Go to **Executions** tab
2. Filter by workflow: "Calendar-Event-Extraction-Workflow"
3. Verify successful executions
4. Check for any errors

**Common Issues**:
- Google Calendar API permission errors → Re-authenticate credential
- Supabase connection errors → Verify Supabase credential
- AI Agent timeout → Reduce email body size in preprocessing

#### 5.3 Verify Database Writes

```sql
-- Check calendar events created today
SELECT
  COUNT(*) as events_created_today,
  AVG(confidence_score) as avg_confidence
FROM calendar_events
WHERE created_at >= CURRENT_DATE;

-- Check operation success rate
SELECT
  operation_type,
  status,
  COUNT(*) as count
FROM calendar_operations
WHERE performed_at >= CURRENT_DATE
GROUP BY operation_type, status;
```

**Healthy Metrics**:
- events_created_today > 0
- avg_confidence > 70
- Most operations status='success'

### Step 6: Monitoring & Maintenance (Ongoing)

#### Daily Monitoring

Run this query daily to check system health:

```sql
SELECT
  DATE(performed_at) as date,
  operation_type,
  status,
  COUNT(*) as operations,
  AVG(confidence_score) as avg_confidence
FROM calendar_operations
WHERE performed_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(performed_at), operation_type, status
ORDER BY date DESC, operation_type;
```

**Alert Triggers**:
- status='failure' count > 5% of total → Investigate errors
- avg_confidence < 70% → Review AI prompt, add training examples
- No operations for >4 hours (during waking hours) → Check workflow activation

#### Weekly Maintenance

1. **Review Pending Reviews**:
   ```sql
   SELECT email_id, confidence_score, error_message
   FROM calendar_operations
   WHERE status = 'pending_review'
     AND performed_at >= CURRENT_DATE - INTERVAL '7 days';
   ```

2. **Cleanup Deleted Events** (90-day retention):
   ```sql
   DELETE FROM calendar_events
   WHERE status = 'deleted'
     AND updated_at < CURRENT_DATE - INTERVAL '90 days';
   ```

3. **Check Success Criteria**:
   - SC-002: Event creation time <30s (check n8n execution times)
   - SC-003: 90% extraction accuracy (manually verify 20 events)
   - SC-007: 100% audit logging (verify calendar_operations completeness)

## Troubleshooting

### Issue: Events not being created

**Symptoms**: Classifications show action=CALENDAR but no calendar events created

**Diagnosis**:
```sql
SELECT c.action, COUNT(*) as email_count
FROM classifications c
LEFT JOIN calendar_events ce ON c.email_id = ce.email_id
WHERE c.action = 'CALENDAR'
  AND ce.id IS NULL
  AND c.classified_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY c.action;
```

**Solutions**:
1. Check Email-Processing-Main for calendar workflow trigger
2. Verify Calendar-Event-Extraction-Workflow is active
3. Check n8n execution logs for errors
4. Verify Google Calendar credential is valid

### Issue: Duplicate events created

**Symptoms**: Multiple calendar events for same email/appointment

**Diagnosis**:
```sql
SELECT ce.email_id, ce.title, COUNT(*) as duplicate_count
FROM calendar_events ce
GROUP BY ce.email_id, ce.title
HAVING COUNT(*) > 1;
```

**Solutions**:
1. Check duplicate detection logic in Calendar-Operation-Workflow
2. Verify datetime window (±1 hour) in duplicate query
3. Review title normalization in Code node

### Issue: Low confidence scores

**Symptoms**: Most events have confidence <70%, triggering manual reviews

**Diagnosis**:
```sql
SELECT
  AVG(confidence_score) as avg_confidence,
  MIN(confidence_score) as min_confidence,
  MAX(confidence_score) as max_confidence
FROM calendar_events
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
```

**Solutions**:
1. Review AI Agent system prompt in Calendar-Event-Extraction-Workflow
2. Add more examples to prompt (see research.md for patterns)
3. Consider using GPT-4 instead of GPT-4-mini (higher cost but better accuracy)
4. Increase context window to include more email content

### Issue: Google Calendar API quota exceeded

**Symptoms**: calendar_operations showing error_message about quota limits

**Diagnosis**:
```sql
SELECT
  DATE(performed_at) as date,
  COUNT(*) as api_calls
FROM calendar_operations
WHERE performed_at >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY DATE(performed_at);
```

**Solutions**:
- Daily quota is 1,000,000 calls (should be sufficient)
- If exceeded, batch operations or add rate limiting
- Consider caching calendar event list

## Next Steps

After successful deployment:

1. **Run for 7 days** to collect baseline metrics
2. **Review 20 calendar events** manually to validate extraction accuracy (SC-003 target: 90%)
3. **Measure performance** against success criteria:
   - SC-001: 95% classification accuracy for action=CALENDAR
   - SC-002: <30 seconds processing time
   - SC-003: 90% extraction accuracy
   - SC-005: Zero duplicate events
   - SC-006: <60 seconds notification delivery
   - SC-007: 100% audit logging
   - SC-008: <10% false positive rate for manual review
   - SC-009: 95% timezone handling accuracy
   - SC-010: 90% success rate for Zoom/Meet/Teams links

4. **Document edge cases** encountered in production
5. **Tune AI prompts** based on real email patterns
6. **Plan P2 features** (event updates - User Story 3)
7. **Plan P3 features** (event cancellations - User Story 4)

## Success Criteria Checklist

After 7 days of production use, verify:

- [ ] 95%+ emails with calendar content classified correctly (SC-001)
- [ ] Calendar events created in <30 seconds (SC-002)
- [ ] 90%+ extraction accuracy for date, time, title (SC-003)
- [ ] Zero duplicate events created (SC-005)
- [ ] Notifications delivered in <60 seconds (SC-006)
- [ ] 100% of operations logged in calendar_operations (SC-007)
- [ ] <10% false positive rate for manual reviews (SC-008)
- [ ] 95%+ timezone handling accuracy (SC-009)
- [ ] 90%+ success rate for meeting platform links (SC-010)

## Support Resources

- **n8n Documentation**: https://docs.n8n.io/
- **Google Calendar API**: https://developers.google.com/calendar/api/guides/overview
- **Supabase Docs**: https://supabase.com/docs
- **Feature Specification**: [spec.md](./spec.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Workflow Contracts**: [contracts/README.md](./contracts/README.md)
- **Research**: [research.md](./research.md)

## Rollback Procedure

If critical issues arise, rollback to MVP state:

1. **Deactivate new workflows**:
   - Calendar-Event-Extraction-Workflow
   - Event-Matching-Workflow
   - Calendar-Operation-Workflow

2. **Revert Email-Processing-Main**:
   - Remove calendar workflow trigger
   - Re-save workflow

3. **Preserve data** (do NOT drop tables):
   - calendar_events and calendar_operations remain for analysis
   - Can be dropped after investigation if needed

4. **Document issue** in GitHub issue tracker

5. **Investigate and fix** before re-deployment

## License & Credits

This feature is part of the Email Intelligence Workflow System.

**Constitution Compliance**: 100% n8n-native architecture, following Swim Dad Assistant reference pattern.

**Version**: 1.0.0 (Initial MVP - P1 Event Creation)
