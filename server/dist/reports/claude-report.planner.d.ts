import { ConfigService } from '@nestjs/config';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ReportDataSnapshot } from './report-data.service';
export interface ClaudeReportPlan {
    dto: GenerateReportDto;
    insights: string | null;
    selectedEmployeeIds: number[] | null;
    selectedBillingKeys: string[] | null;
    includeInactiveEmployees: boolean;
    usedClaude: boolean;
}
export declare class ClaudeReportPlanner {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    planReport(dto: GenerateReportDto, snapshot: ReportDataSnapshot, availableMonths: string[]): Promise<ClaudeReportPlan>;
    private pickEnum;
    private pickColumns;
    private pickFilters;
    private normalizeIds;
    private normalizeKeys;
}
