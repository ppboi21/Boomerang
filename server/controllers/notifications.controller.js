import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { serializeNotification } from '../utils/serializers.js';
import { idParams } from '../utils/validation.js';
import { totalUnreadMessages } from './conversations.controller.js';

export async function listNotifications(req, res) {
  const list = await Notification.find({ recipient: req.user._id }).sort({ updatedAt: -1 }).limit(50);
  res.json({ notifications: list.map(serializeNotification) });
}

// Badge numbers for the sidebar.
export async function counts(req, res) {
  const [notifications, messages] = await Promise.all([
    Notification.countDocuments({ recipient: req.user._id, read: false }),
    totalUnreadMessages(req.user._id),
  ]);
  res.json({ notifications, messages });
}

export async function markNotificationRead(req, res) {
  const { id } = idParams.parse(req.params);
  const n = await Notification.findOneAndUpdate(
    { _id: id, recipient: req.user._id },
    { $set: { read: true } },
    { returnDocument: 'after', timestamps: false },
  );
  if (!n) throw new ApiError(404, 'Notification not found');
  res.json({ notification: serializeNotification(n) });
}

export async function markAllRead(req, res) {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { $set: { read: true } }, { timestamps: false });
  res.status(204).end();
}
