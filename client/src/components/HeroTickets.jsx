import { Headphones, IdCard, KeyRound, MapPin, Milk } from 'lucide-react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect, useState } from 'react';
import { usePrefs } from '../context/PrefsContext';

/*
  Login hero illustration: a fanned stack of lost-property "claim tickets".
  The front ticket cycles through example items and its stamp flips from
  LOST to FOUND, while a boomerang flies an orbit around the stack and
  always comes back. Purely decorative (example items, not real reports).
*/

const EXAMPLES = [
  { icon: Milk, name: 'Water bottle', place: 'Library · 2nd floor', no: '0142' },
  { icon: KeyRound, name: 'Hostel keys', place: 'Cafeteria', no: '0217' },
  { icon: Headphones, name: 'Earbuds case', place: 'Lecture Hall 101', no: '0309' },
  { icon: IdCard, name: 'Student ID card', place: 'Main gate', no: '0388' },
];
const CYCLE_MS = 3600;

// Same silhouette as the logo mark.
const BOOMERANG = 'M8 20c9-3 16 4 24 16 8-12 15-19 24-16-3 12-13 25-24 30C21 45 11 32 8 20z';
// Orbit around the stack (viewBox 600x440), tilted for depth.
const ORBIT = 'M300 64 C 470 64 560 150 560 220 C 560 290 470 376 300 376 C 130 376 40 290 40 220 C 40 150 130 64 300 64 Z';

function Ticket({ item, found, className = '', style }) {
  const Icon = item.icon;
  return (
    <div className={`w-64 overflow-hidden rounded-3xl border border-ink-700 bg-ink-900 shadow-pop sm:w-72 ${className}`} style={style}>
      <div className="bg-dots relative grid h-32 place-items-center bg-ink-850 sm:h-36">
        <span className={`grid size-16 place-items-center rounded-2xl transition-colors duration-500 ${found ? 'bg-zap/15 text-zap-fg' : 'bg-grape/15 text-grape-fg'}`}>
          <Icon className="size-8" strokeWidth={1.6} />
        </span>
        <span className="absolute top-3 left-4 font-mono text-[10px] tracking-[0.2em] text-ink-500">NO.{item.no}</span>
      </div>
      {/* perforated tear line */}
      <div className="relative h-0 border-t-2 border-dashed border-ink-700">
        <span className="absolute -top-3 -left-3 size-6 rounded-full border border-ink-700 bg-ink-950" />
        <span className="absolute -top-3 -right-3 size-6 rounded-full border border-ink-700 bg-ink-950" />
      </div>
      <div className="flex items-end justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold text-ink-50">{item.name}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-400">
            <MapPin className="size-3 shrink-0" /> {item.place}
          </p>
        </div>
        <div className="relative h-8 w-20 shrink-0">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={found ? 'found' : 'lost'}
              initial={{ scale: 1.8, opacity: 0, rotate: -18 }}
              animate={{ scale: 1, opacity: 1, rotate: -8 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 520, damping: 22 }}
              className={`absolute inset-0 grid place-items-center rounded-lg border-2 font-mono text-xs font-black tracking-[0.18em] ${
                found ? 'border-zap-fg text-zap-fg' : 'border-grape-fg text-grape-fg'
              }`}
            >
              {found ? 'FOUND' : 'LOST'}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function HeroTickets({ className = '' }) {
  const { reducedMotion } = usePrefs();
  const [index, setIndex] = useState(0);
  const [found, setFound] = useState(false);

  // Each ticket: arrives LOST, gets stamped FOUND, then the next one slides in.
  useEffect(() => {
    if (reducedMotion) return undefined;
    setFound(false);
    const stamp = setTimeout(() => setFound(true), CYCLE_MS * 0.45);
    const next = setTimeout(() => setIndex((i) => (i + 1) % EXAMPLES.length), CYCLE_MS);
    return () => {
      clearTimeout(stamp);
      clearTimeout(next);
    };
  }, [index, reducedMotion]);

  // Gentle 3D tilt toward the pointer.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateY = useSpring(useTransform(mx, [-1, 1], [-10, 10]), { stiffness: 120, damping: 18 });
  const rotateX = useSpring(useTransform(my, [-1, 1], [8, -8]), { stiffness: 120, damping: 18 });
  useEffect(() => {
    if (reducedMotion) return undefined;
    const onMove = (e) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1);
      my.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [mx, my, reducedMotion]);

  const front = EXAMPLES[index];
  const back1 = EXAMPLES[(index + 1) % EXAMPLES.length];
  const back2 = EXAMPLES[(index + 2) % EXAMPLES.length];
  const showFound = reducedMotion ? true : found;

  return (
    <div className={`relative grid place-items-center ${className}`} aria-hidden>
      {/* radar pulses */}
      {!reducedMotion &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="tint-rings absolute size-72 rounded-full border border-zap/30"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.6], opacity: [0.55, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, delay: i * 1.5, ease: 'easeOut' }}
          />
        ))}
      <div className="absolute size-80 rounded-full bg-zap/10 blur-3xl" />

      {/* orbit + returning boomerang */}
      <svg viewBox="0 0 600 440" className="absolute inset-0 m-auto h-full max-h-[440px] w-full max-w-[600px] overflow-visible">
        <g transform="rotate(-10 300 220)">
          <path d={ORBIT} fill="none" stroke="currentColor" className="text-ink-600" strokeWidth="1.5" strokeDasharray="3 9" strokeLinecap="round" />
          {!reducedMotion && (
            <>
              {/* comet trail that follows the boomerang */}
              <path d={ORBIT} fill="none" pathLength="100" stroke="var(--zap-fg)" strokeWidth="5" strokeLinecap="round" strokeDasharray="18 82" opacity="0.65">
                <animate attributeName="stroke-dashoffset" from="18" to="-82" dur="7s" repeatCount="indefinite" />
              </path>
              <g>
                <animateMotion dur="7s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#hero-orbit" />
                </animateMotion>
                <g transform="translate(-42 -42) scale(1.3)" style={{ filter: 'drop-shadow(0 0 10px rgba(200,255,46,0.55))' }}>
                  <path d={BOOMERANG} fill="#c8ff2e" stroke="#0b0b0f" strokeOpacity="0.25" strokeWidth="1.5">
                    <animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="0.9s" repeatCount="indefinite" />
                  </path>
                </g>
              </g>
            </>
          )}
          <path id="hero-orbit" d={ORBIT} fill="none" stroke="none" />
        </g>
      </svg>

      {/* ticket stack */}
      <motion.div className="relative" style={{ rotateX, rotateY, transformPerspective: 900 }}>
        <Ticket item={back2} found={false} className="absolute inset-0 -rotate-[9deg] opacity-50 [&>*]:invisible" style={{ translate: '-34px 10px' }} />
        <Ticket item={back1} found={false} className="absolute inset-0 rotate-[7deg] opacity-80 [&>*]:invisible" style={{ translate: '30px 6px' }} />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={front.no}
            initial={{ y: 40, opacity: 0, rotate: 6, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, rotate: -2, scale: 1 }}
            exit={{ x: -120, opacity: 0, rotate: -14, transition: { duration: 0.35 } }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          >
            <Ticket item={front} found={showFound} />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
