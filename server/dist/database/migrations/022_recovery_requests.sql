CREATE TABLE IF NOT EXISTS recovery_requests (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  co VARCHAR(32) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  requested_by VARCHAR(255) NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_by VARCHAR(255),
  decided_at TIMESTAMPTZ,
  reject_reason TEXT,
  oracle_recovery_ref JSONB,
  display_name VARCHAR(255),
  person_number VARCHAR(64),
  phone_number VARCHAR(64),
  employee_email VARCHAR(255),
  month_label VARCHAR(32),
  personal_usage NUMERIC(12, 2),
  invoice_code VARCHAR(128)
);

CREATE INDEX IF NOT EXISTS idx_recovery_requests_co_status
  ON recovery_requests (co, status);

CREATE INDEX IF NOT EXISTS idx_recovery_requests_invoice
  ON recovery_requests (invoice_id, requested_at DESC);
