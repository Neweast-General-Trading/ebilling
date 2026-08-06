import type Mail from 'nodemailer/lib/mailer';
export declare const NEWEAST_LOGO_PATH: string;
export declare const NEWEAST_LOGO_CID = "neweast-logo";
export declare function getEmailLogoAttachment(): Mail.Attachment | null;
type ApprovalEmailRow = {
    display_name: string | null;
    phone_number: string;
    month: string;
    invoice_code: string | null;
    invoice_total: number;
    package_total: number;
    exceeded_amount: number;
    due_date?: string | null;
};
export declare function formatBillMonthUpper(month: string): string;
export declare function formatDueDateLong(month: string, dueDate?: string | null): string;
export declare function buildApprovalRequestEmail(row: ApprovalEmailRow, intranetUrl: string): {
    subject: string;
    body: string;
};
export declare function buildApprovalConfirmationEmail(row: ApprovalEmailRow & {
    personal_usage: number;
    official_usage: number;
}): {
    subject: string;
    body: string;
};
export {};
