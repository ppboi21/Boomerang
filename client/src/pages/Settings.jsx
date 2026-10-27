import { Info, Lock, LogOut, Sparkles, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';
import { useAuth } from '../context/AuthContext';
import { usePrefs } from '../context/PrefsContext';
import { useTitle } from '../hooks/useTitle';
import { api } from '../services/api';
import { playTone } from '../utils/sound';

export default function Settings() {
  useTitle('Settings');
  const { user, signOut, acceptSession, config } = useAuth();
  const prefs = usePrefs();
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [pwError, setPwError] = useState('');
  const [saving, setSaving] = useState(false);

  async function changePassword(e) {
    e.preventDefault();
    setPwError('');
    setSaving(true);
    try {
      const d = await api('/users/me/password', { method: 'PATCH', body: pw });
      acceptSession(d);
      setPw({ currentPassword: '', newPassword: '' });
      toast.success('Password updated. Other devices have been signed out.');
    } catch (err) {
      setPwError(err.data?.errors?.[0]?.message || err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-4xl font-extrabold text-ink-50">Settings</h1>

      <section className="panel space-y-5 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink-50"><Sparkles className="size-5 text-zap-fg" aria-hidden /> Experience</h2>
        <Toggle
          icon={Volume2}
          label="Sound effects"
          desc="Soft blips for clicks, new messages and matches. Off by default."
          checked={prefs.sound}
          onChange={(v) => { if (v) playTone('success'); prefs.update({ sound: v }); }}
        />
        <Choice
          label="Theme"
          desc="Pick a look, or follow your device setting."
          value={prefs.theme}
          onChange={(theme) => prefs.update({ theme })}
          options={[['dark', 'Dark'], ['light', 'Light'], ['system', 'Follow device']]}
        />
        <div>
          <p className="font-medium text-ink-100">Motion</p>
          <p className="mb-3 text-sm text-ink-400">Reduce animations if they're distracting or make you feel unwell.</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Motion">
            {[
              ['system', 'Follow device'],
              ['reduce', 'Reduced'],
              ['full', 'Full'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={prefs.motion === value}
                onClick={() => prefs.update({ motion: value })}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${prefs.motion === value ? 'border-zap bg-zap/10 text-zap-fg' : 'border-ink-700 text-ink-300 hover:border-ink-500'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink-50"><Lock className="size-5 text-zap-fg" aria-hidden /> Change password</h2>
        <form onSubmit={changePassword} className="mt-4 space-y-4" noValidate>
          <Field label="Current password" hint={user?.googleLinked ? 'Signed up with Google and never set a password? Leave this empty.' : undefined}>
            {(p) => <Input {...p} type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw((s) => ({ ...s, currentPassword: e.target.value }))} />}
          </Field>
          <Field label="New password" hint="8+ characters, with a letter and a number" error={pwError}>
            {(p) => <Input {...p} type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw((s) => ({ ...s, newPassword: e.target.value }))} />}
          </Field>
          <Button type="submit" loading={saving} disabled={(!pw.currentPassword && !user?.googleLinked) || !pw.newPassword}>Update password</Button>
        </form>
      </section>

      <section className="panel space-y-3 p-5 text-sm text-ink-300 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink-50"><Info className="size-5 text-zap-fg" aria-hidden /> Privacy</h2>
        <p>
          Accounts are limited to {config.collegeDomains.map((d) => `@${d}`).join(', ') || 'college'} email addresses. Your full email is never shown to
          other students; they only see your name and school.
        </p>
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <Link to="/privacy" className="font-semibold text-zap-fg hover:underline">Privacy &amp; safety →</Link>
          <Link to="/terms" className="font-semibold text-zap-fg hover:underline">Terms &amp; conditions →</Link>
        </p>
      </section>

      <Button variant="danger" onClick={signOut} className="w-full"><LogOut className="size-4" /> Sign out</Button>
    </div>
  );
}

function Choice({ label, desc, value, onChange, options }) {
  return (
    <div>
      <p className="font-medium text-ink-100">{label}</p>
      <p className="mb-3 text-sm text-ink-400">{desc}</p>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={label}>
        {options.map(([v, text]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${value === v ? 'border-zap bg-zap/10 text-zap-fg' : 'border-ink-700 text-ink-300 hover:border-ink-500'}`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ icon: Icon, label, desc, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink-800 text-ink-200"><Icon className="size-5" aria-hidden /></span>
      <span className="flex-1">
        <span className="block font-medium text-ink-100">{label}</span>
        <span className="block text-sm text-ink-400">{desc}</span>
      </span>
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative h-7 w-12 shrink-0 rounded-full bg-ink-700 transition-colors peer-checked:bg-zap peer-focus-visible:ring-2 peer-focus-visible:ring-zap peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ink-900 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-ink-50 after:transition-transform peer-checked:after:translate-x-5 peer-checked:after:bg-ink-950" />
    </label>
  );
}
