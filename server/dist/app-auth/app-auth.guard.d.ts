import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AppAuthService } from './app-auth.service';
export declare class AppAuthGuard implements CanActivate {
    private readonly authService;
    constructor(authService: AppAuthService);
    canActivate(context: ExecutionContext): boolean;
}
