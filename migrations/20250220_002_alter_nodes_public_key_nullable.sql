-- Migration: 20250220_002_alter_nodes_public_key_nullable.sql
-- Description: Make public_key nullable for MVP phase

BEGIN;

-- Drop NOT NULL constraint from public_key
ALTER TABLE nodes ALTER COLUMN public_key DROP NOT NULL;

-- Add comment to clarify MVP phase
COMMENT ON COLUMN nodes.public_key IS 'Public key for node authentication (nullable in MVP)';

COMMIT;
