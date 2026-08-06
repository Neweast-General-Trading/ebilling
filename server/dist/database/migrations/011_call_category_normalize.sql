UPDATE invoice_call_records
SET call_category = 'landline'
WHERE call_category = 'telephone';

UPDATE invoice_call_records
SET call_category = 'international'
WHERE call_category = 'other';

UPDATE invoice_call_records c
SET call_category = CASE
  WHEN c.callee_phone ~ '^0?5' AND length(regexp_replace(c.callee_phone, '\D', '', 'g')) BETWEEN 9 AND 10 THEN 'mobile'
  WHEN c.callee_phone ~ '^0[234679]' OR c.callee_phone ~ '^(800|600|900)' THEN 'landline'
  ELSE 'international'
END
WHERE c.is_internal = FALSE
  AND c.call_category NOT IN ('mobile', 'landline', 'international');
