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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ClaudeReportPlanner_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeReportPlanner = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const generate_report_dto_1 = require("./dto/generate-report.dto");
const report_json_util_1 = require("./report-json.util");
const report_prompt_parser_1 = require("./report-prompt.parser");
let ClaudeReportPlanner = ClaudeReportPlanner_1 = class ClaudeReportPlanner {
    configService;
    logger = new common_1.Logger(ClaudeReportPlanner_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    async planReport(dto, snapshot, availableMonths) {
        const prompt = dto.customPrompt?.trim();
        if (!prompt) {
            return {
                dto,
                insights: null,
                selectedEmployeeIds: null,
                selectedBillingKeys: null,
                includeInactiveEmployees: false,
                usedClaude: false,
            };
        }
        const apiKey = this.configService.get('ANTHROPIC_API_KEY');
        if (!apiKey?.trim()) {
            this.logger.warn('ANTHROPIC_API_KEY missing — using keyword report parser only');
            return {
                dto,
                insights: null,
                selectedEmployeeIds: null,
                selectedBillingKeys: null,
                includeInactiveEmployees: false,
                usedClaude: false,
            };
        }
        const model = this.configService.get('ANTHROPIC_MODEL') || 'claude-sonnet-4-6';
        const client = new sdk_1.default({ apiKey: apiKey.trim() });
        const compactPayload = {
            company: snapshot.company,
            stats: snapshot.stats,
            availableBillingMonths: availableMonths,
            uiOptions: dto,
            employees: snapshot.employees.map((row) => ({
                id: row.id,
                name: row.name,
                phone: row.phone,
                email: row.email,
                department: row.department,
                lineType: row.lineType,
                packageValue: row.packageValue,
                vatAmount: row.vatAmount,
                additionalAmount: row.additionalAmount,
                totalAmount: row.totalAmount,
                isActive: row.isActive,
            })),
            billingRows: snapshot.billingRows.map((row) => ({
                key: `${row.employeeId}:${row.month}`,
                employeeId: row.employeeId,
                employeeName: row.employeeName,
                month: row.month,
                phone: row.phone,
                packageTotal: row.packageTotal,
                invoiceTotal: row.invoiceTotal,
                personalUsage: row.personalUsage,
                excess: row.excess,
                overage: row.overage,
                remarks: row.remarks,
                emailSent: row.emailSent,
                invoiceCode: row.invoiceCode,
            })),
        };
        try {
            const response = await client.messages.create({
                model,
                max_tokens: 2048,
                system: `You are a billing analyst for RecTracking (e& SIM billing for New East).
You receive the FULL company database snapshot: all SIM Master employees and all invoice billing rows.
Excess formula: invoiceTotal - packageTotal - personalUsage.
SIM Master totalAmount = employee subscription total from ETISALAT master (NEGTE exp limit + VAT + additional).
Return ONLY valid JSON (no markdown) matching this schema:
{
  "title": "short report title",
  "dataSource": "sim_master" | "invoices" | "combined",
  "periodMode": "single" | "range" | "all",
  "month": "YYYY-MM optional when periodMode=single",
  "monthFrom": "YYYY-MM optional when periodMode=range",
  "monthTo": "YYYY-MM optional when periodMode=range",
  "reportType": ${JSON.stringify(generate_report_dto_1.REPORT_TYPES)},
  "columns": subset of ${JSON.stringify(generate_report_dto_1.REPORT_COLUMNS)},
  "filters": subset of ${JSON.stringify(generate_report_dto_1.REPORT_FILTERS)},
  "sortBy": one of ${JSON.stringify(generate_report_dto_1.REPORT_SORT)},
  "includeSummary": boolean,
  "includeInactiveEmployees": boolean,
  "maxPackageTotal": number or null — filter employees below this monthly amount,
  "minPackageTotal": number or null — filter employees above this monthly amount,
  "packageAmountField": "packageValue" | "totalAmount" — which field to compare (default totalAmount unless user says package/plan),
  "selectedEmployeeIds": null or array of employee ids to include (null = all matching filters),
  "selectedBillingKeys": null or array of "employeeId:YYYY-MM" keys for invoice rows,
  "insights": "2-4 sentences executive summary based on the actual data for the PDF header"
}
Rules:
- Prefer dataSource sim_master for subscription/master questions; invoices for billing/excess/email questions; combined when both matter.
- When user asks for all data or full database, use periodMode=all for invoices or include all employees.
- For package/subscription amount questions use dataSource sim_master and set maxPackageTotal/minPackageTotal instead of listing every id manually.
- Compare packageValue when user says package/plan/base; otherwise use totalAmount for monthly subscription total.
- columns must match the user request; default to the most relevant 5-8 columns.
- Use availableBillingMonths for month selection.
- title and insights MUST be English only (never Arabic).`,
                messages: [
                    {
                        role: 'user',
                        content: `User request:\n${prompt}\n\nDatabase snapshot:\n${JSON.stringify(compactPayload)}`,
                    },
                ],
            });
            const textBlock = response.content.find((block) => block.type === 'text');
            if (!textBlock || textBlock.type !== 'text') {
                throw new Error('Claude returned no text');
            }
            const parsed = (0, report_json_util_1.extractJsonObject)(textBlock.text);
            if (!parsed) {
                throw new Error('Claude returned invalid JSON');
            }
            const reportType = this.pickEnum(parsed.reportType, generate_report_dto_1.REPORT_TYPES, 'employee_detail');
            const merged = {
                ...dto,
                customPrompt: prompt,
                title: parsed.title?.trim() || dto.title,
                dataSource: this.pickEnum(parsed.dataSource, generate_report_dto_1.REPORT_DATA_SOURCES, dto.dataSource || 'invoices'),
                periodMode: this.pickEnum(parsed.periodMode, generate_report_dto_1.REPORT_PERIOD_MODES, dto.periodMode || 'all'),
                month: parsed.month || dto.month,
                monthFrom: parsed.monthFrom || dto.monthFrom,
                monthTo: parsed.monthTo || dto.monthTo,
                reportType,
                columns: this.pickColumns(parsed.columns, reportType, dto.columns),
                filters: this.pickFilters(parsed.filters, dto.filters),
                sortBy: this.pickEnum(parsed.sortBy, generate_report_dto_1.REPORT_SORT, dto.sortBy || 'name'),
                includeSummary: parsed.includeSummary ?? dto.includeSummary ?? true,
                maxPackageTotal: parsed.maxPackageTotal ?? dto.maxPackageTotal,
                minPackageTotal: parsed.minPackageTotal ?? dto.minPackageTotal,
                packageAmountField: parsed.packageAmountField ?? dto.packageAmountField,
            };
            return {
                dto: merged,
                insights: parsed.insights?.trim() || null,
                selectedEmployeeIds: this.normalizeIds(parsed.selectedEmployeeIds),
                selectedBillingKeys: this.normalizeKeys(parsed.selectedBillingKeys),
                includeInactiveEmployees: parsed.includeInactiveEmployees === true,
                usedClaude: true,
            };
        }
        catch (error) {
            this.logger.warn(`Claude report planning failed, using keyword parser: ${error instanceof Error ? error.message : String(error)}`);
            return {
                dto,
                insights: null,
                selectedEmployeeIds: null,
                selectedBillingKeys: null,
                includeInactiveEmployees: false,
                usedClaude: false,
            };
        }
    }
    pickEnum(value, allowed, fallback) {
        if (value && allowed.includes(value)) {
            return value;
        }
        return fallback;
    }
    pickColumns(value, reportType, fallback) {
        const base = fallback?.length ? fallback : (0, report_prompt_parser_1.defaultColumnsForType)(reportType);
        if (!value?.length)
            return base;
        const valid = value.filter((col) => generate_report_dto_1.REPORT_COLUMNS.includes(col));
        return valid.length ? valid : base;
    }
    pickFilters(value, fallback) {
        if (!value?.length)
            return fallback || [];
        return value.filter((filter) => generate_report_dto_1.REPORT_FILTERS.includes(filter));
    }
    normalizeIds(value) {
        if (!value?.length)
            return null;
        const ids = value.map((id) => Number(id)).filter((id) => Number.isFinite(id));
        return ids.length ? ids : null;
    }
    normalizeKeys(value) {
        if (!value?.length)
            return null;
        const keys = value.map((key) => String(key).trim()).filter(Boolean);
        return keys.length ? keys : null;
    }
};
exports.ClaudeReportPlanner = ClaudeReportPlanner;
exports.ClaudeReportPlanner = ClaudeReportPlanner = ClaudeReportPlanner_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ClaudeReportPlanner);
//# sourceMappingURL=claude-report.planner.js.map