# Data Model: Email Classification MVP

**Database**: Supabase PostgreSQL with pgvector extension
**Date**: 2025-11-15
**Feature**: 001-email-classification-mvp

## Overview

This document defines the complete Supabase database schema for the Email Intelligence Workflow System MVP. All tables support the 5 user stories with full audit trail, indefinite retention, and manual correction capabilities.

## Prerequisites

```sql
-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Core Tables

### 1. emails

Stores complete email content and metadata from Gmail.

```sql
CREATE TABLE emails (
  id BIGSERIAL PRIMARY KEY,
  message_id TEXT UNIQUE NOT NULL,  -- Gmail message ID
  thread_id TEXT,                    -- Gmail thread ID for conversation tracking
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  body TEXT,                         -- Full email body (plain text)
  received_timestamp TIMESTAMPTZ NOT NULL,
  labels TEXT[],                     -- Current Gmail labels
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_emails_message_id ON emails(message_id);
CREATE INDEX idx_emails_sender ON emails(sender);
CREATE INDEX idx_emails_received ON emails(received_timestamp DESC);
CREATE INDEX idx_emails_thread_id ON emails(thread_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON emails
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Retention Policy**: Indefinite (per clarification session)

**Storage Estimate**:
- 500 emails/day × 10KB avg = 5MB/day
- Annual: ~1.8GB/year
- 5 years: ~9GB (manageable on Supabase Pro plan)

---

### 2. classifications

Stores AI classification results with support for manual corrections.

```sql
CREATE TABLE classifications (
  id BIGSERIAL PRIMARY KEY,
  email_id BIGINT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,

  -- Classification results
  category TEXT NOT NULL CHECK (category IN ('KIDS', 'ROBYN', 'WORK', 'FINANCIAL', 'SHOPPING', 'OTHER')),
  urgency TEXT NOT NULL CHECK (urgency IN ('HIGH', 'MEDIUM', 'LOW')),
  action TEXT NOT NULL CHECK (action IN ('FYI', 'RESPOND', 'TASK', 'PAYMENT', 'CALENDAR', 'NONE')),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Extracted entities
  extracted_names TEXT[],
  extracted_dates TEXT[],
  extracted_amounts TEXT[],

  -- Timestamps
  classified_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Manual correction support (nullable until corrected)
  original_category TEXT CHECK (original_category IN ('KIDS', 'ROBYN', 'WORK', 'FINANCIAL', 'SHOPPING', 'OTHER')),
  original_urgency TEXT CHECK (original_urgency IN ('HIGH', 'MEDIUM', 'LOW')),
  original_action TEXT CHECK (original_action IN ('FYI', 'RESPOND', 'TASK', 'PAYMENT', 'CALENDAR', 'NONE')),
  corrected_timestamp TIMESTAMPTZ,
  corrected_by TEXT,  -- Operator identifier (email or username)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(email_id)  -- One classification per email
);

-- Indexes
CREATE INDEX idx_classifications_email_id ON classifications(email_id);
CREATE INDEX idx_classifications_category ON classifications(category);
CREATE INDEX idx_classifications_urgency ON classifications(urgency);
CREATE INDEX idx_classifications_action ON classifications(action);
CREATE INDEX idx_classifications_confidence ON classifications(confidence_score);
CREATE INDEX idx_classifications_corrected ON classifications(corrected_timestamp) WHERE corrected_timestamp IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_classifications_updated_at BEFORE UPDATE ON classifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to log corrections (fires BEFORE UPDATE)
CREATE OR REPLACE FUNCTION log_classification_correction()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if category, urgency, or action changed
  IF (OLD.category != NEW.category OR OLD.urgency != NEW.urgency OR OLD.action != NEW.action) THEN
    -- Preserve original values if this is first correction
    IF NEW.original_category IS NULL THEN
      NEW.original_category := OLD.category;
      NEW.original_urgency := OLD.urgency;
      NEW.original_action := OLD.action;
      NEW.corrected_timestamp := NOW();
      NEW.corrected_by := COALESCE(current_user, 'unknown');
    END IF;

    -- Log to correction_logs table (separate insert in trigger)
    INSERT INTO correction_logs (email_id, field_name, original_value, corrected_value, correction_timestamp, corrected_by)
    VALUES
      (NEW.email_id, 'CATEGORY', OLD.category, NEW.category, NOW(), COALESCE(current_user, 'unknown')),
      (NEW.email_id, 'URGENCY', OLD.urgency, NEW.urgency, NOW(), COALESCE(current_user, 'unknown')),
      (NEW.email_id, 'ACTION', OLD.action, NEW.action, NOW(), COALESCE(current_user, 'unknown'));
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_corrections_before_update BEFORE UPDATE ON classifications
FOR EACH ROW EXECUTE FUNCTION log_classification_correction();
```

**Key Features**:
- Enum constraints ensure data integrity for category/urgency/action
- Original values preserved on first correction for comparison
- Automatic correction logging via database trigger (Supabase-native approach)
- Confidence score tracking for accuracy analysis

---

### 3. email_actions

Audit log for all Gmail operations (labels, read status, archiving).

```sql
CREATE TABLE email_actions (
  id BIGSERIAL PRIMARY KEY,
  email_id BIGINT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('LABEL_APPLIED', 'MARKED_READ', 'ARCHIVED', 'MARKED_UNREAD', 'UNARCHIVED')),
  action_details JSONB,  -- Flexible storage for action-specific data (e.g., {"label": "KIDS"})
  action_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success_status BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,  -- NULL if success_status = true

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_email_actions_email_id ON email_actions(email_id);
CREATE INDEX idx_email_actions_type ON email_actions(action_type);
CREATE INDEX idx_email_actions_timestamp ON email_actions(action_timestamp DESC);
CREATE INDEX idx_email_actions_failed ON email_actions(success_status) WHERE success_status = false;
```

**Example Records**:
```json
{
  "email_id": 123,
  "action_type": "LABEL_APPLIED",
  "action_details": {"label": "KIDS", "label_id": "Label_456"},
  "action_timestamp": "2025-11-15T14:30:00Z",
  "success_status": true
}

{
  "email_id": 123,
  "action_type": "ARCHIVED",
  "action_details": {"reason": "urgency=LOW and action=NONE"},
  "action_timestamp": "2025-11-15T14:30:05Z",
  "success_status": true
}
```

---

### 4. notifications

Log of all Telegram notifications sent.

```sql
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  email_id BIGINT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel = 'TELEGRAM'),  -- MVP: Telegram only
  recipient TEXT NOT NULL,  -- Telegram chat ID
  message_content TEXT NOT NULL,
  sent_timestamp TIMESTAMPTZ,
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('PENDING', 'SENT', 'FAILED', 'QUEUED')),
  retry_count INT DEFAULT 0,
  error_message TEXT,
  scheduled_for TIMESTAMPTZ,  -- For quiet hours queuing

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_email_id ON notifications(email_id);
CREATE INDEX idx_notifications_status ON notifications(delivery_status);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_notifications_pending ON notifications(delivery_status) WHERE delivery_status IN ('PENDING', 'QUEUED');

-- Trigger for updated_at
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Workflow Integration**:
- n8n creates record with `delivery_status='PENDING'`
- After Telegram API call: Update to `SENT` or `FAILED`
- Quiet hours: Create with `delivery_status='QUEUED'` and `scheduled_for=7am`
- Scheduled trigger queries `delivery_status='QUEUED' AND scheduled_for <= NOW()`

---

### 5. correction_logs

Detailed audit trail for manual classification corrections.

```sql
CREATE TABLE correction_logs (
  id BIGSERIAL PRIMARY KEY,
  email_id BIGINT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL CHECK (field_name IN ('CATEGORY', 'URGENCY', 'ACTION')),
  original_value TEXT NOT NULL,
  corrected_value TEXT NOT NULL,
  correction_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  corrected_by TEXT NOT NULL,  -- Operator identifier
  correction_reason TEXT,  -- Optional notes from operator

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_correction_logs_email_id ON correction_logs(email_id);
CREATE INDEX idx_correction_logs_field ON correction_logs(field_name);
CREATE INDEX idx_correction_logs_timestamp ON correction_logs(correction_timestamp DESC);
CREATE INDEX idx_correction_logs_corrector ON correction_logs(corrected_by);
```

**Analytics Queries**:
```sql
-- Most frequently corrected category
SELECT original_value, corrected_value, COUNT(*) as correction_count
FROM correction_logs
WHERE field_name = 'CATEGORY'
GROUP BY original_value, corrected_value
ORDER BY correction_count DESC;

-- Correction rate over time
SELECT DATE_TRUNC('week', correction_timestamp) as week,
       COUNT(*) as corrections
FROM correction_logs
GROUP BY week
ORDER BY week DESC;
```

---

### 6. email_embeddings

Vector embeddings for similarity search and contextual classification.

```sql
CREATE TABLE email_embeddings (
  id BIGSERIAL PRIMARY KEY,
  email_id BIGINT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,  -- OpenAI Ada-002 embeddings
  metadata JSONB,  -- Store category, sender, timestamp for hybrid search

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(email_id)  -- One embedding per email
);

-- Vector similarity index (ivfflat for <1M vectors)
CREATE INDEX idx_email_embeddings_vector ON email_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);  -- Optimize for ~10K-100K vectors initially

CREATE INDEX idx_email_embeddings_email_id ON email_embeddings(email_id);
```

**Usage in n8n**:
- **Insert**: After classification, generate embedding and store
- **Retrieve**: AI Agent tool queries top 5 similar emails (cosine similarity > 0.7)
- **Metadata filtering**: Optionally filter by category or sender before similarity search

---

## Supporting Tables

### 7. system_config

Configuration table for runtime settings (quiet hours, thresholds, etc.).

```sql
CREATE TABLE system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default configuration
INSERT INTO system_config (key, value, description) VALUES
('quiet_hours', '{"start": "22:00", "end": "07:00", "timezone": "America/New_York"}', 'Notification quiet hours window'),
('confidence_threshold', '{"value": 0.6}', 'Minimum confidence for auto-classification'),
('notification_limit', '{"daily_max": 50}', 'Maximum notifications per day'),
('polling_interval', '{"minutes": 5}', 'Gmail polling interval'),
('vector_similarity_threshold', '{"value": 0.7}', 'Minimum similarity for contextual retrieval');
```

---

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE correction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Policy: Allow n8n service role full access (authenticated via service key)
CREATE POLICY "Service role full access" ON emails
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON classifications
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON email_actions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON notifications
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON correction_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON email_embeddings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON system_config
  FOR ALL USING (auth.role() = 'service_role');

-- Policy: Allow authenticated users (for manual corrections via Supabase dashboard)
CREATE POLICY "Authenticated read access" ON emails
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access classifications" ON classifications
  FOR ALL USING (auth.role() = 'authenticated');  -- Allow updates for manual corrections

CREATE POLICY "Authenticated read access actions" ON email_actions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated read access logs" ON correction_logs
  FOR SELECT USING (auth.role() = 'authenticated');
```

---

## Database Functions

### Function: Get Similar Emails

```sql
CREATE OR REPLACE FUNCTION get_similar_emails(
  query_embedding vector(1536),
  similarity_threshold FLOAT DEFAULT 0.7,
  result_limit INT DEFAULT 5
)
RETURNS TABLE (
  email_id BIGINT,
  similarity FLOAT,
  category TEXT,
  urgency TEXT,
  sender TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.email_id,
    1 - (ee.embedding <=> query_embedding) as similarity,
    c.category,
    c.urgency,
    emails.sender
  FROM email_embeddings ee
  JOIN classifications c ON ee.email_id = c.email_id
  JOIN emails ON ee.email_id = emails.id
  WHERE 1 - (ee.embedding <=> query_embedding) > similarity_threshold
  ORDER BY ee.embedding <=> query_embedding
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;
```

---

## Monitoring Queries

### Query: Classification Accuracy by Category

```sql
SELECT
  original_category as ai_category,
  category as corrected_category,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY original_category), 2) as correction_rate_pct
FROM classifications
WHERE original_category IS NOT NULL  -- Only corrected emails
GROUP BY original_category, category
ORDER BY ai_category, count DESC;
```

### Query: Daily Processing Stats

```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_emails,
  AVG(confidence_score) as avg_confidence,
  COUNT(*) FILTER (WHERE confidence_score < 0.6) as low_confidence_count,
  COUNT(DISTINCT CASE WHEN corrected_timestamp IS NOT NULL THEN email_id END) as corrected_count
FROM classifications
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Query: Notification Delivery Performance

```sql
SELECT
  delivery_status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (sent_timestamp - created_at))) as avg_delivery_seconds
FROM notifications
WHERE sent_timestamp IS NOT NULL
GROUP BY delivery_status;
```

---

## Backup & Maintenance

**Backup Strategy**:
- Supabase automatic daily backups (retained 7 days on Pro plan)
- Weekly manual exports via `pg_dump` for long-term archival
- Critical tables: `emails`, `classifications`, `correction_logs`

**Index Maintenance**:
- Rebuild vector index quarterly or when >500K embeddings:
  ```sql
  REINDEX INDEX idx_email_embeddings_vector;
  ```

**Vacuum Schedule**:
- Auto-vacuum enabled by default in Supabase
- Manual `VACUUM ANALYZE` monthly for performance optimization

---

## Schema Version

**Version**: 1.0.0
**Date**: 2025-11-15
**Migrations**: All DDL statements above constitute initial schema
**Next Version**: Deferred features (calendar_events, draft_responses, action_patterns, user_preferences) planned for Phase 2/3

---

**Data Model Complete**: Ready for Supabase deployment and n8n integration.
