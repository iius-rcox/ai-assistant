-- Migration: 20251127_sender_lists_table.sql
-- Feature: 011-email-actions-v2
-- Task: T005
-- Purpose: Create sender_lists table for SafeList/BlackList management

CREATE TABLE IF NOT EXISTS sender_lists (
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
CREATE INDEX IF NOT EXISTS idx_sender_lists_lookup ON sender_lists(list_type, entry_type, entry_value) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sender_lists_domain ON sender_lists(entry_value) WHERE entry_type = 'domain' AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_sender_lists_email ON sender_lists(entry_value) WHERE entry_type = 'email' AND is_active = true;

-- Trigger for updated_at (reuse existing function if available)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END
$$;

DROP TRIGGER IF EXISTS update_sender_lists_updated_at ON sender_lists;
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

-- Enable RLS
ALTER TABLE sender_lists ENABLE ROW LEVEL SECURITY;

-- Service role (n8n workflows): Full access
DROP POLICY IF EXISTS "Service role full access on sender_lists" ON sender_lists;
CREATE POLICY "Service role full access on sender_lists" ON sender_lists FOR ALL TO service_role USING (true);

-- Authenticated users (correction-ui): Read + write access
DROP POLICY IF EXISTS "Authenticated read/write access on sender_lists" ON sender_lists;
CREATE POLICY "Authenticated read/write access on sender_lists" ON sender_lists FOR ALL TO authenticated USING (true);

-- Anon users: Read access only
DROP POLICY IF EXISTS "Anon read access on sender_lists" ON sender_lists;
CREATE POLICY "Anon read access on sender_lists" ON sender_lists FOR SELECT TO anon USING (true);

-- Comments
COMMENT ON TABLE sender_lists IS 'SafeList and BlackList for JUNK action qualification';
COMMENT ON COLUMN sender_lists.list_type IS 'safelist = trusted senders, blacklist = spam senders';
COMMENT ON COLUMN sender_lists.entry_type IS 'email = specific address, domain = all addresses from domain';
COMMENT ON COLUMN sender_lists.entry_value IS 'Lowercase email address or domain';
COMMENT ON FUNCTION is_sender_blacklisted IS 'Check if sender email or domain is on blacklist';
COMMENT ON FUNCTION is_sender_safelisted IS 'Check if sender email or domain is on safelist';
