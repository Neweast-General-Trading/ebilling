export declare const EBILLING_PERMISSION_KEYS: readonly ["dashboard", "invoices", "master", "reports", "analysis", "audit_log", "recovery_log"];
export type EbillingPermissionKey = (typeof EBILLING_PERMISSION_KEYS)[number];
export declare const DEFAULT_EBILLING_PERMISSIONS: EbillingPermissionKey[];
export declare const ALL_EBILLING_PERMISSIONS: EbillingPermissionKey[];
export declare const EBILLING_PERMISSION_LABELS: Record<EbillingPermissionKey, string>;
export declare function isEbillingPermissionKey(value: string): value is EbillingPermissionKey;
