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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var InvoiceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const database_service_1 = require("../database/database.service");
const etisalat_pdf_parser_1 = require("./etisalat-pdf.parser");
const claude_invoice_parser_1 = require("./claude-invoice.parser");
const invoice_billing_util_1 = require("./invoice-billing.util");
const notification_service_1 = require("../notifications/notification.service");
const invoice_call_service_1 = require("./invoice-call.service");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const ebilling_admin_access_1 = require("../common/ebilling-admin-access");
const sim_master_service_1 = require("../sim-master/sim-master.service");
const ebilling_admin_access_2 = require("../common/ebilling-admin-access");
const oracle_recovery_service_1 = require("../oracle/oracle-recovery.service");
const remarks_util_1 = require("../common/remarks.util");
const employee_email_util_1 = require("../common/employee-email.util");
const excess_approval_service_1 = require("./excess-approval.service");
const crypto_1 = require("crypto");
const FOLDER_TOKEN_TTL_DAYS = 30;
function roundApprovalAmount(value) {
    return Math.round(value * 100) / 100;
}
function normalizeOptionalRemarks(value) {
    const trimmed = value?.trim();
    return trimmed || null;
}
let InvoiceService = InvoiceService_1 = class InvoiceService {
    db;
    claudeParser;
    invoiceCalls;
    auditLog;
    simMaster;
    notifications;
    oracleRecovery;
    excessApproval;
    logger = new common_1.Logger(InvoiceService_1.name);
    constructor(db, claudeParser, invoiceCalls, auditLog, simMaster, notifications, oracleRecovery, excessApproval) {
        this.db = db;
        this.claudeParser = claudeParser;
        this.invoiceCalls = invoiceCalls;
        this.auditLog = auditLog;
        this.simMaster = simMaster;
        this.notifications = notifications;
        this.oracleRecovery = oracleRecovery;
        this.excessApproval = excessApproval;
    }
    summarizeParsed(parsed) {
        return {
            phoneNumber: parsed.phoneNumber,
            packageValue: parsed.packageValue,
            overageAmount: parsed.overageAmount,
            amountDue: parsed.amountDue,
            billingMonth: parsed.billingMonth,
            dueDate: parsed.dueDate || null,
            invoiceCode: parsed.invoiceCode || null,
        };
    }
    async savePendingUpload(co, file, parsed, actor) {
        const result = await this.db.query(`INSERT INTO invoice_pending_uploads (
        co, phone_number, pdf_filename, pdf_storage_path, parsed,
        created_by_email, created_by_name
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id`, [
            co,
            parsed.phoneNumber,
            file.originalname,
            file.path,
            JSON.stringify(this.summarizeParsed(parsed)),
            actor?.email || null,
            actor?.name || null,
        ]);
        return result.rows[0].id;
    }
    async getPendingUpload(co, token) {
        const result = await this.db.query(`SELECT *
       FROM invoice_pending_uploads
       WHERE id = $1 AND co = $2 AND status = 'pending'
       LIMIT 1`, [token, co]);
        if (!result.rows[0]) {
            throw new common_1.NotFoundException('Pending invoice upload not found or already handled');
        }
        return result.rows[0];
    }
    async insertInvoiceFromParsed(co, simEmployeeId, file, parsed, actor) {
        const monthLabel = (0, invoice_billing_util_1.formatBillingMonthLabel)(String(parsed.billingMonth).slice(0, 7));
        const existingByMonth = await this.db.query(`SELECT id
       FROM invoices
       WHERE sim_employee_id = $1 AND billing_month = $2::date
       LIMIT 1`, [simEmployeeId, parsed.billingMonth]);
        if (existingByMonth.rows[0]) {
            throw new common_1.ConflictException(`Invoice already uploaded for ${parsed.phoneNumber} (${monthLabel}). This file cannot be used again.`);
        }
        if (parsed.invoiceCode) {
            const existingByCode = await this.db.query(`SELECT i.id
         FROM invoices i
         INNER JOIN sim_employees e ON e.id = i.sim_employee_id
         WHERE e.co = $1 AND i.invoice_code = $2
         LIMIT 1`, [co, parsed.invoiceCode]);
            if (existingByCode.rows[0]) {
                throw new common_1.ConflictException(`Invoice ${parsed.invoiceCode} was already uploaded. This file cannot be used again.`);
            }
        }
        const employeePackage = await this.db.query(`SELECT COALESCE(total_amount, package_value, 0) AS package_total
       FROM sim_employees WHERE id = $1`, [simEmployeeId]);
        const packageTotal = Number(employeePackage.rows[0]?.package_total) || 0;
        const invoiceTotal = Number(parsed.amountDue) || 0;
        const approvalStatus = (0, invoice_billing_util_1.resolveApprovalStatusOnUpload)(invoiceTotal, packageTotal);
        const insert = await this.db.query(`INSERT INTO invoices (
        sim_employee_id, phone_number, package_value, overage_amount,
        amount_due, billing_month, due_date, invoice_code, pdf_filename, pdf_storage_path,
        raw_extracted, parser_source, uploaded_by_email, uploaded_by_name, uploaded_at,
        personal_usage, official_usage, approval_status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),0,0,$15)
      RETURNING *`, [
            simEmployeeId,
            parsed.phoneNumber,
            parsed.packageValue,
            parsed.overageAmount,
            parsed.amountDue,
            parsed.billingMonth,
            parsed.dueDate || null,
            parsed.invoiceCode || null,
            file.originalname,
            file.path,
            JSON.stringify({
                invoiceCode: parsed.invoiceCode || null,
                source: 'pending_upload',
            }),
            parsed.parserSource || 'regex',
            actor?.email || null,
            actor?.name || null,
            approvalStatus,
        ]);
        try {
            await this.invoiceCalls.parseInvoiceById(co, insert.rows[0].id);
        }
        catch (error) {
            this.logger.warn(`Call detail parse skipped for invoice ${insert.rows[0].id}: ${error instanceof Error ? error.message : String(error)}`);
        }
        await this.auditLog.log({
            co,
            actorEmail: actor?.email || 'unknown',
            actorName: actor?.name,
            action: 'invoice.upload',
            entityType: 'invoice',
            entityId: insert.rows[0].id,
            summary: `Uploaded invoice for ${parsed.phoneNumber} (${monthLabel})`,
            details: {
                filename: file.originalname,
                phoneNumber: parsed.phoneNumber,
                month: monthLabel,
                invoiceCode: parsed.invoiceCode || null,
                amountDue: parsed.amountDue,
                source: 'pending_registration',
            },
        });
        try {
            await this.carryForwardDeferredApprovals(co, simEmployeeId, insert.rows[0].id, parsed.billingMonth);
        }
        catch (error) {
            this.logger.warn(`Carry-forward skipped for invoice ${insert.rows[0].id}: ${error instanceof Error ? error.message : String(error)}`);
        }
        return {
            invoice: insert.rows[0],
            parsed,
            monthLabel,
        };
    }
    async carryForwardDeferredApprovals(co, simEmployeeId, newInvoiceId, newBillingMonth) {
        const { rows: pending } = await this.db.query(`SELECT ear.id AS request_id,
              ear.invoice_id,
              ear.personal_usage,
              ear.official_usage,
              ear.employee_remarks,
              to_char(i.billing_month, 'YYYY-MM') AS month_key,
              i.invoice_code
       FROM excess_approval_requests ear
       INNER JOIN invoices i ON i.id = ear.invoice_id
       WHERE ear.co = $1
         AND i.sim_employee_id = $2
         AND ear.status = 'pending'
         AND COALESCE(ear.personal_usage, 0) > 0
         AND i.billing_month < $3::date
       ORDER BY i.billing_month ASC`, [co, simEmployeeId, newBillingMonth]);
        if (!pending.length) {
            return null;
        }
        const carriedPersonal = pending.reduce((sum, row) => sum + (Number(row.personal_usage) || 0), 0);
        const carriedOfficial = pending.reduce((sum, row) => sum + (Number(row.official_usage) || 0), 0);
        const noteParts = pending.map((row) => `${row.month_key || 'prior'} (${row.invoice_code || ('#' + row.invoice_id)}): personal AED ${Number(row.personal_usage || 0).toFixed(2)}`);
        const carryNote = `Carried from prior month(s) — pending approval was not processed before the monthly cut-off (freeze from 18th 00:00 Dubai). ${noteParts.join('; ')}. These amounts are added to this invoice for the next approval cycle.`;
        await this.db.query(`UPDATE invoices
       SET personal_usage = COALESCE(personal_usage, 0) + $1,
           official_usage = COALESCE(official_usage, 0) + $2
       WHERE id = $3`, [carriedPersonal, carriedOfficial, newInvoiceId]);
        try {
            await this.db.query(`INSERT INTO monthly_remarks (sim_employee_id, billing_month, employee_remarks, remarks, updated_at)
         VALUES ($1, $2::date, $3, $3, NOW())
         ON CONFLICT (sim_employee_id, billing_month) DO UPDATE SET
           employee_remarks = CASE
             WHEN monthly_remarks.employee_remarks IS NULL OR TRIM(monthly_remarks.employee_remarks) = '' THEN EXCLUDED.employee_remarks
             ELSE monthly_remarks.employee_remarks || E'\\n' || EXCLUDED.employee_remarks
           END,
           remarks = CASE
             WHEN monthly_remarks.remarks IS NULL OR TRIM(monthly_remarks.remarks) = '' THEN EXCLUDED.remarks
             ELSE monthly_remarks.remarks || E'\\n' || EXCLUDED.remarks
           END,
           updated_at = NOW()`, [simEmployeeId, newBillingMonth, carryNote]);
        }
        catch (error) {
            this.logger.warn(`Could not write carry-forward remark: ${error instanceof Error ? error.message : String(error)}`);
        }
        const requestIds = pending.map((row) => Number(row.request_id));
        const invoiceIds = pending.map((row) => Number(row.invoice_id));
        await this.db.query(`UPDATE excess_approval_requests
       SET status = 'deferred',
           reject_reason = $2,
           rejected_by = 'system',
           rejected_at = NOW(),
           completed_at = NOW()
       WHERE id = ANY($1::int[])`, [requestIds, `Deferred to next billing cycle (invoice #${newInvoiceId}). Not processed before monthly cut-off (freeze from 18th 00:00 Dubai).`]);
        await this.db.query(`UPDATE invoices
       SET approval_status = 'deferred_to_next_month'
       WHERE id = ANY($1::int[])`, [invoiceIds]);
        this.logger.log(`Carried ${pending.length} deferred approval(s) onto invoice ${newInvoiceId}: personal=${carriedPersonal}`);
        return { carriedPersonal, carriedOfficial, fromRequestIds: requestIds };
    }
    getPublicBaseUrl() {
        const raw = (process.env.EBILLING_PUBLIC_URL ||
            process.env.CLIENT_URL ||
            'https://ebilling.neweast.cloud').replace(/\/$/, '');
        return raw.replace(/\/login$/, '');
    }
    buildFolderUrl(token) {
        return `${this.getPublicBaseUrl()}/folder/${token}`;
    }
    async getGridRowByInvoiceId(co, invoiceId) {
        const meta = await this.db.query(`SELECT to_char(i.billing_month, 'YYYY-MM') AS month_key
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE i.id = $1 AND e.co = $2`, [invoiceId, co]);
        const month = meta.rows[0]?.month_key;
        if (!month) {
            return null;
        }
        const idKey = String(invoiceId);
        return (await this.getGridByMonth(co, month)).rows.find((row) => String(row.invoice_id) === idKey) ?? null;
    }
    async autoProcessAfterUpload(co, invoiceId, actor) {
        const gridRow = await this.getGridRowByInvoiceId(co, invoiceId);
        if (!gridRow) {
            return { processed: false, reason: 'row_not_found' };
        }
        const exceeded = gridRow.exceeded_amount ?? 0;
        const skipAutoMail = Boolean(gridRow.no_auto_mail);
        if (exceeded <= 0) {
            await this.db.query(`UPDATE invoices
         SET approval_status = 'confirmed_by_user',
             approval_submitted_at = COALESCE(approval_submitted_at, NOW())
         WHERE id = $1`, [invoiceId]);
            return {
                processed: true,
                status: 'confirmed_by_user',
                emailSent: false,
                reason: 'no_excess',
            };
        }
        const hasSapCode = Boolean(String(gridRow.person_number || '').trim());
        if (!hasSapCode) {
            await this.db.query(`UPDATE invoices
         SET approval_status = 'ready_for_recovery',
             personal_usage = $1,
             official_usage = 0,
             approval_submitted_at = NOW(),
             recovery_status = 'pending',
             approval_email_count = 0
         WHERE id = $2`, [exceeded, invoiceId]);
            await this.auditLog.log({
                co,
                actorEmail: actor?.email || 'system',
                actorName: actor?.name,
                action: 'invoice.auto_ready_for_recovery',
                entityType: 'invoice',
                entityId: invoiceId,
                summary: `No SAP person number — marked ready for recovery for ${gridRow.phone_number}`,
                details: {
                    month: gridRow.month,
                    exceededAmount: exceeded,
                },
            });
            return {
                processed: true,
                status: 'ready_for_recovery',
                skippedApproval: true,
                reason: 'no_sap_code',
            };
        }
        const token = (0, crypto_1.randomUUID)();
        await this.db.query(`UPDATE invoices
       SET approval_token = $1,
           approval_status = 'pending_approval',
           approval_sent_at = ${skipAutoMail ? 'NULL' : 'NOW()'},
           approval_email_count = ${skipAutoMail ? '0' : '1'},
           approval_token_expires_at = NOW() + INTERVAL '${FOLDER_TOKEN_TTL_DAYS} days'
       WHERE id = $2`, [token, invoiceId]);
        const refreshed = await this.getGridRowByInvoiceId(co, invoiceId);
        if (!refreshed) {
            return { processed: false, reason: 'row_not_found_after_update' };
        }
        if (skipAutoMail) {
            return {
                processed: true,
                status: 'pending_approval',
                emailSent: false,
                reason: 'no_auto_mail',
            };
        }
        try {
            await this.notifications.sendFolderApprovalRequestEmail(refreshed, token);
        }
        catch (error) {
            this.logger.warn(`Folder approval email failed for invoice ${invoiceId}: ${error instanceof Error ? error.message : String(error)}`);
            return {
                processed: true,
                status: 'pending_approval',
                emailSent: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
        await this.auditLog.log({
            co,
            actorEmail: actor?.email || 'system',
            actorName: actor?.name,
            action: 'invoice.auto_approval_request',
            entityType: 'invoice',
            entityId: invoiceId,
            summary: `Auto-sent folder approval for ${refreshed.phone_number}`,
            details: {
                month: refreshed.month,
                exceededAmount: exceeded,
                folderUrl: this.buildFolderUrl(token),
            },
        });
        return {
            processed: true,
            status: 'pending_approval',
            emailSent: true,
            folderUrl: this.buildFolderUrl(token),
        };
    }
    async getFolderInvoiceByToken(token) {
        const result = await this.db.query(`SELECT i.id AS invoice_id, e.co, i.approval_token_expires_at
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE i.approval_token = $1
       LIMIT 1`, [token]);
        const row = result.rows[0];
        if (!row) {
            throw new common_1.NotFoundException('Approval link not found or expired');
        }
        if (row.approval_token_expires_at &&
            new Date(row.approval_token_expires_at).getTime() < Date.now()) {
            throw new common_1.NotFoundException('Approval link not found or expired');
        }
        const gridRow = await this.getGridRowByInvoiceId(String(row.co), Number(row.invoice_id));
        if (!gridRow) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        return {
            token,
            invoice: gridRow,
            canSubmit: ['pending_approval', 'waiting_confirmation', 'excess_rejected'].includes(gridRow.approval_status),
            alreadySubmitted: ['ready_for_recovery', 'confirmed_by_user', 'recovery_sent', 'pending_excess_approval'].includes(gridRow.approval_status),
            rejectReason: gridRow.excess_reject_reason || null,
            rejectedBy: gridRow.excess_rejected_by || null,
        };
    }
    async submitFolderApproval(token, dto) {
        const preview = await this.getFolderInvoiceByToken(token);
        const employeeRemarks = normalizeOptionalRemarks(dto.remarks);
        if (!preview.canSubmit) {
            if (employeeRemarks && !preview.invoice.employee_remarks) {
                const co = await this.db.query(`SELECT e.co
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE i.approval_token = $1`, [token]);
                const company = co.rows[0]?.co;
                if (!company) {
                    throw new common_1.NotFoundException('Invoice not found');
                }
                await this.saveEmployeeRemarks(preview.invoice.sim_employee_id, preview.invoice.month, employeeRemarks);
                const gridRow = await this.getGridRowByInvoiceId(String(company), preview.invoice.invoice_id);
                if (!gridRow) {
                    throw new common_1.NotFoundException('Invoice row not found after update');
                }
                return { row: gridRow, message: 'Remarks saved successfully' };
            }
            throw new common_1.BadRequestException('This invoice was already approved');
        }
        const co = await this.db.query(`SELECT e.co
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE i.approval_token = $1`, [token]);
        const company = co.rows[0]?.co;
        if (!company) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        const invoiceId = preview.invoice.invoice_id;
        const invoiceTotal = preview.invoice.invoice_total;
        const packageTotal = preview.invoice.package_total;
        const exceededAmount = (0, invoice_billing_util_1.calculateExceededAmount)(invoiceTotal, packageTotal);
        const officialUsage = roundApprovalAmount(dto.officialUsage);
        const personalUsage = roundApprovalAmount(dto.personalUsage);
        const splitTotal = roundApprovalAmount(officialUsage + personalUsage);
        if (Math.abs(splitTotal - exceededAmount) > 0.01) {
            throw new common_1.BadRequestException(`Official + personal must equal the exceeded amount (AED ${exceededAmount.toFixed(2)})`);
        }
        const approvalStatus = (0, invoice_billing_util_1.resolveApprovalStatusAfterSubmit)(personalUsage);
        const useMatrix = exceededAmount > 0 && (await this.excessApproval.hasConfiguredMatrix(String(company)));
        const nextStatus = useMatrix ? 'pending_excess_approval' : approvalStatus;
        const updateResult = await this.db.query(`UPDATE invoices
       SET personal_usage = $1,
           official_usage = $2,
           approval_status = $3::varchar,
           approval_submitted_at = NOW(),
           approval_token = NULL,
           approval_token_expires_at = NULL,
           recovery_status = CASE
             WHEN $3::text = 'ready_for_recovery' THEN 'pending'
             ELSE recovery_status
           END,
           recovery_last_error = CASE
             WHEN $3::text = 'ready_for_recovery' THEN NULL
             ELSE recovery_last_error
           END
       WHERE id = $4
         AND approval_status IN ('pending_approval', 'waiting_confirmation', 'excess_rejected')`, [personalUsage, officialUsage, nextStatus, invoiceId]);
        if (!updateResult.rowCount) {
            throw new common_1.BadRequestException('This invoice was already approved');
        }
        await this.ensureInvoiceRejectColumns();
        await this.db.query(`UPDATE invoices
       SET excess_reject_reason = NULL, excess_rejected_by = NULL, excess_rejected_at = NULL
       WHERE id = $1`, [invoiceId]);
        await this.saveEmployeeRemarks(preview.invoice.sim_employee_id, preview.invoice.month, dto.remarks);
        const gridRow = await this.getGridRowByInvoiceId(String(company), invoiceId);
        if (!gridRow) {
            throw new common_1.NotFoundException('Invoice row not found after update');
        }
        if (useMatrix) {
            await this.excessApproval.startWorkflow(String(company), invoiceId, officialUsage, personalUsage, normalizeOptionalRemarks(dto.remarks), gridRow);
        }
        if (!useMatrix) {
            await this.notifications.sendApprovalConfirmationEmail(gridRow);
        }
        await this.auditLog.log({
            co: String(company),
            actorEmail: gridRow.email || 'employee',
            actorName: gridRow.display_name,
            action: useMatrix ? 'invoice.excess_sent_for_approval' : 'invoice.folder_approval_submit',
            entityType: 'invoice',
            entityId: invoiceId,
            summary: useMatrix
                ? `Excess sent for matrix approval for ${gridRow.phone_number}`
                : `Folder approval submitted for ${gridRow.phone_number}`,
            details: {
                month: gridRow.month,
                officialUsage,
                personalUsage,
                exceededAmount,
                useMatrix,
            },
        });
        return {
            row: gridRow,
            message: useMatrix
                ? 'Your excess split was sent for approval. Approvers will be notified in order.'
                : 'Approval submitted successfully',
        };
    }
    async uploadInvoice(co, file, actor) {
        const buffer = fs.readFileSync(file.path);
        const parsed = await this.claudeParser.parseWithFallback(buffer, () => (0, etisalat_pdf_parser_1.parseEtisalatPdfBuffer)(buffer));
        if (!parsed.phoneNumber) {
            throw new common_1.BadRequestException('Could not detect phone number from PDF');
        }
        const employeeResult = await this.db.query(`SELECT id FROM sim_employees WHERE co = $1 AND phone_number = $2 AND is_active = TRUE LIMIT 1`, [co, parsed.phoneNumber]);
        const simEmployeeId = employeeResult.rows[0]?.id ?? null;
        if (!simEmployeeId) {
            const pendingToken = await this.savePendingUpload(co, file, parsed, actor);
            const monthLabel = (0, invoice_billing_util_1.formatBillingMonthLabel)(String(parsed.billingMonth).slice(0, 7));
            return {
                status: 'unknown_phone',
                pendingToken,
                phoneNumber: parsed.phoneNumber,
                filename: file.originalname,
                monthLabel,
                parsed: this.summarizeParsed(parsed),
            };
        }
        const result = await this.insertInvoiceFromParsed(co, simEmployeeId, file, parsed, actor);
        const auto = await this.autoProcessAfterUpload(co, result.invoice.id, actor);
        return {
            status: 'success',
            invoice: result.invoice,
            parsed: result.parsed,
            autoProcess: auto,
        };
    }
    async registerPendingUpload(co, token, dto, actor) {
        const pending = await this.getPendingUpload(co, token);
        const parsedSummary = pending.parsed;
        const parsed = {
            phoneNumber: pending.phone_number,
            packageValue: Number(parsedSummary.packageValue) || 0,
            overageAmount: Number(parsedSummary.overageAmount) || 0,
            amountDue: Number(parsedSummary.amountDue) || 0,
            billingMonth: String(parsedSummary.billingMonth),
            dueDate: parsedSummary.dueDate || null,
            invoiceCode: parsedSummary.invoiceCode || null,
            parserSource: 'regex',
            rawText: '',
        };
        const employee = await this.simMaster.createEmployee(co, {
            personNumber: dto.personNumber,
            phoneNumber: pending.phone_number,
            displayName: dto.displayName,
            email: dto.email,
            lineType: dto.lineType || 'mobile',
            packageLimit: dto.packageLimit,
            additionalAmount: dto.additionalAmount,
        });
        await this.auditLog.log({
            co,
            actorEmail: actor?.email || 'unknown',
            actorName: actor?.name,
            action: 'master.create',
            entityType: 'sim_employee',
            entityId: employee.id,
            summary: `Created SIM master record for ${pending.phone_number} during invoice upload`,
            details: {
                personNumber: dto.personNumber,
                displayName: dto.displayName,
                source: 'invoice_pending_registration',
                pendingToken: token,
            },
        });
        const result = await this.insertInvoiceFromParsed(co, employee.id, {
            originalname: pending.pdf_filename,
            path: pending.pdf_storage_path,
        }, parsed, actor);
        await this.db.query(`UPDATE invoice_pending_uploads
       SET status = 'registered',
           resolved_at = NOW(),
           resolved_invoice_id = $1
       WHERE id = $2`, [result.invoice.id, token]);
        const auto = await this.autoProcessAfterUpload(co, result.invoice.id, actor);
        return {
            status: 'success',
            invoice: result.invoice,
            parsed: result.parsed,
            employee,
            autoProcess: auto,
        };
    }
    async archivePendingUpload(co, token, actor) {
        const pending = await this.getPendingUpload(co, token);
        const parsedSummary = pending.parsed;
        const monthLabel = (0, invoice_billing_util_1.formatBillingMonthLabel)(String(parsedSummary.billingMonth || '').slice(0, 7));
        await this.db.query(`UPDATE invoice_pending_uploads
       SET status = 'archived', resolved_at = NOW()
       WHERE id = $1`, [token]);
        await this.auditLog.log({
            co,
            actorEmail: actor?.email || 'unknown',
            actorName: actor?.name,
            action: 'invoice.upload_skipped',
            entityType: 'invoice_pending',
            entityId: token,
            summary: `Invoice uploaded but not entered — phone ${pending.phone_number} (${monthLabel})`,
            details: {
                filename: pending.pdf_filename,
                pdfStoragePath: pending.pdf_storage_path,
                phoneNumber: pending.phone_number,
                month: monthLabel,
                invoiceCode: parsedSummary.invoiceCode || null,
                amountDue: parsedSummary.amountDue || null,
                reason: 'phone_not_in_master',
                note: 'PDF kept on server; invoice not parsed or stored in billing grid',
            },
        });
        return {
            status: 'archived',
            pendingToken: token,
            phoneNumber: pending.phone_number,
            monthLabel,
        };
    }
    async uploadBulk(co, files, actor) {
        if (files.length > 20) {
            throw new common_1.BadRequestException('Maximum 20 PDF files per upload batch');
        }
        this.logger.log(`Bulk upload started: ${files.length} file(s) for ${co}`);
        const results = [];
        for (const file of files) {
            try {
                const result = await this.uploadInvoice(co, file, actor);
                if (result.status === 'unknown_phone') {
                    results.push({
                        file: file.originalname,
                        success: false,
                        ...result,
                    });
                }
                else {
                    results.push({ file: file.originalname, success: true, ...result });
                }
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                this.logger.warn(`Bulk upload failed for ${file.originalname}: ${message}`);
                results.push({
                    file: file.originalname,
                    success: false,
                    error: message,
                });
            }
        }
        const ok = results.filter((row) => row.success).length;
        this.logger.log(`Bulk upload finished: ${ok}/${files.length} succeeded for ${co}`);
        await this.auditLog.log({
            co,
            actorEmail: actor?.email || 'unknown',
            actorName: actor?.name,
            action: 'invoice.upload_bulk',
            entityType: 'invoice_batch',
            summary: `Bulk upload finished: ${ok}/${files.length} invoice(s)`,
            details: {
                totalFiles: files.length,
                succeeded: ok,
                failed: files.length - ok,
                files: results.map((row) => ({
                    file: row.file,
                    success: row.success,
                    error: row.error || null,
                })),
            },
        });
        return results;
    }
    async listMonths(co) {
        const result = await this.db.query(`SELECT
        to_char(i.billing_month, 'YYYY-MM') AS month,
        COUNT(*)::text AS count
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE e.co = $1
       GROUP BY i.billing_month
       ORDER BY i.billing_month DESC`, [co]);
        return result.rows.map((row) => ({
            month: row.month,
            label: (0, invoice_billing_util_1.formatBillingMonthLabel)(row.month),
            count: Number(row.count),
        }));
    }
    async getMonthlyControlReport(co, month) {
        if (!month) {
            throw new common_1.BadRequestException('month query is required (YYYY-MM)');
        }
        const billingMonth = `${month}-01`;
        const { rows } = await this.db.query(`SELECT
        i.id AS invoice_id,
        e.display_name,
        e.person_number,
        e.phone_number,
        e.email,
        COALESCE(e.total_amount, e.package_value, 0) AS package_total,
        COALESCE(i.amount_due, 0) AS invoice_total,
        i.official_usage,
        i.personal_usage,
        i.approval_status,
        i.approval_sent_at,
        i.approval_submitted_at,
        COALESCE(i.approval_email_count, 0) AS approval_email_count,
        i.excess_reject_reason,
        i.recovery_status,
        i.recovery_last_error,
        i.recovery_sent_at,
        i.invoice_code,
        r.employee_remarks,
        r.admin_remarks,
        r.remarks,
        ear.status AS matrix_status,
        ear.current_level AS matrix_level,
        ear.completed_at AS matrix_completed_at
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       LEFT JOIN monthly_remarks r
         ON r.sim_employee_id = e.id AND r.billing_month = i.billing_month
       LEFT JOIN LATERAL (
         SELECT status, current_level, completed_at
           FROM excess_approval_requests
          WHERE invoice_id = i.id
          ORDER BY submitted_at DESC NULLS LAST, id DESC
          LIMIT 1
       ) ear ON TRUE
      WHERE e.co = $1
        AND i.billing_month = $2::date
      ORDER BY e.display_name ASC, i.id ASC`, [co, billingMonth]);
        const mapped = [];
        for (const row of rows) {
            const packageTotal = Number(row.package_total) || 0;
            const invoiceTotal = Number(row.invoice_total) || 0;
            const exceeded = (0, invoice_billing_util_1.calculateExceededAmount)(invoiceTotal, packageTotal);
            const personal = row.personal_usage === null || row.personal_usage === undefined ? null : Number(row.personal_usage);
            const official = row.official_usage === null || row.official_usage === undefined ? null : Number(row.official_usage);
            const recovery = String(row.recovery_status || '').toLowerCase();
            const approvalStatus = String(row.approval_status || '');
            const matrixStatus = row.matrix_status ? String(row.matrix_status) : null;
            const matrixApproved = matrixStatus === 'approved';
            const oraclePosted = recovery === 'sent' || approvalStatus === 'recovery_sent';
            const oracleFailed = recovery === 'failed';
            const remarks = (0, remarks_util_1.formatCombinedRemarks)(row.employee_remarks, row.admin_remarks, row.remarks);
            const remarkBlob = `${row.admin_remarks || ''} ${row.remarks || ''} ${remarks || ''}`;
            const notSubmittedBy15th = /by the 15th/i.test(remarkBlob);
            let approvalLabel = (0, invoice_billing_util_1.resolveApprovalColumnLabel)({
                invoice_total: invoiceTotal,
                package_total: packageTotal,
                personal_usage: personal,
                official_usage: official,
                approval_status: approvalStatus,
                excess_approval_level: row.matrix_level,
                excess_reject_reason: row.excess_reject_reason,
                approval_email_count: row.approval_email_count,
                approval_submitted_at: row.approval_submitted_at,
            });
            let matrixLabel = matrixApproved ? 'Approved' : (matrixStatus || '—');
            if (notSubmittedBy15th) {
                approvalLabel = 'Not submitted';
                matrixLabel = '—';
            }
            let oracleLabel = 'Not sent';
            if (oraclePosted)
                oracleLabel = 'Sent to Oracle';
            else if (oracleFailed)
                oracleLabel = 'Failed — not sent';
            else if (recovery === 'pending' || recovery === 'processing')
                oracleLabel = 'Queued / pending';
            let issue = null;
            if (notSubmittedBy15th)
                issue = 'NOT_SUBMITTED';
            else if (oraclePosted && !matrixApproved && (personal || 0) > 0)
                issue = 'ORACLE_WITHOUT_MATRIX';
            else if (oracleFailed)
                issue = 'ORACLE_FAILED';
            else if (matrixApproved && (personal || 0) > 0 && !oraclePosted)
                issue = 'APPROVED_NOT_SENT';
            if (exceeded <= 0 && !(personal > 0) && !oraclePosted && !oracleFailed)
                continue;
            mapped.push({
                invoiceId: row.invoice_id,
                month,
                monthLabel: (0, invoice_billing_util_1.formatBillingMonthLabel)(month),
                employee: row.display_name || '—',
                personNumber: row.person_number || '—',
                phone: row.phone_number || '—',
                email: row.email || null,
                invoiceCode: row.invoice_code || null,
                excess: exceeded,
                officialUsage: official,
                personalUsage: personal,
                approvalStatus,
                approvalLabel,
                matrixStatus: matrixLabel,
                matrixLevel: row.matrix_level === null || row.matrix_level === undefined ? null : Number(row.matrix_level),
                matrixApproved: notSubmittedBy15th ? false : matrixApproved,
                notSubmittedBy15th,
                inPayrollReport: !notSubmittedBy15th && matrixApproved && (personal || 0) > 0,
                deduction: personal || 0,
                oraclePosted,
                oracleFailed,
                oracleLabel,
                oracleError: row.recovery_last_error || null,
                recoveryStatus: row.recovery_status || null,
                recoverySentAt: row.recovery_sent_at ? String(row.recovery_sent_at) : null,
                remarks: remarks || null,
                issue,
            });
        }
        mapped.sort((a, b) => {
            const rank = (row) => row.issue === 'ORACLE_WITHOUT_MATRIX' ? 0 : row.issue === 'NOT_SUBMITTED' ? 1 : row.issue === 'ORACLE_FAILED' ? 2 : row.issue === 'APPROVED_NOT_SENT' ? 3 : 4;
            const d = rank(a) - rank(b);
            if (d)
                return d;
            return String(a.employee).localeCompare(String(b.employee));
        });
        return {
            co,
            month,
            monthLabel: (0, invoice_billing_util_1.formatBillingMonthLabel)(month),
            totals: {
                rows: mapped.length,
                oracleWithoutMatrix: mapped.filter((r) => r.issue === 'ORACLE_WITHOUT_MATRIX').length,
                oracleFailed: mapped.filter((r) => r.issue === 'ORACLE_FAILED').length,
                approvedNotSent: mapped.filter((r) => r.issue === 'APPROVED_NOT_SENT').length,
                sentToOracle: mapped.filter((r) => r.oraclePosted).length,
                inPayrollReport: mapped.filter((r) => r.inPayrollReport).length,
            },
            rows: mapped,
        };
    }
    async exportMonthlyControlExcel(co, month) {
        const report = await this.getMonthlyControlReport(co, month);
        const XLSX = require('xlsx');
        const monthLabel = report.monthLabel || report.month || '';
        const rows = (report.rows || []).map((r) => ({
            Month: r.monthLabel || r.month || monthLabel,
            Employee: r.employee || '',
            'Person Number': r.personNumber || '',
            Phone: r.phone || '',
            Approval: r.approvalLabel || '',
            Matrix: r.matrixStatus || '',
            'Official (AED)': r.officialUsage == null ? '' : Number(Number(r.officialUsage).toFixed(2)),
            'Personal deduction (AED)': r.deduction == null ? '' : Number(Number(r.deduction).toFixed(2)),
            Oracle: r.oracleLabel || '',
            'Oracle error': r.oracleError || '',
            'In payroll file': r.inPayrollReport ? 'Yes' : 'No',
            Issue: r.issue === 'NOT_SUBMITTED'
                ? 'Not submitted'
                : r.issue === 'ORACLE_WITHOUT_MATRIX'
                    ? 'Oracle without approval'
                    : r.issue === 'ORACLE_FAILED'
                        ? 'Oracle failed'
                        : r.issue === 'APPROVED_NOT_SENT'
                            ? 'Approved, not sent'
                            : '',
            Remarks: r.remarks || '',
            Invoice: r.invoiceCode || '',
            Email: r.email || '',
        }));
        const workbook = XLSX.utils.book_new();
        const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: 'No rows for this month.' }]);
        sheet['!cols'] = [
            { wch: 16 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 12 },
            { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 40 }, { wch: 12 },
            { wch: 24 }, { wch: 50 }, { wch: 18 }, { wch: 28 },
        ];
        XLSX.utils.book_append_sheet(workbook, sheet, 'Monthly Report');
        return {
            filename: `eBilling-monthly-report-${month}.xlsx`,
            buffer: XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
        };
    }
    mapGridRow(row, options = {}) {
        const month = String(row.month_key || '').slice(0, 7);
        const packageTotal = Number(row.package_total) || 0;
        const invoiceTotal = Number(row.invoice_total) || 0;
        const personalUsage = row.personal_usage === null || row.personal_usage === undefined
            ? null
            : Number(row.personal_usage);
        const officialUsage = row.official_usage === null || row.official_usage === undefined
            ? null
            : Number(row.official_usage);
        const approvalStatus = String(row.approval_status || 'draft');
        const exceededAmount = (0, invoice_billing_util_1.calculateExceededAmount)(invoiceTotal, packageTotal);
        const mapped = {
            invoice_id: row.invoice_id,
            sim_employee_id: row.sim_employee_id,
            month,
            month_label: (0, invoice_billing_util_1.formatBillingMonthLabel)(month),
            phone_number: row.phone_number,
            display_name: row.display_name ?? null,
            package_total: packageTotal,
            invoice_total: invoiceTotal,
            personal_usage: personalUsage,
            official_usage: officialUsage,
            excess: (0, invoice_billing_util_1.calculateExcess)(personalUsage, approvalStatus, exceededAmount),
            exceeded_amount: exceededAmount,
            approval_status: approvalStatus,
            approval_sent_at: row.approval_sent_at
                ? String(row.approval_sent_at)
                : null,
            approval_submitted_at: row.approval_submitted_at
                ? String(row.approval_submitted_at)
                : null,
            overage_amount: Number(row.overage_amount) || 0,
            remarks: (0, remarks_util_1.formatCombinedRemarks)(row.employee_remarks, row.admin_remarks, row.remarks),
            employee_remarks: row.employee_remarks?.trim() || null,
            admin_remarks: row.admin_remarks?.trim() || null,
            due_date: row.due_date
                ? String(row.due_date).slice(0, 10)
                : null,
            invoice_code: row.invoice_code ?? null,
            pdf_filename: row.pdf_filename ?? null,
            email: row.email ?? null,
            email_sent_at: row.email_sent_at
                ? String(row.email_sent_at)
                : null,
            email_sent_to: row.email_sent_to ?? null,
            uploaded_by_email: row.uploaded_by_email ?? null,
            uploaded_by_name: row.uploaded_by_name ?? null,
            uploaded_by_label: row.uploaded_by_name ||
                (row.uploaded_by_email
                    ? (0, ebilling_admin_access_1.formatDisplayEmail)(String(row.uploaded_by_email))
                    : null),
            uploaded_at: row.uploaded_at ? String(row.uploaded_at) : null,
            person_number: row.person_number ?? null,
            no_auto_mail: Boolean(row.no_auto_mail),
            recovery_sent_at: row.recovery_sent_at
                ? String(row.recovery_sent_at)
                : null,
            approval_email_count: Number(row.approval_email_count) || 0,
            excess_approval_level: row.excess_approval_level === null || row.excess_approval_level === undefined
                ? null
                : Number(row.excess_approval_level),
            excess_approval_request_status: row.excess_approval_request_status ?? null,
            excess_reject_reason: row.excess_reject_reason ?? null,
            excess_rejected_by: row.excess_rejected_by ?? null,
            excess_rejected_at: row.excess_rejected_at ? String(row.excess_rejected_at) : null,
        };
        if (options.includeApprovalToken) {
            mapped.approval_token = row.approval_token ?? null;
        }
        return mapped;
    }
    async getGridByMonth(co, month) {
        if (!month) {
            throw new common_1.BadRequestException('month query is required (YYYY-MM)');
        }
        await this.ensureInvoiceRejectColumns();
        const billingMonth = `${month}-01`;
        const result = await this.db.query(`SELECT
        i.id AS invoice_id,
        e.id AS sim_employee_id,
        to_char(i.billing_month, 'YYYY-MM') AS month_key,
        i.phone_number,
        e.display_name,
        COALESCE(e.total_amount, e.package_value, 0) AS package_total,
        COALESCE(i.amount_due, 0) AS invoice_total,
        i.personal_usage,
        i.official_usage,
        i.approval_status,
        i.approval_sent_at,
        i.approval_submitted_at,
        COALESCE(i.approval_email_count, 0) AS approval_email_count,
        COALESCE(i.overage_amount, 0) AS overage_amount,
        r.remarks,
        r.employee_remarks,
        r.admin_remarks,
        i.due_date,
        i.invoice_code,
        i.pdf_filename,
        e.email,
        e.person_number,
        COALESCE(e.no_auto_mail, FALSE) AS no_auto_mail,
        i.recovery_sent_at,
        ear.current_level AS excess_approval_level,
        ear.status AS excess_approval_request_status,
        i.excess_reject_reason,
        i.excess_rejected_by,
        i.excess_rejected_at,
        email_log.sent_at AS email_sent_at,
        email_log.recipient_email AS email_sent_to,
        COALESCE(i.uploaded_by_email, upload_log.actor_email) AS uploaded_by_email,
        COALESCE(i.uploaded_by_name, upload_log.actor_name) AS uploaded_by_name,
        COALESCE(i.uploaded_at, upload_log.created_at) AS uploaded_at
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       LEFT JOIN monthly_remarks r
         ON r.sim_employee_id = e.id AND r.billing_month = i.billing_month
       LEFT JOIN LATERAL (
         SELECT el.sent_at, el.recipient_email
         FROM email_logs el
         WHERE el.sim_employee_id = e.id
           AND el.billing_month = i.billing_month
           AND el.status = 'sent'
         ORDER BY el.sent_at DESC
         LIMIT 1
       ) email_log ON TRUE
       LEFT JOIN LATERAL (
         SELECT al.actor_email, al.actor_name, al.created_at
         FROM ebilling_audit_logs al
         WHERE al.action = 'invoice.upload'
           AND al.entity_type = 'invoice'
           AND al.entity_id = i.id::text
         ORDER BY al.created_at ASC
         LIMIT 1
       ) upload_log ON TRUE
       LEFT JOIN excess_approval_requests ear ON ear.invoice_id = i.id
       WHERE e.co = $1 AND i.billing_month = $2::date
       ORDER BY e.display_name`, [co, billingMonth]);
        const rows = result.rows.map((row) => this.mapGridRow(row));
        return {
            month,
            label: (0, invoice_billing_util_1.formatBillingMonthLabel)(month),
            rows,
            summary: {
                count: rows.length,
                totalInvoice: rows.reduce((sum, row) => sum + row.invoice_total, 0),
                totalExcess: rows.reduce((sum, row) => sum + (row.excess ?? 0), 0),
            },
        };
    }
    async listByMonth(co, month) {
        const grid = await this.getGridByMonth(co, month);
        return grid.rows;
    }
    async updateInvoice(co, id, dto, actor) {
        const existing = await this.db.query(`SELECT i.*, e.co, to_char(i.billing_month, 'YYYY-MM') AS month_key
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE i.id = $1 AND e.co = $2`, [id, co]);
        if (!existing.rows[0]) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        if (dto.personalUsage !== undefined) {
            throw new common_1.BadRequestException('Personal usage is set by employee approval and cannot be edited manually');
        }
        return existing.rows[0];
    }
    assertAdmin(actor) {
        if (!(0, ebilling_admin_access_2.canAccessEbillingAdminTools)(actor?.email)) {
            throw new common_1.BadRequestException('Not authorized for this action');
        }
    }
    assertCanSendApprovalEmails(actor) {
        const email = (0, ebilling_admin_access_2.normalizeEmail)(actor?.email);
        if (!(0, ebilling_admin_access_2.canAccessEbillingAdminTools)(email) &&
            !(0, ebilling_admin_access_2.canSendExcessApprovalToMatrix)(email)) {
            throw new common_1.BadRequestException('Not authorized for this action');
        }
    }
    async saveEmployeeRemarks(simEmployeeId, month, remarks) {
        const employeeRemarks = normalizeOptionalRemarks(remarks);
        if (!employeeRemarks) {
            return;
        }
        await this.db.query(`INSERT INTO monthly_remarks (sim_employee_id, billing_month, employee_remarks)
       VALUES ($1, $2::date, $3)
       ON CONFLICT (sim_employee_id, billing_month)
       DO UPDATE SET employee_remarks = EXCLUDED.employee_remarks, updated_at = NOW()`, [simEmployeeId, `${month}-01`, employeeRemarks]);
    }
    normalizeEmployeeEmail(email) {
        return (0, employee_email_util_1.normalizeEmployeeEmail)(email);
    }
    async listPendingApprovals(co, actor, rawUser) {
        await this.ensureInvoiceRejectColumns();
        const candidateEmails = (0, employee_email_util_1.collectActorEmails)(actor?.email, rawUser);
        if (!candidateEmails.length) {
            return [];
        }
        const result = await this.db.query(`SELECT
        i.id AS invoice_id,
        e.id AS sim_employee_id,
        to_char(i.billing_month, 'YYYY-MM') AS month_key,
        i.phone_number,
        e.display_name,
        COALESCE(e.total_amount, e.package_value, 0) AS package_total,
        COALESCE(i.amount_due, 0) AS invoice_total,
        i.personal_usage,
        i.official_usage,
        i.approval_status,
        i.approval_sent_at,
        i.approval_submitted_at,
        COALESCE(i.overage_amount, 0) AS overage_amount,
        r.remarks,
        r.employee_remarks,
        r.admin_remarks,
        i.due_date,
        i.invoice_code,
        i.pdf_filename,
        e.email,
        NULL::timestamptz AS email_sent_at,
        NULL::text AS email_sent_to,
        i.uploaded_by_email,
        i.uploaded_by_name,
        i.uploaded_at,
        i.excess_reject_reason,
        i.excess_rejected_by,
        i.excess_rejected_at
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       LEFT JOIN monthly_remarks r
         ON r.sim_employee_id = e.id AND r.billing_month = i.billing_month
       WHERE e.co = $1
         AND i.approval_status IN ('pending_approval', 'waiting_confirmation', 'excess_rejected')
       ORDER BY i.approval_sent_at DESC NULLS LAST, i.billing_month DESC`, [co]);
        return result.rows
            .filter((row) => (0, employee_email_util_1.actorOwnsEmployeeEmail)(String(row.email || ''), actor?.email, rawUser))
            .map((row) => this.mapGridRow(row));
    }
    async listAdminApprovalQueue(co, actor) {
        if (!(0, ebilling_admin_access_2.canAccessEbillingAdminTools)(actor?.email)) {
            return { items: [], pendingCount: 0, readyForRecoveryCount: 0 };
        }
        const result = await this.db.query(`SELECT
        i.id AS invoice_id,
        e.id AS sim_employee_id,
        to_char(i.billing_month, 'YYYY-MM') AS month_key,
        i.phone_number,
        e.display_name,
        COALESCE(e.total_amount, e.package_value, 0) AS package_total,
        COALESCE(i.amount_due, 0) AS invoice_total,
        i.personal_usage,
        i.official_usage,
        i.approval_status,
        i.approval_sent_at,
        i.approval_submitted_at,
        i.approval_token,
        COALESCE(i.approval_email_count, 0) AS approval_email_count,
        COALESCE(i.overage_amount, 0) AS overage_amount,
        r.remarks,
        r.employee_remarks,
        r.admin_remarks,
        i.due_date,
        i.invoice_code,
        i.pdf_filename,
        e.email,
        e.person_number,
        email_log.sent_at AS email_sent_at,
        email_log.recipient_email AS email_sent_to,
        COALESCE(i.uploaded_by_email, upload_log.actor_email) AS uploaded_by_email,
        COALESCE(i.uploaded_by_name, upload_log.actor_name) AS uploaded_by_name,
        COALESCE(i.uploaded_at, upload_log.created_at) AS uploaded_at
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       LEFT JOIN monthly_remarks r
         ON r.sim_employee_id = e.id AND r.billing_month = i.billing_month
       LEFT JOIN LATERAL (
         SELECT el.sent_at, el.recipient_email
         FROM email_logs el
         WHERE el.sim_employee_id = e.id
           AND el.billing_month = i.billing_month
           AND el.status = 'sent'
         ORDER BY el.sent_at DESC
         LIMIT 1
       ) email_log ON TRUE
       LEFT JOIN LATERAL (
         SELECT al.actor_email, al.actor_name, al.created_at
         FROM ebilling_audit_logs al
         WHERE al.action = 'invoice.upload'
           AND al.entity_type = 'invoice'
           AND al.entity_id = i.id::text
         ORDER BY al.created_at ASC
         LIMIT 1
       ) upload_log ON TRUE
       WHERE e.co = $1
         AND i.approval_status IN ('pending_approval', 'waiting_confirmation', 'ready_for_recovery', 'pending_excess_approval')
       ORDER BY
         CASE i.approval_status
           WHEN 'pending_approval' THEN 0
           WHEN 'waiting_confirmation' THEN 1
           WHEN 'pending_excess_approval' THEN 2
           ELSE 3
         END,
         i.approval_sent_at DESC NULLS LAST,
         i.approval_submitted_at DESC NULLS LAST,
         i.billing_month DESC`, [co]);
        const items = result.rows.map((row) => this.mapGridRow(row, { includeApprovalToken: true }));
        const pendingApproval = items.filter((row) => row.approval_status === 'pending_approval' ||
            row.approval_status === 'waiting_confirmation');
        const approvalRequest = items.filter((row) => row.approval_status === 'ready_for_recovery' ||
            row.approval_status === 'pending_excess_approval');
        return {
            items,
            pendingApproval,
            readyForRecovery: approvalRequest,
            approvalRequest,
            pendingCount: pendingApproval.length,
            waitingConfirmationCount: items.filter((row) => row.approval_status === 'waiting_confirmation').length,
            readyForRecoveryCount: approvalRequest.length,
            approvalRequestCount: approvalRequest.length,
            approvalEmailsSent: items.reduce((sum, row) => sum + (row.approval_email_count || 0), 0),
        };
    }
    async sendForApproval(co, invoiceId, actor) {
        this.assertCanSendApprovalEmails(actor);
        const existing = await this.db.query(`SELECT i.*, e.co, e.email, e.display_name,
        COALESCE(e.total_amount, e.package_value, 0) AS package_total,
        to_char(i.billing_month, 'YYYY-MM') AS month_key
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE i.id = $1 AND e.co = $2`, [invoiceId, co]);
        const row = existing.rows[0];
        if (!row) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        const invoiceTotal = Number(row.amount_due) || 0;
        const packageTotal = Number(row.package_total) || 0;
        const exceededAmount = (0, invoice_billing_util_1.calculateExceededAmount)(invoiceTotal, packageTotal);
        if (exceededAmount <= 0) {
            throw new common_1.BadRequestException('This invoice has no package excess');
        }
        const restartStatuses = ['recovery_sent', 'excess_rejected', 'pending_excess_approval'];
        if (restartStatuses.includes(String(row.approval_status || ''))) {
            await this.excessApproval.resetWorkflow(co, invoiceId);
            await this.db.query(`UPDATE invoices
         SET approval_status = 'draft',
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
         WHERE id = $1`, [invoiceId]);
            const refreshed = await this.db.query(`SELECT i.*, e.co, e.email, e.display_name,
          COALESCE(e.total_amount, e.package_value, 0) AS package_total,
          to_char(i.billing_month, 'YYYY-MM') AS month_key
         FROM invoices i
         INNER JOIN sim_employees e ON e.id = i.sim_employee_id
         WHERE i.id = $1 AND e.co = $2`, [invoiceId, co]);
            row = refreshed.rows[0];
            if (!row) {
                throw new common_1.NotFoundException('Invoice not found');
            }
        }
        if (row.approval_status === 'ready_for_recovery' ||
            row.approval_status === 'confirmed_by_user') {
            throw new common_1.BadRequestException('This invoice is already approved');
        }
        if (!String(row.email || '').trim()) {
            throw new common_1.BadRequestException('Employee has no email address');
        }
        const isResend = row.approval_status === 'pending_approval' ||
            row.approval_status === 'waiting_confirmation';
        if (!isResend &&
            row.approval_status !== 'draft' &&
            row.approval_status !== 'not_required') {
            throw new common_1.BadRequestException('This invoice is not eligible for approval request');
        }
        const month = String(row.month_key);
        const gridRow = (await this.getGridByMonth(co, month)).rows.find((item) => item.invoice_id === invoiceId);
        if (!gridRow) {
            throw new common_1.NotFoundException('Invoice row not found');
        }
        let token = row.approval_token;
        if (!token) {
            token = (0, crypto_1.randomUUID)();
            await this.db.query(`UPDATE invoices
         SET approval_token = $1,
             approval_token_expires_at = NOW() + INTERVAL '${FOLDER_TOKEN_TTL_DAYS} days'
         WHERE id = $2`, [token, invoiceId]);
        }
        await this.notifications.sendFolderApprovalRequestEmail(gridRow, token);
        const nextEmailCount = isResend
            ? (Number(row.approval_email_count) || 1) + 1
            : 1;
        const nextStatus = isResend ? 'waiting_confirmation' : 'pending_approval';
        await this.db.query(`UPDATE invoices
       SET approval_status = $2,
           approval_sent_at = NOW(),
           approval_email_count = $3
       WHERE id = $1`, [invoiceId, nextStatus, nextEmailCount]);
        const updatedRow = (await this.getGridByMonth(co, month)).rows.find((item) => item.invoice_id === invoiceId);
        if (!updatedRow) {
            throw new common_1.NotFoundException('Invoice row not found after update');
        }
        await this.auditLog.log({
            co,
            actorEmail: actor?.email || 'unknown',
            actorName: actor?.name,
            action: 'invoice.approval_request',
            entityType: 'invoice',
            entityId: invoiceId,
            summary: `Sent approval request for ${row.phone_number}`,
            details: {
                month,
                exceededAmount,
                recipient: row.email,
            },
        });
        return { row: updatedRow };
    }
    async submitMonthlyOracleDeductions(co, billingMonthKey) {
        const monthKey = billingMonthKey || (0, invoice_billing_util_1.previousBillingMonthKey)();
        const { rows } = await this.db.query(`SELECT i.id
         FROM invoices i
         INNER JOIN sim_employees e ON e.id = i.sim_employee_id
         LEFT JOIN excess_approval_requests ear ON ear.invoice_id = i.id
        WHERE e.co = $1
          AND to_char(i.billing_month, 'YYYY-MM') = $2
          AND COALESCE(i.personal_usage, 0) > 0
          AND COALESCE(i.recovery_status, '') <> 'sent'
          AND (
            ear.status = 'approved'
            OR i.approval_status IN ('ready_for_recovery', 'recovery_sent')
          )
        ORDER BY e.display_name ASC, i.id ASC`, [co, monthKey]);
        const results = [];
        for (const row of rows) {
            const invoiceId = String(row.id);
            try {
                const push = await this.tryPushRecoveryFromWorkflow(co, invoiceId, {
                    email: 'monthly-oracle-batch',
                    name: 'Monthly Oracle batch',
                });
                results.push({
                    invoiceId,
                    success: push.success === true,
                    error: push.success ? null : (push.error || 'Oracle submit failed'),
                });
            }
            catch (error) {
                results.push({
                    invoiceId,
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
        this.logger.log(`Monthly Oracle batch for ${co} / ${monthKey}: ${results.filter((r) => r.success).length} sent, ${results.filter((r) => !r.success).length} failed, ${rows.length} total`);
        return {
            co,
            billingMonthKey: monthKey,
            total: rows.length,
            sent: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
            results,
        };
    }
    async applyUnsplitDeadlineForCompany(co) {
        const neverSplitNote = 'Approval not completed by the employee by the 15th. Full excess charged as personal deduction.';
        const noCorrectionNote = 'Rejected split was not corrected by the employee by the 15th. Full excess charged as personal deduction.';
        const { rows } = await this.db.query(`SELECT i.id,
        i.sim_employee_id,
        to_char(i.billing_month, 'YYYY-MM') AS month_key,
        COALESCE(i.amount_due, 0) AS invoice_total,
        COALESCE(e.total_amount, e.package_value, 0) AS package_total,
        e.phone_number,
        e.display_name,
        i.phone_number AS invoice_phone,
        COALESCE(i.excess_reject_reason, '') AS excess_reject_reason
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
      WHERE e.co = $1
        AND i.approval_status IN ('pending_approval', 'waiting_confirmation')
        AND i.approval_sent_at IS NOT NULL
        AND COALESCE(i.approval_email_count, 0) > 0
        AND (
          i.approval_submitted_at IS NULL
          OR COALESCE(i.excess_reject_reason, '') <> ''
        )
      ORDER BY i.id ASC`, [co]);
        const processed = [];
        for (const row of rows) {
            const exceeded = (0, invoice_billing_util_1.calculateExceededAmount)(Number(row.invoice_total) || 0, Number(row.package_total) || 0);
            if (exceeded <= 0)
                continue;
            const needsCorrection = String(row.excess_reject_reason || '').trim() !== '';
            const note = needsCorrection ? noCorrectionNote : neverSplitNote;
            const nextStatus = 'ready_for_recovery';
            const updated = await this.db.query(`UPDATE invoices
         SET personal_usage = $1,
             official_usage = 0,
             approval_status = $2::varchar,
             approval_submitted_at = NOW(),
             approval_token = NULL,
             approval_token_expires_at = NULL,
             recovery_status = 'pending'
         WHERE id = $3
           AND approval_status IN ('pending_approval', 'waiting_confirmation')`, [exceeded, nextStatus, row.id]);
            if (!updated.rowCount)
                continue;
            await this.appendSystemRemark(row.sim_employee_id, String(row.month_key), note);
            await this.auditLog.log({
                co,
                actorEmail: 'system',
                actorName: '15th unsplit deadline',
                action: 'invoice.unsplit_deadline_full_personal',
                entityType: 'invoice',
                entityId: row.id,
                summary: `${needsCorrection ? 'No correction after reject' : 'No employee split'} by 15th — full excess AED ${exceeded.toFixed(2)} set as personal for ${row.display_name || row.phone_number || row.invoice_phone}`,
                details: { exceeded, nextStatus, note, needsCorrection },
            });
            processed.push({
                invoiceId: row.id,
                employee: row.display_name || row.phone_number,
                personal: exceeded,
                status: nextStatus,
                reason: needsCorrection ? 'no_correction_after_reject' : 'never_split',
            });
        }
        this.logger.log(`Unsplit 15th deadline for ${co}: ${processed.length} invoice(s) set to full personal`);
        return { co, processed: processed.length, matrixSent: 0, rows: processed };
    }
    async appendSystemRemark(simEmployeeId, month, remark) {
        const text = String(remark || '').trim();
        if (!text)
            return;
        await this.db.query(`INSERT INTO monthly_remarks (sim_employee_id, billing_month, admin_remarks, remarks, updated_at)
       VALUES ($1, $2::date, $3, $3, NOW())
       ON CONFLICT (sim_employee_id, billing_month) DO UPDATE SET
         admin_remarks = CASE
           WHEN monthly_remarks.admin_remarks IS NULL OR TRIM(monthly_remarks.admin_remarks) = '' THEN EXCLUDED.admin_remarks
           ELSE monthly_remarks.admin_remarks || E'\\n' || EXCLUDED.admin_remarks
         END,
         remarks = CASE
           WHEN monthly_remarks.remarks IS NULL OR TRIM(monthly_remarks.remarks) = '' THEN EXCLUDED.remarks
           ELSE monthly_remarks.remarks || E'\\n' || EXCLUDED.remarks
         END,
         updated_at = NOW()`, [simEmployeeId, `${month}-01`, text]);
    }
    async sendApprovalReminder(co, invoiceId, actor) {
        this.assertCanSendApprovalEmails(actor);
        const existing = await this.db.query(`SELECT i.*, e.co, e.email, e.display_name,
        COALESCE(e.total_amount, e.package_value, 0) AS package_total,
        to_char(i.billing_month, 'YYYY-MM') AS month_key
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE i.id = $1 AND e.co = $2`, [invoiceId, co]);
        const row = existing.rows[0];
        if (!row) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        if (row.approval_status !== 'pending_approval') {
            throw new common_1.BadRequestException('Reminder is only available while approval is pending');
        }
        if (!String(row.email || '').trim()) {
            throw new common_1.BadRequestException('Employee has no email address');
        }
        const month = String(row.month_key);
        const gridRow = (await this.getGridByMonth(co, month)).rows.find((item) => item.invoice_id === invoiceId);
        if (!gridRow) {
            throw new common_1.NotFoundException('Invoice row not found');
        }
        let token = row.approval_token;
        if (!token) {
            token = (0, crypto_1.randomUUID)();
            await this.db.query(`UPDATE invoices
         SET approval_token = $1,
             approval_token_expires_at = NOW() + INTERVAL '${FOLDER_TOKEN_TTL_DAYS} days'
         WHERE id = $2`, [token, invoiceId]);
        }
        await this.notifications.sendFolderApprovalRequestEmail(gridRow, token);
        const nextEmailCount = (Number(row.approval_email_count) || 1) + 1;
        await this.db.query(`UPDATE invoices
       SET approval_sent_at = NOW(),
           approval_email_count = $2
       WHERE id = $1`, [invoiceId, nextEmailCount]);
        const updatedRow = (await this.getGridByMonth(co, month)).rows.find((item) => item.invoice_id === invoiceId);
        if (!updatedRow) {
            throw new common_1.NotFoundException('Invoice row not found after update');
        }
        await this.auditLog.log({
            co,
            actorEmail: actor?.email || 'unknown',
            actorName: actor?.name,
            action: 'invoice.approval_reminder',
            entityType: 'invoice',
            entityId: invoiceId,
            summary: `Sent approval reminder for ${row.phone_number}`,
            details: {
                month,
                recipient: row.email,
                approvalEmailCount: nextEmailCount,
            },
        });
        return { row: updatedRow };
    }
    async sendForApprovalBulk(co, invoiceIds, actor) {
        this.assertCanSendApprovalEmails(actor);
        const uniqueIds = [...new Set(invoiceIds.map((id) => Number(id)).filter(Boolean))];
        if (!uniqueIds.length) {
            throw new common_1.BadRequestException('invoiceIds is required');
        }
        const results = [];
        for (const invoiceId of uniqueIds) {
            try {
                const { row } = await this.sendForApproval(co, invoiceId, actor);
                results.push({ invoiceId, success: true, row });
            }
            catch (error) {
                const message = error instanceof common_1.BadRequestException ||
                    error instanceof common_1.NotFoundException
                    ? error.message
                    : error instanceof Error
                        ? error.message
                        : 'Could not send approval request';
                results.push({ invoiceId, success: false, error: message });
            }
        }
        return {
            sent: results.filter((item) => item.success).length,
            failed: results.filter((item) => !item.success).length,
            results,
        };
    }
    async submitApproval(co, invoiceId, dto, actor, rawUser) {
        const employeeEmail = this.normalizeEmployeeEmail(actor?.email);
        if (!employeeEmail) {
            throw new common_1.BadRequestException('Signed-in email is required');
        }
        const existing = await this.db.query(`SELECT i.*, e.co, e.email, e.display_name,
        COALESCE(e.total_amount, e.package_value, 0) AS package_total,
        to_char(i.billing_month, 'YYYY-MM') AS month_key
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE i.id = $1 AND e.co = $2`, [invoiceId, co]);
        const row = existing.rows[0];
        if (!row) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        const ownsInvoice = (0, employee_email_util_1.actorOwnsEmployeeEmail)(row.email, employeeEmail, rawUser);
        if (!ownsInvoice) {
            throw new common_1.BadRequestException('You are not authorized to approve this invoice');
        }
        if (row.approval_status !== 'pending_approval' &&
            row.approval_status !== 'waiting_confirmation' &&
            row.approval_status !== 'excess_rejected') {
            throw new common_1.BadRequestException('This invoice is not waiting for your approval');
        }
        const invoiceTotal = Number(row.amount_due) || 0;
        const packageTotal = Number(row.package_total) || 0;
        const exceededAmount = (0, invoice_billing_util_1.calculateExceededAmount)(invoiceTotal, packageTotal);
        const officialUsage = roundApprovalAmount(dto.officialUsage);
        const personalUsage = roundApprovalAmount(dto.personalUsage);
        const splitTotal = roundApprovalAmount(officialUsage + personalUsage);
        if (Math.abs(splitTotal - exceededAmount) > 0.01) {
            throw new common_1.BadRequestException(`Official + personal must equal the exceeded amount (AED ${exceededAmount.toFixed(2)})`);
        }
        const approvalStatus = (0, invoice_billing_util_1.resolveApprovalStatusAfterSubmit)(personalUsage);
        const updateResult = await this.db.query(`UPDATE invoices
       SET personal_usage = $1,
           official_usage = $2,
           approval_status = $3::varchar,
           approval_submitted_at = NOW(),
           approval_token = NULL,
           approval_token_expires_at = NULL,
           recovery_status = CASE
             WHEN $3::text = 'ready_for_recovery' THEN 'pending'
             ELSE recovery_status
           END,
           recovery_last_error = CASE
             WHEN $3::text = 'ready_for_recovery' THEN NULL
             ELSE recovery_last_error
           END
       WHERE id = $4
         AND approval_status IN ('pending_approval', 'waiting_confirmation', 'excess_rejected')`, [personalUsage, officialUsage, approvalStatus, invoiceId]);
        if (!updateResult.rowCount) {
            throw new common_1.BadRequestException('This invoice was already approved');
        }
        await this.saveEmployeeRemarks(row.sim_employee_id, String(row.month_key), dto.remarks);
        const month = String(row.month_key);
        const gridRow = (await this.getGridByMonth(co, month)).rows.find((item) => item.invoice_id === invoiceId);
        if (!gridRow) {
            throw new common_1.NotFoundException('Invoice row not found after update');
        }
        await this.notifications.sendApprovalConfirmationEmail(gridRow);
        await this.auditLog.log({
            co,
            actorEmail: actor?.email || 'unknown',
            actorName: actor?.name,
            action: 'invoice.approval_submit',
            entityType: 'invoice',
            entityId: invoiceId,
            summary: `Employee approved usage split for ${row.phone_number}`,
            details: {
                month,
                officialUsage,
                personalUsage,
                exceededAmount,
            },
        });
        return { row: gridRow };
    }
    buildRecoveryMatchPreview(masterRow, preview) {
        const master = {
            personNumber: String(masterRow.person_number || '').trim() || null,
            displayName: masterRow.display_name ?? null,
            phoneNumber: masterRow.phone_number ?? null,
            email: masterRow.email ?? null,
        };
        const oracle = preview.oracle;
        const warnings = [];
        const errors = [];
        const checks = [];
        if (!master.personNumber) {
            errors.push('Employee person number is missing in SIM master');
        }
        if (!oracle) {
            errors.push(`Oracle worker not found for person ${master.personNumber || '—'}`);
            return {
                master,
                oracle: null,
                checks,
                warnings,
                errors,
                matchStatus: 'oracle_not_found',
                matchSummary: 'Oracle employee record was not found.',
                canSend: false,
            };
        }
        const oraclePersonNumber = String(oracle.personNumber || '').trim();
        const personOk = master.personNumber === oraclePersonNumber;
        checks.push({
            label: 'Person number',
            ok: personOk,
            master: master.personNumber,
            oracle: oraclePersonNumber,
        });
        if (!personOk) {
            errors.push('Person number in SIM master does not match Oracle');
        }
        const nameOk = this.oracleRecovery.namesLikelyMatch(master.displayName, oracle.displayName);
        checks.push({
            label: 'Display name',
            ok: nameOk,
            master: master.displayName,
            oracle: oracle.displayName,
        });
        if (!nameOk) {
            errors.push('Employee name in SIM master does not match Oracle');
        }
        const emailOk = this.oracleRecovery.emailsLikelyMatch(master.email, oracle.email);
        checks.push({
            label: 'Work email',
            ok: emailOk,
            master: master.email,
            oracle: oracle.email,
        });
        if (!emailOk) {
            warnings.push('Work email differs between SIM master and Oracle');
        }
        if (!oracle.assignmentId) {
            errors.push('Oracle primary assignment is missing for this employee');
        }
        if (preview.resolveError) {
            errors.push(`Oracle deduction element could not be resolved: ${preview.resolveError}`);
        }
        let matchStatus = 'matched';
        if (errors.length) {
            matchStatus = personOk || nameOk ? 'partial' : 'mismatch';
            if (!personOk && !oracle) {
                matchStatus = 'oracle_not_found';
            }
            else if (!personOk) {
                matchStatus = 'mismatch';
            }
            else if (!nameOk) {
                matchStatus = 'partial';
            }
            else {
                matchStatus = 'blocked';
            }
        }
        else if (warnings.length) {
            matchStatus = 'partial';
        }
        const canSend = errors.length === 0;
        const matchSummary = canSend
            ? warnings.length
                ? 'Core employee identifiers match Oracle. Review warnings before sending.'
                : 'Employee identifiers match Oracle. You can send recovery after confirming the amount.'
            : errors[0] || 'Recovery cannot be sent until mismatches are resolved.';
        return {
            master,
            oracle: {
                personNumber: oraclePersonNumber,
                personId: oracle.personId,
                assignmentId: oracle.assignmentId,
                displayName: oracle.displayName,
                email: oracle.email,
                departmentName: oracle.departmentName,
                jobName: oracle.jobName,
                positionName: oracle.positionName,
            },
            checks,
            warnings,
            errors,
            matchStatus,
            matchSummary,
            canSend,
        };
    }
    assertRecoveryEligible(row) {
        const status = String(row.approval_status || '');
        if (status !== 'ready_for_recovery' && status !== 'recovery_sent') {
            throw new common_1.BadRequestException('Invoice is not eligible for recovery');
        }
        const personalUsage = Number(row.personal_usage) || 0;
        if (personalUsage <= 0) {
            throw new common_1.BadRequestException('Personal usage amount is missing or zero');
        }
        const personNumber = String(row.person_number || '').trim();
        if (!personNumber) {
            throw new common_1.BadRequestException('Employee person number is missing in SIM master');
        }
        return { personalUsage, personNumber, isResend: status === 'recovery_sent' };
    }
    async getRecoveryPreview(co, invoiceId, actor) {
        this.assertAdmin(actor);
        return this.getRecoveryPreviewInternal(co, invoiceId);
    }
    async getRecoveryPreviewInternal(co, invoiceId) {
        const existing = await this.db.query(`SELECT i.*, e.person_number, e.display_name, e.phone_number, e.email,
        to_char(i.billing_month, 'YYYY-MM') AS month_key
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE i.id = $1 AND e.co = $2`, [invoiceId, co]);
        const row = existing.rows[0];
        if (!row) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        const { personalUsage, personNumber, isResend } = this.assertRecoveryEligible(row);
        let preview;
        try {
            preview = await this.oracleRecovery.previewRecoveryAmount(personNumber, personalUsage);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new common_1.BadRequestException(`Oracle preview failed: ${message}`);
        }
        const match = this.buildRecoveryMatchPreview(row, preview);
        return {
            invoiceId,
            month: String(row.month_key),
            monthLabel: (0, invoice_billing_util_1.formatBillingMonthLabel)(String(row.month_key)),
            phoneNumber: row.phone_number,
            amount: preview.amount,
            canSend: match.canSend,
            matchStatus: match.matchStatus,
            matchSummary: match.matchSummary,
            master: match.master,
            oracle: match.oracle,
            checks: match.checks,
            warnings: match.warnings,
            errors: match.errors,
            deduction: {
                elementName: preview.elementName,
                plannedAction: preview.plannedAction,
                existingAmount: preview.existingAmount,
                newAmount: preview.amount,
                resolveSource: preview.resolveSource,
                environment: preview.environment,
            },
            isResend,
            previousSentAt: row.recovery_sent_at
                ? String(row.recovery_sent_at)
                : null,
        };
    }
    async assessOracleOdEligibility(co, invoiceId, personalUsage) {
        const amount = Number(personalUsage) || 0;
        if (amount <= 0) {
            return {
                eligible: false,
                reason: 'No personal usage amount',
                matchSummary: 'No personal usage amount',
            };
        }
        const existing = await this.db.query(`SELECT i.*, e.person_number, e.display_name, e.phone_number, e.email,
        to_char(i.billing_month, 'YYYY-MM') AS month_key
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE i.id = $1 AND e.co = $2`, [invoiceId, co]);
        const row = existing.rows[0];
        if (!row) {
            return { eligible: false, reason: 'Invoice not found', matchSummary: 'Invoice not found' };
        }
        const personNumber = String(row.person_number || '').trim();
        if (!personNumber) {
            return {
                eligible: false,
                reason: 'Employee person number is missing in SIM master',
                matchSummary: 'Employee person number is missing in SIM master',
            };
        }
        try {
            const preview = await this.oracleRecovery.previewRecoveryAmount(personNumber, amount);
            const match = this.buildRecoveryMatchPreview(row, preview);
            const targetResolvable = !preview.resolveError &&
                (preview.plannedAction === 'create' || preview.plannedAction === 'update');
            const eligible = match.canSend && targetResolvable;
            const reason = eligible
                ? null
                : (match.matchSummary || preview.resolveError || 'Other Deduction is not eligible in Oracle for this employee');
            return {
                eligible,
                reason,
                matchSummary: reason,
                preview,
                match,
                personNumber,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                eligible: false,
                reason: message,
                matchSummary: message,
                preview: null,
                match: null,
                personNumber,
            };
        }
    }
    async tryPushRecoveryFromWorkflow(co, invoiceId, actor) {
        try {
            const result = await this.pushRecoveryFromWorkflow(co, invoiceId, actor);
            return { success: true, ...result };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message, row: null, oracle: null };
        }
    }
    async sendEmployeeDeductionConfirmationEmail(co, invoiceId) {
        const gridRow = await this.getGridRowByInvoiceId(co, invoiceId);
        if (!gridRow || Number(gridRow.personal_usage) <= 0) {
            return { sent: false, reason: 'No personal usage' };
        }
        if (!this.notifications) {
            return { sent: false, reason: 'Notifications unavailable' };
        }
        try {
            await this.notifications.sendApprovalConfirmationEmail(gridRow);
            return { sent: true };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Employee deduction email failed for invoice ${invoiceId}: ${message}`);
            return { sent: false, reason: message };
        }
    }
    async pushRecovery(co, invoiceId, actor) {
        this.assertAdmin(actor);
        let row;
        await this.db.withTransaction(async (client) => {
            const existing = await client.query(`SELECT i.*, e.person_number, e.display_name, e.phone_number, e.email,
          to_char(i.billing_month, 'YYYY-MM') AS month_key
         FROM invoices i
         INNER JOIN sim_employees e ON e.id = i.sim_employee_id
         WHERE i.id = $1 AND e.co = $2
         FOR UPDATE OF i`, [invoiceId, co]);
            row = existing.rows[0];
            if (!row) {
                throw new common_1.NotFoundException('Invoice not found');
            }
            if (row.recovery_status === 'processing') {
                throw new common_1.BadRequestException('Recovery push already in progress');
            }
            this.assertRecoveryEligible(row);
            await client.query(`UPDATE invoices
         SET recovery_status = 'processing',
             recovery_last_attempt_at = NOW()
         WHERE id = $1`, [invoiceId]);
        });
        const { personalUsage, personNumber, isResend } = this.assertRecoveryEligible(row);
        const preview = await this.getRecoveryPreview(co, invoiceId, actor);
        if (!preview.canSend) {
            await this.db.query(`UPDATE invoices
         SET recovery_status = 'pending',
             recovery_last_error = $1
         WHERE id = $2`, [preview.matchSummary || 'Employee data does not match Oracle', invoiceId]);
            throw new common_1.BadRequestException(preview.matchSummary || 'Employee data does not match Oracle');
        }
        let oracleResult;
        try {
            oracleResult = await this.oracleRecovery.pushRecoveryAmount(personNumber, personalUsage);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Oracle recovery push failed for invoice ${invoiceId}: ${message}`);
            await this.db.query(`UPDATE invoices
         SET recovery_status = 'failed',
             recovery_last_error = $1,
             recovery_last_attempt_at = NOW()
         WHERE id = $2`, [message, invoiceId]);
            await this.auditLog.log({
                co,
                actorEmail: actor?.email || 'unknown',
                actorName: actor?.name,
                action: 'invoice.recovery_push_failed',
                entityType: 'invoice',
                entityId: invoiceId,
                summary: `Oracle recovery failed for ${row.phone_number}`,
                details: {
                    personNumber,
                    personalUsage,
                    error: message,
                },
            });
            throw new common_1.BadRequestException(`Oracle recovery failed: ${message}`);
        }
        await this.db.query(`UPDATE invoices
       SET approval_status = 'recovery_sent',
           recovery_status = 'sent',
           recovery_sent_at = NOW(),
           recovery_last_error = NULL,
           recovery_last_attempt_at = NOW(),
           oracle_recovery_ref = $1::jsonb
       WHERE id = $2`, [JSON.stringify(oracleResult), invoiceId]);
        const month = String(row.month_key);
        const gridRow = (await this.getGridByMonth(co, month)).rows.find((item) => item.invoice_id === invoiceId);
        if (!gridRow) {
            throw new common_1.NotFoundException('Invoice row not found after recovery push');
        }
        await this.auditLog.log({
            co,
            actorEmail: actor?.email || 'unknown',
            actorName: actor?.name,
            action: isResend ? 'invoice.recovery_resend' : 'invoice.recovery_push',
            entityType: 'invoice',
            entityId: invoiceId,
            summary: `${isResend ? 'Re-sent' : 'Sent'} AED ${personalUsage.toFixed(2)} recovery to Oracle for ${row.phone_number} (${personNumber})`,
            details: {
                month,
                personNumber,
                personalUsage,
                resend: isResend,
                oracle: oracleResult,
            },
        });
        return { row: gridRow, oracle: oracleResult };
    }
    async pushRecoveryFromWorkflow(co, invoiceId, actor) {
        const precheck = await this.db.query(`SELECT i.approval_status, i.recovery_status, i.oracle_recovery_ref, i.personal_usage
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE i.id = $1 AND e.co = $2`, [invoiceId, co]);
        const pre = precheck.rows[0];
        const prePersonalUsage = Number(pre?.personal_usage) || 0;
        if (prePersonalUsage <= 0) {
            await this.db.query(`UPDATE invoices
         SET approval_status = 'confirmed_by_user',
             recovery_status = NULL,
             recovery_last_error = NULL
         WHERE id = $1`, [invoiceId]);
            const existingRow = await this.getGridRowByInvoiceId(co, invoiceId);
            return { row: existingRow, oracle: null };
        }
        if (pre?.approval_status === 'recovery_sent' && pre?.recovery_status === 'sent' && pre?.oracle_recovery_ref) {
            const existingRow = await this.getGridRowByInvoiceId(co, invoiceId);
            return { row: existingRow, oracle: pre.oracle_recovery_ref };
        }
        let row;
        await this.db.withTransaction(async (client) => {
            const existing = await client.query(`SELECT i.*, e.person_number, e.display_name, e.phone_number, e.email,
          to_char(i.billing_month, 'YYYY-MM') AS month_key
         FROM invoices i
         INNER JOIN sim_employees e ON e.id = i.sim_employee_id
         WHERE i.id = $1 AND e.co = $2
         FOR UPDATE OF i`, [invoiceId, co]);
            row = existing.rows[0];
            if (!row) {
                throw new common_1.NotFoundException('Invoice not found');
            }
            if (row.recovery_status === 'processing') {
                throw new common_1.BadRequestException('Recovery push already in progress');
            }
            this.assertRecoveryEligible(row);
            await client.query(`UPDATE invoices
         SET recovery_status = 'processing',
             recovery_last_attempt_at = NOW()
         WHERE id = $1`, [invoiceId]);
        });
        const { personalUsage, personNumber, isResend } = this.assertRecoveryEligible(row);
        const preview = await this.getRecoveryPreviewInternal(co, invoiceId);
        if (!preview.canSend) {
            await this.db.query(`UPDATE invoices
         SET recovery_status = 'pending',
             recovery_last_error = $1
         WHERE id = $2`, [preview.matchSummary || 'Employee data does not match Oracle', invoiceId]);
            throw new common_1.BadRequestException(preview.matchSummary || 'Employee data does not match Oracle');
        }
        let oracleResult;
        try {
            oracleResult = await this.oracleRecovery.pushRecoveryAmount(personNumber, personalUsage);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Oracle recovery push failed for invoice ${invoiceId}: ${message}`);
            await this.db.query(`UPDATE invoices
         SET recovery_status = 'failed',
             recovery_last_error = $1,
             recovery_last_attempt_at = NOW()
         WHERE id = $2`, [message, invoiceId]);
            await this.auditLog.log({
                co,
                actorEmail: actor?.email || 'unknown',
                actorName: actor?.name,
                action: 'invoice.recovery_push_failed',
                entityType: 'invoice',
                entityId: invoiceId,
                summary: `Oracle recovery failed for ${row.phone_number}`,
                details: {
                    personNumber,
                    personalUsage,
                    error: message,
                    workflow: 'recovery_request',
                },
            });
            throw new common_1.BadRequestException(`Oracle recovery failed: ${message}`);
        }
        await this.db.query(`UPDATE invoices
       SET approval_status = 'recovery_sent',
           recovery_status = 'sent',
           recovery_sent_at = NOW(),
           recovery_last_error = NULL,
           recovery_last_attempt_at = NOW(),
           oracle_recovery_ref = $1::jsonb
       WHERE id = $2`, [JSON.stringify(oracleResult), invoiceId]);
        const month = String(row.month_key);
        let gridRow = await this.getGridRowByInvoiceId(co, invoiceId);
        if (!gridRow) {
            gridRow = (await this.getGridByMonth(co, month)).rows.find((item) => String(item.invoice_id) === String(invoiceId)) ?? null;
        }
        if (!gridRow) {
            gridRow = {
                invoice_id: invoiceId,
                invoice_code: row.invoice_code,
                display_name: row.display_name,
                phone_number: row.phone_number,
                month_key: month,
                approval_status: 'recovery_sent',
            };
        }
        await this.auditLog.log({
            co,
            actorEmail: actor?.email || 'unknown',
            actorName: actor?.name,
            action: 'invoice.recovery_push_approved',
            entityType: 'invoice',
            entityId: invoiceId,
            summary: `Approved recovery workflow — sent AED ${personalUsage.toFixed(2)} to Oracle for ${row.phone_number} (${personNumber})`,
            details: {
                month,
                personNumber,
                personalUsage,
                resend: isResend,
                oracle: oracleResult,
                workflow: 'recovery_request',
            },
        });
        return { row: gridRow, oracle: oracleResult };
    }
    async pushRecoveryReady(co, invoiceIds, month, actor) {
        this.assertAdmin(actor);
        let targetIds = [];
        if (month) {
            const grid = await this.getGridByMonth(co, month);
            targetIds = grid.rows
                .filter((row) => row.approval_status === 'ready_for_recovery')
                .map((row) => row.invoice_id);
        }
        else if (invoiceIds?.length) {
            targetIds = invoiceIds;
        }
        if (invoiceIds?.length && month) {
            const idSet = new Set(invoiceIds);
            targetIds = targetIds.filter((id) => idSet.has(id));
        }
        if (!targetIds.length) {
            throw new common_1.BadRequestException('No invoices ready for recovery');
        }
        const results = [];
        for (const invoiceId of targetIds) {
            try {
                const result = await this.pushRecovery(co, invoiceId, actor);
                results.push({
                    invoiceId,
                    ok: true,
                    row: result.row,
                    oracle: result.oracle,
                });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                results.push({ invoiceId, ok: false, error: message });
            }
        }
        return { results };
    }
    async listRecoverySent(co, options, actor) {
        this.assertAdmin(actor);
        const page = Math.max(1, options.page || 1);
        const pageSize = Math.min(100, Math.max(1, options.pageSize || 25));
        const offset = (page - 1) * pageSize;
        const params = [co];
        const conditions = [
            `e.co = $1`,
            `(i.approval_status IN ('ready_for_recovery', 'recovery_sent') OR i.recovery_status = 'failed')`,
        ];
        if (options.month) {
            params.push(`${options.month}-01`);
            conditions.push(`i.billing_month = $${params.length}::date`);
        }
        if (options.search?.trim()) {
            params.push(`%${options.search.trim()}%`);
            const idx = params.length;
            conditions.push(`(
        e.display_name ILIKE $${idx}
        OR e.person_number ILIKE $${idx}
        OR i.phone_number ILIKE $${idx}
        OR i.invoice_code ILIKE $${idx}
        OR CAST(i.id AS TEXT) ILIKE $${idx}
      )`);
        }
        const whereClause = conditions.join(' AND ');
        const summaryResult = await this.db.query(`SELECT
        COUNT(*)::int AS total_count,
        COALESCE(SUM(i.personal_usage), 0)::float AS total_amount,
        COUNT(*) FILTER (WHERE i.approval_status = 'ready_for_recovery' AND COALESCE(i.recovery_status, 'pending') <> 'failed')::int AS pending_count,
        COUNT(*) FILTER (WHERE i.approval_status = 'recovery_sent')::int AS sent_count,
        COUNT(*) FILTER (WHERE COALESCE(i.recovery_status, '') = 'failed')::int AS failed_count
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE ${whereClause}`, params);
        const listResult = await this.db.query(`SELECT
        i.id AS invoice_id,
        to_char(i.billing_month, 'YYYY-MM') AS month_key,
        i.phone_number,
        e.display_name,
        e.person_number,
        e.email,
        i.personal_usage,
        i.official_usage,
        COALESCE(i.amount_due, 0) AS invoice_total,
        i.approval_status,
        i.recovery_status,
        i.recovery_sent_at,
        i.recovery_last_error,
        i.recovery_last_attempt_at,
        i.oracle_recovery_ref,
        i.invoice_code,
        i.approval_submitted_at
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE ${whereClause}
       ORDER BY
        CASE
          WHEN COALESCE(i.recovery_status, '') = 'failed' THEN 0
          WHEN i.approval_status = 'ready_for_recovery' THEN 1
          ELSE 2
        END,
        i.recovery_sent_at DESC NULLS LAST,
        i.recovery_last_attempt_at DESC NULLS LAST,
        i.id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, pageSize, offset]);
        const rows = listResult.rows.map((row) => {
            const oracleRef = row.oracle_recovery_ref;
            const oracleEntryId = oracleRef?.oracleResponse?.ElementEntryId
                ?? oracleRef?.oracleResponse?.ElementEntryValueId
                ?? oracleRef?.elementEntryId
                ?? oracleRef?.ElementEntryId
                ?? oracleRef?.entryId
                ?? oracleRef?.id
                ?? null;
            let status = 'pending';
            if (row.approval_status === 'recovery_sent') {
                status = 'sent';
            }
            else if (row.recovery_status === 'failed') {
                status = 'failed';
            }
            else if (row.approval_status === 'ready_for_recovery') {
                status = row.recovery_status === 'failed' ? 'failed' : 'pending';
            }
            return {
                invoice_id: row.invoice_id,
                month: String(row.month_key),
                month_label: (0, invoice_billing_util_1.formatBillingMonthLabel)(String(row.month_key)),
                phone_number: row.phone_number,
                display_name: row.display_name ?? null,
                person_number: row.person_number ?? null,
                email: row.email ?? null,
                personal_usage: Number(row.personal_usage) || 0,
                official_usage: Number(row.official_usage) || 0,
                invoice_total: Number(row.invoice_total) || 0,
                status,
                recovery_status: row.recovery_status ?? null,
                recovery_sent_at: row.recovery_sent_at
                    ? String(row.recovery_sent_at)
                    : null,
                recovery_last_error: row.recovery_last_error ?? null,
                recovery_last_attempt_at: row.recovery_last_attempt_at
                    ? String(row.recovery_last_attempt_at)
                    : null,
                approval_submitted_at: row.approval_submitted_at
                    ? String(row.approval_submitted_at)
                    : null,
                invoice_code: row.invoice_code ?? null,
                oracle_entry_id: oracleEntryId != null ? String(oracleEntryId) : null,
                oracle_action: oracleRef?.action ?? null,
                oracle_element_name: oracleRef?.elementName ?? null,
                oracle_source: oracleRef?.source ?? null,
                oracle_amount: oracleRef?.amount !== undefined && oracleRef?.amount !== null
                    ? Number(oracleRef.amount)
                    : null,
                oracle_environment: 'iabney.fa.ocs.oraclecloud.com (Production)',
                oracle_ref: oracleRef,
            };
        });
        const summaryRow = summaryResult.rows[0];
        return {
            rows,
            pagination: {
                page,
                pageSize,
                total: Number(summaryRow?.total_count) || 0,
                totalPages: Math.ceil((Number(summaryRow?.total_count) || 0) / pageSize),
            },
            summary: {
                totalCount: Number(summaryRow?.total_count) || 0,
                totalAmount: Number(summaryRow?.total_amount) || 0,
                pendingCount: Number(summaryRow?.pending_count) || 0,
                sentCount: Number(summaryRow?.sent_count) || 0,
                failedCount: Number(summaryRow?.failed_count) || 0,
            },
        };
    }
    async getOracleOtherDeductionStatus(co, invoiceId) {
        const existing = await this.db.query(`SELECT i.personal_usage, e.person_number
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE i.id = $1 AND e.co = $2`, [invoiceId, co]);
        const row = existing.rows[0];
        if (!row) {
            return { invoiceId: String(invoiceId), applicable: false, present: null };
        }
        const personalUsage = Number(row.personal_usage) || 0;
        const personNumber = String(row.person_number || '').trim();
        if (!personNumber) {
            return {
                invoiceId: String(invoiceId),
                applicable: true,
                needsRecovery: personalUsage > 0,
                present: false,
                error: 'Person number missing',
            };
        }
        try {
            const resolved = await this.oracleRecovery.resolveRecoveryTarget(personNumber);
            if (!resolved.target) {
                return {
                    invoiceId: String(invoiceId),
                    applicable: true,
                    needsRecovery: personalUsage > 0,
                    present: false,
                    error: resolved.error || 'Oracle deduction element not found',
                };
            }
            return {
                invoiceId: String(invoiceId),
                applicable: true,
                needsRecovery: personalUsage > 0,
                present: resolved.target.existingAmount !== null,
                elementName: resolved.target.elementName || null,
                existingAmount: resolved.target.existingAmount,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                invoiceId: String(invoiceId),
                applicable: true,
                needsRecovery: personalUsage > 0,
                present: false,
                error: message,
            };
        }
    }
    async getOracleOtherDeductionStatusBatch(co, invoiceIds) {
        const unique = [...new Set((invoiceIds || []).map((id) => String(id)).filter(Boolean))];
        const statuses = {};
        const chunkSize = 4;
        for (let i = 0; i < unique.length; i += chunkSize) {
            const chunk = unique.slice(i, i + chunkSize);
            const results = await Promise.all(chunk.map((invoiceId) => this.getOracleOtherDeductionStatus(co, invoiceId)));
            for (const result of results) {
                statuses[result.invoiceId] = result;
            }
        }
        return { statuses };
    }
    async getPdfAttachment(co, id) {
        const result = await this.db.query(`SELECT i.pdf_storage_path, i.pdf_filename, i.invoice_code
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE i.id = $1 AND e.co = $2`, [id, co]);
        const row = result.rows[0];
        if (!row) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        const storagePath = row.pdf_storage_path;
        if (!storagePath || !fs.existsSync(storagePath)) {
            throw new common_1.NotFoundException('Bill PDF attachment not found');
        }
        return {
            path: storagePath,
            filename: row.pdf_filename ||
                `${row.invoice_code || `invoice-${id}`}.pdf`,
        };
    }
    async sendBulkEmails(co, month, simEmployeeIds, actor) {
        const grid = await this.getGridByMonth(co, month);
        let targets = grid.rows.filter((row) => (row.exceeded_amount ?? 0) > 0);
        if (simEmployeeIds?.length) {
            const idSet = new Set(simEmployeeIds);
            targets = targets.filter((row) => idSet.has(row.sim_employee_id));
        }
        if (!targets.length) {
            throw new common_1.BadRequestException('No invoice rows selected for email');
        }
        const result = await this.notifications.sendInvoiceBulkEmails(targets, month);
        await this.auditLog.log({
            co,
            actorEmail: actor?.email || 'unknown',
            actorName: actor?.name,
            action: 'invoice.email_bulk',
            entityType: 'invoice_batch',
            summary: `Sent ${targets.length} invoice email(s) for ${(0, invoice_billing_util_1.formatBillingMonthLabel)(month)}`,
            details: {
                month,
                count: targets.length,
                simEmployeeIds: targets.map((row) => row.sim_employee_id),
            },
        });
        return result;
    }
    async ensureInvoiceRejectColumns() {
        if (this._rejectColumnsReady)
            return;
        await this.db.query(`ALTER TABLE invoices_data ADD COLUMN IF NOT EXISTS excess_reject_reason TEXT`);
        await this.db.query(`ALTER TABLE invoices_data ADD COLUMN IF NOT EXISTS excess_rejected_by VARCHAR(255)`);
        await this.db.query(`ALTER TABLE invoices_data ADD COLUMN IF NOT EXISTS excess_rejected_at TIMESTAMPTZ`);
        await this.db.query(`CREATE OR REPLACE VIEW invoices AS
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
        WHERE invoices_data.hidden = false`);
        this._rejectColumnsReady = true;
    }
    async sendSingleEmail(co, simEmployeeId, month, actor) {
        const grid = await this.getGridByMonth(co, month);
        const row = grid.rows.find((item) => item.sim_employee_id === simEmployeeId);
        if (!row) {
            throw new common_1.NotFoundException('Invoice row not found for this employee');
        }
        if ((row.exceeded_amount ?? 0) <= 0) {
            throw new common_1.BadRequestException('No package excess — employee email not required');
        }
        const result = await this.notifications.sendInvoiceRowEmail(row, month);
        if (!result.success) {
            throw new common_1.BadRequestException(result.error || 'Could not send email');
        }
        const refreshed = await this.getGridByMonth(co, month);
        const updatedRow = refreshed.rows.find((item) => item.sim_employee_id === simEmployeeId);
        await this.auditLog.log({
            co,
            actorEmail: actor?.email || 'unknown',
            actorName: actor?.name,
            action: 'invoice.email_single',
            entityType: 'invoice',
            entityId: row.invoice_id,
            summary: `Sent invoice email to ${row.display_name || row.phone_number}`,
            details: {
                month,
                simEmployeeId,
                phoneNumber: row.phone_number,
                recipient: row.email,
            },
        });
        return { ...result, row: updatedRow };
    }
};
exports.InvoiceService = InvoiceService;
exports.InvoiceService = InvoiceService = InvoiceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => notification_service_1.NotificationService))),
    __param(7, (0, common_1.Inject)((0, common_1.forwardRef)(() => excess_approval_service_1.ExcessApprovalService))),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        claude_invoice_parser_1.ClaudeInvoiceParser,
        invoice_call_service_1.InvoiceCallService,
        audit_log_service_1.AuditLogService,
        sim_master_service_1.SimMasterService,
        notification_service_1.NotificationService,
        oracle_recovery_service_1.OracleRecoveryService,
        excess_approval_service_1.ExcessApprovalService])
], InvoiceService);
//# sourceMappingURL=invoice.service.js.map