# Research: Enhanced Calendar Management

## 1. Google Calendar Node Capabilities

### Node Type
**nodes-base.googleCalendar** (n8n-nodes-base.googleCalendar)

**Category**: Input
**Version**: 1.3 (versioned)
**Package**: n8n-nodes-base
**AI Tool Compatible**: Yes (can be used as an AI Agent tool)

### Operations Supported

The Google Calendar node supports two main resources:

#### **Calendar Resource**
- **Availability**: Check if a time-slot is available in a calendar

#### **Event Resource**
- **Create**: Add an event to calendar
- **Delete**: Delete an event
- **Get**: Retrieve an event
- **Get Many**: Retrieve all events from a calendar
- **Update**: Update an event

### Required Credentials
**OAuth2 Authentication** (Google Calendar API)
- Required scopes:
  - `https://www.googleapis.com/auth/calendar` (full calendar access)
  - `https://www.googleapis.com/auth/calendar.events` (events access)

### Create Event Operation

**Required Parameters:**
- `calendar`: Google Calendar to operate on (resourceLocator type)
- `start`: Start time of the event (dateTime format, default: `={{ $now }}`)
- `end`: End time of the event (dateTime format, default: `={{ $now.plus(1, 'hour') }}`)

**Optional Parameters:**
- `summary`: Event title/name
- `description`: Event description
- `location`: Event location
- `attendees`: List of attendees (email addresses)
- `sendUpdates`: Whether to send notifications to attendees
- `colorId`: Event color
- `conferenceData`: Video conference details (Google Meet, etc.)
- `reminders`: Custom reminder settings
- `transparency`: Show as busy/free
- `visibility`: Public, private, or default

**Response Format:**
Returns a Google Calendar event object with:
- Event ID
- Summary, description, location
- Start/end times (with timezone)
- Attendees list
- HTML link to event
- Created/updated timestamps
- iCalUID

### Update Event Operation

**Required Parameters:**
- `calendar`: Calendar ID
- `eventId`: ID of the event to update
- Any field to be updated (summary, start, end, etc.)

**Optional Parameters:**
Same as Create Event operation

**Best Practice**: Use `sendUpdates` parameter to control attendee notifications:
- `all`: Send notifications to all attendees
- `externalOnly`: Only external attendees
- `none`: No notifications

### Delete Event Operation

**Required Parameters:**
- `calendar`: Calendar ID
- `eventId`: ID of the event to delete

**Optional Parameters:**
- `sendUpdates`: Notification preference for deletion

### Get Event Operation

**Required Parameters:**
- `calendar`: Calendar ID
- `eventId`: Event ID to retrieve

**Response**: Full event object with all details

### Get Many (List/Search) Events Operation

**Required Parameters:**
- `calendar`: Calendar ID
- `timeMin`: Start of the time range (dateTime)
- `timeMax`: End of the time range (dateTime)

**Optional Parameters:**
- `query`: Free text search query (searches title, description, location, attendees)
- `orderBy`: Sort order (startTime, updated)
- `singleEvents`: Expand recurring events into instances
- `maxResults`: Maximum number of events to return (default: 250)
- `timeZone`: Time zone for the response

**Query Capabilities:**
- Free-text search across event fields
- Date range filtering (timeMin/timeMax)
- Can search by attendee email
- Can filter by event status (confirmed, tentative, cancelled)

**Filtering Options:**
- Date/time range (required)
- Text search (optional)
- Updated time (for sync)
- Private extended properties (for custom metadata)

### Availability Check Operation

**Required Parameters:**
- `calendar`: Calendar ID
- `timeMin`: Start of interval to check
- `timeMax`: End of interval to check

**Response**: Boolean indicating if the time slot is free

### Rate Limits and Error Handling

**Rate Limits:**
- Standard tier: 1,000,000 queries per day
- Per-user limit: 1 query per second
- Burst allowance available

**Error Handling Patterns:**
- 403 Forbidden: Check OAuth scopes
- 404 Not Found: Event or calendar doesn't exist
- 409 Conflict: Event already exists (for duplicate prevention)
- 429 Too Many Requests: Implement exponential backoff

**Best Practices:**
- Use batch operations when possible
- Implement retry logic with exponential backoff
- Cache calendar IDs and event metadata
- Use `updatedMin` parameter for incremental sync
- Set appropriate `timeZone` to avoid ambiguity

### Timezone Handling

**Critical Considerations:**
- All datetime parameters support timezone specification
- Use IANA timezone format (e.g., "America/New_York")
- Default timezone is calendar's timezone setting
- Store original timezone information for updates
- Use Luxon expressions for date calculations: `={{ $now }}`, `={{ $now.plus(1, 'hour') }}`

## 2. AI Event Extraction Patterns

### Recommended Approach: AI Agent + Structured Output Parser

Based on analysis of 2,266+ n8n templates using AI Agent for extraction tasks, the industry-standard pattern is:

```
Gmail/Email Node
  ↓
AI Agent (OpenAI/Gemini)
  ├── Structured Output Parser (enforces JSON schema)
  └── Language Model (GPT-4o-mini, Gemini, Claude)
  ↓
Code Node (data transformation/validation)
  ↓
Google Calendar Node (create/update event)
```

### Best Practices from Production Templates

**1. Two-Agent Pattern for Complex Extraction:**
- **Reader Agent**: Extracts raw structured data from email
- **Analyzer Agent**: Validates, enriches, and normalizes the data

**Example from Template #6735 (IT Support workflow):**
- First Agent: "Support Request Reader" (extracts title, description, requester, department, priority)
- Second Agent: "IT Support Advisor" (validates and generates recommendations)

**2. Structured Output Parser Configuration:**

**Schema Definition (JSON Schema):**
```json
{
  "type": "object",
  "properties": {
    "title": {"type": "string", "description": "Event title/summary"},
    "start_datetime": {"type": "string", "description": "Start date/time in ISO 8601 format"},
    "end_datetime": {"type": "string", "description": "End date/time in ISO 8601 format"},
    "location": {"type": "string", "description": "Event location"},
    "attendees": {"type": "array", "items": {"type": "string"}, "description": "Email addresses of attendees"},
    "meeting_url": {"type": "string", "description": "Video conference URL (Zoom, Meet, etc.)"},
    "timezone": {"type": "string", "description": "IANA timezone (e.g., America/New_York)"},
    "description": {"type": "string", "description": "Event description/notes"},
    "confidence": {"type": "number", "description": "Confidence score 0.0-1.0"},
    "event_action": {"type": "string", "enum": ["CREATE", "UPDATE", "DELETE"], "description": "Action to take"}
  },
  "required": ["title", "start_datetime", "end_datetime", "event_action"]
}
```

**3. Auto-Fixing Output Parser Pattern (Template #4316):**

For improved reliability, use the **Auto-fixing Output Parser** node in series:
```
AI Agent
  ↓
Structured Output Parser (defines schema)
  ↓
Auto-fixing Output Parser (corrects malformed JSON)
  ↓
Switch Node (validation routing)
```

**4. Retry Logic with Manual Schema Validation (Template #4316):**

Instead of relying solely on Structured Output Parser (which can be unreliable), implement:
- Manual schema validation in Code node
- `runIndex` counter for retry tracking
- Switch node routing:
  - If valid → proceed to Calendar creation
  - If invalid → loop back to AI Agent with correction prompt (max 4 retries)

### Example Prompt Structure for Event Extraction

**System Message:**
```
You are an AI assistant that extracts calendar event information from emails.

Your task:
1. Identify event details (title, date/time, location, attendees)
2. Normalize dates to ISO 8601 format (YYYY-MM-DDTHH:MM:SS)
3. Detect timezone from context (email signature, location, or default to user's timezone)
4. Extract video conference URLs (Zoom, Google Meet, Teams)
5. Determine event action: CREATE, UPDATE, or DELETE

Rules:
- For relative dates ("tomorrow", "next Tuesday"), calculate absolute dates based on email received date
- For time ranges ("2-3pm"), create start and end times
- If no end time specified, default to 1 hour duration
- Extract all email addresses mentioned as potential attendees
- Confidence score should reflect certainty of extraction (0.0-1.0)

Output Format: Strict JSON matching the provided schema
```

**User Message Template:**
```
Email Subject: {{ $json.subject }}
Email Body: {{ $json.body }}
Email Received Date: {{ $json.receivedDate }}
Sender: {{ $json.from }}
User's Default Timezone: America/New_York

Extract calendar event information.
```

### Extraction Fields Detail

**Title (required):**
- Extract from subject line or body
- Remove "FW:", "RE:", etc.
- Limit to 100 characters

**Start/End DateTime (required):**
- Parse natural language: "tomorrow at 2pm", "next Monday 10:00 AM"
- Handle ranges: "2-3pm" → start: 14:00, end: 15:00
- Default duration: 1 hour if end time not specified
- Format: ISO 8601 with timezone

**Location (optional):**
- Physical addresses
- Room numbers ("Conference Room A")
- "Virtual" for online meetings

**Attendees (optional):**
- Extract email addresses from body, CC, To fields
- Validate email format
- Deduplicate list

**Meeting URL (optional):**
- Detect Zoom: `https://zoom.us/j/...`
- Detect Google Meet: `https://meet.google.com/...`
- Detect Teams: `https://teams.microsoft.com/...`
- Store in `description` or `conferenceData` field

**Timezone (recommended):**
- Extract from location context ("EST", "Pacific Time")
- Parse from email headers
- Default to user's configured timezone
- Format: IANA timezone database format

**Description (optional):**
- Original email body (cleaned)
- Meeting agenda
- Notes/context

**Confidence (recommended):**
- 0.9-1.0: All key fields present and unambiguous
- 0.7-0.9: Most fields present, some inference required
- 0.5-0.7: Significant ambiguity (e.g., unclear date)
- < 0.5: Low confidence, should flag for manual review

**Event Action (required):**
- CREATE: New event request
- UPDATE: Modification to existing event ("rescheduled", "new time")
- DELETE: Cancellation ("cancelled", "no longer meeting")

### Multi-Language Support

**Pattern from Template #3606 (Document Analysis):**
- Use Translation Agent first if needed
- Check language with AI, translate to English before extraction
- Preserve original timezone/location context

**Languages Tested:**
- English, Spanish, French, German, Italian, Portuguese
- AI models handle multi-language extraction natively (GPT-4, Gemini)

## 3. Event Matching Strategies

### Duplicate Detection Pattern

**Approach 1: Title Normalization + DateTime Proximity**

**Title Normalization:**
```javascript
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/^(re|fw|fwd):\s*/i, '')  // Remove email prefixes
    .replace(/[^\w\s]/g, '')            // Remove special chars
    .trim();
}
```

**DateTime Proximity:**
- Same day AND same hour → likely duplicate
- Within 15 minutes AND similar title → duplicate
- Exact match on normalized title + same start time → duplicate

**Implementation (Code Node):**
```javascript
const newEvent = {
  title: normalizeTitle($json.title),
  start: new Date($json.start_datetime),
  end: new Date($json.end_datetime)
};

// Search existing events (from Get Many operation)
const existingEvents = $('Google Calendar').all();

const isDuplicate = existingEvents.some(event => {
  const titleMatch = normalizeTitle(event.summary) === newEvent.title;
  const startDiff = Math.abs(new Date(event.start.dateTime) - newEvent.start);
  const withinHour = startDiff < 60 * 60 * 1000; // 1 hour

  return titleMatch && withinHour;
});

return { isDuplicate, newEvent };
```

### Update Matching Strategy

**Approach 2: Email Thread ID + Event Search**

**Pattern from Production Workflows:**

1. **Thread-based Matching:**
   - Store Gmail `threadId` in event's `extendedProperties.private` field on creation
   - For updates, check if email is part of existing thread
   - If match found, retrieve original event ID

2. **Fuzzy Title Matching:**
   - Use Levenshtein distance or similar algorithm
   - Match threshold: 80% similarity

3. **Attendee Overlap:**
   - Compare attendee lists
   - 75%+ overlap → likely same event

**Implementation Pattern:**

```
Gmail Trigger (email received)
  ↓
AI Agent (extract event data + detect action: CREATE/UPDATE/DELETE)
  ↓
Switch Node (route by event_action)
  ↓
[IF UPDATE/DELETE]
  ↓
Google Calendar: Get Many
  ├─ Search by timeMin/timeMax (±2 weeks from extracted date)
  ├─ Filter by query (normalized title)
  └─ Filter by extendedProperties.private.emailThreadId
  ↓
Code Node: Find Best Match
  ├─ Score each candidate by: title similarity, date proximity, attendee overlap
  ├─ Select highest score > threshold (0.8)
  └─ Return eventId
  ↓
Google Calendar: Update or Delete (using matched eventId)
```

### Calendar Event Metadata for Tracking

**Store Custom Metadata in Event Creation:**

```json
{
  "summary": "Team Sync Meeting",
  "start": {...},
  "end": {...},
  "extendedProperties": {
    "private": {
      "emailThreadId": "18a3c5f2e8f9d1a2",
      "emailMessageId": "<abc123@gmail.com>",
      "createdByWorkflow": "002-calendar-management",
      "extractedBy": "AI-Agent-v1",
      "confidence": "0.95",
      "originalSubject": "RE: Sync Meeting Tomorrow"
    }
  }
}
```

**Benefits:**
- Enables reliable update/delete matching
- Tracks AI confidence for quality monitoring
- Links calendar event back to source email
- Supports audit trail and correction workflow

### Recurring Event Handling

**Challenge:** Email says "weekly team meeting" or "moved to next week"

**Strategy:**
- Use AI to detect recurring patterns: "every Monday", "weekly", "biweekly"
- Create single instance vs. recurring event based on context
- For updates to recurring events:
  - If "this instance only" → update single event
  - If "all future events" → requires deleting recurring event and creating new one
  - Use `recurringEventId` field to link instances

**Recommendation for MVP:**
- Focus on single events first
- Flag recurring patterns for manual handling
- Phase 2: Implement recurring event support

## 4. Best Practices from Templates

### Template Analysis Summary

**Analyzed Templates:** 10 high-relevance templates (views: 197 - 20,807)

**Key Patterns Identified:**

1. **AI Model Selection:**
   - **GPT-4o-mini**: Most popular (6/10 templates) - best cost/performance ratio
   - **Gemini**: Second choice (3/10) - good for multi-language
   - **Claude Sonnet**: Used for complex reasoning tasks

2. **Email Processing:**
   - **Gmail Trigger** preferred over polling (8/10 templates)
   - Filter node to skip already-processed emails (mark as read)
   - Deduplication using message ID or labels

3. **Data Flow Architecture:**
   ```
   Email → Extract → Validate → Enrich → Store → Notify
   ```

4. **Error Handling:**
   - Confidence thresholds: flag events < 0.7 for manual review
   - Fallback to human-in-loop for ambiguous cases
   - Notification to Slack/email when extraction fails

5. **Notification Patterns:**
   - Send confirmation email to requester (Template #4771)
   - Notify team channel (Slack) with event summary
   - Include calendar link in notification

### Template Examples Relevant to Calendar Management

**Template #3320: "Post New Google Calendar Events to Telegram"**
- Pattern: Google Calendar Trigger → Format message → Send to Telegram
- Use case: Notify users when events are created
- Relevance: Reverse flow - can be adapted for confirmation notifications

**Template #3393: "Google Calendar Reminder System with GPT-4o and Telegram"**
- Pattern: Schedule trigger → Get events → AI summary → Telegram notification
- Key feature: 1-hour advance reminders with friendly AI-generated messages
- Use case: Event reminders (potential Phase 2 feature)

**Template #4783: "Automated Weekly Google Calendar Summary via Email"**
- Pattern: Schedule → Get events (7 days) → AI summary → Email
- AI generates "friendly greeting + grouped by day + weekly insight"
- Use case: Weekly digest (Phase 2/3 feature)

**Template #6735: "Automate IT Support: Convert Emails to Jira with AI"**
- Pattern: Gmail → Reader Agent → Create Ticket → Advisor Agent → Notify
- Two-agent approach: Extract + Validate/Enrich
- Highly applicable to email → calendar workflow

**Template #4771: "Turn Monoprix Delivery Emails into Calendar Events"**
- Pattern: Gmail → ChatGPT extraction → Format → Google Calendar
- Specific use case: confirmation emails → delivery slot events
- Direct precedent for email → calendar automation

## 5. Implementation Recommendations

### Decision: AI Agent + Structured Output Parser + Google Calendar Native Nodes

**Rationale:**
1. **n8n-Native First**: Google Calendar node provides all required operations (create, update, delete, search)
2. **Proven Pattern**: AI Agent + Structured Output Parser is the industry standard (1,000+ templates)
3. **Reliability**: Structured Output Parser enforces schema, reduces malformed responses
4. **Constitution Compliance**: 100% native n8n nodes (no custom code except data transformation)

### Architecture Pattern

```
Email-Processing-Main Workflow (already exists)
  ↓
Classification-Workflow (already exists)
  ↓ [IF action_type: CALENDAR]
  ↓
Calendar-Event-Extraction (NEW)
  ├─ AI Agent: Event Extractor
  ├─ Structured Output Parser (JSON schema)
  └─ Auto-fixing Output Parser (reliability)
  ↓
Calendar-Event-Matching (NEW)
  ├─ Google Calendar: Get Many (search existing events)
  ├─ Code Node: Find duplicate/match
  └─ Switch: CREATE vs UPDATE vs DELETE vs DUPLICATE
  ↓
Calendar-Event-Actions (NEW)
  ├─ [CREATE] Google Calendar: Create Event
  ├─ [UPDATE] Google Calendar: Update Event
  ├─ [DELETE] Google Calendar: Delete Event
  └─ [DUPLICATE] Skip (log to Supabase)
  ↓
Notification-Workflow (already exists, extend)
  └─ Send confirmation to user with calendar link
```

### Configuration Recommendations

**AI Agent Configuration:**
- **Model**: GPT-4o-mini (cost-effective, reliable for extraction)
- **Fallback**: Gemini 1.5 Flash (if OpenAI fails)
- **Temperature**: 0.2 (low for deterministic extraction)
- **Max Tokens**: 1000 (sufficient for structured output)

**Structured Output Parser Schema:**
- Include all fields listed in Section 2 (title, start_datetime, end_datetime, etc.)
- Mark `confidence` and `event_action` as required
- Set `additionalProperties: false` to prevent hallucination

**Google Calendar Node:**
- **Calendar ID**: Use user's primary calendar or configured calendar ID
- **Timezone**: Default to `America/New_York` (configurable via .env)
- **Send Updates**: `none` for AI-created events (avoid spam), user can manually invite
- **Extended Properties**: Store email metadata for matching

**Duplicate Detection:**
- Search window: ±14 days from extracted event date
- Title similarity threshold: 80% (Levenshtein distance)
- Time proximity: ±1 hour

**Confidence Thresholds:**
- ≥ 0.8: Auto-create event
- 0.5-0.8: Create event, flag for user review (Slack notification)
- < 0.5: Skip, send to manual review queue (Supabase + Slack)

### Data Model Extensions (Supabase)

**New Table: `calendar_events`**
```sql
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID REFERENCES emails(id),
  google_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_action VARCHAR(10) CHECK (event_action IN ('CREATE', 'UPDATE', 'DELETE')),
  title VARCHAR(255) NOT NULL,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  location VARCHAR(255),
  attendees TEXT[], -- Array of email addresses
  meeting_url TEXT,
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  confidence NUMERIC(3,2),
  extraction_metadata JSONB, -- Store AI agent response
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_email_id ON calendar_events(email_id);
CREATE INDEX idx_calendar_events_start_datetime ON calendar_events(start_datetime);
CREATE INDEX idx_calendar_events_google_event_id ON calendar_events(google_event_id);
```

**Update Existing: `email_actions` table**
- Add action type: `CALENDAR_CREATE`, `CALENDAR_UPDATE`, `CALENDAR_DELETE`

### Alternatives Considered

**Alternative 1: Code Node with chrono-node library**
- Pros: More control over date parsing
- Cons: Not n8n-native, requires Execute Command node, Constitution violation
- Verdict: Rejected (Constitution: n8n-native first)

**Alternative 2: Information Extractor Node (LangChain)**
- Pros: Built for extraction tasks
- Cons: Less flexible than AI Agent, no confidence scoring
- Verdict: Consider for Phase 2 optimization

**Alternative 3: Basic LLM Chain + Structured Output Parser**
- Pros: Simpler node graph
- Cons: No tool use, no iterative refinement
- Verdict: Rejected (AI Agent provides better reliability)

**Alternative 4: Manual Rule-Based Parsing**
- Pros: Deterministic, no AI cost
- Cons: Fragile, can't handle natural language variation
- Verdict: Rejected (too limited for real-world emails)

### Performance Targets

**Processing Time:**
- Email → Event Creation: < 10 seconds (target: 5 seconds)
- Duplicate Check: < 2 seconds (Calendar API search)

**Accuracy:**
- Event extraction accuracy: ≥ 90% (based on confidence scores)
- Duplicate detection precision: ≥ 95% (avoid false positives)

**Scalability:**
- Handle up to 50 calendar events/day (Google API limits)
- Batch processing: process up to 10 emails concurrently

### Risk Mitigation

**Risk 1: Incorrect Date Parsing**
- Mitigation: Confidence scoring, manual review for < 0.8
- Fallback: User confirmation email before creation

**Risk 2: Duplicate Event Creation**
- Mitigation: Robust matching algorithm (thread ID + title + date proximity)
- Fallback: Manual deduplication via Google Calendar UI

**Risk 3: Timezone Errors**
- Mitigation: Always store IANA timezone, validate against user's default
- Fallback: Default to user's configured timezone (America/New_York)

**Risk 4: Calendar API Rate Limits**
- Mitigation: Implement exponential backoff, batch operations
- Fallback: Queue events in Supabase, retry later

**Risk 5: AI Hallucination (incorrect extraction)**
- Mitigation: Structured Output Parser + Auto-fixing + confidence thresholds
- Fallback: Human-in-loop review for low confidence events

### Next Steps (Implementation Planning)

1. **Phase 0: Research** ✅ (Complete - this document)
2. **Phase 1: Planning** (Next: run `/speckit.plan`)
   - Generate data-model.md (calendar_events table, email_actions updates)
   - Create contracts/ (AI Agent prompts, API schemas)
   - Generate quickstart.md
3. **Phase 2: Task Generation** (run `/speckit.tasks`)
   - Dependency-ordered tasks for implementation
4. **Phase 3: Implementation** (run `/speckit.implement`)
   - Build 3 new workflows via n8n MCP
   - Test with sample emails
   - Deploy to production

---

**Research Complete:** 2025-11-16
**Next Command:** `/speckit.plan` to generate implementation plan
