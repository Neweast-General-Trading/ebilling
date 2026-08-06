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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisReportsController = void 0;
const common_1 = require("@nestjs/common");
const app_auth_guard_1 = require("../app-auth/app-auth.guard");
const ebilling_co_guard_1 = require("../common/ebilling-co.guard");
const analysis_permission_guard_1 = require("../common/ebilling-permission.guard");
const ebilling_access_decorator_1 = require("../common/ebilling-access.decorator");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const auth_user_util_1 = require("../common/auth-user.util");
const analysis_reports_service_1 = require("./analysis-reports.service");
let AnalysisReportsController = class AnalysisReportsController {
    service;
    auditLog;
    constructor(service, auditLog) {
        this.service = service;
        this.auditLog = auditLog;
    }
    catalog() {
        return this.service.getCatalog();
    }
    months(co) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.service.listMonths(co);
    }
    async exportPeriod(co, monthFrom, monthTo, res, req) {
        if (!co)
            throw new Error('co query parameter is required');
        const { buffer, filename, rowCount } = await this.service.exportPeriodExcel(co, monthFrom, monthTo);
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        await this.auditLog.log({
            co,
            actorEmail: actor.email,
            actorName: actor.name,
            action: 'analysis.export_period',
            entityType: 'report',
            summary: `Exported period billing report (${monthFrom} → ${monthTo}, ${rowCount} rows)`,
            details: { monthFrom, monthTo, rowCount },
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
    async exportMonthlyInvoices(co, month, res, req) {
        if (!co)
            throw new Error('co query parameter is required');
        const { buffer, filename, rowCount } = await this.service.exportMonthlyInvoicesExcel(co, month);
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        await this.auditLog.log({
            co,
            actorEmail: actor.email,
            actorName: actor.name,
            action: 'analysis.export_monthly_invoices',
            entityType: 'report',
            summary: `Exported monthly invoices (${month}, ${rowCount} rows)`,
            details: { month, rowCount },
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
    async exportMaster(co, res, req) {
        if (!co)
            throw new Error('co query parameter is required');
        const { buffer, filename, rowCount } = await this.service.exportMasterExcel(co);
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        await this.auditLog.log({
            co,
            actorEmail: actor.email,
            actorName: actor.name,
            action: 'analysis.export_master',
            entityType: 'report',
            summary: `Exported SIM master (${rowCount} rows)`,
            details: { rowCount },
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
};
exports.AnalysisReportsController = AnalysisReportsController;
__decorate([
    (0, common_1.Get)('catalog'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnalysisReportsController.prototype, "catalog", null);
__decorate([
    (0, common_1.Get)('months'),
    __param(0, (0, common_1.Query)('co')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AnalysisReportsController.prototype, "months", null);
__decorate([
    (0, common_1.Get)('export/period'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('monthFrom')),
    __param(2, (0, common_1.Query)('monthTo')),
    __param(3, (0, common_1.Res)()),
    __param(4, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], AnalysisReportsController.prototype, "exportPeriod", null);
__decorate([
    (0, common_1.Get)('export/monthly-invoices'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Res)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], AnalysisReportsController.prototype, "exportMonthlyInvoices", null);
__decorate([
    (0, common_1.Get)('export/master'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AnalysisReportsController.prototype, "exportMaster", null);
exports.AnalysisReportsController = AnalysisReportsController = __decorate([
    (0, common_1.Controller)('analysis-reports'),
    (0, ebilling_access_decorator_1.RequireEbillingPermission)('analysis'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard, analysis_permission_guard_1.EbillingPermissionGuard),
    __metadata("design:paramtypes", [analysis_reports_service_1.AnalysisReportsService,
        audit_log_service_1.AuditLogService])
], AnalysisReportsController);
//# sourceMappingURL=analysis-reports.controller.js.map
