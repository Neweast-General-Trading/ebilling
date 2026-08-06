"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveLocalPromptRules = deriveLocalPromptRules;
exports.isDeterministicPackagePrompt = isDeterministicPackagePrompt;
const report_text_util_1 = require("./report-text.util");
function amountForEmployee(employee, field) {
    return field === 'packageValue' ? employee.packageValue : employee.totalAmount;
}
function detectAmountField(prompt) {
    if (/\b(total|subscription|monthly cost|اشتراك|إجمالي|تكلفة)\b/i.test(prompt)) {
        return 'totalAmount';
    }
    if (/\b(packages|package|plan|base|باقة|باقات)\b/i.test(prompt)) {
        return 'packageValue';
    }
    return 'totalAmount';
}
function activeWithLines(snapshot, requireLine) {
    return snapshot.employees.filter((employee) => {
        if (!employee.isActive)
            return false;
        if (requireLine && !employee.phone?.trim())
            return false;
        return true;
    });
}
function deriveLocalPromptRules(prompt, snapshot) {
    const text = prompt?.trim();
    if (!text)
        return null;
    const requireLine = /\b(lines?|line|sim|mobile|خط|خطوط|أرقام|ارقام)\b/i.test(text);
    const amountField = detectAmountField(text);
    const underMatch = text.match(/(?:less than|under|below|<\s*|أقل من|اقل من|أصغر من)\s*(\d+(?:\.\d+)?)\s*(?:aed|dirham|dirhams|درهم|dhs)?/i);
    const overMatch = text.match(/(?:more than|over|above|>\s*|greater than|أكثر من|اكثر من|أكبر من)\s*(\d+(?:\.\d+)?)\s*(?:aed|dirham|dirhams|درهم|dhs)?/i);
    const employees = activeWithLines(snapshot, requireLine);
    if (underMatch) {
        const max = Number(underMatch[1]);
        const matched = employees.filter((employee) => amountForEmployee(employee, amountField) < max);
        const label = amountField === 'packageValue' ? 'base package value' : 'monthly subscription total';
        return {
            dtoPatch: {
                dataSource: 'sim_master',
                reportType: 'sim_master',
                periodMode: 'all',
                maxPackageTotal: max,
                packageAmountField: amountField,
                title: !(0, report_text_util_1.containsArabic)(text) && text.length <= 120
                    ? text
                    : `Employees under AED ${max}/month (${label})`,
                columns: ['employee', 'phone', 'department', 'package', 'overage'],
                sortBy: 'name',
                includeSummary: true,
            },
            selectedEmployeeIds: matched.map((employee) => employee.id),
            insights: `${matched.length} active employee line(s) have ${label} below AED ${max.toFixed(2)}.`,
        };
    }
    if (overMatch) {
        const min = Number(overMatch[1]);
        const matched = employees.filter((employee) => amountForEmployee(employee, amountField) > min);
        const label = amountField === 'packageValue' ? 'base package value' : 'monthly subscription total';
        return {
            dtoPatch: {
                dataSource: 'sim_master',
                reportType: 'sim_master',
                periodMode: 'all',
                minPackageTotal: min,
                packageAmountField: amountField,
                title: !(0, report_text_util_1.containsArabic)(text) && text.length <= 120
                    ? text
                    : `Employees above AED ${min}/month (${label})`,
                columns: ['employee', 'phone', 'department', 'package', 'overage'],
                sortBy: 'invoice_desc',
                includeSummary: true,
            },
            selectedEmployeeIds: matched.map((employee) => employee.id),
            insights: `${matched.length} active employee line(s) have ${label} above AED ${min.toFixed(2)}.`,
        };
    }
    return null;
}
function isDeterministicPackagePrompt(prompt) {
    const text = prompt?.trim();
    if (!text)
        return false;
    return (/(?:less than|under|below|<\s*|أقل من|اقل من|أصغر من|more than|over|above|>\s*|greater than|أكثر من|اكثر من|أكبر من)/i.test(text) && /\d/.test(text));
}
//# sourceMappingURL=report-local-rules.js.map