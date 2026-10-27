import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';
import { useAuth } from '../context/AuthContext';
import { usePrefs } from '../context/PrefsContext';
import { useTitle } from '../hooks/useTitle';
import AuthLayout from '../layouts/AuthLayout';
import { GoogleButton } from '../components/GoogleButton';
import { api } from '../services/api';

const EMPTY = { name: '', email: '', password: '' };

// One component for both /login and /register so switching tabs animates
// instead of remounting.
export default function AuthPage() {
  const { pathname, state } = useLocation();
  const mode = pathname === '/register' ? 'register' : 'login';
  const isRegister = mode === 'register';
  useTitle(isRegister ? 'Join' : 'Sign in');

  const { login, register, config, acceptSession } = useAuth();
  const { play } = usePrefs();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined, form: undefined }));
  };

  function validate() {
    const er = {};
    const email = form.email.trim().toLowerCase();
    if (isRegister && form.name.trim().length < 2) er.name = 'Tell us your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) er.email = 'Enter a valid email address';
    else if (isRegister && config.collegeDomains.length && !config.collegeDomains.includes(email.split('@')[1])) {
      er.email = `Use your college email (${config.collegeDomains.map((d) => '@' + d).join(', ')})`;
    }
    if (!form.password) er.password = 'Enter your password';
    else if (isRegister && (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))) {
      er.password = 'At least 8 characters with a letter and a number';
    }
    return er;
  }

  async function onGoogle(credential) {
    setErrors({});
    setSubmitting(true);
    try {
      const data = acceptSession(await api('/auth/google', { method: 'POST', body: { credential } }));
      play('success');
      toast.success(`Welcome, ${data.user.name.split(' ')[0]}!`);
      navigate(state?.from || '/', { replace: true });
    } catch (err) {
      play('error');
      setErrors({ form: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    const er = validate();
    setErrors(er);
    if (Object.keys(er).length) {
      play('error');
      return;
    }
    setSubmitting(true);
    try {
      if (isRegister) {
        const data = await register({ ...form, email: form.email.trim() });
        play('success');
        if (data.user.needsVerification) navigate('/verify-pending', { replace: true, state: { emailSent: data.emailSent } });
        else {
          toast.success(`Welcome to boomerang, ${data.user.name.split(' ')[0]}! 🎉`);
          navigate('/', { replace: true });
        }
      } else {
        const data = await login(form.email.trim(), form.password);
        play('success');
        if (data.user.needsVerification) navigate('/verify-pending', { replace: true });
        else {
          toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
          navigate(state?.from || '/', { replace: true });
        }
      }
    } catch (err) {
      play('error');
      const fieldErr = err.data?.errors?.[0];
      if (fieldErr?.path && ['name', 'email', 'password'].includes(fieldErr.path)) setErrors({ [fieldErr.path]: fieldErr.message });
      else if (err.status === 403 || err.status === 409) setErrors({ email: err.message });
      else setErrors({ form: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      {/* Tabs */}
      <div className="relative mb-6 grid grid-cols-2 rounded-2xl bg-ink-950 p-1" role="tablist">
        {[
          ['login', 'Sign in', '/login'],
          ['register', 'Join', '/register'],
        ].map(([key, label, to]) => (
          <Link
            key={key}
            to={to}
            replace
            state={state}
            role="tab"
            aria-selected={mode === key}
            onClick={() => { play('click'); setErrors({}); }}
            className={`relative z-10 rounded-xl py-2.5 text-center text-sm font-semibold transition-colors ${mode === key ? 'text-night' : 'text-ink-300 hover:text-ink-50'}`}
          >
            {mode === key && <motion.span layoutId="auth-tab" className="absolute inset-0 -z-10 rounded-xl bg-zap" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            {label}
          </Link>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={mode} initial={{ opacity: 0, x: isRegister ? 16 : -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRegister ? -16 : 16 }} transition={{ duration: 0.2 }}>
          <h2 className="text-2xl font-bold text-ink-50">{isRegister ? 'Join your campus crew' : 'Welcome back'}</h2>
          <p className="mt-1 text-sm text-ink-400">{isRegister ? 'Sign up with your college email. Takes 30 seconds.' : 'Sign in to check on your stuff.'}</p>

          {config.googleClientId && (
            <div className="mt-6">
              <GoogleButton onCredential={onGoogle} text={isRegister ? 'signup_with' : 'continue_with'} />
              <p className="mt-2 text-center text-xs text-ink-500">Use your @{config.collegeDomains[0] || 'college'} Google account</p>
              {config.passwordLogin !== false && (
                <div className="mt-5 flex items-center gap-3 text-xs text-ink-500">
                  <span className="h-px flex-1 bg-ink-700" /> or use email <span className="h-px flex-1 bg-ink-700" />
                </div>
              )}
              {config.passwordLogin === false && errors.form && (
                <p role="alert" className="mt-4 rounded-xl border border-coral/30 bg-coral/10 p-3 text-sm text-coral-fg">{errors.form}</p>
              )}
            </div>
          )}

          {config.passwordLogin !== false && (
          <form onSubmit={onSubmit} noValidate className={config.googleClientId ? 'mt-5 space-y-4' : 'mt-6 space-y-4'}>
            {isRegister && (
              <Field label="Full name" error={errors.name}>
                {(p) => <Input {...p} icon={User} autoComplete="name" placeholder="Aanya Sharma" value={form.name} onChange={set('name')} />}
              </Field>
            )}
            <Field label="College email" error={errors.email} hint={isRegister && config.collegeDomains[0] ? `Must end with @${config.collegeDomains.join(' or @')}` : undefined}>
              {(p) => (
                <Input {...p} icon={Mail} type="email" autoComplete="email" inputMode="email" placeholder={`you@${config.collegeDomains[0] || 'college.edu'}`} value={form.email} onChange={set('email')} />
              )}
            </Field>
            <Field label="Password" error={errors.password} hint={isRegister ? '8+ characters, with a letter and a number' : undefined}>
              {(p) => (
                <Input
                  {...p}
                  icon={Lock}
                  type={showPw ? 'text' : 'password'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  trailing={
                    <button type="button" onClick={() => setShowPw((s) => !s)} className="grid size-9 place-items-center rounded-lg text-ink-400 hover:text-ink-100" aria-label={showPw ? 'Hide password' : 'Show password'}>
                      {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  }
                />
              )}
            </Field>

            {!isRegister && config.passwordResetAvailable !== false && (
              <div className="-mt-1 text-right">
                <Link to="/forgot-password" className="text-sm text-ink-400 hover:text-zap-fg">Forgot password?</Link>
              </div>
            )}

            {errors.form && <p role="alert" className="rounded-xl border border-coral/30 bg-coral/10 p-3 text-sm text-coral-fg">{errors.form}</p>}

            <Button type="submit" size="lg" className="group w-full" loading={submitting} sound={false}>
              {isRegister ? 'Create account' : 'Sign in'}
              {!submitting && <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />}
            </Button>
          </form>
          )}

          {isRegister && (
            <p className="mt-4 text-xs leading-relaxed text-ink-500">
              By joining you agree to our{' '}
              <Link to="/privacy" className="font-medium text-ink-300 underline underline-offset-2 hover:text-zap-fg">Privacy &amp; safety statement</Link>. Your
              email is never shown to other students.
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </AuthLayout>
  );
}
