import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { emailAvailable, emailDevMode, sendPasswordResetEmail, sendVerificationEmail } from '../services/email.js';
import { ApiError } from '../utils/ApiError.js';
import { authResponse, createRandomToken, hashToken } from '../utils/tokens.js';
import { isCollegeEmail } from '../utils/validation.js';

const VERIFY_TTL = 24 * 60 * 60 * 1000;
const RESET_TTL = 30 * 60 * 1000;
// Compared against when the email doesn't exist, so response time doesn't reveal it.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

const email = z.string().trim().toLowerCase().max(254).email('Enter a valid email address');
export const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password needs at least one letter')
  .regex(/\d/, 'Password needs at least one number');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name is too long'),
  email,
  password: passwordRule,
  accountType: z.enum(['student', 'employee']).default('student'),
});
const loginSchema = z.object({ email, password: z.string().min(1, 'Enter your password').max(128) });
const tokenSchema = z.object({ token: z.string().min(20).max(200) });

// In dev email mode the link is also returned to the browser so you can test
// without an email provider. Never happens in production (see validateEnv).
const devExtras = (link) => (emailDevMode && link ? { devLink: link } : {});

async function issueVerification(user) {
  const { token, hash } = createRandomToken();
  user.emailVerifyTokenHash = hash;
  user.emailVerifyExpires = new Date(Date.now() + VERIFY_TTL);
  await user.save();
  return sendVerificationEmail(user, token);
}

export function getConfig(req, res) {
  res.json({
    collegeDomains: env.collegeDomains,
    emailDevMode,
    requireEmailVerification: env.requireEmailVerification,
    passwordResetAvailable: emailAvailable && !env.googleOnly,
    googleClientId: env.googleClientId || null,
    passwordLogin: !env.googleOnly,
  });
}

function assertPasswordLoginAllowed() {
  if (env.googleOnly) throw new ApiError(403, 'Please use "Continue with Google" with your college account.');
}

export async function register(req, res) {
  assertPasswordLoginAllowed();
  const data = registerSchema.parse(req.body);
  if (!isCollegeEmail(data.email)) {
    throw new ApiError(403, `Only college emails can join (${env.collegeDomains.map((d) => `@${d}`).join(', ')}).`);
  }

  let user = await User.findOne({ email: data.email });
  // Without email verification nobody can prove inbox ownership, so an existing
  // account must never be overwritten by a new sign-up.
  if (user && (user.isVerified || !env.requireEmailVerification)) {
    throw new ApiError(409, 'An account with this email already exists. Try signing in.');
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  if (!env.requireEmailVerification) {
    user = await User.create({ name: data.name, email: data.email, accountType: data.accountType, passwordHash });
    return res.status(201).json(authResponse(user));
  }
  if (user) {
    // Unverified account: nobody proved they own this inbox yet, so a fresh
    // sign-up replaces it. Old sessions for it stop working.
    Object.assign(user, { name: data.name, accountType: data.accountType, passwordHash });
    user.passwordChangedAt = new Date(Date.now() - 1000);
  } else {
    user = new User({ name: data.name, email: data.email, accountType: data.accountType, passwordHash });
  }

  let link = null;
  let emailSent = true;
  try {
    link = await issueVerification(user);
  } catch (err) {
    console.error('Verification email failed:', err.message);
    emailSent = false;
    if (user.isNew) await user.save();
  }
  res.status(201).json(authResponse(user, { emailSent, ...devExtras(link) }));
}

export async function login(req, res) {
  assertPasswordLoginAllowed();
  const { email: address, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email: address }).select('+passwordHash');
  if (user && !user.passwordHash && user.googleId) {
    throw new ApiError(400, 'This account signs in with Google. Use "Continue with Google".');
  }
  const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
  if (!user || !ok) throw new ApiError(401, 'Incorrect email or password');
  res.json(authResponse(user));
}

export function me(req, res) {
  res.json({ user: req.user.toPrivateJSON() });
}

export async function verifyEmail(req, res) {
  const { token } = tokenSchema.parse(req.body);
  const user = await User.findOne({ emailVerifyTokenHash: hashToken(token), emailVerifyExpires: { $gt: new Date() } });
  if (!user) throw new ApiError(400, 'This verification link is invalid or has expired. Request a new one.');
  user.isVerified = true;
  user.emailVerifyTokenHash = undefined;
  user.emailVerifyExpires = undefined;
  await user.save();
  res.json(authResponse(user));
}

export async function resendVerification(req, res) {
  if (req.user.isVerified) throw new ApiError(400, 'Your email is already verified.');
  let link;
  try {
    link = await issueVerification(req.user);
  } catch (err) {
    console.error('Verification email failed:', err.message);
    throw new ApiError(502, "We couldn't send the email right now. Please try again in a minute.");
  }
  res.json({ message: 'Verification email sent. Check your inbox (and spam folder).', ...devExtras(link) });
}

export async function forgotPassword(req, res) {
  const { email: address } = z.object({ email }).parse(req.body);
  const user = await User.findOne({ email: address });
  let extras = {};
  if (user) {
    const { token, hash } = createRandomToken();
    user.passwordResetTokenHash = hash;
    user.passwordResetExpires = new Date(Date.now() + RESET_TTL);
    await user.save();
    try {
      extras = devExtras(await sendPasswordResetEmail(user, token));
    } catch (err) {
      console.error('Reset email failed:', err.message);
    }
  }
  // Same answer whether or not the account exists, so emails can't be probed.
  res.json({ message: 'If an account exists for that email, a reset link is on its way.', ...extras });
}

export async function resetPassword(req, res) {
  const { token, password } = tokenSchema.extend({ password: passwordRule }).parse(req.body);
  const user = await User.findOne({ passwordResetTokenHash: hashToken(token), passwordResetExpires: { $gt: new Date() } });
  if (!user) throw new ApiError(400, 'This reset link is invalid or has expired. Request a new one.');
  user.passwordHash = await bcrypt.hash(password, 12);
  user.passwordChangedAt = new Date(Date.now() - 1000);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  user.isVerified = true; // they just proved they can read this inbox
  await user.save();
  res.json(authResponse(user));
}
