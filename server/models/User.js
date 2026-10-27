import mongoose from 'mongoose';
import { env } from '../config/env.js';

// "sst.scaler.com" -> "SST": the school shown on profiles instead of the email.
export const schoolFromEmail = (email = '') => (email.split('@')[1] || '').split('.')[0].toUpperCase();

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    // Empty for accounts created with "Sign in with Google".
    passwordHash: { type: String, select: false },
    googleId: { type: String, index: { unique: true, sparse: true } },
    accountType: { type: String, enum: ['student', 'employee'], required: true },
    isVerified: { type: Boolean, default: false },
    avatarUrl: { type: String, default: '', maxlength: 500 },
    bio: { type: String, default: '', trim: true, maxlength: 160 },
    // Tokens are stored hashed (see utils/tokens.js) and hidden from queries by default.
    emailVerifyTokenHash: { type: String, select: false, index: { sparse: true } },
    emailVerifyExpires: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false, index: { sparse: true } },
    passwordResetExpires: { type: Date, select: false },
    // Login tokens issued before this moment are rejected (logs out other sessions).
    passwordChangedAt: { type: Date, select: false },
    // Sample data created by `npm run seed`; removed by `npm run seed:clear`.
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

// What the signed-in user sees about themselves.
userSchema.methods.toPrivateJSON = function toPrivateJSON() {
  return {
    id: String(this._id),
    name: this.name,
    email: this.email,
    accountType: this.accountType,
    isVerified: this.isVerified,
    needsVerification: env.requireEmailVerification && !this.isVerified,
    googleLinked: Boolean(this.googleId),
    school: schoolFromEmail(this.email),
    avatarUrl: this.avatarUrl,
    bio: this.bio,
    createdAt: this.createdAt,
  };
};

// What everyone else sees. Only the email *domain* is shown, never the full address.
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: String(this._id),
    name: this.name,
    accountType: this.accountType,
    isVerified: this.isVerified,
    avatarUrl: this.avatarUrl,
    bio: this.bio,
    emailDomain: this.email.split('@')[1],
    school: schoolFromEmail(this.email),
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
