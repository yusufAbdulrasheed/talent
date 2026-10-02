import multer from 'multer';
import { AppError } from '../utils/app-error.js';

const MAX_BYTES = 10 * 1024 * 1024; // Cloudinary free-plan ceiling for image/raw.

// Raster images plus PDF. Extend as new document types are needed; SVG is left
// out on purpose (script-bearing markup).
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
  'application/pdf',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter(_request, file, callback) {
    if (ALLOWED_MIME.has(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(new AppError(`Unsupported file type: ${file.mimetype}.`, 415));
  },
});

/**
 * Accepts a single `file` field, translating multer's own errors (size,
 * count) into the app's error shape.
 */
export function singleFile(request, response, next) {
  upload.single('file')(request, response, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'File is larger than the 10 MB limit.'
        : `Upload rejected: ${error.message}.`;
      next(new AppError(message, 413));
      return;
    }

    next(error);
  });
}
