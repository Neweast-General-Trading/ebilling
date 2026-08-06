export declare class SamplesService {
    ensureDir(): string;
    listFiles(): {
        name: string;
        size: number;
        uploadedAt: string;
    }[];
    saveUploadedFile(file: Express.Multer.File): {
        name: string;
        size: number;
        path: string;
        uploadedAt: string;
    };
}
