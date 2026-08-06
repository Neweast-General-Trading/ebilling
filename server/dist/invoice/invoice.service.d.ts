import { DatabaseService } from '../database/database.service';
import { ParsedEtisalatInvoice } from './etisalat-pdf.parser';
import { ClaudeInvoiceParser } from './claude-invoice.parser';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { NotificationService } from '../notifications/notification.service';
import { InvoiceCallService } from './invoice-call.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuthActor } from '../common/auth-user.util';
import { SimMasterService } from '../sim-master/sim-master.service';
import { OracleRecoveryService } from '../oracle/oracle-recovery.service';
import { RegisterPendingInvoiceDto } from './dto/register-pending-invoice.dto';
import { SubmitInvoiceApprovalDto } from './dto/submit-invoice-approval.dto';
export interface UploadInvoiceSuccess {
    status: 'success';
    invoice: Record<string, unknown>;
    parsed: ParsedEtisalatInvoice;
}
export interface UploadInvoiceUnknownPhone {
    status: 'unknown_phone';
    pendingToken: string;
    phoneNumber: string;
    filename: string;
    monthLabel: string;
    parsed: {
        phoneNumber: string;
        packageValue: number;
        overageAmount: number;
        amountDue: number;
        billingMonth: string;
        dueDate?: string | null;
        invoiceCode?: string | null;
    };
}
export type UploadInvoiceResult = UploadInvoiceSuccess | UploadInvoiceUnknownPhone;
export interface InvoiceGridRow {
    invoice_id: number;
    sim_employee_id: number;
    month: string;
    month_label: string;
    phone_number: string;
    display_name: string | null;
    package_total: number;
    invoice_total: number;
    personal_usage: number | null;
    official_usage: number | null;
    excess: number | null;
    exceeded_amount: number;
    approval_status: string;
    approval_sent_at: string | null;
    approval_submitted_at: string | null;
    overage_amount: number;
    remarks: string | null;
    due_date: string | null;
    invoice_code: string | null;
    pdf_filename: string | null;
    email: string | null;
    email_sent_at: string | null;
    email_sent_to: string | null;
    uploaded_by_email: string | null;
    uploaded_by_name: string | null;
    uploaded_by_label: string | null;
    uploaded_at: string | null;
    person_number: string | null;
    recovery_sent_at: string | null;
}
export declare class InvoiceService {
    private readonly db;
    private readonly claudeParser;
    private readonly invoiceCalls;
    private readonly auditLog;
    private readonly simMaster;
    private readonly notifications;
    private readonly oracleRecovery;
    private readonly logger;
    constructor(db: DatabaseService, claudeParser: ClaudeInvoiceParser, invoiceCalls: InvoiceCallService, auditLog: AuditLogService, simMaster: SimMasterService, notifications: NotificationService, oracleRecovery: OracleRecoveryService);
    private summarizeParsed;
    private savePendingUpload;
    private getPendingUpload;
    private insertInvoiceFromParsed;
    uploadInvoice(co: string, file: Express.Multer.File, actor?: AuthActor): Promise<UploadInvoiceResult>;
    registerPendingUpload(co: string, token: string, dto: RegisterPendingInvoiceDto, actor?: AuthActor): Promise<{
        status: "success";
        invoice: any;
        parsed: ParsedEtisalatInvoice;
        employee: any;
    }>;
    archivePendingUpload(co: string, token: string, actor?: AuthActor): Promise<{
        status: "archived";
        pendingToken: string;
        phoneNumber: string;
        monthLabel: string;
    }>;
    uploadBulk(co: string, files: Express.Multer.File[], actor?: AuthActor): Promise<Record<string, unknown>[]>;
    listMonths(co: string): Promise<any>;
    private mapGridRow;
    getGridByMonth(co: string, month: string): Promise<{
        month: string;
        label: string;
        rows: any;
        summary: {
            count: any;
            totalInvoice: any;
            totalExcess: any;
        };
    }>;
    listByMonth(co: string, month: string): Promise<any>;
    updateInvoice(co: string, id: number, dto: UpdateInvoiceDto, actor?: AuthActor): Promise<any>;
    private assertAdmin;
    private normalizeEmployeeEmail;
    listPendingApprovals(co: string, actor?: AuthActor, rawUser?: unknown): Promise<any>;
    sendForApproval(co: string, invoiceId: number, actor?: AuthActor): Promise<{
        row: any;
    }>;
    sendForApprovalBulk(co: string, invoiceIds: number[], actor?: AuthActor): Promise<{
        sent: number;
        failed: number;
        results: {
            invoiceId: number;
            success: boolean;
            row?: InvoiceGridRow;
            error?: string;
        }[];
    }>;
    submitApproval(co: string, invoiceId: number, dto: SubmitInvoiceApprovalDto, actor?: AuthActor, rawUser?: unknown): Promise<{
        row: any;
    }>;
    pushRecovery(co: string, invoiceId: number, actor?: AuthActor): Promise<{
        row: any;
        oracle: any;
    }>;
    pushRecoveryReady(co: string, invoiceIds: number[] | undefined, month: string | undefined, actor?: AuthActor): Promise<{
        results: {
            invoiceId: number;
            ok: boolean;
            row?: InvoiceGridRow;
            oracle?: unknown;
            error?: string;
        }[];
    }>;
    listRecoverySent(co: string, options: {
        page?: number;
        pageSize?: number;
        month?: string;
        search?: string;
    }, actor?: AuthActor): Promise<{
        rows: any;
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
        summary: {
            totalCount: number;
            totalAmount: number;
        };
    }>;
    getPdfAttachment(co: string, id: number): Promise<{
        path: string;
        filename: string;
    }>;
    sendBulkEmails(co: string, month: string, simEmployeeIds?: number[], actor?: AuthActor): Promise<{
        month: string;
        sent: number;
        failed: number;
        skipped: number;
        results: Record<string, unknown>[];
    }>;
    sendSingleEmail(co: string, simEmployeeId: number, month: string, actor?: AuthActor): Promise<{
        row: any;
        simEmployeeId: number;
        success: boolean;
        error: string;
        email?: undefined;
        alreadySent?: undefined;
        sentAt?: undefined;
        deliveredTo?: undefined;
        isTestOverride?: undefined;
    } | {
        row: any;
        simEmployeeId: number;
        email: string;
        success: boolean;
        alreadySent: boolean;
        sentAt: any;
        error: string;
        deliveredTo?: undefined;
        isTestOverride?: undefined;
    } | {
        row: any;
        simEmployeeId: number;
        email: string;
        deliveredTo: string;
        isTestOverride: boolean;
        success: boolean;
        sentAt: any;
        error?: undefined;
        alreadySent?: undefined;
    } | {
        row: any;
        simEmployeeId: number;
        email: string;
        success: boolean;
        error: string;
        alreadySent?: undefined;
        sentAt?: undefined;
        deliveredTo?: undefined;
        isTestOverride?: undefined;
    }>;
}
