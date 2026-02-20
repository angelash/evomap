-- Migration: 20250220_006_create_audit_logs_table.sql
-- Description: Create audit_logs table (append-only)

BEGIN;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  message_id VARCHAR(64),
  sender_id VARCHAR(64),
  action VARCHAR(32) NOT NULL,
  asset_id VARCHAR(64),
  result VARCHAR(16) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT audit_logs_result_check CHECK (result IN ('success', 'failure'))
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_sender ON audit_logs(sender_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_asset ON audit_logs(asset_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

COMMENT ON TABLE audit_logs IS 'Append-only audit trail for all core actions';

COMMIT;
