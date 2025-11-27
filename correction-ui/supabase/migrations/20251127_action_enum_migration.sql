-- Migration: 20251127_action_enum_migration.sql
-- Feature: 011-email-actions-v2
-- Task: T004
-- Purpose: Add action_v2 columns to classifications table for Email Actions V2

-- Add new action column with v2 values
ALTER TABLE classifications
ADD COLUMN IF NOT EXISTS action_v2 TEXT CHECK (action_v2 IN (
  'IGNORE', 'SHIPMENT', 'DRAFT_REPLY', 'JUNK', 'NOTIFY', 'CALENDAR'
));

-- Add confidence threshold used for auto-assignment
ALTER TABLE classifications
ADD COLUMN IF NOT EXISTS action_confidence DECIMAL(3,2) CHECK (action_confidence >= 0 AND action_confidence <= 1);

-- Add flag for automatic vs manual assignment
ALTER TABLE classifications
ADD COLUMN IF NOT EXISTS action_auto_assigned BOOLEAN DEFAULT true;

-- Add tracking info detection flag (for SHIPMENT availability)
ALTER TABLE classifications
ADD COLUMN IF NOT EXISTS has_tracking_info BOOLEAN DEFAULT false;

-- Add date detection flag (for CALENDAR availability)
ALTER TABLE classifications
ADD COLUMN IF NOT EXISTS has_date_info BOOLEAN DEFAULT false;

-- Migrate existing action values to action_v2
UPDATE classifications SET action_v2 = CASE
  WHEN action = 'FYI' THEN 'IGNORE'
  WHEN action = 'RESPOND' THEN 'DRAFT_REPLY'
  WHEN action = 'TASK' THEN 'NOTIFY'
  WHEN action = 'PAYMENT' THEN 'NOTIFY'
  WHEN action = 'CALENDAR' THEN 'CALENDAR'
  WHEN action = 'NONE' THEN 'IGNORE'
  ELSE 'IGNORE'
END
WHERE action_v2 IS NULL;

-- Set NOT NULL after migration
ALTER TABLE classifications
ALTER COLUMN action_v2 SET NOT NULL;

-- Set default action_auto_assigned for existing records
UPDATE classifications
SET action_auto_assigned = true
WHERE action_auto_assigned IS NULL;

-- Add index for action_v2 queries
CREATE INDEX IF NOT EXISTS idx_classifications_action_v2 ON classifications(action_v2);

-- Comment the columns
COMMENT ON COLUMN classifications.action_v2 IS 'Email Actions V2: IGNORE, SHIPMENT, DRAFT_REPLY, JUNK, NOTIFY, CALENDAR';
COMMENT ON COLUMN classifications.action_confidence IS 'Confidence score at time of action assignment (0.00-1.00)';
COMMENT ON COLUMN classifications.action_auto_assigned IS 'True if action was auto-assigned by system, false if manually selected';
COMMENT ON COLUMN classifications.has_tracking_info IS 'True if email contains tracking/shipping information';
COMMENT ON COLUMN classifications.has_date_info IS 'True if email contains date/event information';
