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
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from '../components/ui/alert-dialog';
import { formatTimeRemaining, formatCoins, formatDateTime, pluralize, formatSource } from '../lib/format';

const PANEL = 'rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5';

export default function MarketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, isError, error, refetch } = useMarket(id);
  const { data: userPredictions, isLoading: predsLoading } = usePredictions({ marketId: id });
  const { reason, setReason, submitDispute, isSubmitting, isSuccess: disputeSuccess, error: disputeError, reset: resetDispute, hasDisputed } = useDispute(id);
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  if (isLoading) return <PageSkeleton />;

  if (isError) {
    return (
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 p-4 md:p-6">
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
          <p className="text-[var(--text-secondary)]">Failed to load market</p>
          <p className="text-sm text-[var(--text-muted)]">{error?.message}</p>
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
        return <PredictionForm market={market} onSuccess={handlePredictionSuccess} pendingPredictions={pendingPredictions} />;
      case 'closed':
        return (
          <div className={`${PANEL} flex flex-col gap-3`}>
            <h3 className="font-heading text-lg font-bold uppercase tracking-[0.06em]">Market Closed</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Market closed. Awaiting resolution.
            </p>
          </div>
        );
      case 'resolved': {
        const disputeDeadline = market.dispute_deadline ? new Date(market.dispute_deadline) : null;
        const withinDisputeWindow = disputeDeadline && new Date() < disputeDeadline;
        const won = market.resolution === 'yes';

        return (
          <div className={`${PANEL} flex flex-col gap-3`}>
            <h3 className="font-heading text-lg font-bold uppercase tracking-[0.06em]">Final Result</h3>
            <div className="flex justify-center p-4">
              <span
                className={`inline-flex items-center gap-2 rounded-[4px] border-2 px-8 py-4 font-heading text-3xl font-bold uppercase tracking-[0.12em] ${
                  won
                    ? 'border-[var(--color-yes-border)] bg-[var(--color-yes-muted)] text-[var(--color-yes)]'
                    : 'border-[var(--color-no-border)] bg-[var(--color-no-muted)] text-[var(--color-no)]'
                }`}
              >
                {market.resolution?.toUpperCase()}
              </span>
            </div>
            {market.resolution_source && (
              <p className="text-xs text-[var(--text-muted)]" style={{ marginTop: 'var(--space-2)' }}>
                Source: {market.resolution_source}
              </p>
            )}

            {withinDisputeWindow && !hasDisputed && !disputeSuccess && (
              <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-4">
                <p className="font-mono text-xs text-[var(--color-warning)]">
                  Dispute window closes in {formatTimeRemaining(market.dispute_deadline)}
                </p>
                <AlertDialog open={showDisputeForm} onOpenChange={setShowDisputeForm}>
                  <AlertDialogTrigger asChild>
                    <button
                      className="w-full cursor-pointer rounded-[3px] bg-[var(--color-no-muted)] px-4 py-2.5 font-heading text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-no)] transition-colors hover:bg-[rgba(239,68,68,0.2)]"
                      onClick={() => setShowDisputeForm(true)}
                    >
                      Dispute this resolution
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Dispute this resolution</AlertDialogTitle>
                      <AlertDialogDescription>
                        Why is this resolution wrong? Submitting a dispute sends it to review.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <textarea
                      className="min-h-[84px] w-full resize-y rounded-[3px] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                      placeholder="Explain why this resolution is wrong (min 10 characters)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                    />
                    {disputeError && (
                      <p className="text-xs text-[var(--color-no)]">{disputeError.message}</p>
                    )}
                    <div className="flex gap-2">
                      <AlertDialogCancel
                        onClick={() => { setShowDisputeForm(false); resetDispute(); setReason(''); }}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => submitDispute()}
                        disabled={isSubmitting || reason.length < 10}
                        className="bg-[var(--accent-amber)] text-[var(--primary-foreground)] hover:bg-[var(--accent-amber-hover)]"
                      >
                        {isSubmitting ? 'Submitting…' : 'Submit Dispute'}
                      </AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {disputeSuccess && (
              <div className="mt-3 rounded-[var(--radius-sm)] border border-[var(--color-yes-border)] bg-[var(--color-yes-muted)] px-4 py-3 text-sm font-medium text-[var(--color-yes)]">
                Dispute submitted. {withinDisputeWindow ? 'Others can still dispute.' : ''}
              </div>
            )}

            {!withinDisputeWindow && disputeDeadline && !hasDisputed && (
              <p className="text-xs text-[var(--text-muted)]" style={{ marginTop: 'var(--space-3)' }}>
                Dispute window has expired.
              </p>
            )}

            {hasDisputed && !disputeSuccess && (
              <p className="text-xs" style={{ marginTop: 'var(--space-3)', color: 'var(--color-warning)' }}>
                You already disputed this resolution.
              </p>
            )}
          </div>
        );
      }
      case 'review':
        return (
          <div className={`${PANEL} flex flex-col gap-3`}>
            <h3 className="font-heading text-lg font-bold uppercase tracking-[0.06em]">Under Review</h3>
            <p className="text-sm text-[var(--text-muted)]">
              This market is under review due to disputes.
            </p>
          </div>
        );
      default:
        return (
          <div className={`${PANEL} flex flex-col gap-3`}>
            <MarketStatus status={market.status} />
          </div>
        );
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5">
      <button
        className="inline-flex w-fit cursor-pointer items-center gap-1 border-0 bg-transparent p-0 font-heading text-xs font-semibold uppercase tracking-[0.1em] text-[var(--accent-amber)] transition-colors duration-150 hover:text-[var(--accent-amber-hover)]"
        onClick={() => navigate('/markets')}
      >
        ← Back to Markets
      </button>

      <div>
        <h1 className="font-heading text-[26px] font-bold leading-[1.1] tracking-[0.02em] text-[var(--text-primary)] md:text-[30px]">
          {market.title}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <CategoryTag category={market.category} />
          <span className="rounded-[3px] bg-[var(--bg-tertiary)] px-1.5 py-[2px] font-heading text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
            {formatSource(market.source)}
          </span>
          <span className="font-mono text-xs text-[var(--text-muted)]">{formatTimeRemaining(market.closes_at)}</span>
          <span className="font-mono text-xs text-[var(--text-secondary)]">{pluralize(market.participant_count || 0, 'player')}</span>
        </div>
      </div>

      {hasPredicted && (
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--accent-amber)] bg-[var(--accent-amber-muted)] px-4 py-3 text-sm text-[var(--text-primary)]">
          <span>
            You hold{' '}
            <strong className={pendingPredictions[0].position === 'yes' ? 'text-yes' : 'text-no'}>
              {pendingPredictions[0].position.toUpperCase()}
            </strong>
            {' — '}
            <span className="font-mono">{pendingPredictions[0].shares.toFixed(1)} shares @ {Math.round(pendingPredictions[0].entry_price * 100)}c</span>
          </span>
          <span className="eyebrow hidden md:block">In play</span>
        </div>
      )}

      <div className="flex flex-col gap-5 md:flex-row">
        <div className="flex min-w-0 flex-col gap-5 md:flex-[3]">
          <PriceChart
            priceHistory={priceHistory}
            yesPrice={market.yes_price}
            noPrice={market.no_price}
          />

          {market.resolution_criteria && (
            <section className={`${PANEL} flex flex-col gap-3`}>
              <h3 className="font-heading text-base font-bold uppercase tracking-[0.08em] text-[var(--text-primary)]">Resolution Criteria</h3>
              <p className="text-sm text-[var(--text-secondary)]">{market.resolution_criteria}</p>
            </section>
          )}

          <section className={`${PANEL} flex flex-col gap-3`}>
            <h3 className="font-heading text-base font-bold uppercase tracking-[0.08em] text-[var(--text-primary)]">Market Stats</h3>
            <div className="divide-y divide-[var(--border-subtle)] overflow-hidden rounded-[3px] border border-[var(--border-subtle)]">
              {[
                ['Volume', `${formatCoins(market.volume || 0)} coins`],
                ['Players', market.participant_count || 0],
                ['Source', formatSource(market.source)],
                ['Opens', formatDateTime(market.opens_at)],
                ['Closes', formatDateTime(market.closes_at)],
                market.resolved_at ? ['Resolved', formatDateTime(market.resolved_at)] : null,
              ]
                .filter(Boolean)
                .map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="eyebrow">{label}</span>
                    <span className="font-mono text-sm text-[var(--text-primary)]">{value}</span>
                  </div>
                ))}
            </div>
          </section>

          {totalPlayers > 0 && (
            <section className={`${PANEL} flex flex-col gap-3`}>
              <h3 className="font-heading text-base font-bold uppercase tracking-[0.08em] text-[var(--text-primary)]">Prediction Distribution</h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-[3px] border border-[var(--color-yes-border)] bg-[var(--color-yes-muted)] px-3 py-2">
                  <span className="font-heading text-xs font-bold uppercase tracking-[0.12em] text-yes">Yes</span>
                  <span className="font-mono text-sm text-[var(--text-secondary)]">
                    {pluralize(yesPlayers, 'player')} ({yesPct}%)
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-[3px] border border-[var(--color-no-border)] bg-[var(--color-no-muted)] px-3 py-2">
                  <span className="font-heading text-xs font-bold uppercase tracking-[0.12em] text-no">No</span>
                  <span className="font-mono text-sm text-[var(--text-secondary)]">
                    {pluralize(noPlayers, 'player')} ({noPct}%)
                  </span>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="md:min-w-[300px] md:flex-[2]">
          {renderRightColumn()}
        </div>
      </div>

      <section className={`${PANEL} flex flex-col gap-3`}>
        <h3 className="font-heading text-base font-bold uppercase tracking-[0.08em] text-[var(--text-primary)]">Your Positions</h3>
        {predsLoading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading positions…</p>
        ) : pendingPredictions.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            {user ? 'You have no active positions on this market.' : 'Log in to place predictions.'}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {pendingPredictions.map((pred) => (
              <SellForm key={pred.id} prediction={pred} market={market} />
            ))}
          </div>
        )}
      </section>

      <section className={`${PANEL} flex flex-col gap-3`}>
        <h3 className="font-heading text-base font-bold uppercase tracking-[0.08em] text-[var(--text-primary)]">Participant Activity</h3>
        <p className="text-sm text-[var(--text-muted)]">Recent participant activity will appear here.</p>
      </section>
    </div>
  );
}
