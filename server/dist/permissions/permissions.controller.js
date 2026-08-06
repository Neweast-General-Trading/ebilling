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
exports.PermissionsController = void 0;
const common_1 = require("@nestjs/common");
const app_auth_guard_1 = require("../app-auth/app-auth.guard");
const ebilling_access_decorator_1 = require("../common/ebilling-access.decorator");
const ebilling_admin_access_1 = require("../common/ebilling-admin-access");
const ebilling_co_guard_1 = require("../common/ebilling-co.guard");
const permissions_service_1 = require("./permissions.service");
let PermissionsController = class PermissionsController {
    permissionsService;
    constructor(permissionsService) {
        this.permissionsService = permissionsService;
    }
    async mine(req) {
        const email = (0, ebilling_admin_access_1.emailFromAuthUser)(req.user);
        const permissions = await this.permissionsService.getEffectivePermissions(email);
        return {
            email: (0, ebilling_admin_access_1.normalizeEmail)(email),
            permissions,
            canManage: this.permissionsService.canManagePermissions(email),
            isAdmin: (0, ebilling_admin_access_1.canAccessEbillingAdminTools)(email),
            canAccess: (0, ebilling_admin_access_1.canAccessEbilling)(email),
        };
    }
    async users(req) {
        const email = (0, ebilling_admin_access_1.emailFromAuthUser)(req.user);
        if (!this.permissionsService.canManagePermissions(email)) {
            throw new common_1.ForbiddenException('You do not have access to manage permissions');
        }
        const users = await this.permissionsService.listUsers();
        return { users };
    }
    async candidates(req, co) {
        const email = (0, ebilling_admin_access_1.emailFromAuthUser)(req.user);
        if (!this.permissionsService.canManagePermissions(email)) {
            throw new common_1.ForbiddenException('You do not have access to manage permissions');
        }
        const candidates = await this.permissionsService.listEmailCandidates(co || 'BI_NEGT');
        return { candidates };
    }
    async saveUser(req, body) {
        const actorEmail = (0, ebilling_admin_access_1.emailFromAuthUser)(req.user);
        if (!this.permissionsService.canManagePermissions(actorEmail)) {
            throw new common_1.ForbiddenException('You do not have access to manage permissions');
        }
        const saved = await this.permissionsService.saveUserPermissions(body.email || '', body.permissions || [], actorEmail);
        return { user: saved };
    }
};
exports.PermissionsController = PermissionsController;
__decorate([
    (0, common_1.Get)('mine'),
    (0, ebilling_access_decorator_1.SkipEbillingCoCheck)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "mine", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, ebilling_access_decorator_1.SkipEbillingCoCheck)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "users", null);
__decorate([
    (0, common_1.Get)('candidates'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('co')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "candidates", null);
__decorate([
    (0, common_1.Put)('users'),
    (0, ebilling_access_decorator_1.SkipEbillingCoCheck)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "saveUser", null);
exports.PermissionsController = PermissionsController = __decorate([
    (0, common_1.Controller)('permissions'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard),
    __metadata("design:paramtypes", [permissions_service_1.PermissionsService])
], PermissionsController);
//# sourceMappingURL=permissions.controller.js.map