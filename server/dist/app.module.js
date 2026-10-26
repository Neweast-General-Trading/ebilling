"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const app_auth_module_1 = require("./app-auth/app-auth.module");
const database_module_1 = require("./database/database.module");
const oracle_module_1 = require("./oracle/oracle.module");
const sim_master_module_1 = require("./sim-master/sim-master.module");
const invoice_module_1 = require("./invoice/invoice.module");
const billing_module_1 = require("./billing/billing.module");
const notification_module_1 = require("./notifications/notification.module");
const samples_module_1 = require("./samples/samples.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const reports_module_1 = require("./reports/reports.module");
const internal_audit_module_1 = require("./internal-audit/internal-audit.module");
const analysis_reports_module_1 = require("./analysis-reports/analysis-reports.module");
const audit_log_module_1 = require("./audit-log/audit-log.module");
const permissions_module_1 = require("./permissions/permissions.module");
const ebilling_security_module_1 = require("./common/ebilling-security.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            schedule_1.ScheduleModule.forRoot(),
            app_auth_module_1.AppAuthModule,
            database_module_1.DatabaseModule,
            audit_log_module_1.AuditLogModule,
            permissions_module_1.PermissionsModule,
            ebilling_security_module_1.EbillingSecurityModule,
            oracle_module_1.OracleModule,
            sim_master_module_1.SimMasterModule,
            invoice_module_1.InvoiceModule,
            billing_module_1.BillingModule,
            notification_module_1.NotificationModule,
            samples_module_1.SamplesModule,
            dashboard_module_1.DashboardModule,
            reports_module_1.ReportsModule,
            internal_audit_module_1.InternalAuditModule,
            analysis_reports_module_1.AnalysisReportsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map