ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS recovery_status TEXT,
  ADD COLUMN IF NOT EXISTS recovery_last_error TEXT,
  ADD COLUMN IF NOT EXISTS recovery_last_attempt_at TIMESTAMPTZ;

UPDATE invoices
SET recovery_status = 'sent'
WHERE approval_status = 'recovery_sent'
  AND (recovery_status IS NULL OR recovery_status = '');

UPDATE invoices
SET recovery_status = 'pending'
WHERE approval_status = 'ready_for_recovery'
  AND (recovery_status IS NULL OR recovery_status = '');
