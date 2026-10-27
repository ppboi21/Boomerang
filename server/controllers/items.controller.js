import { z } from 'zod';
import { env } from '../config/env.js';
import { Conversation } from '../models/Conversation.js';
import { CATEGORIES, ITEM_TYPES, Item, STATUSES } from '../models/Item.js';
import { User } from '../models/User.js';
import { findMatches } from '../services/matching.js';
import { notify } from '../services/notifications.js';
import { publicIdFromUrl, removeImagesIfUnused } from '../services/storage.js';
import { ApiError } from '../utils/ApiError.js';
import { PUBLIC_USER_FIELDS, serializeItem } from '../utils/serializers.js';
import { cleanQuery, escapeRegex, idParams, objectId } from '../utils/validation.js';

const DAY = 24 * 60 * 60 * 1000;

const listQuery = z.object({
  type: z.enum(ITEM_TYPES).optional(),
  q: z.string().trim().max(100).optional(),
  category: z.enum(CATEGORIES).optional(),
  location: z.string().trim().max(100).optional(),
  status: z.enum([...STATUSES, 'active', 'all']).default('active'),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  owner: objectId.optional(),
  sort: z.enum(['newest', 'oldest', 'date']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

const itemFields = {
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(80, 'Title is too long'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(1000, 'Description is too long'),
  category: z.enum(CATEGORIES, { message: 'Choose a category' }),
  location: z.string().trim().min(2, 'Add a location').max(100, 'Location is too long'),
  date: z.coerce
    .date({ message: 'Enter a valid date' })
    .refine((d) => d.getTime() <= Date.now() + DAY, 'Date cannot be in the future')
    .refine((d) => d.getTime() >= Date.now() - 365 * DAY, 'Date must be within the last year'),
  images: z.array(z.string().max(500)).max(3, 'At most 3 photos'),
  identifyingDetails: z.string().trim().max(500, 'Identifying details are too long'),
  reward: z.string().trim().max(100, 'Reward text is too long'),
};

const createSchema = z.object({
  type: z.enum(ITEM_TYPES, { message: 'Type must be lost or found' }),
  ...itemFields,
  images: itemFields.images.default([]),
  identifyingDetails: itemFields.identifyingDetails.default(''),
  reward: itemFields.reward.default(''),
});
const updateSchema = z.object(itemFields).partial();

function toImages(urls) {
  return urls.map((url) => {
    const publicId = publicIdFromUrl(url);
    if (!publicId) throw new ApiError(400, 'Photos must be uploaded through the app.');
    return { url, publicId };
  });
}

async function loadOwnedItem(req) {
  const { id } = idParams.parse(req.params);
  const item = await Item.findById(id);
  if (!item) throw new ApiError(404, 'Report not found');
  if (!item.owner.equals(req.user._id)) throw new ApiError(403, 'You can only change your own reports');
  return item;
}

const serializeMatches = (matches, viewerId) =>
  matches.map((m) => ({ item: serializeItem(m.item, viewerId), score: m.score, reasons: m.reasons }));

export async function listItems(req, res) {
  const q = listQuery.parse(cleanQuery(req.query));
  const filter = {};
  if (q.type) filter.type = q.type;
  if (q.category) filter.category = q.category;
  if (q.owner) filter.owner = q.owner;
  if (q.status === 'active') filter.status = { $in: ['open', 'contacted'] };
  else if (q.status !== 'all') filter.status = q.status;
  if (q.q) {
    // Every word must appear somewhere in title, description or location.
    const terms = q.q.split(/\s+/).filter(Boolean).slice(0, 5);
    filter.$and = terms.map((t) => {
      const rx = new RegExp(escapeRegex(t), 'i');
      return { $or: [{ title: rx }, { description: rx }, { location: rx }] };
    });
  }
  if (q.location) filter.location = new RegExp(escapeRegex(q.location), 'i');
  if (q.from || q.to) {
    filter.date = {};
    if (q.from) filter.date.$gte = q.from;
    if (q.to) filter.date.$lte = new Date(q.to.getTime() + DAY - 1);
  }

  const sort =
    q.status === 'resolved'
      ? { resolvedAt: -1 }
      : { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, date: { date: -1, createdAt: -1 } }[q.sort];

  const [items, total] = await Promise.all([
    Item.find(filter)
      .sort(sort)
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .populate('owner', PUBLIC_USER_FIELDS),
    Item.countDocuments(filter),
  ]);
  res.json({
    items: items.map((i) => serializeItem(i, req.user._id)),
    total,
    page: q.page,
    pages: Math.max(1, Math.ceil(total / q.limit)),
  });
}

export async function myItems(req, res) {
  const items = await Item.find({ owner: req.user._id }).sort({ createdAt: -1 }).populate('owner', PUBLIC_USER_FIELDS);
  res.json({ items: items.map((i) => serializeItem(i, req.user._id)) });
}

// Real numbers for the dashboard - nothing hardcoded.
export async function stats(req, res) {
  const weekAgo = new Date(Date.now() - 7 * DAY);
  const active = { $in: ['open', 'contacted'] };
  const [lostActive, foundActive, resolved, resolvedThisWeek, members, mine] = await Promise.all([
    Item.countDocuments({ type: 'lost', status: active }),
    Item.countDocuments({ type: 'found', status: active }),
    Item.countDocuments({ status: 'resolved' }),
    Item.countDocuments({ status: 'resolved', resolvedAt: { $gte: weekAgo } }),
    User.countDocuments(env.requireEmailVerification ? { isVerified: true } : {}),
    Item.countDocuments({ owner: req.user._id, status: active }),
  ]);
  res.json({ lostActive, foundActive, resolved, resolvedThisWeek, members, myActive: mine });
}

export async function getItem(req, res) {
  const { id } = idParams.parse(req.params);
  const item = await Item.findById(id).populate('owner', PUBLIC_USER_FIELDS);
  if (!item) throw new ApiError(404, 'Report not found');
  const result = serializeItem(item, req.user._id);
  if (!result.isOwner) {
    // So the button can say "Open chat" instead of creating a new conversation.
    const conv = await Conversation.findOne({
      item: item._id,
      participantsKey: Conversation.keyFor(req.user._id, item.owner._id),
    }).select('_id');
    result.conversationId = conv ? String(conv._id) : null;
  } else {
    result.conversationCount = await Conversation.countDocuments({ item: item._id });
  }
  res.json({ item: result });
}

export async function createItem(req, res) {
  const data = createSchema.parse(req.body);
  if (data.type === 'found' && data.images.length === 0) {
    throw new ApiError(400, 'Add at least one photo of the item you found (cover any personal details first).');
  }
  const item = await Item.create({
    ...data,
    reward: data.type === 'lost' ? data.reward : '',
    images: toImages(data.images),
    owner: req.user._id,
  });
  await item.populate('owner', PUBLIC_USER_FIELDS);

  const matches = await findMatches(item).catch((err) => {
    console.warn('Matching failed:', err.message);
    return [];
  });
  // Tell the people behind each potential match. Fire-and-forget: a failed
  // notification must not fail the report itself.
  for (const m of matches) {
    notify(m.item.owner._id, {
      type: 'match',
      title: `Potential match for "${m.item.title}"`,
      body: `Someone reported a ${item.type} ${item.title} that might be related. Take a look - it may not be yours.`,
      link: `/items/${item._id}`,
    }).catch(() => {});
  }

  res.status(201).json({ item: serializeItem(item, req.user._id), matches: serializeMatches(matches, req.user._id) });
}

export async function updateItem(req, res) {
  const item = await loadOwnedItem(req);
  const data = updateSchema.parse(req.body);
  let removed = [];
  if (data.images) {
    if (item.type === 'found' && data.images.length === 0) throw new ApiError(400, 'Found reports need at least one photo.');
    const next = toImages(data.images);
    removed = item.images.map((i) => i.url).filter((url) => !data.images.includes(url));
    item.images = next;
    delete data.images;
  }
  if (item.type === 'found') delete data.reward;
  Object.assign(item, data);
  await item.save();
  if (removed.length) removeImagesIfUnused(removed, item._id).catch(() => {});
  await item.populate('owner', PUBLIC_USER_FIELDS);
  res.json({ item: serializeItem(item, req.user._id) });
}

export async function updateStatus(req, res) {
  const item = await loadOwnedItem(req);
  const { status } = z.object({ status: z.enum(STATUSES) }).parse(req.body);
  if (item.status !== status) {
    item.status = status;
    item.resolvedAt = status === 'resolved' ? new Date() : undefined;
    await item.save();

    if (status === 'resolved') {
      // Let everyone who chatted about it know the case is closed.
      const convs = await Conversation.find({ item: item._id }).select('participants');
      for (const c of convs) {
        const other = c.participants.find((p) => !p.equals(req.user._id));
        if (other) {
          notify(other, {
            type: 'status',
            title: `"${item.title}" was marked resolved`,
            body: `${req.user.name} closed this ${item.type} report.`,
            link: `/items/${item._id}`,
          }).catch(() => {});
        }
      }
    }
  }
  await item.populate('owner', PUBLIC_USER_FIELDS);
  res.json({ item: serializeItem(item, req.user._id) });
}

export async function deleteItem(req, res) {
  const item = await loadOwnedItem(req);
  const urls = item.images.map((i) => i.url);
  await item.deleteOne();
  removeImagesIfUnused(urls).catch(() => {});
  res.status(204).end();
}

export async function getMatches(req, res) {
  const { id } = idParams.parse(req.params);
  const item = await Item.findById(id);
  if (!item) throw new ApiError(404, 'Report not found');
  if (item.status === 'resolved') return res.json({ matches: [] });
  const matches = await findMatches(item);
  res.json({ matches: serializeMatches(matches, req.user._id) });
}
