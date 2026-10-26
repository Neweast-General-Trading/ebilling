"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceModule = void 0;
const common_1 = require("@nestjs/common");
const invoice_controller_1 = require("./invoice.controller");
const invoice_folder_controller_1 = require("./invoice-folder.controller");
const recovery_request_controller_1 = require("./recovery-request.controller");
const excess_approval_controller_1 = require("./excess-approval.controller");
const invoice_service_1 = require("./invoice.service");
const recovery_request_service_1 = require("./recovery-request.service");
const excess_approval_service_1 = require("./excess-approval.service");
const claude_invoice_parser_1 = require("./claude-invoice.parser");
const invoice_call_service_1 = require("./invoice-call.service");
const monthly_deduction_report_service_1 = require("./monthly-deduction-report.service");
const monthly_deduction_cron_1 = require("./monthly-deduction.cron");
const notification_module_1 = require("../notifications/notification.module");
const sim_master_module_1 = require("../sim-master/sim-master.module");
const oracle_module_1 = require("../oracle/oracle.module");
let InvoiceModule = class InvoiceModule {
};
exports.InvoiceModule = InvoiceModule;
exports.InvoiceModule = InvoiceModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => notification_module_1.NotificationModule), sim_master_module_1.SimMasterModule, oracle_module_1.OracleModule],
        controllers: [invoice_controller_1.InvoiceController, invoice_folder_controller_1.InvoiceFolderController, recovery_request_controller_1.RecoveryRequestController, excess_approval_controller_1.ExcessApprovalController],
        providers: [invoice_service_1.InvoiceService, claude_invoice_parser_1.ClaudeInvoiceParser, invoice_call_service_1.InvoiceCallService, recovery_request_service_1.RecoveryRequestService, excess_approval_service_1.ExcessApprovalService, monthly_deduction_report_service_1.MonthlyDeductionReportService, monthly_deduction_cron_1.MonthlyDeductionCron],
        exports: [invoice_service_1.InvoiceService, invoice_call_service_1.InvoiceCallService, monthly_deduction_report_service_1.MonthlyDeductionReportService],
    })
], InvoiceModule);
//# sourceMappingURL=invoice.module.js.map