import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Crest } from './ui/Crest';
import { Logo } from './ui/Logo';

function Column({ title, links }) {
  return (
    <div>
      <p className="eyebrow mb-3">{title}</p>
      <ul className="space-y-2">
        {links.map(([label, to]) => (
          <li key={to}>
            <Link to={to} className="text-sm text-ink-300 transition-colors hover:text-zap-fg">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter({ className = '' }) {
  const { user } = useAuth();
  const year = new Date().getFullYear();
  return (
    <footer className={`relative border-t border-ink-800 ${className}`}>
      <div className="mx-auto grid max-w-7xl 2xl:max-w-[88rem] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.3fr_2fr] lg:px-8">
        <div className="max-w-sm">
          <Logo size="sm" to={user ? '/' : '/login'} />
          <p className="mt-4 text-sm leading-relaxed text-ink-400">
            The lost &amp; found for SST students. Report it, match it, chat it out, get it back.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-ink-400">
            <Crest className="h-6 w-5" />
            <span>Only for SST students</span>
          </div>
        </div>
        <nav className="grid grid-cols-2 gap-8 sm:grid-cols-3" aria-label="Footer">
          <Column
            title="Legal"
            links={[
              ['Terms & conditions', '/terms'],
              ['Privacy & safety', '/privacy'],
              ['Community guidelines', '/guidelines'],
            ]}
          />
          <Column
            title="Stay safe"
            links={[
              ['Safe hand-overs', '/safety/handovers'],
              ['Photo privacy', '/safety/photos'],
              ['Chatting safely', '/safety/chat'],
            ]}
          />
          <Column
            title={user ? 'Portal' : 'Get started'}
            links={
              user
                ? [['Lost items', '/lost'], ['Found items', '/found'], ['My reports', '/my-reports']]
                : [['Sign in', '/login'], ['Create account', '/register']]
            }
          />
        </nav>
      </div>
      <div className="border-t border-ink-800">
        <div className="mx-auto flex max-w-7xl 2xl:max-w-[88rem] flex-col gap-1 px-4 py-4 text-xs text-ink-500 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p>© {year} boomerang. All rights reserved.</p>
          <p>
            By using boomerang you agree to the <Link to="/terms" className="underline underline-offset-2 hover:text-ink-200">Terms</Link> and{' '}
            <Link to="/privacy" className="underline underline-offset-2 hover:text-ink-200">Privacy &amp; safety</Link> statement.
          </p>
        </div>
      </div>
    </footer>
  );
}
