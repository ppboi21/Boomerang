import { motion } from 'motion/react';
import { HeroTickets } from '../components/HeroTickets';
import { SiteFooter } from '../components/SiteFooter';
import { SoundToggle } from '../components/SoundToggle';
import { ThemeToggle } from '../components/ThemeToggle';
import { SchoolsPill } from '../components/ui/Crest';
import { Logo } from '../components/ui/Logo';

export default function AuthLayout({ children }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* ambient background */}
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <div className="pointer-events-none absolute -top-40 -left-40 size-[36rem] rounded-full bg-grape/15 blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute -right-40 -bottom-40 size-[32rem] rounded-full bg-zap/10 blur-[120px]" aria-hidden />

      <div className="relative flex-1 lg:grid lg:grid-cols-[1.1fr_1fr]">
        {/* ---------- Hero ---------- */}
        <section className="relative flex flex-col px-5 pt-5 sm:px-10 sm:pt-8 lg:min-h-dvh lg:pb-10">
          <div className="flex items-center justify-between">
            <Logo to="/login" />
            <div className="flex gap-1.5 min-[380px]:gap-2 lg:hidden">
              <ThemeToggle />
              <SoundToggle />
            </div>
          </div>

          <div className="relative mx-auto my-2 h-56 w-full max-w-xl sm:h-72 lg:my-0 lg:h-auto lg:max-w-none lg:flex-1">
            <div className="absolute inset-0 overflow-visible">
              <HeroTickets className="!absolute top-1/2 left-1/2 h-[440px] w-[600px] -translate-x-1/2 -translate-y-1/2 scale-[0.5] sm:scale-[0.65] lg:scale-90 xl:scale-100" />
            </div>
          </div>

          <div className="relative hidden lg:block">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-6xl leading-[0.95] font-extrabold text-ink-50 xl:text-7xl"
            >
              Lost it?
              <br />
              <span className="hl text-zap-fg">It comes back.</span>
            </motion.h1>
            <p className="mt-4 max-w-md text-lg text-ink-300">
              The campus lost &amp; found for SST students. Report it, match it, chat it out, get it back.
            </p>
          </div>
        </section>

        {/* ---------- Auth panel ---------- */}
        <section className="relative flex items-start justify-center px-4 pb-10 sm:px-6 lg:items-center lg:py-10">
          <div className="absolute top-8 right-8 hidden gap-2 lg:flex">
            <ThemeToggle />
            <SoundToggle />
          </div>
          <div className="w-full max-w-md">
            <div className="mb-5 text-center lg:hidden">
              <h1 className="text-4xl leading-none font-extrabold text-ink-50">
                Lost it? <span className="hl text-zap-fg">It comes back.</span>
              </h1>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="auth-card rounded-[2rem] border border-ink-700/80 bg-ink-900/85 p-6 shadow-pop backdrop-blur-xl sm:p-8"
            >
              {children}
            </motion.div>
            <div className="mt-5 flex justify-center">
              <SchoolsPill />
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
