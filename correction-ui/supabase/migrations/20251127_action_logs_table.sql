-- Migration: 20251127_action_logs_table.sql
-- Feature: 011-email-actions-v2
-- Task: T006
-- Purpose: Create action_logs table for audit trail (FR-011, FR-012)

CREATE TABLE IF NOT EXISTS action_logs (
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
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
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
CREATE INDEX IF NOT EXISTS idx_action_logs_email_id ON action_logs(email_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_classification_id ON action_logs(classification_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_action ON action_logs(action);
CREATE INDEX IF NOT EXISTS idx_action_logs_created ON action_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_logs_source ON action_logs(source);

-- Enable RLS
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;

-- Service role (n8n workflows): Full access
DROP POLICY IF EXISTS "Service role full access on action_logs" ON action_logs;
CREATE POLICY "Service role full access on action_logs" ON action_logs FOR ALL TO service_role USING (true);

-- Authenticated users (correction-ui): Read access + insert (no update/delete)
DROP POLICY IF EXISTS "Authenticated read access on action_logs" ON action_logs;
CREATE POLICY "Authenticated read access on action_logs" ON action_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated insert access on action_logs" ON action_logs;
CREATE POLICY "Authenticated insert access on action_logs" ON action_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Anon users: Read access only
DROP POLICY IF EXISTS "Anon read access on action_logs" ON action_logs;
CREATE POLICY "Anon read access on action_logs" ON action_logs FOR SELECT TO anon USING (true);

-- Comments
COMMENT ON TABLE action_logs IS 'Audit trail for all action assignments and changes (supports reversibility)';
COMMENT ON COLUMN action_logs.extracted_data IS 'JSON snapshot of extracted fields at assignment time';
COMMENT ON COLUMN action_logs.assignment_reason IS 'Human-readable explanation of why action was assigned';
