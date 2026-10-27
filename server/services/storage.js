import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { Item } from '../models/Item.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';

export const UPLOAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');
export const storageMode = env.cloudinaryEnabled ? 'cloudinary' : 'local';

if (env.cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

const LOCAL_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const LOCAL_URL = /^\/uploads\/([a-f0-9-]{36}\.(?:jpg|png|webp))$/;

// Saves an image and returns { url, publicId }.
export async function storeImage(buffer, mimetype) {
  if (env.cloudinaryEnabled) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: env.cloudinary.folder,
          resource_type: 'image',
          // Cap the stored size; phone photos are often 4000px+.
          transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
          format: mimetype === 'image/heic' ? 'jpg' : undefined,
        },
        (err, result) => (err ? reject(err) : resolve({ url: result.secure_url, publicId: result.public_id })),
      );
      stream.end(buffer);
    });
  }

  // Local dev fallback only (validateEnv requires Cloudinary in production).
  const ext = LOCAL_EXT[mimetype];
  if (!ext) throw Object.assign(new Error('HEIC images need Cloudinary configured. Use JPG/PNG/WEBP for now.'), { status: 400 });
  const name = `${crypto.randomUUID()}.${ext}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), buffer);
  return { url: `/uploads/${name}`, publicId: `local:${name}` };
}

// Only accept image URLs that our own upload endpoint produced.
export function publicIdFromUrl(url) {
  if (typeof url !== 'string') return null;
  const local = url.match(LOCAL_URL);
  if (local) return `local:${local[1]}`;
  // Sample-data illustrations bundled with the frontend (client/public/demo).
  const demo = url.match(/^\/demo\/([a-z0-9-]+\.svg)$/);
  if (demo) return `demo:${demo[1]}`;
  if (env.cloudinaryEnabled) {
    const prefix = `https://res.cloudinary.com/${env.cloudinary.cloudName}/image/upload/`;
    if (!url.startsWith(prefix)) return null;
    const m = url.slice(prefix.length).match(/^v\d+\/(.+)\.[a-z0-9]+$/i);
    if (m && m[1].startsWith(`${env.cloudinary.folder}/`)) return m[1];
  }
  return null;
}

async function deleteImage(publicId) {
  if (publicId.startsWith('demo:')) return; // bundled file, nothing to delete
  if (publicId.startsWith('local:')) {
    await fs.unlink(path.join(UPLOAD_DIR, publicId.slice(6))).catch(() => {});
  } else if (env.cloudinaryEnabled) {
    await cloudinary.uploader.destroy(publicId).catch((err) => console.warn('Cloudinary delete failed:', err.message));
  }
}

// Delete images no longer referenced by any item (other than `excludeItemId`) or avatar.
export async function removeImagesIfUnused(urls, excludeItemId) {
  for (const url of urls) {
    const publicId = publicIdFromUrl(url);
    if (!publicId) continue;
    const [usedByItem, usedByUser, usedInChat] = await Promise.all([
      Item.exists({ 'images.url': url, ...(excludeItemId ? { _id: { $ne: excludeItemId } } : {}) }),
      User.exists({ avatarUrl: url }),
      Message.exists({ 'image.url': url }),
    ]);
    if (!usedByItem && !usedByUser && !usedInChat) await deleteImage(publicId);
  }
}
