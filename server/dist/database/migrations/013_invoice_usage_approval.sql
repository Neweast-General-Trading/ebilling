ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS official_usage NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS approval_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approval_submitted_at TIMESTAMPTZ;

UPDATE invoices
SET
  official_usage = COALESCE(official_usage, 0),
  personal_usage = COALESCE(personal_usage, 0),
  approval_status = CASE
    WHEN COALESCE(amount_due, 0) > COALESCE(
      (SELECT COALESCE(e.total_amount, e.package_value, 0)
       FROM sim_employees e WHERE e.id = invoices.sim_employee_id),
      0
    ) THEN 'draft'
    ELSE 'not_required'
  END
WHERE approval_status IS NULL OR approval_status = 'draft';
