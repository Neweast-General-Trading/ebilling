"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.multerUploadConfig = exports.isVideoMimeType = exports.videoMimeTypes = exports.uploadTmpDir = exports.maxVideoUploadSize = exports.maxImageUploadSize = void 0;
const multer_1 = require("multer");
const path = __importStar(require("path"));
exports.maxImageUploadSize = 500 * 1024 * 1024;
const defaultMaxVideoUploadSize = 10 * 1024 * 1024 * 1024;
const envMaxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES);
exports.maxVideoUploadSize = Number.isFinite(envMaxUploadBytes) && envMaxUploadBytes > 0
    ? envMaxUploadBytes
    : defaultMaxVideoUploadSize;
const defaultUploadTmpDir = __dirname.includes(`${path.sep}dist${path.sep}`)
    ? path.resolve(__dirname, '..', '..', '..', 'uploads')
    : path.resolve(__dirname, '..', '..', 'uploads');
exports.uploadTmpDir = process.env.UPLOAD_TMP_DIR || defaultUploadTmpDir;
exports.videoMimeTypes = [
    'video/mp4',
    'video/quicktime',
    'video/webm',
];
const documentMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/gif',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
];
const allowedMimeTypes = [...documentMimeTypes, ...exports.videoMimeTypes];
const isVideoMimeType = (mimeType) => {
    return exports.videoMimeTypes.includes(mimeType);
};
exports.isVideoMimeType = isVideoMimeType;
exports.multerUploadConfig = {
    storage: (0, multer_1.diskStorage)({
        destination: exports.uploadTmpDir,
        filename: (request, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const fileName = `${uniqueSuffix}-${file.originalname}`;
            return callback(null, fileName);
        },
    }),
    limits: {
        fileSize: exports.maxVideoUploadSize,
    },
    fileFilter: (req, file, cb) => {
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: images, PDFs, Excel, Word, and videos (MP4, MOV, WebM).`), false);
        }
        cb(null, true);
    },
};
exports.samplesMulterUploadConfig = {
    storage: (0, multer_1.diskStorage)({
        destination: exports.uploadTmpDir,
        filename: (request, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const fileName = `${uniqueSuffix}-${file.originalname}`;
            return callback(null, fileName);
        },
    }),
    limits: {
        fileSize: exports.maxVideoUploadSize,
    },
};
//# sourceMappingURL=multer-upload.config.js.map