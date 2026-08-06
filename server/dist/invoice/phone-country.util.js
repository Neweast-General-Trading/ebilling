"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countryNameToCode = countryNameToCode;
exports.resolveCountryCode = resolveCountryCode;
const invoice_phone_util_1 = require("./invoice-phone.util");
const CALLING_CODES = {
    '1': 'US',
    '7': 'RU',
    '20': 'EG',
    '27': 'ZA',
    '30': 'GR',
    '31': 'NL',
    '32': 'BE',
    '33': 'FR',
    '34': 'ES',
    '39': 'IT',
    '41': 'CH',
    '43': 'AT',
    '44': 'GB',
    '49': 'DE',
    '51': 'PE',
    '52': 'MX',
    '55': 'BR',
    '60': 'MY',
    '61': 'AU',
    '62': 'ID',
    '63': 'PH',
    '64': 'NZ',
    '65': 'SG',
    '66': 'TH',
    '81': 'JP',
    '82': 'KR',
    '86': 'CN',
    '90': 'TR',
    '91': 'IN',
    '92': 'PK',
    '93': 'AF',
    '94': 'LK',
    '95': 'MM',
    '98': 'IR',
    '212': 'MA',
    '213': 'DZ',
    '216': 'TN',
    '218': 'LY',
    '234': 'NG',
    '254': 'KE',
    '351': 'PT',
    '353': 'IE',
    '380': 'UA',
    '880': 'BD',
    '961': 'LB',
    '962': 'JO',
    '963': 'SY',
    '964': 'IQ',
    '965': 'KW',
    '966': 'SA',
    '967': 'YE',
    '968': 'OM',
    '970': 'PS',
    '971': 'AE',
    '972': 'IL',
    '973': 'BH',
    '974': 'QA',
    '977': 'NP',
    '992': 'TJ',
    '993': 'TM',
    '994': 'AZ',
    '995': 'GE',
    '996': 'KG',
    '998': 'UZ',
};
const COUNTRY_NAME_TO_CODE = {
    afghanistan: 'AF',
    australia: 'AU',
    bahrain: 'BH',
    bangladesh: 'BD',
    china: 'CN',
    egypt: 'EG',
    india: 'IN',
    iran: 'IR',
    iraq: 'IQ',
    jordan: 'JO',
    kuwait: 'KW',
    lebanon: 'LB',
    oman: 'OM',
    pakistan: 'PK',
    philippines: 'PH',
    qatar: 'QA',
    'saudi arabia': 'SA',
    'south africa': 'ZA',
    'sri lanka': 'LK',
    'united arab emirates': 'AE',
    'united kingdom': 'GB',
    'united states': 'US',
    yemen: 'YE',
};
function isUaeLocalPhone(digits) {
    return (/^0[245679]/.test(digits) ||
        /^05/.test(digits) ||
        /^(800|600|900|920)/.test(digits));
}
function countryNameToCode(name) {
    if (!name?.trim())
        return null;
    return COUNTRY_NAME_TO_CODE[name.trim().toLowerCase()] || null;
}
function resolveCountryCode(phone, countryName) {
    const fromName = countryNameToCode(countryName);
    if (fromName)
        return fromName;
    const digits = (0, invoice_phone_util_1.digitsOnly)(phone);
    if (!digits)
        return null;
    if (isUaeLocalPhone(digits))
        return 'AE';
    let intl = digits;
    if (intl.startsWith('00'))
        intl = intl.slice(2);
    for (const len of [3, 2, 1]) {
        const prefix = intl.slice(0, len);
        if (CALLING_CODES[prefix])
            return CALLING_CODES[prefix];
    }
    return null;
}
//# sourceMappingURL=phone-country.util.js.map