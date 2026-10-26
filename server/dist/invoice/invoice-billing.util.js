"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateExceededAmount = calculateExceededAmount;
exports.resolveApprovalStatusOnUpload = resolveApprovalStatusOnUpload;
exports.resolveApprovalStatusAfterSubmit = resolveApprovalStatusAfterSubmit;
exports.resolveApprovalColumnLabel = resolveApprovalColumnLabel;
exports.calculateExcess = calculateExcess;
exports.previousBillingMonthKey = previousBillingMonthKey;
exports.formatBillingMonthLabel = formatBillingMonthLabel;
exports.extractOracleEntryId = extractOracleEntryId;
function round2(value) {
    return Math.round(value * 100) / 100;
}
function calculateExceededAmount(invoiceTotal, packageTotal) {
    if (invoiceTotal === null ||
        invoiceTotal === undefined ||
        packageTotal === null ||
        packageTotal === undefined) {
        return 0;
    }
    return round2(Math.max(0, invoiceTotal - packageTotal));
}
function resolveApprovalStatusOnUpload(invoiceTotal, packageTotal) {
    return calculateExceededAmount(invoiceTotal, packageTotal) > 0
        ? 'draft'
        : 'confirmed_by_user';
}
function resolveApprovalStatusAfterSubmit(personalUsage) {
    return personalUsage > 0 ? 'ready_for_recovery' : 'confirmed_by_user';
}
function resolveApprovalColumnLabel(row) {
    const exceeded = calculateExceededAmount(Number(row.invoice_total ?? 0), Number(row.package_total ?? 0));
    if (exceeded <= 0) {
        return 'CONFIRM BY USER';
    }
    const personal = row.personal_usage === null || row.personal_usage === undefined
        ? null
        : Number(row.personal_usage);
    const official = row.official_usage === null || row.official_usage === undefined
        ? null
        : Number(row.official_usage);
    const status = String(row.approval_status || '');
    if (status === 'pending_excess_approval') {
        const level = row.excess_approval_level ?? 1;
        return `Pending excess approval (L${level})`;
    }
    if (status === 'excess_rejected' || (status === 'waiting_confirmation' && row.excess_reject_reason)) {
        return 'Rejected — resubmit split';
    }
    if (status === 'pending_approval') {
        return 'Pending approval';
    }
    if (status === 'waiting_confirmation') {
        return `Waiting confirmation (${Number(row.approval_email_count) || 1})`;
    }
    if (status === 'recovery_sent') {
        return 'Recovery sent';
    }
    const submitted = Boolean(row.approval_submitted_at) ||
        personal !== null ||
        official !== null ||
        ['ready_for_recovery', 'confirmed_by_user', 'recovery_sent', 'pending_excess_approval'].includes(status);
    if (submitted) {
        const personalAmount = personal ?? 0;
        if (personalAmount <= 0) {
            return 'Exceed & confirm by user';
        }
        return 'Exceed & ready to recovery';
    }
    if (status === 'draft' || status === 'not_required') {
        return 'Send for approval';
    }
    return '—';
}
function calculateExcess(personalUsage, approvalStatus, exceededAmount = 0) {
    const exceeded = round2(exceededAmount ?? 0);
    const personal = personalUsage === null || personalUsage === undefined
        ? null
        : round2(personalUsage);
    if (approvalStatus === 'ready_for_recovery' || approvalStatus === 'recovery_sent') {
        return personal ?? exceeded;
    }
    if (approvalStatus === 'confirmed_by_user') {
        return exceeded;
    }
    if (approvalStatus === 'pending_approval' || approvalStatus === 'waiting_confirmation' || approvalStatus === 'draft') {
        return exceeded;
    }
    return 0;
}
function previousBillingMonthKey(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dubai',
        year: 'numeric',
        month: '2-digit',
    }).formatToParts(date);
    const year = Number(parts.find((part) => part.type === 'year')?.value || 0);
    const monthNum = Number(parts.find((part) => part.type === 'month')?.value || 0);
    const prev = new Date(Date.UTC(year, monthNum - 2, 1));
    return prev.toISOString().slice(0, 7);
}
function formatBillingMonthLabel(month) {
    const [year, monthNum] = month.split('-');
    const date = new Date(Number(year), Number(monthNum) - 1, 1);
    if (Number.isNaN(date.getTime()))
        return month;
    const monthName = date.toLocaleString('en-US', { month: 'long' });
    const shortYear = String(year).slice(-2);
    return `${monthName} ${shortYear}`;
}
function parseOracleRef(oracleResult) {
    if (!oracleResult) {
        return null;
    }
    if (typeof oracleResult === 'string') {
        try {
            return JSON.parse(oracleResult);
        }
        catch {
            return null;
        }
    }
    return oracleResult;
}
function extractOracleEntryId(oracleResult) {
    const ref = parseOracleRef(oracleResult);
    if (!ref) {
        return null;
    }
    const response = ref.oracleResponse;
    const entryId = response?.ElementEntryId
        ?? response?.ElementEntryValueId
        ?? ref.elementEntryId
        ?? ref.ElementEntryId
        ?? ref.entryId
        ?? ref.id
        ?? null;
    return entryId != null ? String(entryId) : null;
}
