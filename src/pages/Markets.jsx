import { useState } from 'react';
import { useMarkets } from '../hooks/useMarkets';
import { MarketCard } from '../components/market/MarketCard';
import { CategoryTag } from '../components/ui/CategoryTag';
import { Skeleton } from '../components/ui/Skeleton';
import BlurText from '../components/reactbits/BlurText/BlurText';

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
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading">Markets</h1>
        {!isLoading && (
          <span className="font-mono text-sm text-[var(--text-secondary)]">{count} market{count !== 1 ? 's' : ''}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`cursor-pointer rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-transparent px-3.5 py-1 transition-all duration-150 hover:border-[var(--accent-blue)] ${category === CATEGORY_MAP[cat] ? 'border-[var(--accent-blue)] bg-[var(--accent-blue-muted)]' : ''}`}
            onClick={() => handleCategoryClick(cat)}
          >
            {cat === 'All' ? 'All' : <CategoryTag category={CATEGORY_MAP[cat]} />}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-muted)]">Status</label>
          <select className="min-w-[140px] cursor-pointer rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none" value={status} onChange={handleStatusChange}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-muted)]">Sort by</label>
          <select className="min-w-[140px] cursor-pointer rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none" value={sort} onChange={handleSortChange}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
          <p className="text-secondary">Failed to load markets</p>
          <p className="text-muted text-sm">{error?.message}</p>
          <button className="btn-primary" onClick={() => refetch()} style={{ marginTop: 'var(--space-4)' }}>
            Retry
          </button>
        </div>
      ) : markets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
          <div className="text-5xl opacity-50">📊</div>
          <BlurText
            text="No markets found"
            delay={100}
            animateBy="words"
            direction="top"
            className="font-heading text-lg text-[var(--text-secondary)]"
          />
          <p className="text-muted text-sm">
            {status === 'open'
              ? 'No open markets right now. Check back soon or try a different category.'
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
                {isFetching ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
