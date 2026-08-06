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
exports.GenerateReportDto = exports.REPORT_PACKAGE_AMOUNT_FIELDS = exports.REPORT_SORT = exports.REPORT_FILTERS = exports.REPORT_COLUMNS = exports.REPORT_DATA_SOURCES = exports.REPORT_TYPES = exports.REPORT_PERIOD_MODES = void 0;
const class_validator_1 = require("class-validator");
exports.REPORT_PERIOD_MODES = ['single', 'range', 'all'];
exports.REPORT_TYPES = [
    'employee_detail',
    'summary',
    'excess_focus',
    'email_status',
    'sim_master',
];
exports.REPORT_DATA_SOURCES = ['invoices', 'sim_master', 'combined'];
exports.REPORT_COLUMNS = [
    'month',
    'employee',
    'phone',
    'email',
    'department',
    'package',
    'invoice',
    'personal_usage',
    'excess',
    'overage',
    'remarks',
    'email_status',
];
exports.REPORT_FILTERS = [
    'positive_excess',
    'zero_excess',
    'negative_excess',
    'has_invoice',
    'email_sent',
    'email_pending',
];
exports.REPORT_SORT = ['name', 'excess_desc', 'invoice_desc', 'month'];
exports.REPORT_PACKAGE_AMOUNT_FIELDS = ['packageValue', 'totalAmount'];
class GenerateReportDto {
    periodMode = 'single';
    month;
    monthFrom;
    monthTo;
    reportType;
    dataSource;
    columns;
    filters;
    sortBy;
    includeSummary;
    customPrompt;
    title;
    maxPackageTotal;
    minPackageTotal;
    packageAmountField;
}
exports.GenerateReportDto = GenerateReportDto;
__decorate([
    (0, class_validator_1.IsIn)(exports.REPORT_PERIOD_MODES),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "periodMode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}$/),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "month", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}$/),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "monthFrom", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}$/),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "monthTo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(exports.REPORT_TYPES),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "reportType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(exports.REPORT_DATA_SOURCES),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "dataSource", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], GenerateReportDto.prototype, "columns", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], GenerateReportDto.prototype, "filters", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(exports.REPORT_SORT),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GenerateReportDto.prototype, "includeSummary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "customPrompt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GenerateReportDto.prototype, "maxPackageTotal", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GenerateReportDto.prototype, "minPackageTotal", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(exports.REPORT_PACKAGE_AMOUNT_FIELDS),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "packageAmountField", void 0);
//# sourceMappingURL=generate-report.dto.js.map