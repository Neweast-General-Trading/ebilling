import { DatabaseService } from '../database/database.service';
import { ClaudeReportPlanner } from './claude-report.planner';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ReportDataService } from './report-data.service';
import { ReportEnglishService } from './report-english.service';
export declare class ReportsService {
    private readonly db;
    private readonly reportData;
    private readonly claudePlanner;
    private readonly reportEnglish;
    private readonly planCache;
    private readonly planCacheMs;
    constructor(db: DatabaseService, reportData: ReportDataService, claudePlanner: ClaudeReportPlanner, reportEnglish: ReportEnglishService);
    listMonths(co: string): Promise<string[]>;
    generatePdf(co: string, dto: GenerateReportDto): Promise<Buffer>;
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
    private buildReport;
    private resolveClaudePlan;
    private applyPackageThresholds;
    private resolvePeriod;
    private applySelection;
    private fetchRows;
    private fetchMasterRows;
    private fetchCombinedRows;
    private mapRow;
    private mapMasterRow;
    private applyFilters;
    private sortRows;
    private buildSummary;
}
