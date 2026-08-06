#!/usr/bin/env node
/** Reset an invoice excess approval workflow back to draft (send for approval from scratch) */
const { execSync } = require('child_process');
const invoiceCode = process.argv[2] || 'INV2038345804';
const sql = `
DELETE FROM excess_approval_level_decisions
WHERE request_id IN (SELECT ear.id FROM excess_approval_requests ear JOIN invoices i ON i.id = ear.invoice_id WHERE i.invoice_code = '${invoiceCode}');
DELETE FROM excess_approval_requests
WHERE invoice_id IN (SELECT id FROM invoices WHERE invoice_code = '${invoiceCode}');
UPDATE invoices SET
  approval_status = 'draft',
  personal_usage = NULL,
  official_usage = NULL,
  approval_submitted_at = NULL,
  approval_sent_at = NULL,
  approval_email_count = 0,
  approval_token = NULL,
  approval_token_expires_at = NULL,
  recovery_status = NULL,
  recovery_sent_at = NULL,
  oracle_recovery_ref = NULL,
  recovery_last_error = NULL,
  recovery_last_attempt_at = NULL
WHERE invoice_code = '${invoiceCode}';
SELECT i.invoice_code, e.display_name, i.approval_status, i.personal_usage, i.recovery_status
FROM invoices i JOIN sim_employees e ON e.id = i.sim_employee_id WHERE i.invoice_code = '${invoiceCode}';
`;
execSync(`PGPASSWORD=root psql -h 127.0.0.1 -U root -d rectracking -c ${JSON.stringify(sql)}`, { stdio: 'inherit' });
