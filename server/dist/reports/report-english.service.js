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
var ReportEnglishService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportEnglishService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const report_text_util_1 = require("./report-text.util");
const report_json_util_1 = require("./report-json.util");
let ReportEnglishService = ReportEnglishService_1 = class ReportEnglishService {
    configService;
    logger = new common_1.Logger(ReportEnglishService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    async preparePdfContent(input) {
        const remarkKeys = new Map();
        input.rows.forEach((row, index) => {
            if (row.remarks && (0, report_text_util_1.containsArabic)(row.remarks)) {
                remarkKeys.set(String(index), row.remarks);
            }
        });
        const needsTranslation = (0, report_text_util_1.containsArabic)(input.title)
            || (0, report_text_util_1.containsArabic)(input.insights)
            || remarkKeys.size > 0;
        if (!needsTranslation) {
            return input;
        }
        const translated = await this.translateBatch({
            title: input.title,
            insights: input.insights,
            remarks: Object.fromEntries(remarkKeys),
        });
        const rows = input.rows.map((row, index) => {
            const remark = row.remarks;
            if (!remark || !(0, report_text_util_1.containsArabic)(remark))
                return row;
            const next = translated.remarks?.[String(index)]
                || (0, report_text_util_1.stripNonLatin)(remark, 'Remark on file');
            return { ...row, remarks: next };
        });
        return {
            title: translated.title || (0, report_text_util_1.stripNonLatin)(input.title, 'Billing Report'),
            insights: translated.insights ?? input.insights,
            rows,
        };
    }
    async translateBatch(payload) {
        const apiKey = this.configService.get('ANTHROPIC_API_KEY')?.trim();
        if (!apiKey) {
            return {
                title: (0, report_text_util_1.stripNonLatin)(payload.title, 'Billing Report'),
                insights: payload.insights
                    ? (0, report_text_util_1.stripNonLatin)(payload.insights, 'Report summary')
                    : null,
                remarks: Object.fromEntries(Object.entries(payload.remarks).map(([key, value]) => [
                    key,
                    (0, report_text_util_1.stripNonLatin)(value, 'Remark on file'),
                ])),
            };
        }
        const model = this.configService.get('ANTHROPIC_MODEL') || 'claude-sonnet-4-6';
        const client = new sdk_1.default({ apiKey });
        try {
            const response = await client.messages.create({
                model,
                max_tokens: 1024,
                system: 'Translate all provided report text to clear English for a PDF billing report. Return ONLY JSON: {"title":"...","insights":"... or null","remarks":{"0":"..."}}. Keep numbers, AED amounts, and employee names unchanged. No Arabic in output.',
                messages: [
                    {
                        role: 'user',
                        content: JSON.stringify(payload),
                    },
                ],
            });
            const textBlock = response.content.find((block) => block.type === 'text');
            if (!textBlock || textBlock.type !== 'text') {
                throw new Error('No translation text');
            }
            const parsed = (0, report_json_util_1.extractJsonObject)(textBlock.text);
            if (!parsed)
                throw new Error('Invalid translation JSON');
            return {
                title: parsed.title?.trim() || (0, report_text_util_1.stripNonLatin)(payload.title, 'Billing Report'),
                insights: parsed.insights === null || parsed.insights === undefined
                    ? payload.insights
                        ? (0, report_text_util_1.stripNonLatin)(payload.insights, 'Report summary')
                        : null
                    : parsed.insights.trim(),
                remarks: parsed.remarks || {},
            };
        }
        catch (error) {
            this.logger.warn(`Report translation failed: ${error instanceof Error ? error.message : String(error)}`);
            return {
                title: (0, report_text_util_1.stripNonLatin)(payload.title, 'Billing Report'),
                insights: payload.insights
                    ? (0, report_text_util_1.stripNonLatin)(payload.insights, 'Report summary')
                    : null,
                remarks: Object.fromEntries(Object.entries(payload.remarks).map(([key, value]) => [
                    key,
                    (0, report_text_util_1.stripNonLatin)(value, 'Remark on file'),
                ])),
            };
        }
    }
};
exports.ReportEnglishService = ReportEnglishService;
exports.ReportEnglishService = ReportEnglishService = ReportEnglishService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ReportEnglishService);
//# sourceMappingURL=report-english.service.js.map