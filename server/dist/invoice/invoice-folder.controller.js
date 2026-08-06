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
exports.InvoiceFolderController = void 0;
const common_1 = require("@nestjs/common");
const invoice_service_1 = require("./invoice.service");
const submit_invoice_approval_dto_1 = require("./dto/submit-invoice-approval.dto");
let InvoiceFolderController = class InvoiceFolderController {
    invoiceService;
    constructor(invoiceService) {
        this.invoiceService = invoiceService;
    }
    getFolderInvoice(token) {
        return this.invoiceService.getFolderInvoiceByToken(token);
    }
    submitFolderApproval(token, body) {
        return this.invoiceService.submitFolderApproval(token, body);
    }
};
exports.InvoiceFolderController = InvoiceFolderController;
__decorate([
    (0, common_1.Get)(':token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InvoiceFolderController.prototype, "getFolderInvoice", null);
__decorate([
    (0, common_1.Post)(':token/submit'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, submit_invoice_approval_dto_1.SubmitInvoiceApprovalDto]),
    __metadata("design:returntype", void 0)
], InvoiceFolderController.prototype, "submitFolderApproval", null);
exports.InvoiceFolderController = InvoiceFolderController = __decorate([
    (0, common_1.Controller)('invoices/folder'),
    __metadata("design:paramtypes", [invoice_service_1.InvoiceService])
], InvoiceFolderController);
