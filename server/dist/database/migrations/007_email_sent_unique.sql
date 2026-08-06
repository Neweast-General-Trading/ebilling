-- Prevent duplicate invoice emails for the same employee and billing month.
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_logs_one_sent_per_month
  ON email_logs (sim_employee_id, billing_month)
  WHERE status = 'sent';
