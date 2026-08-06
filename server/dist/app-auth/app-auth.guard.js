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
exports.AppAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const app_auth_service_1 = require("./app-auth.service");
let AppAuthGuard = class AppAuthGuard {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const bypassEmail = process.env.DEV_BYPASS_EMAIL?.trim();
        if (bypassEmail) {
            if (process.env.NODE_ENV === 'production') {
                throw new common_1.UnauthorizedException('Development auth bypass is disabled in production');
            }
            request.user = {
                email: bypassEmail,
                preferred_username: bypassEmail,
                name: bypassEmail.split('@')[0],
            };
            return true;
        }
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Missing token');
        }
        const token = authHeader.split(' ')[1];
        const decoded = this.authService.verifyToken(token);
        request.user = decoded;
        return true;
    }
};
exports.AppAuthGuard = AppAuthGuard;
exports.AppAuthGuard = AppAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_auth_service_1.AppAuthService])
], AppAuthGuard);
//# sourceMappingURL=app-auth.guard.js.map