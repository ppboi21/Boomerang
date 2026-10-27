import { MessageCircle, MessagesSquare } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { ChatWindow } from '../components/chat/ChatWindow';
import { ConversationList } from '../components/chat/ConversationList';
import { ButtonLink } from '../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTitle } from '../hooks/useTitle';
import { api } from '../services/api';

export default function Messages() {
  useTitle('Messages');
  const { id } = useParams();
  const { user } = useAuth();
  const { socket, refreshCounts } = useSocket();
  const [conversations, setConversations] = useState(null);
  const [error, setError] = useState('');
  const [extra, setExtra] = useState(null); // conversation opened by URL but not in the list yet

  const load = useCallback(async () => {
    try {
      const d = await api('/conversations');
      setConversations(d.conversations);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Refresh list order / unread badges on any new message or read receipt.
  useEffect(() => {
    if (!socket) return undefined;
    const onAny = () => load();
    socket.on('message:new', onAny);
    socket.on('conversation:read', onAny);
    return () => {
      socket.off('message:new', onAny);
      socket.off('conversation:read', onAny);
    };
  }, [socket, load]);

  const active = conversations?.find((c) => c.id === id) || (extra?.id === id ? extra : null);

  useEffect(() => {
    if (!id || !conversations || conversations.some((c) => c.id === id)) return;
    api(`/conversations/${id}`).then((d) => setExtra(d.conversation)).catch((err) => setError(err.message));
  }, [id, conversations]);

  const onActivity = useCallback(() => { load(); refreshCounts(); }, [load, refreshCounts]);

  return (
    <div className="lg:grid lg:h-[calc(100dvh-8.5rem)] lg:grid-cols-[22rem_1fr] lg:gap-4">
      {/* List: hidden on mobile while a chat is open */}
      <aside className={`${id ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col lg:rounded-3xl lg:border lg:border-ink-800 lg:bg-ink-900/80 lg:p-3`}>
        <h1 className="mb-4 px-1 text-4xl font-extrabold text-ink-50 lg:mt-1 lg:text-2xl">Messages</h1>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {error && !conversations ? (
            <ErrorState message={error} onRetry={load} />
          ) : !conversations ? (
            <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : conversations.length === 0 ? (
            <EmptyState icon={MessagesSquare} title="No conversations yet" action={<ButtonLink to="/found" variant="secondary" size="sm">Browse found items</ButtonLink>}>
              Open any lost or found report and tap "contact" to start a private chat.
            </EmptyState>
          ) : (
            <ConversationList conversations={conversations} meId={user.id} />
          )}
        </div>
      </aside>

      <section className={`${id ? 'flex' : 'hidden lg:flex'} panel fixed inset-0 z-40 min-h-0 flex-col overflow-hidden max-lg:rounded-none max-lg:border-0 lg:static lg:z-auto`}>
        {id && active ? (
          <ChatWindow key={active.id} conversation={active} onActivity={onActivity} />
        ) : id && error ? (
          <div className="p-6"><ErrorState message={error} /></div>
        ) : id ? (
          <div className="p-6"><Skeleton className="h-full min-h-60" /></div>
        ) : (
          <div className="grid flex-1 place-items-center p-6 text-center">
            <div>
              <MessageCircle className="mx-auto size-12 text-ink-600" aria-hidden />
              <p className="mt-3 text-ink-400">Pick a conversation to start chatting.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
