ALTER TABLE monthly_remarks
  ADD COLUMN IF NOT EXISTS employee_remarks TEXT,
  ADD COLUMN IF NOT EXISTS admin_remarks TEXT;

UPDATE monthly_remarks
SET admin_remarks = remarks
WHERE admin_remarks IS NULL
  AND remarks IS NOT NULL
  AND trim(remarks) <> '';
