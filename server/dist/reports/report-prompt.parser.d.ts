import { GenerateReportDto, ReportColumn, ReportType } from './dto/generate-report.dto';
export declare function applyPromptToReportDto(dto: GenerateReportDto, availableMonths: string[]): GenerateReportDto;
export declare function defaultColumnsForType(type: ReportType): ReportColumn[];
export declare function reportTypeLabel(type: ReportType): string;
