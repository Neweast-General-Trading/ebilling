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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MonthlyDeductionReportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonthlyDeductionReportService = void 0;
const common_1 = require("@nestjs/common");
const XLSX = __importStar(require("xlsx"));
const database_service_1 = require("../database/database.service");
const mail_config_1 = require("../config/mail.config");
const invoice_billing_util_1 = require("./invoice-billing.util");
const monthly_deduction_email_template_1 = require("../notifications/monthly-deduction-email.template");
const REPORT_TO = ['sona.jacob@neweast.co', 'Vinod.Kumar@neweast.co'];
const FREEZE_NOTE = 'Approvals close at the end of the 17th (freeze from 18th 00:00 Asia/Dubai). Oracle Other Deduction is submitted in one batch at that cut-off. Pending approval requests are NOT included and will carry forward to the next billing cycle.';
function dubaiParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dubai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type)?.value || '';
    return {
        year: Number(get('year')),
        month: Number(get('month')),
        day: Number(get('day')),
    };
}
function previousBillingMonthKey(date = new Date()) {
    const { year, month } = dubaiParts(date);
    const prev = new Date(Date.UTC(year, month - 2, 1));
    return prev.toISOString().slice(0, 7);
}
function oracleStatusFromRow(row) {
    const recovery = String(row.recovery_status || '').toLowerCase();
    const approval = String(row.approval_status || '').toLowerCase();
    const error = String(row.recovery_last_error || '').trim();
    if (recovery === 'sent' || approval === 'recovery_sent') {
        return {
            oracleStatus: 'Sent to Oracle',
            oracleNote: 'Deduction posted successfully. Do not enter again in Oracle.',
            category: 'sent',
        };
    }
    if (recovery === 'failed') {
        return {
            oracleStatus: 'Failed — NOT sent to Oracle',
            oracleNote: error || 'Oracle rejected or failed the deduction. Manual Other Deduction required.',
            category: 'failed',
        };
    }
    return {
        oracleStatus: 'Approved — NOT sent to Oracle',
        oracleNote: error || 'Approved in eBilling but Other Deduction was not posted to Oracle yet.',
        category: 'not_sent',
    };
}
let MonthlyDeductionReportService = MonthlyDeductionReportService_1 = class MonthlyDeductionReportService {
    db;
    logger = new common_1.Logger(MonthlyDeductionReportService_1.name);
    constructor(db) {
        this.db = db;
    }
    async ensureReportTable() {
        await this.db.query(`CREATE TABLE IF NOT EXISTS payroll_deduction_reports (
        id SERIAL PRIMARY KEY,
        co VARCHAR(64) NOT NULL,
        billing_month DATE NOT NULL,
        report_month VARCHAR(7) NOT NULL,
        sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        recipient_to TEXT NOT NULL,
        recipient_cc TEXT,
        row_count INTEGER NOT NULL DEFAULT 0,
        sent_count INTEGER NOT NULL DEFAULT 0,
        failed_count INTEGER NOT NULL DEFAULT 0,
        not_sent_count INTEGER NOT NULL DEFAULT 0,
        filename TEXT,
        details JSONB
      )`);
        await this.db.query(`CREATE UNIQUE INDEX IF NOT EXISTS payroll_deduction_reports_co_month_uidx
       ON payroll_deduction_reports (co, report_month)`);
    }
    async listCompanies() {
        const { rows } = await this.db.query(`SELECT DISTINCT co FROM sim_employees WHERE co IS NOT NULL AND TRIM(co) <> '' ORDER BY co`);
        return rows.map((r) => String(r.co));
    }
    async fetchApprovedPersonalRows(co, billingMonthKey) {
        const { rows } = await this.db.query(`SELECT
        ear.id AS request_id,
        ear.invoice_id,
        ear.personal_usage,
        ear.official_usage,
        ear.completed_at,
        i.invoice_code,
        i.approval_status,
        i.recovery_status,
        i.recovery_last_error,
        i.oracle_recovery_ref,
        to_char(i.billing_month, 'YYYY-MM') AS month_key,
        e.display_name,
        e.person_number,
        e.phone_number,
        e.email,
        COALESCE(e.total_amount, e.package_value, 0) AS package_total,
        i.amount_due AS invoice_total
       FROM excess_approval_requests ear
       INNER JOIN invoices i ON i.id = ear.invoice_id
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE ear.co = $1
         AND ear.status = 'approved'
         AND COALESCE(ear.personal_usage, 0) > 0
         AND to_char(i.billing_month, 'YYYY-MM') = $2
       ORDER BY e.display_name ASC, ear.id ASC`, [co, billingMonthKey]);
        return rows;
    }
    buildExcelBuffer(rows, billingMonthLabel) {
        const detailRows = rows.map((row) => {
            const oracle = oracleStatusFromRow(row);
            const packageTotal = Number(row.package_total) || 0;
            const invoiceTotal = Number(row.invoice_total) || 0;
            const excess = (0, invoice_billing_util_1.calculateExceededAmount)(invoiceTotal, packageTotal);
            return {
                Employee: row.display_name || '—',
                'Person Number': row.person_number || '—',
                Mobile: row.phone_number || '—',
                Email: row.email || '—',
                'Billing Month': billingMonthLabel,
                'Invoice Reference': row.invoice_code || '—',
                'Package Total (AED)': Number(packageTotal.toFixed(2)),
                'Invoice Total (AED)': Number(invoiceTotal.toFixed(2)),
                'Excess (AED)': Number(Number(excess || 0).toFixed(2)),
                'Official Usage (AED)': Number((Number(row.official_usage) || 0).toFixed(2)),
                'Personal Deduction (AED)': Number((Number(row.personal_usage) || 0).toFixed(2)),
                'Approval Status': 'Approved (matrix complete)',
                'Oracle Deduction Status': oracle.oracleStatus,
                'Oracle Note / Action': oracle.oracleNote,
                'Recovery Status (system)': row.recovery_status || '—',
                'Approved At': row.completed_at
                    ? new Date(row.completed_at).toLocaleString('en-GB', { timeZone: 'Asia/Dubai' })
                    : '—',
            };
        });
        const summary = [
            { Metric: 'Billing month', Value: billingMonthLabel },
            { Metric: 'Approved personal recoveries', Value: detailRows.length },
            {
                Metric: 'Total personal AED',
                Value: Number(detailRows.reduce((sum, r) => sum + Number(r['Personal Deduction (AED)'] || 0), 0).toFixed(2)),
            },
            {
                Metric: 'Sent to Oracle',
                Value: detailRows.filter((r) => String(r['Oracle Deduction Status']).startsWith('Sent')).length,
            },
            {
                Metric: 'Failed — NOT sent',
                Value: detailRows.filter((r) => String(r['Oracle Deduction Status']).startsWith('Failed')).length,
            },
            {
                Metric: 'Approved — NOT sent',
                Value: detailRows.filter((r) => String(r['Oracle Deduction Status']).startsWith('Approved')).length,
            },
            {
                Metric: 'Freeze note',
                Value: FREEZE_NOTE,
            },
        ];
        const workbook = XLSX.utils.book_new();
        const summarySheet = XLSX.utils.json_to_sheet(summary);
        const detailSheet = XLSX.utils.json_to_sheet(detailRows.length
            ? detailRows
            : [{ Note: 'No approved personal deductions for this billing month.' }]);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
        XLSX.utils.book_append_sheet(workbook, detailSheet, 'Deductions');
        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }
    async sendReportForCompany(co, options = {}) {
        await this.ensureReportTable();
        const billingMonthKey = options.billingMonthKey || previousBillingMonthKey(options.asOf || new Date());
        const billingMonthLabel = (0, invoice_billing_util_1.formatBillingMonthLabel)(billingMonthKey);
        const reportMonth = billingMonthKey;
        if (!options.force) {
            const existing = await this.db.query(`SELECT id FROM payroll_deduction_reports WHERE co = $1 AND report_month = $2 LIMIT 1`, [co, reportMonth]);
            if (existing.rows[0]) {
                return {
                    co,
                    billingMonthKey,
                    skipped: true,
                    reason: 'already_sent',
                };
            }
        }
        const rows = await this.fetchApprovedPersonalRows(co, billingMonthKey);
        const classified = rows.map((row) => ({ row, ...oracleStatusFromRow(row) }));
        const sentCount = classified.filter((r) => r.category === 'sent').length;
        const failedCount = classified.filter((r) => r.category === 'failed').length;
        const notSentCount = classified.filter((r) => r.category === 'not_sent').length;
        const totalPersonal = classified.reduce((sum, r) => sum + (Number(r.row.personal_usage) || 0), 0);
        const buffer = this.buildExcelBuffer(rows, billingMonthLabel);
        const asOf = options.asOf || new Date();
        const reportDateLabel = asOf.toLocaleString('en-GB', {
            timeZone: 'Asia/Dubai',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
        const { subject, html } = (0, monthly_deduction_email_template_1.buildMonthlyPayrollDeductionEmail)({
            billingMonthLabel,
            reportDateLabel,
            totalRows: rows.length,
            sentCount,
            failedCount,
            notSentCount,
            totalPersonal,
            freezeNote: FREEZE_NOTE,
        });
        const filename = `eBilling-payroll-deductions-${billingMonthKey}-${co}.xlsx`;
        const deliverTo = REPORT_TO.map((email) => (0, mail_config_1.resolveMailRecipient)(email).deliverTo);
        const primaryTo = deliverTo[0];
        const cc = deliverTo.slice(1);
        await (0, mail_config_1.sendMail)({
            to: primaryTo,
            cc,
            subject,
            html,
            attachments: [
                {
                    filename,
                    content: buffer,
                    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
            ],
        });
        await this.db.query(`INSERT INTO payroll_deduction_reports
       (co, billing_month, report_month, recipient_to, recipient_cc, row_count, sent_count, failed_count, not_sent_count, filename, details)
       VALUES ($1, ($2 || '-01')::date, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
       ON CONFLICT (co, report_month) DO UPDATE SET
         sent_at = NOW(),
         recipient_to = EXCLUDED.recipient_to,
         recipient_cc = EXCLUDED.recipient_cc,
         row_count = EXCLUDED.row_count,
         sent_count = EXCLUDED.sent_count,
         failed_count = EXCLUDED.failed_count,
         not_sent_count = EXCLUDED.not_sent_count,
         filename = EXCLUDED.filename,
         details = EXCLUDED.details`, [
            co,
            reportMonth,
            primaryTo,
            cc.join(','),
            rows.length,
            sentCount,
            failedCount,
            notSentCount,
            filename,
            JSON.stringify({
                totalPersonal,
                invoiceIds: rows.map((r) => r.invoice_id),
            }),
        ]);
        this.logger.log(`Payroll deduction report sent for ${co} / ${billingMonthKey}: ${rows.length} row(s)`);
        return {
            co,
            billingMonthKey,
            skipped: false,
            rowCount: rows.length,
            sentCount,
            failedCount,
            notSentCount,
            totalPersonal,
            filename,
        };
    }
    async runScheduledReports(options = {}) {
        const companies = await this.listCompanies();
        const results = [];
        for (const co of companies) {
            try {
                results.push(await this.sendReportForCompany(co, options));
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                this.logger.error(`Payroll deduction report failed for ${co}: ${message}`);
                results.push({ co, skipped: false, error: message });
            }
        }
        return { results };
    }
};
exports.MonthlyDeductionReportService = MonthlyDeductionReportService;
exports.MonthlyDeductionReportService = MonthlyDeductionReportService = MonthlyDeductionReportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], MonthlyDeductionReportService);
//# sourceMappingURL=monthly-deduction-report.service.js.map
