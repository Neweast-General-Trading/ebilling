"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const invoice_billing_util_1 = require("../invoice/invoice-billing.util");
let DashboardService = class DashboardService {
    db;
    constructor(db) {
        this.db = db;
    }
    async resolveMonth(co, month) {
        if (month === 'all')
            return 'all';
        if (month)
            return month;
        const latest = await this.db.query(`SELECT to_char(i.billing_month, 'YYYY-MM') AS month
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE e.co = $1
       ORDER BY i.billing_month DESC
       LIMIT 1`, [co]);
        return latest.rows[0]?.month ?? null;
    }
    async getDashboard(co, month) {
        const selectedMonth = await this.resolveMonth(co, month);
        const simStats = await this.db.query(`SELECT
        COUNT(*)::text AS active_total,
        COUNT(*) FILTER (WHERE line_type = 'mobile')::text AS mobile_total,
        COUNT(*) FILTER (WHERE line_type = 'landline')::text AS landline_total,
        COUNT(*) FILTER (WHERE line_type = 'department')::text AS department_total
       FROM sim_employees
       WHERE co = $1 AND is_active = TRUE`, [co]);
        const monthBreakdown = await this.db.query(`SELECT
        to_char(i.billing_month, 'YYYY-MM') AS month,
        COUNT(*)::text AS count,
        COALESCE(SUM(i.amount_due), 0)::text AS total_invoice,
        COALESCE(SUM(
          CASE
            WHEN i.approval_status IN ('ready_for_recovery', 'recovery_sent')
              THEN COALESCE(i.personal_usage, 0)
            WHEN i.approval_status IN ('confirmed_by_user', 'pending_approval', 'draft')
              THEN GREATEST(COALESCE(i.amount_due, 0) - COALESCE(e.total_amount, e.package_value, 0), 0)
            ELSE 0
          END
        ), 0)::text AS total_excess
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE e.co = $1
       GROUP BY i.billing_month
       ORDER BY i.billing_month DESC`, [co]);
        let billing = {
            month: selectedMonth,
            label: selectedMonth ? (0, invoice_billing_util_1.formatBillingMonthLabel)(selectedMonth) : null,
            invoiceCount: 0,
            totalPackage: 0,
            totalInvoice: 0,
            totalPersonalUsage: 0,
            totalExcess: 0,
            positiveExcessCount: 0,
            emailsSent: 0,
            emailsPending: 0,
            topExcess: [],
        };
        if (selectedMonth) {
            const isAllMonths = selectedMonth === 'all';
            const queryParams = [co];
            let monthFilter = '';
            if (!isAllMonths) {
                queryParams.push(`${selectedMonth}-01`);
                monthFilter = 'AND i.billing_month = $2::date';
            }
            const rows = await this.db.query(`SELECT
          e.id AS sim_employee_id,
          e.display_name,
          e.email,
          e.line_type,
          COALESCE(e.package_value, 0) AS package_value,
          COALESCE(e.vat_amount, 0) AS vat_amount,
          COALESCE(e.additional_amount, 0) AS additional_amount,
          i.phone_number,
          to_char(i.billing_month, 'YYYY-MM') AS billing_month,
          COALESCE(e.total_amount, e.package_value, 0) AS package_total,
          COALESCE(i.amount_due, 0) AS invoice_total,
          i.personal_usage,
          i.approval_status,
          email_log.sent_at AS email_sent_at
         FROM invoices i
         INNER JOIN sim_employees e ON e.id = i.sim_employee_id
         LEFT JOIN LATERAL (
           SELECT el.sent_at
           FROM email_logs el
           WHERE el.sim_employee_id = e.id
             AND el.billing_month = i.billing_month
             AND el.status = 'sent'
           ORDER BY el.sent_at DESC
           LIMIT 1
         ) email_log ON TRUE
         WHERE e.co = $1 ${monthFilter}`, queryParams);
            let totalPackage = 0;
            let totalInvoice = 0;
            let totalPersonalUsage = 0;
            let totalExcess = 0;
            let positiveExcessCount = 0;
            let emailsSent = 0;
            const topExcess = rows.rows
                .map((row) => {
                const packageTotal = Number(row.package_total) || 0;
                const invoiceTotal = Number(row.invoice_total) || 0;
                const personalUsage = row.personal_usage === null || row.personal_usage === undefined
                    ? null
                    : Number(row.personal_usage);
                const officialUsage = row.official_usage === null || row.official_usage === undefined
                    ? null
                    : Number(row.official_usage);
                const exceededAmount = (0, invoice_billing_util_1.calculateExceededAmount)(invoiceTotal, packageTotal);
                const excess = (0, invoice_billing_util_1.calculateExcess)(personalUsage, row.approval_status, exceededAmount);
                totalPackage += packageTotal;
                totalInvoice += invoiceTotal;
                totalPersonalUsage += personalUsage ?? 0;
                totalExcess += excess ?? 0;
                if ((excess ?? 0) > 0)
                    positiveExcessCount += 1;
                if (row.email_sent_at)
                    emailsSent += 1;
                return {
                    sim_employee_id: Number(row.sim_employee_id),
                    display_name: row.display_name,
                    phone_number: row.phone_number,
                    email: row.email ?? null,
                    line_type: row.line_type ?? null,
                    package_value: Number(row.package_value) || 0,
                    vat_amount: Number(row.vat_amount) || 0,
                    additional_amount: Number(row.additional_amount) || 0,
                    package_total: packageTotal,
                    invoice_total: invoiceTotal,
                    personal_usage: personalUsage,
                    official_usage: officialUsage,
                    excess: excess ?? 0,
                    email_sent_at: row.email_sent_at
                        ? String(row.email_sent_at)
                        : null,
                    month: row.billing_month ?? null,
                };
            })
                .sort((a, b) => b.excess - a.excess)
                .slice(0, 10);
            const billingLabel = isAllMonths
                ? 'All months'
                : (0, invoice_billing_util_1.formatBillingMonthLabel)(selectedMonth);
            billing = {
                month: selectedMonth,
                label: billingLabel,
                invoiceCount: rows.rows.length,
                totalPackage,
                totalInvoice,
                totalPersonalUsage,
                totalExcess,
                positiveExcessCount,
                emailsSent,
                emailsPending: rows.rows.length - emailsSent,
                topExcess,
            };
        }
        const sim = simStats.rows[0];
        const approvalStatsResult = await this.db.query(`SELECT
        COUNT(*) FILTER (WHERE i.approval_status = 'pending_approval')::text AS pending_approval,
        COUNT(*) FILTER (WHERE i.approval_status = 'waiting_confirmation')::text AS waiting_confirmation,
        COUNT(*) FILTER (WHERE i.approval_status = 'ready_for_recovery')::text AS ready_for_recovery,
        COALESCE(SUM(i.approval_email_count), 0)::text AS approval_emails_sent
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE e.co = $1`, [co]);
        const approvalStatsRow = approvalStatsResult.rows[0] || {};
        const monthLabel = selectedMonth === 'all'
            ? 'All months'
            : selectedMonth
                ? (0, invoice_billing_util_1.formatBillingMonthLabel)(selectedMonth)
                : null;
        return {
            month: selectedMonth,
            monthLabel,
            simMaster: {
                active: Number(sim?.active_total ?? 0),
                mobile: Number(sim?.mobile_total ?? 0),
                landline: Number(sim?.landline_total ?? 0),
                department: Number(sim?.department_total ?? 0),
            },
            billing,
            months: monthBreakdown.rows.map((row) => ({
                month: row.month,
                label: (0, invoice_billing_util_1.formatBillingMonthLabel)(row.month),
                count: Number(row.count),
                totalInvoice: Number(row.total_invoice),
                totalExcess: Number(row.total_excess),
            })),
            approvalStats: {
                pendingApproval: Number(approvalStatsRow.pending_approval ?? 0),
                waitingConfirmation: Number(approvalStatsRow.waiting_confirmation ?? 0),
                readyForRecovery: Number(approvalStatsRow.ready_for_recovery ?? 0),
                approvalEmailsSent: Number(approvalStatsRow.approval_emails_sent ?? 0),
            },
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map