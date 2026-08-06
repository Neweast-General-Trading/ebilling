"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EBILLING_PERMISSION_LABELS = exports.ALL_EBILLING_PERMISSIONS = exports.DEFAULT_EBILLING_PERMISSIONS = exports.EBILLING_PERMISSION_KEYS = void 0;
exports.isEbillingPermissionKey = isEbillingPermissionKey;
exports.EBILLING_PERMISSION_KEYS = [
    'dashboard',
    'invoices',
    'master',
    'reports',
    'analysis',
    'audit_log',
    'recovery_log',
    'excess_approval',
];
exports.DEFAULT_EBILLING_PERMISSIONS = [
    'dashboard',
    'invoices',
    'master',
    'reports',
];
exports.ALL_EBILLING_PERMISSIONS = [
    ...exports.EBILLING_PERMISSION_KEYS,
];
exports.EBILLING_PERMISSION_LABELS = {
    dashboard: 'Dashboard',
    invoices: 'Invoices',
    master: 'Master',
    reports: 'Reports',
    analysis: 'Analysis',
    audit_log: 'Audit log',
    recovery_log: 'Recovery log',
    excess_approval: 'Excess approval',
};
function isEbillingPermissionKey(value) {
    return exports.EBILLING_PERMISSION_KEYS.includes(value);
}
//# sourceMappingURL=ebilling-permissions.js.map