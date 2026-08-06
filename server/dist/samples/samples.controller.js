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
exports.SamplesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const app_auth_guard_1 = require("../app-auth/app-auth.guard");
const ebilling_admin_access_guard_1 = require("../audit-log/ebilling-admin-access.guard");
const multer_upload_config_1 = require("../config/multer-upload.config");
const samples_service_1 = require("./samples.service");
let SamplesController = class SamplesController {
    samplesService;
    constructor(samplesService) {
        this.samplesService = samplesService;
    }
    list() {
        return {
            directory: this.samplesService.ensureDir(),
            files: this.samplesService.listFiles(),
        };
    }
    upload(files, req) {
        if (!files?.length) {
            throw new common_1.BadRequestException('No files uploaded');
        }
        const uploadedBy = req.user?.email || req.user?.preferred_username || null;
        const saved = files.map((file) => this.samplesService.saveUploadedFile(file, uploadedBy));
        return {
            uploaded: saved.length,
            files: saved,
            all: this.samplesService.listFiles(),
        };
    }
    download(file, res) {
        const target = this.samplesService.getDownloadTarget(file);
        res.download(target.path, target.name);
    }
};
exports.SamplesController = SamplesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SamplesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 20, multer_upload_config_1.samplesMulterUploadConfig)),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", void 0)
], SamplesController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)('download'),
    __param(0, (0, common_1.Query)('file')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SamplesController.prototype, "download", null);
exports.SamplesController = SamplesController = __decorate([
    (0, common_1.Controller)('samples'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_admin_access_guard_1.EbillingAdminAccessGuard),
    __metadata("design:paramtypes", [samples_service_1.SamplesService])
], SamplesController);
//# sourceMappingURL=samples.controller.js.map
