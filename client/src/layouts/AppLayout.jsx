import { Bell, FolderOpen, House, LogOut, MessageCircle, Plus, Search, Settings, ShieldCheck, User, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { SoundToggle } from '../components/SoundToggle';
import { ThemeToggle } from '../components/ThemeToggle';
import { Avatar } from '../components/ui/Avatar';
import { Logo } from '../components/ui/Logo';
import { SiteFooter } from '../components/SiteFooter';
import { useAuth } from '../context/AuthContext';
import { usePrefs } from '../context/PrefsContext';
import { useSocket } from '../context/SocketContext';

const LostIcon = (p) => <span {...p} className={`${p.className} grid place-items-center`}><span className="size-2.5 rounded-full border-2 border-current" /></span>;
const FoundIcon = (p) => <span {...p} className={`${p.className} grid place-items-center`}><span className="size-2.5 rounded-full bg-current" /></span>;

const NAV = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/lost', label: 'Lost items', icon: LostIcon },
  { to: '/found', label: 'Found items', icon: FoundIcon },
  { to: '/my-reports', label: 'My reports', icon: FolderOpen },
  { to: '/messages', label: 'Messages', icon: MessageCircle, badge: 'messages' },
  { to: '/notifications', label: 'Notifications', icon: Bell, badge: 'notifications' },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function CountBadge({ n, className = '' }) {
  if (!n) return null;
  return (
    <span className={`grid h-5 min-w-5 place-items-center rounded-full bg-zap px-1.5 text-[11px] font-bold text-night ${className}`}>
      {n > 99 ? '99+' : n}
    </span>
  );
}

function GlobalSearch({ className = '' }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  return (
    <form
      role="search"
      className={`relative ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        navigate(`/browse?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search lost & found…"
        aria-label="Search all items"
        className="input h-10 pl-10 text-sm"
      />
    </form>
  );
}

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const { counts } = useSocket();
  const { play } = usePrefs();
  const location = useLocation();
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => setReportOpen(false), [location.pathname]);
  const chatOpen = /^\/messages\/.+/.test(location.pathname);

  return (
    <div className="min-h-dvh lg:pl-72">
      {/* ---------- Desktop sidebar ---------- */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-ink-800 bg-ink-950/70 p-5 backdrop-blur-xl side-nav lg:flex">
        <Logo />
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Link to="/report/lost" onClick={() => play('click')} className="group rounded-2xl bg-grape p-3 text-night transition-transform hover:-translate-y-0.5 active:scale-95">
            <Plus className="size-4 transition-transform group-hover:rotate-90" aria-hidden />
            <span className="mt-3 block text-sm leading-tight font-bold">Report<br />lost item</span>
          </Link>
          <Link to="/report/found" onClick={() => play('click')} className="group rounded-2xl bg-zap p-3 text-night transition-transform hover:-translate-y-0.5 active:scale-95">
            <Plus className="size-4 transition-transform group-hover:rotate-90" aria-hidden />
            <span className="mt-3 block text-sm leading-tight font-bold">Report<br />found item</span>
          </Link>
        </div>

        <nav className="mt-6 flex-1 space-y-0.5" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors ${
                  isActive ? 'text-ink-50' : 'text-ink-400 hover:bg-ink-900 hover:text-ink-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl border border-ink-700 bg-ink-850" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                  <Icon className={`relative size-[18px] ${isActive ? 'text-zap-fg' : ''}`} aria-hidden />
                  <span className="relative flex-1">{label}</span>
                  {badge && <CountBadge n={counts[badge]} className="relative" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <Link to="/privacy" className="mb-3 flex items-center gap-2 px-3 text-xs text-ink-400 hover:text-zap-fg">
          <ShieldCheck className="size-3.5" aria-hidden /> Privacy &amp; safety
        </Link>
        <div className="flex items-center gap-3 rounded-2xl border border-ink-800 bg-ink-900 shadow-card p-2.5">
          <Link to="/profile" className="flex min-w-0 flex-1 items-center gap-2.5">
            <Avatar user={user} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-50">{user.name}</p>
              <p className="truncate text-xs text-ink-400">{user.school || 'Student'}</p>
            </div>
          </Link>
          <button type="button" onClick={signOut} className="grid size-9 place-items-center rounded-lg text-ink-400 hover:bg-ink-800 hover:text-coral-fg" aria-label="Sign out" title="Sign out">
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      {/* ---------- Top bar ---------- */}
      <header className={`safe-top sticky top-0 z-20 border-b border-ink-800/80 bg-ink-950/80 backdrop-blur-xl ${chatOpen ? 'max-lg:hidden' : ''}`}>
        <div className="flex h-16 items-center gap-2 px-3 min-[380px]:gap-3 min-[380px]:px-4 sm:px-6 lg:px-8">
          <Logo size="sm" className="lg:hidden" />
          <GlobalSearch className="ml-auto hidden w-full max-w-md sm:block lg:ml-0" />
          <div className="ml-auto flex items-center gap-1.5 min-[380px]:gap-2 sm:ml-3">
            <ThemeToggle />
            <SoundToggle className="max-sm:hidden" />
            <Link to="/notifications" className="relative grid size-10 place-items-center rounded-xl border border-ink-700 text-ink-300 hover:text-ink-50" aria-label={`Notifications${counts.notifications ? `, ${counts.notifications} unread` : ''}`}>
              <Bell className="size-4" />
              <CountBadge n={counts.notifications} className="absolute -top-1.5 -right-1.5" />
            </Link>
            <Link to="/profile" className="lg:hidden" aria-label="Your profile">
              <Avatar user={user} size="sm" />
            </Link>
          </div>
        </div>
      </header>

      <main className={`mx-auto max-w-7xl 2xl:max-w-[88rem] px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pb-12 ${chatOpen ? 'max-lg:p-0 max-lg:pb-0' : ''}`}>
        <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Outlet />
        </motion.div>
        {!location.pathname.startsWith('/messages') && <SiteFooter className="mt-16 -mx-4 sm:-mx-6 lg:-mx-8" />}
      </main>

      {/* ---------- Mobile bottom nav ---------- */}
      {!chatOpen && (
        <nav className="safe-bottom fixed inset-x-3 z-30 lg:hidden" aria-label="Main">
          <AnimatePresence>
            {reportOpen && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="mb-2 grid grid-cols-2 gap-2">
                <Link to="/report/lost" className="rounded-2xl bg-grape p-4 font-bold text-night shadow-xl">I lost something</Link>
                <Link to="/report/found" className="rounded-2xl bg-zap p-4 font-bold text-night shadow-xl">I found something</Link>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center justify-around rounded-3xl border border-ink-700 bg-ink-900/90 px-2 py-2 shadow-2xl backdrop-blur-xl">
            <MobileLink to="/" icon={House} label="Home" end />
            <MobileLink to="/lost" icon={LostIcon} label="Lost" />
            <button
              type="button"
              onClick={() => { play('click'); setReportOpen((o) => !o); }}
              aria-expanded={reportOpen}
              aria-label={reportOpen ? 'Close report menu' : 'Report an item'}
              className="grid size-13 -translate-y-3 place-items-center rounded-2xl bg-zap text-night shadow-[0_10px_30px_-8px_rgba(200,255,46,0.7)] transition-transform active:scale-90"
            >
              {reportOpen ? <X className="size-6" /> : <Plus className="size-6" />}
            </button>
            <MobileLink to="/found" icon={FoundIcon} label="Found" />
            <MobileLink to="/messages" icon={MessageCircle} label="Chats" badge={counts.messages} />
          </div>
        </nav>
      )}
    </div>
  );
}

function MobileLink({ to, icon: Icon, label, end, badge }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `relative flex w-14 flex-col items-center gap-0.5 py-1 text-[11px] font-medium ${isActive ? 'text-zap-fg' : 'text-ink-400'}`}
    >
      <Icon className="size-5" aria-hidden />
      {label}
      <CountBadge n={badge} className="absolute -top-1 right-1.5" />
    </NavLink>
  );
}
