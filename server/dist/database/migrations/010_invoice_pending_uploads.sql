CREATE TABLE IF NOT EXISTS invoice_pending_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  co VARCHAR(50) NOT NULL,
  phone_number VARCHAR(30) NOT NULL,
  pdf_filename VARCHAR(500) NOT NULL,
  pdf_storage_path VARCHAR(1000) NOT NULL,
  parsed JSONB NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_by_email VARCHAR(255),
  created_by_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_invoice_pending_uploads_co_status
  ON invoice_pending_uploads (co, status);
