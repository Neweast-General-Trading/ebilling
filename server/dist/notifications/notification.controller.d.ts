import { NotificationService } from './notification.service';
export declare class NotificationController {
    private readonly notificationService;
    constructor(notificationService: NotificationService);
    sendMonthly(co: string, month: string): Promise<{
        month: string;
        sent: number;
        failed: number;
        results: Record<string, unknown>[];
    }>;
    sendSingle(body: {
        simEmployeeId: number;
        month: string;
    }): Promise<{
        success: boolean;
        email: string;
        deliveredTo: string;
        isTestOverride: boolean;
    }>;
}
