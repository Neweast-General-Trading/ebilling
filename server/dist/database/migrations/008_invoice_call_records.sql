ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS calls_parsed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS call_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS invoice_call_records (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  sim_employee_id INTEGER REFERENCES sim_employees(id) ON DELETE SET NULL,
  caller_phone VARCHAR(30) NOT NULL,
  callee_phone VARCHAR(30) NOT NULL,
  call_at TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  duration_label VARCHAR(20),
  amount NUMERIC(12, 2) DEFAULT 0,
  call_category VARCHAR(20) NOT NULL DEFAULT 'mobile',
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  billing_month DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_call_records_invoice
  ON invoice_call_records (invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoice_call_records_billing_month
  ON invoice_call_records (billing_month);

CREATE INDEX IF NOT EXISTS idx_invoice_call_records_caller_month
  ON invoice_call_records (caller_phone, billing_month);

CREATE INDEX IF NOT EXISTS idx_invoice_call_records_internal_month
  ON invoice_call_records (is_internal, billing_month);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_call_records_unique_row
  ON invoice_call_records (
    invoice_id,
    call_at,
    callee_phone,
    duration_seconds
  );
