export declare class CreateSimEmployeeDto {
    personNumber: string;
    phoneNumber: string;
    displayName: string;
    email?: string;
    lineType?: 'mobile' | 'landline' | 'department';
    packageLimit?: number;
    additionalAmount?: number;
}
