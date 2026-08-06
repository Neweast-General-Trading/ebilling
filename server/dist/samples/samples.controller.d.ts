import { SamplesService } from './samples.service';
export declare class SamplesController {
    private readonly samplesService;
    constructor(samplesService: SamplesService);
    list(): {
        directory: string;
        files: {
            name: string;
            size: number;
            uploadedAt: string;
        }[];
    };
    upload(files: Express.Multer.File[]): {
        uploaded: number;
        files: {
            name: string;
            size: number;
            path: string;
            uploadedAt: string;
        }[];
        all: {
            name: string;
            size: number;
            uploadedAt: string;
        }[];
    };
}
