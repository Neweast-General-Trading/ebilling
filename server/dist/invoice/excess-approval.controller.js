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
const app_auth_guard_1 = require("../app-auth/app-auth.guard");
const ebilling_co_guard_1 = require("../common/ebilling-co.guard");
const ebilling_permission_guard_1 = require("../common/ebilling-permission.guard");
const ebilling_access_decorator_1 = require("../common/ebilling-access.decorator");
const auth_user_util_1 = require("../common/auth-user.util");
let ExcessApprovalController = class ExcessApprovalController {
    excessApproval;
    constructor(excessApproval) {
        this.excessApproval = excessApproval;
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
exports.ExcessApprovalController = ExcessApprovalController = __decorate([
    (0, common_1.Controller)('excess-approval'),
    __metadata("design:paramtypes", [excess_approval_service_1.ExcessApprovalService])
], ExcessApprovalController);
//# sourceMappingURL=excess-approval.controller.js.map
