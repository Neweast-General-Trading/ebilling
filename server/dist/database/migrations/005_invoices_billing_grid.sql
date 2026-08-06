ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS personal_usage NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS parser_source VARCHAR(20);

CREATE UNIQUE INDEX IF NOT EXISTS invoices_employee_month_uidx
  ON invoices (sim_employee_id, billing_month);
