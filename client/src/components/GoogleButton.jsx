import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePrefs } from '../context/PrefsContext';

// Loads Google Identity Services once and renders Google's official button.
// Google returns an ID token ("credential"), which our server verifies.
let scriptPromise = null;
function loadGoogleScript() {
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve(window.google);
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error('Could not load Google sign-in'));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function GoogleButton({ onCredential, text = 'continue_with' }) {
  const { config } = useAuth();
  const { resolvedTheme } = usePrefs();
  const box = useRef(null);
  const handler = useRef(onCredential);
  handler.current = onCredential;
  const [failed, setFailed] = useState(false);
  const clientId = config.googleClientId;

  useEffect(() => {
    if (!clientId) return undefined;
    let cancelled = false;
    loadGoogleScript()
      .then((google) => {
        if (cancelled || !box.current) return;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (res) => handler.current(res.credential),
          hd: config.collegeDomains[0], // hint: show college accounts first (server enforces it)
          ux_mode: 'popup',
          context: 'signin',
        });
        box.current.innerHTML = '';
        google.accounts.id.renderButton(box.current, {
          type: 'standard',
          theme: resolvedTheme === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          shape: 'pill',
          text,
          logo_alignment: 'left',
          width: Math.min(box.current.offsetWidth || 360, 400),
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [clientId, resolvedTheme, text, config.collegeDomains]);

  if (!clientId) return null;
  if (failed) {
    return <p className="rounded-xl border border-ink-700 p-3 text-center text-sm text-ink-400">Google sign-in couldn't load. Check your connection or ad-blocker.</p>;
  }
  return <div ref={box} className="flex min-h-11 w-full justify-center [color-scheme:normal]" />;
}
