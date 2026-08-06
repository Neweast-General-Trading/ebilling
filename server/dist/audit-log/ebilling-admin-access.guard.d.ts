import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class EbillingAdminAccessGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
