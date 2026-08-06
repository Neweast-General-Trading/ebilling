ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS approval_token UUID;

UPDATE invoices
SET approval_token = gen_random_uuid()
WHERE approval_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_approval_token
  ON invoices (approval_token)
  WHERE approval_token IS NOT NULL;
