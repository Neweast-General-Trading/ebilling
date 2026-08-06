export type InvoiceApprovalStatus = 'draft' | 'not_required' | 'pending_approval' | 'ready_for_recovery' | 'recovery_sent' | 'confirmed_by_user';
export declare function calculateExceededAmount(invoiceTotal: number | null | undefined, packageTotal: number | null | undefined): number;
export declare function resolveApprovalStatusOnUpload(invoiceTotal: number, packageTotal: number): InvoiceApprovalStatus;
export declare function resolveApprovalStatusAfterSubmit(personalUsage: number): Extract<InvoiceApprovalStatus, 'ready_for_recovery' | 'confirmed_by_user'>;
export declare function calculateExcess(personalUsage: number | null | undefined, approvalStatus: string | null | undefined): number;
export declare function formatBillingMonthLabel(month: string): string;
