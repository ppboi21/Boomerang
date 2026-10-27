import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { sanitizeBody } from './middleware/security.js';
import { apiRouter } from './routes/index.js';
import { emailDevMode } from './services/email.js';
import { UPLOAD_DIR, storageMode } from './services/storage.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // behind Render's proxy: needed for correct rate limiting by IP
  app.disable('x-powered-by');

  // Allow images (/uploads in dev) to be shown by the frontend on another origin.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin(origin, cb) {
        // No Origin header = same-origin or a tool like curl.
        if (!origin || env.clientUrls.includes(origin)) return cb(null, true);
        cb(null, false);
      },
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(sanitizeBody);

  if (storageMode === 'local') app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

  app.get('/api/health', (req, res) => {
    const dbUp = mongoose.connection.readyState === 1;
    res.status(dbUp ? 200 : 503).json({
      status: dbUp ? 'ok' : 'degraded',
      database: dbUp ? 'connected' : 'disconnected',
      storage: storageMode,
      email: emailDevMode ? 'dev-mode (printed to server terminal)' : 'smtp',
      time: new Date().toISOString(),
    });
  });

  app.use('/api', apiRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
