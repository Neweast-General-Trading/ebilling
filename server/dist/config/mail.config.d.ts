import * as nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
export declare function getMailFrom(): string;
export declare function resolveMailRecipient(intendedEmail: string): {
    deliverTo: string;
    isTestOverride: boolean;
};
export declare function isSmtpConfigured(): boolean;
export declare function getTransporter(): nodemailer.Transporter;
export declare function resetTransporter(): void;
export declare function sendMail(options: Mail.Options): Promise<any>;
