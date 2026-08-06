import type Mail from 'nodemailer/lib/mailer';
import type { InvoiceGridRow } from '../invoice/invoice.service';
type InvoiceEmailRow = InvoiceGridRow & {
    email: string | null;
};
export declare const NEWEAST_LOGO_PATH: string;
export declare const NEWEAST_LOGO_CID = "neweast-logo";
export declare function getEmailLogoAttachment(): Mail.Attachment | null;
export declare function buildInvoiceEmail(row: InvoiceEmailRow): {
    subject: string;
    body: string;
};
export {};
