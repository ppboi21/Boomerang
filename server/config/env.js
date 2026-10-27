import 'dotenv/config';

const list = (value) =>
  (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const isProd = process.env.NODE_ENV === 'production';
const clientUrls = list(process.env.CLIENT_URL).map((u) => u.replace(/\/$/, ''));

export const env = {
  isProd,
  port: Number(process.env.PORT) || 5050,
  mongoUri: process.env.MONGODB_URI?.trim(),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrls: clientUrls.length ? clientUrls : ['http://localhost:5180'],
  collegeDomains: list(process.env.COLLEGE_EMAIL_DOMAINS).map((d) => d.toLowerCase().replace(/^@/, '')),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    apiKey: process.env.CLOUDINARY_API_KEY?.trim(),
    apiSecret: process.env.CLOUDINARY_API_SECRET?.trim(),
    folder: process.env.CLOUDINARY_FOLDER?.trim() || 'campus-lost-found',
  },
  smtp: {
    host: process.env.SMTP_HOST?.trim(),
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER?.trim(),
    pass: process.env.SMTP_PASS,
  },
  emailFrom: process.env.EMAIL_FROM?.trim(),
  // Off for now (college OAuth will replace it). Domain allowlist still applies.
  requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
  // "Sign in with Google". The client ID is public; no client secret is needed.
  googleClientId: process.env.GOOGLE_CLIENT_ID?.trim(),
  // Set to true to turn off email + password sign-in (Google only).
  googleOnly: process.env.GOOGLE_ONLY === 'true',
};

env.cloudinaryEnabled = Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);
env.smtpEnabled = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass && env.emailFrom);

// Fail fast with readable messages instead of crashing later with cryptic errors.
export function validateEnv() {
  const problems = [];
  if (!env.mongoUri) problems.push('MONGODB_URI is empty. Paste your MongoDB Atlas connection string into server/.env');
  if (!env.jwtSecret || env.jwtSecret.length < 32) problems.push('JWT_SECRET must be at least 32 random characters');
  if (!env.collegeDomains.length) problems.push('COLLEGE_EMAIL_DOMAINS is empty. Add your college email domain(s), e.g. mycollege.edu');
  if (isProd && !env.cloudinaryEnabled) problems.push('Cloudinary credentials are required in production (images must be stored persistently)');
  if (isProd && env.requireEmailVerification && !env.smtpEnabled) {
    problems.push('SMTP settings + EMAIL_FROM are required in production when REQUIRE_EMAIL_VERIFICATION=true');
  }
  if (env.googleOnly && !env.googleClientId) problems.push('GOOGLE_ONLY=true needs GOOGLE_CLIENT_ID to be set');
  if (isProd && !process.env.CLIENT_URL) problems.push('CLIENT_URL must be set in production (your deployed frontend URL)');

  if (problems.length) {
    console.error(`\n✖ Server configuration problems:\n${problems.map((p) => `  • ${p}`).join('\n')}\n`);
    process.exit(1);
  }
}
