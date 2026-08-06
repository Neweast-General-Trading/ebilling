ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS approval_email_count INTEGER NOT NULL DEFAULT 0;

UPDATE invoices
SET approval_email_count = 1
WHERE approval_status IN ('pending_approval', 'waiting_confirmation')
  AND approval_sent_at IS NOT NULL
  AND approval_email_count = 0;
