// Shape database documents into safe API responses. Never send password hashes,
// tokens or full email addresses of other users.

import { schoolFromEmail } from '../models/User.js';

// email is loaded only to derive the school label; it is never sent out.
export const PUBLIC_USER_FIELDS = 'name email avatarUrl accountType isVerified createdAt';

export function publicUser(user) {
  if (!user || !user._id) return null;
  return {
    id: String(user._id),
    name: user.name,
    avatarUrl: user.avatarUrl || '',
    accountType: user.accountType,
    school: schoolFromEmail(user.email),
    isVerified: Boolean(user.isVerified),
  };
}

export function serializeItem(item, viewerId) {
  const ownerId = String(item.owner?._id ?? item.owner);
  const isOwner = Boolean(viewerId) && ownerId === String(viewerId);
  return {
    id: String(item._id),
    type: item.type,
    title: item.title,
    description: item.description,
    category: item.category,
    location: item.location,
    date: item.date,
    images: (item.images || []).map((img) => img.url),
    reward: item.reward || '',
    status: item.status,
    resolvedAt: item.resolvedAt || null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    owner: publicUser(item.owner) ?? { id: ownerId },
    isOwner,
    // Identifying details are private: they let the owner/finder check a claim.
    ...(isOwner
      ? { identifyingDetails: item.identifyingDetails || '' }
      : { hasIdentifyingDetails: Boolean(item.identifyingDetails) }),
  };
}

export function serializeMessage(msg, clientId) {
  return {
    id: String(msg._id),
    conversation: String(msg.conversation),
    sender: String(msg.sender),
    text: msg.text,
    image: msg.image?.url || null,
    createdAt: msg.createdAt,
    ...(clientId ? { clientId } : {}),
  };
}

export function serializeConversation(conv, me, unread = 0) {
  const other = conv.participants.find((p) => String(p._id ?? p) !== String(me));
  const item = conv.item && conv.item._id ? conv.item : null;
  return {
    id: String(conv._id),
    item: item
      ? {
          id: String(item._id),
          title: item.title,
          type: item.type,
          status: item.status,
          image: item.images?.[0]?.url || '',
          ownerId: String(item.owner),
        }
      : null,
    other: publicUser(other),
    lastMessage: conv.lastMessage?.createdAt
      ? { text: conv.lastMessage.text, sender: String(conv.lastMessage.sender), createdAt: conv.lastMessage.createdAt }
      : null,
    unread,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
  };
}

export function serializeNotification(n) {
  return {
    id: String(n._id),
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.read,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}
