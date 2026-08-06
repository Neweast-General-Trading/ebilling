ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS approval_token_expires_at TIMESTAMPTZ;

UPDATE invoices
SET approval_token_expires_at = COALESCE(approval_sent_at, NOW()) + INTERVAL '30 days'
WHERE approval_token IS NOT NULL
  AND approval_token_expires_at IS NULL;
