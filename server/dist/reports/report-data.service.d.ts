import { DatabaseService } from '../database/database.service';
export interface ReportEmployeeRecord {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    department: string | null;
    lineType: string | null;
    packageValue: number;
    vatAmount: number;
    additionalAmount: number;
    totalAmount: number;
    isActive: boolean;
}
export interface ReportBillingRecord {
    employeeId: number;
    employeeName: string | null;
    month: string;
    phone: string;
    packageTotal: number;
    invoiceTotal: number;
    personalUsage: number | null;
    excess: number | null;
    overage: number;
    remarks: string | null;
    emailSent: boolean;
    invoiceCode: string | null;
}
export interface ReportDataSnapshot {
    company: string;
    stats: {
        activeEmployees: number;
        inactiveEmployees: number;
        billingRows: number;
        billingMonths: string[];
        totalSubscription: number;
        totalInvoiced: number;
        totalExcess: number;
        emailsSent: number;
    };
    employees: ReportEmployeeRecord[];
    billingRows: ReportBillingRecord[];
}
export declare class ReportDataService {
    private readonly db;
    constructor(db: DatabaseService);
    buildSnapshot(co: string): Promise<ReportDataSnapshot>;
}
