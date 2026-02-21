-- Migration: Enhance assets table with GDI scores
-- Description: Add GDI (Global Dependency Index) scoring fields

-- Add GDI score fields
ALTER TABLE assets ADD COLUMN IF NOT EXISTS gdi_score FLOAT DEFAULT 0.0;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS intrinsic_score FLOAT DEFAULT 0.0;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS usage_score FLOAT DEFAULT 0.0;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS freshness_score FLOAT DEFAULT 0.0;

-- Create index for GDI sorting
CREATE INDEX IF NOT EXISTS idx_assets_gdi_score ON assets(gdi_score DESC);

-- Create composite index for better query performance
CREATE INDEX IF NOT EXISTS idx_assets_confidence_blast ON assets(confidence DESC, blast_radius_files ASC);

COMMENT ON COLUMN assets.gdi_score IS 'Global Dependency Index - combined score for ranking';
COMMENT ON COLUMN assets.intrinsic_score IS 'Intrinsic score based on compliance and validation';
COMMENT ON COLUMN assets.usage_score IS 'Usage score based on reuse count and success rate';
COMMENT ON COLUMN assets.freshness_score IS 'Freshness score based on time decay';
