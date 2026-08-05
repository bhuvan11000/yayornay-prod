import { useState } from 'react';
import { useMarkets } from '../hooks/useMarkets';
import { MarketCard } from '../components/market/MarketCard';
import { CategoryTag } from '../components/ui/CategoryTag';
import { Skeleton } from '../components/ui/Skeleton';

const CATEGORIES = ['All', 'Sports', 'Tech', 'Pop Culture', 'Politics', 'Memes'];
const CATEGORY_MAP = {
  'All': null,
  'Sports': 'sports',
  'Tech': 'tech',
  'Pop Culture': 'popculture',
  'Politics': 'politics',
  'Memes': 'memes',
};
const STATUS_OPTIONS = ['open', 'closed', 'resolved'];
const SORT_OPTIONS = [
  { value: 'created_at', label: 'Newest' },
  { value: 'volume', label: 'Most Active' },
  { value: 'closes_at', label: 'Closing Soon' },
];

const SELECT_CLASS =
  'cursor-pointer rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-3 py-2 font-heading text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-primary)] transition-colors duration-150 hover:border-[var(--text-muted)] focus:border-[var(--border-focus)] focus:outline-none';

export default function Markets() {
  const [category, setCategory] = useState(null);
  const [status, setStatus] = useState('open');
  const [sort, setSort] = useState('created_at');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch, isFetching } = useMarkets({
    category,
    status,
    sort,
    page,
  });

  const markets = data?.markets || [];
  const count = data?.count || 0;
  const totalPages = Math.ceil(count / 20);
  const hasMore = page < totalPages;

  const handleCategoryClick = (cat) => {
    setCategory(CATEGORY_MAP[cat]);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
    setPage(1);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5">
      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">The board</p>
          <h1 className="mt-1 font-heading text-[28px] font-bold uppercase leading-none tracking-[0.04em] text-[var(--text-primary)]">
            Markets
          </h1>
        </div>
        {!isLoading && (
          <span className="pb-1 font-mono text-xs text-[var(--text-secondary)]">
            {count} {status === 'open' ? 'live' : status} market{count !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Category board ── */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => {
          const active = category === CATEGORY_MAP[cat];
          return (
            <button
              key={cat}
              className={`cursor-pointer rounded-[3px] border px-3 py-1.5 font-heading text-xs font-semibold uppercase tracking-[0.1em] transition-all duration-150 ${
                active
                  ? 'border-[var(--accent-amber)] bg-[var(--accent-amber-muted)] text-[var(--accent-amber)] shadow-[var(--shadow-sm)]'
                  : 'border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              onClick={() => handleCategoryClick(cat)}
            >
              {cat === 'All' ? 'All' : <CategoryTag category={CATEGORY_MAP[cat]} />}
            </button>
          );
        })}
      </div>

      {/* ── Status + sort ── */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-col gap-1">
          <label className="eyebrow">Status</label>
          <select className={`${SELECT_CLASS} min-w-[140px]`} value={status} onChange={handleStatusChange}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="eyebrow">Sort by</label>
          <select className={`${SELECT_CLASS} min-w-[140px]`} value={sort} onChange={handleSortChange}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Board grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
          <p className="text-[var(--text-secondary)]">Failed to load the board</p>
          <p className="text-sm text-[var(--text-muted)]">{error?.message}</p>
          <button className="btn-primary" onClick={() => refetch()} style={{ marginTop: 'var(--space-4)' }}>
            Retry
          </button>
        </div>
      ) : markets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
          <div className="font-heading text-4xl font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
            Empty board
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            {status === 'open'
              ? 'No open markets right now. Check back at 08:00 UTC or try a different category.'
              : `No ${status} markets match your filters.`}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {markets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center py-4">
              <button
                className="btn-primary"
                onClick={() => setPage((p) => p + 1)}
                disabled={isFetching}
              >
                {isFetching ? 'Loading…' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
