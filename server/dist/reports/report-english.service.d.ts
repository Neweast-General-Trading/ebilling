import { ConfigService } from '@nestjs/config';
import type { ReportPdfRow } from './report-pdf.builder';
export declare class ReportEnglishService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    preparePdfContent(input: {
        title: string;
        insights: string | null;
        rows: ReportPdfRow[];
    }): Promise<{
        title: string;
        insights: string | null;
        rows: ReportPdfRow[];
    }>;
    private translateBatch;
}
