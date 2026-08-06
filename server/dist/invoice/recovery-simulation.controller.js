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
exports.RecoverySimulationController = void 0;
const common_1 = require("@nestjs/common");
const app_auth_guard_1 = require("../app-auth/app-auth.guard");
const ebilling_access_decorator_1 = require("../common/ebilling-access.decorator");
const ebilling_co_guard_1 = require("../common/ebilling-co.guard");
const auth_user_util_1 = require("../common/auth-user.util");
const recovery_simulation_service_1 = require("./recovery-simulation.service");

let RecoverySimulationController = class RecoverySimulationController {
    simulationService;
    constructor(simulationService) {
        this.simulationService = simulationService;
    }
    status(co, req) {
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        const role = this.simulationService.getRole(actor.email);
        if (role === 'requester') {
            return this.simulationService.getOverlayForRequester(co);
        }
        if (role === 'approver') {
            return {
                simulation: true,
                role: 'approver',
                pendingCount: this.simulationService.listPendingForApprover(co).length,
            };
        }
        return { simulation: true, role: null, byInvoiceId: {} };
    }
    requests(co, req) {
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        this.simulationService.assertApprover(actor.email);
        return {
            items: this.simulationService.listPendingForApprover(co),
        };
    }
    createRequest(co, body, req) {
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        return this.simulationService.createRequest(co, Number(body?.invoiceId), actor.email);
    }
    approve(co, requestId, req) {
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        return this.simulationService.approveRequest(co, requestId, actor.email);
    }
    reject(co, requestId, body, req) {
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        return this.simulationService.rejectRequest(co, requestId, body?.reason, actor.email);
    }
};
exports.RecoverySimulationController = RecoverySimulationController;
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RecoverySimulationController.prototype, "status", null);
__decorate([
    (0, common_1.Get)('requests'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RecoverySimulationController.prototype, "requests", null);
__decorate([
    (0, common_1.Post)('request'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], RecoverySimulationController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Post)(':requestId/approve'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Param)('requestId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], RecoverySimulationController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':requestId/reject'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Param)('requestId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], RecoverySimulationController.prototype, "reject", null);
exports.RecoverySimulationController = RecoverySimulationController = __decorate([
    (0, common_1.Controller)('invoices/simulation/recovery'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard),
    __metadata("design:paramtypes", [recovery_simulation_service_1.RecoverySimulationService])
], RecoverySimulationController);
