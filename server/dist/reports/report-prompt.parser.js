"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPromptToReportDto = applyPromptToReportDto;
exports.defaultColumnsForType = defaultColumnsForType;
exports.reportTypeLabel = reportTypeLabel;
const report_text_util_1 = require("./report-text.util");
const MONTH_NAMES = {
    january: '01',
    jan: '01',
    february: '02',
    feb: '02',
    march: '03',
    mar: '03',
    april: '04',
    apr: '04',
    may: '05',
    june: '06',
    jun: '06',
    july: '07',
    jul: '07',
    august: '08',
    aug: '08',
    september: '09',
    sep: '09',
    sept: '09',
    october: '10',
    oct: '10',
    november: '11',
    nov: '11',
    december: '12',
    dec: '12',
};
function unique(items) {
    return [...new Set(items)];
}
function detectMonth(prompt, availableMonths) {
    const iso = prompt.match(/\b(20\d{2})[-/](0[1-9]|1[0-2])\b/);
    if (iso)
        return `${iso[1]}-${iso[2]}`;
    const shortYear = prompt.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\s*['']?(\d{2})\b/i);
    if (shortYear) {
        const monthNum = MONTH_NAMES[shortYear[1].toLowerCase()];
        const year = `20${shortYear[2]}`;
        const candidate = `${year}-${monthNum}`;
        if (availableMonths.includes(candidate))
            return candidate;
    }
    for (const month of availableMonths) {
        const label = month.toLowerCase();
        if (prompt.includes(label))
            return month;
    }
    return undefined;
}
function applyPromptToReportDto(dto, availableMonths) {
    const prompt = dto.customPrompt?.trim();
    if (!prompt)
        return dto;
    const lower = prompt.toLowerCase();
    const next = { ...dto };
    const columns = new Set(next.columns || []);
    const filters = new Set(next.filters || []);
    if (/\b(summary|totals|aggregate|overview|ملخص|إجمالي)\b/i.test(prompt)) {
        next.reportType = 'summary';
        next.includeSummary = true;
    }
    if (/\b(excess|overage|extra|زيادة|اكسس|exceed)\b/i.test(prompt)) {
        next.reportType = next.reportType || 'excess_focus';
        columns.add('excess');
        columns.add('package');
        columns.add('invoice');
        columns.add('personal_usage');
    }
    if (/\b(positive excess|over limit|above package)\b/i.test(prompt)) {
        filters.add('positive_excess');
    }
    if (/\b(email|sent|notification|إيميل|بريد)\b/i.test(prompt)) {
        next.reportType = next.reportType || 'email_status';
        columns.add('email');
        columns.add('email_status');
    }
    if (/\b(remark|note|comment|ملاحظ)\b/i.test(prompt)) {
        columns.add('remarks');
    }
    if (/\b(all months|full year|every month|كل الشهور)\b/i.test(prompt)) {
        next.periodMode = 'all';
    }
    const detectedMonth = detectMonth(lower, availableMonths);
    if (detectedMonth && next.periodMode === 'single' && !next.month) {
        next.month = detectedMonth;
    }
    if (/\b(department|dept)\b/i.test(prompt)) {
        columns.add('department');
    }
    if (/\b(master|sim master|subscription|subscribe|package value|total amount|negte exp|master data)\b/i.test(prompt)) {
        next.dataSource = 'sim_master';
        next.reportType = 'sim_master';
        next.includeSummary = true;
        columns.add('employee');
        columns.add('phone');
        columns.add('email');
        columns.add('department');
        columns.add('package');
        columns.add('overage');
    }
    if (!next.title && prompt.length <= 80 && !(0, report_text_util_1.containsArabic)(prompt)) {
        next.title = prompt;
    }
    if (columns.size)
        next.columns = unique([...columns]);
    if (filters.size)
        next.filters = unique([...filters]);
    return next;
}
function defaultColumnsForType(type) {
    switch (type) {
        case 'summary':
            return ['month', 'employee', 'package', 'invoice', 'excess'];
        case 'excess_focus':
            return [
                'employee',
                'phone',
                'package',
                'invoice',
                'personal_usage',
                'excess',
            ];
        case 'email_status':
            return ['employee', 'email', 'email_status', 'invoice', 'excess'];
        case 'sim_master':
            return ['employee', 'phone', 'email', 'department', 'package', 'overage'];
        case 'employee_detail':
        default:
            return [
                'month',
                'employee',
                'phone',
                'email',
                'department',
                'package',
                'invoice',
                'personal_usage',
                'excess',
                'remarks',
            ];
    }
}
function reportTypeLabel(type) {
    switch (type) {
        case 'summary':
            return 'Monthly summary';
        case 'excess_focus':
            return 'Excess focus';
        case 'email_status':
            return 'Email status';
        case 'sim_master':
            return 'SIM Master subscriptions';
        case 'employee_detail':
        default:
            return 'Employee detail';
    }
}
//# sourceMappingURL=report-prompt.parser.js.map