import type { Response } from 'express';
import { InvoiceService } from './invoice.service';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { SendInvoiceBulkDto, SendInvoiceSingleDto } from './dto/send-invoice-email.dto';
import { RegisterPendingInvoiceDto } from './dto/register-pending-invoice.dto';
import { SubmitInvoiceApprovalDto } from './dto/submit-invoice-approval.dto';
import { SendApprovalBulkDto } from './dto/send-approval-bulk.dto';
import { PushRecoveryBulkDto } from './dto/push-recovery-bulk.dto';
export declare class InvoiceController {
    private readonly invoiceService;
    constructor(invoiceService: InvoiceService);
    listMonths(co: string): Promise<any>;
    grid(co: string, month: string): Promise<{
        month: string;
        label: string;
        rows: any;
        summary: {
            count: any;
            totalInvoice: any;
            totalExcess: any;
        };
    }>;
    upload(co: string, file: Express.Multer.File, req: {
        user: unknown;
    }): Promise<import("./invoice.service").UploadInvoiceResult>;
    uploadBulk(co: string, files: Express.Multer.File[], req: {
        user: unknown;
    }): Promise<Record<string, unknown>[]>;
    sendBulk(co: string, body: SendInvoiceBulkDto, req: {
        user: unknown;
    }): Promise<{
        month: string;
        sent: number;
        failed: number;
        skipped: number;
        results: Record<string, unknown>[];
    }>;
    sendSingle(co: string, body: SendInvoiceSingleDto, req: {
        user: unknown;
    }): Promise<{
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
    registerPending(co: string, token: string, dto: RegisterPendingInvoiceDto, req: {
        user: unknown;
    }): Promise<{
        status: "success";
        invoice: any;
        parsed: import("./etisalat-pdf.parser").ParsedEtisalatInvoice;
        employee: any;
    }>;
    archivePending(co: string, token: string, req: {
        user: unknown;
    }): Promise<{
        status: "archived";
        pendingToken: string;
        phoneNumber: string;
        monthLabel: string;
    }>;
    list(co: string, month: string): Promise<any>;
    listPendingApprovals(co: string, req: {
        user: unknown;
    }): Promise<any>;
    sendForApprovalBulk(co: string, body: SendApprovalBulkDto, req: {
        user: unknown;
    }): Promise<{
        sent: number;
        failed: number;
        results: {
            invoiceId: number;
            success: boolean;
            row?: import("./invoice.service").InvoiceGridRow;
            error?: string;
        }[];
    }>;
    sendForApproval(co: string, id: number, req: {
        user: unknown;
    }): Promise<{
        row: any;
    }>;
    submitApproval(co: string, id: number, body: SubmitInvoiceApprovalDto, req: {
        user: unknown;
    }): Promise<{
        row: any;
    }>;
    listRecoverySent(co: string, page?: string, pageSize?: string, month?: string, search?: string, req?: {
        user: unknown;
    }): Promise<{
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
    pushRecoveryReady(co: string, body: PushRecoveryBulkDto, req: {
        user: unknown;
    }): Promise<{
        results: {
            invoiceId: number;
            ok: boolean;
            row?: import("./invoice.service").InvoiceGridRow;
            oracle?: unknown;
            error?: string;
        }[];
    }>;
    pushRecovery(co: string, id: number, req: {
        user: unknown;
    }): Promise<{
        row: any;
        oracle: any;
    }>;
    pdf(co: string, id: number, res: Response): Promise<void>;
    update(co: string, id: number, dto: UpdateInvoiceDto, req: {
        user: unknown;
    }): Promise<any>;
}
