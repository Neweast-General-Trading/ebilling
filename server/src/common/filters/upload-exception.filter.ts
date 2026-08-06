import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MulterError } from 'multer';

type UploadErrorResponse = {
  statusCode: number;
  error: string;
  code: string;
  message: string;
  details?: unknown;
};

@Catch(MulterError, BadRequestException)
export class UploadExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError | BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    if (exception instanceof MulterError) {
      const payload = this.mapMulterError(exception);
      return response.status(payload.statusCode).json({
        ...payload,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
    }

    if (this.isUploadBadRequest(exception)) {
      const payload: UploadErrorResponse = {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        code: 'UPLOAD_VALIDATION_FAILED',
        message: this.getBadRequestMessage(exception),
      };

      return response.status(payload.statusCode).json({
        ...payload,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      return response.status(statusCode).json({
        ...(typeof exceptionResponse === 'object'
          ? exceptionResponse
          : {
              statusCode,
              error: HttpStatus[statusCode] || 'Error',
              message: exceptionResponse,
            }),
        path: request.url,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private mapMulterError(error: MulterError): UploadErrorResponse {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return {
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        error: 'Payload Too Large',
        code: 'UPLOAD_FILE_TOO_LARGE',
        message:
          'Uploaded file exceeds the configured maximum size. Please upload a smaller file.',
      };
    }

    const storageError =
      error.code === 'LIMIT_UNEXPECTED_FILE' ||
      error.message.toLowerCase().includes('enoent') ||
      error.message.toLowerCase().includes('eacces');

    if (storageError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        code: 'UPLOAD_STORAGE_ERROR',
        message:
          'Upload could not be processed due to temporary storage configuration.',
        details: { multerCode: error.code },
      };
    }

    return {
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Bad Request',
      code: 'UPLOAD_FAILED',
      message: error.message || 'Upload request is invalid.',
      details: { multerCode: error.code },
    };
  }

  private isUploadBadRequest(exception: BadRequestException): boolean {
    const response = exception.getResponse();
    const message = this.normalizeMessage(response);

    return (
      message.toLowerCase().includes('file too large') ||
      message.toLowerCase().includes('unsupported file type') ||
      message.toLowerCase().includes('unexpected field')
    );
  }

  private getBadRequestMessage(exception: BadRequestException): string {
    const response = exception.getResponse();
    return this.normalizeMessage(response);
  }

  private normalizeMessage(response: unknown): string {
    if (typeof response === 'string') {
      return response;
    }

    if (typeof response === 'object' && response !== null) {
      const record = response as Record<string, unknown>;
      const message = record.message;

      if (Array.isArray(message)) {
        return message.join('; ');
      }

      if (typeof message === 'string') {
        return message;
      }
    }

    return 'Upload request is invalid.';
  }
}
