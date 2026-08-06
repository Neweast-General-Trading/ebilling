export interface ParsedEtisalatInvoice {
    phoneNumber: string;
    packageValue: number;
    overageAmount: number;
    amountDue: number;
    billingMonth: string;
    dueDate?: string | null;
    invoiceCode?: string | null;
    parserSource?: 'auto' | 'regex';
    rawText: string;
}
export declare function parseEtisalatPdfBuffer(buffer: Buffer): Promise<ParsedEtisalatInvoice>;
