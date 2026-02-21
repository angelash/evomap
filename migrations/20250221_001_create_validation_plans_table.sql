-- Migration: Create validation_plans table
-- Description: Store predefined validation plans for sandbox execution

CREATE TABLE IF NOT EXISTS validation_plans (
  plan_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  commands JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_validation_plans_name ON validation_plans(name);

-- Insert default validation plans
INSERT INTO validation_plans (plan_id, name, description, commands) VALUES
  ('default-js', 'Default JavaScript Validation', 'Standard validation for JavaScript projects', '[
    {"task": "lint", "command": "npm run lint"},
    {"task": "test", "command": "npm test"},
    {"task": "build", "command": "npm run build"}
  ]'::jsonb),
  ('default-ts', 'Default TypeScript Validation', 'Standard validation for TypeScript projects', '[
    {"task": "lint", "command": "npm run lint"},
    {"task": "type-check", "command": "npx tsc --noEmit"},
    {"task": "test", "command": "npm test"},
    {"task": "build", "command": "npm run build"}
  ]'::jsonb)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE validation_plans IS 'Predefined validation plans for sandbox execution';
COMMENT ON COLUMN validation_plans.plan_id IS 'Unique identifier for the validation plan';
COMMENT ON COLUMN validation_plans.commands IS 'Array of validation tasks with commands';
