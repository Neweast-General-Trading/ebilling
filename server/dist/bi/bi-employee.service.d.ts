import { HanaService } from '../hana/hana.service';
export interface BiEmployeeRecord {
    email: string | null;
    displayName: string | null;
    empId: string | null;
    oracleEmpId: string | null;
}
export declare class BiEmployeeService {
    private readonly hana;
    constructor(hana: HanaService);
    getEmployeeByCode(co: string, personNumber: string, options?: {
        includeInactive?: boolean;
    }): Promise<BiEmployeeRecord | null>;
}
