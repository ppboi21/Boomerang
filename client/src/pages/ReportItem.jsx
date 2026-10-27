import { ArrowLeft, Calendar, Fingerprint, Gift, MapPin } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { ImageUploader } from '../components/ImageUploader';
import { Button } from '../components/ui/Button';
import { ErrorState, Spinner } from '../components/ui/Feedback';
import { Field, Input, Select, TextArea } from '../components/ui/Field';
import { usePrefs } from '../context/PrefsContext';
import { useTitle } from '../hooks/useTitle';
import { api } from '../services/api';
import { CATEGORIES, SENSITIVE_CATEGORIES } from '../utils/constants';
import { toDateInput, todayISO } from '../utils/format';

const EMPTY = { title: '', category: '', description: '', location: '', date: todayISO(), images: [], identifyingDetails: '', reward: '' };

// Handles both /report/:type (create) and /items/:id/edit (edit).
export default function ReportItem() {
  const { type: typeParam, id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { play } = usePrefs();
  const [form, setForm] = useState(EMPTY);
  const [type, setType] = useState(typeParam);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const onBusyChange = useCallback((b) => setUploading(b), []);

  useTitle(editing ? 'Edit report' : type === 'lost' ? 'Report lost item' : 'Report found item');

  useEffect(() => {
    if (!editing) return;
    api(`/items/${id}`)
      .then(({ item }) => {
        if (!item.isOwner) throw new Error('You can only edit your own reports.');
        setType(item.type);
        setForm({
          title: item.title,
          category: item.category,
          description: item.description,
          location: item.location,
          date: toDateInput(item.date),
          images: item.images,
          identifyingDetails: item.identifyingDetails || '',
          reward: item.reward || '',
        });
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [editing, id]);

  if (!editing && !['lost', 'found'].includes(typeParam)) return <Navigate to="/" replace />;
  if (loading) return <Spinner label="Loading report" />;
  if (loadError) return <ErrorState message={loadError} />;

  const isLost = type === 'lost';
  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  function validate() {
    const er = {};
    if (form.title.trim().length < 3) er.title = 'Give it a short title (3+ characters)';
    if (!form.category) er.category = 'Pick a category';
    if (form.description.trim().length < 10) er.description = 'Describe it in a bit more detail (10+ characters)';
    if (form.location.trim().length < 2) er.location = 'Where was it?';
    if (!form.date) er.date = 'Pick a date';
    else if (form.date > todayISO()) er.date = "Date can't be in the future";
    if (!isLost && form.images.length === 0) er.images = 'Add at least one photo so the owner can recognise it';
    return er;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const er = validate();
    setErrors(er);
    if (Object.keys(er).length) {
      play('error');
      document.querySelector('[aria-invalid="true"], [role="alert"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    const body = { ...form, title: form.title.trim(), description: form.description.trim(), location: form.location.trim() };
    if (!isLost) delete body.reward;
    try {
      if (editing) {
        await api(`/items/${id}`, { method: 'PATCH', body });
        toast.success('Report updated');
        navigate(`/items/${id}`, { replace: true });
      } else {
        const { item, matches } = await api('/items', { method: 'POST', body: { ...body, type } });
        play(matches.length ? 'match' : 'success');
        toast.success(isLost ? 'Lost report posted. Fingers crossed! 🤞' : 'Found report posted. Thanks for helping out! 🙌', {
          description: matches.length ? `We spotted ${matches.length} potential match${matches.length > 1 ? 'es' : ''}. See below.` : undefined,
        });
        navigate(`/items/${item.id}`, { replace: true });
      }
    } catch (err) {
      play('error');
      const f = err.data?.errors?.[0];
      if (f?.path) setErrors({ [f.path.split('.')[0]]: f.message });
      else toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const accent = isLost ? 'text-grape-fg' : 'text-zap-fg';

  return (
    <div className="mx-auto max-w-3xl">
      <button type="button" onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100">
        <ArrowLeft className="size-4" aria-hidden /> Back
      </button>
      <h1 className="text-4xl font-extrabold text-ink-50">
        {editing ? 'Edit report' : isLost ? <>I <span className={accent}>lost</span> something</> : <>I <span className={accent}>found</span> something</>}
      </h1>
      <p className="mt-1 text-ink-400">
        {isLost ? 'The more specific, the easier it is for a finder to recognise it.' : "Describe what you found, but keep one detail back so you can check who's really the owner."}
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-6">
        <section className="panel space-y-4 p-5 sm:p-6">
          <h2 className="eyebrow">The item</h2>
          <Field label="Title" error={errors.title}>
            {(p) => <Input {...p} maxLength={80} placeholder={isLost ? 'e.g. Black JBL earbuds case' : 'e.g. Blue steel water bottle'} value={form.title} onChange={set('title')} />}
          </Field>
          <Field label="Category" error={errors.category}>
            {(p) => (
              <Select {...p} value={form.category} onChange={set('category')}>
                <option value="" disabled>Choose a category…</option>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Description" error={errors.description} hint={`${form.description.length}/1000`}>
            {(p) => (
              <TextArea
                {...p}
                maxLength={1000}
                rows={4}
                placeholder={isLost ? 'Colour, brand, stickers, what was inside…' : 'What it looks like and where exactly you left it (e.g. handed to library desk)'}
                value={form.description}
                onChange={set('description')}
              />
            )}
          </Field>
        </section>

        <section className="panel grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <h2 className="eyebrow sm:col-span-2">Where &amp; when</h2>
          <Field label={isLost ? 'Last seen at' : 'Found at'} error={errors.location}>
            {(p) => <Input {...p} icon={MapPin} maxLength={100} placeholder="e.g. Library, 2nd floor" value={form.location} onChange={set('location')} />}
          </Field>
          <Field label={isLost ? 'Approximate date lost' : 'Date found'} error={errors.date}>
            {(p) => <Input {...p} icon={Calendar} type="date" max={todayISO()} value={form.date} onChange={set('date')} />}
          </Field>
        </section>

        <section className="panel space-y-3 p-5 sm:p-6">
          <h2 className="eyebrow">Photos {isLost ? <span className="normal-case tracking-normal text-ink-500">(optional)</span> : <span className="text-zap-fg">(required)</span>}</h2>
          <ImageUploader
            value={form.images}
            onChange={set('images')}
            sensitive={SENSITIVE_CATEGORIES.includes(form.category)}
            onBusyChange={onBusyChange}
            error={errors.images}
          />
        </section>

        <section className="panel space-y-4 p-5 sm:p-6">
          <h2 className="eyebrow">Extras</h2>
          <Field
            label={<span className="inline-flex items-center gap-1.5"><Fingerprint className="size-4 text-zap-fg" aria-hidden /> Private identifying details</span>}
            optional
            hint="Only you will see this. Use it to check that someone's claim is genuine (e.g. a scratch, a lock-screen photo, contents)."
          >
            {(p) => <TextArea {...p} rows={2} maxLength={500} placeholder="e.g. Small dent near the cap, name written inside" value={form.identifyingDetails} onChange={set('identifyingDetails')} />}
          </Field>
          {isLost && (
            <Field label="Reward" optional hint="Totally optional. Shown publicly.">
              {(p) => <Input {...p} icon={Gift} maxLength={100} placeholder="e.g. Treat at the canteen" value={form.reward} onChange={set('reward')} />}
            </Field>
          )}
        </section>

        <div className="sticky bottom-24 z-10 flex gap-3 rounded-2xl border border-ink-700 bg-ink-900/90 p-3 backdrop-blur-xl lg:bottom-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" variant={isLost ? 'lost' : 'primary'} className="flex-1" size="lg" loading={submitting} disabled={uploading} sound={false}>
            {uploading ? 'Waiting for photos…' : editing ? 'Save changes' : isLost ? 'Post lost report' : 'Post found report'}
          </Button>
        </div>
      </form>
    </div>
  );
}
