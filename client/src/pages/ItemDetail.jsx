import { ArrowLeft, Calendar, CircleCheck, Clock, Fingerprint, Gift, Lock, MapPin, MessageCircle, Pencil, Radar, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { ItemCard } from '../components/ItemCard';
import { Avatar } from '../components/ui/Avatar';
import { StatusBadge, TypeBadge, VerifiedBadge } from '../components/ui/Badges';
import { Button, ButtonLink } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ErrorState, Skeleton } from '../components/ui/Feedback';
import { usePrefs } from '../context/PrefsContext';
import { useSocket } from '../context/SocketContext';
import { useTitle } from '../hooks/useTitle';
import { api } from '../services/api';
import { categoryInfo } from '../utils/constants';
import { formatItemDate, ticketCode, timeAgo } from '../utils/format';
import { imgUrl } from '../utils/image';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { play } = usePrefs();
  const { isOnline } = useSocket();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState(null);
  const [photo, setPhoto] = useState(0);
  const [busy, setBusy] = useState('');
  const [confirm, setConfirm] = useState(null); // 'delete' | 'resolve'
  useTitle(item?.title);

  async function load() {
    setError('');
    try {
      const d = await api(`/items/${id}`);
      setItem(d.item);
      setPhoto(0);
      api(`/items/${id}/matches`).then((m) => setMatches(m.matches)).catch(() => setMatches([]));
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => { setItem(null); setMatches(null); load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function contact() {
    if (item.conversationId) return navigate(`/messages/${item.conversationId}`);
    setBusy('contact');
    try {
      const { conversation } = await api('/conversations', { method: 'POST', body: { itemId: item.id } });
      navigate(`/messages/${conversation.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  }

  async function setStatus(status) {
    setBusy('status');
    try {
      const d = await api(`/items/${item.id}/status`, { method: 'PATCH', body: { status } });
      setItem((prev) => ({ ...prev, ...d.item }));
      if (status === 'resolved') {
        play('match');
        toast.success('Marked as resolved. Nice work! 🎉');
      } else toast.success('Report reopened');
      setConfirm(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  }

  async function remove() {
    setBusy('delete');
    try {
      await api(`/items/${item.id}`, { method: 'DELETE' });
      toast.success('Report deleted');
      navigate('/my-reports', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setBusy('');
    }
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!item) return <DetailSkeleton />;

  const cat = categoryInfo(item.category);
  const CatIcon = cat.icon;
  const isLost = item.type === 'lost';
  const resolved = item.status === 'resolved';

  return (
    <div className="space-y-10">
      <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(isLost ? '/lost' : '/found'))} className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100">
        <ArrowLeft className="size-4" aria-hidden /> Back
      </button>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        {/* Gallery */}
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-ink-800 bg-ink-900 shadow-card">
            <AnimatePresence mode="wait">
              {item.images.length ? (
                <motion.img key={photo} src={imgUrl(item.images[photo], 1200)} alt={`${item.title}, photo ${photo + 1}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="size-full object-contain" />
              ) : (
                <div className="bg-dots grid size-full place-items-center">
                  <div className="text-center">
                    <CatIcon className={`mx-auto size-20 ${isLost ? 'text-grape-fg/60' : 'text-zap-fg/60'}`} strokeWidth={1} aria-hidden />
                    <p className="mt-2 text-sm text-ink-500">No photo provided</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
            {resolved && (
              <div className="absolute inset-0 grid place-items-center bg-ink-950/40">
                <span className="-rotate-12 rounded-2xl border-4 border-cobalt px-6 py-2 font-display text-4xl font-extrabold text-cobalt-fg uppercase backdrop-blur-sm">Reunited</span>
              </div>
            )}
          </div>
          {item.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {item.images.map((url, i) => (
                <button key={url} type="button" onClick={() => setPhoto(i)} aria-label={`Show photo ${i + 1}`} aria-current={photo === i} className={`size-20 overflow-hidden rounded-2xl border-2 ${photo === i ? 'border-zap' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={imgUrl(url, 200)} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={item.type} />
            <StatusBadge status={item.status} />
            <span className="ml-auto font-mono text-xs text-ink-500">{ticketCode(item.id)}</span>
          </div>
          <div>
            <p className="eyebrow flex items-center gap-1.5"><CatIcon className="size-3.5" aria-hidden /> {cat.label}</p>
            <h1 className="mt-1 text-4xl font-extrabold text-ink-50">{item.title}</h1>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <Meta icon={MapPin} label={isLost ? 'Last seen' : 'Found at'}>{item.location}</Meta>
            <Meta icon={Calendar} label={isLost ? 'Date lost' : 'Date found'}>{formatItemDate(item.date)}</Meta>
            <Meta icon={Clock} label="Reported">{timeAgo(item.createdAt)}</Meta>
            {isLost && item.reward && <Meta icon={Gift} label="Reward">{item.reward}</Meta>}
          </dl>

          <div>
            <h2 className="eyebrow mb-2">Description</h2>
            <p className="leading-relaxed whitespace-pre-line text-ink-200">{item.description}</p>
          </div>

          {item.isOwner && item.identifyingDetails && (
            <div className="rounded-2xl border border-ink-700 bg-ink-900 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink-100"><Fingerprint className="size-4 text-zap-fg" aria-hidden /> Identifying details</p>
              <p className="mt-1 text-sm text-ink-300">{item.identifyingDetails}</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-500"><Lock className="size-3" aria-hidden /> Only you can see this. Use it to check claims in chat.</p>
            </div>
          )}
          {!item.isOwner && item.hasIdentifyingDetails && (
            <p className="flex items-start gap-2 rounded-2xl border border-ink-800 bg-ink-900/60 shadow-card p-3 text-sm text-ink-300">
              <Fingerprint className="mt-0.5 size-4 shrink-0 text-zap-fg" aria-hidden />
              The {isLost ? 'owner' : 'finder'} noted private identifying details. Expect a question or two to confirm it's really {isLost ? 'theirs' : 'yours'}.
            </p>
          )}

          {/* Owner card */}
          <div className="flex items-center gap-3 rounded-2xl border border-ink-800 bg-ink-900 shadow-card p-3">
            <Avatar user={item.owner} size="md" online={isOnline(item.owner.id)} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink-400">{isLost ? 'Lost by' : 'Found by'}</p>
              <Link to={item.isOwner ? '/profile' : `/users/${item.owner.id}`} className="font-semibold text-ink-50 hover:text-zap-fg">
                {item.isOwner ? 'You' : item.owner.name}
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-400">{item.owner.school || 'Student'}</span>
                {item.owner.isVerified && <VerifiedBadge />}
              </div>
            </div>
          </div>

          {/* Actions */}
          {item.isOwner ? (
            <div className="space-y-3">
              {item.conversationCount > 0 && (
                <ButtonLink to="/messages" variant="secondary" className="w-full">
                  <MessageCircle className="size-4" aria-hidden /> {item.conversationCount} conversation{item.conversationCount > 1 ? 's' : ''} about this
                </ButtonLink>
              )}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {resolved ? (
                  <Button variant="secondary" onClick={() => setStatus('open')} loading={busy === 'status'}><RotateCcw className="size-4" /> Reopen</Button>
                ) : (
                  <Button onClick={() => setConfirm('resolve')}><CircleCheck className="size-4" /> Mark resolved</Button>
                )}
                <ButtonLink to={`/items/${item.id}/edit`} variant="secondary"><Pencil className="size-4" /> Edit</ButtonLink>
                <Button variant="danger" onClick={() => setConfirm('delete')} className="col-span-2 sm:col-span-1"><Trash2 className="size-4" /> Delete</Button>
              </div>
            </div>
          ) : resolved ? (
            <p className="rounded-2xl border border-cobalt/30 bg-cobalt/10 p-4 text-sm text-cobalt-fg">This case is closed. The item has been returned.</p>
          ) : (
            <div className="space-y-3">
              <Button size="lg" variant={isLost ? 'lost' : 'primary'} className="w-full" onClick={contact} loading={busy === 'contact'}>
                <MessageCircle className="size-5" aria-hidden />
                {item.conversationId ? 'Open chat' : isLost ? 'I found this: contact owner' : "It's mine: contact finder"}
              </Button>
              <p className="flex items-start gap-2 text-xs text-ink-400">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-zap-fg" aria-hidden />
                Chat stays inside the app; email addresses are never shared. Meet somewhere public on campus to hand over.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Potential matches */}
      {!resolved && matches && matches.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-ink-50"><Radar className="size-6 text-zap-fg" aria-hidden /> Potential matches</h2>
          <p className="mt-1 mb-4 text-sm text-ink-400">
            Suggested from category, keywords, place and date. These are <strong className="text-ink-200">not confirmed</strong>: always verify in chat.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m, i) => (
              <div key={m.item.id}>
                <ItemCard item={m.item} index={i} />
                <div className="mt-2 flex flex-wrap gap-1.5 px-1">
                  <span className="rounded-full bg-zap/15 px-2 py-0.5 font-mono text-[11px] font-bold text-zap-fg">{m.score}% similar</span>
                  {m.reasons.slice(1).map((r) => (
                    <span key={r} className="rounded-full bg-ink-800 px-2 py-0.5 text-[11px] text-ink-300">{r}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={confirm === 'resolve'}
        title="Mark as resolved?"
        confirmLabel="Yes, it's resolved"
        loading={busy === 'status'}
        onConfirm={() => setStatus('resolved')}
        onClose={() => setConfirm(null)}
      >
        Only do this once the item is back with its owner. People who chatted with you about it will be notified. You can reopen it later.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm === 'delete'}
        title="Delete this report?"
        confirmLabel="Delete report"
        variant="danger"
        loading={busy === 'delete'}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
      >
        This permanently removes the report and its photos. Existing chats are kept. If the item was returned, mark it resolved instead.
      </ConfirmDialog>
    </div>
  );
}

function Meta({ icon: Icon, label, children }) {
  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-900 shadow-card p-3">
      <dt className="flex items-center gap-1.5 text-xs text-ink-400"><Icon className="size-3.5" aria-hidden /> {label}</dt>
      <dd className="mt-0.5 font-medium break-words text-ink-50">{children}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-8 pt-9 lg:grid-cols-[1.15fr_1fr]" aria-busy="true">
      <Skeleton className="aspect-[4/3] rounded-[2rem]" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-3/4" />
        <div className="grid grid-cols-2 gap-3"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
        <Skeleton className="h-24" />
        <Skeleton className="h-14" />
      </div>
    </div>
  );
}
