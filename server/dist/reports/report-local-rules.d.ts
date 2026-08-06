import type { GenerateReportDto } from './dto/generate-report.dto';
import type { ReportDataSnapshot } from './report-data.service';
export interface LocalPromptRules {
    dtoPatch: Partial<GenerateReportDto>;
    selectedEmployeeIds: number[] | null;
    insights: string | null;
}
export declare function deriveLocalPromptRules(prompt: string | undefined, snapshot: ReportDataSnapshot): LocalPromptRules | null;
export declare function isDeterministicPackagePrompt(prompt: string | undefined): boolean;
