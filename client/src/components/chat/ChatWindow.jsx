import { ArrowLeft, ImagePlus, LoaderCircle, Send, ShieldCheck, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { usePrefs } from '../../context/PrefsContext';
import { useSocket } from '../../context/SocketContext';
import { api, uploadImage } from '../../services/api';
import { TYPE } from '../../utils/constants';
import { dayLabel, formatTime } from '../../utils/format';
import { imgUrl, prepareImage } from '../../utils/image';
import { Avatar } from '../ui/Avatar';
import { StatusBadge } from '../ui/Badges';
import { Spinner } from '../ui/Feedback';

export function ChatWindow({ conversation, onActivity }) {
  const { user } = useAuth();
  const { socket, isOnline, activeConversation } = useSocket();
  const { play } = usePrefs();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [text, setText] = useState('');
  // Photo being attached: { preview, url?, progress, error? }. Uploads as soon as it's picked.
  const [attachment, setAttachment] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const fileInput = useRef(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const scroller = useRef(null);
  const stickToBottom = useRef(true);
  const lastTypingSent = useRef(0);
  const id = conversation.id;
  const other = conversation.other;

  const markRead = useCallback(() => api(`/conversations/${id}/read`, { method: 'POST' }).catch(() => {}), [id]);

  // Load history
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMessages([]);
    stickToBottom.current = true;
    api(`/conversations/${id}/messages`)
      .then((d) => {
        if (cancelled) return;
        setMessages(d.messages);
        setHasMore(d.hasMore);
        markRead();
      })
      .catch((err) => !cancelled && toast.error(err.message))
      .finally(() => !cancelled && setLoading(false));
    activeConversation.current = id;
    return () => {
      cancelled = true;
      activeConversation.current = null;
    };
  }, [id, markRead, activeConversation]);

  // Messages that arrived while the tab was in the background count as read on return.
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && markRead();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [markRead]);

  // Live updates
  useEffect(() => {
    if (!socket) return undefined;
    let typingTimer;
    const onMessage = ({ conversationId, message }) => {
      if (conversationId !== id) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        const i = message.clientId ? prev.findIndex((m) => m.clientId === message.clientId) : -1;
        if (i >= 0) return prev.map((m, j) => (j === i ? { ...message, pending: false } : m));
        return [...prev, message];
      });
      if (message.sender !== user.id) {
        setOtherTyping(false);
        if (document.visibilityState === 'visible') markRead();
      }
      onActivity?.();
    };
    const onTyping = (e) => {
      if (e.conversationId !== id) return;
      setOtherTyping(e.isTyping);
      clearTimeout(typingTimer);
      if (e.isTyping) typingTimer = setTimeout(() => setOtherTyping(false), 4000);
    };
    socket.on('message:new', onMessage);
    socket.on('typing', onTyping);
    return () => {
      socket.off('message:new', onMessage);
      socket.off('typing', onTyping);
      clearTimeout(typingTimer);
    };
  }, [socket, id, user.id, markRead, onActivity]);

  // Keep pinned to the newest message unless the user scrolled up.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, otherTyping]);

  const onScroll = () => {
    const el = scroller.current;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  async function loadOlder() {
    if (!messages.length) return;
    setLoadingOlder(true);
    const el = scroller.current;
    const prevHeight = el.scrollHeight;
    try {
      const d = await api(`/conversations/${id}/messages`, { query: { before: messages[0].createdAt } });
      stickToBottom.current = false;
      setMessages((prev) => [...d.messages, ...prev]);
      setHasMore(d.hasMore);
      requestAnimationFrame(() => { el.scrollTop = el.scrollHeight - prevHeight; });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingOlder(false);
    }
  }

  function emitTyping(isTyping) {
    if (!socket) return;
    const now = Date.now();
    if (isTyping && now - lastTypingSent.current < 2000) return;
    lastTypingSent.current = isTyping ? now : 0;
    socket.emit('typing', { conversationId: id, isTyping });
  }

  async function attach(e) {
    const raw = e.target.files?.[0];
    e.target.value = '';
    if (!raw) return;
    if (raw.type && !/^image\/(jpeg|png|webp|heic|heif)$/.test(raw.type)) {
      toast.error('Only JPG, PNG, WEBP or HEIC photos can be shared.');
      return;
    }
    const preview = URL.createObjectURL(raw);
    setAttachment({ preview, progress: 0 });
    try {
      const file = await prepareImage(raw);
      const { url } = await uploadImage(file, (progress) => setAttachment((a) => (a?.preview === preview ? { ...a, progress } : a)));
      setAttachment((a) => (a?.preview === preview ? { ...a, url, progress: 1 } : a));
    } catch (err) {
      setAttachment((a) => (a?.preview === preview ? { ...a, error: err.message } : a));
    }
  }

  function clearAttachment() {
    if (attachment?.preview) URL.revokeObjectURL(attachment.preview);
    setAttachment(null);
  }

  const uploading = Boolean(attachment && !attachment.url && !attachment.error);
  const canSend = !uploading && Boolean(text.trim() || attachment?.url);

  async function send(e) {
    e?.preventDefault();
    const body = text.trim();
    if (!canSend) return;
    const image = attachment?.url;
    const clientId = `c${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
    const optimistic = { id: clientId, clientId, sender: user.id, text: body, image: attachment?.preview || null, createdAt: new Date().toISOString(), pending: true };
    stickToBottom.current = true;
    setMessages((prev) => [...prev, optimistic]);
    setText('');
    setAttachment(null);
    emitTyping(false);
    try {
      const { message } = await api(`/conversations/${id}/messages`, { method: 'POST', body: { text: body, image, clientId } });
      play('click');
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev.filter((m) => m.clientId !== clientId || m.id === message.id);
        return prev.map((m) => (m.clientId === clientId ? { ...message, pending: false } : m));
      });
      onActivity?.();
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.clientId === clientId ? { ...m, pending: false, failed: true } : m)));
      toast.error(err.message);
    }
  }

  const item = conversation.item;

  return (
    <section className="flex h-full min-h-0 flex-col" aria-label={`Chat with ${other?.name || 'user'}`}>
      <header className="flex items-center gap-3 border-b border-ink-800 px-3 py-3 sm:px-5">
        <Link to="/messages" className="grid size-9 place-items-center rounded-xl text-ink-300 hover:bg-ink-800 lg:hidden" aria-label="Back to conversations">
          <ArrowLeft className="size-5" />
        </Link>
        {other ? (
          <Link to={`/users/${other.id}`} className="flex min-w-0 items-center gap-3">
            <Avatar user={other} size="sm" online={isOnline(other.id)} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink-50">{other.name}</p>
              <p className="text-xs text-ink-400">{otherTyping ? <span className="text-zap-fg">typing…</span> : isOnline(other.id) ? 'Online' : 'Offline'}</p>
            </div>
          </Link>
        ) : (
          <p className="text-ink-400">Deleted user</p>
        )}
        {item && (
          <Link to={`/items/${item.id}`} className="ml-auto flex max-w-[45%] items-center gap-2 rounded-xl border border-ink-800 bg-ink-900 shadow-card p-1.5 pr-3 hover:border-ink-600">
            {item.image ? (
              <img src={imgUrl(item.image, 120)} alt="" className="size-8 rounded-lg object-cover" />
            ) : (
              <span className={`grid size-8 place-items-center rounded-lg font-mono text-[10px] font-bold ${TYPE[item.type].className}`}>{TYPE[item.type].label}</span>
            )}
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-xs font-semibold text-ink-100">{item.title}</p>
              <StatusBadge status={item.status} className="mt-0.5 !px-1.5 !py-0 !text-[10px]" />
            </div>
          </Link>
        )}
      </header>

      <div ref={scroller} onScroll={onScroll} className="bg-dots min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5" aria-live="polite">
        {loading ? (
          <Spinner label="Loading messages" />
        ) : (
          <>
            {hasMore && (
              <div className="mb-4 text-center">
                <button type="button" onClick={loadOlder} disabled={loadingOlder} className="rounded-full border border-ink-700 bg-ink-900 px-3 py-1 text-xs text-ink-300 hover:text-ink-50">
                  {loadingOlder ? 'Loading…' : 'Load earlier messages'}
                </button>
              </div>
            )}
            {messages.length === 0 && (
              <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-ink-800 bg-ink-900/90 shadow-card p-4 text-sm text-ink-300">
                <p className="mb-2 flex items-center gap-2 font-semibold text-ink-50">
                  <ShieldCheck className="size-4 text-zap-fg" aria-hidden /> Claim it safely
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Ask the claimant to describe a detail that isn't in the photo.</li>
                  <li>Don't share ID numbers or passwords in chat.</li>
                  <li>Hand over in a public spot on campus - the library desk or main reception.</li>
                </ul>
              </div>
            )}
            {messages.map((m, i) => {
              const mine = m.sender === user.id;
              const prev = messages[i - 1];
              const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
              const grouped = prev && !newDay && prev.sender === m.sender && new Date(m.createdAt) - new Date(prev.createdAt) < 5 * 60_000;
              return (
                <Fragment key={m.clientId || m.id}>
                  {newDay && (
                    <div className="my-4 text-center">
                      <span className="rounded-full bg-ink-850 px-3 py-1 text-[11px] font-medium text-ink-400">{dayLabel(m.createdAt)}</span>
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'} ${grouped ? 'mt-1' : 'mt-3'}`}
                  >
                    {!mine && <span className="w-7">{!grouped && <Avatar user={other} size="xs" />}</span>}
                    <div
                      className={`max-w-[78%] rounded-2xl text-[15px] leading-snug break-words whitespace-pre-wrap ${m.image ? 'p-1.5' : 'px-3.5 py-2'} ${
                        mine ? 'rounded-br-md bg-zap text-night' : 'rounded-bl-md bg-ink-800 text-ink-50'
                      } ${m.pending ? 'opacity-60' : ''} ${m.failed ? 'ring-2 ring-coral' : ''}`}
                    >
                      {m.image && (
                        <button type="button" onClick={() => setLightbox(m.image)} className="block overflow-hidden rounded-xl" aria-label="Open photo">
                          <img
                            src={m.image.startsWith('blob:') ? m.image : imgUrl(m.image, 600)}
                            alt="Shared photo"
                            className="max-h-72 w-full max-w-64 object-cover"
                            onLoad={() => { if (stickToBottom.current && scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }}
                          />
                        </button>
                      )}
                      {m.text && <span className={`block ${m.image ? 'px-2 pt-1.5' : ''}`}>{m.text}</span>}
                      <span className={`mt-0.5 block text-right text-[10px] ${m.image ? 'px-2 pb-0.5' : ''} ${mine ? 'text-night/60' : 'text-ink-400'}`}>
                        {m.failed ? 'Not sent' : m.pending ? 'Sending…' : formatTime(m.createdAt)}
                      </span>
                    </div>
                  </motion.div>
                </Fragment>
              );
            })}
            <AnimatePresence>
              {otherTyping && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 flex items-end gap-2">
                  <span className="w-7"><Avatar user={other} size="xs" /></span>
                  <div className="flex gap-1 rounded-2xl rounded-bl-md bg-ink-800 px-4 py-3" aria-label={`${other?.name} is typing`}>
                    {[0, 1, 2].map((d) => (
                      <motion.span key={d} className="size-1.5 rounded-full bg-ink-300" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {attachment && (
        <div className="flex items-center gap-3 border-t border-ink-800 px-3 pt-3 sm:px-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-ink-800">
            <img src={attachment.preview} alt="Photo to send" className={`size-full object-cover ${attachment.url ? '' : 'opacity-50'}`} />
            {uploading && (
              <span className="absolute inset-0 grid place-items-center text-[11px] font-bold text-ink-50">{Math.round(attachment.progress * 100)}%</span>
            )}
          </div>
          <p className={`flex-1 text-sm ${attachment.error ? 'text-coral-fg' : 'text-ink-400'}`}>
            {attachment.error || (uploading ? 'Uploading photo…' : 'Photo ready. Add a caption or just send. Cover any personal details first.')}
          </p>
          <button type="button" onClick={clearAttachment} className="grid size-9 place-items-center rounded-lg text-ink-400 hover:bg-ink-800 hover:text-ink-50" aria-label="Remove photo">
            <X className="size-4" />
          </button>
        </div>
      )}

      <form onSubmit={send} className={`flex items-end gap-2 p-3 sm:p-4 ${attachment ? '' : 'border-t border-ink-800'}`}>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="hidden" onChange={attach} />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="grid size-12 shrink-0 place-items-center rounded-xl border border-ink-700 text-ink-300 transition-colors hover:border-zap hover:text-zap-fg disabled:opacity-40"
          aria-label="Share a photo"
          title="Share a photo"
        >
          <ImagePlus className="size-5" />
        </button>
        <label htmlFor="composer" className="sr-only">Message</label>
        <textarea
          id="composer"
          rows={1}
          value={text}
          maxLength={2000}
          placeholder={other ? `Message ${other.name.split(' ')[0]}…` : 'Message…'}
          onChange={(e) => {
            setText(e.target.value);
            emitTyping(e.target.value.length > 0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          onBlur={() => emitTyping(false)}
          className="input max-h-40 min-h-12 flex-1 resize-none py-3 [field-sizing:content]"
        />
        <motion.button
          type="submit"
          whileTap={{ scale: 0.9 }}
          disabled={!canSend}
          aria-label="Send message"
          className="grid size-12 shrink-0 place-items-center rounded-xl bg-zap text-night transition-opacity disabled:opacity-40"
        >
          {loading || uploading ? <LoaderCircle className="size-5 animate-spin" /> : <Send className="size-5" />}
        </motion.button>
      </form>

      {/* full-screen photo viewer */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4"
            onClick={() => setLightbox(null)}
            onKeyDown={(e) => e.key === 'Escape' && setLightbox(null)}
            role="dialog"
            aria-label="Photo"
            tabIndex={-1}
            ref={(el) => el?.focus()}
          >
            <img src={lightbox.startsWith('blob:') ? lightbox : imgUrl(lightbox, 1600)} alt="Shared photo" className="max-h-full max-w-full rounded-2xl object-contain" />
            <button type="button" className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close photo">
              <X className="size-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
