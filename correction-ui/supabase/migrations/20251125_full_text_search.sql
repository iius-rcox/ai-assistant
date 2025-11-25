-- Migration: Full-text search for emails
-- Feature: 005-table-enhancements
-- Tasks: T004, T005
--
-- Run this migration in Supabase SQL Editor to enable full-text search
-- for the email classifications table enhancements.

-- Enable pg_trgm extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index for full-text search on emails table
-- This index covers subject, sender, and body fields
CREATE INDEX IF NOT EXISTS idx_emails_search
ON emails USING GIN (
  to_tsvector('english',
    coalesce(subject, '') || ' ' ||
    coalesce(sender, '') || ' ' ||
    coalesce(body, '')
  )
);

-- Create search_emails RPC function for server-side full-text search
-- This function is called when dataset size >= 1,000 rows
CREATE OR REPLACE FUNCTION search_emails(search_query TEXT)
RETURNS SETOF emails AS $$
  SELECT * FROM emails
  WHERE to_tsvector('english',
    coalesce(subject, '') || ' ' ||
    coalesce(sender, '') || ' ' ||
    coalesce(body, ''))
  @@ plainto_tsquery('english', search_query)
  ORDER BY ts_rank(
    to_tsvector('english',
      coalesce(subject, '') || ' ' ||
      coalesce(sender, '') || ' ' ||
      coalesce(body, '')),
    plainto_tsquery('english', search_query)
  ) DESC
  LIMIT 1000;
$$ LANGUAGE SQL STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_emails(TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION search_emails(TEXT) IS
  'Full-text search across email subject, sender, and body.
   Returns up to 1000 results ordered by relevance.
   Feature: 005-table-enhancements';
