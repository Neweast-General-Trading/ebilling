import { DatabaseService } from '../database/database.service';
export declare class BillingReportService {
    private readonly db;
    constructor(db: DatabaseService);
    getMonthlyReport(co: string, month: string): Promise<{
        month: string;
        rows: any;
        summary: {
            totalEmployees: any;
            withInvoice: any;
            totalOverage: any;
            totalDue: any;
        };
    }>;
    updateRemark(simEmployeeId: number, month: string, remarks: string): Promise<{
        success: boolean;
    }>;
}
