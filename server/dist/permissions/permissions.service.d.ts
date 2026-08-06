import { DatabaseService } from '../database/database.service';
import { EbillingPermissionKey } from '../common/ebilling-permissions';
export interface EbillingUserPermissionsRow {
    email: string;
    displayName: string;
    permissions: EbillingPermissionKey[];
    isAdmin: boolean;
}
export declare class PermissionsService {
    private readonly db;
    constructor(db: DatabaseService);
    getEffectivePermissions(email?: string | null): Promise<EbillingPermissionKey[]>;
    hasPermission(email: string | null | undefined, permission: EbillingPermissionKey, effective?: EbillingPermissionKey[]): boolean;
    canManagePermissions(email?: string | null): boolean;
    listUsers(): Promise<EbillingUserPermissionsRow[]>;
    private getStoredPermissions;
    saveUserPermissions(email: string, permissions: string[], grantedByEmail?: string | null): Promise<EbillingUserPermissionsRow>;
    listEmailCandidates(co: string): Promise<Array<{
        email: string;
        displayName: string;
        personNumber: string | null;
    }>>;
}
