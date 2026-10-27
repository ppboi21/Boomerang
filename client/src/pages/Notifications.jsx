import { BellOff, CheckCheck, CircleCheck, Handshake, MessageCircle, Radar } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback';
import { useSocket } from '../context/SocketContext';
import { useTitle } from '../hooks/useTitle';
import { api } from '../services/api';
import { timeAgo } from '../utils/format';

const ICONS = {
  message: { icon: MessageCircle, className: 'bg-zap/15 text-zap-fg' },
  contact: { icon: Handshake, className: 'bg-grape/15 text-grape-fg' },
  match: { icon: Radar, className: 'bg-sun/15 text-sun-fg' },
  status: { icon: CircleCheck, className: 'bg-cobalt/15 text-cobalt-fg' },
};

export default function Notifications() {
  useTitle('Notifications');
  const navigate = useNavigate();
  const { socket, refreshCounts } = useSocket();
  const [list, setList] = useState(null);
  const [error, setError] = useState('');

  const load = () => api('/notifications').then((d) => { setList(d.notifications); setError(''); }).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!socket) return undefined;
    socket.on('notification:new', load);
    return () => socket.off('notification:new', load);
  }, [socket]);

  async function open(n) {
    if (!n.read) {
      api(`/notifications/${n.id}/read`, { method: 'PATCH' }).then(refreshCounts).catch(() => {});
      setList((l) => l.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    if (n.link) navigate(n.link);
  }

  async function readAll() {
    try {
      await api('/notifications/read-all', { method: 'POST' });
      setList((l) => l.map((x) => ({ ...x, read: true })));
      refreshCounts();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const unread = list?.filter((n) => !n.read).length || 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl font-extrabold text-ink-50">Notifications</h1>
          <p className="mt-1 text-ink-400">{unread ? `${unread} unread` : "You're all caught up."}</p>
        </div>
        {unread > 0 && <Button variant="secondary" size="sm" onClick={readAll}><CheckCheck className="size-4" /> Mark all read</Button>}
      </header>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !list ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : list.length === 0 ? (
        <EmptyState icon={BellOff} title="No notifications yet">Messages, replies to your reports and potential matches will appear here.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {list.map((n, i) => {
            const meta = ICONS[n.type] || ICONS.status;
            const Icon = meta.icon;
            return (
              <motion.li key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}>
                <button
                  type="button"
                  onClick={() => open(n)}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                    n.read ? 'border-ink-800 bg-ink-900/50 hover:bg-ink-900' : 'border-ink-700 bg-ink-850 hover:border-ink-600'
                  }`}
                >
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${meta.className}`}><Icon className="size-5" aria-hidden /></span>
                  <span className="min-w-0 flex-1">
                    <span className={`block ${n.read ? 'text-ink-300' : 'font-semibold text-ink-50'}`}>{n.title}</span>
                    {n.body && <span className="mt-0.5 block truncate text-sm text-ink-400">{n.body}</span>}
                    <span className="mt-1 block text-xs text-ink-500">{timeAgo(n.updatedAt)}</span>
                  </span>
                  {!n.read && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-zap" aria-label="Unread" />}
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
