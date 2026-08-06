"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRecoveryRequestTeamsMessage = buildRecoveryRequestTeamsMessage;
exports.buildRecoveryApprovedTeamsMessage = buildRecoveryApprovedTeamsMessage;
exports.buildRecoveryRejectedTeamsMessage = buildRecoveryRejectedTeamsMessage;
exports.buildExcessApprovalRequestTeamsMessage = buildExcessApprovalRequestTeamsMessage;
exports.getEbillingBaseUrl = getEbillingBaseUrl;
exports.buildInvoicesModuleUrl = buildInvoicesModuleUrl;
exports.buildRecoveryRequestUrl = buildRecoveryRequestUrl;
exports.buildInvoiceDeepLinkUrl = buildInvoiceDeepLinkUrl;
exports.buildExcessApprovalRequestUrl = buildExcessApprovalRequestUrl;

function getEbillingBaseUrl() {
    const raw = (process.env.EBILLING_PUBLIC_URL ||
        process.env.CLIENT_URL ||
        'https://ebilling.neweast.cloud').replace(/\/$/, '');
    let base = raw.replace(/\/login$/, '');
    // ebilling.neweast.cloud serves the SPA at site root (no /ebilling prefix).
    if (base.includes('ebilling.neweast.cloud')) {
        base = base.replace(/\/ebilling$/, '');
    }
    return base;
}
function buildInvoicesModuleUrl(co) {
    const params = new URLSearchParams();
    if (co)
        params.set('co', co);
    const query = params.toString();
    return `${getEbillingBaseUrl()}/invoices${query ? `?${query}` : ''}`;
}
function buildRecoveryRequestUrl(co, requestId) {
    const params = new URLSearchParams();
    if (co)
        params.set('co', co);
    params.set('recoveryRequest', String(requestId));
    return `${getEbillingBaseUrl()}/invoices?${params.toString()}`;
}
function buildInvoiceDeepLinkUrl(co, invoiceId, monthLabel) {
    const params = new URLSearchParams();
    if (co)
        params.set('co', co);
    params.set('invoiceId', String(invoiceId));
    if (monthLabel)
        params.set('month', String(monthLabel));
    return `${getEbillingBaseUrl()}/invoices?${params.toString()}`;
}
function line(label, value) {
    const safe = value == null || value === '' ? '—' : String(value);
    return `<b>${label}:</b> ${safe}<br>`;
}
function link(href, label) {
    return `<a href="${href}">${label}</a>`;
}
function buildRecoveryRequestTeamsMessage(input) {
    const requestUrl = buildRecoveryRequestUrl(input.co, input.requestId);
    const moduleUrl = buildInvoicesModuleUrl(input.co);
    return [
        '<b>eBilling — Recovery approval needed</b>',
        '<br><br>',
        line('Employee', input.displayName),
        line('Person #', input.personNumber),
        line('Phone', input.phoneNumber),
        line('Billing month', input.monthLabel),
        line('Recovery amount', `AED ${input.amount}`),
        line('Requested by', input.requestedBy),
        line('Request ID', `#${input.requestId}`),
        '<br>',
        link(requestUrl, 'Open this recovery request'),
        '<br>',
        link(moduleUrl, 'Open eBilling Invoices module'),
    ].join('');
}
function buildRecoveryApprovedTeamsMessage(input) {
    const invoiceUrl = buildInvoiceDeepLinkUrl(input.co, input.invoiceId, input.monthLabel);
    const moduleUrl = buildInvoicesModuleUrl(input.co);
    return [
        '<b>eBilling — Recovery sent to Oracle</b>',
        '<br><br>',
        line('Employee', input.displayName),
        line('Person #', input.personNumber),
        line('Phone', input.phoneNumber),
        line('Billing month', input.monthLabel),
        line('Recovery amount', `AED ${input.amount}`),
        line('Approved by', input.approvedBy),
        line('Request ID', `#${input.requestId}`),
        '<br>',
        link(invoiceUrl, 'View invoice in eBilling'),
        '<br>',
        link(moduleUrl, 'Open eBilling Invoices module'),
    ].join('');
}
function buildRecoveryRejectedTeamsMessage(input) {
    const invoiceUrl = buildInvoiceDeepLinkUrl(input.co, input.invoiceId, input.monthLabel);
    const moduleUrl = buildInvoicesModuleUrl(input.co);
    return [
        '<b>eBilling — Recovery request rejected</b>',
        '<br><br>',
        line('Employee', input.displayName),
        line('Person #', input.personNumber),
        line('Phone', input.phoneNumber),
        line('Billing month', input.monthLabel),
        line('Recovery amount', `AED ${input.amount}`),
        line('Rejected by', input.rejectedBy),
        line('Reason', input.reason),
        line('Request ID', `#${input.requestId}`),
        '<br>',
        link(invoiceUrl, 'View invoice in eBilling'),
        '<br>',
        link(moduleUrl, 'Open eBilling Invoices module'),
    ].join('');
}
function buildExcessApprovalRequestUrl(co, token) {
    const params = new URLSearchParams();
    if (co)
        params.set('co', co);
    if (token)
        params.set('token', String(token));
    const query = params.toString();
    const base = getEbillingBaseUrl().replace(/\/$/, '');
    return `${base}/approval-request${query ? `?${query}` : ''}`;
}
function buildExcessApprovalRequestTeamsMessage(input) {
    const requestUrl = buildExcessApprovalRequestUrl(input.co, input.accessToken);
    return [
        '<b>eBilling — Excess approval needed</b>',
        '<br><br>',
        link(requestUrl, 'Open Approval Request'),
        '<br>',
        `<span>Request link: ${requestUrl}</span>`,
        '<br><br>',
        line('Approver', input.approverEmail),
        line('Approval level', `${input.levelOrder} of ${input.totalLevels}`),
        line('Pending invoices', String(input.pendingCount)),
        line('Employee', input.employeeName || '—'),
        line('Billing month', input.monthLabel || '—'),
        line('Excess amount', input.excessAmount != null ? `AED ${Number(input.excessAmount).toFixed(2)}` : '—'),
    ].join('');
}
