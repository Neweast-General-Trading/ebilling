import { OracleEmployeeService } from '../oracle/oracle-employee.service';
import { BiEmployeeService } from '../bi/bi-employee.service';
import { DatabaseService } from '../database/database.service';
import { CreateSimEmployeeDto } from './dto/create-sim-employee.dto';
import { UpdateSimEmployeeDto } from './dto/update-sim-employee.dto';
import { ReassignPhoneDto } from './dto/reassign-phone.dto';
export interface ExcelBillingFields {
    usageAmount: number | null;
    packageLimit: number | null;
    vatAmount: number | null;
    additionalAmount: number | null;
    totalAmount: number | null;
}
export interface ExcelRowPreview {
    rowNumber: number;
    personNumber: string;
    phoneNumber: string | null;
    lineType: 'mobile' | 'landline' | 'department';
    packageValue: number | null;
    excelCompany: string | null;
    excelName: string | null;
    billing: ExcelBillingFields;
    rawRow: Record<string, unknown>;
}
export interface DuplicateConflict {
    field: 'phoneNumber' | 'personNumber' | 'displayName';
    value: string;
    existingId: number;
    existingName: string | null;
    existingPhone: string;
    existingPersonNumber: string;
}
export interface MatchResultRow {
    rowNumber: number;
    personNumber: string;
    phoneNumber: string | null;
    lineType: 'mobile' | 'landline' | 'department';
    packageValue: number | null;
    excelCompany: string | null;
    excelName: string | null;
    billing: ExcelBillingFields;
    matched: boolean;
    oracle: {
        displayName: string | null;
        email: string | null;
        emailSource?: 'oracle' | 'bi' | null;
        positionName: string | null;
        departmentName: string | null;
    } | null;
    errors: string[];
    duplicates: DuplicateConflict[];
}
export interface PaginatedEmployees {
    items: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export interface ListEmployeeFilters {
    search?: string;
    emailStatus?: 'all' | 'with' | 'missing';
    phoneType?: 'all' | 'mobile' | 'landline' | 'department';
    includeInactive?: boolean;
}
interface ResolvedEmployee {
    personNumber: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    emailSource: 'oracle' | 'bi' | null;
    positionName: string | null;
    departmentName: string | null;
    matched: boolean;
    errors: string[];
}
export type SapProfileResult = Omit<ResolvedEmployee, 'personNumber' | 'firstName' | 'lastName'> & {
    personNumber?: string;
};
export declare class SimMasterService {
    private readonly db;
    private readonly oracle;
    private readonly bi;
    constructor(db: DatabaseService, oracle: OracleEmployeeService, bi: BiEmployeeService);
    private isMonthlySheet;
    private resolveMasterSheet;
    private resolveLayout;
    private normalizePhone;
    private getLineType;
    private landlinePersonNumber;
    private hiddenCodePersonNumber;
    private isAutoImportedLine;
    private isSyntheticPersonNumber;
    private getEmployeeOrThrow;
    findDuplicates(co: string, input: {
        phoneNumber?: string;
        personNumber?: string;
        displayName?: string;
        excludeId?: number;
    }): Promise<DuplicateConflict[]>;
    generateTemplateBuffer(): Buffer;
    private parseAmount;
    private extractBilling;
    private buildExcelResolved;
    private mergeResolved;
    private resolveRow;
    private resolveEmployee;
    getSheetBreakdown(buffer: Buffer): {
        sheetName: string;
        totalPhoneLines: number;
        employeeMobileSap: number;
        landlineRows: number;
        departmentRows: number;
        parsedEmployeeRows: number;
        note: string;
    };
    parseExcelBuffer(buffer: Buffer): ExcelRowPreview[];
    previewMatch(co: string, buffer: Buffer): Promise<MatchResultRow[]>;
    private upsertEmployee;
    importMatchedRows(co: string, buffer: Buffer): Promise<{
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
    listEmployees(co: string, page?: number, pageSize?: number, filters?: ListEmployeeFilters): Promise<PaginatedEmployees>;
    updateEmployee(co: string, id: number, dto: UpdateSimEmployeeDto): Promise<Record<string, unknown>>;
    deactivateEmployee(co: string, id: number): Promise<{
        id: number;
        releasedPhone: string;
        inactive: boolean;
    }>;
    activateEmployee(co: string, id: number): Promise<{
        id: number;
        phoneNumber: string;
        active: boolean;
        employee: Record<string, unknown>;
    }>;
    reassignPhone(co: string, sourceId: number, dto: ReassignPhoneDto): Promise<{
        sourceId: number;
        targetId: number;
        phoneNumber: string;
        target: Record<string, unknown>;
    }>;
    private resolveLineTypeFromInput;
    createEmployee(co: string, dto: CreateSimEmployeeDto): Promise<any>;
    lookupSapProfile(co: string, personNumber: string, displayName?: string | null): Promise<SapProfileResult>;
}
export {};
