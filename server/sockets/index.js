import { Server } from 'socket.io';
import { Conversation } from '../models/Conversation.js';
import { needsVerification, userFromToken } from '../middleware/auth.js';

let io = null;
// userId -> number of open sockets (a user may have several tabs/devices)
const online = new Map();

export function emitToUser(userId, event, payload) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export const isOnline = (userId) => online.has(String(userId));

export function initSockets(httpServer, corsOrigins) {
  io = new Server(httpServer, { cors: { origin: corsOrigins } });

  // Authenticate every connection with the same JWT used by the REST API.
  io.use(async (socket, next) => {
    try {
      const user = await userFromToken(socket.handshake.auth?.token);
      if (needsVerification(user)) return next(new Error('Email not verified'));
      socket.data.userId = String(user._id);
      socket.data.conversations = new Map(); // membership cache for typing events
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    // Each user gets a private room; messages are only ever emitted to participants' rooms.
    socket.join(`user:${userId}`);

    const count = (online.get(userId) || 0) + 1;
    online.set(userId, count);
    if (count === 1) socket.broadcast.emit('presence:update', { userId, online: true });
    socket.emit('presence:list', [...online.keys()]);

    async function isMember(conversationId) {
      if (typeof conversationId !== 'string' || !/^[a-f\d]{24}$/i.test(conversationId)) return null;
      if (socket.data.conversations.has(conversationId)) return socket.data.conversations.get(conversationId);
      const conv = await Conversation.findOne({ _id: conversationId, participants: userId }).select('participants').lean();
      if (conv) socket.data.conversations.set(conversationId, conv);
      return conv;
    }

    socket.on('typing', async (payload) => {
      try {
        const conv = await isMember(payload?.conversationId);
        if (!conv) return; // not a participant: ignore silently
        for (const p of conv.participants) {
          if (String(p) !== userId) {
            emitToUser(p, 'typing', { conversationId: payload.conversationId, userId, isTyping: Boolean(payload.isTyping) });
          }
        }
      } catch {
        /* ignore malformed typing events */
      }
    });

    socket.on('disconnect', () => {
      const left = (online.get(userId) || 1) - 1;
      if (left <= 0) {
        online.delete(userId);
        io.emit('presence:update', { userId, online: false });
      } else {
        online.set(userId, left);
      }
    });
  });

  return io;
}
