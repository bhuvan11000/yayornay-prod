import { useNavigate } from 'react-router';
import { CategoryTag } from '../ui/CategoryTag';
import { MarketStatus } from './MarketStatus';
import { PriceBar } from './PriceBar';
import { RankBadge } from '../gamification/RankBadge';
import { formatTimeRemaining, formatCoins, pluralize, formatSource } from '../../lib/format';
import SpotlightCard from '../reactbits/SpotlightCard/SpotlightCard';
import styles from './MarketCard.module.css';

export function MarketCard({ market }) {
  const navigate = useNavigate();

  const open = () => navigate(`/markets/${market.id}`);

  return (
    <SpotlightCard
      spotlightColor="rgba(79, 125, 245, 0.18)"
      className={styles.card}
      onClick={open}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') open(); }}
    >
      <h3 className={styles.title}>{market.title}</h3>

      <div className={styles.meta}>
        <CategoryTag category={market.category} />
        <span className={styles.source}>
          {formatSource(market.source)}
        </span>
        <span className={styles.time}>{formatTimeRemaining(market.closes_at)}</span>
      </div>

      {market.source === 'community' && market.creator_rank && (
        <div className={styles.creator}>
          <span className={styles.creatorLabel}>by {market.creator_username || 'Unknown'}</span>
          <RankBadge rank={market.creator_rank} size="sm" />
        </div>
      )}

      <PriceBar yesPrice={market.yes_price} noPrice={market.no_price} />

      <div className={styles.footer}>
        <span className={styles.stat}>
          {pluralize(market.participant_count || 0, 'player')}
        </span>
        <span className={styles.stat}>
          {formatCoins(market.volume || 0)} vol
        </span>
        <MarketStatus status={market.status} />
      </div>
    </SpotlightCard>
  );
}
