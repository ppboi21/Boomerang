import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { SiteFooter } from './SiteFooter';
import { SoundToggle } from './SoundToggle';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from './ui/Logo';

/**
 * Shared layout for /privacy and /terms.
 * sections: [{ id, icon, title, body: ReactNode }]
 */
export function LegalPage({ icon: HeroIcon, title, intro, updated, sections, related }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hash } = useLocation();

  // React Router doesn't scroll to #anchors by itself.
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    return () => clearTimeout(t);
  }, [hash]);

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <header className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo size="sm" to={user ? '/' : '/login'} />
        <div className="flex gap-2"><ThemeToggle /><SoundToggle /></div>
      </header>

      <main className="relative mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(user ? '/' : '/login'))}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2rem] border border-ink-800 bg-ink-900 p-6 shadow-card sm:p-10">
          <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-zap/20 blur-3xl" aria-hidden />
          <span className="relative grid size-14 place-items-center rounded-2xl bg-zap text-night"><HeroIcon className="size-7" aria-hidden /></span>
          <h1 className="relative mt-5 text-4xl font-extrabold text-ink-50 sm:text-5xl">{title}</h1>
          <p className="relative mt-3 max-w-2xl text-lg text-ink-300">{intro}</p>
          <div className="relative mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="text-ink-500">Last updated {updated}</span>
            {related && (
              <Link to={related.to} className="font-semibold text-zap-fg underline-offset-4 hover:underline">{related.label} →</Link>
            )}
          </div>
          {/* table of contents */}
          <nav className="relative mt-6 flex flex-wrap gap-2" aria-label="On this page">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="rounded-full border border-ink-700 bg-ink-850 px-3 py-1 text-xs font-medium text-ink-300 transition-colors hover:border-zap hover:text-ink-50">
                {s.title}
              </a>
            ))}
          </nav>
        </motion.div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {sections.map(({ id, icon: Icon, title: heading, body }, i) => (
            <motion.section
              key={id}
              id={id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
              className="rounded-3xl border border-ink-800 bg-ink-900/80 p-6 shadow-card target:border-zap target:ring-4 target:ring-zap/20"
            >
              <h2 className="flex items-center gap-2.5 text-lg font-bold text-ink-50">
                <span className="grid size-9 place-items-center rounded-xl bg-ink-800 text-zap-fg"><Icon className="size-[18px]" aria-hidden /></span>
                {heading}
              </h2>
              <div className="mt-3 text-sm leading-relaxed text-ink-300 [&_li]:mt-1.5 [&_p+p]:mt-2 [&_strong]:font-semibold [&_strong]:text-ink-100 [&_ul]:list-disc [&_ul]:pl-5">
                {body}
              </div>
            </motion.section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
