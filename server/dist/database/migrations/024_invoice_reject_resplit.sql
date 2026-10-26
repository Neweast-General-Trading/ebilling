ALTER TABLE invoices_data ADD COLUMN IF NOT EXISTS excess_reject_reason TEXT;
ALTER TABLE invoices_data ADD COLUMN IF NOT EXISTS excess_rejected_by VARCHAR(255);
ALTER TABLE invoices_data ADD COLUMN IF NOT EXISTS excess_rejected_at TIMESTAMPTZ;

CREATE OR REPLACE VIEW invoices AS
SELECT invoices_data.id,
  invoices_data.sim_employee_id,
  invoices_data.phone_number,
  invoices_data.package_value,
  invoices_data.overage_amount,
  invoices_data.amount_due,
  invoices_data.billing_month,
  invoices_data.pdf_filename,
  invoices_data.pdf_storage_path,
  invoices_data.raw_extracted,
  invoices_data.created_at,
  invoices_data.personal_usage,
  invoices_data.due_date,
  invoices_data.parser_source,
  invoices_data.invoice_code,
  invoices_data.calls_parsed_at,
  invoices_data.call_count,
  invoices_data.uploaded_by_email,
  invoices_data.uploaded_by_name,
  invoices_data.uploaded_at,
  invoices_data.official_usage,
  invoices_data.approval_status,
  invoices_data.approval_sent_at,
  invoices_data.approval_submitted_at,
  invoices_data.recovery_sent_at,
  invoices_data.oracle_recovery_ref,
  invoices_data.recovery_status,
  invoices_data.recovery_last_error,
  invoices_data.recovery_last_attempt_at,
  invoices_data.approval_token,
  invoices_data.approval_email_count,
  invoices_data.approval_token_expires_at,
  invoices_data.hidden,
  invoices_data.excess_reject_reason,
  invoices_data.excess_rejected_by,
  invoices_data.excess_rejected_at
FROM invoices_data
WHERE invoices_data.hidden = false;
