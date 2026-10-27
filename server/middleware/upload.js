import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Files are kept in memory only long enough to stream them to storage.
// The real type is checked again from the file bytes in the controller.
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter(req, file, cb) {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/octet-stream') cb(null, true);
    else cb(new ApiError(400, 'Only image files are allowed (JPG, PNG, WEBP or HEIC).'));
  },
}).single('image');
