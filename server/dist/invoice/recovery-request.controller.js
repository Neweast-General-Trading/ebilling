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
exports.RecoveryRequestController = void 0;
const common_1 = require("@nestjs/common");
const app_auth_guard_1 = require("../app-auth/app-auth.guard");
const ebilling_co_guard_1 = require("../common/ebilling-co.guard");
const auth_user_util_1 = require("../common/auth-user.util");
const recovery_request_service_1 = require("./recovery-request.service");

let RecoveryRequestController = class RecoveryRequestController {
    recoveryService;
    constructor(recoveryService) {
        this.recoveryService = recoveryService;
    }
    async status(co, req) {
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        const role = this.recoveryService.getRole(actor.email);
        if (role === 'requester') {
            return this.recoveryService.getOverlayForRequester(co);
        }
        if (role === 'approver') {
            const pending = await this.recoveryService.listPendingForApprover(co);
            return {
                role: 'approver',
                pendingCount: pending.length,
            };
        }
        return { role: null, byInvoiceId: {} };
    }
    async requests(co, req) {
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        this.recoveryService.assertApprover(actor.email);
        return {
            items: await this.recoveryService.listPendingForApprover(co),
        };
    }
    createRequest(co, body, req) {
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        return this.recoveryService.createRequest(co, Number(body?.invoiceId), actor);
    }
    approve(co, requestId, req) {
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        return this.recoveryService.approveRequest(co, requestId, actor);
    }
    reject(co, requestId, body, req) {
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        return this.recoveryService.rejectRequest(co, requestId, body?.reason, actor);
    }
};
exports.RecoveryRequestController = RecoveryRequestController;
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RecoveryRequestController.prototype, "status", null);
__decorate([
    (0, common_1.Get)('requests'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RecoveryRequestController.prototype, "requests", null);
__decorate([
    (0, common_1.Post)('request'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], RecoveryRequestController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Post)(':requestId/approve'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Param)('requestId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], RecoveryRequestController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':requestId/reject'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Param)('requestId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], RecoveryRequestController.prototype, "reject", null);
exports.RecoveryRequestController = RecoveryRequestController = __decorate([
    (0, common_1.Controller)('invoices/recovery/requests'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard),
    __metadata("design:paramtypes", [recovery_request_service_1.RecoveryRequestService])
], RecoveryRequestController);
