# Setup Instructions: Email Classification MVP

**Phase**: Phase 1 - Infrastructure & Prerequisites
**Tasks**: T001-T015
**Estimated Time**: 60-90 minutes
**Your Supabase Project**: https://supabase.com/dashboard/project/xmziovusqlmgygcrgyqt

---

## ✅ T001: Execute SQL Schema in Supabase

**Instructions**:
1. Navigate to https://supabase.com/dashboard/project/xmziovusqlmgygcrgyqt
2. Click "SQL Editor" in left sidebar
3. Click "New Query"
4. Copy the COMPLETE SQL schema below
5. Paste into SQL Editor
6. Click "Run" (or Cmd+Enter)
7. Verify "Success. No rows returned" message

### Complete SQL Schema

```sql
-- ============================================================================
-- Email Classification MVP - Database Schema
-- Project: xmziovusqlmgygcrgyqt
-- Date: 2025-11-15
-- ============================================================================

-- Prerequisites: Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- 1. emails table
CREATE TABLE IF NOT EXISTS emails (
  id BIGSERIAL PRIMARY KEY,
  message_id TEXT UNIQUE NOT NULL,
  thread_id TEXT,
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  received_timestamp TIMESTAMPTZ NOT NULL,
  labels TEXT[],
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
CREATE INDEX IF NOT EXISTS idx_emails_sender ON emails(sender);
CREATE INDEX IF NOT EXISTS idx_emails_received ON emails(received_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_emails_thread_id ON emails(thread_id);

-- 2. classifications table
CREATE TABLE IF NOT EXISTS classifications (
  id BIGSERIAL PRIMARY KEY,
  email_id BIGINT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('KIDS', 'ROBYN', 'WORK', 'FINANCIAL', 'SHOPPING', 'OTHER')),
  urgency TEXT NOT NULL CHECK (urgency IN ('HIGH', 'MEDIUM', 'LOW')),
  action TEXT NOT NULL CHECK (action IN ('FYI', 'RESPOND', 'TASK', 'PAYMENT', 'CALENDAR', 'NONE')),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  extracted_names TEXT[],
  extracted_dates TEXT[],
  extracted_amounts TEXT[],
  classified_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  original_category TEXT CHECK (original_category IN ('KIDS', 'ROBYN', 'WORK', 'FINANCIAL', 'SHOPPING', 'OTHER')),
  original_urgency TEXT CHECK (original_urgency IN ('HIGH', 'MEDIUM', 'LOW')),
  original_action TEXT CHECK (original_action IN ('FYI', 'RESPOND', 'TASK', 'PAYMENT', 'CALENDAR', 'NONE')),
  corrected_timestamp TIMESTAMPTZ,
  corrected_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email_id)
);

CREATE INDEX IF NOT EXISTS idx_classifications_email_id ON classifications(email_id);
CREATE INDEX IF NOT EXISTS idx_classifications_category ON classifications(category);
CREATE INDEX IF NOT EXISTS idx_classifications_urgency ON classifications(urgency);
CREATE INDEX IF NOT EXISTS idx_classifications_action ON classifications(action);
CREATE INDEX IF NOT EXISTS idx_classifications_confidence ON classifications(confidence_score);
CREATE INDEX IF NOT EXISTS idx_classifications_corrected ON classifications(corrected_timestamp) WHERE corrected_timestamp IS NOT NULL;

-- 3. email_actions table
CREATE TABLE IF NOT EXISTS email_actions (
  id BIGSERIAL PRIMARY KEY,
  email_id BIGINT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('LABEL_APPLIED', 'MARKED_READ', 'ARCHIVED', 'MARKED_UNREAD', 'UNARCHIVED')),
  action_details JSONB,
  action_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success_status BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_actions_email_id ON email_actions(email_id);
CREATE INDEX IF NOT EXISTS idx_email_actions_type ON email_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_email_actions_timestamp ON email_actions(action_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_email_actions_failed ON email_actions(success_status) WHERE success_status = false;

-- 4. notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  email_id BIGINT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel = 'TELEGRAM'),
  recipient TEXT NOT NULL,
  message_content TEXT NOT NULL,
  sent_timestamp TIMESTAMPTZ,
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('PENDING', 'SENT', 'FAILED', 'QUEUED')),
  retry_count INT DEFAULT 0,
  error_message TEXT,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_email_id ON notifications(email_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(delivery_status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_pending ON notifications(delivery_status) WHERE delivery_status IN ('PENDING', 'QUEUED');

-- 5. correction_logs table
CREATE TABLE IF NOT EXISTS correction_logs (
  id BIGSERIAL PRIMARY KEY,
  email_id BIGINT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL CHECK (field_name IN ('CATEGORY', 'URGENCY', 'ACTION')),
  original_value TEXT NOT NULL,
  corrected_value TEXT NOT NULL,
  correction_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  corrected_by TEXT NOT NULL,
  correction_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_correction_logs_email_id ON correction_logs(email_id);
CREATE INDEX IF NOT EXISTS idx_correction_logs_field ON correction_logs(field_name);
CREATE INDEX IF NOT EXISTS idx_correction_logs_timestamp ON correction_logs(correction_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_correction_logs_corrector ON correction_logs(corrected_by);

-- 6. email_embeddings table
CREATE TABLE IF NOT EXISTS email_embeddings (
  id BIGSERIAL PRIMARY KEY,
  email_id BIGINT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email_id)
);

CREATE INDEX IF NOT EXISTS idx_email_embeddings_vector ON email_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_email_embeddings_email_id ON email_embeddings(email_id);

-- 7. system_config table
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Function: log_classification_correction
CREATE OR REPLACE FUNCTION log_classification_correction()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.category != NEW.category OR OLD.urgency != NEW.urgency OR OLD.action != NEW.action) THEN
    IF NEW.original_category IS NULL THEN
      NEW.original_category := OLD.category;
      NEW.original_urgency := OLD.urgency;
      NEW.original_action := OLD.action;
      NEW.corrected_timestamp := NOW();
      NEW.corrected_by := COALESCE(current_user, 'unknown');
    END IF;

    INSERT INTO correction_logs (email_id, field_name, original_value, corrected_value, correction_timestamp, corrected_by)
    VALUES
      (NEW.email_id, 'CATEGORY', OLD.category, NEW.category, NOW(), COALESCE(current_user, 'unknown')),
      (NEW.email_id, 'URGENCY', OLD.urgency, NEW.urgency, NOW(), COALESCE(current_user, 'unknown')),
      (NEW.email_id, 'ACTION', OLD.action, NEW.action, NOW(), COALESCE(current_user, 'unknown'));
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function: get_similar_emails
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

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON emails
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classifications_updated_at BEFORE UPDATE ON classifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER log_corrections_before_update BEFORE UPDATE ON classifications
FOR EACH ROW EXECUTE FUNCTION log_classification_correction();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE correction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Service role policies (n8n workflows)
CREATE POLICY "Service role full access emails" ON emails
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access classifications" ON classifications
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access actions" ON email_actions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access notifications" ON notifications
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access correction_logs" ON correction_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access embeddings" ON email_embeddings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access config" ON system_config
  FOR ALL USING (auth.role() = 'service_role');

-- Authenticated user policies (manual corrections via Supabase dashboard)
CREATE POLICY "Authenticated read emails" ON emails
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access classifications" ON classifications
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated read actions" ON email_actions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated read correction_logs" ON correction_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- DEFAULT CONFIGURATION
-- ============================================================================

INSERT INTO system_config (key, value, description) VALUES
('quiet_hours', '{"start": "22:00", "end": "07:00", "timezone": "America/New_York"}', 'Notification quiet hours window'),
('confidence_threshold', '{"value": 0.6}', 'Minimum confidence for auto-classification'),
('notification_limit', '{"daily_max": 50}', 'Maximum notifications per day'),
('polling_interval', '{"minutes": 5}', 'Gmail polling interval'),
('vector_similarity_threshold', '{"value": 0.7}', 'Minimum similarity for contextual retrieval')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these after schema execution to verify setup:

-- 1. Verify all tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- 2. Verify pgvector extension enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 3. Verify system_config populated
SELECT * FROM system_config;

-- 4. Verify RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
```

**After Execution**:
- ✅ Check that 7 tables exist: emails, classifications, email_actions, notifications, correction_logs, email_embeddings, system_config
- ✅ Run verification queries to confirm setup
- ✅ Mark task T001 complete

---

## ✅ T002-T003: Verify Supabase Setup

**T002 - Verify Tables**:
1. In Supabase dashboard, click "Table Editor"
2. Verify you see 7 tables listed
3. Click each table and verify columns match data-model.md

**T003 - Verify pgvector Extension**:
1. In SQL Editor, run:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```
2. Verify one row returned with `extname = 'vector'`

---

## ⏸️ T004-T008: External API Setup (Manual Steps Required)

These tasks require manual setup in external dashboards. Please complete:

### T004: Gmail API Setup

**Steps**:
1. Go to https://console.cloud.google.com
2. Create/select project: "email-intelligence-mvp"
3. Enable Gmail API
4. Create OAuth2 credentials
5. Configure OAuth consent screen
6. Save Client ID and Client Secret
7. Update .env file:
   ```bash
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

**Reference**: See quickstart.md Section 1.2

### T005: Create Gmail Labels

**Steps**:
1. Open Gmail: https://mail.google.com
2. Settings → Labels → Create new label
3. Create 6 labels:
   - KIDS (color: blue)
   - ROBYN (color: purple)
   - WORK (color: orange)
   - FINANCIAL (color: green)
   - SHOPPING (color: yellow)
   - OTHER (color: gray)

### T006: OpenAI API Key

**Steps**:
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name: "email-intelligence-mvp"
4. Copy key (shown only once)
5. Update .env file:
   ```bash
   OPENAI_API_KEY=sk-proj-...your_key_here
   ```
6. Verify models enabled: GPT-4, text-embedding-ada-002

### T007-T008: Telegram Bot Setup

**Steps**:
1. Open Telegram, search for @BotFather
2. Send `/newbot`
3. Name: "Email Intelligence Bot"
4. Username: "your_email_intelligence_bot"
5. Copy bot token
6. Send `/start` to your bot
7. Visit: `https://api.telegram.org/bot<TOKEN>/getUpdates`
8. Find chat ID in JSON response
9. Update .env file:
   ```bash
   TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
   TELEGRAM_CHAT_ID=123456789
   ```

---

## ⏸️ T009-T013: n8n Setup (Manual Configuration Required)

**Do you have an n8n instance already?**

**If NO**:
- Option A: Sign up for n8n Cloud at https://n8n.cloud ($20/month)
- Option B: Self-host with Docker (see quickstart.md Section 1.5)

**If YES**:
Continue with credential configuration...

### T009: Configure n8n Instance

1. Navigate to your n8n instance
2. Get API credentials from Settings → API
3. Note instance URL (e.g., `https://your-name.app.n8n.cloud`)
4. Update .env file:
   ```bash
   N8N_HOST=your-name.app.n8n.cloud
   N8N_PROTOCOL=https
   N8N_API_KEY=your_api_key_here
   ```

### T010-T013: Configure n8n Credentials (Parallel)

**In n8n dashboard → Credentials**:

1. **T010 - Gmail OAuth2**:
   - Add Credential → Gmail OAuth2 API
   - Name: "Gmail - Primary Account"
   - Enter Client ID, Client Secret
   - Click "Connect my account" → Complete OAuth flow

2. **T011 - OpenAI API**:
   - Add Credential → OpenAI API
   - Name: "OpenAI - GPT-4"
   - Enter API Key from .env

3. **T012 - Supabase API**:
   - Add Credential → Supabase API
   - Name: "Supabase - Email Intelligence"
   - Host: `xmziovusqlmgygcrgyqt.supabase.co`
   - Service Role Secret: (from .env SUPABASE_SERVICE_KEY)

4. **T013 - Telegram API**:
   - Add Credential → Telegram API
   - Name: "Telegram - Email Bot"
   - Access Token: (from .env TELEGRAM_BOT_TOKEN)

---

## ✅ T014: Create Test Email Dataset

I can help create this programmatically. The test dataset will be created in the next phase.

---

## ✅ T015: Verify .env File

Your .env file already exists with Supabase credentials. Need to verify remaining services are configured.

**Current .env status**:
- ✅ Supabase configured (URL + SERVICE_KEY)
- ⏸️ Gmail credentials (need from T004)
- ⏸️ OpenAI API key (need from T006)
- ⏸️ Telegram credentials (need from T007-T008)
- ⏸️ n8n API access (need from T009)

---

## Phase 1 Status Summary

**Automated Tasks** (I can complete):
- ✅ T001: SQL schema (copy-paste instructions provided above)
- ✅ T014: Test dataset (can generate programmatically)
- ✅ T015: Verify .env (already created)

**Manual Tasks** (Requires your action in external UIs):
- ⏸️ T002-T003: Supabase verification (after T001)
- ⏸️ T004-T005: Gmail API + Labels
- ⏸️ T006: OpenAI API key
- ⏸️ T007-T008: Telegram bot
- ⏸️ T009-T013: n8n instance + credentials

---

## Next Steps

**Action Required**: Please complete T001 by executing the SQL schema above in your Supabase project, then let me know which external services you've already set up or need help with:

1. Have you set up Gmail API credentials?
2. Do you have an OpenAI API key?
3. Have you created a Telegram bot?
4. Do you have an n8n instance running?

Once you provide status on these services, I can proceed with:
- Creating the test email dataset (T014)
- Moving to Phase 2 (Foundational) - MCP node discovery
- Starting Phase 3 (US1) - Building the Classification Workflow

Would you like me to:
1. Wait for you to complete manual setup tasks?
2. Proceed with automated tasks I can complete (T014 test dataset)?
3. Skip to Phase 2 assuming setup will be completed later?
