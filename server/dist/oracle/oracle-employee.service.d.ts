export interface OracleEmployeeProfile {
    personNumber: string;
    personId: number | null;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    email: string | null;
    positionName: string | null;
    departmentName: string | null;
    jobName: string | null;
    legalEmployerName: string | null;
}
export declare class OracleEmployeeService {
    private readonly logger;
    private getAuthHeader;
    getEmployeeByPersonNumber(personNumber: string): Promise<OracleEmployeeProfile | null>;
    private mapWorker;
}
