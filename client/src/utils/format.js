const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function timeAgo(date) {
  const diff = (new Date(date).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 45) return 'just now';
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), 'day');
  return formatDate(date);
}

// Item dates are calendar days stored as UTC midnight - format in UTC so they
// never shift by a day.
export const formatItemDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatTime = (date) => new Date(date).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

export function dayLabel(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';

// Short "claim ticket" code shown on item cards, derived from the id.
export const ticketCode = (id = '') => `No.${id.slice(-5).toUpperCase()}`;

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const toDateInput = (date) => (date ? new Date(date).toISOString().slice(0, 10) : '');

export const firstName = (name = '') => name.split(/\s+/)[0] || name;
