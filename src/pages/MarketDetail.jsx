import { useParams, useNavigate } from 'react-router';
import { useState } from 'react';
import { useMarket } from '../hooks/useMarket';
import { usePredictions } from '../hooks/usePredictions';
import { useDispute } from '../hooks/useDispute';
import { useAuthStore } from '../stores/authStore';
import { CategoryTag } from '../components/ui/CategoryTag';
import { MarketStatus } from '../components/market/MarketStatus';
import { PriceChart } from '../components/market/PriceChart';
import { PredictionForm } from '../components/market/PredictionForm';
import { SellForm } from '../components/market/SellForm';
import { PageSkeleton } from '../components/ui/Skeleton';
import { formatTimeRemaining, formatCoins, formatDateTime, pluralize, formatSource } from '../lib/format';
import styles from './MarketDetail.module.css';

export default function MarketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, isError, error, refetch } = useMarket(id);
  const { data: userPredictions, isLoading: predsLoading } = usePredictions({ marketId: id });
  const { reason, setReason, submitDispute, isSubmitting, isSuccess: disputeSuccess, error: disputeError, reset: resetDispute } = useDispute(id);
  const [showDisputeForm, setShowDisputeForm] = useState(false);

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

  const pendingPredictions = userPredictions?.filter((p) => p.result === 'pending') || [];
  const hasPredicted = pendingPredictions.length > 0;

  const handlePredictionSuccess = () => {
    refetch();
  };

  const renderRightColumn = () => {
    switch (market.status) {
      case 'open':
        return <PredictionForm market={market} onSuccess={handlePredictionSuccess} />;
      case 'closed':
        return (
          <div className={`card ${styles.sideCard}`}>
            <h3 className={styles.sideTitle}>Market Closed</h3>
            <p className="text-muted text-sm">
              Market closed. Awaiting resolution.
            </p>
          </div>
        );
      case 'resolved': {
        const disputeDeadline = market.dispute_deadline ? new Date(market.dispute_deadline) : null;
        const withinDisputeWindow = disputeDeadline && new Date() < disputeDeadline;

        return (
          <div className={`card ${styles.sideCard}`}>
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

            {withinDisputeWindow && !disputeSuccess && (
              <div className={styles.disputeSection}>
                <p className={styles.disputeDeadline}>
                  Dispute window closes in {formatTimeRemaining(market.dispute_deadline)}
                </p>
                {!showDisputeForm ? (
                  <button
                    className={styles.disputeBtn}
                    onClick={() => setShowDisputeForm(true)}
                  >
                    Dispute this resolution
                  </button>
                ) : (
                  <div className={styles.disputeForm}>
                    <textarea
                      className={styles.disputeInput}
                      placeholder="Why is this resolution wrong? (min 10 characters)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                    />
                    {disputeError && (
                      <p className={styles.disputeError}>{disputeError.message}</p>
                    )}
                    <div className={styles.disputeActions}>
                      <button
                        className={styles.disputeSubmitBtn}
                        onClick={() => submitDispute()}
                        disabled={isSubmitting || reason.length < 10}
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
                      </button>
                      <button
                        className={styles.disputeCancelBtn}
                        onClick={() => { setShowDisputeForm(false); resetDispute(); setReason(''); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {disputeSuccess && (
              <div className={styles.disputeSuccess}>
                Dispute submitted. {withinDisputeWindow ? 'Others can still dispute.' : ''}
              </div>
            )}

            {!withinDisputeWindow && disputeDeadline && !disputeSuccess && (
              <p className="text-xs text-muted" style={{ marginTop: 'var(--space-3)' }}>
                Dispute window has expired.
              </p>
            )}
          </div>
        );
      }
      case 'review':
        return (
          <div className={`card ${styles.sideCard}`}>
            <h3 className={styles.sideTitle}>Under Review</h3>
            <p className="text-muted text-sm">
              This market is under review due to disputes.
            </p>
          </div>
        );
      default:
        return (
          <div className={`card ${styles.sideCard}`}>
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
          {formatSource(market.source)}
        </span>
        <span className={styles.time}>{formatTimeRemaining(market.closes_at)}</span>
        <span className={styles.stat}>{pluralize(market.participant_count || 0, 'player')}</span>
      </div>

      {hasPredicted && (
        <div className={styles.youPredicted}>
          You predicted{' '}
          <strong className={pendingPredictions[0].position === 'yes' ? 'text-yes' : 'text-no'}>
            {pendingPredictions[0].position.toUpperCase()}
          </strong>
          {' — '}
          {pendingPredictions[0].shares.toFixed(1)} shares @{' '}
          {Math.round(pendingPredictions[0].entry_price * 100)}c
        </div>
      )}

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
                <span className={styles.statValue}>{formatSource(market.source)}</span>
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
                    {pluralize(yesPlayers, 'player')} ({yesPct}%)
                  </span>
                </div>
                <div className={styles.distRow}>
                  <span className="text-no font-mono">NO</span>
                  <span className="text-secondary text-sm">
                    {pluralize(noPlayers, 'player')} ({noPct}%)
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
        {predsLoading ? (
          <p className="text-muted text-sm">Loading positions...</p>
        ) : pendingPredictions.length === 0 ? (
          <p className="text-muted text-sm">
            {user ? 'You have no active positions on this market.' : 'Log in to place predictions.'}
          </p>
        ) : (
          <div className={styles.positionsList}>
            {pendingPredictions.map((pred) => (
              <SellForm key={pred.id} prediction={pred} market={market} />
            ))}
          </div>
        )}
      </section>

      <section className={`card ${styles.section}`}>
        <h3 className={styles.sectionTitle}>Participant Activity</h3>
        <p className="text-muted text-sm">Recent participant activity will appear here.</p>
      </section>
    </div>
  );
}