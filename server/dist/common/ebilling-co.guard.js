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
exports.EbillingCoGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const company_access_service_1 = require("./company-access.service");
const ebilling_access_decorator_1 = require("./ebilling-access.decorator");
let EbillingCoGuard = class EbillingCoGuard {
    reflector;
    companyAccess;
    constructor(reflector, companyAccess) {
        this.reflector = reflector;
        this.companyAccess = companyAccess;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const path = request.path || request.url || '';
        if (this.companyAccess.isPublicPath(path)) {
            return true;
        }
        const skipCo = this.reflector.getAllAndOverride(ebilling_access_decorator_1.EBILLING_SKIP_CO_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (skipCo) {
            return true;
        }
        if (!request.user) {
            return true;
        }
        const co = this.companyAccess.extractCoFromRequest(request);
        if (!co) {
            return true;
        }
        await this.companyAccess.assertCompanyAccess(request, co);
        return true;
    }
};
exports.EbillingCoGuard = EbillingCoGuard;
exports.EbillingCoGuard = EbillingCoGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        company_access_service_1.CompanyAccessService])
], EbillingCoGuard);
//# sourceMappingURL=ebilling-co.guard.js.map
