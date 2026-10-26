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
var MonthlyDeductionCron_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonthlyDeductionCron = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const monthly_deduction_report_service_1 = require("./monthly-deduction-report.service");
const invoice_service_1 = require("./invoice.service");
const invoice_billing_util_1 = require("./invoice-billing.util");
let MonthlyDeductionCron = MonthlyDeductionCron_1 = class MonthlyDeductionCron {
    reportService;
    invoiceService;
    logger = new common_1.Logger(MonthlyDeductionCron_1.name);
    constructor(reportService, invoiceService) {
        this.reportService = reportService;
        this.invoiceService = invoiceService;
    }
    /** Day 16 00:00 Asia/Dubai — after the 15th ends: unsplit employee requests become full personal. */
    async applyUnsplitEmployeeDeadline() {
        this.logger.log('Starting unsplit 15th-deadline job (16th 00:00 Asia/Dubai)');
        const companies = await this.reportService.listCompanies();
        const results = [];
        for (const co of companies) {
            try {
                results.push(await this.invoiceService.applyUnsplitDeadlineForCompany(co));
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                this.logger.error(`Unsplit deadline failed for ${co}: ${message}`);
                results.push({ co, error: message });
            }
        }
        this.logger.log(`Unsplit 15th-deadline finished: ${JSON.stringify(results)}`);
        return { results };
    }
    /** Day 18 at 00:00 Asia/Dubai — after approvals close at end of the 17th. */
    async sendMonthlyPayrollDeductionReports() {
        this.logger.log('Starting monthly Oracle submit + payroll report (18th 00:00 Asia/Dubai)');
        const billingMonthKey = (0, invoice_billing_util_1.previousBillingMonthKey)();
        const companies = await this.reportService.listCompanies();
        const oracleResults = [];
        for (const co of companies) {
            try {
                oracleResults.push(await this.invoiceService.submitMonthlyOracleDeductions(co, billingMonthKey));
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                this.logger.error(`Monthly Oracle batch failed for ${co}: ${message}`);
                oracleResults.push({ co, billingMonthKey, error: message });
            }
        }
        const result = await this.reportService.runScheduledReports({ force: false, billingMonthKey });
        this.logger.log(`Monthly payroll cut-off finished: ${JSON.stringify({ oracleResults, report: result })}`);
        return { oracleResults, report: result };
    }
};
exports.MonthlyDeductionCron = MonthlyDeductionCron;
__decorate([
    (0, schedule_1.Cron)('0 0 18 * *', { timeZone: 'Asia/Dubai', name: 'monthly-payroll-deduction-report' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonthlyDeductionCron.prototype, "sendMonthlyPayrollDeductionReports", null);
__decorate([
    (0, schedule_1.Cron)('0 0 16 * *', { timeZone: 'Asia/Dubai', name: 'unsplit-employee-deadline' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonthlyDeductionCron.prototype, "applyUnsplitEmployeeDeadline", null);
exports.MonthlyDeductionCron = MonthlyDeductionCron = MonthlyDeductionCron_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [monthly_deduction_report_service_1.MonthlyDeductionReportService,
        invoice_service_1.InvoiceService])
], MonthlyDeductionCron);
//# sourceMappingURL=monthly-deduction.cron.js.map
