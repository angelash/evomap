-- Migration: 20250220_001_create_nodes_table.sql
-- Description: Create nodes table for node registration

BEGIN;

CREATE TABLE IF NOT EXISTS nodes (
  node_id VARCHAR(64) PRIMARY KEY,
  public_key TEXT NOT NULL,
  role VARCHAR(32) NOT NULL,
  capabilities JSONB NOT NULL,
  gene_count INTEGER DEFAULT 0,
  capsule_count INTEGER DEFAULT 0,
  env_fingerprint JSONB,
  status VARCHAR(32) DEFAULT 'active',
  last_heartbeat TIMESTAMP WITH TIME ZONE,
  quota_limit INTEGER DEFAULT 100,
  quota_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_nodes_status ON nodes(status);
CREATE INDEX IF NOT EXISTS idx_nodes_role ON nodes(role);
CREATE INDEX IF NOT EXISTS idx_nodes_last_heartbeat ON nodes(last_heartbeat);

COMMENT ON TABLE nodes IS 'Node registry for A2A protocol';
COMMENT ON COLUMN nodes.node_id IS 'Unique node identifier';
COMMENT ON COLUMN nodes.role IS 'Role: contributor/consumer/reviewer/admin';
COMMENT ON COLUMN nodes.status IS 'Status: active/inactive/banned';

COMMIT;
