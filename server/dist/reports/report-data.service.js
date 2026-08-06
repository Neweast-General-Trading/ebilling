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
exports.ReportDataService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const invoice_billing_util_1 = require("../invoice/invoice-billing.util");
let ReportDataService = class ReportDataService {
    db;
    constructor(db) {
        this.db = db;
    }
    async buildSnapshot(co) {
        const employeesResult = await this.db.query(`SELECT
        id,
        display_name,
        phone_number,
        email,
        department_name,
        line_type,
        package_value,
        vat_amount,
        additional_amount,
        total_amount,
        is_active
       FROM sim_employees
       WHERE co = $1
       ORDER BY display_name`, [co]);
        const billingResult = await this.db.query(`SELECT
        e.id AS sim_employee_id,
        e.display_name,
        to_char(i.billing_month, 'YYYY-MM') AS month_key,
        i.phone_number,
        COALESCE(e.total_amount, e.package_value, 0) AS package_total,
        COALESCE(i.amount_due, 0) AS invoice_total,
        i.personal_usage,
        i.approval_status,
        COALESCE(i.overage_amount, 0) AS overage_amount,
        r.remarks,
        email_log.sent_at AS email_sent_at,
        i.invoice_code
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       LEFT JOIN monthly_remarks r
         ON r.sim_employee_id = e.id AND r.billing_month = i.billing_month
       LEFT JOIN LATERAL (
         SELECT el.sent_at
         FROM email_logs el
         WHERE el.sim_employee_id = e.id
           AND el.billing_month = i.billing_month
           AND el.status = 'sent'
         ORDER BY el.sent_at DESC
         LIMIT 1
       ) email_log ON TRUE
       WHERE e.co = $1
       ORDER BY i.billing_month DESC, e.display_name`, [co]);
        const employees = employeesResult.rows.map((row) => ({
            id: row.id,
            name: row.display_name || '—',
            phone: row.phone_number,
            email: row.email,
            department: row.department_name,
            lineType: row.line_type,
            packageValue: Number(row.package_value) || 0,
            vatAmount: Number(row.vat_amount) || 0,
            additionalAmount: Number(row.additional_amount) || 0,
            totalAmount: Number(row.total_amount ?? row.package_value) || 0,
            isActive: row.is_active !== false,
        }));
        const billingRows = billingResult.rows.map((row) => {
            const packageTotal = Number(row.package_total) || 0;
            const invoiceTotal = Number(row.invoice_total) || 0;
            const personalUsage = row.personal_usage === null || row.personal_usage === undefined
                ? null
                : Number(row.personal_usage);
            return {
                employeeId: row.sim_employee_id,
                employeeName: row.display_name,
                month: row.month_key,
                phone: row.phone_number,
                packageTotal,
                invoiceTotal,
                personalUsage,
                excess: (0, invoice_billing_util_1.calculateExcess)(personalUsage, row.approval_status),
                overage: Number(row.overage_amount) || 0,
                remarks: row.remarks,
                emailSent: Boolean(row.email_sent_at),
                invoiceCode: row.invoice_code,
            };
        });
        const billingMonths = [
            ...new Set(billingRows.map((row) => row.month)),
        ].sort();
        return {
            company: co,
            stats: {
                activeEmployees: employees.filter((row) => row.isActive).length,
                inactiveEmployees: employees.filter((row) => !row.isActive).length,
                billingRows: billingRows.length,
                billingMonths,
                totalSubscription: employees
                    .filter((row) => row.isActive)
                    .reduce((sum, row) => sum + row.totalAmount, 0),
                totalInvoiced: billingRows.reduce((sum, row) => sum + row.invoiceTotal, 0),
                totalExcess: billingRows.reduce((sum, row) => sum + (row.excess ?? 0), 0),
                emailsSent: billingRows.filter((row) => row.emailSent).length,
            },
            employees,
            billingRows,
        };
    }
};
exports.ReportDataService = ReportDataService;
exports.ReportDataService = ReportDataService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ReportDataService);
//# sourceMappingURL=report-data.service.js.map