"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeEmail = normalizeEmail;
exports.canAccessEbilling = canAccessEbilling;
exports.canAccessEbillingAdminTools = canAccessEbillingAdminTools;
exports.canTrackExcessApprovalRequests = canTrackExcessApprovalRequests;
exports.canSendExcessApprovalToMatrix = canSendExcessApprovalToMatrix;
exports.canManageEbillingPermissions = canManageEbillingPermissions;
exports.isRecoveryApprover = isRecoveryApprover;
exports.emailFromAuthUser = emailFromAuthUser;
exports.formatDisplayEmail = formatDisplayEmail;
exports.isCorporateEbillingEmail = isCorporateEbillingEmail;
const EBILLING_ADMIN_EMAILS = [
    'sakour@neweast.co',
    'sakour@neweast.com',
    'jadsakour@neweast.co',
    'guru@neweast.com',
    'henry@neweast.co',
    'thanzil@neweast.co',
    'muhammed.fawaz@neweast.co',
];
const EBILLING_ALLOWED_EMAILS = [
    ...EBILLING_ADMIN_EMAILS,
    'soumya.antony@neweast.co',
    'sijo@neweast.com',
    'olga@neweast.co',
    'mais.alhamwi@neweast.com',
    'info.hq@neweast.co',
    'athira@neweast.co',
];
exports.EBILLING_ALLOWED_EMAILS = EBILLING_ALLOWED_EMAILS;
const PERMISSION_GRANTOR_EMAILS = [
    'sakour@neweast.co',
    'sakour@neweast.com',
];
const RECOVERY_APPROVER_EMAILS = ['olga@neweast.co', 'olga@neweast.com'];
const EBILLING_EXCESS_OPERATIONS_EMAILS = ['info.hq@neweast.co'];
function normalizeEmail(email) {
    const normalized = email?.trim().toLowerCase();
    return normalized || null;
}
function canAccessEbilling(email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail)
        return false;
    if (!isCorporateEbillingEmail(normalizedEmail))
        return false;
    return EBILLING_ALLOWED_EMAILS.some((allowed) => allowed.toLowerCase() === normalizedEmail);
}
function canAccessEbillingAdminTools(email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail)
        return false;
    return EBILLING_ADMIN_EMAILS.some((allowed) => allowed.toLowerCase() === normalizedEmail);
}
function canTrackExcessApprovalRequests(email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail)
        return false;
    if (canAccessEbillingAdminTools(normalizedEmail))
        return true;
    return EBILLING_EXCESS_OPERATIONS_EMAILS.some((allowed) => allowed.toLowerCase() === normalizedEmail);
}
function canSendExcessApprovalToMatrix(email) {
    return canTrackExcessApprovalRequests(email);
}
function canManageEbillingPermissions(email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail)
        return false;
    return PERMISSION_GRANTOR_EMAILS.some((allowed) => allowed.toLowerCase() === normalizedEmail);
}
function isRecoveryApprover(email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail)
        return false;
    return RECOVERY_APPROVER_EMAILS.some((allowed) => allowed.toLowerCase() === normalizedEmail);
}
function emailFromAuthUser(user) {
    if (!user || typeof user !== 'object')
        return null;
    const record = user;
    return record.email || record.preferred_username || null;
}
function formatDisplayEmail(email) {
    const trimmed = email.trim();
    const atIndex = trimmed.indexOf('@');
    if (atIndex <= 0)
        return trimmed;
    const local = trimmed.slice(0, atIndex);
    const domain = trimmed.slice(atIndex + 1).toLowerCase();
    const formattedLocal = local.charAt(0).toUpperCase() + local.slice(1).toLowerCase();
    return `${formattedLocal}@${domain}`;
}
function isCorporateEbillingEmail(email) {
    const normalized = normalizeEmail(email);
    if (!normalized)
        return false;
    return normalized.endsWith('@neweast.co') || normalized.endsWith('@neweast.com');
}
//# sourceMappingURL=ebilling-admin-access.js.map