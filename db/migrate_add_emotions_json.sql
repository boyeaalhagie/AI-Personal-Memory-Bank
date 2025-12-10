-- Migration: Add emotions_json column to photos table
-- This allows storing multiple emotions per photo

ALTER TABLE photos ADD COLUMN IF NOT EXISTS emotions_json TEXT;

-- Create index for JSON queries (PostgreSQL 12+)
-- CREATE INDEX IF NOT EXISTS idx_photos_emotions_json ON photos USING GIN (emotions_json::jsonb);

