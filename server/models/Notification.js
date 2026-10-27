import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = ['message', 'contact', 'match', 'status'];

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, maxlength: 140 },
    body: { type: String, default: '', maxlength: 300 },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, read: 1, updatedAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
