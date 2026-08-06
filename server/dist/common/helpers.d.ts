interface SENDOTPWHATSAPP {
    sender: string;
    recevier: string;
    phone: string;
    co: string;
}
export declare const sendWishWhatsapp: (token: string, data: SENDOTPWHATSAPP) => Promise<any>;
export declare const sendAnniversaryWhatsapp: (token: string, data: SENDOTPWHATSAPP) => Promise<any>;
export declare const loginToWhatsappAPI: () => Promise<{
    status: string;
    message: string;
    JWTAUTH?: string;
}>;
export {};
