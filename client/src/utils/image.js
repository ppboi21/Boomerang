import { assetUrl } from '../services/api';

// Ask Cloudinary for a resized, auto-format version. Local dev URLs pass through.
export function imgUrl(url, width = 800) {
  if (!url) return '';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${width}/`);
  }
  return assetUrl(url);
}

// Re-encode photos in the browser before upload: shrinks big phone photos
// below the size limit and strips EXIF metadata (including GPS location).
export async function prepareImage(file, maxSide = 2000) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file; // e.g. HEIC: send as-is
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
