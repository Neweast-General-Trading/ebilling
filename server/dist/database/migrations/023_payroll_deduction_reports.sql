-- Tracks monthly payroll deduction Excel emails (day-18 cut-off).
CREATE TABLE IF NOT EXISTS payroll_deduction_reports (
  id SERIAL PRIMARY KEY,
  co VARCHAR(64) NOT NULL,
  billing_month DATE NOT NULL,
  report_month VARCHAR(7) NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recipient_to TEXT NOT NULL,
  recipient_cc TEXT,
  row_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  not_sent_count INTEGER NOT NULL DEFAULT 0,
  filename TEXT,
  details JSONB
);

CREATE UNIQUE INDEX IF NOT EXISTS payroll_deduction_reports_co_month_uidx
  ON payroll_deduction_reports (co, report_month);
