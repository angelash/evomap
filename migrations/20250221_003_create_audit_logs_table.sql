-- Migration: Create audit_logs table
-- Description: Store audit logs for all critical operations

CREATE TABLE IF NOT EXISTS audit_logs (
  log_id SERIAL PRIMARY KEY,
  operation_type VARCHAR(50) NOT NULL,
  user_id VARCHAR(255),
  target_id VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON audit_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation_created ON audit_logs(operation_type, created_at DESC);

COMMENT ON TABLE audit_logs IS 'Audit logs for all critical operations (publish, decision, revoke, report)';
COMMENT ON COLUMN audit_logs.operation_type IS 'Type of operation (publish, decision, revoke, report)';
COMMENT ON COLUMN audit_logs.details IS 'Additional operation details in JSON format';
