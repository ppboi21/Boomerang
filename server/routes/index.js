import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import * as conversations from '../controllers/conversations.controller.js';
import { googleSignIn } from '../controllers/google.controller.js';
import * as items from '../controllers/items.controller.js';
import * as notifications from '../controllers/notifications.controller.js';
import { uploadImage } from '../controllers/uploads.controller.js';
import * as users from '../controllers/users.controller.js';
import { requireAuth, requireVerified } from '../middleware/auth.js';
import { authLimiter, emailLimiter, messageLimiter, uploadLimiter, writeLimiter } from '../middleware/security.js';
import { imageUpload } from '../middleware/upload.js';

const verified = [requireAuth, requireVerified];

// ----- Auth & email verification -----
const authRouter = Router();
authRouter.get('/config', auth.getConfig);
authRouter.post('/register', authLimiter, auth.register);
authRouter.post('/login', authLimiter, auth.login);
authRouter.post('/google', authLimiter, googleSignIn);
authRouter.post('/verify-email', authLimiter, auth.verifyEmail);
authRouter.post('/resend-verification', emailLimiter, requireAuth, auth.resendVerification);
authRouter.post('/forgot-password', emailLimiter, auth.forgotPassword);
authRouter.post('/reset-password', authLimiter, auth.resetPassword);
authRouter.get('/me', requireAuth, auth.me);

// ----- Users / profiles -----
const usersRouter = Router();
usersRouter.use(verified);
usersRouter.patch('/me', writeLimiter, users.updateMe);
usersRouter.patch('/me/password', authLimiter, users.changePassword);
usersRouter.get('/:id', users.getUserProfile);

// ----- Lost & found reports -----
const itemsRouter = Router();
itemsRouter.use(verified);
itemsRouter.get('/', items.listItems);
itemsRouter.get('/stats', items.stats);
itemsRouter.get('/mine', items.myItems);
itemsRouter.post('/', writeLimiter, items.createItem);
itemsRouter.get('/:id', items.getItem);
itemsRouter.get('/:id/matches', items.getMatches);
itemsRouter.patch('/:id', writeLimiter, items.updateItem);
itemsRouter.patch('/:id/status', writeLimiter, items.updateStatus);
itemsRouter.delete('/:id', writeLimiter, items.deleteItem);

// ----- Chat -----
const convRouter = Router();
convRouter.use(verified);
convRouter.get('/', conversations.listConversations);
convRouter.post('/', writeLimiter, conversations.startConversation);
convRouter.get('/:id', conversations.getConversation);
convRouter.get('/:id/messages', conversations.listMessages);
convRouter.post('/:id/messages', messageLimiter, conversations.sendMessage);
convRouter.post('/:id/read', conversations.markRead);

// ----- Notifications -----
const notifRouter = Router();
notifRouter.use(verified);
notifRouter.get('/', notifications.listNotifications);
notifRouter.get('/counts', notifications.counts);
notifRouter.post('/read-all', notifications.markAllRead);
notifRouter.patch('/:id/read', notifications.markNotificationRead);

// ----- Image uploads -----
const uploadRouter = Router();
uploadRouter.post('/', verified, uploadLimiter, imageUpload, uploadImage);

export const apiRouter = Router();
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/items', itemsRouter);
apiRouter.use('/conversations', convRouter);
apiRouter.use('/notifications', notifRouter);
apiRouter.use('/uploads', uploadRouter);
