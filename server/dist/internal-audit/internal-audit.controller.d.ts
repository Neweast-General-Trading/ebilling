import { AuditLogService } from '../audit-log/audit-log.service';
import { InternalAuditService } from './internal-audit.service';
import type { CallTypeFilter } from '../invoice/call-category.util';
export declare class InternalAuditController {
    private readonly service;
    private readonly auditLog;
    constructor(service: InternalAuditService, auditLog: AuditLogService);
    overview(co: string, month?: string): Promise<{
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
    parseAll(co: string, month?: string, req?: {
        user: unknown;
    }): Promise<{
        parsed: number;
        failed: number;
        totalCalls: number;
    }>;
    listInvoices(co: string, month?: string, page?: string, pageSize?: string, search?: string): Promise<{
        items: any;
        total: number;
        page: number;
        pageSize: number;
    }>;
    listInvoiceCalls(co: string, id: number, page?: string, pageSize?: string, search?: string, callType?: CallTypeFilter): Promise<{
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
    analytics(co: string, month?: string): Promise<{
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
    listSubscribers(co: string, month?: string, page?: string, pageSize?: string, sort?: string, search?: string): Promise<{
        items: any;
        total: number;
        page: number;
        pageSize: number;
    }>;
    listTopPairs(co: string, month?: string, page?: string, pageSize?: string): Promise<{
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
}
