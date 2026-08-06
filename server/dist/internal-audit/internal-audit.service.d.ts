import { DatabaseService } from '../database/database.service';
import { CallTypeFilter } from '../invoice/call-category.util';
import { InvoiceCallService } from '../invoice/invoice-call.service';
interface PaginationInput {
    month?: string;
    page: number;
    pageSize: number;
    search?: string;
    sort?: string;
    callType?: CallTypeFilter;
}
export declare class InternalAuditService {
    private readonly db;
    private readonly invoiceCalls;
    constructor(db: DatabaseService, invoiceCalls: InvoiceCallService);
    getOverview(co: string, month?: string): Promise<{
        month: string | null;
        months: string[];
        invoiceCount: number;
        unparsedCount: number;
        callCount: number;
        internalCallCount: number;
        externalCallCount: number;
        internalMobileCount: number;
        internalLandlineCount: number;
        internalInternationalCount: number;
        externalMobileCount: number;
        externalLandlineCount: number;
        externalInternationalCount: number;
        internalTalkTime: string;
        externalTalkTime: string;
    }>;
    parseAll(co: string, month?: string): Promise<{
        parsed: number;
        failed: number;
        totalCalls: number;
    }>;
    listInvoices(co: string, input: PaginationInput): Promise<{
        items: any;
        total: number;
        page: number;
        pageSize: number;
    }>;
    listInvoiceCalls(co: string, invoiceId: number, input: PaginationInput): Promise<{
        invoice: null;
        items: never[];
        total: number;
        page: number;
        pageSize: number;
        summary?: undefined;
    } | {
        invoice: any;
        items: any;
        total: number;
        page: number;
        pageSize: number;
        summary: {
            all: number;
            internal: number;
            external: number;
            internal_mobile: number;
            internal_landline: number;
            internal_international: number;
            external_mobile: number;
            external_landline: number;
            external_international: number;
        };
    }>;
    listSubscribers(co: string, input: PaginationInput): Promise<{
        items: any;
        total: number;
        page: number;
        pageSize: number;
    }>;
    listTopPairs(co: string, input: PaginationInput): Promise<{
        items: {
            phoneA: string;
            phoneB: string;
            nameA: string | null;
            nameB: string | null;
            callCount: number;
            totalTalkTime: string;
            totalSeconds: number;
            month: string | null;
            monthLabel: string | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    getCallAnalytics(co: string, month?: string): Promise<{
        subscriberCount: number;
        avgCallDurationMinutes: number;
        avgInternalDurationMinutes: number;
        avgExternalDurationMinutes: number;
        internalRatio: number;
        talkTimeByCategory: {
            internalMobileMinutes: number;
            internalLandlineMinutes: number;
            internalInternationalMinutes: number;
            externalMobileMinutes: number;
            externalLandlineMinutes: number;
            externalInternationalMinutes: number;
        };
        topExternalNumbers: any;
        topCountries: any;
        topSubscribers: any;
    }>;
    private listMonths;
}
export {};
