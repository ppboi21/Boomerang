import { MotionConfig } from 'motion/react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { playTone } from '../utils/sound';

// Per-device preferences: sound (off by default), motion level and theme.
// index.html reads the same key before React loads so there's no theme flash.
const KEY = 'bm_prefs';
const DEFAULTS = { sound: false, motion: 'system', theme: 'dark' }; // motion: system | reduce | full · theme: dark | light | system

const PrefsContext = createContext(null);

function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return DEFAULTS;
  }
}

function systemReduced() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function PrefsProvider({ children }) {
  const [prefs, setPrefs] = useState(load);
  const [osReduced, setOsReduced] = useState(systemReduced);
  const [osLight, setOsLight] = useState(() => window.matchMedia?.('(prefers-color-scheme: light)').matches);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const cs = window.matchMedia?.('(prefers-color-scheme: light)');
    const onMotion = () => setOsReduced(mq.matches);
    const onScheme = () => setOsLight(cs.matches);
    mq?.addEventListener?.('change', onMotion);
    cs?.addEventListener?.('change', onScheme);
    return () => {
      mq?.removeEventListener?.('change', onMotion);
      cs?.removeEventListener?.('change', onScheme);
    };
  }, []);

  const resolvedTheme = prefs.theme === 'system' ? (osLight ? 'light' : 'dark') : prefs.theme;

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
    document.documentElement.dataset.motion = prefs.motion;
  }, [prefs]);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolvedTheme === 'light' ? '#f4f3ee' : '#07070a');
  }, [resolvedTheme]);

  const update = useCallback((patch) => setPrefs((p) => ({ ...p, ...patch })), []);
  const play = useCallback((name) => { if (prefs.sound) playTone(name); }, [prefs.sound]);
  const reducedMotion = prefs.motion === 'reduce' || (prefs.motion === 'system' && osReduced);

  const value = useMemo(
    () => ({ ...prefs, update, play, reducedMotion, resolvedTheme }),
    [prefs, update, play, reducedMotion, resolvedTheme],
  );

  return (
    <PrefsContext.Provider value={value}>
      <MotionConfig reducedMotion={prefs.motion === 'reduce' ? 'always' : prefs.motion === 'full' ? 'never' : 'user'}>
        {children}
      </MotionConfig>
    </PrefsContext.Provider>
  );
}

export const usePrefs = () => useContext(PrefsContext);
