import type { Response } from 'express';
import { AuditLogService } from '../audit-log/audit-log.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    private readonly auditLog;
    constructor(reportsService: ReportsService, auditLog: AuditLogService);
    listMonths(co: string): Promise<string[]>;
    preview(co: string, dto: GenerateReportDto): Promise<{
        periodLabel: string;
        rowCount: number;
        availableMonths: string[];
        usedClaude: boolean;
        insights: string | null;
        resolvedOptions: {
            periodMode: "all" | "single" | "range";
            month: string | undefined;
            monthFrom: string | undefined;
            monthTo: string | undefined;
            reportType: "summary" | "employee_detail" | "excess_focus" | "email_status" | "sim_master";
            dataSource: "invoices" | "sim_master" | "combined";
            columns: ("email" | "department" | "month" | "remarks" | "personal_usage" | "excess" | "invoice" | "email_status" | "employee" | "phone" | "package" | "overage")[];
            filters: ("positive_excess" | "zero_excess" | "negative_excess" | "has_invoice" | "email_sent" | "email_pending")[];
            sortBy: "month" | "name" | "excess_desc" | "invoice_desc";
            includeSummary: boolean;
            title: string;
        };
    }>;
    generate(co: string, dto: GenerateReportDto, res: Response, req: {
        user: unknown;
    }): Promise<void>;
}
