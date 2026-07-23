import { useState } from 'react';
import { useMarkets } from '../hooks/useMarkets';
import { MarketCard } from '../components/market/MarketCard';
import { CategoryTag } from '../components/ui/CategoryTag';
import { Skeleton } from '../components/ui/Skeleton';
import styles from './Markets.module.css';

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
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className="text-2xl font-heading">Markets</h1>
        {!isLoading && (
          <span className={styles.count}>{count} market{count !== 1 ? 's' : ''}</span>
        )}
      </div>

      <div className={styles.categoryBar}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`${styles.categoryPill} ${category === CATEGORY_MAP[cat] ? styles.activeCategory : ''}`}
            onClick={() => handleCategoryClick(cat)}
          >
            {cat === 'All' ? 'All' : <CategoryTag category={CATEGORY_MAP[cat]} />}
          </button>
        ))}
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Status</label>
          <select className={styles.select} value={status} onChange={handleStatusChange}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Sort by</label>
          <select className={styles.select} value={sort} onChange={handleSortChange}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      ) : isError ? (
        <div className={styles.state}>
          <p className="text-secondary">Failed to load markets</p>
          <p className="text-muted text-sm">{error?.message}</p>
          <button className="btn-primary" onClick={() => refetch()} style={{ marginTop: 'var(--space-4)' }}>
            Retry
          </button>
        </div>
      ) : markets.length === 0 ? (
        <div className={styles.state}>
          <div className={styles.emptyIcon}>📊</div>
          <p className="text-secondary">No markets found</p>
          <p className="text-muted text-sm">
            {status === 'open'
              ? 'No open markets right now. Check back soon or try a different category.'
              : `No ${status} markets match your filters.`}
          </p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {markets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>

          {hasMore && (
            <div className={styles.loadMore}>
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