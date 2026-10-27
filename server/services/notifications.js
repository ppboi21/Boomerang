import { Notification } from '../models/Notification.js';
import { emitToUser } from '../sockets/index.js';
import { serializeNotification } from '../utils/serializers.js';

export async function notify(recipientId, { type, title, body = '', link = '' }) {
  const n = await Notification.create({ recipient: recipientId, type, title, body: body.slice(0, 300), link });
  emitToUser(recipientId, 'notification:new', serializeNotification(n));
  return n;
}

// One unread "new message" notification per conversation, refreshed with the
// latest message, instead of one notification per message.
export async function notifyNewMessage(recipientId, sender, conversationId, text) {
  const link = `/messages/${conversationId}`;
  const n = await Notification.findOneAndUpdate(
    { recipient: recipientId, type: 'message', link, read: false },
    { $set: { title: `New message from ${sender.name}`, body: text.slice(0, 120) } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );
  emitToUser(recipientId, 'notification:new', serializeNotification(n));
}
