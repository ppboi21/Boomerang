import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Item } from '../models/Item.js';
import { User } from '../models/User.js';
import { publicIdFromUrl, removeImagesIfUnused } from '../services/storage.js';
import { ApiError } from '../utils/ApiError.js';
import { PUBLIC_USER_FIELDS, serializeItem } from '../utils/serializers.js';
import { authResponse } from '../utils/tokens.js';
import { idParams } from '../utils/validation.js';
import { passwordRule } from './auth.controller.js';

export async function getUserProfile(req, res) {
  const { id } = idParams.parse(req.params);
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');
  const items = await Item.find({ owner: id }).sort({ createdAt: -1 }).limit(60).populate('owner', PUBLIC_USER_FIELDS);
  res.json({ user: user.toPublicJSON(), items: items.map((i) => serializeItem(i, req.user._id)) });
}

const updateSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60).optional(),
  bio: z.string().trim().max(160, 'Bio can be at most 160 characters').optional(),
  avatarUrl: z.string().max(500).optional(),
});

export async function updateMe(req, res) {
  const data = updateSchema.parse(req.body);
  if (data.avatarUrl && !publicIdFromUrl(data.avatarUrl)) throw new ApiError(400, 'Profile photos must be uploaded through the app.');
  const previousAvatar = req.user.avatarUrl;
  Object.assign(req.user, data);
  await req.user.save();
  if (data.avatarUrl !== undefined && previousAvatar && previousAvatar !== data.avatarUrl) {
    removeImagesIfUnused([previousAvatar]).catch(() => {});
  }
  res.json({ user: req.user.toPrivateJSON() });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = z
    .object({ currentPassword: z.string().max(128).default(''), newPassword: passwordRule })
    .parse(req.body);
  const user = await User.findById(req.user._id).select('+passwordHash');
  // Google-created accounts have no password yet and may set one directly.
  if (user.passwordHash && !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new ApiError(400, currentPassword ? 'Current password is incorrect' : 'Enter your current password');
  }
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.passwordChangedAt = new Date(Date.now() - 1000);
  await user.save();
  // Other devices get signed out; this one receives a fresh token.
  res.json({ message: 'Password updated', ...authResponse(user) });
}
