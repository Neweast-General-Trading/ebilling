import type { Response } from 'express';
import { AuditLogService } from '../audit-log/audit-log.service';
import { SimMasterService } from './sim-master.service';
import { UpdateSimEmployeeDto } from './dto/update-sim-employee.dto';
import { CreateSimEmployeeDto } from './dto/create-sim-employee.dto';
import { ReassignPhoneDto } from './dto/reassign-phone.dto';
import { CheckDuplicateDto } from './dto/check-duplicate.dto';
export declare class SimMasterController {
    private readonly simMasterService;
    private readonly auditLog;
    constructor(simMasterService: SimMasterService, auditLog: AuditLogService);
    list(co: string, page?: string, pageSize?: string, search?: string, emailStatus?: 'all' | 'with' | 'missing', phoneType?: 'all' | 'mobile' | 'landline' | 'department', includeInactive?: string): Promise<import("./sim-master.service").PaginatedEmployees>;
    resolveSap(co: string, personNumber: string, displayName?: string): Promise<import("./sim-master.service").SapProfileResult>;
    downloadTemplate(res: Response): void;
    sheetBreakdown(): {
        sheetName: string;
        totalPhoneLines: number;
        employeeMobileSap: number;
        landlineRows: number;
        departmentRows: number;
        parsedEmployeeRows: number;
        note: string;
    } | {
        totalPhoneLines: null;
        employeeMobileSap: null;
        parsedEmployeeRows: null;
        note: string;
    };
    checkDuplicates(co: string, dto: CheckDuplicateDto): Promise<import("./sim-master.service").DuplicateConflict[]>;
    create(co: string, dto: CreateSimEmployeeDto, req: {
        user: unknown;
    }): Promise<any>;
    update(co: string, id: number, dto: UpdateSimEmployeeDto, req: {
        user: unknown;
    }): Promise<Record<string, unknown>>;
    deactivate(co: string, id: number, req: {
        user: unknown;
    }): Promise<{
        id: number;
        releasedPhone: string;
        inactive: boolean;
    }>;
    activate(co: string, id: number, req: {
        user: unknown;
    }): Promise<{
        id: number;
        phoneNumber: string;
        active: boolean;
        employee: Record<string, unknown>;
    }>;
    reassign(co: string, id: number, dto: ReassignPhoneDto, req: {
        user: unknown;
    }): Promise<{
        sourceId: number;
        targetId: number;
        phoneNumber: string;
        target: Record<string, unknown>;
    }>;
    preview(co: string, file: Express.Multer.File): Promise<import("./sim-master.service").MatchResultRow[]>;
    import(co: string, file: Express.Multer.File, req: {
        user: unknown;
    }): Promise<{
        imported: number;
        total: number;
        skipped: number;
        skippedRows: {
            personNumber: string;
            phoneNumber: string | null;
            error: string;
        }[];
        sheetBreakdown: {
            sheetName: string;
            totalPhoneLines: number;
            employeeMobileSap: number;
            landlineRows: number;
            departmentRows: number;
            parsedEmployeeRows: number;
            note: string;
        };
    }>;
}
