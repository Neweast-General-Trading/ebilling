ALTER TABLE invoice_call_records
  ADD COLUMN IF NOT EXISTS callee_country_code CHAR(2),
  ADD COLUMN IF NOT EXISTS callee_country_name VARCHAR(80);

UPDATE invoice_call_records c
SET callee_country_code = 'AE'
WHERE callee_country_code IS NULL
  AND (
    callee_phone ~ '^0[245679]'
    OR callee_phone ~ '^05'
    OR callee_phone ~ '^(800|600|900|920)'
  );
