import { AuditLogService } from '../audit-log/audit-log.service';
import { BillingReportService } from './billing-report.service';
export declare class BillingReportController {
    private readonly billingReportService;
    private readonly auditLog;
    constructor(billingReportService: BillingReportService, auditLog: AuditLogService);
    report(co: string, month: string): Promise<{
        month: string;
        rows: any;
        summary: {
            totalEmployees: any;
            withInvoice: any;
            totalOverage: any;
            totalDue: any;
        };
    }>;
    updateRemark(co: string, body: {
        simEmployeeId: number;
        month: string;
        remarks: string;
    }, req: {
        user: unknown;
    }): Promise<{
        success: boolean;
    }>;
}
