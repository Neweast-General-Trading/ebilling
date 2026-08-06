-- Multi-level excess approval matrix (super admin settings)

CREATE TABLE IF NOT EXISTS excess_approval_levels (
  id SERIAL PRIMARY KEY,
  co VARCHAR(20) NOT NULL,
  level_order INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (co, level_order)
);

CREATE TABLE IF NOT EXISTS excess_approval_level_approvers (
  id SERIAL PRIMARY KEY,
  level_id INT NOT NULL REFERENCES excess_approval_levels(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (level_id, email)
);

CREATE INDEX IF NOT EXISTS idx_excess_approval_levels_co ON excess_approval_levels(co);

CREATE TABLE IF NOT EXISTS excess_approval_approver_access (
  id SERIAL PRIMARY KEY,
  co VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  access_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (co, email),
  UNIQUE (access_token)
);

CREATE TABLE IF NOT EXISTS excess_approval_requests (
  id SERIAL PRIMARY KEY,
  invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  co VARCHAR(20) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  current_level INT NOT NULL DEFAULT 1,
  official_usage NUMERIC(12, 2) NOT NULL DEFAULT 0,
  personal_usage NUMERIC(12, 2) NOT NULL DEFAULT 0,
  employee_remarks TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rejected_by VARCHAR(255),
  reject_reason TEXT,
  rejected_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  oracle_recovery_ref JSONB,
  UNIQUE (invoice_id)
);

CREATE INDEX IF NOT EXISTS idx_excess_approval_requests_co_status
  ON excess_approval_requests(co, status, current_level);

CREATE TABLE IF NOT EXISTS excess_approval_level_decisions (
  id SERIAL PRIMARY KEY,
  request_id INT NOT NULL REFERENCES excess_approval_requests(id) ON DELETE CASCADE,
  level_order INT NOT NULL,
  approver_email VARCHAR(255) NOT NULL,
  action VARCHAR(20) NOT NULL,
  reject_reason TEXT,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_excess_approval_decisions_request
  ON excess_approval_level_decisions(request_id, level_order);
