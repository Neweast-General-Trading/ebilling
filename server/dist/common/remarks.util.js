"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCombinedRemarks = formatCombinedRemarks;
exports.isSystemRemarkLine = isSystemRemarkLine;
const SYSTEM_MARKERS = [
    "Approval not completed by the employee by the 15th",
    "Rejected split was not corrected by the employee by the 15th",
    "Full excess charged as personal deduction",
];
function isSystemRemarkLine(line) {
    const text = String(line || "")
        .replace(/^(HR|System):\s*/i, "")
        .trim();
    if (!text)
        return false;
    return SYSTEM_MARKERS.some((marker) => text.includes(marker));
}
function formatCombinedRemarks(employeeRemarks, adminRemarks, legacyRemarks) {
    const employee = employeeRemarks?.trim() || "";
    const admin = adminRemarks?.trim() || "";
    const legacy = legacyRemarks?.trim() || "";
    const parts = [];
    if (employee) {
        parts.push(`Employee: ${employee}`);
    }
    const adminLines = admin.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const systemLines = [];
    const hrLines = [];
    for (const line of adminLines) {
        const stripped = line.replace(/^(HR|System):\s*/i, "").trim();
        if (!stripped)
            continue;
        if (isSystemRemarkLine(stripped))
            systemLines.push(stripped);
        else
            hrLines.push(stripped);
    }
    if (!admin && legacy) {
        const legacyLines = legacy.split(/\n+/).map((line) => line.trim()).filter(Boolean);
        for (const line of legacyLines) {
            const stripped = line.replace(/^(HR|System|Employee):\s*/i, "").trim();
            if (isSystemRemarkLine(stripped))
                systemLines.push(stripped);
        }
    }
    for (const line of systemLines)
        parts.push(`System: ${line}`);
    for (const line of hrLines)
        parts.push(`HR: ${line}`);
    if (parts.length)
        return parts.join("\n");
    return legacy || null;
}
