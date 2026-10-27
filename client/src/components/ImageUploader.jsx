import { Camera, ImagePlus, LoaderCircle, RefreshCw, ShieldCheck, Trash2, TriangleAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { uploadImage } from '../services/api';
import { MAX_IMAGE_MB } from '../utils/constants';
import { imgUrl, prepareImage } from '../utils/image';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif';
const OK_TYPES = /^image\/(jpeg|png|webp|heic|heif)$/;

/**
 * Photo picker with camera + gallery inputs, previews, progress, replace/remove.
 * value: string[] of uploaded URLs. Uploads happen immediately on pick, so the
 * form only submits URLs.
 */
export function ImageUploader({ value, onChange, max = 3, sensitive = false, onBusyChange, error }) {
  const [pending, setPending] = useState([]); // { key, preview, progress, error, replaceIndex }
  const [ack, setAck] = useState(false);
  const [dragging, setDragging] = useState(false);
  const galleryRef = useRef(null);
  const cameraRef = useRef(null);
  const replaceIndex = useRef(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const busy = pending.some((p) => !p.error);
  useEffect(() => onBusyChange?.(busy), [busy, onBusyChange]);
  useEffect(() => () => pending.forEach((p) => URL.revokeObjectURL(p.preview)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const locked = sensitive && !ack;
  const slotsLeft = max - value.length - pending.filter((p) => !p.error && p.replaceIndex == null).length;

  function validate(file) {
    if (file.type && !OK_TYPES.test(file.type)) return 'Only JPG, PNG, WEBP or HEIC photos';
    if (file.size > 25 * 1024 * 1024) return 'That file is far too large';
    return null;
  }

  async function handleFiles(fileList, replaceAt = null) {
    const files = [...fileList].slice(0, replaceAt != null ? 1 : Math.max(0, slotsLeft));
    for (const raw of files) {
      const key = crypto.randomUUID?.() || String(Math.random());
      const preview = URL.createObjectURL(raw);
      const invalid = validate(raw);
      setPending((p) => [...p, { key, preview, progress: 0, error: invalid, replaceIndex: replaceAt }]);
      if (invalid) continue;
      try {
        const file = await prepareImage(raw);
        if (file.size > MAX_IMAGE_MB * 1024 * 1024) throw new Error(`Photo is over ${MAX_IMAGE_MB} MB even after compression`);
        const { url } = await uploadImage(file, (progress) =>
          setPending((p) => p.map((x) => (x.key === key ? { ...x, progress } : x))),
        );
        const current = valueRef.current;
        onChange(replaceAt != null ? current.map((u, i) => (i === replaceAt ? url : u)) : [...current, url]);
        setPending((p) => p.filter((x) => x.key !== key));
        URL.revokeObjectURL(preview);
      } catch (err) {
        setPending((p) => p.map((x) => (x.key === key ? { ...x, error: err.message || 'Upload failed' } : x)));
      }
    }
  }

  const onPick = (e) => {
    if (e.target.files?.length) handleFiles(e.target.files, replaceIndex.current);
    replaceIndex.current = null;
    e.target.value = '';
  };

  const openGallery = (replaceAt = null) => {
    replaceIndex.current = replaceAt;
    galleryRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3 rounded-2xl border border-sun/25 bg-sun/5 p-3.5 text-sm">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-sun-fg" aria-hidden />
        <div className="text-ink-200">
          <p className="font-medium text-sun-fg">Protect personal info before uploading</p>
          <p className="mt-0.5 text-ink-300">
            Cover ID numbers, card numbers, faces and addresses with your thumb or a sticky note. Photos are visible to everyone on campus.
          </p>
          {sensitive && (
            <label className="mt-2.5 flex cursor-pointer items-start gap-2 font-medium text-ink-100">
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 size-4 accent-[#c8ff2e]" />
              I've hidden ID numbers, card numbers and other personal details in my photos.
            </label>
          )}
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); if (!locked) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!locked && slotsLeft > 0) handleFiles(e.dataTransfer.files);
        }}
        className={`rounded-3xl border-2 border-dashed p-4 transition-colors ${
          error ? 'border-coral/50' : dragging ? 'border-zap bg-zap/5' : 'border-ink-700 bg-ink-900/50'
        }`}
      >
        {(value.length > 0 || pending.length > 0) && (
          <ul className="mb-4 grid grid-cols-3 gap-3">
            <AnimatePresence>
              {value.map((url, i) => (
                <motion.li key={url} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="group relative aspect-square overflow-hidden rounded-2xl bg-ink-800">
                  <img src={imgUrl(url, 300)} alt={`Photo ${i + 1}`} className="size-full object-cover" />
                  <div className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1">
                    <TileButton label={`Replace photo ${i + 1}`} onClick={() => openGallery(i)} disabled={locked}><RefreshCw className="size-3.5" /></TileButton>
                    <TileButton label={`Remove photo ${i + 1}`} onClick={() => onChange(value.filter((_, j) => j !== i))}><Trash2 className="size-3.5" /></TileButton>
                  </div>
                </motion.li>
              ))}
              {pending.map((p) => (
                <motion.li key={p.key} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative aspect-square overflow-hidden rounded-2xl bg-ink-800">
                  <img src={p.preview} alt="" className="size-full object-cover opacity-50" />
                  <div className="absolute inset-0 grid place-items-center p-2 text-center">
                    {p.error ? (
                      <div className="rounded-xl bg-ink-950/85 p-2 text-xs text-coral-fg">
                        {p.error}
                        <button type="button" className="mt-1 block w-full font-semibold text-ink-100 underline" onClick={() => setPending((x) => x.filter((y) => y.key !== p.key))}>
                          Dismiss
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-xs font-semibold text-ink-50">
                        <LoaderCircle className="size-5 animate-spin text-zap-fg" aria-hidden />
                        {Math.round(p.progress * 100)}%
                      </div>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        {slotsLeft > 0 ? (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            {value.length === 0 && pending.length === 0 && (
              <div className="grid size-12 place-items-center rounded-2xl bg-ink-800 text-zap-fg">
                <ImagePlus className="size-6" aria-hidden />
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              <PickButton icon={Camera} onClick={() => cameraRef.current?.click()} disabled={locked}>Take photo</PickButton>
              <PickButton icon={ImagePlus} onClick={() => openGallery()} disabled={locked}>Choose from gallery</PickButton>
            </div>
            <p className="text-xs text-ink-400">
              {locked ? 'Tick the box above to enable uploads.' : `Up to ${max} photos · JPG, PNG, WEBP or HEIC · drag & drop works too`}
            </p>
          </div>
        ) : (
          <p className="flex items-center justify-center gap-1.5 text-xs text-ink-400">
            <ShieldCheck className="size-3.5" aria-hidden /> Maximum of {max} photos reached
          </p>
        )}

        {/* capture="environment" asks phones to open the rear camera. Not every
            browser honours it - the gallery input is always available as a fallback. */}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} />
        <input ref={galleryRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={onPick} />
      </div>
      {error && <p role="alert" className="text-sm text-coral-fg">{error}</p>}
    </div>
  );
}

function PickButton({ icon: Icon, children, ...props }) {
  return (
    <button
      type="button"
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-ink-700 bg-ink-800 px-3.5 text-sm font-semibold text-ink-50 transition-colors hover:border-zap/60 hover:text-zap-fg disabled:pointer-events-none disabled:opacity-40"
      {...props}
    >
      <Icon className="size-4" aria-hidden /> {children}
    </button>
  );
}

function TileButton({ label, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="grid size-7 place-items-center rounded-lg bg-ink-950/80 text-ink-50 backdrop-blur hover:bg-ink-950 disabled:opacity-40"
      {...props}
    >
      {children}
    </button>
  );
}
