import { z } from 'zod';
import { env } from '../config/env.js';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const idParams = z.object({ id: objectId });

// Drop empty query-string values so "?category=" behaves like no filter.
export const cleanQuery = (query) =>
  Object.fromEntries(Object.entries(query || {}).filter(([, v]) => typeof v === 'string' && v.trim() !== ''));

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Exact domain match against the allowlist. "a@sub.college.edu" only passes if
// "sub.college.edu" itself is listed.
export function isCollegeEmail(email) {
  const domain = String(email).split('@').pop()?.toLowerCase();
  return Boolean(domain) && env.collegeDomains.includes(domain);
}
