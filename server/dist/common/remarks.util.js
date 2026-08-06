"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCombinedRemarks = formatCombinedRemarks;
function formatCombinedRemarks(employeeRemarks, adminRemarks, legacyRemarks) {
    const employee = employeeRemarks?.trim() || '';
    const admin = adminRemarks?.trim() || '';
    const legacy = legacyRemarks?.trim() || '';
    const parts = [];
    if (employee) {
        parts.push(`Employee: ${employee}`);
    }
    if (admin) {
        parts.push(`HR: ${admin}`);
    }
    if (parts.length) {
        return parts.join('\n');
    }
    return legacy || null;
}
