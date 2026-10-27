import { ArrowRight, ArrowUpRight, Bell, CircleCheck, FolderOpen, Handshake, MessageCircle, Plus, Search, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ItemGrid } from '../components/ItemCard';
import { Avatar } from '../components/ui/Avatar';
import { StatusBadge } from '../components/ui/Badges';
import { ButtonLink } from '../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback';
import { BoomerangMark } from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTitle } from '../hooks/useTitle';
import { api } from '../services/api';
import { CATEGORIES, TYPE, categoryInfo } from '../utils/constants';
import { firstName, timeAgo } from '../utils/format';
import { imgUrl } from '../utils/image';

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function Dashboard() {
  useTitle('Home');
  const { user } = useAuth();
  const { counts } = useSocket();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [feed, setFeed] = useState('lost');
  const [q, setQ] = useState('');

  async function load() {
    setError('');
    try {
      const [stats, lost, found, resolved, mine] = await Promise.all([
        api('/items/stats'),
        api('/items', { query: { type: 'lost', limit: 4 } }),
        api('/items', { query: { type: 'found', limit: 4 } }),
        api('/items', { query: { status: 'resolved', limit: 4 } }),
        api('/items/mine'),
      ]);
      setData({ stats, lost: lost.items, found: found.items, resolved: resolved.items, mine: mine.items.filter((i) => i.status !== 'resolved').slice(0, 4) });
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => { load(); }, []);

  const s = data?.stats;
  const feedItems = data?.[feed] || [];

  return (
    <div className="space-y-8">
      {/* ---------- Welcome ---------- */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="hero-card relative overflow-hidden rounded-[2rem] border border-ink-800 bg-ink-900 p-6 shadow-card sm:p-8">
          <div className="bg-dots pointer-events-none absolute inset-0 opacity-50" aria-hidden />
          <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-zap/15 blur-3xl" aria-hidden />
          <BoomerangMark className="pointer-events-none absolute -right-8 -bottom-12 size-64 -rotate-[20deg] text-ink-800/80" />
          <div className="relative">
            <p className="eyebrow">{greeting()}{user.school ? ` · ${user.school}` : ''}</p>
            <h1 className="mt-2 text-4xl font-extrabold text-ink-50 sm:text-5xl">
              Hey {firstName(user.name)}{' '}
              <motion.span className="inline-block origin-[70%_70%]" animate={{ rotate: [0, 18, -8, 18, 0] }} transition={{ duration: 1.4, delay: 0.4 }}>👋</motion.span>
            </h1>
            <p className="mt-2 max-w-lg text-ink-300">Lost something, or holding someone else's stuff? Start here.</p>

            <form
              className="relative mt-6 max-w-xl"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/browse?q=${encodeURIComponent(q.trim())}`);
              }}
            >
              <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-400" aria-hidden />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={typeof window !== "undefined" && window.innerWidth < 420 ? "Search items…" : "Search for a bottle, keys, ID card…"}
                aria-label="Search lost and found items"
                className="input h-14 rounded-2xl pr-28 pl-12 text-base"
              />
              <button type="submit" className="absolute top-1/2 right-2 h-10 -translate-y-1/2 rounded-xl bg-ink-800 px-4 text-sm font-semibold text-ink-100 hover:bg-ink-700">
                Search
              </button>
            </form>

            <div className="mt-4 grid gap-3 sm:max-w-xl sm:grid-cols-2">
              <ActionTile to="/report/lost" tone="grape" title="I lost something" sub="Post it so finders can reach you" />
              <ActionTile to="/report/found" tone="zap" title="I found something" sub="Snap a photo, help it get home" />
            </div>
          </div>
        </section>

        {/* ---------- Your activity ---------- */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-[2rem] border border-ink-800 bg-ink-900 p-5 shadow-card">
            <div className="flex items-center gap-3">
              <Avatar user={user} size="md" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink-50">{user.name}</p>
                <Link to="/profile" className="text-xs text-ink-400 hover:text-zap-fg">View profile</Link>
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <ActivityRow to="/my-reports" icon={FolderOpen} label="Open reports" value={s?.myActive} />
              <ActivityRow to="/messages" icon={MessageCircle} label="Unread messages" value={counts.messages} highlight={counts.messages > 0} />
              <ActivityRow to="/notifications" icon={Bell} label="Notifications" value={counts.notifications} highlight={counts.notifications > 0} />
            </div>
          </div>
          <Link to="/safety/handovers" className="group flex-1 rounded-[2rem] border border-ink-800 bg-ink-900 p-5 shadow-card transition-colors hover:border-ink-600">
            <span className="grid size-10 place-items-center rounded-xl bg-zap/15 text-zap-fg"><ShieldCheck className="size-5" aria-hidden /></span>
            <p className="mt-3 font-semibold text-ink-50">Hand-over tip</p>
            <p className="mt-1 text-sm text-ink-400">Ask the claimant to describe a detail that isn't in the photo, and meet somewhere public on campus.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-zap-fg">
              Safety guide <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        </aside>
      </div>

      {/* ---------- Campus stats ---------- */}
      <section aria-label="Campus activity" className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Search} label="Still searching" value={s?.lostActive} to="/lost" tone="text-grape-fg bg-grape/15" />
        <Stat icon={Handshake} label="Waiting for owners" value={s?.foundActive} to="/found" tone="text-zap-fg bg-zap/15" />
        <Stat icon={CircleCheck} label="Reunited this week" value={s?.resolvedThisWeek} sub={s ? `${s.resolved} all-time` : ''} to="/browse?status=resolved" tone="text-cobalt-fg bg-cobalt/15" />
        <Stat icon={Users} label="Students on boomerang" value={s?.members} tone="text-sun-fg bg-sun/15" />
      </section>

      {/* ---------- Categories ---------- */}
      <section>
        <SectionTitle title="Browse by category" />
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-8">
          {CATEGORIES.map(({ value, label, icon: Icon }) => (
            <Link
              key={value}
              to={`/browse?category=${value}`}
              className="group flex shrink-0 flex-col items-center gap-2 rounded-2xl border border-ink-800 bg-ink-900 px-3 py-4 text-center shadow-card transition-all hover:-translate-y-0.5 hover:border-zap/60 sm:shrink"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-ink-800 text-ink-200 transition-colors group-hover:bg-zap group-hover:text-night">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="w-20 text-xs leading-tight font-medium text-ink-300 sm:w-auto">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          {/* ---------- Latest reports (lost / found) ---------- */}
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-ink-50 sm:text-2xl">Latest reports</h2>
                <div className="inline-flex rounded-xl border border-ink-800 bg-ink-900 p-1" role="tablist" aria-label="Report type">
                  {['lost', 'found'].map((t) => (
                    <button
                      key={t}
                      role="tab"
                      aria-selected={feed === t}
                      onClick={() => setFeed(t)}
                      className={`relative rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${feed === t ? 'text-night' : 'text-ink-300 hover:text-ink-50'}`}
                    >
                      {feed === t && <motion.span layoutId="feed-tab" className={`absolute inset-0 rounded-lg ${t === 'lost' ? 'bg-grape' : 'bg-zap'}`} />}
                      <span className="relative">{TYPE[t].label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Link to={`/${feed}`} className="group inline-flex items-center gap-1 text-sm font-medium text-ink-300 hover:text-zap-fg">
                See all {feed} items <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={feed} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                {data && !feedItems.length ? (
                  <EmptyState
                    icon={Sparkles}
                    title={feed === 'lost' ? 'Nothing lost right now' : 'No found items yet'}
                    action={<ButtonLink to={`/report/${feed}`} variant="secondary" size="sm"><Plus className="size-4" /> Report a {feed} item</ButtonLink>}
                  >
                    {feed === 'lost' ? 'Campus is keeping it together. For now.' : 'Found something on campus? You could be the first.'}
                  </EmptyState>
                ) : (
                  <ItemGrid items={feedItems} loading={!data} skeletons={4} className="lg:grid-cols-4" />
                )}
              </motion.div>
            </AnimatePresence>
          </section>

          {/* ---------- Your reports + reunited ---------- */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ListPanel
              title="Your open reports"
              to="/my-reports"
              items={data?.mine}
              empty={
                <div className="py-6 text-center text-sm text-ink-400">
                  You have no open reports. <Link to="/report/lost" className="font-semibold text-zap-fg hover:underline">Report something</Link>
                </div>
              }
            />
            <ListPanel
              title="Recently reunited"
              to="/browse?status=resolved"
              items={data?.resolved}
              empty={<div className="py-6 text-center text-sm text-ink-400">When someone gets their stuff back, it shows up here.</div>}
            />
          </div>
        </>
      )}
    </div>
  );
}

function SectionTitle({ title }) {
  return <h2 className="mb-4 text-2xl font-bold text-ink-50">{title}</h2>;
}

function ActionTile({ to, tone, title, sub }) {
  const bg = tone === 'zap' ? 'bg-zap' : 'bg-grape';
  return (
    <Link to={to} className={`group relative overflow-hidden rounded-2xl ${bg} p-4 text-night transition-transform hover:-translate-y-1 active:scale-[0.98]`}>
      <div className="flex items-start justify-between">
        <span className="grid size-9 place-items-center rounded-xl bg-night/10"><Plus className="size-5 transition-transform duration-300 group-hover:rotate-90" aria-hidden /></span>
        <ArrowUpRight className="size-5 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
      </div>
      <p className="mt-5 font-display text-xl font-extrabold">{title}</p>
      <p className="text-sm opacity-75">{sub}</p>
    </Link>
  );
}

function ActivityRow({ to, icon: Icon, label, value, highlight }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-ink-800">
      <Icon className="size-4 text-ink-400" aria-hidden />
      <span className="flex-1 text-sm text-ink-200">{label}</span>
      {value === undefined ? (
        <Skeleton className="h-5 w-6" />
      ) : (
        <span className={`grid h-6 min-w-6 place-items-center rounded-full px-2 text-xs font-bold ${highlight ? 'bg-zap text-night' : 'bg-ink-800 text-ink-200'}`}>{value}</span>
      )}
    </Link>
  );
}

function Stat({ icon: Icon, label, value, sub, to, tone }) {
  const body = (
    <>
      <span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon className="size-5" aria-hidden /></span>
      <div className="min-w-0">
        {value === undefined ? <Skeleton className="h-8 w-12" /> : <p className="font-display text-3xl leading-none font-extrabold text-ink-50">{value}</p>}
        <p className="mt-1 truncate text-xs text-ink-400">{label}{sub ? ` · ${sub}` : ''}</p>
      </div>
    </>
  );
  const cls = 'flex items-center gap-3 rounded-3xl border border-ink-800 bg-ink-900 p-4 shadow-card';
  return to ? <Link to={to} className={`${cls} transition-colors hover:border-ink-600`}>{body}</Link> : <div className={cls}>{body}</div>;
}

function ListPanel({ title, to, items, empty }) {
  return (
    <section className="min-w-0 rounded-[2rem] border border-ink-800 bg-ink-900 p-5 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink-50">{title}</h2>
        <Link to={to} className="text-sm font-medium text-ink-400 hover:text-zap-fg">See all</Link>
      </div>
      {!items ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : items.length === 0 ? (
        empty
      ) : (
        <ul className="divide-y divide-ink-800">
          {items.map((item) => {
            const Icon = categoryInfo(item.category).icon;
            return (
              <li key={item.id}>
                <Link to={`/items/${item.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-ink-850">
                  {item.images[0] ? (
                    <img src={imgUrl(item.images[0], 120)} alt="" className="size-11 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink-800 text-ink-300"><Icon className="size-5" aria-hidden /></span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-50">{item.title}</p>
                    <p className="truncate text-xs text-ink-400">
                      <span className={TYPE[item.type].accent}>{TYPE[item.type].label}</span> · {item.location} · {timeAgo(item.status === 'resolved' && item.resolvedAt ? item.resolvedAt : item.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
