import { z } from 'zod';
import { Conversation } from '../models/Conversation.js';
import { Item } from '../models/Item.js';
import { Message } from '../models/Message.js';
import { Notification } from '../models/Notification.js';
import { notify, notifyNewMessage } from '../services/notifications.js';
import { publicIdFromUrl } from '../services/storage.js';
import { emitToUser } from '../sockets/index.js';
import { ApiError } from '../utils/ApiError.js';
import { PUBLIC_USER_FIELDS, serializeConversation, serializeMessage } from '../utils/serializers.js';
import { cleanQuery, idParams, objectId } from '../utils/validation.js';

const ITEM_FIELDS = 'title type status images owner';

// Only participants may read or write a conversation. Non-members get a 404 so
// they can't even learn that it exists.
async function loadMembership(req) {
  const { id } = idParams.parse(req.params);
  const conv = await Conversation.findOne({ _id: id, participants: req.user._id });
  if (!conv) throw new ApiError(404, 'Conversation not found');
  return conv;
}

function unreadFor(conv, userId) {
  const lastRead = conv.lastReadAt?.get?.(String(userId)) ?? conv.lastReadAt?.[String(userId)] ?? new Date(0);
  return Message.countDocuments({ conversation: conv._id, sender: { $ne: userId }, createdAt: { $gt: lastRead } });
}

export async function totalUnreadMessages(userId) {
  const convs = await Conversation.find({ participants: userId, 'lastMessage.createdAt': { $exists: true } }).select('lastReadAt');
  const counts = await Promise.all(convs.map((c) => unreadFor(c, userId)));
  return counts.reduce((a, b) => a + b, 0);
}

export async function listConversations(req, res) {
  const convs = await Conversation.find({ participants: req.user._id })
    .sort({ updatedAt: -1 })
    .limit(100)
    .populate('participants', PUBLIC_USER_FIELDS)
    .populate('item', ITEM_FIELDS);
  const unread = await Promise.all(convs.map((c) => unreadFor(c, req.user._id)));
  res.json({ conversations: convs.map((c, i) => serializeConversation(c, req.user._id, unread[i])) });
}

export async function getConversation(req, res) {
  const conv = await loadMembership(req);
  await conv.populate([
    { path: 'participants', select: PUBLIC_USER_FIELDS },
    { path: 'item', select: ITEM_FIELDS },
  ]);
  res.json({ conversation: serializeConversation(conv, req.user._id) });
}

// Find-or-create the conversation between me and the person who posted an item.
export async function startConversation(req, res) {
  const { itemId } = z.object({ itemId: objectId }).parse(req.body);
  const item = await Item.findById(itemId);
  if (!item) throw new ApiError(404, 'Report not found');
  if (item.owner.equals(req.user._id)) throw new ApiError(400, "This is your own report - you can't message yourself.");

  const participantsKey = Conversation.keyFor(req.user._id, item.owner);
  let conv = await Conversation.findOne({ item: item._id, participantsKey });
  let created = false;
  if (!conv) {
    try {
      conv = await Conversation.create({ participants: [req.user._id, item.owner], participantsKey, item: item._id });
      created = true;
    } catch (err) {
      if (err?.code !== 11000) throw err;
      conv = await Conversation.findOne({ item: item._id, participantsKey }); // created concurrently
    }
  }

  if (created) {
    if (item.status === 'open') {
      item.status = 'contacted';
      await item.save();
    }
    notify(item.owner, {
      type: 'contact',
      title: `${req.user.name} wants to talk about "${item.title}"`,
      body: item.type === 'lost' ? 'They may have found your item.' : 'They think this might be theirs.',
      link: `/messages/${conv._id}`,
    }).catch(() => {});
  }

  await conv.populate([
    { path: 'participants', select: PUBLIC_USER_FIELDS },
    { path: 'item', select: ITEM_FIELDS },
  ]);
  res.status(created ? 201 : 200).json({ conversation: serializeConversation(conv, req.user._id) });
}

export async function listMessages(req, res) {
  const conv = await loadMembership(req);
  const { before, limit } = z
    .object({ before: z.coerce.date().optional(), limit: z.coerce.number().int().min(1).max(100).default(40) })
    .parse(cleanQuery(req.query));
  const filter = { conversation: conv._id, ...(before ? { createdAt: { $lt: before } } : {}) };
  const docs = await Message.find(filter).sort({ createdAt: -1 }).limit(limit + 1);
  const hasMore = docs.length > limit;
  res.json({ messages: docs.slice(0, limit).reverse().map((m) => serializeMessage(m)), hasMore });
}

export async function sendMessage(req, res) {
  const conv = await loadMembership(req);
  const { text, image, clientId } = z
    .object({
      text: z.string().trim().max(2000, 'Message is too long (max 2000 characters)').default(''),
      image: z.string().max(500).optional(),
      clientId: z.string().max(64).optional(),
    })
    .parse(req.body);
  if (!text && !image) throw new ApiError(400, 'Message cannot be empty');
  let photo;
  if (image) {
    const publicId = publicIdFromUrl(image);
    if (!publicId || publicId.startsWith('demo:')) throw new ApiError(400, 'Photos must be uploaded through the app.');
    photo = { url: image, publicId };
  }

  const msg = await Message.create({ conversation: conv._id, sender: req.user._id, text, image: photo });
  const preview = text || '📷 Photo';
  conv.lastMessage = { text: preview.slice(0, 140), sender: req.user._id, createdAt: msg.createdAt };
  conv.lastReadAt.set(String(req.user._id), msg.createdAt);
  await conv.save();

  const payload = { conversationId: String(conv._id), message: serializeMessage(msg, clientId) };
  for (const p of conv.participants) emitToUser(p, 'message:new', payload);

  const other = conv.participants.find((p) => !p.equals(req.user._id));
  notifyNewMessage(other, req.user, conv._id, preview).catch(() => {});

  res.status(201).json({ message: payload.message });
}

export async function markRead(req, res) {
  const conv = await loadMembership(req);
  conv.lastReadAt.set(String(req.user._id), new Date());
  await conv.save({ timestamps: false }); // reading shouldn't reorder the conversation list
  await Notification.updateMany(
    { recipient: req.user._id, type: 'message', link: `/messages/${conv._id}`, read: false },
    { $set: { read: true } },
  );
  emitToUser(req.user._id, 'conversation:read', { conversationId: String(conv._id) });
  res.status(204).end();
}
