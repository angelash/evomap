-- Migration: 20250220_004_create_gates_table.sql
-- Description: Create gates table for validation pipeline tracking

BEGIN;

CREATE TABLE IF NOT EXISTS gates (
  gate_id VARCHAR(255) PRIMARY KEY,
  bundle_hash VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'received',
  error_code VARCHAR(255),
  report_key VARCHAR(255),
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT gates_status_check CHECK (status IN ('received', 'schema_ok', 'policy_ok', 'validated', 'promoted', 'candidate', 'rejected', 'quarantined'))
);

CREATE INDEX IF NOT EXISTS idx_gates_status ON gates(status);

COMMENT ON TABLE gates IS 'Validation pipeline tracking for bundles';

COMMIT;
