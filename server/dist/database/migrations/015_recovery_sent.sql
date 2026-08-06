ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS recovery_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS oracle_recovery_ref JSONB;
