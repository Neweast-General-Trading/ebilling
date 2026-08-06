"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EbillingSecurityModule = void 0;
const common_1 = require("@nestjs/common");
const permissions_module_1 = require("../permissions/permissions.module");
const company_access_service_1 = require("./company-access.service");
const ebilling_co_guard_1 = require("./ebilling-co.guard");
const ebilling_permission_guard_1 = require("./ebilling-permission.guard");
let EbillingSecurityModule = class EbillingSecurityModule {
};
exports.EbillingSecurityModule = EbillingSecurityModule;
exports.EbillingSecurityModule = EbillingSecurityModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [permissions_module_1.PermissionsModule],
        providers: [
            company_access_service_1.CompanyAccessService,
            ebilling_co_guard_1.EbillingCoGuard,
            ebilling_permission_guard_1.EbillingPermissionGuard,
        ],
        exports: [
            company_access_service_1.CompanyAccessService,
            ebilling_co_guard_1.EbillingCoGuard,
            ebilling_permission_guard_1.EbillingPermissionGuard,
        ],
    })
], EbillingSecurityModule);
//# sourceMappingURL=ebilling-security.module.js.map
