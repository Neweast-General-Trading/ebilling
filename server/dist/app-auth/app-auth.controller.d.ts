import { AppAuthService } from './app-auth.service';
export declare class AppAuthController {
    private readonly authService;
    constructor(authService: AppAuthService);
    login(body: {
        azureToken: string;
    }): Promise<any>;
    companies(email: string, req: {
        headers: {
            authorization?: string;
        };
    }): Promise<{
        result: any;
    }>;
    me(req: {
        user: unknown;
    }): {
        user: unknown;
    };
}
