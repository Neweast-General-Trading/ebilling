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
var ClaudeInvoiceParser_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeInvoiceParser = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
function normalizePhone(raw) {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('9715') && digits.length >= 12) {
        return `0${digits.slice(3, 12)}`;
    }
    if (digits.startsWith('05') && digits.length >= 10) {
        return digits.slice(0, 10);
    }
    if (digits.startsWith('5') && digits.length >= 9) {
        return `0${digits.slice(0, 9)}`;
    }
    return digits;
}
function parseBillingMonth(raw) {
    if (!raw?.trim())
        return null;
    const iso = raw.trim().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        return `${iso.slice(0, 7)}-01`;
    }
    const ym = raw.trim().match(/^(\d{4})-(\d{2})$/);
    if (ym)
        return `${ym[1]}-${ym[2]}-01`;
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    }
    return null;
}
function extractJson(text) {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced?.[1]?.trim() || text.trim();
    try {
        return JSON.parse(candidate);
    }
    catch {
        const start = candidate.indexOf('{');
        const end = candidate.lastIndexOf('}');
        if (start >= 0 && end > start) {
            try {
                return JSON.parse(candidate.slice(start, end + 1));
            }
            catch {
                return null;
            }
        }
        return null;
    }
}
let ClaudeInvoiceParser = ClaudeInvoiceParser_1 = class ClaudeInvoiceParser {
    configService;
    logger = new common_1.Logger(ClaudeInvoiceParser_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    async parsePdfBuffer(buffer) {
        const apiKey = this.configService.get('ANTHROPIC_API_KEY');
        if (!apiKey?.trim()) {
            return null;
        }
        const client = new sdk_1.default({ apiKey: apiKey.trim() });
        const model = this.configService.get('ANTHROPIC_MODEL') ||
            'claude-sonnet-4-6';
        const response = await client.messages.create({
            model,
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'document',
                            source: {
                                type: 'base64',
                                media_type: 'application/pdf',
                                data: buffer.toString('base64'),
                            },
                        },
                        {
                            type: 'text',
                            text: `You are parsing a UAE e& (Etisalat) mobile invoice PDF.

Extract these fields and return ONLY valid JSON (no markdown):
{
  "phoneNumber": "05XXXXXXXX — 10-digit UAE mobile account number",
  "invoiceTotal": number — Total Amount Due in AED (including VAT),
  "usageAbovePackage": number — Usage Charge(s) / consumption above the package rental,
  "packageTotal": number — Service Rental(s) / base package amount on the invoice,
  "dueDate": "YYYY-MM-DD" — payment due date,
  "billingMonth": "YYYY-MM" — billing month inferred from bill period end or due date,
  "invoiceCode": "INV... — Bill number / invoice reference from the PDF header"
}

Use 0 for missing numeric fields. If a field cannot be found, use null.`,
                        },
                    ],
                },
            ],
        });
        const textBlock = response.content.find((block) => block.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
            return null;
        }
        const extracted = extractJson(textBlock.text);
        if (!extracted?.phoneNumber) {
            return null;
        }
        const phoneNumber = normalizePhone(extracted.phoneNumber);
        if (!phoneNumber.startsWith('05') || phoneNumber.length !== 10) {
            return null;
        }
        const billingMonth = parseBillingMonth(extracted.billingMonth) ||
            (extracted.dueDate ? parseBillingMonth(extracted.dueDate) : null);
        if (!billingMonth) {
            return null;
        }
        return {
            phoneNumber,
            packageValue: Number(extracted.packageTotal) || 0,
            overageAmount: Number(extracted.usageAbovePackage) || 0,
            amountDue: Number(extracted.invoiceTotal) || 0,
            billingMonth,
            dueDate: extracted.dueDate || null,
            invoiceCode: extracted.invoiceCode?.trim().toUpperCase() || null,
            rawText: textBlock.text,
            parserSource: 'auto',
        };
    }
    async parseWithFallback(buffer, regexFallback) {
        try {
            const parsedResult = await this.parsePdfBuffer(buffer);
            if (parsedResult?.phoneNumber && parsedResult.amountDue > 0) {
                return parsedResult;
            }
        }
        catch (error) {
            this.logger.warn(`PDF invoice parse failed, using regex fallback: ${error instanceof Error ? error.message : String(error)}`);
        }
        const regexResult = await regexFallback();
        return { ...regexResult, parserSource: 'regex', dueDate: null };
    }
};
exports.ClaudeInvoiceParser = ClaudeInvoiceParser;
exports.ClaudeInvoiceParser = ClaudeInvoiceParser = ClaudeInvoiceParser_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ClaudeInvoiceParser);
//# sourceMappingURL=claude-invoice.parser.js.map