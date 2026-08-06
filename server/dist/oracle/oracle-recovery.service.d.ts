export interface OracleRecoveryRow {
    personNumber: string;
    personId: string;
    elementTypeId: string;
    assignmentId: string;
    inputValueId: string;
    elementName: string;
    existingAmount: number | null;
}
export interface OracleRecoveryPushResult {
    action: 'created' | 'updated';
    personNumber: string;
    elementName: string;
    amount: number;
    source: 'bi_report' | 'rest_api';
    oracleResponse: unknown;
}
export declare class OracleRecoveryService {
    private readonly logger;
    private getAuth;
    private getHost;
    private getHcmBase;
    private getReportUrl;
    private getReportPath;
    private getElementNameCandidates;
    pushRecoveryAmount(personNumber: string, amount: number): Promise<OracleRecoveryPushResult>;
    private pushWithRow;
    private resolveRecoveryRowViaReport;
    private resolveRecoveryRowViaRest;
    private getWorkerContext;
    private findPersonElementEntry;
    private resolveElementTemplate;
    private runIntegrationReport;
    private parseReportCsv;
    private parseCsvLine;
    private createElementEntry;
    private updateElementEntry;
    private escapeXml;
}
