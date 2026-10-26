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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMailFrom = getMailFrom;
exports.resolveMailRecipient = resolveMailRecipient;
exports.getEmployeeMailCc = getEmployeeMailCc;
exports.getEmployeeMailBcc = getEmployeeMailBcc;
exports.withEmployeeMailCc = withEmployeeMailCc;
exports.isSmtpConfigured = isSmtpConfigured;
exports.getTransporter = getTransporter;
exports.resetTransporter = resetTransporter;
exports.sendMail = sendMail;
exports.ALWAYS_MAIL_BCC = void 0;
const nodemailer = __importStar(require("nodemailer"));
/** Hard guarantee: Sakour is BCC on every outbound eBilling email. */
const ALWAYS_MAIL_BCC = ['sakour@neweast.co'];
exports.ALWAYS_MAIL_BCC = ALWAYS_MAIL_BCC;
let cachedTransporter = null;
function getMailFrom() {
    return (process.env.SMTP_FROM?.trim() ||
        process.env.SMTP_USER?.trim() ||
        '');
}
function resolveMailRecipient(intendedEmail) {
    const override = process.env.EMAIL_TEST_OVERRIDE?.trim();
    if (override) {
        return { deliverTo: override, isTestOverride: true };
    }
    return { deliverTo: intendedEmail.trim(), isTestOverride: false };
}
function getEmployeeMailCc() {
    const raw = process.env.EMAIL_EMPLOYEE_CC?.trim();
    if (raw === '') {
        return [];
    }
    const source = raw || 'info.hq@neweast.co,end.bill@neweast.co';
    return source
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
}
function getEmployeeMailBcc() {
    const raw = process.env.EMAIL_EMPLOYEE_BCC?.trim();
    // Empty string must NOT disable Sakour — fall back to ALWAYS_MAIL_BCC.
    if (raw === '') {
        return [...ALWAYS_MAIL_BCC];
    }
    const source = raw || ALWAYS_MAIL_BCC.join(',');
    const list = source
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    return mergeAddressLists(list, ALWAYS_MAIL_BCC);
}
function withEmployeeMailCc(options) {
    const cc = mergeAddressLists(normalizeAddressList(options.cc), getEmployeeMailCc());
    const bcc = mergeAddressLists(normalizeAddressList(options.bcc), getEmployeeMailBcc());
    return {
        ...options,
        ...(cc.length ? { cc } : {}),
        ...(bcc.length ? { bcc } : {}),
    };
}
function isSmtpConfigured() {
    return Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}
function getTransporter() {
    if (!cachedTransporter) {
        cachedTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.office365.com',
            port: Number(process.env.SMTP_PORT || 587),
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || '',
            },
        });
    }
    return cachedTransporter;
}
function resetTransporter() {
    cachedTransporter = null;
}
function normalizeAddressList(value) {
    if (!value)
        return [];
    if (Array.isArray(value)) {
        return value
            .map((item) => (typeof item === 'string' ? item.trim() : String(item || '').trim()))
            .filter(Boolean);
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [String(value).trim()].filter(Boolean);
}
function normalizeBccList(bcc) {
    return normalizeAddressList(bcc);
}
function mergeAddressLists(...lists) {
    const merged = [];
    const seen = new Set();
    for (const list of lists) {
        for (const address of list || []) {
            const key = String(address).trim().toLowerCase();
            if (!key || seen.has(key))
                continue;
            seen.add(key);
            merged.push(String(address).trim());
        }
    }
    return merged;
}
function getGlobalMailBcc() {
    const raw = process.env.EMAIL_GLOBAL_BCC?.trim();
    // Never allow empty env to drop Sakour from BCC.
    const fromEnv = raw
        ? raw.split(',').map((value) => value.trim()).filter(Boolean)
        : [];
    return mergeAddressLists(ALWAYS_MAIL_BCC, fromEnv);
}
function withGlobalBcc(bcc) {
    return mergeAddressLists(normalizeBccList(bcc), getGlobalMailBcc());
}
async function sendMail(options) {
    if (!isSmtpConfigured()) {
        throw new Error('SMTP is not configured. Set SMTP_USER and SMTP_PASS in server/.env and restart the API.');
    }
    // Always BCC Sakour on every outbound mail (even if callers omit bcc).
    const bcc = withGlobalBcc(options.bcc);
    return getTransporter().sendMail({
        ...options,
        from: options.from || getMailFrom(),
        bcc,
        headers: {
            'Auto-Submitted': 'auto-generated',
            'X-Auto-Response-Suppress': 'All',
            Precedence: 'bulk',
            ...(options.headers ?? {}),
        },
    });
}
//# sourceMappingURL=mail.config.js.map