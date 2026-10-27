// Temporary sample data for demos.
//   npm run seed         -> (re)create demo users, items, chats, notifications
//   npm run seed:clear   -> delete ONLY the demo data (real accounts untouched)
// Every demo user has isDemo: true; everything else is found through them.
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { Conversation } from '../models/Conversation.js';
import { Item } from '../models/Item.js';
import { Message } from '../models/Message.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';

export const DEMO_PASSWORD = 'demo1234';
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n, hour = 11) => {
  const d = new Date(Date.now() - n * DAY);
  d.setUTCHours(0, 0, 0, 0);
  return { date: d, at: new Date(d.getTime() + hour * 3600 * 1000) };
};

// Spread demo users across the allowed domains (if more than one is configured).
const domain = (i) => env.collegeDomains[i % env.collegeDomains.length];

const USERS = [
  { key: 'aarav', name: 'Aarav Mehta', bio: '2nd year · always in the library', accountType: 'student' },
  { key: 'diya', name: 'Diya Kapoor', bio: 'Hostel Block B · night owl', accountType: 'student' },
  { key: 'kabir', name: 'Kabir Singh', bio: 'Football + DSA', accountType: 'student' },
  { key: 'meera', name: 'Meera Iyer', bio: 'Library front desk', accountType: 'employee' },
  { key: 'rohan', name: 'Rohan Das', bio: '1st year · lost in the campus maps', accountType: 'student' },
  { key: 'sana', name: 'Sana Qureshi', bio: 'Admin office, ground floor', accountType: 'employee' },
];

// [owner, type, title, category, location, daysAgo, image, description, extra]
const ITEMS = [
  ['aarav', 'lost', 'Blue steel water bottle', 'bottles', 'Library 2nd floor', 2, 'bottle', 'Blue Milton steel bottle with a yellow smiley sticker and a star on the bottom. Left it by the window seats.', { identifyingDetails: 'Name "A.M." scratched under the cap', reward: 'Cold coffee on me' }],
  ['meera', 'found', 'Steel bottle with stickers', 'bottles', 'Library reading room', 1, 'bottle', 'Found a blue steel bottle with stickers on a reading-room table. Kept at the library front desk.', { identifyingDetails: 'Something is scratched under the cap' }],
  ['diya', 'lost', 'Hostel room keys (B-204)', 'keys', 'Cafeteria', 3, 'keys', 'Two keys on a ring with a red B-204 tag. Probably dropped near the cafeteria counter at lunch.', { reward: 'Eternal gratitude + samosas' }],
  ['kabir', 'found', 'Bunch of keys with red tag', 'keys', 'Cafeteria entrance', 3, 'keys', 'Picked up a key ring with a red tag near the cafeteria door around 2 pm.', { identifyingDetails: 'Tag number on the red tag' }],
  ['rohan', 'lost', 'White wireless earbuds case', 'electronics', 'Lecture Hall 101', 5, 'earbuds', 'White earbuds case with one bud inside, black strip on the lid. Lost after the morning lecture.', { identifyingDetails: 'Case is paired with a phone named "rohan-pixel"' }],
  ['sana', 'found', 'Student ID card', 'id-wallets', 'Main gate security desk', 1, 'idcard', 'An SST student ID card was handed in at the main gate. Number and photo hidden here. Describe it to claim.', { identifyingDetails: 'Name and ID number on the card' }],
  ['kabir', 'lost', 'Purple backpack', 'bags', 'Sports ground', 6, 'backpack', 'Purple backpack with a lime keychain, left on the bench after football practice. Has a charger and a notebook inside.', {}],
  ['meera', 'found', 'Scientific calculator', 'books', 'Lab 3', 4, 'calculator', 'Casio scientific calculator left in Lab 3 after the evening session.', { identifyingDetails: 'Initials on the back cover' }],
  ['aarav', 'found', 'Black SST hoodie', 'clothing', 'Auditorium', 2, 'hoodie', 'Black hoodie with SST print, size M, left on a seat in the auditorium after the tech talk.', {}],
  ['diya', 'found', 'Red umbrella', 'other', 'Lecture Hall 204', 8, 'umbrella', 'Red umbrella with a black handle, left near the door of LH 204.', {}],
  ['rohan', 'lost', 'Green DSA notebook', 'books', 'Library 1st floor', 4, 'notebook', 'Green spiral notebook titled "DSA notes", full of graph problems. Exams are next week, please help!', { reward: 'Happy to share my notes too' }],
  ['sana', 'found', 'Laptop charger (65W)', 'electronics', 'Admin office', 7, 'charger', 'White 65W USB-C laptop charger left in the admin office waiting area.', { identifyingDetails: 'Brand and a small sticker on the brick' }],
  ['kabir', 'lost', 'Brown leather wallet', 'id-wallets', 'Parking area', 10, 'wallet', 'Brown wallet with metro card and some cash. Probably near the bike parking.', { identifyingDetails: 'Metro card + photo inside' }],
  ['diya', 'lost', 'Black-frame spectacles', 'other', 'Cafeteria', 12, 'specs', 'Black rectangular specs in no case. Really need them back!', {}],
];

async function clearDemo() {
  const users = await User.find({ isDemo: true }).select('_id');
  const ids = users.map((u) => u._id);
  if (!ids.length) return { users: 0 };
  const items = await Item.find({ owner: { $in: ids } }).select('_id');
  const itemIds = items.map((i) => i._id);
  const convs = await Conversation.find({ $or: [{ participants: { $in: ids } }, { item: { $in: itemIds } }] }).select('_id');
  const convIds = convs.map((c) => c._id);
  const links = [...itemIds.map((id) => `/items/${id}`), ...convIds.map((id) => `/messages/${id}`)];

  const [m, c, n, it, u] = await Promise.all([
    Message.deleteMany({ conversation: { $in: convIds } }),
    Conversation.deleteMany({ _id: { $in: convIds } }),
    Notification.deleteMany({ $or: [{ recipient: { $in: ids } }, { link: { $in: links } }] }),
    Item.deleteMany({ _id: { $in: itemIds } }),
    User.deleteMany({ _id: { $in: ids } }),
  ]);
  return { users: u.deletedCount, items: it.deletedCount, conversations: c.deletedCount, messages: m.deletedCount, notifications: n.deletedCount };
}

async function seed() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = {};
  for (const [i, u] of USERS.entries()) {
    users[u.key] = await User.create({
      name: u.name,
      email: `demo.${u.key}@${domain(i)}`,
      passwordHash,
      accountType: u.accountType,
      bio: u.bio,
      isVerified: false,
      isDemo: true,
    });
  }

  const items = [];
  for (const [owner, type, title, category, location, ago, image, description, extra] of ITEMS) {
    const { date, at } = daysAgo(ago);
    items.push(
      await Item.create({
        owner: users[owner]._id,
        type,
        title,
        category,
        location,
        date,
        description,
        images: [{ url: `/demo/${image}.svg`, publicId: `demo:${image}.svg` }],
        identifyingDetails: extra.identifyingDetails || '',
        reward: type === 'lost' ? extra.reward || '' : '',
        createdAt: at,
        updatedAt: at,
      }),
    );
  }
  const byTitle = (t) => items.find((i) => i.title === t);

  // A couple of real-looking conversations and outcomes.
  async function chat(itemTitle, starterKey, lines, status) {
    const item = byTitle(itemTitle);
    const starter = users[starterKey];
    const owner = Object.values(users).find((u) => u._id.equals(item.owner));
    const conv = await Conversation.create({
      participants: [starter._id, owner._id],
      participantsKey: Conversation.keyFor(starter._id, owner._id),
      item: item._id,
    });
    let t = item.createdAt.getTime() + 2 * 3600 * 1000;
    let last;
    for (const [who, text] of lines) {
      t += 7 * 60 * 1000;
      last = await Message.create({ conversation: conv._id, sender: who === 'starter' ? starter._id : owner._id, text, createdAt: new Date(t) });
    }
    conv.lastMessage = { text: last.text, sender: last.sender, createdAt: last.createdAt };
    conv.lastReadAt.set(String(starter._id), last.createdAt);
    conv.lastReadAt.set(String(owner._id), last.createdAt);
    await conv.save();
    item.status = status;
    if (status === 'resolved') item.resolvedAt = new Date(t + 3600 * 1000);
    await item.save();
  }

  await chat('Hostel room keys (B-204)', 'kabir', [
    ['starter', 'Hey! I think I picked up your keys near the cafeteria door.'],
    ['owner', 'OMG yes!! Is there a red tag on them?'],
    ['starter', 'Yep. What does the tag say?'],
    ['owner', 'B-204, my hostel room.'],
    ['starter', "That's it. I'm at the library desk till 5, come grab them."],
    ['owner', 'Got them, thank you so much 🙏'],
  ], 'resolved');
  await chat('Steel bottle with stickers', 'aarav', [
    ['starter', 'Hi! I lost a blue steel bottle in the library. Could this be mine?'],
    ['owner', 'Possibly! Can you tell me what is scratched under the cap?'],
    ['starter', 'My initials, A.M.'],
    ['owner', "That matches. It's at the front desk; bring your ID card when you come."],
  ], 'contacted');
  await chat('Scientific calculator', 'rohan', [
    ['starter', 'Is this a Casio fx-991? I left mine in Lab 3.'],
    ['owner', 'It is. What initials are on the back?'],
  ], 'contacted');

  await Notification.create([
    { recipient: users.aarav._id, type: 'match', title: 'Potential match for "Blue steel water bottle"', body: 'Someone reported a found Steel bottle with stickers that might be related.', link: `/items/${byTitle('Steel bottle with stickers')._id}` },
    { recipient: users.meera._id, type: 'contact', title: 'Aarav Mehta wants to talk about "Steel bottle with stickers"', body: 'They think this might be theirs.', link: '/messages' },
  ]);

  return { users: USERS.length, items: items.length, conversations: 3 };
}

const clearOnly = process.argv.includes('--clear');
await connectDB(env.mongoUri);
try {
  const removed = await clearDemo();
  console.log(removed.users ? `🧹 Removed existing demo data: ${JSON.stringify(removed)}` : '🧹 No existing demo data');
  if (!clearOnly) {
    if (!env.collegeDomains.length) throw new Error('COLLEGE_EMAIL_DOMAINS is empty');
    const made = await seed();
    console.log(`🌱 Seeded ${made.users} users, ${made.items} items, ${made.conversations} conversations.`);
    console.log(`   Log in as any demo user, e.g. demo.aarav@${domain(0)} / password: ${DEMO_PASSWORD}`);
    console.log('   Remove it all later with: npm run seed:clear');
  }
} catch (err) {
  console.error('Seeding failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
