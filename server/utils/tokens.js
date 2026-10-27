import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// One-time tokens (email verification, password reset). Only the SHA-256 hash is
// stored in the database, so a leaked database can't be used to verify accounts.
export const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

export function createRandomToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, hash: hashToken(token) };
}

export const signAuthToken = (userId) => jwt.sign({ sub: String(userId) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const verifyAuthToken = (token) => jwt.verify(token, env.jwtSecret);

// Standard response after any successful sign-in style action.
export const authResponse = (user, extra = {}) => ({
  token: signAuthToken(user._id),
  user: user.toPrivateJSON(),
  ...extra,
});
