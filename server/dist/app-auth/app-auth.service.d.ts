import * as jwt from 'jsonwebtoken';
export declare class AppAuthService {
    private readonly jwtSecret;
    private readonly intranetApiUrl;
    verifyToken(token: string): string | jwt.JwtPayload;
    loginViaIntranet(azureToken: string): Promise<any>;
    getCompanies(appJwt: string, email: string): Promise<any>;
}
