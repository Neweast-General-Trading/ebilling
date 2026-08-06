import { ConfigService } from '@nestjs/config';
import { ParsedEtisalatInvoice } from './etisalat-pdf.parser';
export declare class ClaudeInvoiceParser {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    parsePdfBuffer(buffer: Buffer): Promise<ParsedEtisalatInvoice | null>;
    parseWithFallback(buffer: Buffer, regexFallback: () => Promise<ParsedEtisalatInvoice>): Promise<ParsedEtisalatInvoice>;
}
