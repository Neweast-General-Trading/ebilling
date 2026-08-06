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
var InvoiceCallService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceCallService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const database_service_1 = require("../database/database.service");
const invoice_call_parser_1 = require("./invoice-call.parser");
const pdf_text_util_1 = require("./pdf-text.util");
const invoice_phone_util_1 = require("./invoice-phone.util");
let InvoiceCallService = InvoiceCallService_1 = class InvoiceCallService {
    db;
    logger = new common_1.Logger(InvoiceCallService_1.name);
    constructor(db) {
        this.db = db;
    }
    async parseInvoiceById(co, invoiceId) {
        const invoice = await this.loadInvoice(co, invoiceId);
        return this.parseAndStore(co, invoice);
    }
    async parseAllForCompany(co, month) {
        const params = [co];
        let monthFilter = '';
        if (month) {
            params.push(month);
            monthFilter = `AND to_char(i.billing_month, 'YYYY-MM') = $${params.length}`;
        }
        const result = await this.db.query(`SELECT i.id, i.sim_employee_id, i.phone_number, i.billing_month, i.pdf_storage_path
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE e.co = $1
         AND i.pdf_storage_path IS NOT NULL
         ${monthFilter}
       ORDER BY i.billing_month DESC, i.id`, params);
        let parsed = 0;
        let failed = 0;
        let totalCalls = 0;
        for (const row of result.rows) {
            try {
                const count = await this.parseAndStore(co, row);
                parsed += 1;
                totalCalls += count;
            }
            catch (error) {
                failed += 1;
                this.logger.warn(`Call parse failed for invoice ${row.id}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return { parsed, failed, totalCalls };
    }
    async loadInvoice(co, invoiceId) {
        const result = await this.db.query(`SELECT i.id, i.sim_employee_id, i.phone_number, i.billing_month, i.pdf_storage_path
       FROM invoices i
       INNER JOIN sim_employees e ON e.id = i.sim_employee_id
       WHERE e.co = $1 AND i.id = $2
       LIMIT 1`, [co, invoiceId]);
        if (!result.rows[0]) {
            throw new common_1.NotFoundException(`Invoice ${invoiceId} not found`);
        }
        return result.rows[0];
    }
    async parseAndStore(co, invoice) {
        if (!invoice.pdf_storage_path || !fs.existsSync(invoice.pdf_storage_path)) {
            throw new Error('Invoice PDF file is missing on disk');
        }
        const buffer = fs.readFileSync(invoice.pdf_storage_path);
        const text = await (0, pdf_text_util_1.extractPdfText)(buffer);
        const calls = (0, invoice_call_parser_1.parseInvoiceCallsFromText)(text);
        const masterResult = await this.db.query(`SELECT phone_number FROM sim_employees WHERE co = $1 AND is_active = TRUE`, [co]);
        const masterSet = (0, invoice_phone_util_1.buildMasterPhoneSet)(masterResult.rows);
        await this.db.query(`DELETE FROM invoice_call_records WHERE invoice_id = $1`, [
            invoice.id,
        ]);
        for (const call of calls) {
            const isInternal = (0, invoice_phone_util_1.isPhoneInMaster)(call.calleePhone, masterSet);
            await this.db.query(`INSERT INTO invoice_call_records (
          invoice_id, sim_employee_id, caller_phone, callee_phone, call_at,
          duration_seconds, duration_label, amount, call_category, is_internal, billing_month,
          callee_country_code, callee_country_name
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,(SELECT billing_month FROM invoices WHERE id = $1),$11,$12)
        ON CONFLICT DO NOTHING`, [
                invoice.id,
                invoice.sim_employee_id,
                invoice.phone_number,
                call.calleePhone,
                call.callAt,
                call.durationSeconds,
                call.durationLabel,
                call.amount,
                call.callCategory,
                isInternal,
                call.calleeCountryCode,
                call.calleeCountryName,
            ]);
        }
        await this.db.query(`UPDATE invoices
       SET calls_parsed_at = NOW(), call_count = $2
       WHERE id = $1`, [invoice.id, calls.length]);
        return calls.length;
    }
};
exports.InvoiceCallService = InvoiceCallService;
exports.InvoiceCallService = InvoiceCallService = InvoiceCallService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], InvoiceCallService);
//# sourceMappingURL=invoice-call.service.js.map