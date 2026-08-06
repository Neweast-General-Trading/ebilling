ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS invoice_code VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_invoices_invoice_code ON invoices (invoice_code);
