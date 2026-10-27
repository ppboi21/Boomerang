import { CircleCheck, LoaderCircle, MailCheck, TriangleAlert, Wrench } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Splash } from '../components/RouteGuards';
import { Button, ButtonLink } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { usePrefs } from '../context/PrefsContext';
import { useTitle } from '../hooks/useTitle';
import AuthLayout from '../layouts/AuthLayout';
import { api } from '../services/api';

// Only shown when the backend has no email provider configured (never in production).
export function DevLinkBox({ link, label = 'Open verification link' }) {
  if (!link) return null;
  const path = new URL(link).pathname + new URL(link).search;
  return (
    <div className="mt-5 rounded-2xl border border-cobalt/40 bg-cobalt/10 p-4 text-left text-sm">
      <p className="flex items-center gap-2 font-semibold text-cobalt-fg">
        <Wrench className="size-4" aria-hidden /> Local dev mode: email not configured
      </p>
      <p className="mt-1 text-ink-300">
        No email was sent. In production this link only arrives in the inbox. It's also printed in the server terminal.
      </p>
      <Link to={path} className="mt-3 inline-flex font-semibold text-ink-50 underline decoration-cobalt-fg underline-offset-4">{label} →</Link>
    </div>
  );
}

export function VerifyPending() {
  useTitle('Check your inbox');
  const { user, loading, signOut, devLink, setDevLink } = useAuth();
  const { state } = useLocation();
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.needsVerification) return <Navigate to="/" replace />;

  async function resend() {
    setSending(true);
    try {
      const d = await api('/auth/resend-verification', { method: 'POST' });
      toast.success(d.message);
      if (d.devLink) setDevLink(d.devLink);
      setCooldown(30);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <AuthLayout>
      <div className="text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-zap/15 text-zap-fg">
          <MailCheck className="size-8" aria-hidden />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-ink-50">Check your college inbox</h2>
        <p className="mt-2 text-sm text-ink-300">
          We sent a verification link to <span className="font-semibold break-all text-ink-50">{user.email}</span>. Click it to unlock the portal. Check
          spam too.
        </p>
        {state?.emailSent === false && (
          <p className="mt-3 rounded-xl bg-coral/10 p-3 text-sm text-coral-fg">We couldn't send the email just now. Press "Resend" in a minute.</p>
        )}
        <DevLinkBox link={devLink} />
        <div className="mt-6 flex flex-col gap-2">
          <Button variant="secondary" loading={sending} disabled={cooldown > 0} onClick={resend}>
            {cooldown ? `Resend in ${cooldown}s` : 'Resend email'}
          </Button>
          <Button variant="ghost" onClick={signOut}>Use a different account</Button>
        </div>
      </div>
    </AuthLayout>
  );
}

export function VerifyEmail() {
  useTitle('Verifying');
  const [params] = useSearchParams();
  const { acceptSession } = useAuth();
  const { play } = usePrefs();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'loading' });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode runs effects twice; tokens are single-use
    ran.current = true;
    const token = params.get('token');
    if (!token) return setState({ status: 'error', message: 'This link is missing its token.' });
    api('/auth/verify-email', { method: 'POST', body: { token } })
      .then((data) => {
        acceptSession(data);
        play('success');
        setState({ status: 'ok' });
        setTimeout(() => navigate('/', { replace: true }), 1500);
      })
      .catch((err) => setState({ status: 'error', message: err.message }));
  }, [params, acceptSession, navigate, play]);

  return (
    <AuthLayout>
      <div className="py-4 text-center" role="status">
        {state.status === 'loading' && (
          <>
            <LoaderCircle className="mx-auto size-10 animate-spin text-zap-fg" aria-hidden />
            <p className="mt-4 text-ink-200">Verifying your email…</p>
          </>
        )}
        {state.status === 'ok' && (
          <>
            <CircleCheck className="mx-auto size-12 text-zap-fg" aria-hidden />
            <h2 className="mt-4 text-2xl font-bold text-ink-50">You're verified!</h2>
            <p className="mt-1 text-sm text-ink-300">Taking you to campus…</p>
          </>
        )}
        {state.status === 'error' && (
          <>
            <TriangleAlert className="mx-auto size-12 text-coral-fg" aria-hidden />
            <h2 className="mt-4 text-2xl font-bold text-ink-50">Link didn't work</h2>
            <p className="mt-1 text-sm text-ink-300">{state.message}</p>
            <ButtonLink to="/login" variant="secondary" className="mt-6">Sign in to request a new link</ButtonLink>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
