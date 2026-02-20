-- Migration: 20250220_005_create_reports_table.sql
-- Description: Create reports table for reuse feedback

BEGIN;

CREATE TABLE IF NOT EXISTS reports (
  id BIGSERIAL PRIMARY KEY,
  capsule_id VARCHAR(64) NOT NULL REFERENCES assets(asset_id),
  node_id VARCHAR(64) NOT NULL REFERENCES nodes(node_id),
  result VARCHAR(16) NOT NULL,
  env_fingerprint JSONB,
  duration_ms INTEGER,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT reports_result_check CHECK (result IN ('success', 'failure'))
);

CREATE INDEX IF NOT EXISTS idx_reports_capsule_id ON reports(capsule_id);
CREATE INDEX IF NOT EXISTS idx_reports_node_id ON reports(node_id);

COMMENT ON TABLE reports IS 'Reuse feedback (natural selection data)';

COMMIT;
