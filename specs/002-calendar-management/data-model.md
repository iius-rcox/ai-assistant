# Data Model: Enhanced Calendar Management

**Feature**: 002-calendar-management
**Database**: Supabase PostgreSQL (xmziovusqlmgygcrgyqt)
**Extension Required**: pgvector (already installed for MVP)

## Overview

This data model extends the existing Email Intelligence Workflow System database with two new tables to support calendar event management. The design follows soft-delete patterns for audit trail preservation and supports event matching for updates/cancellations.

## Entity Relationship Diagram

```
┌─────────────────┐
│ emails          │ (EXISTING - from MVP)
│─────────────────│
│ id              │──┐
│ message_id      │  │
│ received_at     │  │
│ ...             │  │
└─────────────────┘  │
                     │
      ┌──────────────┘
      │
      │ 1:N
      ▼
┌───────────────────────┐
│ calendar_events       │ (NEW)
│───────────────────────│
│ id                    │◄──┐
│ event_id              │   │
│ email_id (FK)         │   │
│ title                 │   │
│ start_datetime        │   │
│ end_datetime          │   │
│ location              │   │
│ attendees             │   │
│ meeting_url           │   │
│ timezone              │   │
│ description           │   │
│ status                │   │ 1:N
│ confidence_score      │   │
│ created_at            │   │
│ updated_at            │   │
└───────────────────────┘   │
                            │
                            │
                            │
                  ┌─────────┘
                  │
                  ▼
        ┌──────────────────────┐
        │ calendar_operations  │ (NEW)
        │──────────────────────│
        │ id                   │
        │ operation_type       │
        │ event_id (FK)        │
        │ email_id (FK)        │
        │ status               │
        │ error_message        │
        │ confidence_score     │
        │ performed_at         │
        │ notified_user        │
        └──────────────────────┘
```

## Table: calendar_events

**Purpose**: Stores metadata about calendar events created or managed by the system. Serves as the source of truth for event matching and rollback operations.

### Schema

```sql
CREATE TABLE calendar_events (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Google Calendar event ID (unique identifier from Google Calendar API)
  event_id TEXT NOT NULL,

  -- Foreign key to source email
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,

  -- Event details (extracted from email)
  title TEXT NOT NULL,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  location TEXT,
  attendees JSONB DEFAULT '[]'::jsonb,  -- Array of email addresses
  meeting_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  description TEXT,

  -- Status tracking (for soft delete and lifecycle management)
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'deleted')),

  -- AI extraction quality
  confidence_score NUMERIC(5,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_datetime_range CHECK (end_datetime > start_datetime)
);

-- Indexes for performance
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

### Field Descriptions

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `id` | UUID | Internal unique identifier | Primary key |
| `event_id` | TEXT | Google Calendar event ID (from API response) | NOT NULL |
| `email_id` | UUID | Reference to source email | Foreign key to emails.id |
| `title` | TEXT | Event title/summary (max 1024 chars per Google Calendar API) | NOT NULL |
| `start_datetime` | TIMESTAMPTZ | Event start date and time with timezone | NOT NULL, < end_datetime |
| `end_datetime` | TIMESTAMPTZ | Event end date and time with timezone | NOT NULL, > start_datetime |
| `location` | TEXT | Event location (physical address or virtual) | Optional |
| `attendees` | JSONB | Array of attendee email addresses | Default [] |
| `meeting_url` | TEXT | Video conference URL (Zoom, Google Meet, Teams) | Optional |
| `timezone` | TEXT | IANA timezone identifier (e.g., "America/New_York") | NOT NULL, default user timezone |
| `description` | TEXT | Event description/agenda extracted from email body | Optional |
| `status` | TEXT | Event lifecycle status: active, cancelled, deleted | Enum constraint |
| `confidence_score` | NUMERIC(5,2) | AI extraction confidence (0-100%) | 0-100 range |
| `created_at` | TIMESTAMPTZ | Record creation timestamp | Auto-set |
| `updated_at` | TIMESTAMPTZ | Last modification timestamp | Auto-updated |

### Status Lifecycle

- **active**: Event is current and exists in Google Calendar
- **cancelled**: Event was cancelled (multi-attendee events preserve record)
- **deleted**: Event was deleted from Google Calendar (soft delete for audit trail)

**Soft Delete Policy**: When a Google Calendar event is deleted (either by system or manually), the `calendar_events` record is updated to `status='deleted'` rather than being removed from the database. This preserves audit trail and enables rollback capabilities (FR-007, Operational Constraints).

**Data Retention**: Records with `status='deleted'` are retained for 90 days per Business Constraint, then archived or purged.

## Table: calendar_operations

**Purpose**: Audit log for all calendar operations (create, update, delete). Provides 100% logging coverage (FR-013, SC-007) and enables debugging and performance analysis.

### Schema

```sql
CREATE TABLE calendar_operations (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Operation type
  operation_type TEXT NOT NULL CHECK (operation_type IN ('create', 'update', 'delete')),

  -- Foreign keys
  event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,  -- NULL for failed creates
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,

  -- Operation result
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'pending_review')),
  error_message TEXT,

  -- AI confidence at operation time
  confidence_score NUMERIC(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- Timestamps
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Notification tracking
  notified_user BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes for querying
CREATE INDEX idx_calendar_operations_operation_type ON calendar_operations(operation_type);
CREATE INDEX idx_calendar_operations_status ON calendar_operations(status);
CREATE INDEX idx_calendar_operations_email_id ON calendar_operations(email_id);
CREATE INDEX idx_calendar_operations_performed_at ON calendar_operations(performed_at DESC);
```

### Field Descriptions

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `id` | UUID | Unique operation identifier | Primary key |
| `operation_type` | TEXT | Type of operation: create, update, delete | Enum constraint |
| `event_id` | UUID | Reference to calendar_events record (NULL for failed creates) | Foreign key |
| `email_id` | UUID | Reference to source email | Foreign key to emails.id |
| `status` | TEXT | Operation outcome: success, failure, pending_review | Enum constraint |
| `error_message` | TEXT | Error details if status=failure | Optional |
| `confidence_score` | NUMERIC(5,2) | AI confidence at operation time (0-100%) | 0-100 range |
| `performed_at` | TIMESTAMPTZ | When operation was executed | Auto-set |
| `notified_user` | BOOLEAN | Whether user was notified via Telegram | Default FALSE |

### Status Values

- **success**: Operation completed successfully
- **failure**: Operation failed (Google Calendar API error, validation error)
- **pending_review**: Operation requires manual review (confidence <70%, ambiguous event)

## Event Matching Metadata (Virtual)

**Note**: Event matching does NOT require a separate table. Matching logic is implemented in n8n workflows using:

1. **Email Thread Matching**: `emails.thread_id` (already exists in MVP schema)
2. **Title Normalization**: Computed in Code node (lowercase, trim, remove punctuation)
3. **Datetime Proximity**: SQL query on `calendar_events.start_datetime` within ±1 hour window
4. **Attendee Fingerprint**: Computed hash of sorted attendee email array

**Matching Query Pattern** (executed in Supabase node):

```sql
SELECT ce.*
FROM calendar_events ce
JOIN emails e ON ce.email_id = e.id
WHERE ce.status = 'active'
  AND e.thread_id = :thread_id
  AND lower(regexp_replace(ce.title, '[^a-zA-Z0-9 ]', '', 'g')) = :normalized_title
  AND ce.start_datetime BETWEEN :target_datetime - INTERVAL '1 hour'
                             AND :target_datetime + INTERVAL '1 hour'
ORDER BY ce.created_at DESC
LIMIT 1;
```

## Migration from MVP

**Existing Tables (No Changes Required)**:
- `emails`: Already stores email metadata including thread_id for matching
- `classifications`: Already includes action=CALENDAR classification
- `notifications`: Already supports different notification types (will add calendar notifications)

**New Tables**:
- `calendar_events`: Stores calendar event metadata
- `calendar_operations`: Audit log for calendar operations

## Data Volume Estimates

**Assumptions** (from spec Scale/Scope):
- ~10-50 calendar events per day
- ~15 events/day average
- 90-day retention for deleted events

**Monthly Volumes**:
- `calendar_events`: ~450 active + ~450 deleted (soft delete) = 900 records/month
- `calendar_operations`: ~450 creates + ~50 updates + ~50 deletes = 550 records/month

**Annual Volumes**:
- `calendar_events`: ~10,800 records (with 90-day retention, steady state ~1,350 records)
- `calendar_operations`: ~6,600 records (no automatic deletion, grows indefinitely)

**Storage Impact**: Minimal - each record ~1-2KB, total <15MB/year

## Security Considerations

**PII Data**:
- `attendees`: Contains email addresses (PII)
- `location`: May contain home addresses (PII)
- `description`: May contain sensitive meeting details

**Access Control** (via Supabase RLS):
- All tables accessible only via n8n service account (Supabase service key)
- No public/user-level access
- n8n credentials stored in encrypted credential vault

**Data Retention**:
- Active events: Retained indefinitely
- Deleted events: 90-day retention, then archived/purged
- Operations log: Retained for 1 year for audit compliance

## Performance Considerations

**Indexes**:
- Primary key indexes on all tables (automatic)
- Foreign key indexes for JOIN performance
- `start_datetime` index for date range queries
- GIN index on `title` for full-text search
- Composite index on `(status, start_datetime)` for active event queries

**Query Patterns**:
- Event matching: ~10ms (indexed thread_id + datetime range)
- Duplicate detection: ~5ms (indexed title + datetime)
- Audit log queries: ~10ms (indexed performed_at)

**Scalability**:
- Current design supports 100K+ events without performance degradation
- pgvector already installed for future ML enhancements (duplicate detection, smart matching)

## Integration with n8n Workflows

**Workflow → Database Mapping**:

1. **Calendar-Event-Extraction-Workflow**:
   - Reads: `emails.id`, `emails.body`, `emails.thread_id`
   - Writes: Nothing (returns extracted event data as JSON)

2. **Calendar-Operation-Workflow**:
   - Reads: `calendar_events` (for update/delete operations)
   - Writes: `calendar_events` (INSERT for creates, UPDATE for updates/deletes)
   - Writes: `calendar_operations` (INSERT for all operations)

3. **Event-Matching-Workflow**:
   - Reads: `emails.thread_id`, `calendar_events` (for matching query)
   - Writes: Nothing (returns matched event_id or NULL)

4. **Calendar-Notification-Enhancement**:
   - Reads: `calendar_operations` (to check if notification needed)
   - Updates: `calendar_operations.notified_user = TRUE`

**n8n Node Types Used**:
- Supabase node (native): All database operations
- Code node (JavaScript): Title normalization, datetime calculations
- No custom SQL beyond what Supabase node supports

## Testing Strategy

**Data Validation Tests**:
1. Constraint enforcement (status enum, datetime range, confidence score 0-100)
2. Soft delete behavior (status update, not record deletion)
3. Foreign key integrity (cascade deletes from emails)
4. Timestamp auto-updates (updated_at trigger)

**Query Performance Tests**:
1. Event matching query <10ms (10K event dataset)
2. Duplicate detection query <5ms (10K event dataset)
3. Audit log retrieval <10ms (1K operation dataset)

**Integration Tests**:
1. Round-trip create → read → update → soft delete workflow
2. Concurrent event creation (no duplicate event_id violations)
3. Event matching across email threads

## Future Enhancements (Out of Scope for MVP)

1. **Event Series Table**: Support for recurring events (currently out of scope per spec)
2. **Event Attachments**: Store meeting materials linked to events
3. **Conflict Detection**: Table for tracking scheduling conflicts
4. **Calendar Preferences**: User-specific calendar rules and automation settings
5. **ML-Based Matching**: Use pgvector embeddings for fuzzy event matching
