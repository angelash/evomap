-- Migration: 20250221_004_fix_gates_status_check.sql
-- Description: Add 'failed' status to gates table check constraint

BEGIN;

ALTER TABLE gates DROP CONSTRAINT IF EXISTS gates_status_check;

ALTER TABLE gates ADD CONSTRAINT gates_status_check 
CHECK (status IN ('received', 'schema_ok', 'policy_ok', 'validated', 'promoted', 'candidate', 'rejected', 'quarantined', 'failed'));

COMMIT;
