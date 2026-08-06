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
exports.AuditLogController = void 0;
const common_1 = require("@nestjs/common");
const app_auth_guard_1 = require("../app-auth/app-auth.guard");
const ebilling_admin_access_guard_1 = require("./ebilling-admin-access.guard");
const ebilling_co_guard_1 = require("../common/ebilling-co.guard");
const audit_log_service_1 = require("./audit-log.service");
let AuditLogController = class AuditLogController {
    service;
    constructor(service) {
        this.service = service;
    }
    overview(co, days) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.service.getOverview(co, Number(days) || 30);
    }
    listEvents(co, page, pageSize, action, search, from, to) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.service.listEvents(co, {
            page: Number(page) || 1,
            pageSize: Number(pageSize) || 25,
            action,
            search,
            from,
            to,
        });
    }
};
exports.AuditLogController = AuditLogController;
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AuditLogController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('events'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __param(3, (0, common_1.Query)('action')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Query)('from')),
    __param(6, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], AuditLogController.prototype, "listEvents", null);
exports.AuditLogController = AuditLogController = __decorate([
    (0, common_1.Controller)('audit-log'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard, ebilling_admin_access_guard_1.EbillingAdminAccessGuard),
    __metadata("design:paramtypes", [audit_log_service_1.AuditLogService])
], AuditLogController);
//# sourceMappingURL=audit-log.controller.js.map