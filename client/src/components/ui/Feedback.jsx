import { LoaderCircle, TriangleAlert } from 'lucide-react';
import { Button } from './Button';

export const Skeleton = ({ className = '' }) => <div className={`skeleton ${className}`} aria-hidden />;

export function Spinner({ label = 'Loading', className = '' }) {
  return (
    <div role="status" className={`flex items-center justify-center gap-2 py-10 text-sm text-ink-400 ${className}`}>
      <LoaderCircle className="size-5 animate-spin text-zap-fg" aria-hidden />
      {label}…
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center rounded-3xl border border-dashed border-ink-700 px-6 py-12 text-center ${className}`}>
      {Icon && (
        <div className="relative mb-4 grid size-16 place-items-center rounded-2xl bg-ink-800 text-ink-300">
          <Icon className="size-7" aria-hidden />
          <span className="absolute -top-1 -right-1 size-3 rounded-full bg-zap" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-ink-50">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-sm text-ink-400">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry, className = '' }) {
  return (
    <div role="alert" className={`flex flex-col items-center rounded-3xl border border-coral/25 bg-coral/5 px-6 py-10 text-center ${className}`}>
      <TriangleAlert className="mb-3 size-7 text-coral-fg" aria-hidden />
      <p className="font-medium text-ink-50">Something went wrong</p>
      <p className="mt-1 max-w-sm text-sm text-ink-300">{message}</p>
      {onRetry && <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}
