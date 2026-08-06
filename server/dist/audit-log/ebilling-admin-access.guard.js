"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EbillingAdminAccessGuard = void 0;
const common_1 = require("@nestjs/common");
const ebilling_admin_access_1 = require("../common/ebilling-admin-access");
let EbillingAdminAccessGuard = class EbillingAdminAccessGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const email = (0, ebilling_admin_access_1.emailFromAuthUser)(request.user);
        if (!(0, ebilling_admin_access_1.canAccessEbillingAdminTools)(email)) {
            throw new common_1.ForbiddenException('You do not have access to this module');
        }
        return true;
    }
};
exports.EbillingAdminAccessGuard = EbillingAdminAccessGuard;
exports.EbillingAdminAccessGuard = EbillingAdminAccessGuard = __decorate([
    (0, common_1.Injectable)()
], EbillingAdminAccessGuard);
//# sourceMappingURL=ebilling-admin-access.guard.js.map