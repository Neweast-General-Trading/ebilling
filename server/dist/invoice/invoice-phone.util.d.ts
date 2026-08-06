export declare function digitsOnly(phone: string): string;
export declare function normalizeMobilePhone(raw: string): string;
export declare function normalizeCalleePhone(raw: string): string;
export declare function phoneLookupKeys(raw: string): string[];
export declare function buildMasterPhoneSet(rows: Array<{
    phone_number: string;
}>): Set<string>;
export declare function isPhoneInMaster(phone: string, masterSet: Set<string>): boolean;
export declare function pairKey(phoneA: string, phoneB: string): string;
export declare function formatDuration(seconds: number): string;
export declare function secondsToMinutes(seconds: number, decimals?: number): number;
export declare function formatTalkMinutes(seconds: number, decimals?: number): string;
