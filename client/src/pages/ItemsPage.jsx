import { ChevronLeft, ChevronRight, Plus, SearchX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { FilterBar } from '../components/FilterBar';
import { ItemGrid } from '../components/ItemCard';
import { ButtonLink } from '../components/ui/Button';
import { EmptyState, ErrorState } from '../components/ui/Feedback';
import { useDebounce } from '../hooks/useDebounce';
import { useTitle } from '../hooks/useTitle';
import { api } from '../services/api';

const COPY = {
  lost: { title: 'Lost items', sub: 'Things people are looking for. Seen one of these? Message the owner.', cta: 'Report lost item', variant: 'lost', dot: 'bg-grape' },
  found: { title: 'Found items', sub: 'Things picked up around campus. Recognise yours? Contact the finder.', cta: 'Report found item', variant: 'primary', dot: 'bg-zap' },
  all: { title: 'Search everything', sub: 'Lost and found reports across campus.', dot: 'bg-cobalt' },
};
const FILTER_KEYS = ['category', 'location', 'from', 'to', 'status', 'sort'];

// Filters live in the URL (?q=&category=…) so they survive refresh and back/forward.
export default function ItemsPage({ type }) {
  const copy = COPY[type || 'all'];
  useTitle(copy.title);
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') || '');
  const debounced = useDebounce(search);
  const [state, setState] = useState({ loading: true, items: [], total: 0, pages: 1, error: '' });
  const page = Number(params.get('page')) || 1;

  const filters = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || '']));

  const update = (patch, resetPage = true) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
    if (resetPage && !('page' in patch)) next.delete('page');
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if ((params.get('q') || '') !== debounced) update({ q: debounced });
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  // keep the input in sync when the URL changes from elsewhere (e.g. top search bar)
  const urlQ = params.get('q') || '';
  useEffect(() => { if (urlQ !== debounced) setSearch(urlQ); }, [urlQ]); // eslint-disable-line react-hooks/exhaustive-deps

  const queryKey = `${type}|${params.toString()}`;
  useEffect(() => {
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: '' }));
    api('/items', { query: { type, q: urlQ, ...filters, page, limit: 12 }, signal: ctrl.signal })
      .then((d) => setState({ loading: false, items: d.items, total: d.total, pages: d.pages, error: '' }))
      .catch((err) => err.name !== 'AbortError' && setState((s) => ({ ...s, loading: false, error: err.message })));
    return () => ctrl.abort();
  }, [queryKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-4xl font-extrabold text-ink-50">
            <span className={`size-3 rounded-full ${copy.dot}`} aria-hidden />
            {copy.title}
          </h1>
          <p className="mt-1 text-ink-400">{copy.sub}</p>
        </div>
        {copy.cta && (
          <ButtonLink to={`/report/${type}`} variant={copy.variant}>
            <Plus className="size-4" aria-hidden /> {copy.cta}
          </ButtonLink>
        )}
      </header>

      <FilterBar filters={filters} onChange={update} searchValue={search} onSearchChange={setSearch} />

      <p className="text-sm text-ink-400" aria-live="polite">
        {state.loading ? 'Searching…' : `${state.total} result${state.total === 1 ? '' : 's'}`}
      </p>

      {state.error ? (
        <ErrorState message={state.error} onRetry={() => update({}, false)} />
      ) : !state.loading && state.items.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No matches"
          action={copy.cta && <ButtonLink to={`/report/${type}`} variant="secondary" size="sm">{copy.cta}</ButtonLink>}
        >
          Try fewer words, another category or a wider date range.
        </EmptyState>
      ) : (
        <ItemGrid items={state.items} loading={state.loading} />
      )}

      {state.pages > 1 && (
        <nav className="flex items-center justify-center gap-3" aria-label="Pagination">
          <PageButton disabled={page <= 1} onClick={() => update({ page: String(page - 1) }, false)} label="Previous page"><ChevronLeft className="size-4" /></PageButton>
          <span className="text-sm text-ink-300">Page {page} of {state.pages}</span>
          <PageButton disabled={page >= state.pages} onClick={() => update({ page: String(page + 1) }, false)} label="Next page"><ChevronRight className="size-4" /></PageButton>
        </nav>
      )}
    </div>
  );
}

function PageButton({ children, label, ...props }) {
  return (
    <button type="button" aria-label={label} className="grid size-10 place-items-center rounded-xl border border-ink-700 text-ink-200 hover:border-ink-500 disabled:opacity-30" {...props}>
      {children}
    </button>
  );
}
