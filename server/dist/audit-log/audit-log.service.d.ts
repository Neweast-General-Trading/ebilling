import { DatabaseService } from '../database/database.service';
export interface AuditLogInput {
    co: string;
    actorEmail: string;
    actorName?: string | null;
    action: string;
    entityType?: string | null;
    entityId?: string | number | null;
    summary: string;
    details?: Record<string, unknown> | null;
}
export interface AuditLogRow {
    id: number;
    co: string;
    actorEmail: string;
    actorName: string | null;
    actorLabel: string;
    action: string;
    entityType: string | null;
    entityId: string | null;
    summary: string;
    details: Record<string, unknown> | null;
    createdAt: string;
}
export declare class AuditLogService {
    private readonly db;
    constructor(db: DatabaseService);
    log(input: AuditLogInput): Promise<void>;
    private mapRow;
    getOverview(co: string, days?: number): Promise<{
        days: number;
        totalEvents: number;
        eventsToday: number;
        activeActors: number;
        byAction: any;
        recentActors: any;
        recentEvents: any;
    }>;
    listEvents(co: string, options?: {
        page?: number;
        pageSize?: number;
        action?: string;
        search?: string;
        from?: string;
        to?: string;
    }): Promise<{
        items: any;
        total: number;
        page: number;
        pageSize: number;
    }>;
}
