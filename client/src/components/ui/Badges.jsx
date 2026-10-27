import { BadgeCheck, CircleCheck } from 'lucide-react';
import { STATUS, TYPE } from '../../utils/constants';

export function StatusBadge({ status, className = '' }) {
  const s = STATUS[status] || STATUS.open;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur ${s.className} ${className}`}>
      {status === 'resolved' ? <CircleCheck className="size-3" aria-hidden /> : <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {s.label}
    </span>
  );
}

export function TypeBadge({ type, className = '' }) {
  const t = TYPE[type];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wider uppercase ${t.className} ${className}`}>
      {t.label}
    </span>
  );
}

export function VerifiedBadge({ domain, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium text-zap-fg ${className}`}>
      <BadgeCheck className="size-3.5" aria-hidden />
      Verified{domain ? ` @${domain}` : ' college email'}
    </span>
  );
}
