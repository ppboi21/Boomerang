import { MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { CATEGORIES } from '../utils/constants';
import { Input, Select } from './ui/Field';

// Controlled by the page through `filters` + `onChange(patch)`; the page keeps
// them in the URL so results survive refresh and can be shared.
export function FilterBar({ filters, onChange, searchValue, onSearchChange, showStatus = true }) {
  const advancedActive = Boolean(filters.location || filters.from || filters.to || (filters.status && filters.status !== 'active'));
  const [open, setOpen] = useState(advancedActive);
  const clear = () => {
    onSearchChange('');
    onChange({ category: '', location: '', from: '', to: '', status: '', sort: '' });
  };
  const anyActive = Boolean(searchValue || filters.category || advancedActive || (filters.sort && filters.sort !== 'newest'));

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            icon={Search}
            type="search"
            placeholder="Search by name, description or place…"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search items"
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={`inline-flex h-12 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors ${
            open || advancedActive ? 'border-zap/50 bg-zap/10 text-zap-fg' : 'border-ink-700 bg-ink-900 text-ink-200 hover:border-ink-600'
          }`}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Category">
        <Chip active={!filters.category} onClick={() => onChange({ category: '' })}>All</Chip>
        {CATEGORIES.map(({ value, label, icon: Icon }) => (
          <Chip key={value} active={filters.category === value} onClick={() => onChange({ category: filters.category === value ? '' : value })}>
            <Icon className="size-3.5" aria-hidden /> {label}
          </Chip>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="grid gap-3 rounded-2xl border border-ink-800 bg-ink-900/60 shadow-card p-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <label className="label text-xs">Location</label>
                <Input icon={MapPin} placeholder="e.g. Library, Canteen" value={filters.location || ''} onChange={(e) => onChange({ location: e.target.value })} />
              </div>
              <div>
                <label className="label text-xs">From</label>
                <Input type="date" value={filters.from || ''} onChange={(e) => onChange({ from: e.target.value })} />
              </div>
              <div>
                <label className="label text-xs">To</label>
                <Input type="date" value={filters.to || ''} onChange={(e) => onChange({ to: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                <div>
                  <label className="label text-xs">Sort</label>
                  <Select value={filters.sort || 'newest'} onChange={(e) => onChange({ sort: e.target.value })}>
                    <option value="newest">Newest reports</option>
                    <option value="date">Most recent date</option>
                    <option value="oldest">Oldest reports</option>
                  </Select>
                </div>
                {showStatus && (
                  <div>
                    <label className="label text-xs">Status</label>
                    <Select value={filters.status || 'active'} onChange={(e) => onChange({ status: e.target.value })}>
                      <option value="active">Open + contacted</option>
                      <option value="open">Open only</option>
                      <option value="resolved">Resolved</option>
                      <option value="all">Everything</option>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {anyActive && (
        <button type="button" onClick={clear} className="inline-flex items-center gap-1 text-sm text-ink-400 hover:text-ink-100">
          <X className="size-3.5" aria-hidden /> Clear all filters
        </button>
      )}
    </div>
  );
}

function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors ${
        active ? 'border-zap bg-zap text-night' : 'border-ink-700 bg-ink-900 text-ink-200 hover:border-ink-500'
      }`}
    >
      {children}
    </button>
  );
}
