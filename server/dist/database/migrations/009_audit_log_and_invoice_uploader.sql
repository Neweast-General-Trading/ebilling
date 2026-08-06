ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS uploaded_by_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS uploaded_by_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ;

UPDATE invoices
SET uploaded_at = created_at
WHERE uploaded_at IS NULL;

CREATE TABLE IF NOT EXISTS ebilling_audit_logs (
  id SERIAL PRIMARY KEY,
  co VARCHAR(50) NOT NULL,
  actor_email VARCHAR(255) NOT NULL,
  actor_name VARCHAR(255),
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80),
  entity_id VARCHAR(80),
  summary TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ebilling_audit_logs_co_created
  ON ebilling_audit_logs (co, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ebilling_audit_logs_action
  ON ebilling_audit_logs (action, created_at DESC);
