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
exports.BillingReportService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const remarks_util_1 = require("../common/remarks.util");
let BillingReportService = class BillingReportService {
    db;
    constructor(db) {
        this.db = db;
    }
    async getMonthlyReport(co, month) {
        if (!month) {
            throw new common_1.BadRequestException('month query is required (YYYY-MM)');
        }
        const billingMonth = `${month}-01`;
        const result = await this.db.query(`SELECT
        e.id AS sim_employee_id,
        e.person_number,
        e.display_name,
        e.email,
        e.phone_number,
        e.position_name,
        e.department_name,
        COALESCE(i.package_value, e.package_value, 0) AS package_value,
        COALESCE(e.additional_amount, 0) AS additional_amount,
        COALESCE(e.total_amount, e.package_value, 0) AS total_amount,
        COALESCE(e.no_auto_mail, FALSE) AS no_auto_mail,
        COALESCE(i.overage_amount, 0) AS overage_amount,
        COALESCE(i.amount_due, 0) AS amount_due,
        COALESCE(i.package_value, e.package_value, 0) + COALESCE(i.overage_amount, 0) AS total_consumption,
        r.remarks,
        r.employee_remarks,
        r.admin_remarks,
        i.id AS invoice_id
      FROM sim_employees e
      LEFT JOIN invoices i
        ON i.sim_employee_id = e.id AND i.billing_month = $2::date
      LEFT JOIN monthly_remarks r
        ON r.sim_employee_id = e.id AND r.billing_month = $2::date
      WHERE e.co = $1 AND e.is_active = TRUE
      ORDER BY e.display_name`, [co, billingMonth]);
        return {
            month,
            rows: result.rows.map((row) => ({
                ...row,
                remarks: (0, remarks_util_1.formatCombinedRemarks)(row.employee_remarks, row.admin_remarks, row.remarks),
            })),
            summary: {
                totalEmployees: result.rows.length,
                withInvoice: result.rows.filter((r) => r.invoice_id).length,
                totalOverage: result.rows.reduce((sum, row) => sum + Number(row.overage_amount || 0), 0),
                totalDue: result.rows.reduce((sum, row) => sum + Number(row.amount_due || 0), 0),
            },
        };
    }
    async updateRemark(co, simEmployeeId, month, remarks) {
        return this.updateAdminRemark(co, simEmployeeId, month, remarks);
    }
    async updateAdminRemark(co, simEmployeeId, month, adminRemarks) {
        const employee = await this.db.query(`SELECT id FROM sim_employees WHERE id = $1 AND co = $2`, [simEmployeeId, co]);
        if (!employee.rows[0]) {
            throw new common_1.NotFoundException('Employee not found for this company');
        }
        const billingMonth = `${month}-01`;
        const normalized = adminRemarks?.trim() || null;
        await this.db.query(`INSERT INTO monthly_remarks (sim_employee_id, billing_month, admin_remarks)
       VALUES ($1, $2::date, $3)
       ON CONFLICT (sim_employee_id, billing_month)
       DO UPDATE SET admin_remarks = EXCLUDED.admin_remarks, updated_at = NOW()`, [simEmployeeId, billingMonth, normalized]);
        const current = await this.db.query(`SELECT remarks, employee_remarks, admin_remarks
       FROM monthly_remarks
       WHERE sim_employee_id = $1 AND billing_month = $2::date`, [simEmployeeId, billingMonth]);
        const row = current.rows[0] || {};
        return {
            success: true,
            employee_remarks: row.employee_remarks?.trim() || null,
            admin_remarks: row.admin_remarks?.trim() || null,
            remarks: (0, remarks_util_1.formatCombinedRemarks)(row.employee_remarks, row.admin_remarks, row.remarks),
        };
    }
};
exports.BillingReportService = BillingReportService;
exports.BillingReportService = BillingReportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], BillingReportService);
