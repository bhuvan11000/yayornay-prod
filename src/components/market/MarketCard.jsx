import { useNavigate } from 'react-router';
import { CategoryTag } from '../ui/CategoryTag';
import { MarketStatus } from './MarketStatus';
import { PriceBar } from './PriceBar';
import { RankBadge } from '../gamification/RankBadge';
import { formatTimeRemaining, formatCoins, pluralize, formatSource } from '../../lib/format';
import SpotlightCard from '../reactbits/SpotlightCard/SpotlightCard';

export function MarketCard({ market }) {
  const navigate = useNavigate();

  const open = () => navigate(`/markets/${market.id}`);

  return (
    <SpotlightCard
      spotlightColor="rgba(79, 125, 245, 0.18)"
      className="flex cursor-pointer flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-[var(--space-5)] transition-[border-color,box-shadow] duration-[var(--transition-fast)] hover:border-[var(--accent-blue)] hover:shadow-[0_0_0_1px_rgba(79,125,245,0.15),0_0_20px_rgba(79,125,245,0.1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]"
      onClick={open}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') open(); }}
    >
      <h3 className="line-clamp-2 font-heading text-lg font-semibold leading-[1.3] text-[var(--text-primary)]">{market.title}</h3>

      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
        <CategoryTag category={market.category} />
        <span className="rounded-[var(--radius-full)] bg-[var(--bg-tertiary)] px-2 py-[3px] text-xs font-semibold uppercase text-[var(--text-secondary)]">
          {formatSource(market.source)}
        </span>
        <span className="ml-auto font-mono text-xs text-[var(--text-muted)]">{formatTimeRemaining(market.closes_at)}</span>
      </div>

      {market.source === 'community' && market.creator_rank && (
        <div className="flex items-center gap-[var(--space-2)] text-xs text-[var(--text-muted)]">
          <span className="text-xs text-[var(--text-muted)]">by {market.creator_username || 'Unknown'}</span>
          <RankBadge rank={market.creator_rank} size="sm" />
        </div>
      )}

      <PriceBar yesPrice={market.yes_price} noPrice={market.no_price} />

      <div className="flex items-center gap-[var(--space-3)] text-xs text-[var(--text-secondary)]">
        <span className="font-mono text-xs">
          {pluralize(market.participant_count || 0, 'player')}
        </span>
        <span className="font-mono text-xs">
          {formatCoins(market.volume || 0)} vol
        </span>
        <MarketStatus status={market.status} />
      </div>
    </SpotlightCard>
  );
}
