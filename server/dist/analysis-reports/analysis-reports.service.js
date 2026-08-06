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
exports.AnalysisReportsService = void 0;
const common_1 = require("@nestjs/common");
const XLSX = require("xlsx");
const database_service_1 = require("../database/database.service");
const invoice_billing_util_1 = require("../invoice/invoice-billing.util");
function enumerateMonths(monthFrom, monthTo) {
    const months = [];
    const start = new Date(`${monthFrom}-01T00:00:00Z`);
    const end = new Date(`${monthTo}-01T00:00:00Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new common_1.BadRequestException('Invalid month range (use YYYY-MM)');
    }
    if (start > end) {
        throw new common_1.BadRequestException('monthFrom must be before or equal to monthTo');
    }
    const cursor = new Date(start);
    while (cursor <= end) {
        months.push(cursor.toISOString().slice(0, 7));
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return months;
}
function rowsToXlsxBuffer(rows, sheetName) {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || 'Report');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
let AnalysisReportsService = class AnalysisReportsService {
    db;
    constructor(db) {
        this.db = db;
    }
    getCatalog() {
        return [
            {
                id: 'period-billing',
                title: 'Billing report by period',
                description: 'Employee billing rows for selected months (id, code, name, package, excess, remarks…)',
                format: 'xlsx',
            },
            {
                id: 'monthly-invoices',
                title: 'Monthly invoice grid',
                description: 'All invoice rows for one billing month',
                format: 'xlsx',
            },
            {
                id: 'sim-master',
                title: 'SIM master export',
                description: 'Active SIM master employees with limits and contact details',
                format: 'xlsx',
            },
        ];
    }
    async listMonths(co) {
        const result = await this.db.query(`SELECT DISTINCT to_char(billing_month, 'YYYY-MM') AS month
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE e.co = $1
       ORDER BY month DESC`, [co]);
        return result.rows.map((row) => row.month);
    }
    mapPeriodRow(row) {
        const packageTotal = Number(row.package_value) || 0;
        const totalAmount = Number(row.total_amount) || packageTotal;
        const bill = Number(row.bill) || 0;
        const excess = (0, invoice_billing_util_1.calculateExceededAmount)(bill, totalAmount);
        return {
            month: row.month,
            id: row.person_number ?? '',
            code: row.invoice_code ?? '',
            name: row.display_name ?? '',
            package: packageTotal,
            additr: Number(row.additional_amount) || 0,
            total: totalAmount,
            bill,
            excess,
            personal: row.personal_usage === null || row.personal_usage === undefined
                ? ''
                : Number(row.personal_usage),
            official: row.official_usage === null || row.official_usage === undefined
                ? ''
                : Number(row.official_usage),
            'emp remarks': row.employee_remarks?.trim() || '',
            'hr remarks': row.admin_remarks?.trim() || '',
        };
    }
    async fetchPeriodRows(co, monthFrom, monthTo) {
        const months = enumerateMonths(monthFrom, monthTo);
        const rows = [];
        for (const month of months) {
            const billingMonth = `${month}-01`;
            const result = await this.db.query(`SELECT
          $3::text AS month,
          e.person_number,
          i.invoice_code,
          e.display_name,
          COALESCE(i.package_value, e.package_value, 0) AS package_value,
          COALESCE(e.additional_amount, 0) AS additional_amount,
          COALESCE(e.total_amount, e.package_value, 0) AS total_amount,
          COALESCE(i.amount_due, 0) AS bill,
          i.personal_usage,
          i.official_usage,
          r.employee_remarks,
          r.admin_remarks
        FROM sim_employees e
        LEFT JOIN invoices i
          ON i.sim_employee_id = e.id AND i.billing_month = $2::date
        LEFT JOIN monthly_remarks r
          ON r.sim_employee_id = e.id AND r.billing_month = $2::date
        WHERE e.co = $1 AND e.is_active = TRUE
        ORDER BY e.display_name`, [co, billingMonth, month]);
            for (const row of result.rows) {
                if (!row.invoice_code && Number(row.bill) === 0) {
                    continue;
                }
                rows.push(this.mapPeriodRow(row));
            }
        }
        return rows;
    }
    async exportPeriodExcel(co, monthFrom, monthTo) {
        if (!monthFrom || !monthTo) {
            throw new common_1.BadRequestException('monthFrom and monthTo are required (YYYY-MM)');
        }
        const rows = await this.fetchPeriodRows(co, monthFrom, monthTo);
        const exportRows = rows.map(({ month, ...rest }) => rest);
        return {
            buffer: rowsToXlsxBuffer(exportRows, 'Period Report'),
            filename: `ebilling-period-${monthFrom}_to_${monthTo}.xlsx`,
            rowCount: rows.length,
        };
    }
    async exportMonthlyInvoicesExcel(co, month) {
        if (!month) {
            throw new common_1.BadRequestException('month is required (YYYY-MM)');
        }
        const billingMonth = `${month}-01`;
        const result = await this.db.query(`SELECT
        e.person_number AS id,
        i.invoice_code AS code,
        e.display_name AS name,
        COALESCE(i.package_value, e.package_value, 0) AS package,
        COALESCE(e.additional_amount, 0) AS additr,
        COALESCE(e.total_amount, e.package_value, 0) AS total,
        COALESCE(i.amount_due, 0) AS bill,
        i.personal_usage AS personal,
        i.official_usage AS official,
        i.approval_status,
        r.employee_remarks AS "emp remarks",
        r.admin_remarks AS "hr remarks"
      FROM sim_employees e
      INNER JOIN invoices i ON i.sim_employee_id = e.id AND i.billing_month = $2::date
      LEFT JOIN monthly_remarks r ON r.sim_employee_id = e.id AND r.billing_month = $2::date
      WHERE e.co = $1
      ORDER BY e.display_name`, [co, billingMonth]);
        const rows = result.rows.map((row) => {
            const total = Number(row.total) || 0;
            const bill = Number(row.bill) || 0;
            return {
                ...row,
                excess: (0, invoice_billing_util_1.calculateExceededAmount)(bill, total),
                personal: row.personal === null ? '' : Number(row.personal),
                official: row.official === null ? '' : Number(row.official),
                'emp remarks': row['emp remarks']?.trim() || '',
                'hr remarks': row['hr remarks']?.trim() || '',
            };
        });
        return {
            buffer: rowsToXlsxBuffer(rows, 'Invoices'),
            filename: `ebilling-invoices-${month}.xlsx`,
            rowCount: rows.length,
        };
    }
    async exportMasterExcel(co) {
        const result = await this.db.query(`SELECT
        person_number AS "SAP ID",
        display_name AS name,
        phone_number AS phone,
        email,
        line_type AS type,
        package_value AS package,
        additional_amount AS additr,
        total_amount AS total,
        no_auto_mail AS "no auto mail",
        is_active AS active
      FROM sim_employees
      WHERE co = $1
      ORDER BY display_name`, [co]);
        const rows = result.rows.map((row) => ({
            ...row,
            'no auto mail': row['no auto mail'] ? 'yes' : 'no',
            active: row.active ? 'yes' : 'no',
        }));
        return {
            buffer: rowsToXlsxBuffer(rows, 'SIM Master'),
            filename: `ebilling-sim-master-${co}.xlsx`,
            rowCount: rows.length,
        };
    }
};
exports.AnalysisReportsService = AnalysisReportsService;
exports.AnalysisReportsService = AnalysisReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], AnalysisReportsService);
//# sourceMappingURL=analysis-reports.service.js.map
