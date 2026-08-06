"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.digitsOnly = digitsOnly;
exports.normalizeMobilePhone = normalizeMobilePhone;
exports.normalizeCalleePhone = normalizeCalleePhone;
exports.phoneLookupKeys = phoneLookupKeys;
exports.buildMasterPhoneSet = buildMasterPhoneSet;
exports.isPhoneInMaster = isPhoneInMaster;
exports.pairKey = pairKey;
exports.formatDuration = formatDuration;
exports.secondsToMinutes = secondsToMinutes;
exports.formatTalkMinutes = formatTalkMinutes;
function digitsOnly(phone) {
    return phone.replace(/\D/g, '');
}
function normalizeMobilePhone(raw) {
    const digits = digitsOnly(raw);
    if (digits.startsWith('9715') && digits.length >= 12) {
        return `0${digits.slice(3, 12)}`;
    }
    if (digits.startsWith('05') && digits.length >= 10) {
        return digits.slice(0, 10);
    }
    if (digits.startsWith('5') && digits.length >= 9) {
        return `0${digits.slice(0, 9)}`;
    }
    if (digits.length === 9 && /^[4567]/.test(digits)) {
        return `0${digits}`;
    }
    return digits;
}
function normalizeCalleePhone(raw) {
    const digits = digitsOnly(raw);
    if (!digits)
        return raw.trim();
    if (digits.startsWith('00') && digits.length > 4) {
        return digits;
    }
    return normalizeMobilePhone(raw);
}
function phoneLookupKeys(raw) {
    const keys = new Set();
    const digits = digitsOnly(raw);
    if (!digits)
        return [];
    keys.add(digits);
    keys.add(normalizeMobilePhone(raw));
    if (digits.startsWith('971')) {
        keys.add(`0${digits.slice(3)}`);
    }
    if (digits.length === 9) {
        keys.add(`0${digits}`);
    }
    if (digits.length === 10 && digits.startsWith('0')) {
        keys.add(digits.slice(1));
    }
    return [...keys].filter(Boolean);
}
function buildMasterPhoneSet(rows) {
    const set = new Set();
    for (const row of rows) {
        for (const key of phoneLookupKeys(row.phone_number)) {
            set.add(key);
        }
    }
    return set;
}
function isPhoneInMaster(phone, masterSet) {
    return phoneLookupKeys(phone).some((key) => masterSet.has(key));
}
function pairKey(phoneA, phoneB) {
    const a = normalizeMobilePhone(phoneA) || digitsOnly(phoneA);
    const b = normalizeMobilePhone(phoneB) || digitsOnly(phoneB);
    return [a, b].sort().join('|');
}
function formatDuration(seconds) {
    const safe = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
function secondsToMinutes(seconds, decimals = 1) {
    const safe = Math.max(0, Number(seconds) || 0);
    const factor = 10 ** decimals;
    return Math.round((safe / 60) * factor) / factor;
}
function formatTalkMinutes(seconds, decimals = 1) {
    const minutes = secondsToMinutes(seconds, decimals);
    return `${minutes.toFixed(decimals)} min`;
}
//# sourceMappingURL=invoice-phone.util.js.map