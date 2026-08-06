"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const multer_1 = require("multer");
let UploadExceptionFilter = class UploadExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        if (exception instanceof multer_1.MulterError) {
            const payload = this.mapMulterError(exception);
            return response.status(payload.statusCode).json({
                ...payload,
                path: request.url,
                timestamp: new Date().toISOString(),
            });
        }
        if (this.isUploadBadRequest(exception)) {
            const payload = {
                statusCode: common_1.HttpStatus.BAD_REQUEST,
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
        if (exception instanceof common_1.HttpException) {
            const statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            return response.status(statusCode).json({
                ...(typeof exceptionResponse === 'object'
                    ? exceptionResponse
                    : {
                        statusCode,
                        error: common_1.HttpStatus[statusCode] || 'Error',
                        message: exceptionResponse,
                    }),
                path: request.url,
                timestamp: new Date().toISOString(),
            });
        }
    }
    mapMulterError(error) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return {
                statusCode: common_1.HttpStatus.PAYLOAD_TOO_LARGE,
                error: 'Payload Too Large',
                code: 'UPLOAD_FILE_TOO_LARGE',
                message: 'Uploaded file exceeds the configured maximum size. Please upload a smaller file.',
            };
        }
        const storageError = error.code === 'LIMIT_UNEXPECTED_FILE' ||
            error.message.toLowerCase().includes('enoent') ||
            error.message.toLowerCase().includes('eacces');
        if (storageError) {
            return {
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                error: 'Bad Request',
                code: 'UPLOAD_STORAGE_ERROR',
                message: 'Upload could not be processed due to temporary storage configuration.',
                details: { multerCode: error.code },
            };
        }
        return {
            statusCode: common_1.HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            code: 'UPLOAD_FAILED',
            message: error.message || 'Upload request is invalid.',
            details: { multerCode: error.code },
        };
    }
    isUploadBadRequest(exception) {
        const response = exception.getResponse();
        const message = this.normalizeMessage(response);
        return (message.toLowerCase().includes('file too large') ||
            message.toLowerCase().includes('unsupported file type') ||
            message.toLowerCase().includes('unexpected field'));
    }
    getBadRequestMessage(exception) {
        const response = exception.getResponse();
        return this.normalizeMessage(response);
    }
    normalizeMessage(response) {
        if (typeof response === 'string') {
            return response;
        }
        if (typeof response === 'object' && response !== null) {
            const record = response;
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
};
exports.UploadExceptionFilter = UploadExceptionFilter;
exports.UploadExceptionFilter = UploadExceptionFilter = __decorate([
    (0, common_1.Catch)(multer_1.MulterError, common_1.BadRequestException)
], UploadExceptionFilter);
//# sourceMappingURL=upload-exception.filter.js.map