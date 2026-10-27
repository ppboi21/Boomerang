import mongoose from 'mongoose';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function notFound(req, res) {
  res.status(404).json({ message: `Not found: ${req.method} ${req.originalUrl}` });
}

// Every error ends up here and leaves as { message, errors? } with a sensible status.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: err.issues[0]?.message || 'Invalid input',
      errors: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof ApiError) return res.status(err.status).json({ message: err.message });
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'That image is too large (max 5 MB).' : err.message;
    return res.status(400).json({ message });
  }
  if (err instanceof mongoose.Error.CastError) return res.status(400).json({ message: 'Invalid id' });
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ message: Object.values(err.errors)[0]?.message || 'Invalid data' });
  }
  if (err?.code === 11000) return res.status(409).json({ message: 'That already exists.' });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ message: 'Malformed JSON body' });
  if (err?.type === 'entity.too.large') return res.status(413).json({ message: 'Request body is too large' });

  console.error(err);
  res.status(500).json({ message: env.isProd ? 'Something went wrong on our side. Please try again.' : err.message });
}
