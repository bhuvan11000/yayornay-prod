import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { CategoryTag } from '../ui/CategoryTag';
import { MarketStatus } from './MarketStatus';
import { PriceBar } from './PriceBar';
import { RankBadge } from '../gamification/RankBadge';
import { formatTimeRemaining, formatCoins, pluralize, formatSource } from '../../lib/format';
import styles from './MarketCard.module.css';

export function MarketCard({ market }) {
  const navigate = useNavigate();

  return (
    <motion.article
      className={styles.card}
      onClick={() => navigate(`/markets/${market.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/markets/${market.id}`); }}
      whileHover={{ scale: 1.02, boxShadow: '0 8px 25px rgba(0,0,0,0.3)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
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
    </motion.article>
  );
}
