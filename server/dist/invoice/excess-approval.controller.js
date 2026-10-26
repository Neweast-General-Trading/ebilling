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
exports.ExcessApprovalController = void 0;
const common_1 = require("@nestjs/common");
const excess_approval_service_1 = require("./excess-approval.service");
const monthly_deduction_report_service_1 = require("./monthly-deduction-report.service");
const invoice_service_1 = require("./invoice.service");
const invoice_billing_util_1 = require("./invoice-billing.util");
const app_auth_guard_1 = require("../app-auth/app-auth.guard");
const ebilling_co_guard_1 = require("../common/ebilling-co.guard");
const ebilling_permission_guard_1 = require("../common/ebilling-permission.guard");
const ebilling_access_decorator_1 = require("../common/ebilling-access.decorator");
const auth_user_util_1 = require("../common/auth-user.util");
const ebilling_admin_access_1 = require("../common/ebilling-admin-access");
let ExcessApprovalController = class ExcessApprovalController {
    excessApproval;
    monthlyDeductionReport;
    invoiceService;
    constructor(excessApproval, monthlyDeductionReport, invoiceService) {
        this.excessApproval = excessApproval;
        this.monthlyDeductionReport = monthlyDeductionReport;
        this.invoiceService = invoiceService;
    }
    getSettings(co) {
        return this.excessApproval.getSettings(co);
    }
    saveSettings(co, body, req) {
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        return this.excessApproval.saveSettings(co, body, actor.email);
    }
    getQueue(token, req) {
        const viewer = this.excessApproval.parseOptionalViewerEmail(req?.headers?.authorization);
        return this.excessApproval.listQueueForToken(token, viewer);
    }
    approve(token, body, req) {
        const viewer = this.excessApproval.parseOptionalViewerEmail(req?.headers?.authorization);
        return this.excessApproval.approveItems(token, body?.invoiceIds || [], undefined, viewer);
    }
    reject(token, body, req) {
        const viewer = this.excessApproval.parseOptionalViewerEmail(req?.headers?.authorization);
        return this.excessApproval.rejectItems(token, body?.invoiceIds || [], body?.reason || '', viewer);
    }
    approveAll(token, req) {
        const viewer = this.excessApproval.parseOptionalViewerEmail(req?.headers?.authorization);
        return this.excessApproval.listQueueForToken(token, viewer).then((queue) => this.excessApproval.approveItems(token, queue.rows.map((r) => r.invoiceId), undefined, viewer));
    }
    rejectAll(token, body, req) {
        const viewer = this.excessApproval.parseOptionalViewerEmail(req?.headers?.authorization);
        return this.excessApproval.listQueueForToken(token, viewer).then((queue) => this.excessApproval.rejectItems(token, queue.rows.map((r) => r.invoiceId), body?.reason || '', viewer));
    }
    sendBulk(co, body, req) {
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        return this.excessApproval.sendBulkToMatrix(co, body?.invoiceIds || [], actor);
    }
    getMyQueue(co, req) {
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        return this.excessApproval.listQueueForActor(co, actor.email);
    }
    approveMyQueue(co, body, req) {
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        return this.excessApproval.approveForActor(co, actor.email, body?.invoiceIds || []);
    }
    rejectMyQueue(co, body, req) {
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        return this.excessApproval.rejectForActor(co, actor.email, body?.invoiceIds || [], body?.reason || '');
    }
    listAllRequests(co, req) {
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        return this.excessApproval.listAllRequestsForAdmin(co, actor);
    }
    async exportAllRequests(co, month, body, req, res) {
        if (!co)
            throw new Error('co query parameter is required');
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        const file = await this.excessApproval.exportAllRequestsExcel(co, actor, {
            month,
            rows: body?.rows,
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
        res.send(file.buffer);
    }
    getMyHistory(co, req) {
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        return this.excessApproval.listHistoryForActor(co, actor.email);
    }
    getTokenHistory(token) {
        return this.excessApproval.listHistoryForToken(token);
    }
    getDeductionStatus(co, invoiceIds, req) {
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        return this.excessApproval.getDeductionStatusForInvoices(co, invoiceIds, actor.email);
    }
    getTokenDeductionStatus(token, invoiceIds, req) {
        const viewer = this.excessApproval.parseOptionalViewerEmail(req?.headers?.authorization);
        return this.excessApproval.getDeductionStatusForToken(token, invoiceIds, viewer);
    }
    async getInvoicePdf(co, invoiceId, req, res) {
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        const attachment = await this.excessApproval.getInvoicePdfForActor(co, invoiceId, actor.email);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${attachment.filename.replace(/"/g, '')}"`);
        res.sendFile(attachment.path);
    }
    async getTokenInvoicePdf(token, invoiceId, req, res) {
        const viewer = this.excessApproval.parseOptionalViewerEmail(req?.headers?.authorization);
        const attachment = await this.excessApproval.getInvoicePdfForToken(token, invoiceId, viewer);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${attachment.filename.replace(/"/g, '')}"`);
        res.sendFile(attachment.path);
    }
    async sendPayrollDeductionReport(co, force, req) {
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        if (!(0, ebilling_admin_access_1.canAccessEbillingAdminTools)(actor.email)) {
            throw new common_1.ForbiddenException('Only super admin can send the payroll deduction report');
        }
        const billingMonthKey = (0, invoice_billing_util_1.previousBillingMonthKey)();
        const oracle = await this.invoiceService.submitMonthlyOracleDeductions(co, billingMonthKey);
        const report = await this.monthlyDeductionReport.sendReportForCompany(co, {
            force: String(force || '').toLowerCase() === 'true' || force === true,
            billingMonthKey,
        });
        return { oracle, report };
    }
    async applyUnsplitDeadline(co, req) {
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        if (!(0, ebilling_admin_access_1.canAccessEbillingAdminTools)(actor.email)) {
            throw new common_1.ForbiddenException('Only super admin can apply the unsplit 15th deadline');
        }
        return this.invoiceService.applyUnsplitDeadlineForCompany(co);
    }
};
exports.ExcessApprovalController = ExcessApprovalController;
__decorate([
    (0, common_1.Get)('settings'),
    (0, ebilling_access_decorator_1.RequireEbillingPermission)('excess_approval'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard, ebilling_permission_guard_1.EbillingPermissionGuard),
    __param(0, (0, common_1.Query)('co')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExcessApprovalController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Put)('settings'),
    (0, ebilling_access_decorator_1.RequireEbillingPermission)('excess_approval'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard, ebilling_permission_guard_1.EbillingPermissionGuard),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ExcessApprovalController.prototype, "saveSettings", null);
__decorate([
    (0, common_1.Get)('queue/:token'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExcessApprovalController.prototype, "getQueue", null);
__decorate([
    (0, common_1.Post)('queue/:token/approve'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ExcessApprovalController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)('queue/:token/reject'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ExcessApprovalController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)('queue/:token/approve-all'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExcessApprovalController.prototype, "approveAll", null);
__decorate([
    (0, common_1.Post)('queue/:token/reject-all'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ExcessApprovalController.prototype, "rejectAll", null);
__decorate([
    (0, common_1.Post)('send-bulk'),
    (0, ebilling_access_decorator_1.RequireEbillingPermission)('invoices'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard, ebilling_permission_guard_1.EbillingPermissionGuard),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ExcessApprovalController.prototype, "sendBulk", null);
__decorate([
    (0, common_1.Get)('my-queue'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExcessApprovalController.prototype, "getMyQueue", null);
__decorate([
    (0, common_1.Post)('my-queue/approve'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ExcessApprovalController.prototype, "approveMyQueue", null);
__decorate([
    (0, common_1.Post)('my-queue/reject'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ExcessApprovalController.prototype, "rejectMyQueue", null);
__decorate([
    (0, common_1.Get)('requests'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExcessApprovalController.prototype, "listAllRequests", null);
__decorate([
    (0, common_1.Post)('requests/export'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ExcessApprovalController.prototype, "exportAllRequests", null);
__decorate([
    (0, common_1.Get)('requests/export'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ExcessApprovalController.prototype, "exportAllRequests", null);
__decorate([
    (0, common_1.Get)('my-history'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExcessApprovalController.prototype, "getMyHistory", null);
__decorate([
    (0, common_1.Get)('queue/:token/history'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExcessApprovalController.prototype, "getTokenHistory", null);
__decorate([
    (0, common_1.Get)('deduction-status'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('invoiceIds')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ExcessApprovalController.prototype, "getDeductionStatus", null);
__decorate([
    (0, common_1.Get)('queue/:token/deduction-status'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Query)('invoiceIds')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ExcessApprovalController.prototype, "getTokenDeductionStatus", null);
__decorate([
    (0, common_1.Get)('invoice-pdf/:invoiceId'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Param)('invoiceId')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ExcessApprovalController.prototype, "getInvoicePdf", null);
__decorate([
    (0, common_1.Get)('queue/:token/invoice-pdf/:invoiceId'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Param)('invoiceId')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ExcessApprovalController.prototype, "getTokenInvoicePdf", null);
__decorate([
    (0, common_1.Post)('payroll-report/send'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('force')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ExcessApprovalController.prototype, "sendPayrollDeductionReport", null);
__decorate([
    (0, common_1.Post)('unsplit-deadline/apply'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExcessApprovalController.prototype, "applyUnsplitDeadline", null);
exports.ExcessApprovalController = ExcessApprovalController = __decorate([
    (0, common_1.Controller)('excess-approval'),
    __metadata("design:paramtypes", [excess_approval_service_1.ExcessApprovalService,
        monthly_deduction_report_service_1.MonthlyDeductionReportService,
        invoice_service_1.InvoiceService])
], ExcessApprovalController);
//# sourceMappingURL=excess-approval.controller.js.map
