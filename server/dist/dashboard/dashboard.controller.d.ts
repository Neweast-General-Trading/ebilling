import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    overview(co: string, month?: string): Promise<{
        month: string | null;
        monthLabel: string | null;
        simMaster: {
            active: number;
            mobile: number;
            landline: number;
            department: number;
        };
        billing: {
            month: string | null;
            label: string | null;
            invoiceCount: number;
            totalPackage: number;
            totalInvoice: number;
            totalPersonalUsage: number;
            totalExcess: number;
            positiveExcessCount: number;
            emailsSent: number;
            emailsPending: number;
            topExcess: {
                sim_employee_id: number;
                display_name: string | null;
                phone_number: string;
                email: string | null;
                line_type: string | null;
                package_value: number;
                vat_amount: number;
                additional_amount: number;
                package_total: number;
                invoice_total: number;
                personal_usage: number | null;
                excess: number;
                email_sent_at: string | null;
                month: string | null;
            }[];
        };
        months: any;
    }>;
}
