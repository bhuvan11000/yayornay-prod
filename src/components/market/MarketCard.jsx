import { useNavigate } from 'react-router';
import { CategoryTag } from '../ui/CategoryTag';
import { MarketStatus } from './MarketStatus';
import { PriceBar } from './PriceBar';
import { formatTimeRemaining, formatCoins, pluralize } from '../../lib/format';
import styles from './MarketCard.module.css';

export function MarketCard({ market }) {
  const navigate = useNavigate();

  return (
    <article
      className={styles.card}
      onClick={() => navigate(`/markets/${market.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/markets/${market.id}`); }}
    >
      <h3 className={styles.title}>{market.title}</h3>

      <div className={styles.meta}>
        <CategoryTag category={market.category} />
        <span className={styles.source}>
          {market.source === 'ai' ? 'AI' : 'Community'}
        </span>
        <span className={styles.time}>{formatTimeRemaining(market.closes_at)}</span>
      </div>

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
    </article>
  );
}