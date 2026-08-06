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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimMasterController = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const platform_express_1 = require("@nestjs/platform-express");
const app_auth_guard_1 = require("../app-auth/app-auth.guard");
const ebilling_access_decorator_1 = require("../common/ebilling-access.decorator");
const ebilling_co_guard_1 = require("../common/ebilling-co.guard");
const ebilling_permission_guard_1 = require("../common/ebilling-permission.guard");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const auth_user_util_1 = require("../common/auth-user.util");
const multer_upload_config_1 = require("../config/multer-upload.config");
const sim_master_service_1 = require("./sim-master.service");
const update_sim_employee_dto_1 = require("./dto/update-sim-employee.dto");
const create_sim_employee_dto_1 = require("./dto/create-sim-employee.dto");
const reassign_phone_dto_1 = require("./dto/reassign-phone.dto");
const check_duplicate_dto_1 = require("./dto/check-duplicate.dto");
let SimMasterController = class SimMasterController {
    simMasterService;
    auditLog;
    constructor(simMasterService, auditLog) {
        this.simMasterService = simMasterService;
        this.auditLog = auditLog;
    }
    list(co, page, pageSize, search, emailStatus, phoneType, includeInactive) {
        return this.simMasterService.listEmployees(co, page ? Number(page) : 1, pageSize ? Number(pageSize) : 25, {
            search,
            emailStatus: emailStatus || 'all',
            phoneType: phoneType || 'all',
            includeInactive: includeInactive === 'true',
        });
    }
    resolveSap(co, personNumber, displayName) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.simMasterService.lookupSapProfile(co, personNumber, displayName);
    }
    downloadTemplate(res) {
        const buffer = this.simMasterService.generateTemplateBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="ETISALAT-SIM-MASTER-TEMPLATE.xlsx"');
        res.send(buffer);
    }
    sheetBreakdown() {
        const samplesDir = process.env.SAMPLES_DIR || path.join(process.cwd(), '..', 'samples');
        const sampleFile = path.join(samplesDir, 'ETISALAT DEDUCTIONS - 2026 1.xlsx');
        if (!fs.existsSync(sampleFile)) {
            return {
                totalPhoneLines: null,
                employeeMobileSap: null,
                parsedEmployeeRows: null,
                note: 'Sample Excel not found on server',
            };
        }
        const buffer = fs.readFileSync(sampleFile);
        return this.simMasterService.getSheetBreakdown(buffer);
    }
    checkDuplicates(co, dto) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.simMasterService.findDuplicates(co, dto);
    }
    async create(co, dto, req) {
        if (!co)
            throw new Error('co query parameter is required');
        const result = await this.simMasterService.createEmployee(co, dto);
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        await this.auditLog.log({
            co,
            actorEmail: actor.email,
            actorName: actor.name,
            action: 'master.create',
            entityType: 'sim_employee',
            entityId: result?.id,
            summary: `Created SIM master record for ${dto.phoneNumber || dto.personNumber}`,
            details: { dto },
        });
        return result;
    }
    async update(co, id, dto, req) {
        if (!co)
            throw new Error('co query parameter is required');
        const result = await this.simMasterService.updateEmployee(co, id, dto);
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        await this.auditLog.log({
            co,
            actorEmail: actor.email,
            actorName: actor.name,
            action: 'master.update',
            entityType: 'sim_employee',
            entityId: id,
            summary: `Updated SIM master record #${id}`,
            details: { dto },
        });
        return result;
    }
    async deactivate(co, id, req) {
        if (!co)
            throw new Error('co query parameter is required');
        const result = await this.simMasterService.deactivateEmployee(co, id);
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        await this.auditLog.log({
            co,
            actorEmail: actor.email,
            actorName: actor.name,
            action: 'master.deactivate',
            entityType: 'sim_employee',
            entityId: id,
            summary: `Deactivated SIM master record #${id}`,
        });
        return result;
    }
    async activate(co, id, req) {
        if (!co)
            throw new Error('co query parameter is required');
        const result = await this.simMasterService.activateEmployee(co, id);
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        await this.auditLog.log({
            co,
            actorEmail: actor.email,
            actorName: actor.name,
            action: 'master.activate',
            entityType: 'sim_employee',
            entityId: id,
            summary: `Activated SIM master record #${id}`,
        });
        return result;
    }
    async reassign(co, id, dto, req) {
        if (!co)
            throw new Error('co query parameter is required');
        const result = await this.simMasterService.reassignPhone(co, id, dto);
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        await this.auditLog.log({
            co,
            actorEmail: actor.email,
            actorName: actor.name,
            action: 'master.reassign',
            entityType: 'sim_employee',
            entityId: id,
            summary: `Reassigned phone for SIM master record #${id}`,
            details: { dto },
        });
        return result;
    }
    preview(co, file) {
        if (!co)
            throw new Error('co query parameter is required');
        if (!file)
            throw new Error('Excel file is required');
        const buffer = fs.readFileSync(file.path);
        return this.simMasterService.previewMatch(co, buffer);
    }
    async import(co, file, req) {
        if (!co)
            throw new Error('co query parameter is required');
        if (!file)
            throw new Error('Excel file is required');
        const buffer = fs.readFileSync(file.path);
        const result = await this.simMasterService.importMatchedRows(co, buffer);
        const actor = (0, auth_user_util_1.getAuthActor)(req.user);
        await this.auditLog.log({
            co,
            actorEmail: actor.email,
            actorName: actor.name,
            action: 'master.import',
            entityType: 'sim_master_batch',
            summary: `Imported SIM master from ${file.originalname}`,
            details: {
                filename: file.originalname,
                result,
            },
        });
        return result;
    }
};
exports.SimMasterController = SimMasterController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('emailStatus')),
    __param(5, (0, common_1.Query)('phoneType')),
    __param(6, (0, common_1.Query)('includeInactive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], SimMasterController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('resolve-sap'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('personNumber')),
    __param(2, (0, common_1.Query)('displayName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], SimMasterController.prototype, "resolveSap", null);
__decorate([
    (0, common_1.Get)('template'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SimMasterController.prototype, "downloadTemplate", null);
__decorate([
    (0, common_1.Get)('sheet-breakdown'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SimMasterController.prototype, "sheetBreakdown", null);
__decorate([
    (0, common_1.Post)('check-duplicates'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, check_duplicate_dto_1.CheckDuplicateDto]),
    __metadata("design:returntype", void 0)
], SimMasterController.prototype, "checkDuplicates", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_sim_employee_dto_1.CreateSimEmployeeDto, Object]),
    __metadata("design:returntype", Promise)
], SimMasterController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, update_sim_employee_dto_1.UpdateSimEmployeeDto, Object]),
    __metadata("design:returntype", Promise)
], SimMasterController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/inactive'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", Promise)
], SimMasterController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Patch)(':id/active'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", Promise)
], SimMasterController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)(':id/reassign'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, reassign_phone_dto_1.ReassignPhoneDto, Object]),
    __metadata("design:returntype", Promise)
], SimMasterController.prototype, "reassign", null);
__decorate([
    (0, common_1.Post)('preview'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multer_upload_config_1.multerUploadConfig)),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SimMasterController.prototype, "preview", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multer_upload_config_1.multerUploadConfig)),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SimMasterController.prototype, "import", null);
exports.SimMasterController = SimMasterController = __decorate([
    (0, common_1.Controller)('sim-master'),
    (0, ebilling_access_decorator_1.RequireEbillingPermission)('master'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard, ebilling_permission_guard_1.EbillingPermissionGuard),
    __metadata("design:paramtypes", [sim_master_service_1.SimMasterService,
        audit_log_service_1.AuditLogService])
], SimMasterController);
//# sourceMappingURL=sim-master.controller.js.map