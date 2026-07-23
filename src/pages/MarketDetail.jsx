import { useParams, useNavigate } from 'react-router';
import { useMarket } from '../hooks/useMarket';
import { CategoryTag } from '../components/ui/CategoryTag';
import { MarketStatus } from '../components/market/MarketStatus';
import { PriceChart } from '../components/market/PriceChart';
import { PageSkeleton } from '../components/ui/Skeleton';
import { formatTimeRemaining, formatCoins, formatDate, formatDateTime, pluralize } from '../lib/format';
import styles from './MarketDetail.module.css';

export default function MarketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useMarket(id);

  if (isLoading) return <PageSkeleton />;

  if (isError) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <p className="text-secondary">Failed to load market</p>
          <p className="text-muted text-sm">{error?.message}</p>
          <button className="btn-primary" onClick={() => navigate('/markets')} style={{ marginTop: 'var(--space-4)' }}>
            Back to Markets
          </button>
        </div>
      </div>
    );
  }

  const { market, priceHistory, distribution } = data;
  const yesDist = distribution?.find((d) => d.position === 'yes');
  const noDist = distribution?.find((d) => d.position === 'no');
  const yesPlayers = yesDist?.count || 0;
  const noPlayers = noDist?.count || 0;
  const yesPct = yesDist?.percentage || 0;
  const noPct = noDist?.percentage || 0;
  const totalPlayers = (yesDist?.count || 0) + (noDist?.count || 0);

  const renderRightColumn = () => {
    switch (market.status) {
      case 'open':
        return (
          <div className={`${styles.sideCard} card`}>
            <h3 className={styles.sideTitle}>Place Prediction</h3>
            <p className="text-muted text-sm">
              Prediction form coming in Session 5
            </p>
          </div>
        );
      case 'closed':
        return (
          <div className={`${styles.sideCard} card`}>
            <h3 className={styles.sideTitle}>Market Closed</h3>
            <p className="text-muted text-sm">
              Market closed. Awaiting resolution.
            </p>
          </div>
        );
      case 'resolved':
        return (
          <div className={`${styles.sideCard} card`}>
            <h3 className={styles.sideTitle}>Resolved</h3>
            <div className={styles.resolutionBadge}>
              <span className={market.resolution === 'yes' ? styles.resolvedYes : styles.resolvedNo}>
                {market.resolution?.toUpperCase()}
              </span>
            </div>
            {market.resolution_source && (
              <p className="text-xs text-muted" style={{ marginTop: 'var(--space-2)' }}>
                Source: {market.resolution_source}
              </p>
            )}
          </div>
        );
      case 'review':
        return (
          <div className={`${styles.sideCard} card`}>
            <h3 className={styles.sideTitle}>Under Review</h3>
            <p className="text-muted text-sm">
              This market is under review due to disputes.
            </p>
          </div>
        );
      default:
        return (
          <div className={`${styles.sideCard} card`}>
            <MarketStatus status={market.status} />
          </div>
        );
    }
  };

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate('/markets')}>
        ← Back to Markets
      </button>

      <h1 className={`${styles.title} text-2xl font-heading`}>{market.title}</h1>

      <div className={styles.metaRow}>
        <CategoryTag category={market.category} />
        <span className={styles.source}>
          {market.source === 'ai' ? 'AI' : 'Community'}
        </span>
        <span className={styles.time}>{formatTimeRemaining(market.closes_at)}</span>
        <span className={styles.stat}>{pluralize(market.participant_count || 0, 'player')}</span>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.leftCol}>
          <PriceChart
            priceHistory={priceHistory}
            yesPrice={market.yes_price}
            noPrice={market.no_price}
          />

          {market.resolution_criteria && (
            <section className={`card ${styles.section}`}>
              <h3 className={styles.sectionTitle}>Resolution Criteria</h3>
              <p className="text-sm text-secondary">{market.resolution_criteria}</p>
            </section>
          )}

          <section className={`card ${styles.section}`}>
            <h3 className={styles.sectionTitle}>Market Stats</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Volume</span>
                <span className={styles.statValue}>{formatCoins(market.volume || 0)} coins</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Players</span>
                <span className={styles.statValue}>{market.participant_count || 0}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Source</span>
                <span className={styles.statValue}>{market.source === 'ai' ? 'AI (Gemini)' : 'Community'}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Opens</span>
                <span className={styles.statValue}>{formatDateTime(market.opens_at)}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Closes</span>
                <span className={styles.statValue}>{formatDateTime(market.closes_at)}</span>
              </div>
              {market.resolved_at && (
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Resolved</span>
                  <span className={styles.statValue}>{formatDateTime(market.resolved_at)}</span>
                </div>
              )}
            </div>
          </section>

          {totalPlayers > 0 && (
            <section className={`card ${styles.section}`}>
              <h3 className={styles.sectionTitle}>Prediction Distribution</h3>
              <div className={styles.distribution}>
                <div className={styles.distRow}>
                  <span className="text-yes font-mono">YES</span>
                  <span className="text-secondary text-sm">
                    {pluralize(yesPlayers || 0, 'player')} ({yesPct}%)
                  </span>
                </div>
                <div className={styles.distRow}>
                  <span className="text-no font-mono">NO</span>
                  <span className="text-secondary text-sm">
                    {pluralize(noPlayers || 0, 'player')} ({noPct}%)
                  </span>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className={styles.rightCol}>
          {renderRightColumn()}
        </div>
      </div>

      <section className={`card ${styles.section}`}>
        <h3 className={styles.sectionTitle}>Your Positions</h3>
        <p className="text-muted text-sm">Your positions will appear here once you place predictions.</p>
      </section>

      <section className={`card ${styles.section}`}>
        <h3 className={styles.sectionTitle}>Participant Activity</h3>
        <p className="text-muted text-sm">Recent participant activity will appear here.</p>
      </section>
    </div>
  );
}