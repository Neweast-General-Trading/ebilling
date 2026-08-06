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
exports.AppAuthController = void 0;
const common_1 = require("@nestjs/common");
const app_auth_guard_1 = require("./app-auth.guard");
const ebilling_admin_access_1 = require("../common/ebilling-admin-access");
const app_auth_service_1 = require("./app-auth.service");
const microsoft_oauth_1 = require("./microsoft-oauth");
let AppAuthController = class AppAuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    login(body) {
        return this.authService.loginViaIntranet(body.azureToken);
    }
    intranetLink(body) {
        return this.authService.loginViaIntranetLink(body?.userId, body?.otp, body?.companyCode);
    }
    microsoftLogin(returnTo, res) {
        const safeReturn = this.authService.sanitizeReturnTo(returnTo);
        const url = (0, microsoft_oauth_1.buildMicrosoftLoginUrl)(safeReturn);
        return res.redirect(url);
    }
    async microsoftCallback(code, state, error, errorDescription, res) {
        if (error) {
            const target = this.authService.buildLoginErrorRedirect(errorDescription || error);
            return res.redirect(target);
        }
        if (!code || !state) {
            const target = this.authService.buildLoginErrorRedirect('Missing Microsoft login code');
            return res.redirect(target);
        }
        try {
            const { accessToken, returnTo } = await (0, microsoft_oauth_1.completeMicrosoftLogin)(code, state);
            const redirectUrl = await this.authService.buildMicrosoftSuccessRedirect(accessToken, returnTo);
            return res.redirect(redirectUrl);
        }
        catch (err) {
            const message = err?.response?.data?.error_description
                || err?.response?.data?.error
                || err?.message
                || 'Microsoft login failed';
            console.error('[Microsoft OAuth]', message);
            const target = this.authService.buildLoginErrorRedirect(message);
            return res.redirect(target);
        }
    }
    async companies(email, req) {
        const token = req.headers.authorization?.replace('Bearer ', '') || '';
        const callerEmail = (0, ebilling_admin_access_1.normalizeEmail)((0, ebilling_admin_access_1.emailFromAuthUser)(req.user));
        const requestedEmail = (0, ebilling_admin_access_1.normalizeEmail)(email) || callerEmail;
        if (!requestedEmail) {
            throw new common_1.ForbiddenException('Email is required');
        }
        if (requestedEmail !== callerEmail &&
            !(0, ebilling_admin_access_1.canAccessEbillingAdminTools)(callerEmail)) {
            throw new common_1.ForbiddenException('You can only query your own company access');
        }
        const list = await this.authService.getCompanies(token, requestedEmail);
        return { result: list };
    }
    me(req) {
        return { user: req.user };
    }
};
exports.AppAuthController = AppAuthController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppAuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('intranet-link'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppAuthController.prototype, "intranetLink", null);
__decorate([
    (0, common_1.Get)('microsoft/login'),
    __param(0, (0, common_1.Query)('returnTo')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AppAuthController.prototype, "microsoftLogin", null);
__decorate([
    (0, common_1.Get)('microsoft/callback'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Query)('error')),
    __param(3, (0, common_1.Query)('error_description')),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AppAuthController.prototype, "microsoftCallback", null);
__decorate([
    (0, common_1.Get)('companies'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard),
    __param(0, (0, common_1.Query)('email')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppAuthController.prototype, "companies", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppAuthController.prototype, "me", null);
exports.AppAuthController = AppAuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [app_auth_service_1.AppAuthService])
], AppAuthController);
//# sourceMappingURL=app-auth.controller.js.map