import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  Clock, AlertTriangle, CheckCircle, XCircle, Minus,
  RefreshCw, Eye, Filter, Trophy,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { usePredictions } from '../hooks/usePredictions';
import { PageSkeleton } from '../components/ui/Skeleton';
import { formatCoins, formatTimeRemaining, formatDateTime } from '../lib/format';
import styles from './MyPredictions.module.css';

const STATUS_GROUP_LABELS = {
  attention: { label: 'Needs Attention', icon: AlertTriangle, color: 'var(--color-warning)' },
  resolved: { label: 'Recently Resolved', icon: Trophy, color: 'var(--color-yes)' },
  active: { label: 'Active Markets', icon: RefreshCw, color: 'var(--color-info)' },
  other: { label: 'Past Predictions', icon: Eye, color: 'var(--text-muted)' },
};

function groupPredictions(predictions) {
  const groups = { attention: [], resolved: [], active: [], other: [] };

  for (const p of predictions || []) {
    const status = p.market?.status;

    if (status === 'closed' || status === 'review' || status === 'resolving') {
      groups.attention.push(p);
    } else if (status === 'resolved') {
      // Show only recent resolutions (within 3 days)
      const resolvedAt = p.market?.resolved_at ? new Date(p.market.resolved_at) : null;
      const isRecent = resolvedAt && (Date.now() - resolvedAt.getTime()) < 3 * 86400000;
      if (isRecent) {
        groups.resolved.push(p);
      } else {
        groups.other.push(p);
      }
    } else if (status === 'open') {
      groups.active.push(p);
    } else {
      groups.other.push(p);
    }
  }

  return groups;
}

function PredictionRow({ prediction }) {
  const market = prediction.market || {};
  const isWin = prediction.result === 'won';
  const isLoss = prediction.result === 'lost';
  const isPending = prediction.result === 'pending';
  const isRefunded = prediction.result === 'refunded';
  const profit = isWin ? (prediction.payout || 0) - (prediction.coins_spent || 0)
    : isLoss ? -(prediction.coins_spent || 0)
    : 0;

  const statusBadge = (() => {
    switch (market.status) {
      case 'closed': return { label: 'Awaiting Resolution', className: styles.badgeClosed };
      case 'review': return { label: 'Under Review', className: styles.badgeReview };
      case 'resolving': return { label: 'Resolving...', className: styles.badgeResolving };
      case 'resolved': return null;
      case 'open': return { label: 'Open', className: styles.badgeOpen };
      default: return { label: market.status, className: styles.badgeOther };
    }
  })();

  const resultIcon = isWin ? <CheckCircle size={14} className={styles.iconWon} />
    : isLoss ? <XCircle size={14} className={styles.iconLost} />
    : isRefunded ? <RefreshCw size={14} className={styles.iconRefunded} />
    : <Minus size={14} className={styles.iconPending} />;

  return (
    <Link to={`/markets/${prediction.market_id}`} className={styles.row}>
      <div className={styles.rowLeft}>
        <div className={styles.titleRow}>
          <span className={styles.title}>{market.title || 'Unknown Market'}</span>
          {statusBadge && (
            <span className={`${styles.badge} ${statusBadge.className}`}>{statusBadge.label}</span>
          )}
        </div>
        <div className={styles.metaRow}>
          <span className={`${styles.position} ${prediction.position === 'yes' ? styles.posYes : styles.posNo}`}>
            {prediction.position?.toUpperCase()}
          </span>
          {prediction.entry_price != null && (
            <span className={styles.meta}>@ {prediction.entry_price.toFixed(3)}</span>
          )}
          {prediction.shares != null && (
            <span className={styles.meta}>{prediction.shares.toFixed(1)} shares</span>
          )}
          <span className={styles.meta}>{formatCoins(prediction.coins_spent)} coins</span>
          <span className={styles.meta}>{formatDateTime(prediction.created_at)}</span>
        </div>
      </div>

      <div className={styles.rowRight}>
        {market.status === 'closed' && (
          <span className={styles.awaitsText} title={market.closes_at ? `Closed ${formatDateTime(market.closes_at)}` : ''}>
            <Clock size={14} /> Awaiting resolution
          </span>
        )}
        {market.status === 'review' && (
          <span className={styles.reviewText}>
            <AlertTriangle size={14} /> Under review
          </span>
        )}
        {market.status === 'open' && (
          <span className={styles.resultPending}>
            {resultIcon} Pending
          </span>
        )}
        {(isWin || isLoss) && (
          <span className={isWin ? styles.resultWon : styles.resultLost}>
            {resultIcon}
            {isWin ? `Won +${formatCoins(profit)}` : `Lost -${formatCoins(prediction.coins_spent)}`}
          </span>
        )}
        {isRefunded && (
          <span className={styles.resultRefunded}>
            {resultIcon} Refunded
          </span>
        )}
        {isPending && market.status !== 'open' && market.status !== 'closed' && market.status !== 'review' && (
          <span className={styles.resultPending}>
            {resultIcon} Pending
          </span>
        )}
      </div>
    </Link>
  );
}

export default function MyPredictions() {
  const user = useAuthStore(s => s.user);
  const { data: predictions, isLoading, isError, refetch } = usePredictions();
  const [filter, setFilter] = useState('all'); // 'all' | 'attention' | 'active' | 'resolved'

  const groups = useMemo(() => groupPredictions(predictions), [predictions]);

  const visibleGroups = useMemo(() => {
    if (filter === 'all') return Object.entries(groups);
    return Object.entries(groups).filter(([key]) => key === filter);
  }, [groups, filter]);

  // Count items per group
  const counts = useMemo(() => ({
    attention: groups.attention.length,
    active: groups.active.length,
    resolved: groups.resolved.length,
  }), [groups]);

  if (isLoading) return <PageSkeleton />;

  if (isError) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <p className="text-muted">Failed to load your predictions.</p>
          <button className="btn-primary btn-sm" onClick={() => refetch()}>Retry</button>
        </div>
      </div>
    );
  }

  const hasAny = Object.values(groups).some(g => g.length > 0);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className="text-2xl font-heading">My Predictions</h1>
        <p className={styles.subtitle}>Track your active markets, pending resolutions, and recent results</p>
      </div>

      {/* Summary cards */}
      <div className={styles.summaryGrid}>
        <Link to="?filter=attention" className={`${styles.summaryCard} ${styles.cardAttention}`} onClick={(e) => { e.preventDefault(); setFilter('attention'); }}>
          <AlertTriangle size={20} />
          <span className={styles.summaryCount}>{counts.attention}</span>
          <span className={styles.summaryLabel}>Need Attention</span>
        </Link>
        {(filter === 'attention' && counts.attention > 0) && (
          <button className={styles.clearFilter} onClick={() => setFilter('all')}>Clear filter</button>
        )}
        <Link to="?filter=active" className={`${styles.summaryCard} ${styles.cardActive}`} onClick={(e) => { e.preventDefault(); setFilter('active'); }}>
          <RefreshCw size={20} />
          <span className={styles.summaryCount}>{counts.active}</span>
          <span className={styles.summaryLabel}>Active</span>
        </Link>
        <Link to="?filter=resolved" className={`${styles.summaryCard} ${styles.cardResolved}`} onClick={(e) => { e.preventDefault(); setFilter('resolved'); }}>
          <Trophy size={20} />
          <span className={styles.summaryCount}>{counts.resolved}</span>
          <span className={styles.summaryLabel}>Recent Results</span>
        </Link>
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <Filter size={14} className={styles.filterIcon} />
        {['all', 'attention', 'active', 'resolved'].map(key => (
          <button
            key={key}
            className={`${styles.filterBtn} ${filter === key ? styles.filterActive : ''}`}
            onClick={() => setFilter(key)}
          >
            {STATUS_GROUP_LABELS[key]?.label || key}
          </button>
        ))}
      </div>

      {/* Prediction groups */}
      <div className={styles.groups}>
        {hasAny ? visibleGroups.map(([groupKey, groupPredictions]) => {
          if (groupPredictions.length === 0) return null;
          const groupDef = STATUS_GROUP_LABELS[groupKey] || { label: groupKey, icon: Eye, color: 'var(--text-muted)' };
          const Icon = groupDef.icon;

          return (
            <div key={groupKey} className={styles.group}>
              <div className={styles.groupHeader}>
                <Icon size={16} style={{ color: groupDef.color }} />
                <h2 className={styles.groupTitle}>{groupDef.label}</h2>
                <span className={styles.groupCount}>{groupPredictions.length}</span>
              </div>
              <div className={styles.list}>
                {groupPredictions.map(p => (
                  <PredictionRow key={p.id} prediction={p} />
                ))}
              </div>
            </div>
          );
        }) : (
          <div className={styles.emptyState}>
            <Eye size={40} className={styles.emptyIcon} />
            <h2 className="text-lg font-heading">No predictions yet</h2>
            <p className="text-muted">Start predicting on markets to track them here.</p>
            <Link to="/markets" className="btn-primary">Browse Markets</Link>
          </div>
        )}
      </div>
    </div>
  );
}
