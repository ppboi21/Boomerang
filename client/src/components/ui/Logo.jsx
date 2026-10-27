import { Link } from 'react-router';

export function BoomerangMark({ className = 'size-7' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M8 20c9-3 16 4 24 16 8-12 15-19 24-16-3 12-13 25-24 30C21 45 11 32 8 20z" fill="currentColor" />
    </svg>
  );
}

// On hover the boomerang tilts like it's about to be thrown.
const SIZES = {
  sm: ['size-8 min-[380px]:size-9', 'text-xl min-[380px]:text-2xl'],
  md: ['size-9 min-[380px]:size-11', 'text-2xl min-[380px]:text-[28px]'],
  lg: ['size-14', 'text-4xl'],
};

export function Logo({ to = '/', className = '', size = 'md' }) {
  const [mark, text] = SIZES[size];
  return (
    <Link to={to} className={`group inline-flex items-center gap-2 ${className}`} aria-label="boomerang home">
      <span className="text-zap-fg drop-shadow-[0_0_14px_rgba(200,255,46,0.35)] transition-transform duration-500 group-hover:-rotate-[25deg]">
        <BoomerangMark className={mark} />
      </span>
      <span className={`font-display font-extrabold tracking-tight text-ink-50 ${text} leading-none`}>
        boomerang<span className="text-zap-fg">.</span>
      </span>
    </Link>
  );
}
