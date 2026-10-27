import { Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { usePrefs } from '../context/PrefsContext';

export function ThemeToggle({ className = '' }) {
  const { resolvedTheme, update, play } = usePrefs();
  const isDark = resolvedTheme === 'dark';
  return (
    <button
      type="button"
      onClick={() => {
        play('click');
        update({ theme: isDark ? 'light' : 'dark' });
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`relative grid size-10 place-items-center overflow-hidden rounded-xl border border-ink-700 text-ink-300 transition-colors hover:text-ink-50 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={resolvedTheme}
          initial={{ y: 14, rotate: -90, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          exit={{ y: -14, rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
