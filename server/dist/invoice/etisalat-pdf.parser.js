"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseEtisalatPdfBuffer = parseEtisalatPdfBuffer;
const pdf_text_util_1 = require("./pdf-text.util");
function parseAmount(value) {
    if (!value)
        return 0;
    return Number(String(value).replace(/,/g, '')) || 0;
}
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
function extractBillingMonth(text) {
    const periodMatch = text.match(/Bill\s*period\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})\s*-\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i);
    if (periodMatch?.[2]) {
        const end = new Date(periodMatch[2]);
        if (!Number.isNaN(end.getTime())) {
            return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-01`;
        }
    }
    const issueMatch = text.match(/Bill\s*issue\s*date\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i);
    if (issueMatch?.[1]) {
        const d = new Date(issueMatch[1]);
        if (!Number.isNaN(d.getTime())) {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
        }
    }
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}
function extractPhone(text) {
    const patterns = [
        /Account\s*Number:\s*(0?5[\d\s-]{8,14})/i,
        /\b(0?5[\d]{2}\s*-\s*[\d\s]{7,10})\b/,
        /Account\s*Number\s*\n?\s*(0?5[\d\s-]{8,14})/i,
    ];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[1]) {
            const phone = normalizePhone(match[1]);
            if (phone.startsWith('05') && phone.length === 10)
                return phone;
        }
    }
    return '';
}
function extractInvoiceCode(text) {
    const patterns = [
        /Bill\s*number\s+(INV[\d]+)/i,
        /Invoice\s*(?:No|Number|#)[:\s]+(INV[\d]+)/i,
        /\b(INV[\d]{8,})\b/,
    ];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[1])
            return match[1].toUpperCase();
    }
    return null;
}
async function parseEtisalatPdfBuffer(buffer) {
    const text = await (0, pdf_text_util_1.extractPdfText)(buffer);
    const phoneNumber = extractPhone(text);
    const serviceRentalMatch = text.match(/Service\s*Rentals?\s+([\d,]+(?:\.\d{1,2})?)/i);
    const usageChargesMatch = text.match(/Usage\s*Charges?\s+([\d,]+(?:\.\d{1,2})?)/i);
    const totalDueMatch = text.match(/Total\s*Amount\s*Due\s+([\d,]+(?:\.\d{1,2})?)/i);
    const packageValue = parseAmount(serviceRentalMatch?.[1]);
    const usageCharges = parseAmount(usageChargesMatch?.[1]);
    let amountDue = parseAmount(totalDueMatch?.[1]);
    if (!amountDue) {
        const headerDue = text.match(/Bill\s*period[\s\S]{0,120}?([\d,]+(?:\.\d{1,2})?)\s*AED\s*\nincl\s*5%\s*VAT/i);
        amountDue = parseAmount(headerDue?.[1]);
    }
    let overageAmount = usageCharges;
    if (!overageAmount && packageValue > 0 && amountDue > packageValue) {
        const vatMatch = text.match(/VAT\s*on\s*taxable\s*services\s*-Current\s*Period\s+([\d,]+(?:\.\d{1,2})?)/i);
        const vat = parseAmount(vatMatch?.[1]);
        overageAmount = Math.max(0, amountDue - packageValue - vat);
        if (overageAmount === 0 && amountDue > packageValue) {
            overageAmount = amountDue - packageValue;
        }
    }
    const billingMonth = extractBillingMonth(text);
    if (!phoneNumber) {
        throw new Error('Could not extract phone number from e& invoice PDF');
    }
    return {
        phoneNumber,
        packageValue,
        overageAmount,
        amountDue,
        billingMonth,
        invoiceCode: extractInvoiceCode(text),
        rawText: text,
    };
}
//# sourceMappingURL=etisalat-pdf.parser.js.map