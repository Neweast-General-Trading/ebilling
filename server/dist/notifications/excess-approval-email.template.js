"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildExcessApproverNotificationEmail = buildExcessApproverNotificationEmail;
exports.buildExcessApprovedFinanceEmail = buildExcessApprovedFinanceEmail;
exports.buildExcessCompletedApproversEmail = buildExcessCompletedApproversEmail;
exports.buildExcessOracleManualRequiredEmail = buildExcessOracleManualRequiredEmail;
function money(value) {
    return `AED ${Number(value || 0).toFixed(2)}`;
}
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function formatApproverDate(value) {
    if (!value)
        return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime()))
        return '—';
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}
function buildExcessApproverNotificationEmail(params) {
    const { approverName, levelOrder, totalLevels, pendingCount, approvalUrl, newRequestsCount, co, } = params;
    const batchLine = newRequestsCount && newRequestsCount > 1
        ? `<p style="margin:0 0 12px;padding:12px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;font-size:14px"><strong>${newRequestsCount} new request(s)</strong> were submitted together in one batch.</p>`
        : newRequestsCount === 1
            ? `<p style="margin:0 0 12px;padding:12px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;font-size:14px"><strong>1 new request</strong> is waiting for your review.</p>`
            : '';
    const safeUrl = escapeHtml(approvalUrl);
    const subject = `eBilling — ${pendingCount} excess approval request(s) — Level ${levelOrder} of ${totalLevels}`;
    const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.55;background:#f8fafc">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
    <div style="background:#0284c7;color:#ffffff;padding:20px 24px">
      <h1 style="margin:0;font-size:22px;font-weight:700">Excess approval required</h1>
      <p style="margin:8px 0 0;font-size:14px;opacity:0.95">Level ${levelOrder} of ${totalLevels}${co ? ` · ${escapeHtml(co)}` : ''}</p>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 16px">Dear ${escapeHtml(approverName)},</p>
      ${batchLine}
      <p style="margin:0 0 16px">You have <strong>${pendingCount}</strong> excess invoice request(s) waiting for your approval at <strong>Level ${levelOrder}</strong>.</p>
      <p style="margin:0 0 20px;text-align:center">
        <a href="${safeUrl}" style="display:inline-block;background:#0284c7;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Open approval request</a>
      </p>
      <div style="margin:0 0 16px;padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b">Request link</p>
        <p style="margin:0;font-size:13px;word-break:break-all"><a href="${safeUrl}" style="color:#0369a1;text-decoration:underline">${safeUrl}</a></p>
      </div>
      <p style="margin:0;font-size:12px;color:#64748b">Use the button above to open eBilling. Review all pending rows on the approval page, then approve or reject each request.</p>
    </div>
    <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b">
      Thank you.
    </div>
  </div>
</body></html>`;
    return { subject, html };
}
function buildExcessApprovedFinanceEmail(params) {
    const { employeeName, phoneNumber, monthLabel, invoiceCode, exceededAmount, officialUsage, personalUsage, oracleEntryId, approverEmail, } = params;
    const subject = `eBilling — Personal excess approved & sent to Oracle (${employeeName})`;
    const html = `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
  <p>Dear Sona,</p>
  <p>The following personal excess amount has been approved through the excess approval matrix and queued in Oracle for salary deduction.</p>
  <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;font-size:14px">
    <tr><td><strong>Employee</strong></td><td>${escapeHtml(employeeName)}</td></tr>
    <tr><td><strong>Mobile</strong></td><td>${escapeHtml(phoneNumber || '—')}</td></tr>
    <tr><td><strong>Month</strong></td><td>${escapeHtml(monthLabel)}</td></tr>
    <tr><td><strong>Invoice reference</strong></td><td>${escapeHtml(invoiceCode || '—')}</td></tr>
    <tr><td><strong>Total excess</strong></td><td>${money(exceededAmount)}</td></tr>
    <tr><td><strong>Official (company)</strong></td><td>${money(officialUsage)}</td></tr>
    <tr><td><strong>Personal (deduction)</strong></td><td><strong style="color:#b45309">${money(personalUsage)}</strong></td></tr>
    <tr><td><strong>Final approver</strong></td><td>${escapeHtml(approverEmail)}</td></tr>
    <tr><td><strong>Oracle request / entry ID</strong></td><td><strong>${escapeHtml(oracleEntryId || '—')}</strong></td></tr>
  </table>
  <p style="margin-top:16px">Official usage is <strong>not</strong> sent to Oracle — only the personal portion above.</p>
  <p>Thank you.</p>
</body></html>`;
    return { subject, html };
}
function buildExcessCompletedApproversEmail(params) {
    const { requestId, invoiceCode, employeeName, phoneNumber, monthLabel, personalUsage, officialUsage, exceededAmount, oracleEntryId, finalApproverEmail, approvers, } = params;
    const subject = `eBilling — Excess approval #${requestId} completed (${invoiceCode})`;
    const approverRows = (approvers || []).map((row) => `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:center">Level ${row.levelOrder}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0">${escapeHtml(row.approverEmail)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0">${formatApproverDate(row.decidedAt)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#15803d;font-weight:600">Approved</td>
    </tr>`).join('');
    const html = `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6;background:#f8fafc;padding:24px">
  <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
    <div style="background:#0f766e;color:#fff;padding:20px 24px">
      <h1 style="margin:0;font-size:22px;font-weight:700">Excess approval completed</h1>
      <p style="margin:8px 0 0;font-size:14px;opacity:0.9">Request #${requestId} — all approval levels are complete.</p>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 16px">The personal excess amount has been sent to <strong>Oracle recovery</strong>.</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
        <tr>
          <td style="padding:10px 0;color:#64748b;width:38%">Invoice</td>
          <td style="padding:10px 0;font-weight:600">${escapeHtml(invoiceCode || '—')}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#64748b">Employee</td>
          <td style="padding:10px 0;font-weight:600">${escapeHtml(employeeName || '—')} <span style="color:#64748b;font-weight:400">(${escapeHtml(phoneNumber || '—')})</span></td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#64748b">Billing month</td>
          <td style="padding:10px 0;font-weight:600">${escapeHtml(monthLabel || '—')}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#64748b">Total exceeded</td>
          <td style="padding:10px 0;font-weight:600">${money(exceededAmount)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#64748b">Official usage</td>
          <td style="padding:10px 0">${money(officialUsage)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#64748b">Personal usage</td>
          <td style="padding:10px 0;font-weight:700;color:#b45309">${money(personalUsage)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#64748b">Oracle entry ID</td>
          <td style="padding:10px 0;font-weight:700;color:#0f766e">${escapeHtml(oracleEntryId || '—')}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#64748b">Final approver</td>
          <td style="padding:10px 0">${escapeHtml(finalApproverEmail || '—')}</td>
        </tr>
      </table>
      <h2 style="margin:0 0 12px;font-size:16px;color:#0f172a">Approval chain</h2>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e2e8f0;border-radius:8px">
        <thead>
          <tr style="background:#f1f5f9">
            <th style="padding:10px 12px;text-align:center;border-bottom:1px solid #e2e8f0">Level</th>
            <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #e2e8f0">Approver</th>
            <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #e2e8f0">Date &amp; time</th>
            <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #e2e8f0">Status</th>
          </tr>
        </thead>
</body></html>`;
    return { subject, html };
}
function buildExcessOracleManualRequiredEmail(params) {
    const { employeeName, phoneNumber, personNumber, monthLabel, invoiceCode, exceededAmount, officialUsage, personalUsage, approverEmail, oracleError, approvers, } = params;
    const subject = `eBilling — Manual Oracle Other Deduction required (${employeeName})`;
    const approverRows = (approvers || []).map((row) => `<tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center">L${row.levelOrder}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${escapeHtml(row.approverEmail)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${formatApproverDate(row.decidedAt)}</td>
    </tr>`).join('');
    const html = `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6;background:#f8fafc;padding:24px">
  <div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #fecaca;border-radius:12px;overflow:hidden">
    <div style="background:#b91c1c;color:#fff;padding:20px 24px">
      <h1 style="margin:0;font-size:22px;font-weight:700">Manual Oracle action required</h1>
      <p style="margin:8px 0 0;font-size:14px;opacity:0.95">Other Deduction could not be applied automatically</p>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 16px">Dear Sona,</p>
      <p style="margin:0 0 16px">
        An excess approval request was <strong>fully approved</strong> in eBilling, but the system could
        <strong>not</strong> add or update the <strong>Other Deduction</strong> element in Oracle for this employee.
        Please handle this case manually in Oracle and correct the employee payroll fields.
      </p>
      <p style="margin:0 0 16px;padding:12px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#991b1b">
        <strong>Reason:</strong> ${escapeHtml(oracleError || 'Other Deduction field is not eligible or does not match Oracle for this employee.')}
      </p>
      <h2 style="margin:0 0 12px;font-size:16px">Employee &amp; invoice details</h2>
      <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;font-size:14px;width:100%;margin-bottom:20px">
        <tr><td><strong>Employee</strong></td><td>${escapeHtml(employeeName || '—')}</td></tr>
        <tr><td><strong>Mobile</strong></td><td>${escapeHtml(phoneNumber || '—')}</td></tr>
        <tr><td><strong>Oracle person number</strong></td><td>${escapeHtml(personNumber || '—')}</td></tr>
        <tr><td><strong>Billing month</strong></td><td>${escapeHtml(monthLabel || '—')}</td></tr>
        <tr><td><strong>Invoice reference</strong></td><td>${escapeHtml(invoiceCode || '—')}</td></tr>
        <tr><td><strong>Total excess</strong></td><td>${money(exceededAmount)}</td></tr>
        <tr><td><strong>Official usage</strong></td><td>${money(officialUsage)}</td></tr>
        <tr><td><strong>Personal usage (deduction)</strong></td><td><strong style="color:#b45309">${money(personalUsage)}</strong></td></tr>
        <tr><td><strong>Final approver</strong></td><td>${escapeHtml(approverEmail || '—')}</td></tr>
      </table>
      <h2 style="margin:0 0 12px;font-size:16px">Approval chain</h2>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e2e8f0;margin-bottom:16px">
        <thead><tr style="background:#f1f5f9">
          <th style="padding:8px 10px;border-bottom:1px solid #e2e8f0">Level</th>
          <th style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:left">Approver</th>
          <th style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:left">Approved at</th>
        </tr></thead>
        <tbody>${approverRows || '<tr><td colspan="3" style="padding:12px;color:#64748b">No approver records found.</td></tr>'}</tbody>
      </table>
      <p style="margin:0;font-size:13px;color:#64748b">
        The approval workflow in eBilling is already complete. Only the Oracle Other Deduction step needs manual correction.
      </p>
      <p style="margin:16px 0 0">Thank you.</p>
    </div>
  </div>
</body></html>`;
    return { subject, html };
}
