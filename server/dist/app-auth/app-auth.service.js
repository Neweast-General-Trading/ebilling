"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppAuthService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const jwt = __importStar(require("jsonwebtoken"));
const hana_service_1 = require("../hana/hana.service");
let AppAuthService = class AppAuthService {
    hana;
    jwtSecret = process.env.APP_JWT_SECRET;
    intranetApiUrl = process.env.INTRANET_API_URL || 'http://localhost:5021';
    constructor(hana) {
        this.hana = hana;
    }
    verifyToken(token) {
        if (!this.jwtSecret) {
            throw new Error('APP_JWT_SECRET is not configured');
        }
        try {
            return jwt.verify(token, this.jwtSecret);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
    async loginViaIntranet(azureToken) {
        const { data } = await axios_1.default.post(`${this.intranetApiUrl}/auth/azure`, { token: azureToken }, { headers: { 'Content-Type': 'application/json' } });
        if (!data?.token) {
            throw new common_1.UnauthorizedException('Intranet did not return a token');
        }
        return data;
    }
    async loginViaIntranetLink(userId, otp, companyCode) {
        const normalizedUserId = String(userId || '').trim();
        const normalizedOtp = String(otp ?? '').trim();
        const normalizedCo = String(companyCode || '').trim();
        if (!normalizedUserId || !normalizedOtp || !normalizedCo) {
            throw new common_1.BadRequestException('userId, otp, and companyCode are required');
        }
        const safeUserId = normalizedUserId.replace(/'/g, "''");
        const rows = await this.hana.executeQuery(normalizedCo, `SELECT TOP 1 USER_EMAIL, EMP_FULLNAME, USER_NAME, PWDOTP
       FROM "${normalizedCo}".BI_USERMASTER
       WHERE USER_ID = '${safeUserId}'`);
        const row = rows[0];
        if (!row) {
            throw new common_1.UnauthorizedException('Invalid Intranet login link');
        }
        const expectedOtp = String(row.PWDOTP ?? '').trim();
        if (!expectedOtp || expectedOtp !== normalizedOtp) {
            throw new common_1.UnauthorizedException('Invalid Intranet login link');
        }
        const email = row.USER_EMAIL?.trim();
        if (!email) {
            throw new common_1.UnauthorizedException('User email not found');
        }
        const name = row.EMP_FULLNAME?.trim() || row.USER_NAME?.trim() || email;
        if (!this.jwtSecret) {
            throw new Error('APP_JWT_SECRET is not configured');
        }
        const token = jwt.sign({
            email,
            name,
            preferred_username: email,
        }, this.jwtSecret, { expiresIn: '1h' });
        return {
            success: true,
            token,
            user: {
                email,
                name,
                preferred_username: email,
            },
        };
    }
    async getCompanies(appJwt, email) {
        const { data } = await axios_1.default.get(`${this.intranetApiUrl}/settings/companies`, {
            params: { email },
            headers: { Authorization: `Bearer ${appJwt}` },
        });
        return data?.result || [];
    }
    sanitizeReturnTo(returnTo) {
        const fallback = process.env.CLIENT_URL || 'https://ebilling.neweast.cloud/login/';
        const origin = (() => {
            try {
                return new URL(fallback).origin;
            }
            catch {
                return 'https://ebilling.neweast.cloud';
            }
        })();
        if (!returnTo || typeof returnTo !== 'string') {
            return fallback.endsWith('/') ? fallback : `${fallback}/`;
        }
        try {
            // Absolute URL
            if (/^https?:\/\//i.test(returnTo)) {
                const url = new URL(returnTo);
                if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                    return fallback;
                }
                return url.toString();
            }
            // Relative path like /approval-request?co=BI_NEGT
            if (returnTo.startsWith('/')) {
                return new URL(returnTo, origin).toString();
            }
            return fallback;
        }
        catch {
            return fallback;
        }
    }
    buildLoginErrorRedirect(message, returnTo) {
        const base = this.sanitizeReturnTo(returnTo);
        const url = new URL(base);
        url.searchParams.set('loginError', String(message || 'Login failed').slice(0, 240));
        return url.toString();
    }
    async buildMicrosoftSuccessRedirect(azureToken, returnTo) {
        const auth = await this.loginViaIntranet(azureToken);
        const appJwt = auth?.token;
        if (!appJwt) {
            throw new common_1.UnauthorizedException('Intranet did not return a token');
        }
        const decoded = jwt.decode(appJwt);
        const email = decoded?.email || decoded?.preferred_username || '';
        let co = 'BI_NEGT';
        if (email) {
            try {
                const companies = await this.getCompanies(appJwt, email);
                co = companies[0]?.BRANCH || companies[0]?.branch || co;
            }
            catch {
                // keep default company
            }
        }
        const url = new URL(this.sanitizeReturnTo(returnTo));
        url.hash = `jwt=${encodeURIComponent(appJwt)}&co=${encodeURIComponent(co)}`;
        return url.toString();
    }
};
exports.AppAuthService = AppAuthService;
exports.AppAuthService = AppAuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [hana_service_1.HanaService])
], AppAuthService);
//# sourceMappingURL=app-auth.service.js.map