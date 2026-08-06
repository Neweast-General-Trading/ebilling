import { DatabaseService } from '../database/database.service';
import { BillingReportService } from '../billing/billing-report.service';
import type { InvoiceGridRow } from '../invoice/invoice.service';
export interface InvoiceEmailRow extends InvoiceGridRow {
    email: string | null;
}
export declare class NotificationService {
    private readonly db;
    private readonly billingReportService;
    private readonly logger;
    constructor(db: DatabaseService, billingReportService: BillingReportService);
    private formatSentAt;
    private upsertEmailLog;
    getSentEmailRecord(simEmployeeId: number, month: string): Promise<any>;
    private resolveInvoicePdfAttachment;
    private withLatestRemarks;
    sendInvoiceRowEmail(row: InvoiceEmailRow, month: string): Promise<{
        simEmployeeId: number;
        success: boolean;
        error: string;
        email?: undefined;
        alreadySent?: undefined;
        sentAt?: undefined;
        deliveredTo?: undefined;
        isTestOverride?: undefined;
    } | {
        simEmployeeId: number;
        email: string;
        success: boolean;
        alreadySent: boolean;
        sentAt: any;
        error: string;
        deliveredTo?: undefined;
        isTestOverride?: undefined;
    } | {
        simEmployeeId: number;
        email: string;
        deliveredTo: string;
        isTestOverride: boolean;
        success: boolean;
        sentAt: any;
        error?: undefined;
        alreadySent?: undefined;
    } | {
        simEmployeeId: number;
        email: string;
        success: boolean;
        error: string;
        alreadySent?: undefined;
        sentAt?: undefined;
        deliveredTo?: undefined;
        isTestOverride?: undefined;
    }>;
    sendInvoiceBulkEmails(rows: InvoiceEmailRow[], month: string): Promise<{
        month: string;
        sent: number;
        failed: number;
        skipped: number;
        results: Record<string, unknown>[];
    }>;
    buildEmailContent(row: Record<string, unknown>, monthLabel: string): {
        subject: string;
        body: string;
        remarks: string;
    };
    sendMonthlyEmails(co: string, month: string): Promise<{
        month: string;
        sent: number;
        failed: number;
        results: Record<string, unknown>[];
    }>;
    sendSingleEmail(simEmployeeId: number, month: string): Promise<{
        success: boolean;
        email: string;
        deliveredTo: string;
        isTestOverride: boolean;
    }>;
    private getIntranetBaseUrl;
    private buildApprovalAttachments;
    sendApprovalRequestEmail(row: InvoiceEmailRow): Promise<{
        success: boolean;
        email: string;
        deliveredTo: string;
    }>;
    sendApprovalConfirmationEmail(row: InvoiceEmailRow): Promise<{
        success: boolean;
        email: string;
        deliveredTo: string;
    }>;
}
