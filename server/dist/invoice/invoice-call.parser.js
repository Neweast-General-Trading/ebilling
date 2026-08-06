"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDurationToSeconds = parseDurationToSeconds;
exports.parseInvoiceCallsFromText = parseInvoiceCallsFromText;
const invoice_phone_util_1 = require("./invoice-phone.util");
const call_category_util_1 = require("./call-category.util");
const phone_country_util_1 = require("./phone-country.util");
const CALL_LINE_RE = /(\d{2}\s+[A-Za-z]+\s+\d{4}\s+\d{2}:\d{2}:\d{2})\s+[ÌI]?(\d{9,16})[ÍI]?(?:\s+([A-Za-z][A-Za-z\s-]*))?\s+(\d{2}:\d{2}:\d{2})\s+([\d,]+(?:\.\d{1,2})?)/g;
function parseDurationToSeconds(label) {
    const parts = label.split(':').map((part) => Number(part) || 0);
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    return 0;
}
function parseCallDate(raw) {
    const date = new Date(raw.replace(/\s+/g, ' '));
    return Number.isNaN(date.getTime()) ? null : date;
}
function classifyCallee(phone) {
    return (0, call_category_util_1.classifyCalleePhone)(phone);
}
function parseInvoiceCallsFromText(text) {
    const calls = [];
    const seen = new Set();
    for (const match of text.matchAll(CALL_LINE_RE)) {
        const callAtRaw = match[1].trim();
        const calleeDigits = match[2];
        const countryName = match[3]?.trim() || null;
        const durationLabel = match[4];
        const amount = Number(String(match[5]).replace(/,/g, '')) || 0;
        const durationSeconds = parseDurationToSeconds(durationLabel);
        const calleePhone = (0, invoice_phone_util_1.normalizeCalleePhone)(calleeDigits) || calleeDigits;
        const calleeCountryCode = (0, phone_country_util_1.resolveCountryCode)(calleePhone, countryName);
        const dedupeKey = `${callAtRaw}|${calleePhone}|${durationLabel}`;
        if (seen.has(dedupeKey))
            continue;
        seen.add(dedupeKey);
        calls.push({
            callAtRaw,
            callAt: parseCallDate(callAtRaw),
            calleePhone,
            calleeDisplay: calleePhone,
            calleeCountryName: countryName,
            calleeCountryCode,
            durationLabel,
            durationSeconds,
            amount,
            callCategory: classifyCallee(calleePhone),
        });
    }
    return calls.sort((a, b) => {
        const aTime = a.callAt?.getTime() ?? 0;
        const bTime = b.callAt?.getTime() ?? 0;
        return aTime - bTime;
    });
}
//# sourceMappingURL=invoice-call.parser.js.map