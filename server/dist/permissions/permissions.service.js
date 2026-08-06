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
exports.PermissionsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const ebilling_permissions_1 = require("../common/ebilling-permissions");
const ebilling_admin_access_1 = require("../common/ebilling-admin-access");
let PermissionsService = class PermissionsService {
    db;
    constructor(db) {
        this.db = db;
    }
    async getEffectivePermissions(email) {
        const normalizedEmail = (0, ebilling_admin_access_1.normalizeEmail)(email);
        if (!normalizedEmail)
            return [];
        if (!(0, ebilling_admin_access_1.canAccessEbilling)(normalizedEmail)) {
            return [];
        }
        if ((0, ebilling_admin_access_1.canAccessEbillingAdminTools)(normalizedEmail)) {
            return [...ebilling_permissions_1.ALL_EBILLING_PERMISSIONS];
        }
        const result = await this.db.query(`SELECT permission_key
       FROM ebilling_user_permissions
       WHERE lower(trim(email)) = $1
       ORDER BY permission_key`, [normalizedEmail]);
        const stored = result.rows
            .map((row) => row.permission_key)
            .filter(ebilling_permissions_1.isEbillingPermissionKey);
        return stored;
    }
    hasPermission(email, permission, effective) {
        if (!(0, ebilling_admin_access_1.canAccessEbilling)(email))
            return false;
        if ((0, ebilling_admin_access_1.canAccessEbillingAdminTools)(email))
            return true;
        const permissions = effective ?? [];
        return permissions.includes(permission);
    }
    canManagePermissions(email) {
        return (0, ebilling_admin_access_1.canManageEbillingPermissions)(email);
    }
    async listUsers() {
        const emails = new Set(ebilling_admin_access_1.EBILLING_ALLOWED_EMAILS.map((value) => value.toLowerCase()));
        const rows = [];
        for (const email of Array.from(emails).sort()) {
            const isAdmin = (0, ebilling_admin_access_1.canAccessEbillingAdminTools)(email);
            const permissions = isAdmin
                ? [...ebilling_permissions_1.ALL_EBILLING_PERMISSIONS]
                : await this.getStoredPermissions(email);
            rows.push({
                email,
                displayName: (0, ebilling_admin_access_1.formatDisplayEmail)(email),
                permissions,
                isAdmin,
            });
        }
        return rows;
    }
    async getStoredPermissions(email) {
        const result = await this.db.query(`SELECT permission_key
       FROM ebilling_user_permissions
       WHERE lower(trim(email)) = $1
       ORDER BY permission_key`, [email]);
        const stored = result.rows
            .map((row) => row.permission_key)
            .filter(ebilling_permissions_1.isEbillingPermissionKey);
        return stored.length > 0 ? stored : [];
    }
    async saveUserPermissions(email, permissions, grantedByEmail) {
        const normalizedEmail = (0, ebilling_admin_access_1.normalizeEmail)(email);
        if (!normalizedEmail) {
            throw new Error('Email is required');
        }
        if (!(0, ebilling_admin_access_1.isCorporateEbillingEmail)(normalizedEmail)) {
            throw new common_1.BadRequestException('Only @neweast.co / @neweast.com emails can be granted eBilling permissions');
        }
        if (!(0, ebilling_admin_access_1.canAccessEbilling)(normalizedEmail)) {
            throw new common_1.ForbiddenException('This email is not on the eBilling access list');
        }
        if ((0, ebilling_admin_access_1.canAccessEbillingAdminTools)(normalizedEmail)) {
            return {
                email: normalizedEmail,
                displayName: (0, ebilling_admin_access_1.formatDisplayEmail)(normalizedEmail),
                permissions: [...ebilling_permissions_1.ALL_EBILLING_PERMISSIONS],
                isAdmin: true,
            };
        }
        const uniquePermissions = Array.from(new Set(permissions
            .map((value) => value.trim().toLowerCase())
            .filter(ebilling_permissions_1.isEbillingPermissionKey)));
        await this.db.query(`DELETE FROM ebilling_user_permissions WHERE lower(trim(email)) = $1`, [normalizedEmail]);
        for (const permission of uniquePermissions) {
            await this.db.query(`INSERT INTO ebilling_user_permissions (email, permission_key, granted_by_email)
         VALUES ($1, $2, $3)`, [normalizedEmail, permission, (0, ebilling_admin_access_1.normalizeEmail)(grantedByEmail)]);
        }
        return {
            email: normalizedEmail,
            displayName: (0, ebilling_admin_access_1.formatDisplayEmail)(normalizedEmail),
            permissions: uniquePermissions,
            isAdmin: false,
        };
    }
    async listEmailCandidates(co) {
        const result = await this.db.query(`SELECT lower(trim(email)) AS email,
              MAX(display_name) AS display_name,
              MAX(person_number) AS person_number
       FROM sim_employees
       WHERE co = $1
         AND is_active = true
         AND email IS NOT NULL
         AND trim(email) <> ''
       GROUP BY lower(trim(email))
       ORDER BY MAX(display_name) NULLS LAST, lower(trim(email))`, [co]);
        return result.rows
            .filter((row) => (0, ebilling_admin_access_1.canAccessEbilling)(row.email))
            .map((row) => ({
            email: row.email,
            displayName: row.display_name?.trim() || (0, ebilling_admin_access_1.formatDisplayEmail)(row.email),
            personNumber: row.person_number,
        }));
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], PermissionsService);
//# sourceMappingURL=permissions.service.js.map