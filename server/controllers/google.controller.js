import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { authResponse } from '../utils/tokens.js';
import { isCollegeEmail } from '../utils/validation.js';

const client = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

// "Sign in with Google": the browser gets an ID token from Google and sends it
// here. We verify it with Google (signature, expiry, audience = our client ID)
// and only then trust the email inside it.
export async function googleSignIn(req, res) {
  if (!client) throw new ApiError(503, 'Google sign-in is not configured on the server.');
  const { credential } = z.object({ credential: z.string().min(20).max(4096) }).parse(req.body);

  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: env.googleClientId });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(401, 'Google sign-in failed. Please try again.');
  }

  const email = String(payload.email || '').toLowerCase();
  const domain = email.split('@')[1];
  // email_verified: Google confirmed ownership. hd: the account belongs to that
  // Google Workspace (so a personal Gmail can't pass for a college account).
  if (!payload.email_verified || !isCollegeEmail(email) || payload.hd !== domain) {
    throw new ApiError(403, `Use your college Google account (${env.collegeDomains.map((d) => `@${d}`).join(', ')}).`);
  }

  let user = await User.findOne({ googleId: payload.sub });
  if (!user) {
    user = await User.findOne({ email });
    if (user) {
      // Existing email/password account: link it to Google.
      user.googleId = payload.sub;
      user.isVerified = true;
      if (!user.avatarUrl && payload.picture) user.avatarUrl = payload.picture;
      await user.save();
    } else {
      user = await User.create({
        name: (payload.name || email.split('@')[0]).slice(0, 60),
        email,
        googleId: payload.sub,
        accountType: 'student',
        isVerified: true,
        avatarUrl: payload.picture || '',
      });
    }
  }
  res.json(authResponse(user));
}
