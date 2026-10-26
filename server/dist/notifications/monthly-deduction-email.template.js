"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMonthlyPayrollDeductionEmail = buildMonthlyPayrollDeductionEmail;
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function money(value) {
    return `AED ${Number(value || 0).toFixed(2)}`;
}
function buildMonthlyPayrollDeductionEmail(params) {
    const { billingMonthLabel, reportDateLabel, totalRows, sentCount, failedCount, notSentCount, totalPersonal, freezeNote, } = params;
    const subject = `eBilling — Monthly payroll deductions (${billingMonthLabel}) — cut-off ${reportDateLabel}`;
    const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.55;background:#f8fafc">
  <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
    <div style="background:#0f766e;color:#ffffff;padding:20px 24px">
      <h1 style="margin:0;font-size:22px;font-weight:700">Monthly payroll deduction list</h1>
      <p style="margin:8px 0 0;font-size:14px;opacity:0.95">Billing month ${escapeHtml(billingMonthLabel)} · Generated ${escapeHtml(reportDateLabel)}</p>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 16px">Dear Finance / Payroll team,</p>
      <p style="margin:0 0 16px">
        Please find attached the <strong>Excel file</strong> listing all employees whose
        <strong>personal excess</strong> was <strong>fully approved</strong> through the eBilling approval matrix
        for <strong>${escapeHtml(billingMonthLabel)}</strong>.
      </p>
      <p style="margin:0 0 16px;padding:12px 14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;color:#9a3412">
        <strong>Important:</strong> Each row shows whether the deduction was successfully posted to
        <strong>Oracle Other Deduction</strong> or not. Please do <strong>not</strong> deduct twice for rows
        already marked <strong>Sent to Oracle</strong>. Rows marked <strong>Failed / Not sent</strong> need
        manual Oracle handling.
      </p>
      <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;font-size:14px;width:100%;margin:0 0 16px">
        <tr><td><strong>Approved personal recoveries</strong></td><td>${totalRows}</td></tr>
        <tr><td><strong>Total personal amount</strong></td><td><strong>${money(totalPersonal)}</strong></td></tr>
        <tr><td><strong>Sent to Oracle</strong></td><td style="color:#15803d;font-weight:700">${sentCount}</td></tr>
        <tr><td><strong>Oracle failed</strong></td><td style="color:#b91c1c;font-weight:700">${failedCount}</td></tr>
        <tr><td><strong>Approved but not sent</strong></td><td style="color:#b45309;font-weight:700">${notSentCount}</td></tr>
      </table>
      <p style="margin:0 0 12px;padding:12px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;font-size:13px;color:#1e3a8a">
        ${escapeHtml(freezeNote || 'Approvals freeze from the 18th at 00:00 Asia/Dubai (day 17 remains open until 23:59). Any still-pending approval requests are NOT included in this file and will carry to the next billing cycle.')}
      </p>
      <p style="margin:0;font-size:13px;color:#64748b">Attachment: detailed Excel workbook.</p>
      <p style="margin:16px 0 0">Thank you.</p>
    </div>
  </div>
</body></html>`;
    return { subject, html };
}
//# sourceMappingURL=monthly-deduction-email.template.js.map
