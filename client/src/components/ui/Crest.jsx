// Flat vector version of the SST crest (viewBox 0 0 40 48).
const SHIELD = 'M2 2H38V20.8C38 33 29.9 40.5 20 46C10.1 40.5 2 33 2 20.8Z';
const LINE = 'M4.2 4.5H35.8V21C35.8 31.8 28.7 38.4 20 43.2C11.3 38.4 4.2 31.8 4.2 21Z';
const EMBLEM = 'M11 23.5H21.4V33.4H11ZM14.1 26.4V30.5H18.4V26.4Z M11 22.3H22.7V33.4L29 27.9V15.3H17.5Z';

export function Crest({ className = 'h-7 w-6' }) {
  return (
    <svg viewBox="0 0 40 48" className={className} role="img" aria-label="SST crest">
      <path d={SHIELD} fill="#0a43c4" />
      <path d={LINE} fill="none" stroke="#fff" strokeWidth="1.1" />
      <path d={EMBLEM} fill="#fff" fillRule="evenodd" />
    </svg>
  );
}

// "Only for SST students" pill.
export function SchoolsPill({ className = '' }) {
  return (
    <div className={`inline-flex items-center gap-2.5 rounded-full border border-ink-700 bg-ink-900/80 py-1.5 pr-4 pl-2 shadow-card backdrop-blur ${className}`}>
      <Crest className="h-7 w-6 drop-shadow-sm" />
      <span className="text-sm font-semibold text-ink-100">Only for SST students</span>
    </div>
  );
}
