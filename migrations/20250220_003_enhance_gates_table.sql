-- Migration: 20250220_003_enhance_gates_table.sql
-- Description: 为 Gate Pipeline 增加阶段、错误和决策字段

BEGIN;

-- 增加字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gates' AND column_name='stage') THEN
        ALTER TABLE gates ADD COLUMN stage VARCHAR(32) DEFAULT 'parse';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gates' AND column_name='error_code') THEN
        ALTER TABLE gates ADD COLUMN error_code VARCHAR(64);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gates' AND column_name='error_message') THEN
        ALTER TABLE gates ADD COLUMN error_message TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gates' AND column_name='decision') THEN
        ALTER TABLE gates ADD COLUMN decision VARCHAR(32);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gates' AND column_name='decision_reason') THEN
        ALTER TABLE gates ADD COLUMN decision_reason TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gates' AND column_name='updated_at') THEN
        ALTER TABLE gates ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_gates_status ON gates(status);
CREATE INDEX IF NOT EXISTS idx_gates_stage ON gates(stage);

COMMIT;
