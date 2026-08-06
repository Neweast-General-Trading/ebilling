ALTER TABLE sim_employees
  ADD COLUMN IF NOT EXISTS line_type VARCHAR(20) NOT NULL DEFAULT 'mobile';

CREATE INDEX IF NOT EXISTS idx_sim_employees_line_type ON sim_employees (line_type);
