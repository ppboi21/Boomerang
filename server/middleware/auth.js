import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyAuthToken } from '../utils/tokens.js';

// Shared by HTTP middleware and the Socket.IO handshake.
export async function userFromToken(token) {
  if (!token) throw new ApiError(401, 'Please sign in to continue');
  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch {
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }
  const user = await User.findById(payload.sub).select('+passwordChangedAt');
  if (!user) throw new ApiError(401, 'Account not found. Please sign in again.');
  if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime()) {
    throw new ApiError(401, 'Your password was changed. Please sign in again.');
  }
  return user;
}

export async function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  req.user = await userFromToken(token);
  next();
}

// When email verification is switched on, most features need a verified email.
export const needsVerification = (user) => env.requireEmailVerification && !user?.isVerified;

export function requireVerified(req, res, next) {
  if (needsVerification(req.user)) throw new ApiError(403, 'Please verify your college email to use this feature.');
  next();
}
