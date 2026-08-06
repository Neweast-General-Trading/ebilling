import { PermissionsService } from './permissions.service';
export declare class PermissionsController {
    private readonly permissionsService;
    constructor(permissionsService: PermissionsService);
    mine(req: {
        user: unknown;
    }): Promise<{
        email: string | null;
        permissions: ("invoices" | "dashboard" | "master" | "reports" | "analysis" | "audit_log" | "recovery_log")[];
        canManage: boolean;
        isAdmin: boolean;
    }>;
    users(req: {
        user: unknown;
    }): Promise<{
        users: import("./permissions.service").EbillingUserPermissionsRow[];
    }>;
    candidates(req: {
        user: unknown;
    }, co?: string): Promise<{
        candidates: {
            email: string;
            displayName: string;
            personNumber: string | null;
        }[];
    }>;
    saveUser(req: {
        user: unknown;
    }, body: {
        email?: string;
        permissions?: string[];
    }): Promise<{
        user: import("./permissions.service").EbillingUserPermissionsRow;
    }>;
}
