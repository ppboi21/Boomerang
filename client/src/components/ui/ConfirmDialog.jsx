import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

export function ConfirmDialog({ open, title, children, confirmLabel = 'Confirm', variant = 'primary', loading, onConfirm, onClose }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    cancelRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            initial={{ scale: 0.94, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 8 }}
            className="relative w-full max-w-md rounded-3xl border border-ink-700 bg-ink-850 p-6 shadow-2xl"
          >
            <h2 id="confirm-title" className="text-xl font-bold text-ink-50">{title}</h2>
            <div className="mt-2 text-sm text-ink-300">{children}</div>
            <div className="mt-6 flex justify-end gap-2">
              <Button ref={cancelRef} variant="ghost" onClick={onClose}>Cancel</Button>
              <Button variant={variant} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
