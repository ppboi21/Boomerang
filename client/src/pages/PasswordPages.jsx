import { ArrowLeft, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';
import { useAuth } from '../context/AuthContext';
import { useTitle } from '../hooks/useTitle';
import AuthLayout from '../layouts/AuthLayout';
import { api } from '../services/api';
import { DevLinkBox } from './VerifyPages';

export function ForgotPassword() {
  useTitle('Forgot password');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      setResult(await api('/auth/forgot-password', { method: 'POST', body: { email: email.trim() } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <Link to="/login" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-400 hover:text-ink-100">
        <ArrowLeft className="size-4" aria-hidden /> Back to sign in
      </Link>
      <h2 className="text-2xl font-bold text-ink-50">Forgot your password?</h2>
      {result ? (
        <>
          <p className="mt-2 text-sm text-ink-300">{result.message} The link is valid for 30 minutes.</p>
          <DevLinkBox link={result.devLink} label="Open reset link" />
        </>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
          <p className="text-sm text-ink-400">Enter your college email and we'll send you a reset link.</p>
          <Field label="College email" error={error}>
            {(p) => <Input {...p} icon={Mail} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!email}>Send reset link</Button>
        </form>
      )}
    </AuthLayout>
  );
}

export function ResetPassword() {
  useTitle('Reset password');
  const [params] = useSearchParams();
  const { acceptSession } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords don't match");
    setError('');
    setLoading(true);
    try {
      const data = await api('/auth/reset-password', { method: 'POST', body: { token: params.get('token') || '', password } });
      acceptSession(data);
      toast.success('Password updated. You are signed in.');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.data?.errors?.[0]?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-ink-50">Choose a new password</h2>
      <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
        <Field label="New password" hint="8+ characters, with a letter and a number">
          {(p) => <Input {...p} icon={Lock} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
        </Field>
        <Field label="Confirm password" error={error}>
          {(p) => <Input {...p} icon={Lock} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!password || !confirm}>Update password</Button>
      </form>
    </AuthLayout>
  );
}
