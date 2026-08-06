export declare class HanaService {
    private readonly logger;
    executeQuery<T = Record<string, unknown>>(co: string, sql: string, params?: unknown[]): Promise<T[]>;
}
