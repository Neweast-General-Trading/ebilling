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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildReportPdf = buildReportPdf;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const report_prompt_parser_1 = require("./report-prompt.parser");
const COLUMN_META = {
    month: { label: 'Month', weight: 0.85, align: 'left' },
    employee: { label: 'Employee', weight: 1.55, align: 'left' },
    phone: { label: 'Phone', weight: 0.9, align: 'right' },
    email: { label: 'Email', weight: 1.3, align: 'left' },
    department: { label: 'Department', weight: 1.1, align: 'left' },
    package: { label: 'Package (AED)', weight: 0.85, align: 'right' },
    invoice: { label: 'Invoice (AED)', weight: 0.85, align: 'right' },
    personal_usage: { label: 'Personal (AED)', weight: 0.85, align: 'right' },
    excess: { label: 'Excess (AED)', weight: 0.85, align: 'right' },
    overage: { label: 'Overage (AED)', weight: 0.85, align: 'right' },
    remarks: { label: 'Remarks', weight: 1.1, align: 'left' },
    email_status: { label: 'Email', weight: 0.7, align: 'center' },
};
const LOGO_PATH = path.join(process.cwd(), 'assets/email/neweast-logo.png');
const COLORS = {
    brand: '#0f766e',
    brandDark: '#115e59',
    brandLight: '#ecfdf5',
    text: '#1e293b',
    muted: '#64748b',
    border: '#cbd5e1',
    rowAlt: '#f8fafc',
    white: '#ffffff',
    headerText: '#ffffff',
    accent: '#99f6e4',
};
const ROW_HEIGHT = 17;
const HEADER_HEIGHT = 20;
const CELL_PAD_X = 6;
const FONT = 'Helvetica';
const FONT_BOLD = 'Helvetica-Bold';
function formatAmount(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '—';
    }
    return Number(value).toLocaleString('en-AE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
function truncate(value, max) {
    const clean = value.replace(/\s+/g, ' ').trim();
    if (clean.length <= max)
        return clean;
    return `${clean.slice(0, max - 1)}…`;
}
function cellValue(row, column) {
    switch (column) {
        case 'month':
            return row.monthLabel;
        case 'employee':
            return truncate(row.display_name || '—', 42);
        case 'phone':
            return row.phone_number || '—';
        case 'email':
            return truncate(row.email || '—', 36);
        case 'department':
            return truncate(row.department_name || '—', 28);
        case 'package':
            return formatAmount(row.package_total);
        case 'invoice':
            return formatAmount(row.invoice_total);
        case 'personal_usage':
            return formatAmount(row.personal_usage);
        case 'excess':
            return formatAmount(row.excess);
        case 'overage':
            return formatAmount(row.overage_amount);
        case 'remarks':
            return truncate(row.remarks || '—', 40);
        case 'email_status':
            return row.email_sent_at ? 'Sent' : 'Pending';
        default:
            return '—';
    }
}
function computeColumnWidths(columns, tableWidth) {
    const weights = columns.map((col) => COLUMN_META[col].weight);
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    return weights.map((weight) => (tableWidth * weight) / total);
}
function writeFixedText(doc, text, x, top, width, options) {
    const savedY = doc.y;
    const savedX = doc.x;
    doc
        .font(options?.bold ? FONT_BOLD : FONT)
        .fontSize(options?.fontSize ?? 8)
        .fillColor(options?.color ?? COLORS.text)
        .text(text, x, top, {
        width,
        height: options?.height ?? 14,
        align: options?.align ?? 'left',
        lineBreak: false,
        ellipsis: true,
    });
    doc.y = savedY;
    doc.x = savedX;
}
function writeCell(doc, text, x, y, width, align, options) {
    const cellTop = y + 4;
    const savedY = doc.y;
    doc
        .font(options?.bold ? FONT_BOLD : FONT)
        .fontSize(7.5)
        .fillColor(options?.color || COLORS.text)
        .text(text, x + CELL_PAD_X, cellTop, {
        width: width - CELL_PAD_X * 2,
        height: ROW_HEIGHT - 6,
        align,
        ellipsis: true,
        lineBreak: false,
    });
    doc.y = savedY;
}
function buildReportPdf(input) {
    return new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({
            size: 'A4',
            layout: 'landscape',
            margins: { top: 32, bottom: 36, left: 32, right: 32 },
            bufferPages: true,
        });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        const left = doc.page.margins.left;
        const tableWidth = doc.page.width - left - doc.page.margins.right;
        const footerY = () => doc.page.height - 26;
        const pageBottom = () => doc.page.height - doc.page.margins.bottom - 18;
        let y = doc.page.margins.top;
        let pageNum = 1;
        const columns = input.columns.filter((col) => COLUMN_META[col]);
        const colWidths = computeColumnWidths(columns, tableWidth);
        const drawFooter = (current, total) => {
            const fy = footerY();
            const savedY = doc.y;
            const savedX = doc.x;
            doc
                .moveTo(left, fy - 8)
                .lineTo(left + tableWidth, fy - 8)
                .strokeColor(COLORS.border)
                .lineWidth(0.5)
                .stroke();
            writeFixedText(doc, 'RecTracking · e& SIM Billing', left, fy, tableWidth * 0.55, {
                fontSize: 7,
                color: COLORS.muted,
                height: 10,
            });
            writeFixedText(doc, `Page ${current} of ${total}`, left, fy, tableWidth, {
                fontSize: 7,
                color: COLORS.muted,
                align: 'right',
                height: 10,
            });
            doc.y = savedY;
            doc.x = savedX;
        };
        const drawTableHeader = () => {
            doc.rect(left, y, tableWidth, HEADER_HEIGHT).fill(COLORS.brand);
            let x = left;
            columns.forEach((column, index) => {
                const meta = COLUMN_META[column];
                const label = column === 'package' && input.reportType === 'sim_master'
                    ? 'Subscription (AED)'
                    : meta.label;
                writeCell(doc, label, x, y, colWidths[index], meta.align, {
                    bold: true,
                    color: COLORS.headerText,
                });
                if (index > 0) {
                    doc
                        .moveTo(x, y + 3)
                        .lineTo(x, y + HEADER_HEIGHT - 3)
                        .strokeColor(COLORS.brandDark)
                        .lineWidth(0.5)
                        .stroke();
                }
                x += colWidths[index];
            });
            y += HEADER_HEIGHT;
        };
        const startContinuationPage = () => {
            doc.addPage({ size: 'A4', layout: 'landscape', margins: doc.page.margins });
            pageNum += 1;
            y = doc.page.margins.top;
            doc.y = y;
            doc.x = left;
            writeFixedText(doc, truncate(input.title, 90), left, y, tableWidth, {
                bold: true,
                fontSize: 9,
                color: COLORS.brand,
                height: 12,
            });
            y += 14;
            drawTableHeader();
        };
        const drawRow = (row, rowIndex) => {
            if (y + ROW_HEIGHT > pageBottom()) {
                startContinuationPage();
            }
            if (rowIndex % 2 === 0) {
                doc.rect(left, y, tableWidth, ROW_HEIGHT).fill(COLORS.rowAlt);
            }
            let x = left;
            columns.forEach((column, index) => {
                const meta = COLUMN_META[column];
                const value = cellValue(row, column);
                const isExcess = column === 'excess' && row.excess !== null;
                const color = isExcess && row.excess > 0
                    ? '#dc2626'
                    : isExcess && row.excess < 0
                        ? '#059669'
                        : COLORS.text;
                writeCell(doc, value, x, y, colWidths[index], meta.align, {
                    bold: column === 'employee',
                    color,
                });
                x += colWidths[index];
            });
            doc
                .moveTo(left, y + ROW_HEIGHT)
                .lineTo(left + tableWidth, y + ROW_HEIGHT)
                .strokeColor(COLORS.border)
                .lineWidth(0.35)
                .stroke();
            y += ROW_HEIGHT;
        };
        doc.rect(left, y, tableWidth, 3).fill(COLORS.brand);
        if (fs.existsSync(LOGO_PATH)) {
            doc.image(LOGO_PATH, left, y + 10, { width: 56 });
        }
        doc
            .font(FONT)
            .fontSize(8)
            .fillColor(COLORS.muted);
        writeFixedText(doc, 'New East General Trading', left + tableWidth - 180, y + 12, 180, { fontSize: 8, color: COLORS.muted, align: 'right', height: 10 });
        writeFixedText(doc, 'e& SIM Billing Report', left + tableWidth - 180, y + 24, 180, { fontSize: 7, color: COLORS.muted, align: 'right', height: 10 });
        y += 52;
        writeFixedText(doc, truncate(input.title, 120), left, y, tableWidth, {
            bold: true,
            fontSize: 15,
            color: COLORS.brandDark,
            height: 18,
        });
        y += 22;
        const generated = input.generatedAt.toLocaleString('en-AE', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
        writeFixedText(doc, `${(0, report_prompt_parser_1.reportTypeLabel)(input.reportType)}   |   ${input.periodLabel}   |   ${input.company}   |   ${input.summary.rowCount} records   |   ${generated}`, left, y, tableWidth, { fontSize: 8, color: COLORS.muted, height: 12 });
        y += 16;
        if (input.insights?.trim()) {
            const insight = input.insights.trim().replace(/\s+/g, ' ');
            doc
                .roundedRect(left, y, tableWidth, 28, 3)
                .fillAndStroke(COLORS.brandLight, COLORS.accent);
            writeFixedText(doc, 'Summary', left + 10, y + 7, 48, {
                bold: true,
                fontSize: 7,
                color: COLORS.brandDark,
                height: 10,
            });
            writeFixedText(doc, insight, left + 62, y + 7, tableWidth - 72, {
                fontSize: 7.5,
                height: 16,
            });
            y += 34;
        }
        if (input.includeSummary) {
            const stats = [
                ['Package', formatAmount(input.summary.totalPackage)],
                ['Invoice', formatAmount(input.summary.totalInvoice)],
                ['Personal', formatAmount(input.summary.totalPersonalUsage)],
                ['Excess', formatAmount(input.summary.totalExcess)],
                ['+Excess', String(input.summary.positiveExcessCount)],
                ['Emails', String(input.summary.emailsSent)],
            ];
            const gap = 6;
            const statW = (tableWidth - gap * (stats.length - 1)) / stats.length;
            stats.forEach(([label, value], index) => {
                const x = left + index * (statW + gap);
                doc
                    .roundedRect(x, y, statW, 26, 3)
                    .fillAndStroke('#ffffff', COLORS.border);
                writeFixedText(doc, label, x + 6, y + 5, statW - 12, {
                    fontSize: 6.5,
                    color: COLORS.muted,
                    height: 8,
                });
                writeFixedText(doc, value, x + 6, y + 13, statW - 12, {
                    bold: true,
                    fontSize: 9,
                    color: COLORS.brand,
                    align: 'right',
                    height: 10,
                });
            });
            y += 34;
        }
        y += 4;
        doc.y = y;
        drawTableHeader();
        if (!input.rows.length) {
            writeFixedText(doc, 'No rows match the selected options.', left + 8, y + 4, tableWidth, { fontSize: 9, color: COLORS.muted, height: 12 });
            y += ROW_HEIGHT;
        }
        else {
            input.rows.forEach((row, index) => drawRow(row, index));
        }
        const range = doc.bufferedPageRange();
        const totalPages = range.count;
        for (let i = 0; i < totalPages; i += 1) {
            doc.switchToPage(range.start + i);
            doc.x = left;
            doc.y = doc.page.margins.top;
            drawFooter(i + 1, totalPages);
        }
        doc.end();
    });
}
//# sourceMappingURL=report-pdf.builder.js.map