import { ArgumentsHost, BadRequestException, ExceptionFilter } from '@nestjs/common';
import { MulterError } from 'multer';
export declare class UploadExceptionFilter implements ExceptionFilter {
    catch(exception: MulterError | BadRequestException, host: ArgumentsHost): any;
    private mapMulterError;
    private isUploadBadRequest;
    private getBadRequestMessage;
    private normalizeMessage;
}
