import { rateLimit } from 'express-rate-limit';

// Strip keys like "$gt" or "a.b" from request bodies so they can't be smuggled
// into MongoDB queries (NoSQL injection). Zod validation is the second layer.
function stripOperators(value) {
  if (Array.isArray(value)) value.forEach(stripOperators);
  else if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) delete value[key];
      else stripOperators(value[key]);
    }
  }
}

export function sanitizeBody(req, res, next) {
  stripOperators(req.body);
  next();
}

const limiter = (windowMs, limit, message) =>
  rateLimit({ windowMs, limit, standardHeaders: 'draft-7', legacyHeaders: false, message: { message } });

export const authLimiter = limiter(15 * 60_000, 30, 'Too many attempts. Please wait a few minutes and try again.');
export const emailLimiter = limiter(60 * 60_000, 10, 'Too many emails requested. Please try again later.');
export const uploadLimiter = limiter(15 * 60_000, 40, 'Too many uploads. Please wait a few minutes.');
export const writeLimiter = limiter(15 * 60_000, 60, 'Too many changes in a short time. Please slow down.');
export const messageLimiter = limiter(60_000, 40, 'You are sending messages too quickly.');
