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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const app_auth_guard_1 = require("../app-auth/app-auth.guard");
const ebilling_access_decorator_1 = require("../common/ebilling-access.decorator");
const ebilling_co_guard_1 = require("../common/ebilling-co.guard");
const ebilling_permission_guard_1 = require("../common/ebilling-permission.guard");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const auth_user_util_1 = require("../common/auth-user.util");
const generate_report_dto_1 = require("./dto/generate-report.dto");
const reports_service_1 = require("./reports.service");
let ReportsController = class ReportsController {
    reportsService;
    auditLog;
    constructor(reportsService, auditLog) {
        this.reportsService = reportsService;
        this.auditLog = auditLog;
    }
    listMonths(co) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.reportsService.listMonths(co);
    }
    preview(co, dto) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.reportsService.preview(co, dto);
    }
    async generate(co, dto, res, req) {
        if (!co)
            throw new Error('co query parameter is required');
        const pdf = await this.reportsService.generatePdf(co, dto);
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        await this.auditLog.log({
            co,
            actorEmail: actor.email,
            actorName: actor.name,
            action: 'report.generate',
            entityType: 'report',
            summary: `Generated report: ${dto.title || dto.reportType || 'custom'}`,
            details: {
                reportType: dto.reportType,
                month: dto.month,
                title: dto.title,
                prompt: dto.customPrompt?.slice(0, 500) || null,
            },
        });
        const filename = `rectracking-report-${Date.now()}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdf);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('months'),
    __param(0, (0, common_1.Query)('co')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "listMonths", null);
__decorate([
    (0, common_1.Post)('preview'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, generate_report_dto_1.GenerateReportDto]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "preview", null);
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, generate_report_dto_1.GenerateReportDto, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "generate", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    (0, ebilling_access_decorator_1.RequireEbillingPermission)('reports'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard, ebilling_permission_guard_1.EbillingPermissionGuard),
    __metadata("design:paramtypes", [reports_service_1.ReportsService,
        audit_log_service_1.AuditLogService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map