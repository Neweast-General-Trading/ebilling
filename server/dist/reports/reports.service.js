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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const invoice_billing_util_1 = require("../invoice/invoice-billing.util");
const claude_report_planner_1 = require("./claude-report.planner");
const report_prompt_parser_1 = require("./report-prompt.parser");
const report_pdf_builder_1 = require("./report-pdf.builder");
const report_data_service_1 = require("./report-data.service");
const report_local_rules_1 = require("./report-local-rules");
const report_english_service_1 = require("./report-english.service");
let ReportsService = class ReportsService {
    db;
    reportData;
    claudePlanner;
    reportEnglish;
    planCache = new Map();
    planCacheMs = 120_000;
    constructor(db, reportData, claudePlanner, reportEnglish) {
        this.db = db;
        this.reportData = reportData;
        this.claudePlanner = claudePlanner;
        this.reportEnglish = reportEnglish;
    }
    async listMonths(co) {
        const result = await this.db.query(`SELECT to_char(i.billing_month, 'YYYY-MM') AS month
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE e.co = $1
       GROUP BY i.billing_month
       ORDER BY i.billing_month DESC`, [co]);
        return result.rows.map((row) => row.month);
    }
    async generatePdf(co, dto) {
        const built = await this.buildReport(co, dto);
        const english = await this.reportEnglish.preparePdfContent({
            title: built.title,
            insights: built.insights,
            rows: built.rows,
        });
        return (0, report_pdf_builder_1.buildReportPdf)({
            title: english.title,
            periodLabel: built.periodLabel,
            company: co,
            reportType: built.reportType,
            columns: built.columns,
            rows: english.rows,
            summary: built.summary,
            includeSummary: built.includeSummary,
            insights: english.insights,
            generatedAt: new Date(),
        });
    }
    async preview(co, dto) {
        const built = await this.buildReport(co, dto);
        return {
            periodLabel: built.periodLabel,
            rowCount: built.rows.length,
            availableMonths: built.availableMonths,
            usedClaude: built.usedClaude,
            insights: built.insights,
            resolvedOptions: {
                periodMode: built.resolved.periodMode,
                month: built.resolved.month,
                monthFrom: built.resolved.monthFrom,
                monthTo: built.resolved.monthTo,
                reportType: built.reportType,
                dataSource: built.dataSource,
                columns: built.columns,
                filters: built.filters,
                sortBy: built.sortBy,
                includeSummary: built.includeSummary,
                title: built.title,
            },
        };
    }
    async buildReport(co, dto) {
        const availableMonths = await this.listMonths(co);
        const snapshot = await this.reportData.buildSnapshot(co);
        const localRules = (0, report_local_rules_1.deriveLocalPromptRules)(dto.customPrompt, snapshot);
        const claudePlan = localRules && (0, report_local_rules_1.isDeterministicPackagePrompt)(dto.customPrompt)
            ? {
                dto,
                insights: localRules.insights,
                selectedEmployeeIds: localRules.selectedEmployeeIds,
                selectedBillingKeys: null,
                includeInactiveEmployees: false,
                usedClaude: false,
            }
            : await this.resolveClaudePlan(co, dto, snapshot, availableMonths);
        let resolved = claudePlan.usedClaude
            ? claudePlan.dto
            : (0, report_prompt_parser_1.applyPromptToReportDto)(dto, availableMonths);
        if (localRules) {
            resolved = { ...resolved, ...localRules.dtoPatch };
        }
        let selectedEmployeeIds = claudePlan.selectedEmployeeIds;
        let selectedBillingKeys = claudePlan.selectedBillingKeys;
        let insights = claudePlan.insights ?? localRules?.insights ?? null;
        if (localRules?.selectedEmployeeIds?.length) {
            selectedEmployeeIds = localRules.selectedEmployeeIds;
        }
        const dataSource = resolved.dataSource || 'invoices';
        const reportType = resolved.reportType || 'employee_detail';
        const columns = resolved.columns?.length && resolved.columns.length > 0
            ? resolved.columns
            : (0, report_prompt_parser_1.defaultColumnsForType)(reportType);
        const filters = resolved.filters || [];
        const sortBy = resolved.sortBy || 'name';
        const includeSummary = resolved.includeSummary ?? true;
        const includeInactive = claudePlan.includeInactiveEmployees;
        let periodLabel = 'SIM Master — current subscriptions';
        let mapped = [];
        if (dataSource === 'sim_master') {
            mapped = (await this.fetchMasterRows(co, includeInactive)).map((row) => this.mapMasterRow(row));
            periodLabel = includeInactive
                ? 'SIM Master — all employees'
                : 'SIM Master — active subscriptions';
        }
        else if (dataSource === 'combined') {
            mapped = await this.fetchCombinedRows(co, includeInactive);
            periodLabel = 'SIM Master + latest invoice billing';
        }
        else {
            if (!availableMonths.length && !snapshot.billingRows.length) {
                throw new common_1.BadRequestException('No billing months available for reports');
            }
            const period = this.resolvePeriod(resolved, availableMonths, snapshot);
            periodLabel = period.periodLabel;
            mapped = (await this.fetchRows(co, period.monthFrom, period.monthTo)).map((row) => this.mapRow(row));
        }
        mapped = this.applySelection(mapped, {
            selectedEmployeeIds,
            selectedBillingKeys,
        });
        mapped = this.applyPackageThresholds(mapped, resolved, snapshot);
        const filtered = this.applyFilters(mapped, filters, dataSource);
        const sorted = this.sortRows(filtered, sortBy);
        const summary = this.buildSummary(sorted);
        const title = resolved.title?.trim() ||
            (dataSource === 'sim_master'
                ? 'SIM Master — Subscription totals'
                : dataSource === 'combined'
                    ? 'SIM Master & billing overview'
                    : `e& SIM Billing Report — ${periodLabel}`);
        return {
            availableMonths,
            resolved,
            dataSource,
            reportType,
            columns,
            filters,
            sortBy,
            includeSummary,
            periodLabel,
            title,
            rows: sorted,
            summary,
            insights,
            usedClaude: claudePlan.usedClaude,
        };
    }
    async resolveClaudePlan(co, dto, snapshot, availableMonths) {
        const prompt = dto.customPrompt?.trim();
        if (!prompt) {
            return this.claudePlanner.planReport(dto, snapshot, availableMonths);
        }
        const cacheKey = `${co}:${prompt}`;
        const cached = this.planCache.get(cacheKey);
        if (cached && Date.now() - cached.at < this.planCacheMs) {
            return cached.plan;
        }
        const plan = await this.claudePlanner.planReport(dto, snapshot, availableMonths);
        this.planCache.set(cacheKey, { at: Date.now(), plan });
        return plan;
    }
    applyPackageThresholds(rows, dto, snapshot) {
        if (dto.maxPackageTotal == null && dto.minPackageTotal == null) {
            return rows;
        }
        const amountByEmployee = new Map();
        for (const employee of snapshot.employees) {
            const amount = dto.packageAmountField === 'packageValue'
                ? employee.packageValue
                : employee.totalAmount;
            amountByEmployee.set(employee.id, amount);
        }
        return rows.filter((row) => {
            if (row.sim_employee_id === undefined)
                return true;
            const amount = amountByEmployee.get(row.sim_employee_id);
            if (amount === undefined)
                return false;
            if (dto.maxPackageTotal != null && amount >= dto.maxPackageTotal) {
                return false;
            }
            if (dto.minPackageTotal != null && amount <= dto.minPackageTotal) {
                return false;
            }
            return true;
        });
    }
    resolvePeriod(dto, availableMonths, snapshot) {
        const months = availableMonths.length > 0
            ? availableMonths
            : snapshot.stats.billingMonths;
        const sorted = [...months].sort();
        if (!sorted.length) {
            throw new common_1.BadRequestException('No billing months available for reports');
        }
        if (dto.periodMode === 'all') {
            const monthFrom = sorted[0];
            const monthTo = sorted[sorted.length - 1];
            return {
                monthFrom,
                monthTo,
                periodLabel: `All months (${(0, invoice_billing_util_1.formatBillingMonthLabel)(monthFrom)} – ${(0, invoice_billing_util_1.formatBillingMonthLabel)(monthTo)})`,
            };
        }
        if (dto.periodMode === 'range') {
            const monthFrom = dto.monthFrom || sorted[0];
            const monthTo = dto.monthTo || sorted[sorted.length - 1];
            if (monthFrom > monthTo) {
                throw new common_1.BadRequestException('monthFrom must be before monthTo');
            }
            return {
                monthFrom,
                monthTo,
                periodLabel: `${(0, invoice_billing_util_1.formatBillingMonthLabel)(monthFrom)} – ${(0, invoice_billing_util_1.formatBillingMonthLabel)(monthTo)}`,
            };
        }
        const month = dto.month || months[0];
        if (!sorted.includes(month)) {
            throw new common_1.BadRequestException(`Month ${month} has no invoice data`);
        }
        return {
            monthFrom: month,
            monthTo: month,
            periodLabel: (0, invoice_billing_util_1.formatBillingMonthLabel)(month),
        };
    }
    applySelection(rows, plan) {
        let result = rows;
        if (plan.selectedBillingKeys?.length) {
            const keys = new Set(plan.selectedBillingKeys);
            result = result.filter((row) => keys.has(`${row.sim_employee_id}:${row.month}`));
        }
        if (plan.selectedEmployeeIds?.length) {
            const ids = new Set(plan.selectedEmployeeIds);
            result = result.filter((row) => row.sim_employee_id !== undefined && ids.has(row.sim_employee_id));
        }
        return result;
    }
    async fetchRows(co, monthFrom, monthTo) {
        const result = await this.db.query(`SELECT
        to_char(i.billing_month, 'YYYY-MM') AS month_key,
        e.id AS sim_employee_id,
        e.display_name,
        i.phone_number,
        e.email,
        e.department_name,
        COALESCE(e.total_amount, e.package_value, 0) AS package_total,
        COALESCE(i.amount_due, 0) AS invoice_total,
        i.personal_usage,
        i.approval_status,
        COALESCE(i.overage_amount, 0) AS overage_amount,
        r.remarks,
        email_log.sent_at AS email_sent_at,
        i.id AS invoice_id
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
         AND i.billing_month >= $2::date
         AND i.billing_month <= $3::date
       ORDER BY i.billing_month DESC, e.display_name`, [co, `${monthFrom}-01`, `${monthTo}-01`]);
        return result.rows;
    }
    async fetchMasterRows(co, includeInactive = false) {
        const result = await this.db.query(`SELECT
        e.id AS sim_employee_id,
        e.display_name,
        e.phone_number,
        e.email,
        e.department_name,
        COALESCE(e.total_amount, e.package_value, 0) AS package_total,
        COALESCE(e.additional_amount, 0) AS additional_amount
       FROM sim_employees e
       WHERE e.co = $1 ${includeInactive ? '' : 'AND e.is_active = TRUE'}
       ORDER BY e.display_name`, [co]);
        return result.rows;
    }
    async fetchCombinedRows(co, includeInactive = false) {
        const masterRows = await this.fetchMasterRows(co, includeInactive);
        const latestResult = await this.db.query(`SELECT DISTINCT ON (e.id)
        to_char(i.billing_month, 'YYYY-MM') AS month_key,
        e.id AS sim_employee_id,
        e.display_name,
        i.phone_number,
        e.email,
        e.department_name,
        COALESCE(e.total_amount, e.package_value, 0) AS package_total,
        COALESCE(i.amount_due, 0) AS invoice_total,
        i.personal_usage,
        i.approval_status,
        COALESCE(i.overage_amount, 0) AS overage_amount,
        r.remarks,
        email_log.sent_at AS email_sent_at,
        i.id AS invoice_id
       FROM sim_employees e
       LEFT JOIN invoices i ON i.sim_employee_id = e.id
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
       WHERE e.co = $1 ${includeInactive ? '' : 'AND e.is_active = TRUE'}
       ORDER BY e.id, i.billing_month DESC NULLS LAST`, [co]);
        const latestByEmployee = new Map(latestResult.rows.map((row) => [row.sim_employee_id, row]));
        return masterRows.map((master) => {
            const invoice = latestByEmployee.get(master.sim_employee_id);
            if (invoice?.invoice_id) {
                return this.mapRow(invoice);
            }
            return this.mapMasterRow(master);
        });
    }
    mapRow(row) {
        const month = row.month_key;
        const packageTotal = Number(row.package_total) || 0;
        const invoiceTotal = Number(row.invoice_total) || 0;
        const personalUsage = row.personal_usage === null || row.personal_usage === undefined
            ? null
            : Number(row.personal_usage);
        return {
            sim_employee_id: row.sim_employee_id,
            month,
            monthLabel: (0, invoice_billing_util_1.formatBillingMonthLabel)(month),
            display_name: row.display_name,
            phone_number: row.phone_number,
            email: row.email,
            department_name: row.department_name,
            package_total: packageTotal,
            invoice_total: invoiceTotal,
            personal_usage: personalUsage,
            excess: (0, invoice_billing_util_1.calculateExcess)(personalUsage, row.approval_status),
            overage_amount: Number(row.overage_amount) || 0,
            remarks: row.remarks,
            email_sent_at: row.email_sent_at ? String(row.email_sent_at) : null,
        };
    }
    mapMasterRow(row) {
        const packageTotal = Number(row.package_total) || 0;
        return {
            sim_employee_id: row.sim_employee_id,
            month: 'master',
            monthLabel: 'SIM Master',
            display_name: row.display_name,
            phone_number: row.phone_number,
            email: row.email,
            department_name: row.department_name,
            package_total: packageTotal,
            invoice_total: 0,
            personal_usage: null,
            excess: null,
            overage_amount: Number(row.additional_amount) || 0,
            remarks: null,
            email_sent_at: null,
        };
    }
    applyFilters(rows, filters, dataSource = 'invoices') {
        if (!filters.length)
            return rows;
        return rows.filter((row) => {
            for (const filter of filters) {
                switch (filter) {
                    case 'positive_excess':
                        if (dataSource === 'sim_master')
                            break;
                        if ((row.excess ?? 0) <= 0)
                            return false;
                        break;
                    case 'zero_excess':
                        if (dataSource === 'sim_master')
                            break;
                        if ((row.excess ?? 0) !== 0)
                            return false;
                        break;
                    case 'negative_excess':
                        if (dataSource === 'sim_master')
                            break;
                        if ((row.excess ?? 0) >= 0)
                            return false;
                        break;
                    case 'has_invoice':
                        if (dataSource === 'sim_master')
                            break;
                        if (!row.invoice_total)
                            return false;
                        break;
                    case 'email_sent':
                        if (!row.email_sent_at)
                            return false;
                        break;
                    case 'email_pending':
                        if (row.email_sent_at || !row.email?.trim())
                            return false;
                        break;
                }
            }
            return true;
        });
    }
    sortRows(rows, sortBy) {
        const copy = [...rows];
        copy.sort((a, b) => {
            switch (sortBy) {
                case 'excess_desc':
                    return (b.excess ?? 0) - (a.excess ?? 0);
                case 'invoice_desc':
                    return b.invoice_total - a.invoice_total;
                case 'month':
                    return b.month.localeCompare(a.month) || (a.display_name || '').localeCompare(b.display_name || '');
                case 'name':
                default:
                    return (a.display_name || '').localeCompare(b.display_name || '');
            }
        });
        return copy;
    }
    buildSummary(rows) {
        return {
            rowCount: rows.length,
            totalPackage: rows.reduce((sum, row) => sum + row.package_total, 0),
            totalInvoice: rows.reduce((sum, row) => sum + row.invoice_total, 0),
            totalPersonalUsage: rows.reduce((sum, row) => sum + (row.personal_usage ?? 0), 0),
            totalExcess: rows.reduce((sum, row) => sum + (row.excess ?? 0), 0),
            positiveExcessCount: rows.filter((row) => (row.excess ?? 0) > 0).length,
            emailsSent: rows.filter((row) => row.email_sent_at).length,
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        report_data_service_1.ReportDataService,
        claude_report_planner_1.ClaudeReportPlanner,
        report_english_service_1.ReportEnglishService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map