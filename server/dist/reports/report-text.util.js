"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containsArabic = containsArabic;
exports.containsArabicInValues = containsArabicInValues;
exports.stripNonLatin = stripNonLatin;
const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
function containsArabic(text) {
    if (!text?.trim())
        return false;
    return ARABIC_RE.test(text);
}
function containsArabicInValues(values) {
    return values.some((value) => containsArabic(value));
}
function stripNonLatin(text, fallback) {
    const clean = text.replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
    return clean || fallback;
}
//# sourceMappingURL=report-text.util.js.map