import { FolderOpen, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { ItemGrid } from '../components/ItemCard';
import { ButtonLink } from '../components/ui/Button';
import { EmptyState, ErrorState } from '../components/ui/Feedback';
import { useTitle } from '../hooks/useTitle';
import { api } from '../services/api';

const TABS = [
  { key: 'active', label: 'Active', test: (i) => i.status !== 'resolved' },
  { key: 'lost', label: 'Lost', test: (i) => i.type === 'lost' },
  { key: 'found', label: 'Found', test: (i) => i.type === 'found' },
  { key: 'resolved', label: 'Resolved', test: (i) => i.status === 'resolved' },
];

export default function MyReports() {
  useTitle('My reports');
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('active');

  const load = () => {
    setError('');
    api('/items/mine').then((d) => setItems(d.items)).catch((err) => setError(err.message));
  };
  useEffect(load, []);

  const shown = items?.filter(TABS.find((t) => t.key === tab).test) || [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-ink-50">My reports</h1>
          <p className="mt-1 text-ink-400">Everything you've posted. Open a report to edit it, mark it resolved or delete it.</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink to="/report/lost" variant="lost" size="sm"><Plus className="size-4" /> Lost</ButtonLink>
          <ButtonLink to="/report/found" size="sm"><Plus className="size-4" /> Found</ButtonLink>
        </div>
      </header>

      <div className="inline-flex rounded-2xl border border-ink-800 bg-ink-900 shadow-card p-1" role="tablist">
        {TABS.map((t) => {
          const count = items?.filter(t.test).length;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`relative rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${tab === t.key ? 'text-night' : 'text-ink-300 hover:text-ink-50'}`}
            >
              {tab === t.key && <motion.span layoutId="mine-tab" className="absolute inset-0 rounded-xl bg-zap" />}
              <span className="relative">{t.label}{count !== undefined ? ` · ${count}` : ''}</span>
            </button>
          );
        })}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items && shown.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Nothing here" action={<ButtonLink to="/report/lost" variant="secondary" size="sm">Report something</ButtonLink>}>
          {tab === 'resolved' ? 'Resolved reports will show up here.' : "You haven't posted anything in this tab yet."}
        </EmptyState>
      ) : (
        <ItemGrid items={shown} loading={!items} skeletons={4} />
      )}
    </div>
  );
}
