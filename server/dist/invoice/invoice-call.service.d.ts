import { DatabaseService } from '../database/database.service';
export declare class InvoiceCallService {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseService);
    parseInvoiceById(co: string, invoiceId: number): Promise<number>;
    parseAllForCompany(co: string, month?: string): Promise<{
        parsed: number;
        failed: number;
        totalCalls: number;
    }>;
    private loadInvoice;
    private parseAndStore;
}
