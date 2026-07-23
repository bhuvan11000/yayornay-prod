import { Link } from 'react-router';
import { useMarkets } from '../hooks/useMarkets';
import { MarketCard } from '../components/market/MarketCard';
import { Skeleton } from '../components/ui/Skeleton';
import styles from './Home.module.css';

export default function Home() {
  const { data, isLoading, isError } = useMarkets({
    status: 'open',
    sort: 'volume',
    limit: 6,
    page: 1,
  });

  const trendingMarkets = data?.markets || [];

  return (
    <div className={styles.home}>
      <div className={styles.header}>
        <h1 className="text-2xl font-heading">Dashboard</h1>
      </div>

      <div className="card">
        <p className="text-secondary">Daily reward status — coming soon</p>
      </div>

      <div className="card">
        <p className="text-secondary">Season progress — coming soon</p>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-xl font-heading">Trending Markets</h2>
          <Link to="/markets" className={styles.viewAll}>
            View All &rarr;
          </Link>
        </div>

        {isLoading ? (
          <div className={styles.trendingGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-muted text-sm">Failed to load trending markets.</p>
        ) : trendingMarkets.length === 0 ? (
          <p className="text-muted text-sm">No trending markets right now. Check back soon.</p>
        ) : (
          <div className={styles.trendingRow}>
            {trendingMarkets.map((market) => (
              <div key={market.id} className={styles.trendingCard}>
                <MarketCard market={market} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className="text-xl font-heading">Your Active Predictions</h2>
        <p className="text-muted text-sm">Your active predictions will appear here once you place predictions.</p>
      </section>
    </div>
  );
}