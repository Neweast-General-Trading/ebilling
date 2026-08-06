"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyCalleePhone = classifyCalleePhone;
exports.normalizeStoredCategory = normalizeStoredCategory;
exports.normalizedCategorySql = normalizedCategorySql;
exports.buildCallTypeFilterSql = buildCallTypeFilterSql;
const invoice_phone_util_1 = require("./invoice-phone.util");
function classifyCalleePhone(phone) {
    const digits = (0, invoice_phone_util_1.digitsOnly)(phone);
    const normalized = (0, invoice_phone_util_1.normalizeMobilePhone)(phone);
    if (digits.startsWith('00') && digits.length > 4) {
        return 'international';
    }
    if (digits.startsWith('971') && !digits.startsWith('9715')) {
        return 'international';
    }
    if (normalized.startsWith('05') && normalized.length === 10) {
        return 'mobile';
    }
    if (/^0[234679]/.test(normalized) ||
        /^0[89]/.test(normalized) ||
        /^(800|600|900|920)/.test(digits)) {
        return 'landline';
    }
    if (normalized.startsWith('0') && normalized.length >= 8 && normalized.length <= 11) {
        return 'landline';
    }
    if (!normalized.startsWith('0') && digits.length >= 9) {
        return 'international';
    }
    return 'international';
}
function normalizeStoredCategory(category) {
    if (category === 'mobile')
        return 'mobile';
    if (category === 'telephone' || category === 'landline')
        return 'landline';
    return 'international';
}
function normalizedCategorySql(column = 'c.call_category') {
    return `CASE
    WHEN ${column} IN ('mobile') THEN 'mobile'
    WHEN ${column} IN ('telephone', 'landline') THEN 'landline'
    ELSE 'international'
  END`;
}
function buildCallTypeFilterSql(filter, alias = 'c') {
    const categoryExpr = normalizedCategorySql(`${alias}.call_category`);
    switch (filter) {
        case 'internal':
            return `AND ${alias}.is_internal = TRUE`;
        case 'external':
            return `AND ${alias}.is_internal = FALSE`;
        case 'internal_mobile':
            return `AND ${alias}.is_internal = TRUE AND ${categoryExpr} = 'mobile'`;
        case 'internal_landline':
            return `AND ${alias}.is_internal = TRUE AND ${categoryExpr} = 'landline'`;
        case 'internal_international':
            return `AND ${alias}.is_internal = TRUE AND ${categoryExpr} = 'international'`;
        case 'external_mobile':
            return `AND ${alias}.is_internal = FALSE AND ${categoryExpr} = 'mobile'`;
        case 'external_landline':
            return `AND ${alias}.is_internal = FALSE AND ${categoryExpr} = 'landline'`;
        case 'external_international':
            return `AND ${alias}.is_internal = FALSE AND ${categoryExpr} = 'international'`;
        default:
            return '';
    }
}
//# sourceMappingURL=call-category.util.js.map