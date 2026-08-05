import { useNavigate } from 'react-router';
import { CategoryTag } from '../ui/CategoryTag';
import { MarketStatus } from './MarketStatus';
import { PriceBar } from './PriceBar';
import { RankBadge } from '../gamification/RankBadge';
import { formatTimeRemaining, formatCoins, pluralize, formatSource } from '../../lib/format';
import SpotlightCard from '../reactbits/SpotlightCard/SpotlightCard';

/**
 * MarketCard — one cell of the arena board.
 * Condensed-caps eyebrow, title, and the two-cell tote price tile.
 */
export function MarketCard({ market }) {
  const navigate = useNavigate();

  const open = () => navigate(`/markets/${market.id}`);

  return (
    <SpotlightCard
      spotlightColor="rgba(245, 165, 36, 0.09)"
      className="group flex h-full cursor-pointer flex-col gap-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 transition-[border-color,box-shadow] duration-150 hover:border-[rgba(34,197,94,0.35)] hover:shadow-[0_0_0_1px_rgba(34,197,94,0.1),0_0_20px_rgba(34,197,94,0.07)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]"
      onClick={open}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') open(); }}
    >
      {/* Eyebrow row */}
      <div className="flex flex-wrap items-center gap-2">
        <CategoryTag category={market.category} />
        <span className="rounded-[3px] bg-[var(--bg-tertiary)] px-1.5 py-[2px] font-heading text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
          {formatSource(market.source)}
        </span>
        <span className="ml-auto font-mono text-[11px] text-[var(--text-muted)]">
          {formatTimeRemaining(market.closes_at)}
        </span>
      </div>

      <h3 className="line-clamp-2 font-heading text-[17px] font-semibold leading-[1.2] text-[var(--text-primary)]">
        {market.title}
      </h3>

      {market.source === 'community' && market.creator_rank && (
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span className="text-xs text-[var(--text-muted)]">by {market.creator_username || 'Unknown'}</span>
          <RankBadge rank={market.creator_rank} size="sm" />
        </div>
      )}

      <PriceBar yesPrice={market.yes_price} noPrice={market.no_price} />

      <div className="mt-auto flex items-center gap-3 text-xs text-[var(--text-secondary)]">
        <span className="font-mono text-[11px]">
          {pluralize(market.participant_count || 0, 'player')}
        </span>
        <span className="font-mono text-[11px]">
          {formatCoins(market.volume || 0)} vol
        </span>
        <span className="ml-auto">
          <MarketStatus status={market.status} />
        </span>
      </div>
    </SpotlightCard>
  );
}
