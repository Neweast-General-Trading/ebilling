#!/usr/bin/env node
/**
 * One-off: notify Muhammed Fawaz of all pending Level-1 excess approval requests.
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../server/.env');
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const { Pool } = require('pg');
const { sendMail, resolveMailRecipient } = require('../server/dist/config/mail.config');
const { buildExcessApprovalRequestUrl } = require('../server/dist/invoice/recovery-teams-message');
const { formatDisplayEmail } = require('../server/dist/common/ebilling-admin-access');

const CO = 'BI_NEGT';
const APPROVER_EMAIL = 'muhammed.fawaz@neweast.co';
const LEVEL = 1;

function money(v) {
  return `AED ${Number(v || 0).toFixed(2)}`;
}

function escapeHtml(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMonth(key) {
  const m = String(key || '').slice(5, 7);
  const y = String(key || '').slice(2, 4);
  const names = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const n = Number(m);
  return n >= 1 && n <= 12 ? `${names[n]} ${y}` : String(key || '—');
}

function calcExcess(invoiceTotal, packageTotal) {
  return Math.max(0, Number(invoiceTotal || 0) - Number(packageTotal || 0));
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const [{ rows: levelRows }, { rows: tokenRows }, { rows: pendingRows }, { rows: maxRows }] = await Promise.all([
      pool.query(
        `SELECT l.level_order FROM excess_approval_levels l
         INNER JOIN excess_approval_level_approvers a ON a.level_id = l.id
         WHERE l.co = $1 AND lower(a.email) = lower($2)`,
        [CO, APPROVER_EMAIL],
      ),
      pool.query(
        `SELECT access_token FROM excess_approval_approver_access WHERE co = $1 AND lower(email) = lower($2)`,
        [CO, APPROVER_EMAIL],
      ),
      pool.query(
        `SELECT ear.id AS request_id, ear.official_usage, ear.personal_usage,
                e.display_name, e.phone_number, i.invoice_code,
                to_char(i.billing_month, 'YYYY-MM') AS month_key,
                i.amount_due AS invoice_total,
                COALESCE(e.total_amount, e.package_value, 0) AS package_total,
                ear.employee_remarks
         FROM excess_approval_requests ear
         INNER JOIN invoices i ON i.id = ear.invoice_id
         INNER JOIN sim_employees e ON e.id = i.sim_employee_id
         WHERE ear.co = $1 AND ear.status = 'pending' AND ear.current_level = $2
         ORDER BY ear.submitted_at ASC`,
        [CO, LEVEL],
      ),
      pool.query(`SELECT COALESCE(MAX(level_order), 0)::int AS max_level FROM excess_approval_levels WHERE co = $1`, [CO]),
    ]);

    if (!levelRows.length) {
      throw new Error(`${APPROVER_EMAIL} is not configured in the excess approval matrix for ${CO}`);
    }
    const token = tokenRows[0]?.access_token;
    if (!token) throw new Error(`No access token for ${APPROVER_EMAIL}`);

    const totalLevels = Number(maxRows[0]?.max_level) || 1;
    const approvalUrl = buildExcessApprovalRequestUrl(CO, token);
    const approverName = formatDisplayEmail(APPROVER_EMAIL);
    const pendingCount = pendingRows.length;

    const rowsHtml = pendingRows
      .map((row) => {
        const excess = calcExcess(row.invoice_total, row.package_total);
        return `<tr>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${escapeHtml(row.display_name)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${escapeHtml(row.phone_number || '—')}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${escapeHtml(formatMonth(row.month_key))}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:12px">${escapeHtml(row.invoice_code || '—')}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right;color:#b45309;font-weight:600">${money(excess)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right">${money(row.official_usage)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right">${money(row.personal_usage)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px">${escapeHtml(row.employee_remarks || '—')}</td>
        </tr>`;
      })
      .join('');

    const subject = `eBilling — ${pendingCount} excess invoice(s) awaiting your approval (Level ${LEVEL} of ${totalLevels})`;
    const html = `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
  <p>Dear ${escapeHtml(approverName)},</p>
  <p>You have <strong>${pendingCount}</strong> excess invoice(s) waiting for your approval at <strong>Level ${LEVEL}</strong> of ${totalLevels}.</p>
  <p>Any one approver at this level can approve each request — your action counts for the whole level.</p>
  <p><a href="${escapeHtml(approvalUrl)}" style="display:inline-block;background:#0284c7;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Open Approval Request</a></p>
  <p style="font-size:13px"><strong>Direct link:</strong><br/><a href="${escapeHtml(approvalUrl)}">${escapeHtml(approvalUrl)}</a></p>
  <h3 style="margin-top:24px;font-size:15px">Pending requests</h3>
  <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;font-size:13px;border:1px solid #e2e8f0">
    <thead>
      <tr style="background:#f8fafc;text-align:left">
        <th style="padding:8px 10px;border-bottom:1px solid #e2e8f0">Employee</th>
        <th style="padding:8px 10px;border-bottom:1px solid #e2e8f0">Phone</th>
        <th style="padding:8px 10px;border-bottom:1px solid #e2e8f0">Month</th>
        <th style="padding:8px 10px;border-bottom:1px solid #e2e8f0">Reference</th>
        <th style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right">Excess</th>
        <th style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right">Official</th>
        <th style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right">Personal</th>
        <th style="padding:8px 10px;border-bottom:1px solid #e2e8f0">Remarks</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <p style="margin-top:16px;font-size:12px;color:#64748b">Open the link above to approve or reject each invoice. No Microsoft login is required from this email link.</p>
  <p>Thank you,<br/>NEWEAST eBilling</p>
</body></html>`;

    const { deliverTo } = resolveMailRecipient(APPROVER_EMAIL);
    const info = await sendMail({ to: deliverTo, subject, html });
    console.log(`Sent to ${APPROVER_EMAIL} -> ${deliverTo}`);
    console.log('Pending count:', pendingCount);
    console.log('Approval URL:', approvalUrl);
    console.log('Message:', info.messageId || info.response || 'ok');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
