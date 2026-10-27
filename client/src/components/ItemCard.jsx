import { ArrowRight, Calendar, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { categoryInfo } from '../utils/constants';
import { formatItemDate, ticketCode } from '../utils/format';
import { imgUrl } from '../utils/image';
import { StatusBadge, TypeBadge } from './ui/Badges';
import { Skeleton } from './ui/Feedback';

// Styled like a lost-property claim ticket: photo on top, perforated tear line,
// stub with the details.
export function ItemCard({ item, index = 0 }) {
  const cat = categoryInfo(item.category);
  const CatIcon = cat.icon;
  const cta = item.isOwner ? 'Manage' : item.type === 'lost' ? 'I found this' : 'This is mine';
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.35 }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <Link
        to={`/items/${item.id}`}
        className="block overflow-hidden rounded-3xl border border-ink-800 bg-ink-900 shadow-card transition-[border-color,box-shadow] duration-300 hover:border-ink-600 hover:shadow-card-hover focus-visible:border-zap"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
          {item.images[0] ? (
            <img
              src={imgUrl(item.images[0], 600)}
              alt={item.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="bg-dots grid size-full place-items-center">
              <CatIcon className={`size-14 ${item.type === 'lost' ? 'text-grape-fg/70' : 'text-zap-fg/70'}`} strokeWidth={1.25} aria-hidden />
            </div>
          )}
          <div className="absolute inset-x-3 top-3 flex items-start justify-between">
            <TypeBadge type={item.type} />
            <StatusBadge status={item.status} className="bg-ink-950/60" />
          </div>
        </div>

        {/* perforated tear line with ticket notches */}
        <div className="relative h-0 border-t-2 border-dashed border-ink-700">
          <span className="absolute -top-3 -left-3 size-6 rounded-full border border-ink-800 bg-ink-950" />
          <span className="absolute -top-3 -right-3 size-6 rounded-full border border-ink-800 bg-ink-950" />
        </div>

        <div className="p-4 pt-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="eyebrow truncate">{cat.label}</span>
            <span className="font-mono text-[11px] text-ink-500">{ticketCode(item.id)}</span>
          </div>
          <h3 className="mt-1 line-clamp-1 text-lg font-bold text-ink-50">{item.title}</h3>
          <div className="mt-2 flex flex-col gap-1 text-sm text-ink-300">
            <span className="flex items-center gap-1.5 truncate">
              <MapPin className="size-3.5 shrink-0 text-ink-500" aria-hidden />
              <span className="truncate">{item.location}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5 shrink-0 text-ink-500" aria-hidden />
              {item.type === 'lost' ? 'Lost' : 'Found'} {formatItemDate(item.date)}
            </span>
          </div>
          <div className={`mt-3 flex items-center justify-between text-sm font-semibold ${item.type === 'lost' ? 'text-grape-fg' : 'text-zap-fg'}`}>
            <span>{item.status === 'resolved' ? 'View case' : cta}</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-ink-800 bg-ink-900 shadow-card">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  );
}

export function ItemGrid({ items, loading, skeletons = 8, className = '' }) {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 ${className}`}>
      {loading
        ? Array.from({ length: skeletons }, (_, i) => <ItemCardSkeleton key={i} />)
        : items.map((item, i) => <ItemCard key={item.id} item={item} index={i} />)}
    </div>
  );
}
