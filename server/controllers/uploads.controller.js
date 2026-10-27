import { storeImage, storageMode } from '../services/storage.js';
import { ApiError } from '../utils/ApiError.js';
import { sniffImageType } from '../utils/imageType.js';

export async function uploadImage(req, res) {
  if (!req.file) throw new ApiError(400, 'Choose an image to upload (field name "image").');
  const type = sniffImageType(req.file.buffer);
  if (!type) throw new ApiError(400, "That file isn't a supported image. Use JPG, PNG, WEBP or HEIC.");
  if (type === 'image/heic' && storageMode === 'local') {
    throw new ApiError(400, 'HEIC photos need Cloudinary configured. Please use JPG, PNG or WEBP for now.');
  }
  const { url } = await storeImage(req.file.buffer, type);
  res.status(201).json({ url });
}
