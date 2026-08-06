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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const mail_config_1 = require("../config/mail.config");
const invoice_billing_util_1 = require("../invoice/invoice-billing.util");
const database_service_1 = require("../database/database.service");
const billing_report_service_1 = require("../billing/billing-report.service");
const invoice_email_template_1 = require("./invoice-email.template");
const invoice_approval_email_template_1 = require("./invoice-approval-email.template");
const remarks_util_1 = require("../common/remarks.util");
let NotificationService = NotificationService_1 = class NotificationService {
    db;
    billingReportService;
    logger = new common_1.Logger(NotificationService_1.name);
    constructor(db, billingReportService) {
        this.db = db;
        this.billingReportService = billingReportService;
    }
    formatSentAt(value) {
        const date = value instanceof Date ? value : new Date(value);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    async upsertEmailLog(simEmployeeId, month, intendedEmail, subject, html) {
        const billingMonth = `${month}-01`;
        const updated = await this.db.query(`UPDATE email_logs
       SET recipient_email = $3,
           subject = $4,
           body = $5,
           status = 'sent',
           sent_at = NOW()
       WHERE sim_employee_id = $1
         AND billing_month = $2::date`, [simEmployeeId, billingMonth, intendedEmail, subject, html]);
        if (!updated.rowCount) {
            try {
                await this.db.query(`INSERT INTO email_logs (sim_employee_id, billing_month, recipient_email, subject, body, status)
           VALUES ($1, $2::date, $3, $4, $5, 'sent')`, [simEmployeeId, billingMonth, intendedEmail, subject, html]);
            }
            catch (error) {
                const pgCode = error && typeof error === 'object' && 'code' in error
                    ? String(error.code)
                    : '';
                if (pgCode !== '23505') {
                    throw error;
                }
                await this.db.query(`UPDATE email_logs
           SET recipient_email = $3,
               subject = $4,
               body = $5,
               status = 'sent',
               sent_at = NOW()
           WHERE sim_employee_id = $1
             AND billing_month = $2::date`, [simEmployeeId, billingMonth, intendedEmail, subject, html]);
            }
        }
    }
    async getSentEmailRecord(simEmployeeId, month) {
        const result = await this.db.query(`SELECT sent_at, recipient_email
       FROM email_logs
       WHERE sim_employee_id = $1
         AND billing_month = $2::date
         AND status = 'sent'
       ORDER BY sent_at DESC
       LIMIT 1`, [simEmployeeId, `${month}-01`]);
        return result.rows[0] ?? null;
    }
    async resolveInvoicePdfAttachment(invoiceId) {
        const result = await this.db.query(`SELECT pdf_storage_path, pdf_filename, invoice_code
       FROM invoices WHERE id = $1`, [invoiceId]);
        const row = result.rows[0];
        const storagePath = row?.pdf_storage_path;
        if (!storagePath || !fs.existsSync(storagePath)) {
            return null;
        }
        const filename = row.pdf_filename?.trim() ||
            `${row.invoice_code || `invoice-${invoiceId}`}.pdf`;
        return {
            filename: filename.replace(/"/g, ''),
            path: storagePath,
            contentType: 'application/pdf',
        };
    }
    async withLatestRemarks(row, month) {
        const result = await this.db.query(`SELECT remarks, employee_remarks, admin_remarks
       FROM monthly_remarks
       WHERE sim_employee_id = $1 AND billing_month = $2::date`, [row.sim_employee_id, `${month}-01`]);
        const fromDb = result.rows[0];
        const remarks = (0, remarks_util_1.formatCombinedRemarks)(fromDb?.employee_remarks, fromDb?.admin_remarks, fromDb?.remarks || row.remarks);
        return { ...row, remarks };
    }
    async sendInvoiceRowEmail(row, month) {
        if (row.no_auto_mail) {
            return {
                simEmployeeId: row.sim_employee_id,
                success: false,
                skipped: true,
                error: 'No auto mail is enabled for this employee',
            };
        }
        const exceeded = Number(row.exceeded_amount ?? 0);
        if (exceeded <= 0) {
            return {
                simEmployeeId: row.sim_employee_id,
                success: false,
                skipped: true,
                error: 'No package excess — employee email not required',
            };
        }
        if (!row.email?.trim()) {
            return {
                simEmployeeId: row.sim_employee_id,
                success: false,
                error: 'No email address',
            };
        }
        const intendedEmail = row.email.trim();
        const existing = await this.getSentEmailRecord(row.sim_employee_id, month);
        if (existing) {
            const sentAt = existing.sent_at.toISOString();
            return {
                simEmployeeId: row.sim_employee_id,
                email: intendedEmail,
                success: false,
                alreadySent: true,
                sentAt,
                error: `Email already sent on ${this.formatSentAt(existing.sent_at)}`,
            };
        }
        const emailRow = await this.withLatestRemarks(row, month);
        const { subject, body } = (0, invoice_email_template_1.buildInvoiceEmail)(emailRow);
        const { deliverTo, isTestOverride } = (0, mail_config_1.resolveMailRecipient)(intendedEmail);
        const html = isTestOverride
            ? `${body}<p style="margin-top:1rem;font-size:12px;color:#666;text-align:center;">[Test mode — intended recipient: ${intendedEmail}]</p>`
            : body;
        const logoAttachment = (0, invoice_email_template_1.getEmailLogoAttachment)();
        const attachments = logoAttachment ? [logoAttachment] : [];
        const pdfAttachment = await this.resolveInvoicePdfAttachment(row.invoice_id);
        if (pdfAttachment) {
            attachments.push(pdfAttachment);
        }
        try {
            await (0, mail_config_1.sendMail)((0, mail_config_1.withEmployeeMailCc)({
                to: deliverTo,
                subject,
                html,
                attachments,
            }));
            const log = await this.db.query(`INSERT INTO email_logs (sim_employee_id, billing_month, recipient_email, subject, body, status)
         VALUES ($1, $2::date, $3, $4, $5, 'sent')
         RETURNING sent_at`, [row.sim_employee_id, `${month}-01`, intendedEmail, subject, html]);
            const sentAt = log.rows[0]?.sent_at?.toISOString() ?? new Date().toISOString();
            return {
                simEmployeeId: row.sim_employee_id,
                email: intendedEmail,
                deliveredTo: deliverTo,
                isTestOverride,
                success: true,
                sentAt,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Invoice email failed for employee ${row.sim_employee_id}: ${message}`);
            return {
                simEmployeeId: row.sim_employee_id,
                email: row.email.trim(),
                success: false,
                error: message,
            };
        }
    }
    async sendInvoiceBulkEmails(rows, month) {
        if (!month) {
            throw new common_1.BadRequestException('month is required (YYYY-MM)');
        }
        const results = [];
        for (const row of rows) {
            results.push(await this.sendInvoiceRowEmail(row, month));
        }
        return {
            month,
            sent: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
            skipped: results.filter((r) => r.alreadySent).length,
            results,
        };
    }
    buildEmailContent(row, monthLabel) {
        const phone = String(row.phone_number || '');
        const overage = Number(row.overage_amount || 0);
        const displayName = String(row.display_name || 'Employee');
        const remarks = overage > 0
            ? `Due to exceeding your package usage limit, an amount of AED ${overage.toFixed(2)} will be deducted from your salary.`
            : 'No overage charges apply for this billing period.';
        const subject = `e& SIM Invoice Notification — ${monthLabel}`;
        const body = `
      <p>Dear ${displayName},</p>
      <p>Your e& (Etisalat) invoice for <strong>${monthLabel}</strong> has been issued for your work mobile number <strong>${phone}</strong>.</p>
      <p><strong>Package Value:</strong> AED ${Number(row.package_value || 0).toFixed(2)}</p>
      <p><strong>Overage (Outside Package):</strong> AED ${overage.toFixed(2)}</p>
      <p><strong>Total Amount Due:</strong> AED ${Number(row.amount_due || 0).toFixed(2)}</p>
      <p>${remarks}</p>
      <p><strong>Remarks:</strong> ${String(row.remarks || remarks)}</p>
      <p>Regards,<br/>Neweast General Trading<br/>Human Resource Department</p>
      <p style="margin-top:16px;font-size:11px;color:#94a3b8;">
        This is an automated message. Please do not reply to this email — this mailbox is not monitored.
      </p>
    `;
        return { subject, body, remarks };
    }
    async sendMonthlyEmails(co, month) {
        const report = await this.billingReportService.getMonthlyReport(co, month);
        const monthLabel = new Date(`${month}-01`).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
        });
        const results = [];
        for (const row of report.rows) {
            if (!row.email) {
                results.push({
                    simEmployeeId: row.sim_employee_id,
                    success: false,
                    error: 'No email address',
                });
                continue;
            }
            if (!row.invoice_id) {
                results.push({
                    simEmployeeId: row.sim_employee_id,
                    success: false,
                    error: 'No invoice uploaded for this month',
                });
                continue;
            }
            if (row.no_auto_mail) {
                results.push({
                    simEmployeeId: row.sim_employee_id,
                    success: false,
                    skipped: true,
                    error: 'No auto mail is enabled for this employee',
                });
                continue;
            }
            const bill = Number(row.amount_due) || 0;
            const packageTotal = Number(row.total_amount) || Number(row.package_value) || 0;
            const exceeded = (0, invoice_billing_util_1.calculateExceededAmount)(bill, packageTotal);
            if (exceeded <= 0) {
                results.push({
                    simEmployeeId: row.sim_employee_id,
                    success: false,
                    skipped: true,
                    error: 'No package excess — employee email not required',
                });
                continue;
            }
            const existing = await this.getSentEmailRecord(row.sim_employee_id, month);
            if (existing) {
                results.push({
                    simEmployeeId: row.sim_employee_id,
                    email: row.email,
                    success: false,
                    alreadySent: true,
                    error: `Email already sent on ${this.formatSentAt(existing.sent_at)}`,
                });
                continue;
            }
            const { subject, body, remarks } = this.buildEmailContent(row, monthLabel);
            if (!row.remarks) {
                await this.billingReportService.updateRemark(co, row.sim_employee_id, month, remarks);
            }
            const intendedEmail = row.email.trim();
            const { deliverTo, isTestOverride } = (0, mail_config_1.resolveMailRecipient)(intendedEmail);
            const html = isTestOverride
                ? `${body}<p style="margin-top:1rem;font-size:12px;color:#666;text-align:center;">[Test mode — intended recipient: ${intendedEmail}]</p>`
                : body;
            try {
                await (0, mail_config_1.sendMail)((0, mail_config_1.withEmployeeMailCc)({
                    to: deliverTo,
                    subject,
                    html,
                }));
                await this.db.query(`INSERT INTO email_logs (sim_employee_id, billing_month, recipient_email, subject, body, status)
           VALUES ($1, $2::date, $3, $4, $5, 'sent')`, [row.sim_employee_id, `${month}-01`, intendedEmail, subject, html]);
                results.push({
                    simEmployeeId: row.sim_employee_id,
                    email: intendedEmail,
                    deliveredTo: deliverTo,
                    isTestOverride,
                    success: true,
                });
            }
            catch (error) {
                results.push({
                    simEmployeeId: row.sim_employee_id,
                    email: row.email,
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
        return {
            month,
            sent: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
            results,
        };
    }
    async sendSingleEmail(co, simEmployeeId, month) {
        if (!co) {
            throw new common_1.BadRequestException('co query parameter is required');
        }
        if (!month) {
            throw new common_1.BadRequestException('month is required (YYYY-MM)');
        }
        const billingMonth = `${month}-01`;
        const result = await this.db.query(`SELECT e.*,
        i.package_value AS inv_package,
        i.overage_amount,
        i.amount_due,
        i.id AS invoice_id,
        r.remarks
       FROM sim_employees e
       LEFT JOIN invoices i ON i.sim_employee_id = e.id AND i.billing_month = $2::date
       LEFT JOIN monthly_remarks r ON r.sim_employee_id = e.id AND r.billing_month = $2::date
       WHERE e.id = $1 AND e.co = $3`, [simEmployeeId, billingMonth, co]);
        const row = result.rows[0];
        if (!row) {
            throw new common_1.BadRequestException('Employee not found for this company');
        }
        if (row.no_auto_mail) {
            throw new common_1.BadRequestException('No auto mail is enabled for this employee');
        }
        if (!row.email) {
            throw new common_1.BadRequestException('Employee has no email');
        }
        if (!row.invoice_id) {
            throw new common_1.BadRequestException('No invoice for this month');
        }
        const bill = Number(row.amount_due) || 0;
        const packageTotal = Number(row.total_amount) || Number(row.inv_package) || Number(row.package_value) || 0;
        const exceeded = (0, invoice_billing_util_1.calculateExceededAmount)(bill, packageTotal);
        if (exceeded <= 0) {
            throw new common_1.BadRequestException('No package excess — employee email not required');
        }
        const existing = await this.getSentEmailRecord(simEmployeeId, month);
        if (existing) {
            throw new common_1.BadRequestException(`Email already sent on ${this.formatSentAt(existing.sent_at)}`);
        }
        const monthLabel = new Date(`${month}-01`).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
        });
        const mergedRow = {
            ...row,
            package_value: row.inv_package ?? row.package_value,
        };
        const { subject, body, remarks } = this.buildEmailContent(mergedRow, monthLabel);
        if (!row.remarks) {
            await this.billingReportService.updateRemark(co, simEmployeeId, month, remarks);
        }
        const intendedEmail = String(row.email).trim();
        const { deliverTo, isTestOverride } = (0, mail_config_1.resolveMailRecipient)(intendedEmail);
        const html = isTestOverride
            ? `${body}<p style="margin-top:1rem;font-size:12px;color:#666;text-align:center;">[Test mode — intended recipient: ${intendedEmail}]</p>`
            : body;
        await (0, mail_config_1.sendMail)((0, mail_config_1.withEmployeeMailCc)({
            to: deliverTo,
            subject,
            html,
        }));
        await this.db.query(`INSERT INTO email_logs (sim_employee_id, billing_month, recipient_email, subject, body, status)
       VALUES ($1, $2::date, $3, $4, $5, 'sent')`, [simEmployeeId, billingMonth, intendedEmail, subject, html]);
        return {
            success: true,
            email: intendedEmail,
            deliveredTo: deliverTo,
            isTestOverride,
        };
    }
    getIntranetBaseUrl() {
        return (process.env.INTRANET_URL?.replace(/\/$/, '') ||
            'https://intranet.neweast.cloud');
    }
    getFolderBaseUrl() {
        const raw = (process.env.EBILLING_PUBLIC_URL ||
            process.env.CLIENT_URL ||
            'https://ebilling.neweast.cloud').replace(/\/$/, '');
        return raw.replace(/\/login$/, '');
    }
    buildFolderLink(token) {
        return `${this.getFolderBaseUrl()}/folder/${token}`;
    }
    async buildApprovalAttachments(invoiceId, requirePdf = true) {
        const attachments = [];
        const logoAttachment = (0, invoice_email_template_1.getEmailLogoAttachment)();
        if (logoAttachment) {
            attachments.push(logoAttachment);
        }
        const pdfAttachment = await this.resolveInvoicePdfAttachment(invoiceId);
        if (pdfAttachment) {
            attachments.push(pdfAttachment);
        }
        else if (requirePdf) {
            throw new common_1.BadRequestException('Invoice PDF attachment not found. Please re-upload the e& bill PDF before sending for approval.');
        }
        return attachments;
    }
    async sendApprovalRequestEmail(row) {
        if (!row.email?.trim()) {
            throw new common_1.BadRequestException('Employee has no email address');
        }
        const intendedEmail = row.email.trim();
        const { subject, body } = (0, invoice_approval_email_template_1.buildApprovalRequestEmail)({
            display_name: row.display_name,
            phone_number: row.phone_number,
            month: row.month,
            invoice_code: row.invoice_code,
            invoice_total: row.invoice_total,
            package_total: row.package_total,
            exceeded_amount: row.exceeded_amount,
            due_date: row.due_date,
        }, this.getIntranetBaseUrl());
        const { deliverTo, isTestOverride } = (0, mail_config_1.resolveMailRecipient)(intendedEmail);
        const html = isTestOverride
            ? `${body}<p style="margin-top:1rem;font-size:12px;color:#666;text-align:center;">[Test mode — intended recipient: ${intendedEmail}]</p>`
            : body;
        const attachments = await this.buildApprovalAttachments(row.invoice_id, true);
        await (0, mail_config_1.sendMail)((0, mail_config_1.withEmployeeMailCc)({
            to: deliverTo,
            subject,
            html,
            attachments,
        }));
        try {
            await this.upsertEmailLog(row.sim_employee_id, row.month, intendedEmail, subject, html);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Approval request email sent but log write failed for employee ${row.sim_employee_id}: ${message}`);
        }
        return { success: true, email: intendedEmail, deliveredTo: deliverTo };
    }
    async sendFolderApprovalRequestEmail(row, token) {
        if (!row.email?.trim()) {
            throw new common_1.BadRequestException('Employee has no email address');
        }
        const intendedEmail = row.email.trim();
        const folderUrl = this.buildFolderLink(token);
        const { subject, body } = (0, invoice_approval_email_template_1.buildFolderApprovalRequestEmail)({
            display_name: row.display_name,
            phone_number: row.phone_number,
            month: row.month,
            invoice_code: row.invoice_code,
            invoice_total: row.invoice_total,
            package_total: row.package_total,
            exceeded_amount: row.exceeded_amount,
            due_date: row.due_date,
        }, folderUrl);
        const { deliverTo, isTestOverride } = (0, mail_config_1.resolveMailRecipient)(intendedEmail);
        const html = isTestOverride
            ? `${body}<p style="margin-top:1rem;font-size:12px;color:#666;text-align:center;">[Test mode — intended recipient: ${intendedEmail}]</p>`
            : body;
        const attachments = await this.buildApprovalAttachments(row.invoice_id, true);
        await (0, mail_config_1.sendMail)((0, mail_config_1.withEmployeeMailCc)({
            to: deliverTo,
            subject,
            html,
            attachments,
        }));
        try {
            await this.upsertEmailLog(row.sim_employee_id, row.month, intendedEmail, subject, html);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Folder approval email sent but log write failed for employee ${row.sim_employee_id}: ${message}`);
        }
        return { success: true, email: intendedEmail, deliveredTo: deliverTo, folderUrl };
    }
    async sendApprovalConfirmationEmail(row) {
        if (!row.email?.trim()) {
            throw new common_1.BadRequestException('Employee has no email address');
        }
        const intendedEmail = row.email.trim();
        const { subject, body } = (0, invoice_approval_email_template_1.buildApprovalConfirmationEmail)({
            display_name: row.display_name,
            phone_number: row.phone_number,
            month: row.month,
            invoice_code: row.invoice_code,
            invoice_total: row.invoice_total,
            package_total: row.package_total,
            exceeded_amount: row.exceeded_amount,
            personal_usage: row.personal_usage ?? 0,
            official_usage: row.official_usage ?? 0,
        });
        const { deliverTo, isTestOverride } = (0, mail_config_1.resolveMailRecipient)(intendedEmail);
        const html = isTestOverride
            ? `${body}<p style="margin-top:1rem;font-size:12px;color:#666;text-align:center;">[Test mode — intended recipient: ${intendedEmail}]</p>`
            : body;
        const attachments = await this.buildApprovalAttachments(row.invoice_id, true);
        await (0, mail_config_1.sendMail)((0, mail_config_1.withEmployeeMailCc)({
            to: deliverTo,
            subject,
            html,
            attachments,
        }));
        try {
            await this.upsertEmailLog(row.sim_employee_id, row.month, intendedEmail, subject, html);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Approval confirmation email sent but log write failed for employee ${row.sim_employee_id}: ${message}`);
        }
        return { success: true, email: intendedEmail, deliveredTo: deliverTo };
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        billing_report_service_1.BillingReportService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map