-- Migration: 20250220_003_create_capsules_table.sql
-- Description: Create capsules table for capsule-specific data

BEGIN;

CREATE TABLE IF NOT EXISTS capsules (
  capsule_id VARCHAR(255) PRIMARY KEY REFERENCES assets(asset_id) ON DELETE CASCADE,
  gene_id VARCHAR(255) NOT NULL REFERENCES assets(asset_id),
  confidence NUMERIC(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  blast_radius_files INTEGER DEFAULT 0,
  blast_radius_lines INTEGER DEFAULT 0,
  patch_object_key VARCHAR(255),
  validation_plan_key VARCHAR(255),
  latest_validation_report_key VARCHAR(255),
  success_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_capsules_gene_id ON capsules(gene_id);
CREATE INDEX IF NOT EXISTS idx_capsules_confidence ON capsules(confidence DESC);

COMMENT ON TABLE capsules IS 'Capsule-specific data';
COMMENT ON COLUMN capsules.capsule_id IS 'References assets.asset_id';
COMMENT ON COLUMN capsules.gene_id IS 'References the Gene that created this Capsule';
COMMENT ON COLUMN capsules.confidence IS 'Confidence score (0-1)';
COMMENT ON COLUMN capsules.blast_radius_files IS 'Number of files affected';
COMMENT ON COLUMN capsules.blast_radius_lines IS 'Number of lines affected';
COMMENT ON COLUMN capsules.success_streak IS 'Consecutive successful uses';

COMMIT;
