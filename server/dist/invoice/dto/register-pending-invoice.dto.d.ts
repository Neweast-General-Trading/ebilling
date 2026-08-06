export declare class RegisterPendingInvoiceDto {
    personNumber: string;
    displayName: string;
    email?: string;
    lineType?: 'mobile' | 'landline' | 'department';
    packageLimit?: number;
    additionalAmount?: number;
}
