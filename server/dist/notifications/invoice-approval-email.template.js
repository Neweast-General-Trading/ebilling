"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NEWEAST_LOGO_CID = exports.NEWEAST_LOGO_PATH = void 0;
exports.getEmailLogoAttachment = getEmailLogoAttachment;
exports.formatBillMonthUpper = formatBillMonthUpper;
exports.formatDueDateLong = formatDueDateLong;
exports.buildApprovalRequestEmail = buildApprovalRequestEmail;
exports.buildFolderApprovalRequestEmail = buildFolderApprovalRequestEmail;
exports.buildApprovalConfirmationEmail = buildApprovalConfirmationEmail;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const invoice_billing_util_1 = require("../invoice/invoice-billing.util");
exports.NEWEAST_LOGO_PATH = path.join(process.cwd(), 'assets/email/neweast-logo.png');
exports.NEWEAST_LOGO_CID = 'neweast-logo';
function getEmailLogoAttachment() {
    if (!fs.existsSync(exports.NEWEAST_LOGO_PATH)) {
        return null;
    }
    return {
        filename: 'neweast-logo.png',
        path: exports.NEWEAST_LOGO_PATH,
        cid: exports.NEWEAST_LOGO_CID,
    };
}
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function ordinalSuffix(day) {
    if (day >= 11 && day <= 13)
        return 'th';
    switch (day % 10) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
}
function formatBillMonthUpper(month) {
    const [year, monthNum] = month.split('-');
    const date = new Date(Number(year), Number(monthNum) - 1, 1);
    if (Number.isNaN(date.getTime()))
        return month.toUpperCase();
    const monthName = date.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    return `${monthName} ${year}`;
}
function resolveApprovalDueDate(month, dueDate) {
    if (dueDate) {
        const parsed = new Date(`${dueDate.slice(0, 10)}T12:00:00`);
        if (!Number.isNaN(parsed.getTime()))
            return parsed;
    }
    const [year, monthNum] = month.split('-').map(Number);
    return new Date(year, monthNum, 8);
}
function formatDueDateLong(month, dueDate) {
    const date = resolveApprovalDueDate(month, dueDate);
    const monthName = date.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    const day = date.getDate();
    const year = date.getFullYear();
    return `${monthName} ${day}${ordinalSuffix(day)}, ${year}`;
}
function emailFooter() {
    return `
    <div style="padding:20px 24px;background:#f8fafc;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;font-weight:700;color:#0f172a;">Neweast General Trading</p>
      <p style="margin:14px 0 0;font-size:11px;color:#94a3b8;line-height:1.5;">
        This is an automated message. Please do not reply to this email — this mailbox is not monitored.
      </p>
    </div>
  `;
}
function emailShell(title, bodyHtml) {
    const hasLogo = fs.existsSync(exports.NEWEAST_LOGO_PATH);
    const logoBlock = hasLogo
        ? `<img src="cid:${exports.NEWEAST_LOGO_CID}" alt="Neweast General Trading" style="max-width:260px;width:100%;height:auto;display:block;margin:0 auto 12px;" />`
        : '';
    return `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.65;color:#111;max-width:640px;margin:0 auto;">
      <div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
        <div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:24px;text-align:center;">
          ${logoBlock}
          <p style="margin:0;color:#f8fafc;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">${escapeHtml(title)}</p>
        </div>
        <div style="padding:28px 24px;background:#ffffff;">
          ${bodyHtml}
        </div>
        ${emailFooter()}
      </div>
    </div>
  `;
}
function billSummaryTable(row) {
    const phone = escapeHtml(row.phone_number);
    const reference = escapeHtml(row.invoice_code?.trim() || '—');
    const exceeded = row.exceeded_amount;
    return `
    <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td colspan="2" style="padding:12px 16px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">
          Bill Summary
        </td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-top:1px solid #f1f5f9;color:#64748b;">Mobile number</td>
        <td style="padding:10px 16px;border-top:1px solid #f1f5f9;text-align:right;font-weight:600;">${phone}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-top:1px solid #f1f5f9;color:#64748b;">Invoice reference</td>
        <td style="padding:10px 16px;border-top:1px solid #f1f5f9;text-align:right;font-weight:600;font-family:Consolas,Monaco,monospace;font-size:13px;">${reference}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-top:1px solid #f1f5f9;color:#64748b;">Package allowance</td>
        <td style="padding:10px 16px;border-top:1px solid #f1f5f9;text-align:right;font-weight:600;">AED ${row.package_total.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-top:1px solid #f1f5f9;color:#64748b;">Invoice total</td>
        <td style="padding:10px 16px;border-top:1px solid #f1f5f9;text-align:right;font-weight:600;">AED ${row.invoice_total.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-top:1px solid #f1f5f9;color:#64748b;">Amount above package</td>
        <td style="padding:10px 16px;border-top:1px solid #f1f5f9;text-align:right;font-weight:700;color:#dc2626;">AED ${exceeded.toFixed(2)}</td>
      </tr>
    </table>
  `;
}
function attachmentNotice() {
    return `
    <div style="margin:20px 0 0;padding:14px 16px;border-radius:8px;border:1px solid #bfdbfe;background:#eff6ff;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#1d4ed8;">Attachment included</p>
      <p style="margin:0;font-size:14px;color:#1e3a8a;line-height:1.6;">
        Your e&amp; (Etisalat) bill PDF is attached to this email. Please review the attachment carefully before submitting your usage split using the link in this email.
      </p>
    </div>
  `;
}
function buildFolderApprovalRequestEmail(row, folderUrl) {
    const billMonthUpper = formatBillMonthUpper(row.month);
    const dueDateLong = formatDueDateLong(row.month, row.due_date);
    const safeFolderUrl = escapeHtml(folderUrl.replace(/\/$/, ''));
    const displayName = escapeHtml(row.display_name?.trim() || 'Colleague');
    const subject = `Action Required — Etisalat Bill ${billMonthUpper}`;
    const body = emailShell('e& Bill Approval', `
      <p style="margin:0 0 16px;font-size:15px;">Good day, <strong>${displayName}</strong>,</p>
      <p style="margin:0 0 16px;">
        Your Etisalat bill for <strong>${escapeHtml(billMonthUpper)}</strong> exceeds the company package allowance.
        Please review the bill and indicate how the amount above your package should be split between
        <strong>official (company)</strong> and <strong>personal</strong> usage.
      </p>
      ${billSummaryTable(row)}
      <div style="margin:20px 0;padding:16px;border-radius:8px;border-left:4px solid #dc2626;background:#fef2f2;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#991b1b;">Response deadline</p>
        <p style="margin:0;font-size:15px;color:#7f1d1d;">
          Please submit your split by <strong>${escapeHtml(dueDateLong)}</strong> at the latest.
        </p>
      </div>
      <p style="margin:0 0 16px;">
        If we do not receive your submission by the deadline, the outstanding amount may be
        processed automatically for salary recovery in line with company policy.
      </p>
      <div style="margin:24px 0;text-align:center;">
        <a href="${safeFolderUrl}" style="display:inline-block;padding:12px 24px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
          Review bill &amp; submit approval
        </a>
      </div>
      <p style="margin:0 0 16px;font-size:14px;color:#475569;text-align:center;">
        Or open this link: <a href="${safeFolderUrl}" style="color:#1d4ed8;">${safeFolderUrl}</a>
      </p>
      ${attachmentNotice()}
      <p style="margin:24px 0 0;">
        Thank you for your cooperation and prompt attention to this matter.
      </p>
    `);
    return { subject, body };
}
function buildApprovalRequestEmail(row, intranetUrl) {
    const billMonthUpper = formatBillMonthUpper(row.month);
    const dueDateLong = formatDueDateLong(row.month, row.due_date);
    const safeIntranetUrl = escapeHtml(intranetUrl.replace(/\/$/, ''));
    const displayName = escapeHtml(row.display_name?.trim() || 'Colleague');
    const subject = `Action Required — Etisalat Bill ${billMonthUpper}`;
    const body = emailShell('e& Bill Approval', `
      <p style="margin:0 0 16px;font-size:15px;">Good day, <strong>${displayName}</strong>,</p>
      <p style="margin:0 0 16px;">
        With regard to your Etisalat bill for <strong>${escapeHtml(billMonthUpper)}</strong>,
        your invoice exceeds the company package allowance. Please review the bill and
        indicate how the amount above your package should be split between
        <strong>official</strong> and <strong>personal</strong> usage
        (personal calls, parking, international usage, and similar charges).
      </p>
      ${billSummaryTable(row)}
      <div style="margin:20px 0;padding:16px;border-radius:8px;border-left:4px solid #dc2626;background:#fef2f2;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#991b1b;">Response deadline</p>
        <p style="margin:0;font-size:15px;color:#7f1d1d;">
          Please submit your split on the intranet by <strong>${escapeHtml(dueDateLong)}</strong> at the latest.
        </p>
      </div>
      <p style="margin:0 0 16px;">
        If we do not receive your submission by the deadline, the outstanding amount may be
        processed automatically for salary recovery in line with company policy.
      </p>
      <div style="margin:20px 0;padding:16px;border-radius:8px;border:1px solid #bfdbfe;background:#eff6ff;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#1d4ed8;">How to submit</p>
        <p style="margin:0 0 12px;font-size:14px;color:#1e3a8a;line-height:1.6;">
          Please sign in to your intranet account at
          <a href="${safeIntranetUrl}" style="color:#1d4ed8;font-weight:600;">${safeIntranetUrl}</a>
          and open the pending request under <strong>e&amp; bill approval</strong> in the right-hand sidebar.
        </p>
        <p style="margin:0;font-size:14px;color:#1e3a8a;line-height:1.6;">
          Do not reply to this email — submit your official / personal split directly on the intranet.
        </p>
      </div>
      ${attachmentNotice()}
      <p style="margin:24px 0 0;">
        Thank you for your cooperation and prompt attention to this matter.
      </p>
    `);
    return { subject, body };
}
function buildApprovalConfirmationEmail(row) {
    const displayName = escapeHtml(row.display_name?.trim() || 'Colleague');
    const monthLabel = escapeHtml((0, invoice_billing_util_1.formatBillingMonthLabel)(row.month));
    const billMonthUpper = formatBillMonthUpper(row.month);
    const deduction = row.personal_usage;
    const hasPersonalDeduction = deduction > 0;
    const subject = `Confirmed — e& Bill Usage Split (${(0, invoice_billing_util_1.formatBillingMonthLabel)(row.month)})`;
    const deductionBlock = hasPersonalDeduction
        ? `
        <tr>
          <td style="padding:10px 16px;border-top:1px solid #f1f5f9;color:#64748b;">Salary deduction (personal portion)</td>
          <td style="padding:10px 16px;border-top:1px solid #f1f5f9;text-align:right;font-weight:700;color:#dc2626;">AED ${deduction.toFixed(2)}</td>
        </tr>
      `
        : '';
    const followUpBlock = hasPersonalDeduction
        ? `
      <p style="margin:0 0 16px;">
        The personal portion shown above will be deducted from your salary for
        <strong>${escapeHtml(billMonthUpper)}</strong> in accordance with company policy.
      </p>
    `
        : `
      <p style="margin:0 0 16px;">
        No personal usage was recorded, so no salary recovery applies for this bill.
      </p>
    `;
    const body = emailShell('Approval Confirmation', `
      <p style="margin:0 0 16px;font-size:15px;">Dear <strong>${displayName}</strong>,</p>
      <p style="margin:0 0 16px;">
        This email confirms that your usage split for the
        <strong>${monthLabel}</strong> Etisalat bill has been recorded successfully.
      </p>
      ${billSummaryTable(row)}
      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <tr style="background:#f0fdf4;">
          <td colspan="2" style="padding:12px 16px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#166534;">
            Your approved split
          </td>
        </tr>
        <tr>
          <td style="padding:10px 16px;border-top:1px solid #f1f5f9;color:#64748b;">Official usage</td>
          <td style="padding:10px 16px;border-top:1px solid #f1f5f9;text-align:right;font-weight:600;">AED ${row.official_usage.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;border-top:1px solid #f1f5f9;color:#64748b;">Personal usage</td>
          <td style="padding:10px 16px;border-top:1px solid #f1f5f9;text-align:right;font-weight:600;">AED ${row.personal_usage.toFixed(2)}</td>
        </tr>
        ${deductionBlock}
      </table>
      ${followUpBlock}
      ${attachmentNotice()}
      <p style="margin:24px 0 0;">
        If you believe any detail is incorrect, please contact the HR department promptly.
      </p>
    `);
    return { subject, body };
}
//# sourceMappingURL=invoice-approval-email.template.js.map