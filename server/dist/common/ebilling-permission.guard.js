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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EbillingPermissionGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const ebilling_admin_access_1 = require("./ebilling-admin-access");
const ebilling_access_decorator_1 = require("./ebilling-access.decorator");
const permissions_service_1 = require("../permissions/permissions.service");
let EbillingPermissionGuard = class EbillingPermissionGuard {
    reflector;
    permissionsService;
    constructor(reflector, permissionsService) {
        this.reflector = reflector;
        this.permissionsService = permissionsService;
    }
    async canActivate(context) {
        const required = this.reflector.getAllAndOverride(ebilling_access_decorator_1.EBILLING_PERMISSION_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!required) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const email = (0, ebilling_admin_access_1.emailFromAuthUser)(request.user);
        if (!(0, ebilling_admin_access_1.canAccessEbilling)(email)) {
            throw new common_1.ForbiddenException('You do not have access to eBilling');
        }
        if ((0, ebilling_admin_access_1.canAccessEbillingAdminTools)(email)) {
            return true;
        }
        const permissions = await this.permissionsService.getEffectivePermissions(email);
        if (this.permissionsService.hasPermission(email, required, permissions)) {
            return true;
        }
        throw new common_1.ForbiddenException(`Missing permission: ${required}`);
    }
};
exports.EbillingPermissionGuard = EbillingPermissionGuard;
exports.EbillingPermissionGuard = EbillingPermissionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        permissions_service_1.PermissionsService])
], EbillingPermissionGuard);
//# sourceMappingURL=ebilling-permission.guard.js.map
