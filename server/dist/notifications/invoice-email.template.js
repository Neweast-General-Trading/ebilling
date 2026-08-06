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
exports.buildInvoiceEmail = buildInvoiceEmail;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
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
function buildInvoiceEmail(row) {
    const displayName = escapeHtml(row.display_name?.trim() || 'Employee');
    const phone = escapeHtml(row.phone_number);
    const excess = row.excess ?? 0;
    const monthLabel = escapeHtml(row.month_label);
    const hasLogo = fs.existsSync(exports.NEWEAST_LOGO_PATH);
    const subject = `e& SIM Invoice Notification — ${row.month_label}`;
    let excessParagraph;
    if (excess > 0) {
        excessParagraph = `An amount of <strong>AED ${excess.toFixed(2)}</strong> will be deducted from your salary due to excess usage above your package allowance.`;
    }
    else if (excess < 0) {
        excessParagraph = `No excess deduction applies for this billing period (calculated difference: AED ${excess.toFixed(2)}).`;
    }
    else {
        excessParagraph = 'No excess deduction applies for this billing period.';
    }
    const personalUsage = row.personal_usage === null
        ? '—'
        : `AED ${row.personal_usage.toFixed(2)}`;
    const remarksText = row.remarks?.trim() ?? '';
    const remarksBlock = remarksText
        ? `<div style="margin:16px 0 0;padding:14px 16px;border-radius:8px;border:1px solid #fde68a;background:#fffbeb;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#92400e;">Remarks</p>
          <p style="margin:0;font-size:14px;color:#78350f;line-height:1.6;">${escapeHtml(remarksText).replace(/\n/g, '<br/>')}</p>
        </div>`
        : '';
    const logoBlock = hasLogo
        ? `<img src="cid:${exports.NEWEAST_LOGO_CID}" alt="Neweast General Trading" style="max-width:260px;width:100%;height:auto;display:block;margin:0 auto 12px;" />`
        : '';
    const body = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.65;color:#111;max-width:640px;margin:0 auto;">
      <div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <div style="background:#0f172a;padding:20px 24px;text-align:center;">
          ${logoBlock}
          <p style="margin:0;color:#f8fafc;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;">e&amp; SIM Billing</p>
        </div>
        <div style="padding:24px;background:#ffffff;">
          <p style="margin:0 0 16px;">Dear <strong>${displayName}</strong>,</p>
          <p style="margin:0 0 16px;">
            Your monthly e&amp; (Etisalat) invoice for <strong>${monthLabel}</strong>
            has been issued for your company mobile number <strong>${phone}</strong>.
          </p>
          <table style="width:100%;border-collapse:collapse;margin:0 0 16px;font-size:14px;">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#64748b;">Package value</td>
              <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;">AED ${row.package_total.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#64748b;">Invoice total</td>
              <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;">AED ${row.invoice_total.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#64748b;">Personal usage</td>
              <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;">${personalUsage}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#64748b;">Excess</td>
              <td style="padding:8px 0;text-align:right;font-weight:700;color:${excess > 0 ? '#b91c1c' : '#111'};">AED ${excess.toFixed(2)}</td>
            </tr>
          </table>
          <p style="margin:0 0 16px;">${excessParagraph}</p>
          ${remarksBlock}
          <p style="margin:16px 0 0;font-size:13px;color:#64748b;line-height:1.6;">
            Your e&amp; bill PDF is attached to this email — please open the attachment to review the full invoice details.
          </p>
        </div>
        <div style="padding:20px 24px;background:#f8fafc;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;font-weight:700;color:#0f172a;">Neweast General Trading</p>
          <p style="margin:4px 0 0;color:#475569;">Human Resource Department</p>
          <p style="margin:14px 0 0;font-size:11px;color:#94a3b8;line-height:1.5;">
            This is an automated message. Please do not reply to this email — this mailbox is not monitored.
          </p>
        </div>
      </div>
    </div>
  `.trim();
    return { subject, body };
}
//# sourceMappingURL=invoice-email.template.js.map