import type { ReportColumn, ReportType } from './dto/generate-report.dto';
export interface ReportPdfRow {
    sim_employee_id?: number;
    month: string;
    monthLabel: string;
    display_name: string | null;
    phone_number: string | null;
    email: string | null;
    department_name: string | null;
    package_total: number;
    invoice_total: number;
    personal_usage: number | null;
    excess: number | null;
    overage_amount: number;
    remarks: string | null;
    email_sent_at: string | null;
}
export interface ReportPdfSummary {
    rowCount: number;
    totalPackage: number;
    totalInvoice: number;
    totalPersonalUsage: number;
    totalExcess: number;
    positiveExcessCount: number;
    emailsSent: number;
}
export interface ReportPdfInput {
    title: string;
    periodLabel: string;
    company: string;
    reportType: ReportType;
    columns: ReportColumn[];
    rows: ReportPdfRow[];
    summary: ReportPdfSummary;
    includeSummary: boolean;
    insights?: string | null;
    generatedAt: Date;
}
export declare function buildReportPdf(input: ReportPdfInput): Promise<Buffer>;
