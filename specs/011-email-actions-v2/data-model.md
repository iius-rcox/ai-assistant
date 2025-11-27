# Data Model: Email Actions V2

**Feature**: 011-email-actions-v2
**Date**: 2025-11-27
**Database**: Supabase PostgreSQL (project: xmziovusqlmgygcrgyqt)

## Overview

This document defines the database schema changes required for the Email Actions V2 feature. The changes include:

1. **Action enum migration**: Replace old actions (FYI, RESPOND, TASK, PAYMENT, CALENDAR, NONE) with new actions (IGNORE, SHIPMENT, DRAFT_REPLY, JUNK, NOTIFY, CALENDAR)
2. **New tables**: shipments, drafts, calendar_events, sender_lists, action_logs
3. **Modified tables**: classifications (new action_v2 column)

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────────┐
│     emails      │───────│   classifications   │
│  (existing)     │  1:1  │    (modified)       │
└─────────────────┘       └─────────────────────┘
        │                          │
        │ 1:N                      │ 1:1 (action determines entity)
        ▼                          ▼
┌─────────────────┐       ┌─────────────────────┐
│  action_logs    │       │     shipments       │  (if action=SHIPMENT)
│     (new)       │       │       (new)         │
└─────────────────┘       └─────────────────────┘
        │
        │                 ┌─────────────────────┐
        │                 │      drafts         │  (if action=DRAFT_REPLY)
        │                 │       (new)         │
        │                 └─────────────────────┘
        │
        │                 ┌─────────────────────┐
        │                 │  calendar_events    │  (if action=CALENDAR)
        │                 │       (new)         │
        │                 └─────────────────────┘

┌─────────────────┐
│  sender_lists   │  (independent - safelist/blacklist)
│     (new)       │
└─────────────────┘
```

---

## Table Definitions

### 1. Classifications Table (MODIFIED)

**Purpose**: Add new action column to support the v2 action types while preserving backward compatibility.

```sql
-- Migration: 20251127_action_enum_migration.sql

-- Add new action column with v2 values
ALTER TABLE classifications
ADD COLUMN action_v2 TEXT CHECK (action_v2 IN (
  'IGNORE', 'SHIPMENT', 'DRAFT_REPLY', 'JUNK', 'NOTIFY', 'CALENDAR'
));

-- Add confidence threshold used for auto-assignment
ALTER TABLE classifications
ADD COLUMN action_confidence DECIMAL(3,2) CHECK (action_confidence >= 0 AND action_confidence <= 1);

-- Add flag for automatic vs manual assignment
ALTER TABLE classifications
ADD COLUMN action_auto_assigned BOOLEAN DEFAULT true;

-- Add tracking info detection flag (for SHIPMENT availability)
ALTER TABLE classifications
ADD COLUMN has_tracking_info BOOLEAN DEFAULT false;

-- Add date detection flag (for CALENDAR availability)
ALTER TABLE classifications
ADD COLUMN has_date_info BOOLEAN DEFAULT false;

-- Migrate existing action values to action_v2
UPDATE classifications SET action_v2 = CASE
  WHEN action = 'FYI' THEN 'IGNORE'
  WHEN action = 'RESPOND' THEN 'DRAFT_REPLY'
  WHEN action = 'TASK' THEN 'NOTIFY'
  WHEN action = 'PAYMENT' THEN 'NOTIFY'
  WHEN action = 'CALENDAR' THEN 'CALENDAR'
  WHEN action = 'NONE' THEN 'IGNORE'
  ELSE 'IGNORE'
END;

-- Set NOT NULL after migration
ALTER TABLE classifications
ALTER COLUMN action_v2 SET NOT NULL;

-- Add index for action_v2 queries
CREATE INDEX idx_classifications_action_v2 ON classifications(action_v2);

-- Comment the column
COMMENT ON COLUMN classifications.action_v2 IS 'Email Actions V2: IGNORE, SHIPMENT, DRAFT_REPLY, JUNK, NOTIFY, CALENDAR';
COMMENT ON COLUMN classifications.action_confidence IS 'Confidence score at time of action assignment (0.00-1.00)';
COMMENT ON COLUMN classifications.action_auto_assigned IS 'True if action was auto-assigned by system, false if manually selected';
COMMENT ON COLUMN classifications.has_tracking_info IS 'True if email contains tracking/shipping information';
COMMENT ON COLUMN classifications.has_date_info IS 'True if email contains date/event information';
```

**Column Summary**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| action_v2 | TEXT | NOT NULL | - | New action type (one of 6 values) |
| action_confidence | DECIMAL(3,2) | YES | - | Confidence when action was assigned |
| action_auto_assigned | BOOLEAN | YES | true | System vs manual assignment |
| has_tracking_info | BOOLEAN | YES | false | Enables SHIPMENT action |
| has_date_info | BOOLEAN | YES | false | Enables CALENDAR action |

---

### 2. Shipments Table (NEW)

**Purpose**: Store extracted shipment/tracking information from emails with SHIPMENT action.

```sql
-- Migration: 20251127_shipments_table.sql

CREATE TABLE shipments (
  id BIGSERIAL PRIMARY KEY,
  email_id BIGINT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  classification_id BIGINT NOT NULL REFERENCES classifications(id) ON DELETE CASCADE,

  -- Tracking information
  tracking_number TEXT NOT NULL,
  carrier TEXT NOT NULL CHECK (carrier IN (
    'USPS', 'UPS', 'FedEx', 'Amazon', 'DHL', 'OnTrac', 'LaserShip', 'Other'
  )),
  carrier_tracking_url TEXT, -- Generated URL to carrier tracking page

  -- Item information
  items JSONB DEFAULT '[]'::jsonb, -- Array of {name, quantity, price}

  -- Delivery information
  estimated_delivery DATE,
  actual_delivery DATE,
  delivery_status TEXT DEFAULT 'in_transit' CHECK (delivery_status IN (
    'label_created', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'unknown'
  )),

  -- Metadata
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  last_status_check TIMESTAMPTZ,
  extraction_confidence DECIMAL(3,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(email_id) -- One shipment per email
);

-- Indexes
CREATE INDEX idx_shipments_email_id ON shipments(email_id);
CREATE INDEX idx_shipments_tracking ON shipments(tracking_number, carrier);
CREATE INDEX idx_shipments_delivery_status ON shipments(delivery_status) WHERE delivery_status != 'delivered';
CREATE INDEX idx_shipments_estimated_delivery ON shipments(estimated_delivery) WHERE estimated_delivery IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE shipments IS 'Extracted shipment tracking information from SHIPMENT action emails';
COMMENT ON COLUMN shipments.items IS 'JSON array: [{name: "Product Name", quantity: 1, price: "19.99"}]';
COMMENT ON COLUMN shipments.carrier_tracking_url IS 'Direct URL to carrier tracking page for this shipment';
```

**Column Summary**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGSERIAL | PK | auto | Primary key |
| email_id | BIGINT | NOT NULL | - | FK to emails table |
| classification_id | BIGINT | NOT NULL | - | FK to classifications table |
| tracking_number | TEXT | NOT NULL | - | Shipment tracking number |
| carrier | TEXT | NOT NULL | - | Carrier name (USPS, UPS, etc.) |
| carrier_tracking_url | TEXT | YES | - | URL to carrier tracking page |
| items | JSONB | YES | [] | Array of item objects |
| estimated_delivery | DATE | YES | - | Expected delivery date |
| actual_delivery | DATE | YES | - | Actual delivery date |
| delivery_status | TEXT | YES | in_transit | Current status |
| extracted_at | TIMESTAMPTZ | YES | NOW() | When data was extracted |
| last_status_check | TIMESTAMPTZ | YES | - | Last API status check |
| extraction_confidence | DECIMAL(3,2) | YES | - | AI confidence in extraction |

---

### 3. Drafts Table (NEW)

**Purpose**: Store AI-generated reply drafts awaiting user approval via Telegram.

```sql
-- Migration: 20251127_drafts_table.sql

CREATE TABLE drafts (
  id BIGSERIAL PRIMARY KEY,
  email_id BIGINT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  classification_id BIGINT NOT NULL REFERENCES classifications(id) ON DELETE CASCADE,

  -- Draft content
  draft_content TEXT NOT NULL, -- The generated reply text
  draft_subject TEXT, -- Reply subject (usually "Re: {original_subject}")

  -- Approval workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Awaiting user action via Telegram
    'sent',         -- User approved, email sent
    'discarded',    -- User chose to discard
    'rewriting',    -- User requested re-write, awaiting new draft
    'expired'       -- No response within timeout period
  )),

  -- Telegram message tracking
  telegram_message_id TEXT, -- Telegram message ID for button tracking
  telegram_chat_id TEXT,    -- Telegram chat ID

  -- Rewrite tracking
  rewrite_count INT DEFAULT 0,
  rewrite_instructions TEXT, -- User's instructions for re-write
  previous_draft_id BIGINT REFERENCES drafts(id), -- Link to previous version

  -- Timing
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_to_telegram_at TIMESTAMPTZ,
  user_responded_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Auto-expire if no response

  -- Metadata
  generation_model TEXT, -- e.g., "gpt-4-turbo-preview"
  generation_confidence DECIMAL(3,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(email_id, status) -- Only one pending draft per email
);

-- Indexes
CREATE INDEX idx_drafts_email_id ON drafts(email_id);
CREATE INDEX idx_drafts_status ON drafts(status) WHERE status IN ('pending', 'rewriting');
CREATE INDEX idx_drafts_telegram_message ON drafts(telegram_message_id) WHERE telegram_message_id IS NOT NULL;
CREATE INDEX idx_drafts_expires ON drafts(expires_at) WHERE status = 'pending';

-- Trigger for updated_at
CREATE TRIGGER update_drafts_updated_at
  BEFORE UPDATE ON drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE drafts IS 'AI-generated reply drafts for DRAFT_REPLY action, approved via Telegram';
COMMENT ON COLUMN drafts.telegram_message_id IS 'Telegram message ID for tracking button callbacks';
COMMENT ON COLUMN drafts.rewrite_instructions IS 'User natural language instructions for draft revision';
COMMENT ON COLUMN drafts.expires_at IS 'Draft auto-expires if user does not respond within timeout';
```

**Column Summary**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGSERIAL | PK | auto | Primary key |
| email_id | BIGINT | NOT NULL | - | FK to emails table |
| classification_id | BIGINT | NOT NULL | - | FK to classifications table |
| draft_content | TEXT | NOT NULL | - | Generated reply text |
| draft_subject | TEXT | YES | - | Reply subject line |
| status | TEXT | NOT NULL | pending | Approval status |
| telegram_message_id | TEXT | YES | - | Telegram message for callbacks |
| telegram_chat_id | TEXT | YES | - | Telegram chat ID |
| rewrite_count | INT | YES | 0 | Number of re-write requests |
| rewrite_instructions | TEXT | YES | - | User's re-write instructions |
| previous_draft_id | BIGINT | YES | - | FK to previous draft version |
| generated_at | TIMESTAMPTZ | YES | NOW() | When draft was generated |
| sent_to_telegram_at | TIMESTAMPTZ | YES | - | When sent to Telegram |
| user_responded_at | TIMESTAMPTZ | YES | - | When user clicked button |
| email_sent_at | TIMESTAMPTZ | YES | - | When email was sent |
| expires_at | TIMESTAMPTZ | YES | - | Auto-expiration time |
| generation_model | TEXT | YES | - | AI model used |
| generation_confidence | DECIMAL(3,2) | YES | - | AI confidence |

---

### 4. Calendar Events Table (NEW)

**Purpose**: Track calendar events created from CALENDAR action emails.

```sql
-- Migration: 20251127_calendar_events_table.sql

CREATE TABLE calendar_events (
  id BIGSERIAL PRIMARY KEY,
  email_id BIGINT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  classification_id BIGINT NOT NULL REFERENCES classifications(id) ON DELETE CASCADE,

  -- Google Calendar integration
  google_event_id TEXT, -- Google Calendar event ID
  google_calendar_id TEXT DEFAULT 'primary', -- Which calendar
  google_event_link TEXT, -- Direct link to event in Google Calendar

  -- Event details (extracted from email)
  event_title TEXT NOT NULL,
  event_description TEXT,
  event_location TEXT,
  event_start TIMESTAMPTZ NOT NULL,
  event_end TIMESTAMPTZ, -- NULL for all-day events without end time
  is_all_day BOOLEAN DEFAULT false,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'tentative' CHECK (status IN (
    'tentative',    -- Created in Google Calendar as tentative
    'confirmed',    -- User confirmed in Google Calendar
    'cancelled',    -- User deleted or cancelled
    'failed'        -- Failed to create in Google Calendar
  )),

  -- Metadata
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  extraction_confidence DECIMAL(3,2),
  sync_error TEXT, -- Error message if sync failed

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(email_id) -- One calendar event per email
);

-- Indexes
CREATE INDEX idx_calendar_events_email_id ON calendar_events(email_id);
CREATE INDEX idx_calendar_events_google_id ON calendar_events(google_event_id) WHERE google_event_id IS NOT NULL;
CREATE INDEX idx_calendar_events_status ON calendar_events(status) WHERE status = 'tentative';
CREATE INDEX idx_calendar_events_start ON calendar_events(event_start);

-- Trigger for updated_at
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE calendar_events IS 'Calendar events created from CALENDAR action emails, synced to Google Calendar';
COMMENT ON COLUMN calendar_events.google_event_id IS 'Google Calendar API event ID for updates/deletion';
COMMENT ON COLUMN calendar_events.status IS 'Event status: tentative (pending user confirmation), confirmed, cancelled, failed';
```

**Column Summary**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGSERIAL | PK | auto | Primary key |
| email_id | BIGINT | NOT NULL | - | FK to emails table |
| classification_id | BIGINT | NOT NULL | - | FK to classifications table |
| google_event_id | TEXT | YES | - | Google Calendar event ID |
| google_calendar_id | TEXT | YES | primary | Target calendar |
| google_event_link | TEXT | YES | - | URL to event |
| event_title | TEXT | NOT NULL | - | Event title |
| event_description | TEXT | YES | - | Event description |
| event_location | TEXT | YES | - | Event location |
| event_start | TIMESTAMPTZ | NOT NULL | - | Start datetime |
| event_end | TIMESTAMPTZ | YES | - | End datetime |
| is_all_day | BOOLEAN | YES | false | All-day event flag |
| status | TEXT | NOT NULL | tentative | Event status |
| extracted_at | TIMESTAMPTZ | YES | NOW() | Extraction time |
| extraction_confidence | DECIMAL(3,2) | YES | - | AI confidence |
| sync_error | TEXT | YES | - | Error message |

---

### 5. Sender Lists Table (NEW)

**Purpose**: Store SafeList and BlackList entries for JUNK action qualification.

```sql
-- Migration: 20251127_sender_lists_table.sql

CREATE TABLE sender_lists (
  id BIGSERIAL PRIMARY KEY,

  -- List classification
  list_type TEXT NOT NULL CHECK (list_type IN ('safelist', 'blacklist')),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('email', 'domain')),
  entry_value TEXT NOT NULL, -- email@example.com or example.com

  -- Audit information
  added_by TEXT DEFAULT 'user', -- 'user', 'system', 'import'
  added_reason TEXT, -- e.g., "Added via row context menu"
  source_email_id BIGINT REFERENCES emails(id) ON DELETE SET NULL,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  deactivated_at TIMESTAMPTZ,
  deactivated_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(list_type, entry_value) -- No duplicate entries per list
);

-- Indexes
CREATE INDEX idx_sender_lists_lookup ON sender_lists(list_type, entry_type, entry_value) WHERE is_active = true;
CREATE INDEX idx_sender_lists_domain ON sender_lists(entry_value) WHERE entry_type = 'domain' AND is_active = true;
CREATE INDEX idx_sender_lists_email ON sender_lists(entry_value) WHERE entry_type = 'email' AND is_active = true;

-- Trigger for updated_at
CREATE TRIGGER update_sender_lists_updated_at
  BEFORE UPDATE ON sender_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper function: Check if sender is blacklisted
CREATE OR REPLACE FUNCTION is_sender_blacklisted(sender_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  sender_domain TEXT;
BEGIN
  -- Extract domain from email
  sender_domain := split_part(sender_email, '@', 2);

  RETURN EXISTS (
    SELECT 1 FROM sender_lists
    WHERE list_type = 'blacklist'
    AND is_active = true
    AND (
      (entry_type = 'email' AND entry_value = lower(sender_email))
      OR (entry_type = 'domain' AND entry_value = lower(sender_domain))
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Helper function: Check if sender is safelisted
CREATE OR REPLACE FUNCTION is_sender_safelisted(sender_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  sender_domain TEXT;
BEGIN
  sender_domain := split_part(sender_email, '@', 2);

  RETURN EXISTS (
    SELECT 1 FROM sender_lists
    WHERE list_type = 'safelist'
    AND is_active = true
    AND (
      (entry_type = 'email' AND entry_value = lower(sender_email))
      OR (entry_type = 'domain' AND entry_value = lower(sender_domain))
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE sender_lists IS 'SafeList and BlackList for JUNK action qualification';
COMMENT ON COLUMN sender_lists.list_type IS 'safelist = trusted senders, blacklist = spam senders';
COMMENT ON COLUMN sender_lists.entry_type IS 'email = specific address, domain = all addresses from domain';
COMMENT ON COLUMN sender_lists.entry_value IS 'Lowercase email address or domain';
COMMENT ON FUNCTION is_sender_blacklisted IS 'Check if sender email or domain is on blacklist';
COMMENT ON FUNCTION is_sender_safelisted IS 'Check if sender email or domain is on safelist';
```

**Column Summary**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGSERIAL | PK | auto | Primary key |
| list_type | TEXT | NOT NULL | - | safelist or blacklist |
| entry_type | TEXT | NOT NULL | - | email or domain |
| entry_value | TEXT | NOT NULL | - | The email/domain value |
| added_by | TEXT | YES | user | Who added the entry |
| added_reason | TEXT | YES | - | Why it was added |
| source_email_id | BIGINT | YES | - | Email that triggered addition |
| is_active | BOOLEAN | YES | true | Soft delete flag |
| deactivated_at | TIMESTAMPTZ | YES | - | When deactivated |
| deactivated_reason | TEXT | YES | - | Why deactivated |

---

### 6. Action Logs Table (NEW)

**Purpose**: Audit trail for all action assignments and changes (FR-011, FR-012).

```sql
-- Migration: 20251127_action_logs_table.sql

CREATE TABLE action_logs (
  id BIGSERIAL PRIMARY KEY,
  email_id BIGINT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  classification_id BIGINT NOT NULL REFERENCES classifications(id) ON DELETE CASCADE,

  -- Action details
  action TEXT NOT NULL CHECK (action IN (
    'IGNORE', 'SHIPMENT', 'DRAFT_REPLY', 'JUNK', 'NOTIFY', 'CALENDAR'
  )),
  previous_action TEXT CHECK (previous_action IN (
    'IGNORE', 'SHIPMENT', 'DRAFT_REPLY', 'JUNK', 'NOTIFY', 'CALENDAR'
  )),

  -- Assignment metadata
  confidence_score DECIMAL(3,2),
  auto_assigned BOOLEAN NOT NULL,
  assignment_reason TEXT, -- e.g., "HIGH urgency + KIDS category"

  -- Extracted fields at time of assignment
  extracted_data JSONB, -- {tracking_number, event_date, etc.}

  -- Source information
  source TEXT NOT NULL CHECK (source IN (
    'workflow',      -- Automatic assignment from n8n workflow
    'ui_manual',     -- Manual selection in correction-ui
    'ui_bulk',       -- Bulk action in correction-ui
    'telegram',      -- Action via Telegram (e.g., discard draft)
    'system'         -- System correction (e.g., fallback)
  )),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_action_logs_email_id ON action_logs(email_id);
CREATE INDEX idx_action_logs_classification_id ON action_logs(classification_id);
CREATE INDEX idx_action_logs_action ON action_logs(action);
CREATE INDEX idx_action_logs_created ON action_logs(created_at DESC);
CREATE INDEX idx_action_logs_source ON action_logs(source);

-- Comments
COMMENT ON TABLE action_logs IS 'Audit trail for all action assignments and changes (supports reversibility)';
COMMENT ON COLUMN action_logs.extracted_data IS 'JSON snapshot of extracted fields at assignment time';
COMMENT ON COLUMN action_logs.assignment_reason IS 'Human-readable explanation of why action was assigned';
```

**Column Summary**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGSERIAL | PK | auto | Primary key |
| email_id | BIGINT | NOT NULL | - | FK to emails table |
| classification_id | BIGINT | NOT NULL | - | FK to classifications table |
| action | TEXT | NOT NULL | - | Action assigned |
| previous_action | TEXT | YES | - | Previous action (for changes) |
| confidence_score | DECIMAL(3,2) | YES | - | Confidence at assignment |
| auto_assigned | BOOLEAN | NOT NULL | - | System vs manual |
| assignment_reason | TEXT | YES | - | Why action was assigned |
| extracted_data | JSONB | YES | - | Extracted fields snapshot |
| source | TEXT | NOT NULL | - | Where assignment originated |

---

## Migration Execution Order

Execute migrations in this order to respect foreign key dependencies:

1. `20251127_action_enum_migration.sql` - Modify classifications table
2. `20251127_sender_lists_table.sql` - Independent table
3. `20251127_shipments_table.sql` - Depends on emails, classifications
4. `20251127_drafts_table.sql` - Depends on emails, classifications
5. `20251127_calendar_events_table.sql` - Depends on emails, classifications
6. `20251127_action_logs_table.sql` - Depends on emails, classifications

---

## Row Level Security (RLS)

```sql
-- Enable RLS on new tables
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sender_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;

-- Service role (n8n workflows): Full access
CREATE POLICY "Service role full access" ON shipments FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON drafts FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON calendar_events FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON sender_lists FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON action_logs FOR ALL TO service_role USING (true);

-- Authenticated users (correction-ui): Read + limited write
CREATE POLICY "Authenticated read access" ON shipments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON drafts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read/write access" ON sender_lists FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON action_logs FOR SELECT TO authenticated USING (true);
```

---

## Type Definitions (TypeScript)

```typescript
// types/actions.ts

export const ACTION_TYPES_V2 = [
  'IGNORE',
  'SHIPMENT',
  'DRAFT_REPLY',
  'JUNK',
  'NOTIFY',
  'CALENDAR'
] as const;

export type ActionTypeV2 = typeof ACTION_TYPES_V2[number];

export const ACTION_GROUPS = {
  'Low Risk': ['IGNORE'],
  'Enrichment': ['SHIPMENT', 'CALENDAR'],
  'Human Review Required': ['DRAFT_REPLY', 'NOTIFY'],
  'Destructive': ['JUNK']
} as const;

export const ACTION_THRESHOLDS: Record<ActionTypeV2, number> = {
  IGNORE: 0.85,
  SHIPMENT: 0.90,
  DRAFT_REPLY: 0.75,
  JUNK: 0.99,
  NOTIFY: 0.85,
  CALENDAR: 0.85
};

export const ACTION_LABELS: Record<ActionTypeV2, string> = {
  IGNORE: 'Ignore',
  SHIPMENT: 'Shipment',
  DRAFT_REPLY: 'Draft Reply',
  JUNK: 'Junk',
  NOTIFY: 'Notify',
  CALENDAR: 'Calendar'
};

export const ACTION_DESCRIPTIONS: Record<ActionTypeV2, string> = {
  IGNORE: 'Email will be marked as read. No notification sent.',
  SHIPMENT: 'Extract tracking number and delivery date. View in Shipments.',
  DRAFT_REPLY: 'AI suggests a reply. Approve via Telegram before sending.',
  JUNK: 'Mark as read and archive to junk folder. Cannot be undone.',
  NOTIFY: 'Send Telegram alert with summary and recommended action.',
  CALENDAR: 'Create tentative calendar event. Confirm in Google Calendar.'
};

// Entity types
export interface Shipment {
  id: number;
  email_id: number;
  classification_id: number;
  tracking_number: string;
  carrier: 'USPS' | 'UPS' | 'FedEx' | 'Amazon' | 'DHL' | 'OnTrac' | 'LaserShip' | 'Other';
  carrier_tracking_url: string | null;
  items: Array<{ name: string; quantity?: number; price?: string }>;
  estimated_delivery: string | null;
  actual_delivery: string | null;
  delivery_status: 'label_created' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'unknown';
  extracted_at: string;
  last_status_check: string | null;
  extraction_confidence: number | null;
  created_at: string;
  updated_at: string;
}

export interface Draft {
  id: number;
  email_id: number;
  classification_id: number;
  draft_content: string;
  draft_subject: string | null;
  status: 'pending' | 'sent' | 'discarded' | 'rewriting' | 'expired';
  telegram_message_id: string | null;
  telegram_chat_id: string | null;
  rewrite_count: number;
  rewrite_instructions: string | null;
  previous_draft_id: number | null;
  generated_at: string;
  sent_to_telegram_at: string | null;
  user_responded_at: string | null;
  email_sent_at: string | null;
  expires_at: string | null;
  generation_model: string | null;
  generation_confidence: number | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: number;
  email_id: number;
  classification_id: number;
  google_event_id: string | null;
  google_calendar_id: string;
  google_event_link: string | null;
  event_title: string;
  event_description: string | null;
  event_location: string | null;
  event_start: string;
  event_end: string | null;
  is_all_day: boolean;
  status: 'tentative' | 'confirmed' | 'cancelled' | 'failed';
  extracted_at: string;
  extraction_confidence: number | null;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface SenderListEntry {
  id: number;
  list_type: 'safelist' | 'blacklist';
  entry_type: 'email' | 'domain';
  entry_value: string;
  added_by: string;
  added_reason: string | null;
  source_email_id: number | null;
  is_active: boolean;
  deactivated_at: string | null;
  deactivated_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActionLog {
  id: number;
  email_id: number;
  classification_id: number;
  action: ActionTypeV2;
  previous_action: ActionTypeV2 | null;
  confidence_score: number | null;
  auto_assigned: boolean;
  assignment_reason: string | null;
  extracted_data: Record<string, unknown> | null;
  source: 'workflow' | 'ui_manual' | 'ui_bulk' | 'telegram' | 'system';
  created_at: string;
}
```

---

## Summary

| Table | Purpose | New/Modified |
|-------|---------|--------------|
| classifications | Add action_v2 column and metadata | Modified |
| shipments | Store extracted tracking info | New |
| drafts | Store AI reply drafts for approval | New |
| calendar_events | Track Google Calendar events | New |
| sender_lists | SafeList/BlackList management | New |
| action_logs | Audit trail for all actions | New |

**Total New Tables**: 5
**Total Modified Tables**: 1
**Total New Columns on classifications**: 5
