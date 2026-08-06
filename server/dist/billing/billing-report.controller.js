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
exports.BillingReportController = void 0;
const common_1 = require("@nestjs/common");
const app_auth_guard_1 = require("../app-auth/app-auth.guard");
const ebilling_access_decorator_1 = require("../common/ebilling-access.decorator");
const ebilling_co_guard_1 = require("../common/ebilling-co.guard");
const ebilling_permission_guard_1 = require("../common/ebilling-permission.guard");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const auth_user_util_1 = require("../common/auth-user.util");
const billing_report_service_1 = require("./billing-report.service");
let BillingReportController = class BillingReportController {
    billingReportService;
    auditLog;
    constructor(billingReportService, auditLog) {
        this.billingReportService = billingReportService;
        this.auditLog = auditLog;
    }
    report(co, month) {
        return this.billingReportService.getMonthlyReport(co, month);
    }
    async updateRemark(co, body, req) {
        if (!co)
            throw new Error('co query parameter is required');
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        const adminRemarks = body.adminRemarks ?? body.remarks ?? '';
        const result = await this.billingReportService.updateAdminRemark(co, body.simEmployeeId, body.month, adminRemarks);
        await this.auditLog.log({
            co,
            actorEmail: actor.email,
            actorName: actor.name,
            action: 'invoice.remarks_update',
            entityType: 'sim_employee',
            entityId: body.simEmployeeId,
            summary: `Updated HR remarks for employee #${body.simEmployeeId}`,
            details: {
                month: body.month,
                adminRemarks: result.admin_remarks,
            },
        });
        return result;
    }
};
exports.BillingReportController = BillingReportController;
__decorate([
    (0, common_1.Get)('report'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], BillingReportController.prototype, "report", null);
__decorate([
    (0, common_1.Patch)('remarks'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], BillingReportController.prototype, "updateRemark", null);
exports.BillingReportController = BillingReportController = __decorate([
    (0, common_1.Controller)('billing'),
    (0, ebilling_access_decorator_1.RequireEbillingPermission)('invoices'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard, ebilling_permission_guard_1.EbillingPermissionGuard),
    __metadata("design:paramtypes", [billing_report_service_1.BillingReportService,
        audit_log_service_1.AuditLogService])
], BillingReportController);
//# sourceMappingURL=billing-report.controller.js.map