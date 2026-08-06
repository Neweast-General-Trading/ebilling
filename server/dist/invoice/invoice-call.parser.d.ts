export interface ParsedInvoiceCall {
    callAtRaw: string;
    callAt: Date | null;
    calleePhone: string;
    calleeDisplay: string;
    calleeCountryName: string | null;
    calleeCountryCode: string | null;
    durationLabel: string;
    durationSeconds: number;
    amount: number;
    callCategory: 'mobile' | 'landline' | 'international';
}
export declare function parseDurationToSeconds(label: string): number;
export declare function parseInvoiceCallsFromText(text: string): ParsedInvoiceCall[];
