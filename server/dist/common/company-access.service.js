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
exports.CompanyAccessService = exports.KNOWN_EBILLING_COMPANIES = void 0;
const common_1 = require("@nestjs/common");
const app_auth_service_1 = require("../app-auth/app-auth.service");
const ebilling_admin_access_1 = require("./ebilling-admin-access");
exports.KNOWN_EBILLING_COMPANIES = ['BI_NEGT', 'BI_NESA', 'BI_NEGTLLC'];
const CACHE_TTL_MS = 5 * 60 * 1000;
function normalizeCompanyCode(value) {
    const code = String(value || '').trim().toUpperCase();
    return code || null;
}
function extractCompanyCodes(list) {
    if (!Array.isArray(list)) {
        return [];
    }
    const codes = new Set();
    for (const item of list) {
        if (typeof item === 'string') {
            const code = normalizeCompanyCode(item);
            if (code) {
                codes.add(code);
            }
            continue;
        }
        if (item && typeof item === 'object') {
            const code = normalizeCompanyCode(item.BRANCH ||
                item.branch ||
                item.code ||
                item.co ||
                item.company ||
                item.COMPANY);
            if (code) {
                codes.add(code);
            }
        }
    }
    return Array.from(codes);
}
let CompanyAccessService = class CompanyAccessService {
    authService;
    cache = new Map();
    constructor(authService) {
        this.authService = authService;
    }
    extractCoFromRequest(req) {
        const queryCo = req?.query?.co;
        const bodyCo = req?.body?.co;
        const co = (typeof queryCo === 'string' && queryCo.trim()) ||
            (typeof bodyCo === 'string' && bodyCo.trim()) ||
            null;
        return co ? normalizeCompanyCode(co) : null;
    }
    isPublicPath(pathname) {
        const path = String(pathname || '').split('?')[0];
        if (!path || path === '/') {
            return true;
        }
        if (path.startsWith('/auth')) {
            return true;
        }
        if (path.startsWith('/invoices/folder')) {
            return true;
        }
        return false;
    }
    async getAccessibleCompanies(req) {
        const email = (0, ebilling_admin_access_1.normalizeEmail)((0, ebilling_admin_access_1.emailFromAuthUser)(req.user));
        if (!email) {
            return [];
        }
        if (!(0, ebilling_admin_access_1.canAccessEbilling)(email)) {
            return [];
        }
        if ((0, ebilling_admin_access_1.canAccessEbillingAdminTools)(email)) {
            return [...exports.KNOWN_EBILLING_COMPANIES];
        }
        const cached = this.cache.get(email);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.companies;
        }
        const token = req.headers?.authorization?.replace(/^Bearer\s+/i, '') || '';
        if (!token) {
            return [];
        }
        const list = await this.authService.getCompanies(token, email);
        const companies = extractCompanyCodes(list);
        this.cache.set(email, { companies, expiresAt: Date.now() + CACHE_TTL_MS });
        return companies;
    }
    async assertCompanyAccess(req, co) {
        const normalizedCo = normalizeCompanyCode(co);
        if (!normalizedCo) {
            throw new common_1.BadRequestException('co query parameter is required');
        }
        if (!exports.KNOWN_EBILLING_COMPANIES.includes(normalizedCo)) {
            throw new common_1.BadRequestException(`Unknown company code: ${normalizedCo}`);
        }
        const allowed = await this.getAccessibleCompanies(req);
        if (!allowed.includes(normalizedCo)) {
            throw new common_1.ForbiddenException(`You do not have access to company ${normalizedCo}`);
        }
        return normalizedCo;
    }
};
exports.CompanyAccessService = CompanyAccessService;
exports.CompanyAccessService = CompanyAccessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_auth_service_1.AppAuthService])
], CompanyAccessService);
//# sourceMappingURL=company-access.service.js.map
