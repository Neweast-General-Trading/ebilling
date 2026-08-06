export declare function normalizeEmployeeEmail(email?: string | null): string;
export declare function employeeEmailsMatch(storedEmail?: string | null, actorEmail?: string | null): boolean;
export declare function collectActorEmails(actorEmail?: string | null, rawUser?: unknown): string[];
export declare function actorOwnsEmployeeEmail(storedEmail?: string | null, actorEmail?: string | null, rawUser?: unknown): boolean;
