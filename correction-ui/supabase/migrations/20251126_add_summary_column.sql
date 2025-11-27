-- Add summary column to classifications table
-- Feature: 008-column-search-filters (email summary generation)
-- This stores the AI-generated summary of each classified email

ALTER TABLE classifications 
ADD COLUMN IF NOT EXISTS summary TEXT;

-- Add comment for documentation
COMMENT ON COLUMN classifications.summary IS 'AI-generated summary of the email content (max 500 chars, 2-3 sentences)';
