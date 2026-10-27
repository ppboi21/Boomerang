import { ChevronDown } from 'lucide-react';
import { forwardRef, useId } from 'react';

// Label + control + hint/error, wired up for screen readers.
export function Field({ label, hint, error, optional, children, className = '' }) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
          {optional && <span className="ml-1.5 font-normal text-ink-500">optional</span>}
        </label>
      )}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {error ? (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm text-coral-fg">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ icon: Icon, className = '', trailing, ...props }, ref) {
  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-400" aria-hidden />}
      <input ref={ref} className={`input ${Icon ? 'pl-10' : ''} ${trailing ? 'pr-12' : ''} ${className}`} {...props} />
      {trailing && <div className="absolute top-1/2 right-1.5 -translate-y-1/2">{trailing}</div>}
    </div>
  );
});

export const TextArea = forwardRef(function TextArea({ className = '', ...props }, ref) {
  return <textarea ref={ref} className={`input ${className}`} {...props} />;
});

export const Select = forwardRef(function Select({ className = '', children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={`input ${className}`} {...props}>{children}</select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
    </div>
  );
});
