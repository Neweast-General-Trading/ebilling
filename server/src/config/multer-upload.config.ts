import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import * as path from 'path';

/** Constant that sets the maximum image upload file size */
export const maxImageUploadSize = 500 * 1024 * 1024; // 500MB
/** Constant that sets the maximum file upload size for documents/images */

/** Constant that sets the maximum file upload size for videos */
const defaultMaxVideoUploadSize = 10 * 1024 * 1024 * 1024; // 10GB
const envMaxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES);

export const maxVideoUploadSize =
  Number.isFinite(envMaxUploadBytes) && envMaxUploadBytes > 0
    ? envMaxUploadBytes
    : defaultMaxVideoUploadSize;

const defaultUploadTmpDir = __dirname.includes(`${path.sep}dist${path.sep}`)
  ? path.resolve(__dirname, '..', '..', '..', 'uploads')
  : path.resolve(__dirname, '..', '..', 'uploads');

export const uploadTmpDir = process.env.UPLOAD_TMP_DIR || defaultUploadTmpDir;

/** Video MIME types */
export const videoMimeTypes = [
  'video/mp4',
  'video/quicktime', // .mov
  'video/webm',
] as const;

/** Document/Image MIME types */
const documentMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
];

/** All allowed MIME types */
const allowedMimeTypes = [...documentMimeTypes, ...videoMimeTypes];

/** Check if a MIME type is a video type */
export const isVideoMimeType = (mimeType: string): boolean => {
  return (videoMimeTypes as readonly string[]).includes(mimeType);
};

/** Configurations for the multer library used for file upload.
 *
 * Accepts images, PDFs, Excel, Word, and video files.
 * Size limits: 10MB for documents/images, 2GB for videos.
 */
export const multerUploadConfig: MulterOptions = {
  storage: diskStorage({
    destination: uploadTmpDir,
    filename: (request, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileName = `${uniqueSuffix}-${file.originalname}`;
      return callback(null, fileName);
    },
  }),
  limits: {
    fileSize: maxVideoUploadSize, // Use video limit (2GB) as max
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          `Unsupported file type: ${file.mimetype}. Allowed: images, PDFs, Excel, Word, and videos (MP4, MOV, WebM).`,
        ),
        false,
      );
    }

    cb(null, true);
  },
};

/** Samples folder upload — accept any file type */
export const samplesMulterUploadConfig: MulterOptions = {
  storage: diskStorage({
    destination: uploadTmpDir,
    filename: (request, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileName = `${uniqueSuffix}-${file.originalname}`;
      return callback(null, fileName);
    },
  }),
  limits: {
    fileSize: maxVideoUploadSize,
  },
};
