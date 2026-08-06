import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
export declare const maxImageUploadSize: number;
export declare const maxVideoUploadSize: number;
export declare const uploadTmpDir: string;
export declare const videoMimeTypes: readonly ["video/mp4", "video/quicktime", "video/webm"];
export declare const isVideoMimeType: (mimeType: string) => boolean;
export declare const multerUploadConfig: MulterOptions;
