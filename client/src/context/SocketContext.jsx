import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { SOCKET_URL, api, tokenStore } from '../services/api';
import { useAuth } from './AuthContext';
import { usePrefs } from './PrefsContext';

// One Socket.IO connection per signed-in user. Also owns the sidebar badge
// counts and who's online.
const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const { play } = usePrefs();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [online, setOnline] = useState(() => new Set());
  const [counts, setCounts] = useState({ messages: 0, notifications: 0 });
  const activeConversation = useRef(null);
  const playRef = useRef(play);
  playRef.current = play;
  const navRef = useRef(navigate);
  navRef.current = navigate;

  const refreshCounts = useCallback(async () => {
    try { setCounts(await api('/notifications/counts')); } catch { /* offline */ }
  }, []);

  useEffect(() => {
    if (!user || user.needsVerification) return undefined;
    const s = io(SOCKET_URL, { auth: { token: tokenStore.get() } });
    setSocket(s);

    s.on('connect', refreshCounts);
    s.on('presence:list', (ids) => setOnline(new Set(ids)));
    s.on('presence:update', ({ userId, online: isOn }) =>
      setOnline((prev) => {
        const next = new Set(prev);
        if (isOn) next.add(userId); else next.delete(userId);
        return next;
      }),
    );
    s.on('message:new', ({ conversationId, message }) => {
      if (message.sender === user.id) return;
      if (activeConversation.current === conversationId) return; // chat already open
      playRef.current('message');
      const preview = message.text || '📷 Photo';
      toast('New message', {
        description: preview.length > 80 ? `${preview.slice(0, 80)}…` : preview,
        action: { label: 'Open', onClick: () => navRef.current(`/messages/${conversationId}`) },
      });
    });
    s.on('notification:new', (n) => {
      refreshCounts();
      if (n.type === 'match') {
        playRef.current('match');
        toast(n.title, { description: 'Potential match - check it out.', action: { label: 'View', onClick: () => navRef.current(n.link) } });
      } else if (n.type === 'contact' || n.type === 'status') {
        toast(n.title, { action: n.link ? { label: 'View', onClick: () => navRef.current(n.link) } : undefined });
      }
    });
    s.on('conversation:read', refreshCounts);

    return () => {
      s.disconnect();
      setSocket(null);
      setOnline(new Set());
    };
  }, [user?.id, user?.needsVerification, refreshCounts]);

  const isOnline = useCallback((id) => online.has(id), [online]);

  const value = useMemo(
    () => ({ socket, counts, refreshCounts, isOnline, activeConversation }),
    [socket, counts, refreshCounts, isOnline],
  );
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
