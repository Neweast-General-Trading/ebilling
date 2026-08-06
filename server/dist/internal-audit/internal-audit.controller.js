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
exports.InternalAuditController = void 0;
const common_1 = require("@nestjs/common");
const app_auth_guard_1 = require("../app-auth/app-auth.guard");
const ebilling_co_guard_1 = require("../common/ebilling-co.guard");
const analysis_permission_guard_1 = require("../common/ebilling-permission.guard");
const ebilling_access_decorator_1 = require("../common/ebilling-access.decorator");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const auth_user_util_1 = require("../common/auth-user.util");
const internal_audit_service_1 = require("./internal-audit.service");
let InternalAuditController = class InternalAuditController {
    service;
    auditLog;
    constructor(service, auditLog) {
        this.service = service;
        this.auditLog = auditLog;
    }
    overview(co, month) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.service.getOverview(co, month);
    }
    async parseAll(co, month, req) {
        if (!co)
            throw new Error('co query parameter is required');
        const result = await this.service.parseAll(co, month);
        const actor = (0, auth_user_util_1.getAuthActor)(req?.user);
        await this.auditLog.log({
            co,
            actorEmail: actor.email,
            actorName: actor.name,
            action: 'internal_audit.parse_all',
            entityType: 'invoice_batch',
            summary: `Parsed call details for ${result.parsed} invoice(s)`,
            details: {
                month: month || null,
                parsed: result.parsed,
                totalCalls: result.totalCalls,
            },
        });
        return result;
    }
    listInvoices(co, month, page, pageSize, search) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.service.listInvoices(co, {
            month,
            page: Number(page) || 1,
            pageSize: Number(pageSize) || 20,
            search,
        });
    }
    listInvoiceCalls(co, id, page, pageSize, search, callType) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.service.listInvoiceCalls(co, id, {
            page: Number(page) || 1,
            pageSize: Number(pageSize) || 50,
            search,
            callType: callType || 'all',
        });
    }
    analytics(co, month) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.service.getCallAnalytics(co, month);
    }
    listSubscribers(co, month, page, pageSize, sort, search) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.service.listSubscribers(co, {
            month,
            page: Number(page) || 1,
            pageSize: Number(pageSize) || 20,
            sort: sort || 'internal_desc',
            search,
        });
    }
    listTopPairs(co, month, page, pageSize) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.service.listTopPairs(co, {
            month,
            page: Number(page) || 1,
            pageSize: Number(pageSize) || 20,
        });
    }
};
exports.InternalAuditController = InternalAuditController;
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InternalAuditController.prototype, "overview", null);
__decorate([
    (0, common_1.Post)('parse-all'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], InternalAuditController.prototype, "parseAll", null);
__decorate([
    (0, common_1.Get)('invoices'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('pageSize')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], InternalAuditController.prototype, "listInvoices", null);
__decorate([
    (0, common_1.Get)('invoices/:id/calls'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('pageSize')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Query)('callType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String, String, String, String]),
    __metadata("design:returntype", void 0)
], InternalAuditController.prototype, "listInvoiceCalls", null);
__decorate([
    (0, common_1.Get)('analytics'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InternalAuditController.prototype, "analytics", null);
__decorate([
    (0, common_1.Get)('subscribers'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('pageSize')),
    __param(4, (0, common_1.Query)('sort')),
    __param(5, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], InternalAuditController.prototype, "listSubscribers", null);
__decorate([
    (0, common_1.Get)('top-pairs'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], InternalAuditController.prototype, "listTopPairs", null);
exports.InternalAuditController = InternalAuditController = __decorate([
    (0, common_1.Controller)('internal-audit'),
    (0, ebilling_access_decorator_1.RequireEbillingPermission)('analysis'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard, analysis_permission_guard_1.EbillingPermissionGuard),
    __metadata("design:paramtypes", [internal_audit_service_1.InternalAuditService,
        audit_log_service_1.AuditLogService])
], InternalAuditController);
//# sourceMappingURL=internal-audit.controller.js.map