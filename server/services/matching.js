import { Item } from '../models/Item.js';
import { PUBLIC_USER_FIELDS } from '../utils/serializers.js';

// Simple, explainable matching: same category, opposite type, close dates,
// shared keywords and location words. Results are only *potential* matches -
// nothing is ever marked as claimed automatically.

const STOP_WORDS = new Set(
  'the and with for near from this that was were have has had its are not but you your our out off into onto over under about around lost found item left some one two very also just like there their them they what when where which while black white blue red green grey gray small big large'.split(
    ' ',
  ),
);

const DAY = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 45;

function words(text) {
  return new Set((text.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 2 && !STOP_WORDS.has(w)));
}

export async function findMatches(item, limit = 5) {
  const date = new Date(item.date).getTime();
  const candidates = await Item.find({
    type: item.type === 'lost' ? 'found' : 'lost',
    category: item.category,
    status: { $ne: 'resolved' },
    owner: { $ne: item.owner?._id ?? item.owner },
    date: { $gte: new Date(date - WINDOW_DAYS * DAY), $lte: new Date(date + WINDOW_DAYS * DAY) },
  })
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('owner', PUBLIC_USER_FIELDS);

  const itemWords = words(`${item.title} ${item.description}`);
  const itemPlace = words(item.location);

  const scored = candidates.map((c) => {
    const shared = [...words(`${c.title} ${c.description}`)].filter((w) => itemWords.has(w));
    const sharedPlace = [...words(c.location)].filter((w) => itemPlace.has(w));
    const days = Math.abs(new Date(c.date).getTime() - date) / DAY;

    const reasons = ['Same category'];
    if (shared.length) reasons.push(`Shared words: ${shared.slice(0, 4).join(', ')}`);
    if (sharedPlace.length) reasons.push(`Similar location: ${c.location}`);
    if (days <= 3) reasons.push('Reported around the same time');

    const score = Math.min(shared.length * 15, 45) + (sharedPlace.length ? 25 : 0) + Math.max(0, 30 - days * 2);
    return { item: c, score: Math.round(Math.min(score, 100)), reasons, strong: shared.length > 0 || sharedPlace.length > 0 };
  });

  return scored
    .filter((m) => m.strong && m.score >= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
