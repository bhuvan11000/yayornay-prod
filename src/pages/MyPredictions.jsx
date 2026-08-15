import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  Clock, AlertTriangle, CheckCircle, XCircle, Minus,
  RefreshCw, Eye, Filter, Trophy,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { usePredictions } from '../hooks/usePredictions';
import { PageSkeleton } from '../components/ui/Skeleton';
import CountUp from '../components/reactbits/CountUp/CountUp';
import { formatCoins, formatTimeRemaining, formatDateTime } from '../lib/format';

const STATUS_GROUP_LABELS = {
  attention: { label: 'Needs Attention', icon: AlertTriangle, color: 'var(--color-warning)' },
  resolved: { label: 'Recently Resolved', icon: Trophy, color: 'var(--color-yes)' },
  active: { label: 'Active Markets', icon: RefreshCw, color: 'var(--accent-amber)' },
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
      case 'closed': return { label: 'Awaiting Resolution', className: 'bg-[rgba(245,158,11,0.15)] text-[var(--color-warning)]' };
      case 'review': return { label: 'Under Review', className: 'bg-[rgba(239,68,68,0.15)] text-[var(--color-no)]' };
      case 'resolving': return { label: 'Resolving...', className: 'bg-[rgba(99,102,241,0.15)] text-[var(--accent-amber)]' };
      case 'resolved': return null;
      case 'open': return { label: 'Open', className: 'bg-[rgba(34,197,94,0.15)] text-[var(--color-yes)]' };
      default: return { label: market.status, className: 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]' };
    }
  })();

  const resultIcon = isWin ? <CheckCircle size={14} className="text-[var(--color-yes)]" />
    : isLoss ? <XCircle size={14} className="text-[var(--color-no)]" />
    : isRefunded ? <RefreshCw size={14} className="text-[var(--text-secondary)]" />
    : <Minus size={14} className="text-[var(--text-muted)]" />;

  return (
    <Link to={`/markets/${prediction.market_id}`} className="flex flex-col items-start justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3 text-inherit no-underline transition-all duration-150 hover:border-[var(--border-focus)] hover:bg-[var(--bg-tertiary)] md:flex-row md:items-start md:gap-3">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-col items-start gap-2 md:flex-row md:items-center">
          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold">{market.title || 'Unknown Market'}</span>
          {statusBadge && (
            <span className={`shrink-0 whitespace-nowrap rounded-[3px] px-[6px] py-[1px] text-[10px] font-semibold ${statusBadge.className}`}>{statusBadge.label}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-[var(--radius-sm)] px-[5px] py-[1px] text-[10px] font-bold ${prediction.position === 'yes' ? 'bg-[var(--color-yes-muted)] text-[var(--color-yes)]' : 'bg-[var(--color-no-muted)] text-[var(--color-no)]'}`}>
            {prediction.position?.toUpperCase()}
          </span>
          {prediction.entry_price != null && (
            <span className="text-xs text-[var(--text-muted)]">@ {prediction.entry_price.toFixed(3)}</span>
          )}
          {prediction.shares != null && (
            <span className="text-xs text-[var(--text-muted)]">{prediction.shares.toFixed(1)} shares</span>
          )}
          <span className="text-xs text-[var(--text-muted)]">{formatCoins(prediction.coins_spent)} coins</span>
          <span className="text-xs text-[var(--text-muted)]">{formatDateTime(prediction.created_at)}</span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1 text-xs font-semibold md:flex-row md:items-center">
        {market.status === 'closed' && (
          <span className="flex items-center gap-1 text-[var(--color-warning)]" title={market.closes_at ? `Closed ${formatDateTime(market.closes_at)}` : ''}>
            <Clock size={14} /> Awaiting resolution
          </span>
        )}
        {market.status === 'review' && (
          <span className="flex items-center gap-1 text-[var(--color-no)]">
            <AlertTriangle size={14} /> Under review
          </span>
        )}
        {market.status === 'open' && (
          <span className="flex items-center gap-1 text-[var(--text-muted)]">
            {resultIcon} Pending
          </span>
        )}
        {(isWin || isLoss) && (
          <span className={isWin ? 'flex items-center gap-1 text-[var(--color-yes)]' : 'flex items-center gap-1 text-[var(--color-no)]'}>
            {resultIcon}
            {isWin ? (
              <>Won +<CountUp to={profit} from={0} duration={0.8} separator="," /></>
            ) : (
              `Lost -${formatCoins(prediction.coins_spent)}`
            )}
          </span>
        )}
        {isRefunded && (
          <span className="flex items-center gap-1 text-[var(--text-secondary)]">
            {resultIcon} Refunded
          </span>
        )}
        {isPending && market.status !== 'open' && market.status !== 'closed' && market.status !== 'review' && (
          <span className="flex items-center gap-1 text-[var(--text-muted)]">
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
      <div className="mx-auto max-w-[800px] py-6 px-4">
        <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
          <p className="text-muted">Failed to load your predictions.</p>
          <button className="btn-primary btn-sm" onClick={() => refetch()}>Retry</button>
        </div>
      </div>
    );
  }

  const hasAny = Object.values(groups).some(g => g.length > 0);

  return (
    <div className="mx-auto max-w-[800px] py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-heading">My Predictions</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Track your active markets, pending resolutions, and recent results</p>
      </div>

      {/* Summary cards */}
      <div className="mb-5 grid grid-cols-3 gap-2 md:gap-3">
        <Link to="?filter=attention" className={`relative flex flex-col items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3 text-[var(--text-primary)] no-underline transition-all duration-150 hover:-translate-y-px hover:border-[var(--border-focus)] md:p-4 border-l-[3px] border-l-[var(--color-warning)]`} onClick={(e) => { e.preventDefault(); setFilter('attention'); }}>
          <AlertTriangle size={20} />
          <span className="font-mono text-lg font-bold md:text-2xl">{counts.attention}</span>
          <span className="text-xs text-[var(--text-muted)]">Need Attention</span>
        </Link>
        {(filter === 'attention' && counts.attention > 0) && (
          <button className="absolute top-1 right-1 cursor-pointer border-0 bg-transparent text-xs text-[var(--color-warning)]" onClick={() => setFilter('all')}>Clear filter</button>
        )}
        <Link to="?filter=active" className={`flex flex-col items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3 text-[var(--text-primary)] no-underline transition-all duration-150 hover:-translate-y-px hover:border-[var(--border-focus)] md:p-4 border-l-[3px] border-l-[var(--accent-amber)]`} onClick={(e) => { e.preventDefault(); setFilter('active'); }}>
          <RefreshCw size={20} />
          <span className="font-mono text-lg font-bold md:text-2xl">{counts.active}</span>
          <span className="text-xs text-[var(--text-muted)]">Active</span>
        </Link>
        <Link to="?filter=resolved" className={`flex flex-col items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3 text-[var(--text-primary)] no-underline transition-all duration-150 hover:-translate-y-px hover:border-[var(--border-focus)] md:p-4 border-l-[3px] border-l-[var(--color-yes)]`} onClick={(e) => { e.preventDefault(); setFilter('resolved'); }}>
          <Trophy size={20} />
          <span className="font-mono text-lg font-bold md:text-2xl">{counts.resolved}</span>
          <span className="text-xs text-[var(--text-muted)]">Recent Results</span>
        </Link>
      </div>

      {/* Filter bar */}
      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-2">
        <Filter size={14} className="ml-2 text-[var(--text-muted)]" />
        {['all', 'attention', 'active', 'resolved'].map(key => (
          <button
            key={key}
            className={`cursor-pointer rounded-[var(--radius-sm)] border border-transparent bg-transparent px-3 py-1 text-sm font-medium text-[var(--text-muted)] transition-all duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-secondary)] ${filter === key ? 'border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--text-primary)]' : ''}`}
            onClick={() => setFilter(key)}
          >
            {STATUS_GROUP_LABELS[key]?.label || key}
          </button>
        ))}
      </div>

      {/* Prediction groups */}
      <div className="flex flex-col gap-6">
        {hasAny ? visibleGroups.map(([groupKey, groupPredictions]) => {
          if (groupPredictions.length === 0) return null;
          const groupDef = STATUS_GROUP_LABELS[groupKey] || { label: groupKey, icon: Eye, color: 'var(--text-muted)' };
          const Icon = groupDef.icon;

          return (
            <div key={groupKey} className="flex flex-col">
              <div className="mb-3 flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
                <Icon size={16} style={{ color: groupDef.color }} />
                <h2 className="font-heading text-base font-semibold">{groupDef.label}</h2>
                <span className="rounded-[3px] bg-[var(--bg-tertiary)] px-2 py-[2px] font-mono text-xs text-[var(--text-muted)]">{groupPredictions.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {groupPredictions.map(p => (
                  <PredictionRow key={p.id} prediction={p} />
                ))}
              </div>
            </div>
          );
        }) : (
          <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <Eye size={40} className="opacity-40 text-[var(--text-muted)]" />
            <h2 className="text-lg font-heading">No predictions yet</h2>
            <p className="text-muted">Start predicting on markets to track them here.</p>
            <Link to="/markets" className="btn-primary">Browse Markets</Link>
          </div>
        )}
      </div>
    </div>
  );
}
