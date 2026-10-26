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
exports.InvoiceController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const app_auth_guard_1 = require("../app-auth/app-auth.guard");
const ebilling_access_decorator_1 = require("../common/ebilling-access.decorator");
const ebilling_co_guard_1 = require("../common/ebilling-co.guard");
const ebilling_permission_guard_1 = require("../common/ebilling-permission.guard");
const auth_user_util_1 = require("../common/auth-user.util");
const multer_upload_config_1 = require("../config/multer-upload.config");
const invoice_service_1 = require("./invoice.service");
const update_invoice_dto_1 = require("./dto/update-invoice.dto");
const send_invoice_email_dto_1 = require("./dto/send-invoice-email.dto");
const register_pending_invoice_dto_1 = require("./dto/register-pending-invoice.dto");
const submit_invoice_approval_dto_1 = require("./dto/submit-invoice-approval.dto");
const send_approval_bulk_dto_1 = require("./dto/send-approval-bulk.dto");
const push_recovery_bulk_dto_1 = require("./dto/push-recovery-bulk.dto");
let InvoiceController = class InvoiceController {
    invoiceService;
    constructor(invoiceService) {
        this.invoiceService = invoiceService;
    }
    listMonths(co) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.invoiceService.listMonths(co);
    }
    grid(co, month) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.invoiceService.getGridByMonth(co, month);
    }
    monthlyReport(co, month) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.invoiceService.getMonthlyControlReport(co, month);
    }
    async exportMonthlyReport(co, month, res) {
        if (!co)
            throw new Error('co query parameter is required');
        const file = await this.invoiceService.exportMonthlyControlExcel(co, month);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
        res.send(file.buffer);
    }
    upload(co, file, req) {
        if (!co)
            throw new Error('co query parameter is required');
        if (!file)
            throw new Error('PDF file is required');
        return this.invoiceService.uploadInvoice(co, file, (0, auth_user_util_1.getAuthActor)(req.user));
    }
    uploadBulk(co, files, req) {
        if (!co)
            throw new Error('co query parameter is required');
        if (!files?.length)
            throw new Error('PDF files are required');
        if (files.length > 20) {
            throw new common_1.BadRequestException('Maximum 20 PDF files per upload batch');
        }
        return this.invoiceService.uploadBulk(co, files, (0, auth_user_util_1.getAuthActor)(req.user));
    }
    sendBulk(co, body, req) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.invoiceService.sendBulkEmails(co, body.month, body.simEmployeeIds, (0, auth_user_util_1.getAuthActor)(req.user));
    }
    sendSingle(co, body, req) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.invoiceService.sendSingleEmail(co, body.simEmployeeId, body.month, (0, auth_user_util_1.getAuthActor)(req.user));
    }
    registerPending(co, token, dto, req) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.invoiceService.registerPendingUpload(co, token, dto, (0, auth_user_util_1.getAuthActor)(req.user));
    }
    archivePending(co, token, req) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.invoiceService.archivePendingUpload(co, token, (0, auth_user_util_1.getAuthActor)(req.user));
    }
    list(co, month) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.invoiceService.listByMonth(co, month);
    }
    listPendingApprovals(co, req) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.invoiceService.listPendingApprovals(co, (0, auth_user_util_1.getAuthActor)(req.user), req.user);
    }
    listApprovalQueue(co, req) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.invoiceService.listAdminApprovalQueue(co, (0, auth_user_util_1.getAuthActor)(req.user));
    }
    sendForApprovalBulk(co, body, req) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.invoiceService.sendForApprovalBulk(co, body.invoiceIds, (0, auth_user_util_1.getAuthActor)(req.user));
    }
    sendForApproval(co, id, req) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.invoiceService.sendForApproval(co, id, (0, auth_user_util_1.getAuthActor)(req.user));
    }
    sendApprovalReminder(co, id, req) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.invoiceService.sendApprovalReminder(co, id, (0, auth_user_util_1.getAuthActor)(req.user));
    }
    submitApproval(co, id, body, req) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.invoiceService.submitApproval(co, id, body, (0, auth_user_util_1.getAuthActor)(req.user), req.user);
    }
    listRecoverySent(co, page, pageSize, month, search, req) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.invoiceService.listRecoverySent(co, {
            page: Number(page) || 1,
            pageSize: Number(pageSize) || 25,
            month,
            search,
        }, (0, auth_user_util_1.getAuthActor)(req?.user));
    }
    pushRecoveryReady(co, body, req) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.invoiceService.pushRecoveryReady(co, body.invoiceIds, body.month, (0, auth_user_util_1.getAuthActor)(req.user));
    }
    getRecoveryPreview(co, id, req) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.invoiceService.getRecoveryPreview(co, id, (0, auth_user_util_1.getAuthActor)(req.user));
    }
    pushRecovery(co, id, req) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.invoiceService.pushRecovery(co, id, (0, auth_user_util_1.getAuthActor)(req.user));
    }
    async pdf(co, id, res) {
        if (!co)
            throw new Error('co query parameter is required');
        const attachment = await this.invoiceService.getPdfAttachment(co, id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${attachment.filename.replace(/"/g, '')}"`);
        res.sendFile(attachment.path);
    }
    update(co, id, dto, req) {
        if (!co)
            throw new Error('co query parameter is required');
        return this.invoiceService.updateInvoice(co, id, dto, (0, auth_user_util_1.getAuthActor)(req.user));
    }
};
exports.InvoiceController = InvoiceController;
__decorate([
    (0, common_1.Get)('months'),
    __param(0, (0, common_1.Query)('co')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InvoiceController.prototype, "listMonths", null);
__decorate([
    (0, common_1.Get)('grid'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InvoiceController.prototype, "grid", null);
__decorate([
    (0, common_1.Get)('monthly-report'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InvoiceController.prototype, "monthlyReport", null);
__decorate([
    (0, common_1.Get)('monthly-report/export'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "exportMonthlyReport", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multer_upload_config_1.multerUploadConfig)),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], InvoiceController.prototype, "upload", null);
__decorate([
    (0, common_1.Post)('upload-bulk'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 20, multer_upload_config_1.multerUploadConfig)),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.UploadedFiles)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object]),
    __metadata("design:returntype", void 0)
], InvoiceController.prototype, "uploadBulk", null);
__decorate([
    (0, common_1.Post)('send-bulk'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_invoice_email_dto_1.SendInvoiceBulkDto, Object]),
    __metadata("design:returntype", void 0)
], InvoiceController.prototype, "sendBulk", null);
__decorate([
    (0, common_1.Post)('send-single'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_invoice_email_dto_1.SendInvoiceSingleDto, Object]),
    __metadata("design:returntype", void 0)
], InvoiceController.prototype, "sendSingle", null);
__decorate([
    (0, common_1.Post)('pending/:token/register'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Param)('token')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, register_pending_invoice_dto_1.RegisterPendingInvoiceDto, Object]),
    __metadata("design:returntype", void 0)
], InvoiceController.prototype, "registerPending", null);
__decorate([
    (0, common_1.Post)('pending/:token/archive'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Param)('token')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], InvoiceController.prototype, "archivePending", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InvoiceController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('approvals/pending'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InvoiceController.prototype, "listPendingApprovals", null);
__decorate([
    (0, common_1.Get)('approvals/queue'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InvoiceController.prototype, "listApprovalQueue", null);
__decorate([
    (0, common_1.Post)('send-approval-bulk'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_approval_bulk_dto_1.SendApprovalBulkDto, Object]),
    __metadata("design:returntype", void 0)
], InvoiceController.prototype, "sendForApprovalBulk", null);
__decorate([
    (0, common_1.Post)(':id/send-for-approval'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", void 0)
], InvoiceController.prototype, "sendForApproval", null);
__decorate([
    (0, common_1.Post)(':id/send-approval-reminder'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", void 0)
], InvoiceController.prototype, "sendApprovalReminder", null);
__decorate([
    (0, common_1.Post)(':id/submit-approval'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, submit_invoice_approval_dto_1.SubmitInvoiceApprovalDto, Object]),
    __metadata("design:returntype", void 0)
], InvoiceController.prototype, "submitApproval", null);
__decorate([
    (0, common_1.Get)('recovery/sent'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __param(3, (0, common_1.Query)('month')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object]),
    __metadata("design:returntype", void 0)
], InvoiceController.prototype, "listRecoverySent", null);
__decorate([
    (0, common_1.Post)('recovery/push-ready'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, push_recovery_bulk_dto_1.PushRecoveryBulkDto, Object]),
    __metadata("design:returntype", void 0)
], InvoiceController.prototype, "pushRecoveryReady", null);
__decorate([
    (0, common_1.Get)(':id/recovery-preview'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", void 0)
], InvoiceController.prototype, "getRecoveryPreview", null);
__decorate([
    (0, common_1.Post)(':id/push-recovery'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", void 0)
], InvoiceController.prototype, "pushRecovery", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "pdf", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Query)('co')),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, update_invoice_dto_1.UpdateInvoiceDto, Object]),
    __metadata("design:returntype", void 0)
], InvoiceController.prototype, "update", null);
exports.InvoiceController = InvoiceController = __decorate([
    (0, common_1.Controller)('invoices'),
    (0, ebilling_access_decorator_1.RequireEbillingPermission)('invoices'),
    (0, common_1.UseGuards)(app_auth_guard_1.AppAuthGuard, ebilling_co_guard_1.EbillingCoGuard, ebilling_permission_guard_1.EbillingPermissionGuard),
    __metadata("design:paramtypes", [invoice_service_1.InvoiceService])
], InvoiceController);
//# sourceMappingURL=invoice.controller.js.map