import { AuditLogService } from './audit-log.service';
export declare class AuditLogController {
    private readonly service;
    constructor(service: AuditLogService);
    overview(co: string, days?: string): Promise<{
        days: number;
        totalEvents: number;
        eventsToday: number;
        activeActors: number;
        byAction: any;
        recentActors: any;
        recentEvents: any;
    }>;
    listEvents(co: string, page?: string, pageSize?: string, action?: string, search?: string, from?: string, to?: string): Promise<{
        items: any;
        total: number;
        page: number;
        pageSize: number;
    }>;
}
