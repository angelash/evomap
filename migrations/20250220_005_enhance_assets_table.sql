-- Migration: 20250220_005_enhance_assets_table.sql
-- Description: 存储资产置信度、影响范围和环境指纹

BEGIN;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='confidence') THEN
        ALTER TABLE assets ADD COLUMN confidence DECIMAL(5,4) DEFAULT 0.0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='blast_radius_files') THEN
        ALTER TABLE assets ADD COLUMN blast_radius_files INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='blast_radius_lines') THEN
        ALTER TABLE assets ADD COLUMN blast_radius_lines INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='env_fingerprint') THEN
        ALTER TABLE assets ADD COLUMN env_fingerprint JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='quarantined_at') THEN
        ALTER TABLE assets ADD COLUMN quarantined_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

COMMIT;
