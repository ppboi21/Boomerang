import { Camera, LoaderCircle, Mail, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import { ItemGrid } from '../components/ItemCard';
import { Avatar } from '../components/ui/Avatar';
import { VerifiedBadge } from '../components/ui/Badges';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback';
import { Field, Input, TextArea } from '../components/ui/Field';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTitle } from '../hooks/useTitle';
import { api, uploadImage } from '../services/api';
import { formatDate } from '../utils/format';
import { prepareImage } from '../utils/image';

// /profile (me, editable) and /users/:id (someone else, read-only).
export default function Profile() {
  const { id } = useParams();
  const { user: me, setUser } = useAuth();
  const { isOnline } = useSocket();
  const userId = id || me.id;
  const isMe = userId === me.id;
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  useTitle(isMe ? 'Your profile' : data?.user.name);

  const load = () => {
    setError('');
    api(`/users/${userId}`).then(setData).catch((err) => setError(err.message));
  };
  useEffect(() => { setData(null); load(); }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <div className="space-y-4"><Skeleton className="h-48 rounded-[2rem]" /><Skeleton className="h-64" /></div>;

  const profile = isMe ? { ...data.user, ...me } : data.user;
  const active = data.items.filter((i) => i.status !== 'resolved');
  const resolved = data.items.filter((i) => i.status === 'resolved');

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-ink-800 bg-ink-900 shadow-card p-6 sm:p-8">
        <div className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-grape/15 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          {isMe ? <AvatarEditor user={me} onSaved={setUser} /> : <Avatar user={profile} size="xl" online={isOnline(profile.id)} />}
          <div className="min-w-0 flex-1">
            <h1 className="text-4xl font-extrabold text-ink-50">{profile.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="rounded-full bg-ink-800 px-2.5 py-0.5 font-medium text-ink-200">{profile.school || 'Student'}</span>
              {profile.isVerified && <VerifiedBadge domain={data.user.emailDomain} />}
              <span className="text-ink-500">Joined {formatDate(profile.createdAt)}</span>
            </div>
            {isMe && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-400">
                <Mail className="size-3.5" aria-hidden /> {me.email} <span className="text-ink-600">· only visible to you</span>
              </p>
            )}
            {profile.bio && !editing && <p className="mt-3 max-w-xl text-ink-300">{profile.bio}</p>}
          </div>
          {isMe && !editing && <Button variant="secondary" onClick={() => setEditing(true)}><Pencil className="size-4" /> Edit profile</Button>}
        </div>
        {isMe && editing && <ProfileForm user={me} onDone={(u) => { if (u) setUser(u); setEditing(false); }} />}
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Count label="Active reports" value={active.length} />
        <Count label="Resolved" value={resolved.length} />
        <Count label="Total posted" value={data.items.length} />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold text-ink-50">Active reports</h2>
        {active.length ? <ItemGrid items={active} /> : <EmptyState title="No active reports">{isMe ? 'Your open lost/found reports show up here.' : 'Nothing open right now.'}</EmptyState>}
      </section>
      {resolved.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold text-ink-50">Resolved</h2>
          <ItemGrid items={resolved} />
        </section>
      )}
    </div>
  );
}

function Count({ label, value }) {
  return (
    <div className="rounded-3xl border border-ink-800 bg-ink-900 shadow-card p-4">
      <p className="font-display text-3xl font-extrabold text-ink-50">{value}</p>
      <p className="text-xs text-ink-400">{label}</p>
    </div>
  );
}

function ProfileForm({ user, onDone }) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const d = await api('/users/me', { method: 'PATCH', body: { name: name.trim(), bio: bio.trim() } });
      toast.success('Profile updated');
      onDone(d.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="relative mt-6 grid gap-4 border-t border-ink-800 pt-6 sm:grid-cols-2">
      <Field label="Name" error={error}>
        {(p) => <Input {...p} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />}
      </Field>
      <Field label="Short bio" optional hint={`${bio.length}/160 · e.g. "2nd year CSE, usually in the library"`}>
        {(p) => <TextArea {...p} rows={2} maxLength={160} value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-12" />}
      </Field>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" loading={saving}>Save</Button>
        <Button variant="ghost" onClick={() => onDone()}>Cancel</Button>
      </div>
    </form>
  );
}

function AvatarEditor({ user, onSaved }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const { url } = await uploadImage(await prepareImage(file, 600));
      const d = await api('/users/me', { method: 'PATCH', body: { avatarUrl: url } });
      onSaved(d.user);
      toast.success('Photo updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto() {
    setBusy(true);
    try {
      const d = await api('/users/me', { method: 'PATCH', body: { avatarUrl: '' } });
      onSaved(d.user);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative w-fit">
      <Avatar user={user} size="xl" />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="absolute -right-1 -bottom-1 grid size-9 place-items-center rounded-full border-4 border-ink-900 bg-zap text-night"
        aria-label="Change profile photo"
      >
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
      </button>
      {user.avatarUrl && !busy && (
        <button type="button" onClick={removePhoto} className="absolute -bottom-1 -left-1 grid size-8 place-items-center rounded-full border-4 border-ink-900 bg-ink-700 text-ink-200 hover:text-coral-fg" aria-label="Remove profile photo">
          <Trash2 className="size-3.5" />
        </button>
      )}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pick} />
    </div>
  );
}
